// cook-server-dev/services/recipeService.js

// 💡 [1-1] AI 서비스 의존성 및 DB 트랜잭션 함수 임포트
import { askGPT } from './aiService.js'; // 하이브리드 추천 로직에 사용될 예정
import { query, transaction } from '../config/db.js';
import { extractPureIngredient } from './aiService.js'; // 재료 정제 함수 임포트 (getHybridRecipes에서 사용)

// ==========================================
// 💡 [1-2] Helper 1: 사용자 프로필 및 재료 로드 함수 (500 오류 방지 로직 포함)
// ==========================================
/**
 * DB에서 사용자 프로필(알러지, 선호도) 및 보유 재료를 로드합니다.
 * @param {string} userId - 사용자 ID
 * @returns {Promise<object>} - GPT 프로필 형식의 객체
 */
async function getUserProfileAndIngredients(userId) {
    // 1. users 테이블에서 알러지/선호도 로드
    const [userRows] = await query(
        // preferences 컬럼에 dislikedIngredients, restrictions 등 모든 AI 관련 정보가 JSON으로 저장되어 있음
        `SELECT allergies, preferences FROM users WHERE id = ?`,
        [userId]
    );

    const user = userRows[0];

    // 💡 [500 오류 방지 로직] 사용자 데이터가 없으면 기본 프로필 반환
    if (!user) {
        console.warn(`User ID ${userId} not found in DB, using default profile for AI.`);
        return {
            dislikedIngredients: [],
            allergies: [],
            restrictions: "None",
            preferredCuisines: "All",
            availableTools: [],
            healthConditions: [],
            availableIngredients: []
        };
    }
    
    // preferences와 allergies는 JSON 필드이므로 파싱
    const preferences = user.preferences ? JSON.parse(user.preferences) : {};
    const allergies = user.allergies ? JSON.parse(user.allergies) : [];

    // 2. ingredients 테이블에서 보유 재료 로드
    const [ingredientRows] = await query(
        `SELECT name FROM ingredients WHERE user_id = ?`,
        [userId]
    );

    const availableIngredients = ingredientRows.map(row => row.name);

    // 3. GPT Profile 형식에 맞춰 데이터 통합
    const profile = {
        dislikedIngredients: preferences.dislikedIngredients || [],
        allergies: allergies.map(a => a.name) || [], 
        restrictions: preferences.restrictions || "None",
        preferredCuisines: preferences.preferredCuisines || "All",
        availableTools: preferences.availableTools || [],
        healthConditions: preferences.healthConditions || [],
        availableIngredients: availableIngredients
    };

    return profile;
}

// ==========================================
// 💡 [1-2] Helper 2: DB 레시피를 클라이언트 형식에 맞게 변환하는 헬퍼 함수
// ==========================================
/**
 * DB 레시피 로우 데이터를 클라이언트가 사용하기 쉬운 Recipe 타입으로 변환합니다.
 * @param {object} rawRecipe - DB에서 조회된 레시피 로우 데이터 (recipes 또는 gpt_temp_recipes 스키마)
 * @returns {object|null} - 클라이언트 Recipe 타입 객체
 */
const transformDbRecipe = (rawRecipe) => {
    if (!rawRecipe) return null;
    
    // manual_01 ~ manual_20 필드를 steps 배열로 변환
    const steps = [];
    for (let i = 1; i <= 20; i++) {
        const manualKey = `manual_${i.toString().padStart(2, '0')}`;
        // DB 컬럼이 존재하고 값이 있을 경우에만 추가
        if (rawRecipe[manualKey] && rawRecipe[manualKey].trim().length > 0) {
            steps.push({
                step: steps.length + 1,
                text: rawRecipe[manualKey],
                image: null // 현재 DB 스키마에 이미지 필드는 없음
            });
        }
    }
    
    // 클라이언트 통합에 용이하도록 객체 재구성
    // DB의 info_energy는 클라이언트에서 calories로 사용됨
    const recipeIdNum = parseInt(rawRecipe.id, 10);

    return {
        id: String(rawRecipe.id), // 클라이언트에서 ID를 string으로 처리하는 것을 반영
        name: rawRecipe.name,
        recipeName: rawRecipe.name,
        category: rawRecipe.category,
        cooking_method: rawRecipe.cooking_method,
        image_small: rawRecipe.image_small,
        image_large: rawRecipe.image_large,
        image: rawRecipe.image_large || rawRecipe.image_small,
        
        info_weight: rawRecipe.info_weight,
        calories: rawRecipe.info_energy, 
        carbs: rawRecipe.info_carb,
        protein: rawRecipe.info_protein,
        fat: rawRecipe.info_fat,
        sodium: rawRecipe.info_sodium,
        
        hashtags: rawRecipe.hashtags,
        ingredients_details: rawRecipe.ingredients_details,
        sodium_tip: rawRecipe.sodium_tip,
        
        steps: steps,

        created_at: rawRecipe.created_at,
        updated_at: rawRecipe.updated_at,
        
        // 💡 GPT 생성 레시피 플래그 (10000 이상이면 true)
        is_generated: recipeIdNum >= 10000 
    };
};


class RecipeService {
    // 임시로 DB에 직접 쿼리하는 함수는 제거하고 Service 계층 함수만 정의합니다.

    // ==========================================
    // [1-3] ID 분기 조회 (recipes vs gpt_temp_recipes)
    // ==========================================
    /**
     * ID를 기반으로 recipes 또는 gpt_temp_recipes에서 레시피를 조회합니다.
     * @param {string} id - 레시피 ID (문자열)
     * @returns {Promise<object|null>} - 변환된 레시피 객체 또는 null
     */
    async findRecipeById(id) {
        const recipeId = parseInt(id, 10);
        let sqlQuery;
        let tableName;

        // 💡 ID 범위에 따른 테이블 분기 처리
        if (recipeId >= 10000) {
            sqlQuery = `SELECT * FROM gpt_temp_recipes WHERE id = ?`;
            tableName = 'gpt_temp_recipes';
        } else {
            sqlQuery = `SELECT * FROM recipes WHERE id = ?`;
            tableName = 'recipes';
        }
        
        // 쿼리 실행
        const [rows = []] = await query(sqlQuery, [recipeId]);
        const rawRecipe = rows[0];

        if (!rawRecipe) {
            console.warn(`Recipe ID ${id} not found in ${tableName}`);
            return null; // 404 응답을 위해 null 반환
        }
        
        // raw 데이터를 클라이언트 형식에 맞게 변환
        return transformDbRecipe(rawRecipe);
    }

    // ==========================================
    // [1-3] GPT 레시피 임시 저장 (ID 10000+ 할당)
    // ==========================================
    /**
     * GPT가 생성한 레시피 데이터를 gpt_temp_recipes 테이블에 저장합니다.
     * @param {object} recipeData - GPT 응답을 DB 포맷으로 변환한 데이터
     * @param {string} userId - 사용자 ID
     * @returns {Promise<number>} - 새로 할당된 임시 레시피 ID
     */
    async saveGptRecipe(recipeData, userId) {
        // 1. ID 생성 로직 (10000번대 할당)
        const [maxIdRow] = await query(`SELECT MAX(id) AS max_id FROM gpt_temp_recipes WHERE id >= 10000`);
        const newId = (maxIdRow[0]?.max_id || 9999) + 1; // MAX(id)가 null이면 10000부터 시작

        // 2. GPT 데이터에서 DB 컬럼 목록 및 값 구성 (manual_xx 포함)
        const allColumns = Object.keys(recipeData);
        const placeholders = Array(allColumns.length).fill('?').join(', ');
        const values = allColumns.map(col => recipeData[col]);
        
        // ID와 user_id는 recipeData에 포함되어야 함 (aiService.js에서 주입한다고 가정)
        if (!allColumns.includes('id')) {
            allColumns.unshift('id');
            values.unshift(newId);
        }
        if (!allColumns.includes('user_id')) {
            allColumns.unshift('user_id');
            values.unshift(userId);
        }
        
        const sql = `INSERT INTO gpt_temp_recipes (${allColumns.join(', ')}) VALUES (${placeholders})`;
        
        await query(sql, values); 
        console.log(`[DB SUCCESS] GPT Recipe saved with temp ID: ${newId} by User ${userId}`);
        return newId;
    }

    // ==========================================
    // [1-4] GPT 레시피 영구 승격 (트랜잭션으로 원자성 확보)
    // ==========================================
    /**
     * GPT 생성 레시피(ID 10000+)를 영구 DB(ID 4000+)로 승격시킵니다.
     * @param {string} recipeId - 임시 레시피 ID (문자열)
     * @returns {Promise<number>} - 새로 할당된 영구 레시피 ID
     */
    async promoteRecipe(recipeId) {
        const gptRecipeId = parseInt(recipeId, 10);
        
        // transaction 헬퍼 함수를 사용하여 원자적 작업 수행
        const newId = await transaction(async (connection) => {
            // 1. 임시 테이블에서 레시피 데이터 로드
            const [tempRows] = await connection.execute(`SELECT * FROM gpt_temp_recipes WHERE id = ?`, [gptRecipeId]);
            const recipeToPromote = tempRows[0];

            if (!recipeToPromote) {
                throw new Error(`GPT Recipe ID ${gptRecipeId} not found for promotion.`);
            }

            // 2. 새 영구 ID 할당 (4000번대)
            const [maxIdRow] = await connection.execute(`SELECT MAX(id) AS max_id FROM recipes WHERE id >= 4000 AND id < 10000`);
            const newPermanentId = (maxIdRow[0]?.max_id || 3999) + 1;

            // 3. recipes 테이블에 INSERT
            const excludedColumns = ['id', 'created_at', 'updated_at', 'user_id']; 
            // gpt_temp_recipes에는 completed_count, average_rating 컬럼이 포함되어 있으므로 그대로 사용
            const insertableColumns = Object.keys(recipeToPromote).filter(col => !excludedColumns.includes(col));
            
            const values = insertableColumns.map(col => recipeToPromote[col]);
            
            const sqlInsert = `
                INSERT INTO recipes (id, ${insertableColumns.join(', ')})
                VALUES (?, ${Array(insertableColumns.length).fill('?').join(', ')})
            `;
            
            await connection.execute(sqlInsert, [newPermanentId, ...values]);
            
            // 4. gpt_temp_recipes에서 원본 데이터 삭제
            await connection.execute(`DELETE FROM gpt_temp_recipes WHERE id = ?`, [gptRecipeId]);
            
            console.log(`[DB SUCCESS] Promoted GPT Recipe ID ${gptRecipeId} to Permanent ID ${newPermanentId}`);
            return newPermanentId;
        });

        return newId;
    }

    // ==========================================
    // [Placeholder for Phase 2 & 3]
    // ==========================================
    async findAllRecipes() {
        // AI 레시피는 제외 (ID < 10000)
        const [rows] = await query(`SELECT * FROM recipes WHERE id < 10000 ORDER BY id DESC`);
        return rows.map(transformDbRecipe);
    }
    
    // 이 함수는 Phase 1-6/Phase 2에서 getRecommendations를 호출하여 구현할 예정
    async getHybridRecipes(userId) {
        throw new Error("getHybridRecipes: Implementation delegated to aiService and to be completed in Phase 1-6.");
    }
    
    // 나머지 CRUD 함수는 AI 기능에 직접적인 영향이 없으므로 placeholder 유지
    async createRecipe(recipeData) {
        throw new Error("createRecipe implementation needed (ORM/SQL)");
    }
    async updateRecipe(id, recipeData) {
        throw new Error("updateRecipe implementation needed (ORM/SQL)");
    }
    async deleteRecipe(id) {
        throw new Error("deleteRecipe implementation needed (ORM/SQL)");
    }
}

export default new RecipeService();