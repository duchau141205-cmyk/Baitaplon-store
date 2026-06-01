const express = require('express');
const router = express.Router();
const {
    createProduct,
    updateProduct,
    deleteProduct
} = require('../controllers/productController');
const { protect, admin } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Admin only routes for products
// Route: /api/admin/products

router.post('/', protect, admin, upload.single('image'), createProduct);

router
    .route('/:id')
    .put(protect, admin, upload.single('image'), updateProduct)
    .delete(protect, admin, deleteProduct);

module.exports = router;
