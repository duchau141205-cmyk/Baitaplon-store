const express = require('express');
const router = express.Router();
const {
    getOrders,
    updateOrderToDelivered,
    updateOrderStatus,
    deleteOrder,
    updateOrderItems,
    updateOrderCustomer
} = require('../controllers/orderController');
const { getOrderInvoice } = require('../controllers/invoiceController');
const { protect, admin, adminOrStaff } = require('../middleware/auth');

router.route('/')
    .get(protect, adminOrStaff, getOrders);

router.route('/:id/deliver')
    .put(protect, adminOrStaff, updateOrderToDelivered);

router.route('/:id/status')
    .put(protect, adminOrStaff, updateOrderStatus);

router.route('/:id/items')
    .put(protect, adminOrStaff, updateOrderItems);

router.route('/:id/customer')
    .put(protect, adminOrStaff, updateOrderCustomer);

router.route('/:id/invoice')
    .get(protect, adminOrStaff, getOrderInvoice);

router.route('/:id')
    .delete(protect, admin, deleteOrder);

module.exports = router;
