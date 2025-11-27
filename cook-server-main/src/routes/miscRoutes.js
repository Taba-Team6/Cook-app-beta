// src/routes/miscRoutes.js
const express = require('express');
const { healthCheck, speechToText, textToSpeech } = require('../controllers/miscControllers');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Health Check는 인증이 필요 없습니다.
router.get('/health', healthCheck); //

// AI 기능은 인증이 필요합니다.
router.post('/ai/voice/stt', protect, speechToText); //
router.post('/ai/voice/tts', protect, textToSpeech); //

module.exports = router;