const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const { updateUserProfile, updateUserPassword } = require('../controllers/userController');

router.route('/profile')
    .put(protect, updateUserProfile);

router.route('/password')
    .put(protect, updateUserPassword);

module.exports = router;
