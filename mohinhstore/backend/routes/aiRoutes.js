const express = require('express');
const router = express.Router();
const { getAiResponse } = require('../controllers/aiController');

// Route post request for AI Chat
router.post('/chat', getAiResponse);

module.exports = router;
