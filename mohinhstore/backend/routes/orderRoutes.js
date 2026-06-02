const express = require('express');
const router = express.Router();
const {
    addOrderItems,
    getOrderById,
    getMyOrders,
    cancelOrder
} = require('../controllers/orderController');
const { protect } = require('../middleware/auth');

router.route('/').post(protect, addOrderItems);
router.route('/my-orders').get(protect, getMyOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/cancel').put(protect, cancelOrder);

module.exports = router;
