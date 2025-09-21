const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Trip = require('../models/Trip');
const User = require('../models/User');
const { protect, optionalAuth } = require('../middleware/auth');

// @route   POST /api/trips
// @desc    Create a new trip
// @access  Private
router.post('/', protect, [
    body('title').notEmpty().withMessage('Title is required'),
    body('route.start').notEmpty().withMessage('Start location is required'),
    body('route.destination').notEmpty().withMessage('Destination is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        // Create trip with user ID
        const tripData = {
            ...req.body,
            userId: req.user._id
        };

        const trip = await Trip.create(tripData);

        // Update user stats
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { 'stats.tripsCreated': 1 }
        });

        res.status(201).json({
            success: true,
            trip
        });
    } catch (error) {
        console.error('Create trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating trip'
        });
    }
});

// @route   GET /api/trips
// @desc    Get user's trips
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            sort = '-createdAt',
            privacy,
            isDraft
        } = req.query;

        const query = { userId: req.user._id };

        if (privacy) query.privacy = privacy;
        if (isDraft !== undefined) query.isDraft = isDraft === 'true';

        const trips = await Trip.find(query)
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-__v');

        const count = await Trip.countDocuments(query);

        res.json({
            success: true,
            trips,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalTrips: count
        });
    } catch (error) {
        console.error('Get trips error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching trips'
        });
    }
});

// @route   GET /api/trips/shared/:shareId
// @desc    Get a shared trip by share ID
// @access  Public (with restrictions based on privacy)
router.get('/shared/:shareId', optionalAuth, async (req, res) => {
    try {
        const trip = await Trip.findOne({ shareId: req.params.shareId })
            .populate('userId', 'username profile.displayName profile.avatar');

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Check privacy settings
        if (trip.privacy === 'private') {
            // Only owner can view private trips
            if (!req.user || trip.userId._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'This trip is private'
                });
            }
        }

        // Increment view count if not the owner
        if (!req.user || trip.userId._id.toString() !== req.user._id.toString()) {
            await trip.incrementViews();
        }

        res.json({
            success: true,
            trip: trip.getPublicData(),
            owner: {
                _id: trip.userId._id,
                username: trip.userId.username,
                displayName: trip.userId.profile.displayName,
                avatar: trip.userId.profile.avatar
            }
        });
    } catch (error) {
        console.error('Get shared trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching trip'
        });
    }
});

// @route   PUT /api/trips/:id
// @desc    Update a trip
// @access  Private (owner only)
router.put('/:id', protect, async (req, res) => {
    try {
        const trip = await Trip.findOne({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found or unauthorized'
            });
        }

        // Update allowed fields
        const allowedUpdates = [
            'title', 'description', 'route', 'agentType',
            'budget', 'images', 'tags', 'privacy', 'isDraft',
            'itinerary', 'hotels', 'restaurants'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                trip[field] = req.body[field];
            }
        });

        // Update metadata
        trip.metadata.lastModifiedBy = req.user._id;
        trip.metadata.version += 1;

        await trip.save();

        res.json({
            success: true,
            trip
        });
    } catch (error) {
        console.error('Update trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating trip'
        });
    }
});

// @route   DELETE /api/trips/:id
// @desc    Delete a trip
// @access  Private (owner only)
router.delete('/:id', protect, async (req, res) => {
    try {
        const trip = await Trip.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id
        });

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found or unauthorized'
            });
        }

        // Update user stats
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { 'stats.tripsCreated': -1 }
        });

        res.json({
            success: true,
            message: 'Trip deleted successfully'
        });
    } catch (error) {
        console.error('Delete trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting trip'
        });
    }
});

// @route   POST /api/trips/:id/save
// @desc    Save/bookmark a trip
// @access  Private
router.post('/:id/save', protect, async (req, res) => {
    try {
        const trip = await Trip.findById(req.params.id);

        if (!trip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Check if already saved (would need a SavedTrips collection)
        // For now, just increment the save count
        trip.stats.saves += 1;
        await trip.save();

        // Update user stats
        await User.findByIdAndUpdate(req.user._id, {
            $inc: { 'stats.tripsSaved': 1 }
        });

        res.json({
            success: true,
            message: 'Trip saved successfully'
        });
    } catch (error) {
        console.error('Save trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Error saving trip'
        });
    }
});

// @route   GET /api/trips/explore
// @desc    Get public trips for exploration
// @access  Public
router.get('/explore', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 12,
            sort = '-createdAt',
            agentType,
            tags,
            search
        } = req.query;

        const query = {
            privacy: 'public',
            isDraft: false
        };

        if (agentType) query.agentType = agentType;
        if (tags) query.tags = { $in: tags.split(',') };
        if (search) {
            query.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { 'route.start': { $regex: search, $options: 'i' } },
                { 'route.destination': { $regex: search, $options: 'i' } }
            ];
        }

        const trips = await Trip.find(query)
            .populate('userId', 'username profile.displayName profile.avatar')
            .sort(sort)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .select('-__v');

        const count = await Trip.countDocuments(query);

        res.json({
            success: true,
            trips: trips.map(trip => ({
                ...trip.getPublicData(),
                owner: {
                    _id: trip.userId._id,
                    username: trip.userId.username,
                    displayName: trip.userId.profile.displayName,
                    avatar: trip.userId.profile.avatar
                }
            })),
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            totalTrips: count
        });
    } catch (error) {
        console.error('Explore trips error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching trips'
        });
    }
});

// @route   POST /api/trips/:id/duplicate
// @desc    Duplicate a trip for the user
// @access  Private
router.post('/:id/duplicate', protect, async (req, res) => {
    try {
        const originalTrip = await Trip.findById(req.params.id);

        if (!originalTrip) {
            return res.status(404).json({
                success: false,
                message: 'Trip not found'
            });
        }

        // Check if trip is public or owned by user
        if (originalTrip.privacy === 'private' &&
            originalTrip.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Cannot duplicate private trip'
            });
        }

        // Create duplicate with new user
        const duplicateData = originalTrip.toObject();
        delete duplicateData._id;
        delete duplicateData.shareId;
        delete duplicateData.stats;
        delete duplicateData.createdAt;
        delete duplicateData.updatedAt;

        const newTrip = await Trip.create({
            ...duplicateData,
            userId: req.user._id,
            title: `${duplicateData.title} (Copy)`,
            privacy: 'private',
            isDraft: true,
            metadata: {
                ...duplicateData.metadata,
                createdWith: 'duplicate'
            }
        });

        res.status(201).json({
            success: true,
            trip: newTrip,
            message: 'Trip duplicated successfully'
        });
    } catch (error) {
        console.error('Duplicate trip error:', error);
        res.status(500).json({
            success: false,
            message: 'Error duplicating trip'
        });
    }
});

module.exports = router;