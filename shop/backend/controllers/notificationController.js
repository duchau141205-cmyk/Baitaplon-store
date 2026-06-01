const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ user: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50); // limit to last 50 notifications
        res.json(notifications);
    } catch (error) {
        console.error('Lỗi khi lấy thông báo:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi lấy thông báo' });
    }
};

// @desc    Mark a notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const readNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ message: 'Không tìm thấy thông báo' });
        }

        // Verify ownership
        if (notification.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Không có quyền chỉnh sửa thông báo này' });
        }

        notification.isRead = true;
        const updatedNotification = await notification.save();
        res.json(updatedNotification);
    } catch (error) {
        console.error('Lỗi khi đọc thông báo:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật thông báo' });
    }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const readAllNotifications = async (req, res) => {
    try {
        await Notification.updateMany(
            { user: req.user._id, isRead: false },
            { $set: { isRead: true } }
        );
        res.json({ message: 'Đã đánh dấu đọc tất cả thông báo' });
    } catch (error) {
        console.error('Lỗi khi đọc tất cả thông báo:', error);
        res.status(500).json({ message: 'Lỗi hệ thống khi cập nhật tất cả thông báo' });
    }
};

// Helper function to create notification internally
const createNotificationHelper = async (userId, title, message, type, relatedId = '') => {
    try {
        const notification = new Notification({
            user: userId,
            title,
            message,
            type,
            relatedId
        });
        await notification.save();
        return true;
    } catch (error) {
        console.error('Lỗi khi tạo thông báo nội bộ:', error);
        return false;
    }
};

module.exports = {
    getNotifications,
    readNotification,
    readAllNotifications,
    createNotificationHelper
};
