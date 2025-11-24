/**
 * 식약처 레시피 API 유틸리티
 * API 문서: https://www.foodsafetykorea.go.kr/api/openApiInfo.do?menu_grp=MENU_GRP31&menu_no=661
 */

const FOODSAFETY_API_KEY = process.env.FOODSAFETY_API_KEY || 'YOUR_API_KEY';
const API_BASE_URL = 'http://openapi.foodsafetykorea.go.kr/api';
const SERVICE_NAME = 'COOKRCP01';

/**
 * 식약처 API 호출 (전체 레시피 목록)
 * @param {number} start - 시작 인덱스 (1부터 시작)
 * @param {number} end - 끝 인덱스
 * @returns {Promise<Object>} API 응답
 */
export async function getRecipes(start = 1, end = 100) {
  try {
    const url = `${API_BASE_URL}/${FOODSAFETY_API_KEY}/${SERVICE_NAME}/json/${start}/${end}`;
    
    console.log(`[FoodSafety API] Fetching recipes: ${start}-${end}`);
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.COOKRCP01 || data.COOKRCP01.RESULT?.CODE !== 'INFO-000') {
      console.error('[FoodSafety API] Error:', data);
      throw new Error(data.COOKRCP01?.RESULT?.MSG || 'Failed to fetch recipes');
    }
    
    return data.COOKRCP01;
  } catch (error) {
    console.error('[FoodSafety API] Error fetching recipes:', error);
    throw error;
  }
}

/**
 * 레시피 상세 정보 조회 (ID로 검색)
 * @param {string} recipeId - 레시피 ID (RCP_SEQ)
 * @returns {Promise<Object|null>} 레시피 상세 정보
 */
export async function getRecipeDetail(recipeId) {
  try {
    // 식약처 API는 ID로 직접 조회하는 엔드포인트가 없으므로
    // 1000개씩 순회하면서 찾아야 함
    // 최적화: 캐시 또는 DB 인덱스 활용 권장
    
    const batchSize = 1000;
    let found = null;
    
    for (let start = 1; start <= 3000; start += batchSize) {
      const end = Math.min(start + batchSize - 1, 3000);
      const result = await getRecipes(start, end);
      
      if (result.row && Array.isArray(result.row)) {
        found = result.row.find(recipe => recipe.RCP_SEQ === recipeId);
        if (found) break;
      }
    }
    
    return found;
  } catch (error) {
    console.error(`[FoodSafety API] Error fetching recipe ${recipeId}:`, error);
    throw error;
  }
}

/**
 * MANUAL 단계를 배열로 변환
 * @param {Object} recipe - 식약처 레시피 객체
 * @returns {Array} Step 배열
 */
export function parseSteps(recipe) {
  const steps = [];
  
  for (let i = 1; i <= 20; i++) {
    const stepNum = String(i).padStart(2, '0');
    const manualKey = `MANUAL${stepNum}`;
    const imageKey = `MANUAL_IMG${stepNum}`;
    
    const text = recipe[manualKey];
    
    // 빈 단계는 스킵
    if (!text || text.trim() === '') {
      continue;
    }
    
    steps.push({
      step: steps.length + 1,
      text: text.trim(),
      image: recipe[imageKey] || null
    });
  }
  
  return steps;
}

/**
 * 레시피 데이터를 경량 메타데이터로 변환
 * @param {Object} recipe - 식약처 레시피 객체
 * @returns {Object} 경량 레시피 데이터
 */
export function toLightRecipe(recipe) {
  return {
    id: recipe.RCP_SEQ,
    name: recipe.RCP_NM,
    category: recipe.RCP_PAT2 || '기타',
    cooking_method: recipe.RCP_WAY2 || null,
    hashtags: recipe.HASH_TAG || null,
    ingredients_count: (recipe.RCP_PARTS_DTLS || '').length
  };
}

/**
 * 카테고리 매핑 (식약처 → 자체 카테고리)
 * @param {string} foodsafetyCategory - 식약처 카테고리
 * @returns {string} 매핑된 카테고리
 */
export function mapCategory(foodsafetyCategory) {
  const categoryMap = {
    '밑반찬': '반찬',
    '메인반찬': '반찬',
    '국&찌개': '국/찌개',
    '찌개': '국/찌개',
    '국물요리': '국/찌개',
    '면/만두': '면류',
    '밥': '밥',
    '일품': '일품',
    '후식': '디저트',
    '디저트': '디저트',
    '퓨전': '퓨전',
    '김치/젓갈/장류': '밑반찬',
    '양념/소스/잼': '양념',
    '음료': '음료',
    '기타': '기타'
  };
  
  return categoryMap[foodsafetyCategory] || foodsafetyCategory || '기타';
}

/**
 * 전체 레시피 크롤링 (초기 데이터 수집용)
 * @returns {Promise<Array>} 모든 레시피 배열
 */
export async function crawlAllRecipes() {
  const allRecipes = [];
  const batchSize = 1000;
  const maxRecipes = 3000;
  
  console.log('[FoodSafety API] Starting full crawl...');
  
  for (let start = 1; start <= maxRecipes; start += batchSize) {
    const end = Math.min(start + batchSize - 1, maxRecipes);
    
    try {
      const result = await getRecipes(start, end);
      
      if (result.row && Array.isArray(result.row)) {
        allRecipes.push(...result.row);
        console.log(`[FoodSafety API] Crawled ${allRecipes.length} recipes...`);
      }
      
      // API Rate Limiting 방지
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`[FoodSafety API] Error crawling batch ${start}-${end}:`, error);
    }
  }
  
  console.log(`[FoodSafety API] Crawl complete: ${allRecipes.length} total recipes`);
  return allRecipes;
}

export default {
  getRecipes,
  getRecipeDetail,
  parseSteps,
  toLightRecipe,
  mapCategory,
  crawlAllRecipes
};
