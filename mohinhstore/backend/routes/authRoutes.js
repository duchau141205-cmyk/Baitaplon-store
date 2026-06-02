const express = require('express');
const router = express.Router();
const { register, login, adminLogin, getMe, forgotPassword } = require('../controllers/authController');
const { updateUserPassword } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/admin/login', adminLogin);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);
router.put('/password', protect, updateUserPassword);

module.exports = router;
