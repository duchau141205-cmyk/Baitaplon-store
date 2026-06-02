const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        default: ''
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['customer', 'admin', 'staff'],
        default: 'customer'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    avatar: {
        type: String,
        default: ''
    },
    points: {
        type: Number,
        default: 0
    },
    rank: {
        type: String,
        enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
        default: 'Bronze'
    }
}, {
    timestamps: true
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
