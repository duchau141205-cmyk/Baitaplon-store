const mongoose = require('mongoose');

const productSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    images: {
        type: [String],
        default: []
    },
    brand: {
        type: String,
        required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Category'
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    salePrice: {
        type: Number,
        default: 0
    },
    countInStock: {
        type: Number,
        required: true,
        default: 0
    },
    sold: {
        type: Number,
        required: true,
        default: 0
    },
    manufacturer: {
        type: String,
        required: true
    },
    technicalSpecs: {
        type: Map,
        of: String
    }
}, {
    timestamps: true
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;
