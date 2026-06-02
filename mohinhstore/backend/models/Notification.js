const mongoose = require('mongoose');

const notificationSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    title: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['OrderPlaced', 'OrderCancelled', 'OrderStatusChanged', 'SystemInfo'],
        default: 'SystemInfo'
    },
    isRead: {
        type: Boolean,
        required: true,
        default: false
    },
    relatedId: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification;
