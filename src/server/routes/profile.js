import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// Get User Profile
// ============================================
router.get('/', async (req, res) => {
  try {
    const users = await query(
      'SELECT id, email, name, allergies, preferences, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: 'Profile not found'
      });
    }

    const profile = users[0];
    
    // Parse JSON fields
    if (profile.allergies && typeof profile.allergies === 'string') {
      profile.allergies = JSON.parse(profile.allergies);
    }
    if (profile.preferences && typeof profile.preferences === 'string') {
      profile.preferences = JSON.parse(profile.preferences);
    }

    res.json({ profile });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch profile'
    });
  }
});

// ============================================
// Update User Profile
// ============================================
router.put('/', async (req, res) => {
  try {
    const { name, allergies, preferences } = req.body;

    const updates = [];
    const values = [];

    if (name !== undefined) {
      updates.push('name = ?');
      values.push(name);
    }

    if (allergies !== undefined) {
      updates.push('allergies = ?');
      values.push(JSON.stringify(allergies));
    }

    if (preferences !== undefined) {
      updates.push('preferences = ?');
      values.push(JSON.stringify(preferences));
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'No fields to update'
      });
    }

    values.push(req.user.id);

    await query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = ?`,
      values
    );

    // Fetch updated profile
    const users = await query(
      'SELECT id, email, name, allergies, preferences, created_at, updated_at FROM users WHERE id = ?',
      [req.user.id]
    );

    const profile = users[0];
    
    // Parse JSON fields
    if (profile.allergies && typeof profile.allergies === 'string') {
      profile.allergies = JSON.parse(profile.allergies);
    }
    if (profile.preferences && typeof profile.preferences === 'string') {
      profile.preferences = JSON.parse(profile.preferences);
    }

    res.json({ profile });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update profile'
    });
  }
});

// ============================================
// Get User Statistics
// ============================================
router.get('/stats', async (req, res) => {
  try {
    const stats = await query(
      'SELECT * FROM user_stats WHERE id = ?',
      [req.user.id]
    );

    if (stats.length === 0) {
      return res.json({
        stats: {
          total_ingredients: 0,
          total_saved_recipes: 0,
          total_completed_recipes: 0
        }
      });
    }

    res.json({ stats: stats[0] });

  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch statistics'
    });
  }
});

export default router;
