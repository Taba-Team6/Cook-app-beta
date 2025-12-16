import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/db.js';
import { authenticateToken } from '../middleware/auth.js';
import * as foodsafetyAPI from '../utils/foodsafety-api.js';

const router = express.Router();

// ============================================
// PUBLIC: 공용 레시피 목록 조회 (레시피 리스트 페이지용)
// [수정] recipes_light -> recipes 테이블 사용
// [수정] image 컬럼을 image_large로 변경하여 사용
// ============================================
router.get('/public', async (req, res) => {
  try {
    const rawLimit = req.query.limit;
    const rawOffset = req.query.offset;

    const limitParsed = parseInt(rawLimit, 10);
    const offsetParsed = parseInt(rawOffset, 10);

    const limit = Number.isNaN(limitParsed) ? 50 : limitParsed;
    const offset = Number.isNaN(offsetParsed) ? 0 : offsetParsed;

    const category = req.query.category;
    const search = req.query.search;

    let queryStr = `
      SELECT 
        id,
        name,
        category,
        cooking_method,
        hashtags,
        ingredients_count,
        image_large AS image
      FROM recipes
      WHERE 1=1
    `;

    const params = [];

    // ✅ category 필터
    if (
      category &&
      category !== 'all' &&
      category !== 'undefined' &&
      category.trim() !== ''
    ) {
      queryStr += ' AND TRIM(category) LIKE ?';
      params.push('%' + category.trim() + '%');
    }

    // 🔐 limit / offset 숫자 강제 고정
const safeLimit = Number.isInteger(limit) ? limit : 50;
const safeOffset = Number.isInteger(offset) ? offset : 0;

// ❌ LIMIT / OFFSET 바인딩 제거
queryStr += ` ORDER BY name ASC LIMIT ${safeLimit} OFFSET ${safeOffset}`;

// ⛔ params.push(limit, offset); ← 이 줄 완전히 삭제

console.log('[Public Recipes] Query:', queryStr);
console.log('[Public Recipes] Params:', params);

const recipes = await query(queryStr, params);

console.log(`[Public Recipes] Found ${recipes.length} recipes`);

res.json({
  recipes,
  total: recipes.length,
  limit: safeLimit,
  offset: safeOffset
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
// PUBLIC: 레시피 전체 상세 정보 조회 (DB 크롤링 데이터) - GPT 및 상세 페이지용
// [추가] 레시피 ID 기반으로 DB의 전체 레시피 데이터 조회
// ============================================
router.get('/full/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // DB에서 모든 컬럼을 조회
    const fullRecipeResult = await query(
      `SELECT * FROM recipes WHERE id = ?`,
      [id]
    );

    if (fullRecipeResult.length === 0) {
      return res.status(404).json({
        error: 'Recipe not found',
        message: 'Could not find recipe with the given ID in the database.'
      });
    }

    const recipe = fullRecipeResult[0];

    // MANUAL 필드를 배열로 가공 (프론트엔드 사용 용이성)
    const steps = [];
    for (let i = 1; i <= 20; i++) {
        const stepNum = String(i).padStart(2, '0');
        const manualKey = `manual_${stepNum}`;
        
        const text = recipe[manualKey];
        
        // 빈 값이나 NULL인 경우 스킵
        if (text) {
            steps.push({
                step: steps.length + 1,
                text: text,
                // 이미지 필드는 DB에 저장되지 않았으므로 null로 처리
                image: null 
            });
        }
    }

    // 클라이언트 통합에 용이하도록 객체 재구성
    res.json({
      recipe: {
        id: recipe.id,
        name: recipe.name,
        category: recipe.category,
        cooking_method: recipe.cooking_method,
        image_small: recipe.image_small,
        image_large: recipe.image_large,
        
        // 영양 정보
        info_weight: recipe.info_weight,
        calories: recipe.info_energy, // INFO_ENG
        carbs: recipe.info_carb,     // INFO_CAR
        protein: recipe.info_protein, // INFO_PRO
        fat: recipe.info_fat,         // INFO_FAT
        sodium: recipe.info_sodium,   // INFO_NA
        
        // 상세 정보
        hashtags: recipe.hashtags,
        ingredients_details: recipe.ingredients_details, // RCP_PARTS_DTLS
        sodium_tip: recipe.sodium_tip, // RCP_NA_TIP
        
        // 조리 단계 (배열 형태)
        steps: steps,

        created_at: recipe.created_at,
        updated_at: recipe.updated_at
      }
    });

  } catch (error) {
    console.error(`[Full Recipe Detail] Error fetching recipe ${req.params.id}:`, error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch full recipe details from DB'
    });
  }
});


// ============================================
// DEBUG: 카테고리 분포 확인
// [수정] recipes_light -> recipes 테이블 사용
// ============================================
router.get('/categories', async (req, res) => {
  try {
    const categories = await query(
      `SELECT category, COUNT(*) as count 
       FROM recipes 
       GROUP BY category 
       ORDER BY count DESC`
    );
    
    const total = await query('SELECT COUNT(*) as total FROM recipes');
    const nullCount = await query(
      `SELECT COUNT(*) as count FROM recipes 
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
// [유지] 기존 기능 유지 (DB 도입 후 사용되지 않을 수 있지만, 기존 기능 유지를 요청했으므로 보존)
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
// ADMIN: 식약처 레시피 크롤링 (전체 필드 INSERT/UPDATE 반영)
// [수정] foodsafetyAPI.toLightRecipe -> foodsafetyAPI.toFullRecipe 사용
// [수정] 전체 컬럼 INSERT/UPDATE 반영
// ============================================
router.post('/crawl', async (req, res) => {
  // DB의 전체 컬럼 목록 (id, created_at, updated_at 제외)
  const allColumns = [
    'name', 'category', 'cooking_method', 'image_small', 'image_large', 
    'info_weight', 'info_energy', 'info_carb', 'info_protein', 'info_fat', 'info_sodium', 
    'ingredients_details', 'hashtags', 'sodium_tip', 
    'manual_01', 'manual_02', 'manual_03', 'manual_04', 'manual_05', 'manual_06', 
    'manual_07', 'manual_08', 'manual_09', 'manual_10', 'manual_11', 'manual_12', 
    'manual_13', 'manual_14', 'manual_15', 'manual_16', 'manual_17', 'manual_18', 
    'manual_19', 'manual_20', 'ingredients_count'
  ];
  
  const updateSetClause = allColumns.map(col => `${col} = ?`).join(', ');
  const insertPlaceholders = ['?'].concat(allColumns.map(() => '?')).join(', '); // id + allColumns

  try {
    console.log('[Recipe Crawl] Starting full crawl from FoodSafety API...');
    
    const recipes = await foodsafetyAPI.crawlAllRecipes();
    
    console.log(`[Recipe Crawl] Processing ${recipes.length} recipes in DB...`);
    
    let inserted = 0;
    let updated = 0;
    
    for (const recipe of recipes) {
      try {
        // [핵심 수정] foodsafetyAPI.toLightRecipe -> foodsafetyAPI.toFullRecipe 사용
        const fullRecipe = foodsafetyAPI.toFullRecipe(recipe);
        
        // Check if already exists
        const existing = await query(
          'SELECT id FROM recipes WHERE id = ?',
          [fullRecipe.id]
        );
        
        // 크롤링된 레시피 데이터에서 allColumns에 해당하는 값들을 순서대로 추출
        const recipeValues = allColumns.map(col => fullRecipe[col]);

        if (existing.length > 0) {
          // [수정] 기존 데이터가 존재하면 전체 필드 UPDATE 수행
          const updateParams = recipeValues.concat(fullRecipe.id); // [value1, value2, ..., id]
          await query(
            `UPDATE recipes 
             SET ${updateSetClause}
             WHERE id = ?`,
            updateParams
          );
          updated++;
        } else {
          // [수정] 기존 데이터가 없을 경우 전체 필드 INSERT 수행
          const insertColumns = ['id'].concat(allColumns).join(', ');
          const insertParams = [fullRecipe.id].concat(recipeValues); // [id, value1, value2, ...]
          await query(
            `INSERT INTO recipes (${insertColumns}) 
             VALUES (${insertPlaceholders})`, 
            insertParams
          );
          
          inserted++;
        }
      } catch (err) {
        // [에러 처리 강화] toFullRecipe에서 오류가 나지 않도록 가정하고, DB 오류만 로깅
        // foodsafetyAPI.toFullRecipe는 JSON 파싱 오류가 있을 경우 여기서 잡힐 수 있습니다.
        console.error(`[Recipe Crawl] Error inserting/updating recipe ${recipe.RCP_SEQ}:`, err);
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
// 조리 세션 시작 (기존 코드 유지)
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
// 조리 세션 종료 (기존 코드 유지)
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
// 현재 진행 중인 세션 조회 (기존 코드 유지)
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
// Get All Saved Recipes (기존 코드 유지)
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
// Save Recipe (기존 코드 유지)
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
// Remove Saved Recipe (기존 코드 유지)
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
// Check if Recipe is Saved (기존 코드 유지)
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
// Get Recipes by Category (기존 코드 유지)
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
// Add to Cooking History (기존 코드 유지)
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
// Get Cooking History (기존 코드 유지)
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

// ✅ 저장한 레시피 단건 조회 (user_id 무시 버전)
// ✅ 완료한 레시피 단건 조회 (AI + 공개 레시피 모두 대응)
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const rows = await query(
      `
      SELECT *
      FROM completed_recipes
      WHERE id = ? OR recipe_id = ?
      LIMIT 1
      `,
      [id, id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "레시피 없음" });
    }

    const r = rows[0];

    const ingredients = r.ingredients_json
      ? JSON.parse(r.ingredients_json)
      : [];

    const steps = r.steps_json
      ? JSON.parse(r.steps_json)
      : [];

    res.setHeader("Cache-Control", "no-store");

    res.json({
      recipe: {
        id: r.id,                      // ✅ 이제 진짜 DB id 반환
        name: r.name,
        image: r.image,
        description: r.description,
        category: r.category,
        cooking_method: r.cooking_method,
        hashtags: r.hashtags,
        ingredients,
        steps,
        completedAt: r.completed_at,
        cookingTime: r.cooking_time,
        servings: r.servings,
        difficulty: r.difficulty,
      },
    });
  } catch (err) {
    console.error("❌ completed-recipes 단건 조회 실패:", err);
    res.status(500).json({ error: "서버 오류" });
  }
});





export default router;