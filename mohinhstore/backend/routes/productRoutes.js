const express = require('express');
const router = express.Router();
const {
    getProducts,
    searchProducts,
    getProductById,
    likeProduct,
    createProductReview,
    getLikedProducts
} = require('../controllers/productController');
const { protect } = require('../middleware/auth');

router.route('/').get(getProducts);
router.get('/search', searchProducts);
router.get('/liked', protect, getLikedProducts);
router.route('/:id').get(getProductById);
router.route('/:id/like').post(protect, likeProduct);
router.route('/:id/reviews').post(protect, createProductReview);

module.exports = router;

