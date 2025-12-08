// routes/completedRecipes.js
import express from 'express';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// ✅ 이 라우트 전체는 로그인 해야만 접근 가능
router.use(authenticateToken);

// 🔧 MySQL DATETIME 형식으로 변환하는 헬퍼
function toMySqlDateTime(value) {
  const d = value ? new Date(value) : new Date();

  if (Number.isNaN(d.getTime())) {
    // 이상한 값이 들어오면 그냥 지금 시간으로
    return new Date();
  }

  // mysql2는 JS Date 객체를 자동으로 'YYYY-MM-DD HH:MM:SS'로 바꿔줌
  return d;
}

// ============================================
// GET /api/completed-recipes
// 완료한 요리 목록 가져오기
// ============================================
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id; // 토큰에서 꺼낸 유저 ID (UUID)

    const rows = await query(
      `SELECT
        id,
        user_id,
        recipe_id,
        name,
        image,
        description,
        category,
        cooking_method,
        hashtags,
        ingredients_json,
        steps_json,
        cooking_time,
        servings,
        difficulty,
        completed_at
       FROM completed_recipes
       WHERE user_id = ?
       ORDER BY completed_at DESC`,
      [userId]
    );

    // rows 그대로 반환 → 프론트(api.ts)가 ingredients_json / steps_json을 파싱
    res.json({ recipes: rows });
  } catch (error) {
    console.error('GET /api/completed-recipes error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to get completed recipes',
    });
  }
});


// ============================================
// POST /api/completed-recipes
// 요리 완료 시 한 건 저장
// ============================================
// routes/completedRecipes.js (POST 부분 수정)
router.post('/', async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      id: recipeId,       // 프론트에서 넘기는 selectedRecipe.id
      name,
      image,
      description,
      category,
      cooking_method,
      hashtags,
      ingredients,
      steps,
      completedAt,
      cookingTime,
      servings,
      difficulty,
    } = req.body;

    console.log('POST /api/completed-recipes body:', req.body);

    if (!recipeId || !name) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'recipe id and name are required',
      });
    }

    // 🔥 여기서 배열 → JSON 문자열로 변환
    const ingredientsJson = JSON.stringify(ingredients ?? []);
    const stepsJson = JSON.stringify(steps ?? []);

    const completedAtValue = toMySqlDateTime(completedAt);

    await query(
      `INSERT INTO completed_recipes (
        user_id,
        recipe_id,
        name,
        image,
        description,
        category,
        cooking_method,
        hashtags,
        ingredients_json,
        steps_json,
        cooking_time,
        servings,
        difficulty,
        completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        recipeId,
        name,
        image ?? null,
        description ?? null,
        category ?? null,
        cooking_method ?? null,
        hashtags ?? null,
        ingredientsJson,           // ✅ 문자열로 저장
        stepsJson,                  // ✅ 문자열로 저장
        cookingTime ?? null,
        servings ?? null,
        difficulty ?? null,
        completedAtValue,
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Completed recipe saved successfully',
    });
  } catch (error) {
    console.error('POST /api/completed-recipes error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to save completed recipe',
      detail: String(error?.message ?? error),
    });
  }
});


export default router;
