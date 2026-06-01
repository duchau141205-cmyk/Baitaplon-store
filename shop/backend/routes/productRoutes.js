const express = require('express');
const router = express.Router();
const {
    getProducts,
    searchProducts,
    getProductById
} = require('../controllers/productController');

router.route('/').get(getProducts);
router.get('/search', searchProducts);
router.route('/:id').get(getProductById);

module.exports = router;
