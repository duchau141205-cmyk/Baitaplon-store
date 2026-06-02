const express = require('express');
const router = express.Router();
const { getUsers, blockUser, adminResetPassword, updateUserByAdmin } = require('../controllers/userController');
const { protect, admin } = require('../middleware/auth');

router.get('/', protect, admin, getUsers);
router.put('/:id', protect, admin, updateUserByAdmin);
router.put('/:id/block', protect, admin, blockUser);
router.put('/:id/reset-password', protect, admin, adminResetPassword);

module.exports = router;
