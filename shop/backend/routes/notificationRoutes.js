const express = require('express');
const router = express.Router();
const {
    getNotifications,
    readNotification,
    readAllNotifications
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.route('/').get(protect, getNotifications);
router.route('/read-all').put(protect, readAllNotifications);
router.route('/:id/read').put(protect, readNotification);

module.exports = router;
