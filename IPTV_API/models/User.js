const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, 'Username is required'],
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: [true, 'Password is required']
    },
    // rawPassword is saved specifically for client_user subscription accounts so admins/super admins can view & copy credentials for customers
    rawPassword: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        trim: true,
        lowercase: true
    },
    role: {
        type: String,
        enum: ['super_admin', 'admin', 'client_user'],
        default: 'client_user',
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'disabled', 'expired'],
        default: 'active'
    },
    expDate: {
        type: Date,
        default: () => new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // Default 1 year subscription
    },
    maxConnections: {
        type: Number,
        default: 1
    },
    // Category permissions for client users
    allLiveCategories: {
        type: Boolean,
        default: true
    },
    allowedLiveCategories: {
        type: [Number],
        default: []
    },
    allVodCategories: {
        type: Boolean,
        default: true
    },
    allowedVodCategories: {
        type: [Number],
        default: []
    },
    allSeriesCategories: {
        type: Boolean,
        default: true
    },
    allowedSeriesCategories: {
        type: [Number],
        default: []
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdByName: {
        type: String,
        default: 'System'
    },
    notes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: null
    }
});

// Pre-save hook to hash password if modified
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        this.updatedAt = new Date();
        next();
    } catch (err) {
        next(err);
    }
});

// Compare candidate password
userSchema.methods.comparePassword = async function(candidatePassword) {
    if (!candidatePassword) return false;
    // Check with bcrypt if it's hashed
    if (this.password && this.password.startsWith('$2')) {
        return await bcrypt.compare(candidatePassword, this.password);
    }
    // Fallback if plain text or raw password match
    return candidatePassword === this.password || candidatePassword === this.rawPassword;
};

// Return safe user object omitting password
userSchema.methods.toSafeObject = function() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
};

module.exports = mongoose.model('User', userSchema);
