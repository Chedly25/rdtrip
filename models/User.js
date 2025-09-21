const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        minlength: 3,
        maxlength: 30,
        lowercase: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },
    profile: {
        displayName: {
            type: String,
            maxlength: 50
        },
        avatar: {
            type: String,
            default: null
        },
        bio: {
            type: String,
            maxlength: 500
        },
        location: String,
        favoriteDestinations: [String],
        travelStyle: [{
            type: String,
            enum: ['adventure', 'culture', 'food', 'nature', 'luxury', 'budget']
        }],
        socialLinks: {
            instagram: String,
            twitter: String,
            website: String
        }
    },
    stats: {
        tripsCreated: {
            type: Number,
            default: 0
        },
        tripsSaved: {
            type: Number,
            default: 0
        },
        followers: {
            type: Number,
            default: 0
        },
        following: {
            type: Number,
            default: 0
        },
        totalDistance: {
            type: Number,
            default: 0
        }
    },
    preferences: {
        emailNotifications: {
            type: Boolean,
            default: true
        },
        publicProfile: {
            type: Boolean,
            default: true
        },
        shareAnalytics: {
            type: Boolean,
            default: false
        }
    },
    emailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    lastActive: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw error;
    }
};

// Update last active
userSchema.methods.updateLastActive = function() {
    this.lastActive = Date.now();
    return this.save();
};

// Get public profile
userSchema.methods.getPublicProfile = function() {
    return {
        _id: this._id,
        username: this.username,
        profile: this.profile,
        stats: this.stats,
        createdAt: this.createdAt
    };
};

module.exports = mongoose.model('User', userSchema);