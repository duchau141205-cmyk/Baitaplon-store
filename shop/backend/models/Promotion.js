const mongoose = require('mongoose');

const promotionSchema = mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    description: {
        type: String,
        default: ''
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percentage', 'amount'],
        default: 'percentage'
    },
    discountValue: {
        type: Number,
        required: true,
        default: 0
    },
    minOrderValue: {
        type: Number,
        default: 0
    },
    maxDiscountValue: {
        type: Number,
        default: 0 // 0 means no limit for percentage discount
    },
    startDate: {
        type: Date,
        default: null
    },
    endDate: {
        type: Date,
        default: null
    },
    usageLimit: {
        type: Number,
        default: 0 // 0 means unlimited usage
    },
    usageCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Promotion = mongoose.model('Promotion', promotionSchema);
module.exports = Promotion;
