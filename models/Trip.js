const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const tripSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    shareId: {
        type: String,
        unique: true,
        default: () => uuidv4().slice(0, 8)
    },
    title: {
        type: String,
        required: true,
        maxlength: 200
    },
    description: {
        type: String,
        maxlength: 1000
    },
    route: {
        start: {
            type: String,
            required: true
        },
        destination: {
            type: String,
            required: true
        },
        waypoints: [{
            city: String,
            country: String,
            description: String,
            activities: [String],
            coordinates: {
                lat: Number,
                lng: Number
            },
            estimatedTime: String,
            order: Number
        }],
        totalDistance: Number,
        estimatedDays: Number,
        estimatedDuration: String
    },
    agentType: {
        type: String,
        enum: ['adventure', 'culture', 'food', 'hidden-gems', 'custom'],
        default: 'custom'
    },
    budget: {
        level: {
            type: String,
            enum: ['budget', 'mid-range', 'luxury'],
            default: 'mid-range'
        },
        estimatedTotal: Number,
        breakdown: {
            accommodation: Number,
            food: Number,
            activities: Number,
            transport: Number
        }
    },
    images: [{
        url: String,
        caption: String,
        isMain: Boolean
    }],
    tags: [String],
    privacy: {
        type: String,
        enum: ['public', 'private', 'unlisted'],
        default: 'private'
    },
    isDraft: {
        type: Boolean,
        default: false
    },
    stats: {
        views: {
            type: Number,
            default: 0
        },
        likes: {
            type: Number,
            default: 0
        },
        saves: {
            type: Number,
            default: 0
        },
        shares: {
            type: Number,
            default: 0
        },
        comments: {
            type: Number,
            default: 0
        }
    },
    itinerary: [{
        day: Number,
        title: String,
        activities: [{
            time: String,
            activity: String,
            location: String,
            duration: String,
            cost: Number,
            tips: String
        }]
    }],
    hotels: [{
        city: String,
        name: String,
        rating: Number,
        price: String,
        url: String,
        description: String
    }],
    restaurants: [{
        city: String,
        name: String,
        cuisine: String,
        rating: Number,
        price: String,
        url: String,
        description: String
    }],
    metadata: {
        createdWith: String,
        lastModifiedBy: String,
        version: {
            type: Number,
            default: 1
        }
    }
}, {
    timestamps: true
});

// Indexes for better performance
tripSchema.index({ userId: 1, createdAt: -1 });
tripSchema.index({ shareId: 1 });
tripSchema.index({ privacy: 1, createdAt: -1 });
tripSchema.index({ tags: 1 });
tripSchema.index({ 'route.start': 1, 'route.destination': 1 });

// Virtual for public URL
tripSchema.virtual('publicUrl').get(function() {
    return `/trip/${this.shareId}`;
});

// Method to increment view count
tripSchema.methods.incrementViews = function() {
    this.stats.views += 1;
    return this.save();
};

// Method to toggle like
tripSchema.methods.toggleLike = function(increment = true) {
    this.stats.likes += increment ? 1 : -1;
    return this.save();
};

// Method to get public data
tripSchema.methods.getPublicData = function() {
    if (this.privacy === 'private') {
        return null;
    }

    return {
        _id: this._id,
        shareId: this.shareId,
        title: this.title,
        description: this.description,
        route: this.route,
        agentType: this.agentType,
        budget: this.budget,
        images: this.images,
        tags: this.tags,
        stats: this.stats,
        itinerary: this.itinerary,
        hotels: this.hotels,
        restaurants: this.restaurants,
        createdAt: this.createdAt,
        publicUrl: this.publicUrl
    };
};

module.exports = mongoose.model('Trip', tripSchema);