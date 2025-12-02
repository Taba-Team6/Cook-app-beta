import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import * as foodsafetyAPI from '../utils/foodsafety-api.js';

const router = express.Router();

// ============================================
// PUBLIC: 공용 레시피 목록 조회 (image 컬럼 포함)
// ============================================
router.get('/public', async (req, res) => {
  try {
    // 안전한 limit/offset 변환
    const rawLimit = req.query.limit;
    const rawOffset = req.query.offset;

    // 정수로 강제 변환
    const limitParsed = parseInt(rawLimit, 10);
    const offsetParsed = parseInt(rawOffset, 10);

    // NaN이면 기본값 설정
    const limit = Number.isNaN(limitParsed) ? 50 : limitParsed;
    const offset = Number.isNaN(offsetParsed) ? 0 : offsetParsed;


    const { category, search } = req.query;

    let queryStr = `SELECT id, name, category, cooking_method, hashtags, ingredients_count, image 
                    FROM recipes_light 
                    WHERE (category IS NOT NULL AND category != '')`;
    const params = [];

    if (category && category !== 'all') {
      queryStr += ' AND category = ?';
      params.push(category);
    }

    if (search) {
      queryStr += ' AND name LIKE ?';
      params.push(`%${search}%`);
    }

    queryStr += ` ORDER BY name ASC LIMIT ${limit} OFFSET ${offset}`;

    console.log(`[Public Recipes] Query: ${queryStr}`);
    console.log(`[Public Recipes] Params:`, params);

    const recipes = await query(queryStr, params);

    console.log(`[Public Recipes] Found ${recipes.length} recipes`);

    res.json({
      recipes,
      total: recipes.length,
      limit,
      offset
    });

  } catch (error) {
    console.error('[Public Recipes] Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch recipes',
      details: error.message
    });
  }
});


// ============================================
// DEBUG: 카테고리 분포 확인
// ============================================
router.get('/categories', async (req, res) => {
  try {
    const categories = await query(
      `SELECT category, COUNT(*) as count 
       FROM recipes_light 
       GROUP BY category 
       ORDER BY count DESC`
    );
    
    const total = await query('SELECT COUNT(*) as total FROM recipes_light');
    const nullCount = await query(
      `SELECT COUNT(*) as count FROM recipes_light 
       WHERE category IS NULL OR category = ''`
    );
    
    res.json({
      total: total[0].total,
      null_count: nullCount[0].count,
      categories
    });
  } catch (error) {
    console.error('[Categories] Error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch categories'
    });
  }
});

// ============================================
// PUBLIC: 레시피 상세 정보 (식약처 API 실시간 조회)
// ============================================
router.get('/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`[Recipe Detail] Fetching recipe ${id} from FoodSafety API...`);
    
    // 식약처 API에서 실시간 조회
    const recipe = await foodsafetyAPI.getRecipeDetail(id);
    
    if (!recipe) {
      return res.status(404).json({
        error: 'Recipe not found',
        message: 'Could not find recipe with the given ID'
      });
    }
    
    // MANUAL01~20을 Step Map으로 변환
    const steps = foodsafetyAPI.parseSteps(recipe);
    
    res.json({
      recipe: {
        id: recipe.RCP_SEQ,
        name: recipe.RCP_NM,
        category: recipe.RCP_PAT2,
        cooking_method: recipe.RCP_WAY2,
        calories: recipe.INFO_ENG,
        carbs: recipe.INFO_CAR,
        protein: recipe.INFO_PRO,
        fat: recipe.INFO_FAT,
        sodium: recipe.INFO_NA,
        hashtags: recipe.HASH_TAG,
        image: recipe.ATT_FILE_NO_MAIN,
        ingredients: recipe.RCP_PARTS_DTLS,
        steps
      }
    });
    
  } catch (error) {
    console.error('Get recipe detail error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch recipe details'
    });
  }
});

// ============================================
// ADMIN: 식약처 레시피 크롤링 (수정됨: UPDATE 로직 추가 및 image 포함)
// ============================================
router.post('/crawl', async (req, res) => {
  try {
    console.log('[Recipe Crawl] Starting full crawl from FoodSafety API...');
    
    const recipes = await foodsafetyAPI.crawlAllRecipes();
    
    console.log(`[Recipe Crawl] Processing ${recipes.length} recipes in DB...`);
    
    let inserted = 0;
    let updated = 0;
    
    for (const recipe of recipes) {
      try {
        const lightRecipe = foodsafetyAPI.toLightRecipe(recipe);
        
        // Check if already exists
        const existing = await query(
          'SELECT id FROM recipes_light WHERE id = ?',
          [lightRecipe.id]
        );
        
        if (existing.length > 0) {
          // [수정] 기존 데이터가 존재하면 UPDATE를 수행 (이미지 및 재료 개수 갱신)
          await query(
            `UPDATE recipes_light 
             SET name = ?, category = ?, cooking_method = ?, hashtags = ?, ingredients_count = ?, image = ?
             WHERE id = ?`,
            [
              lightRecipe.name,
              foodsafetyAPI.mapCategory(lightRecipe.category),
              lightRecipe.cooking_method,
              lightRecipe.hashtags,
              lightRecipe.ingredients_count,
              lightRecipe.image, // 대형 이미지 경로
              lightRecipe.id // WHERE 조건
            ]
          );
          updated++;
          continue;
        }
        
        // [수정] 기존 데이터가 없을 경우 INSERT (image 컬럼 추가)
        await query(
          `INSERT INTO recipes_light (id, name, category, cooking_method, hashtags, ingredients_count, image) 
           VALUES (?, ?, ?, ?, ?, ?, ?)`, 
          [
            lightRecipe.id,
            lightRecipe.name,
            foodsafetyAPI.mapCategory(lightRecipe.category),
            lightRecipe.cooking_method,
            lightRecipe.hashtags,
            lightRecipe.ingredients_count,
            lightRecipe.image // image 값 추가
          ]
        );
        
        inserted++;
      } catch (err) {
        console.error(`[Recipe Crawl] Error processing recipe ${recipe.RCP_SEQ}:`, err);
      }
    }
    
    console.log(`[Recipe Crawl] Complete: ${inserted} inserted, ${updated} updated`);
    
    res.json({
      success: true,
      message: 'Recipe crawl completed',
      inserted,
      updated,
      total: recipes.length
    });
    
  } catch (error) {
    console.error('Recipe crawl error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to crawl recipes'
    });
  }
});

// ============================================
// 조리 세션 시작
// ============================================
router.post('/session/start', authenticateToken, async (req, res) => {
  try {
    const { recipe_id, recipe_name } = req.body;
    
    if (!recipe_id || !recipe_name) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Recipe ID and name are required'
      });
    }
    
    const sessionId = uuidv4();
    
    await query(
      `INSERT INTO cooking_sessions (id, user_id, recipe_id, recipe_name, current_step) 
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, req.user.id, recipe_id, recipe_name, 1]
    );
    
    res.status(201).json({
      success: true,
      session_id: sessionId,
      message: 'Cooking session started'
    });
    
  } catch (error) {
    console.error('Start cooking session error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to start cooking session'
    });
  }
});

// ============================================
// 조리 세션 종료
// ============================================
router.put('/session/finish/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, memo } = req.body;
    
    // Get session info
    const sessions = await query(
      'SELECT started_at, recipe_id, recipe_name FROM cooking_sessions WHERE id = ? AND user_id = ?',
      [id, req.user.id]
    );
    
    if (sessions.length === 0) {
      return res.status(404).json({
        error: 'Session not found'
      });
    }
    
    const session = sessions[0];
    const startTime = new Date(session.started_at);
    const endTime = new Date();
    const totalTime = Math.floor((endTime - startTime) / 1000); // seconds
    
    // Update session
    await query(
      `UPDATE cooking_sessions 
       SET finished_at = NOW(), total_time = ?, rating = ?, memo = ? 
       WHERE id = ?`,
      [totalTime, rating || null, memo || null, id]
    );
    
    // Add to history
    await query(
      `INSERT INTO cooking_history (user_id, recipe_id, recipe_name, rating, notes) 
       VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, session.recipe_id, session.recipe_name, rating || null, memo || null]
    );
    
    res.json({
      success: true,
      total_time: totalTime,
      message: 'Cooking session completed'
    });
    
  } catch (error) {
    console.error('Finish cooking session error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to finish cooking session'
    });
  }
});

// ============================================
// 현재 진행 중인 세션 조회
// ============================================
router.get('/session/active', authenticateToken, async (req, res) => {
  try {
    const sessions = await query(
      `SELECT * FROM cooking_sessions 
       WHERE user_id = ? AND finished_at IS NULL 
       ORDER BY started_at DESC 
       LIMIT 1`,
      [req.user.id]
    );
    
    res.json({
      session: sessions.length > 0 ? sessions[0] : null
    });
    
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch active session'
    });
  }
});

// All routes below require authentication
router.use(authenticateToken);

// ============================================
// Get All Saved Recipes
// ============================================
router.get('/', async (req, res) => {
  try {
    const recipes = await query(
      `SELECT id, user_id, recipe_id, name, category, difficulty, cooking_time, 
              image, description, ingredients, steps, saved_at 
       FROM saved_recipes 
       WHERE user_id = ? 
       ORDER BY saved_at DESC`,
      [req.user.id]
    );

    // Parse JSON fields
    recipes.forEach(recipe => {
      if (recipe.ingredients && typeof recipe.ingredients === 'string') {
        recipe.ingredients = JSON.parse(recipe.ingredients);
      }
      if (recipe.steps && typeof recipe.steps === 'string') {
        recipe.steps = JSON.parse(recipe.steps);
      }
    });

    res.json({ recipes });

  } catch (error) {
    console.error('Get saved recipes error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch saved recipes'
    });
  }
});

// ============================================
// Save Recipe
// ============================================
router.post('/', async (req, res) => {
  try {
    const { 
      recipe_id, 
      name, 
      category, 
      difficulty, 
      cooking_time, 
      image, 
      description, 
      ingredients, 
      steps 
    } = req.body;

    // Validation
    if (!recipe_id || !name) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Recipe ID and name are required'
      });
    }

    // Check if already saved
    const existing = await query(
      'SELECT id FROM saved_recipes WHERE user_id = ? AND recipe_id = ?',
      [req.user.id, recipe_id]
    );

    if (existing.length > 0) {
      return res.status(400).json({
        error: 'Recipe already saved',
        message: 'This recipe is already in your saved list'
      });
    }

    const id = uuidv4();

    await query(
      `INSERT INTO saved_recipes 
       (id, user_id, recipe_id, name, category, difficulty, cooking_time, image, description, ingredients, steps) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        req.user.id,
        recipe_id,
        name,
        category || null,
        difficulty || null,
        cooking_time || null,
        image || null,
        description || null,
        ingredients ? JSON.stringify(ingredients) : null,
        steps ? JSON.stringify(steps) : null
      ]
    );

    // Fetch saved recipe
    const recipes = await query(
      'SELECT * FROM saved_recipes WHERE id = ?',
      [id]
    );

    const recipe = recipes[0];
    
    // Parse JSON fields
    if (recipe.ingredients && typeof recipe.ingredients === 'string') {
      recipe.ingredients = JSON.parse(recipe.ingredients);
    }
    if (recipe.steps && typeof recipe.steps === 'string') {
      recipe.steps = JSON.parse(recipe.steps);
    }

    res.status(201).json({
      success: true,
      recipe
    });

  } catch (error) {
    console.error('Save recipe error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to save recipe'
    });
  }
});

// ============================================
// Remove Saved Recipe
// ============================================
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await query(
      'DELETE FROM saved_recipes WHERE (id = ? OR recipe_id = ?) AND user_id = ?',
      [id, id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        error: 'Recipe not found'
      });
    }

    res.json({
      success: true,
      message: 'Recipe removed successfully'
    });

  } catch (error) {
    console.error('Remove recipe error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to remove recipe'
    });
  }
});

// ============================================
// Check if Recipe is Saved
// ============================================
router.get('/check/:recipe_id', async (req, res) => {
  try {
    const { recipe_id } = req.params;

    const recipes = await query(
      'SELECT id FROM saved_recipes WHERE user_id = ? AND recipe_id = ?',
      [req.user.id, recipe_id]
    );

    res.json({
      saved: recipes.length > 0,
      id: recipes.length > 0 ? recipes[0].id : null
    });

  } catch (error) {
    console.error('Check recipe error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to check recipe'
    });
  }
});

// ============================================
// Get Recipes by Category
// ============================================
router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;

    const recipes = await query(
      `SELECT * FROM saved_recipes 
       WHERE user_id = ? AND category = ? 
       ORDER BY saved_at DESC`,
      [req.user.id, category]
    );

    // Parse JSON fields
    recipes.forEach(recipe => {
      if (recipe.ingredients && typeof recipe.ingredients === 'string') {
        recipe.ingredients = JSON.parse(recipe.ingredients);
      }
      if (recipe.steps && typeof recipe.steps === 'string') {
        recipe.steps = JSON.parse(recipe.steps);
      }
    });

    res.json({ recipes });

  } catch (error) {
    console.error('Get recipes by category error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch recipes'
    });
  }
});

// ============================================
// Add to Cooking History
// ============================================
router.post('/history', async (req, res) => {
  try {
    const { recipe_id, recipe_name, rating, notes } = req.body;

    if (!recipe_id || !recipe_name) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Recipe ID and name are required'
      });
    }

    const id = uuidv4();

    await query(
      `INSERT INTO cooking_history (id, user_id, recipe_id, recipe_name, rating, notes) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, req.user.id, recipe_id, recipe_name, rating || null, notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'Added to cooking history'
    });

  } catch (error) {
    console.error('Add cooking history error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to add cooking history'
    });
  }
});

// ============================================
// Get Cooking History
// ============================================
router.get('/history', async (req, res) => {
  try {
    const limit = req.query.limit || 50;

    const history = await query(
      `SELECT * FROM cooking_history 
       WHERE user_id = ? 
       ORDER BY completed_at DESC 
       LIMIT ?`,
      [req.user.id, parseInt(limit)]
    );

    res.json({ history });

  } catch (error) {
    console.error('Get cooking history error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch cooking history'
    });
  }
});

export default router;