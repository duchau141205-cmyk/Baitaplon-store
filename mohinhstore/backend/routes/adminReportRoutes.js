const express = require('express');
const router = express.Router();
const { getSummary, getRevenue, getTopProducts } = require('../controllers/reportController');
const { protect, admin, adminOrStaff } = require('../middleware/auth');

router.get('/summary', protect, adminOrStaff, getSummary);
router.get('/revenue', protect, admin, getRevenue);
router.get('/top-products', protect, adminOrStaff, getTopProducts);

module.exports = router;
