import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { generateToken } from '../utils/jwt.js';
import { authenticateToken } from '../middleware/auth.js';
import crypto from "crypto";
import { sendVerifyEmail } from "../utils/mailer.js";


const router = express.Router();

// ============================================
// Sign Up
// ============================================
router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validation (기존 그대로)
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email, password, and name are required'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid email format'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Password must be at least 6 characters long'
      });
    }

    // Check existing user
    const existingUser = await query(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        error: 'User already exists',
        message: 'Email is already registered'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = uuidv4();

    // ✅ 이메일 인증 토큰 생성
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 1000 * 60 * 60); // 1시간

    // ✅ 유저 생성 (인증 관련 컬럼 포함)
    await query(
      `INSERT INTO users 
       (id, email, password_hash, name, is_verified, email_verify_token, email_verify_expires)
       VALUES (?, ?, ?, ?, false, ?, ?)`,
      [userId, email, passwordHash, name, verifyToken, expires]
    );

    // ✅ 인증 메일 발송
    const baseUrl = process.env.APP_BASE_URL || 'https://www.cookingmate.site';
    const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${verifyToken}`;

    await sendVerifyEmail(email, verifyUrl);

    // ✅ 프론트에 "인증 필요"만 알려줌
    res.status(201).json({
      success: true,
      needEmailVerification: true,
      message: '이메일로 인증 링크를 보냈습니다. 인증 후 로그인해주세요.'
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create user'
    });
  }
});

// ============================================
// Login
// ============================================
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Email and password are required'
      });
    }

    // Find user
    const users = await query(
      'SELECT id, email, password_hash, name, is_verified FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    const user = users[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // ✅ 이메일 인증 여부 체크
    if (!user.is_verified) {
      return res.status(403).json({
        error: 'Email not verified',
        message: '이메일 인증이 필요합니다'
      });
    }


    // Generate JWT token
    const token = generateToken({
      id: user.id,
      email: user.email,
      name: user.name
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to login'
    });
  }
});

// ============================================
// Get Current User (Protected)
// ============================================
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const users = await query(
      'SELECT id, email, name, allergies, preferences, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    const user = users[0];
    
    // Parse JSON fields
    if (user.allergies) {
      user.allergies = JSON.parse(user.allergies);
    }
    if (user.preferences) {
      user.preferences = JSON.parse(user.preferences);
    }

    res.json({
      user
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get user'
    });
  }
});

// ============================================
// Verify Token (for debugging)
// ============================================
router.get('/verify', authenticateToken, (req, res) => {
  res.json({
    valid: true,
    user: req.user
  });
});

// ============================================
// Verify Email
// ============================================
router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).send('Invalid verification token');
    }

    const users = await query(
      `SELECT id FROM users
       WHERE email_verify_token = ?
         AND email_verify_expires > NOW()
         AND is_verified = false`,
      [token]
    );

    if (users.length === 0) {
      return res.status(400).send('인증 링크가 만료되었거나 잘못되었습니다');
    }

    await query(
      `UPDATE users
       SET is_verified = true,
           email_verify_token = NULL,
           email_verify_expires = NULL
       WHERE id = ?`,
      [users[0].id]
    );

    const fe = process.env.FRONTEND_URL || 'https://www.cookingmate.site';
    res.redirect(`${fe}/email-verified`);

  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).send('Email verification failed');
  }
});


export default router;
