// src/routes/authRoutes.js
const express = require('express');
const { signUp, login } = require('../controllers/authControllers');

const router = express.Router();

router.post('/signup', signUp); //
router.post('/login', login); // 클라이언트에서 토큰 획득을 위해 추가

module.exports = router;