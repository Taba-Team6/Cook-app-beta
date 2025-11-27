// src/routes/profileRoutes.js
const express = require('express');
const { getProfile, updateProfile } = require('../controllers/profileControllers');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// 모든 프로필 관련 경로는 인증이 필요합니다.
router.route('/')
    .get(protect, getProfile) //
    .put(protect, updateProfile); //

module.exports = router;