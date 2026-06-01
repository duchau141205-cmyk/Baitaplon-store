const express = require('express');
const router = express.Router();
const {
    getPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    applyPromotionCode,
    getActivePromotions
} = require('../controllers/promotionController');
const { protect, admin } = require('../middleware/auth');

// Customer path
router.get('/active', getActivePromotions);
router.post('/apply', protect, applyPromotionCode);

// Admin path
router.route('/')
    .get(protect, admin, getPromotions)
    .post(protect, admin, createPromotion);

router.route('/:id')
    .put(protect, admin, updatePromotion)
    .delete(protect, admin, deletePromotion);

module.exports = router;
