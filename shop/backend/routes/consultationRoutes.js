const express = require('express');
const router = express.Router();
const {
    createConsultation,
    getConsultations,
    updateConsultationStatus,
    updateConsultationDetails,
    deleteConsultation,
    handleSseStream,
    getMyConsultations,
    getConsultationById,
    getConsultationByIdForStaff,
    sendCustomerMessage,
    sendStaffMessage
} = require('../controllers/consultationController');
const { protect, admin } = require('../middleware/auth');

// We will add adminOrStaff in auth.js. For safety, import it destructured.
const { adminOrStaff } = require('../middleware/auth');

// Public SSE stream to receive live notification signals
router.get('/stream', handleSseStream);

// Public route to book appointment
router.post('/', createConsultation);

// Protected routes (Admin/Staff)
router.get('/admin', protect, adminOrStaff, getConsultations);
router.get('/admin/:id', protect, adminOrStaff, getConsultationByIdForStaff);
router.put('/admin/:id', protect, adminOrStaff, updateConsultationDetails);
router.put('/admin/:id/status', protect, adminOrStaff, updateConsultationStatus);
router.post('/admin/:id/messages', protect, adminOrStaff, sendStaffMessage);
router.delete('/admin/:id', protect, admin, deleteConsultation);

// Customer specific consultation routes (protected)
router.get('/my', protect, getMyConsultations);
router.get('/:id', protect, getConsultationById);
router.post('/:id/messages', protect, sendCustomerMessage);

module.exports = router;
