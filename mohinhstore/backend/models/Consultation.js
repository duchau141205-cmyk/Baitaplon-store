const mongoose = require('mongoose');

const consultationSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String
    },
    phone: {
        type: String,
        required: true
    },
    service: {
        type: String,
        required: true,
        default: 'Tư vấn sản phẩm'
    },
    date: {
        type: String
    },
    time: {
        type: String
    },
    notes: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Contacted', 'Confirmed', 'Completed', 'Cancelled'],
        default: 'Pending'
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    messages: [
        {
            sender: {
                type: String,
                enum: ['customer', 'staff'],
                required: true
            },
            senderName: {
                type: String,
                required: true
            },
            content: {
                type: String,
                required: true
            },
            timestamp: {
                type: Date,
                default: Date.now
            }
        }
    ]
}, {
    timestamps: true
});

const Consultation = mongoose.model('Consultation', consultationSchema);
module.exports = Consultation;
