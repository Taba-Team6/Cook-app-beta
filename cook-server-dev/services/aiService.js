// cook-server-dev/services/aiService.js
import dotenv from "dotenv";
import OpenAI, { toFile } from "openai";

dotenv.config();

// 💡 [1-5] DB 및 서비스 의존성 추가
import db from "../config/db.js"; 
import recipeService from './recipeService.js'; 

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// ==========================================
// 💡 [1-5] Helper: 재료 정제 함수 (GPT용 재료명만 추출)
// ==========================================
export function extractPureIngredient(str) {
    return str
        .replace(/[0-9]/g, "")                     // 숫자 제거
        .replace(/\([^)]*\)/g, "")                 // 괄호 제거
        .replace(/g|컵|큰술|작은술|쪽|개|모|약간|ml|L|대|마리/g, "") // 단위 제거
        .replace(/ +/g, " ")
        .trim();
}

// ==========================================
// 💡 [1-5] Helper: GPT JSON → DB 스키마 포맷 변환
// ==========================================
/**
 * GPT의 클라이언트용 JSON 응답을 DB의 recipes/gpt_temp_recipes 스키마에 맞게 변환합니다.
 * @param {object} gptJson - GPT의 JSON 응답 원본
 * @param {object} profile - 사용자 프로필 (카테고리/도구 추출용)
 * @param {string} userId - 사용자 ID
 * @returns {object} - DB 삽입용 객체
 */
function transformGptRecipeToDbFormat(gptJson, profile, userId) {
    // GPT JSON은 recipeName, fullIngredients, steps 등을 포함
    const steps = gptJson.steps || [];
    const recipe = gptJson.recipe || gptJson;

    // GPT의 steps 배열을 DB의 manual_01 ~ manual_20 필드에 맞게 매핑
    const manualFields = {};
    for (let i = 1; i <= 20; i++) {
        manualFields[`manual_${i.toString().padStart(2, '0')}`] = steps[i - 1] || null;
    }

    // fullIngredients를 하나의 문자열로 저장
    const fullIngredientsString = recipe.fullIngredients ? recipe.fullIngredients.join('\n') : '';

    // GPT는 영양 정보를 제공하지 않으므로, 0 또는 null로 처리 (DB 스키마 통일)
    return {
        // ID와 user_id는 recipeService.saveGptRecipe에서 처리하도록 recipeData에 포함시키지 않습니다.
        user_id: userId, // saveGptRecipe에서 사용하기 위해 포함
        name: recipe.recipeName || 'AI 맞춤 레시피',
        category: profile.preferredCuisines && profile.preferredCuisines !== "All" ? profile.preferredCuisines : '기타',
        cooking_method: profile.availableTools?.join(',') || '일반',
        image_small: recipe.image,
        image_large: recipe.image,
        
        info_weight: null,
        info_energy: '0', 
        info_carb: '0',   
        info_protein: '0', 
        info_fat: '0', 
        info_sodium: '0', 
        
        ingredients_details: fullIngredientsString, 
        hashtags: '',
        sodium_tip: 'GPT가 제안한 레시피입니다.', // GPT 생성 레시피임을 표시
        ingredients_count: recipe.ingredients ? recipe.ingredients.length : 0, 
        
        ...manualFields // manual_01 ~ manual_20 필드
    };
}

// ==========================================
// 💡 [1-5] Service Delegation & Internal Query
// ==========================================
const internalRecipeService = {
    // 🚨 [DB 쿼리] 레시피 DB에서 필터링에 필요한 데이터만 로드 (ID < 10000)
    async getRecipesForFiltering() {
        // 💡 [최적화] AI 추천의 다양성을 위해 랜덤으로 500개만 가져옵니다.
        const [rows] = await db.query(`
            SELECT 
                id, name, ingredients_details, 
                info_sodium, info_carb, info_fat, info_protein, info_energy
            FROM recipes 
            WHERE id < 10000 
            ORDER BY RAND()
            LIMIT 500
        `);
        // DB 컬럼이 VARCHAR(50)이므로 숫자로 변환하여 사용하도록 처리
        return rows.map(r => ({
            ...r,
            info_sodium: parseInt(r.info_sodium || '0', 10),
            info_carb: parseInt(r.info_carb || '0', 10),
        }));
    },
    
    // 💡 [Service 위임] GPT 레시피 임시 저장
    async saveGptRecipe(recipeData, userId) {
        return await recipeService.saveGptRecipe(recipeData, userId);
    },

    // 💡 [Service 위임] GPT 레시피 영구 승격
    async promoteRecipe(recipeId) {
        return await recipeService.promoteRecipe(recipeId);
    }
};


// ==========================================
// 💡 [1-6] 하이브리드 레시피 추천 및 생성 (Core Logic)
// ==========================================
/**
 * 사용자 프로필과 보유 재료를 기반으로 DB 4개 + GPT 1개 레시피 목록을 반환합니다.
 * @param {string} userId - 사용자 ID
 * @returns {Promise<Array<object>>} - 5개의 추천 레시피 목록
 */
export async function getRecommendations(userId) {
    if (!userId) throw new Error("User ID is required for recommendation.");
    
    try {
        // 1. 사용자 프로필 및 보유 재료 로드 (recipeService에 위임)
        const profile = await recipeService.getUserProfileAndIngredients(userId); 
        const availableIngredients = profile.availableIngredients || [];
        
        // 2. DB 레시피 필터링 및 점수화에 필요한 레시피 목록 로드
        const allDbRecipes = await internalRecipeService.getRecipesForFiltering();

        let scoredRecipes = [];

        // 3. 백엔드 필터링 및 우선순위 부여 (DB 레시피 4개 선정)
        for (const recipe of allDbRecipes) {
            let score = 0;
            let isExcluded = false;
            
            const recipeIngredientsDetails = recipe.ingredients_details || '';

            // 3-A. 제외 필터링 (알러지, 싫어하는 재료)
            const excludedItems = [...profile.allergies.map(a => a.name || a), ...(profile.dislikedIngredients || [])];
            
            for (const item of excludedItems) {
                if (recipeIngredientsDetails.includes(item)) {
                    isExcluded = true;
                    break;
                }
            }
            if (isExcluded) continue;

            // 3-B. 식단/건강 상태 필터링 및 점수 부여
            const healthConditions = Array.isArray(profile.healthConditions) ? profile.healthConditions : [profile.healthConditions];
            const restrictions = profile.restrictions || "None";

            if (healthConditions.includes('고혈압') || restrictions.includes('저염식')) {
                // 나트륨이 낮을수록 점수 가산 (600mg 이하를 기준으로 점수 부여)
                score += (600 - Math.min(recipe.info_sodium || 0, 600)) / 100;
            }
            if (healthConditions.includes('당뇨')) {
                // 탄수화물이 낮을수록 점수 가산 (80g 이하를 기준으로 점수 부여)
                score += (80 - Math.min(recipe.info_carb || 0, 80)) / 10;
            }

            // 3-C. 우선순위 부여 (보유 식재료 활용)
            let ingredientsNeeded = recipeIngredientsDetails.split(',').map(extractPureIngredient).filter(Boolean); 
            let matchedCount = 0;
            for (const needed of ingredientsNeeded) {
                if (availableIngredients.includes(needed)) {
                    matchedCount++;
                }
            }
            
            score += matchedCount * 20; 
            
            scoredRecipes.push({ id: recipe.id, name: recipe.name, score: score });
        }

        // 4. 점수 기준으로 상위 4개 DB 레시피 선정
        scoredRecipes.sort((a, b) => b.score - a.score);
        // ID를 문자열로 변환하고 isGpt: false 플래그를 추가합니다.
        const dbRecommendations = scoredRecipes.slice(0, 4).map(r => ({ id: String(r.id), name: r.name, isGpt: false }));
        
        // 5. GPT 레시피 1개 생성 요청
        const gptPromptMessage = `
            사용자 프로필: ${JSON.stringify(profile)}
            보유 식재료: ${availableIngredients.join(', ')}
            DB 추천 레시피 4개의 주요 특징 (참고용): ${dbRecommendations.map(r => r.name).join(', ')}

            위 정보를 바탕으로, 사용자에게 최적화된 새로운 요리 레시피 1개를 생성하세요.
        `;
        
        let gptRecommendation = null;
        try {
            const gptRawJson = await askGPT(gptPromptMessage, profile);
            const gptRecipeJson = JSON.parse(gptRawJson); 
            
            // GPT 출력 JSON을 DB 저장 포맷으로 변환 (user_id 포함)
            const dbRecipeData = transformGptRecipeToDbFormat(gptRecipeJson, profile, userId);
            
            // 임시 테이블에 저장 및 ID 획득 (recipeService 위임)
            const gptId = await internalRecipeService.saveGptRecipe(dbRecipeData, userId);
            
            gptRecommendation = { 
                id: String(gptId), 
                name: gptRecipeJson.recipeName || 'AI 맞춤 레시피', 
                isGpt: true 
            };
        } catch (error) {
            console.error('[GPT Generation Error] Failed to generate GPT recipe:', error);
        }

        // 6. 최종 5개 목록 반환 (GPT 레시피를 맨 앞에 배치하여 눈에 띄게 함)
        const finalRecommendations = [...dbRecommendations];
        if (gptRecommendation) {
            finalRecommendations.unshift(gptRecommendation); 
        }

        return finalRecommendations.slice(0, 5);
    } catch (error) {
        console.error('[Hybrid Recipes Fatal Error]:', error);
        throw new Error("Failed to generate hybrid recommendations.");
    }
}


// ==========================================
// 💡 [1-7] GPT 상호작용: 레시피 생성 (askGPT)
// ==========================================
// 기존 askGPT 함수를 그대로 사용하며, 프롬프트는 1-7 요구사항에 맞게 이미 상세하게 정의되어 있습니다.
export async function askGPT(message, profile) {
    const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },

        messages: [
            {
                role: "system",
                content: `
당신은 'Cooking Assistant' 요리 전문 AI입니다.

🔥 반드시 아래 사용자 프로필을 100% 고려하여 레시피 생성:
사용자 프로필:
${JSON.stringify(profile)}

[프로필 반영 규칙]
- dislikedIngredients: 이 재료는 절대 사용하지 말 것
- allergies: 이 재료가 포함되면 절대 안 됨
- restrictions: 식단 제한 종류에 맞게 레시피 구성
- preferredCuisines: 가능하면 이 cuisine 위주로 레시피 생성
- availableTools: 사용자가 가진 도구만 사용해서 조리법 제시
- healthConditions: 
  예) 고혈압 → 저염식 / 당뇨 → 당류 줄이기 등 반영
assistantMessage는 절대로 출력하지 말고 **레시피 JSON만** 생성하세요.

반드시 아래 JSON 구조 **그대로** 사용합니다:

{
  "recipeName": "",
  "image": "",
  "fullIngredients": [],
  "ingredients": [],
  "steps": []
}

────────────────────────
[image 규칙]
────────────────────────
- image에는 이 요리를 가장 잘 보여주는 **대표 사진 URL**을 넣습니다.
- 형식: 하나의 문자열
- HTTPS로 시작하는 전체 URL이어야 합니다.
- 가능한 경우 Unsplash 이미지를 사용합니다.
  예시:
  "https://images.unsplash.com/photo-1604908176997-1251884b08a3?w=800&auto=format&fit=crop"


────────────────────────
[fullIngredients 규칙 - bullet 형식 강제]
────────────────────────
fullIngredients는 다음과 같은 **문자열 배열**이어야 합니다.

- 각 항목은 반드시 "• " 로 시작해야 합니다.
- "• 재료명 + 정확한 양" 형식으로 작성하세요.
- 한 항목에 여러 재료를 콤마(,)로 묶지 말고, 재료마다 한 줄씩 넣으세요.

예시:

"fullIngredients": [
  "• 묵은 김치 300g",
  "• 두부 200g",
  "• 돼지고기 앞다리살 150g",
  "• 양파 1개(약 150g)",
  "• 대파 1대",
  "• 마늘 3쪽",
  "• 고춧가루 2큰술",
  "• 국간장 1큰술",
  "• 소금 약간",
  "• 물 4컵"
]

────────────────────────
[ingredients 규칙]
────────────────────────
- ingredients 배열에는 "순수 재료명"만 넣습니다.
예:
"ingredients": [
  "묵은 김치",
  "두부",
  "돼지고기 앞다리살",
  "양파",
  "대파",
  "마늘",
  "고춧가루",
  "국간장",
  "소금",
  "물"
]

────────────────────────
[steps 규칙 - 매우 자세하게]
────────────────────────
steps는 다음 규칙을 반드시 따릅니다.

1) 각 단계는 한글 문장 하나 이상의 문자열로 작성.
2) 최소 6단계에서 최대 20단계까지 구성합니다. (💡 [수정] 최소 단계를 3에서 6으로 높여 DB 스키마에 부합하게 강제)
3) 초반 단계에 **재료 손질 방법**을 반드시 넣으세요:
   - 예: "묵은 김치 300g은 한 입 크기로 자릅니다."
   - 예: "대파 1대는 송송 썰어줍니다."
   - 예: "두부 200g은 한 입 크기 정사각형으로 썰어줍니다."
4) 재료를 넣을 때, **가능한 한 양을 다시 한 번 언급**합니다.
   - 예: "냄비에 물 4컵을 붓고 중불에서 끓입니다."
   - 예: "묵은 김치 300g과 돼지고기 150g을 넣고 5분간 볶아주세요."
5) 도구/불 세기/시간을 반드시 포함합니다.
   - 도구: 냄비, 팬, 칼, 도마, 국자 등
   - 불 세기: 약불 / 중약불 / 중불 / 센불
   - 시간: "약 3분간", "5~7분 정도"처럼 구체적으로
6) 마지막 단계에는 완성 상태(색깔, 농도, 맛 포인트)를 설명합니다.

────────────────────────
[기타]
────────────────────────
- 반드시 JSON 형식만 출력하고, JSON 바깥에 설명 문장을 쓰지 마세요.
- "json"이라는 단어는 이 system 메시지 안에 포함되어 있으므로 그대로 사용 가능합니다.
        `,
      },
      { role: "user", content: message },
    ],
  });

    return res.choices[0].message.content;
}

// ==========================================
// 💡 [1-7] GPT 상호작용: 요리 중 변수 처리 (askGPTFollowup)
// ==========================================
// 기존 askGPTFollowup 함수를 그대로 사용합니다.
export async function askGPTFollowup(recipe, question, profile) {
    const recipeForGPT = {
        ...recipe,
        ingredients: recipe.fullIngredients
            ? recipe.fullIngredients.map(extractPureIngredient)
            : recipe.ingredients,
    };

    const res = await client.chat.completions.create({
        model: "gpt-4o",
        response_format: { type: "json_object" },

        messages: [
            {
                role: "system",
                content: `
당신은 'Cooking Assistant'입니다.

────────────────────────
[사용자 프로필 적용 — 필수 규칙]
────────────────────────
사용자 프로필(반드시 엄격하게 적용):
${JSON.stringify(profile)}

필수 적용 규칙:
- allergies(알러지): 이 재료는 fullIngredients, ingredients, steps 에 절대 포함되면 안 됨
- dislikedIngredients(싫어하는 재료): 해당 재료는 무조건 제거하거나 대체
- restrictions(비건/채식/글루텐프리 등): 식단 제한을 반드시 준수
- preferredCuisines(선호 요리): 가능한 경우 이 요리 스타일을 우선적으로 반영
- healthConditions(고혈압/당뇨 등): 건강 조건에 맞게 염분/당/지방 관련 조정
- availableTools(사용 가능한 조리도구): steps에서 사용자가 가진 도구만 사용

────────────────────────
[assistantMessage 출력 규칙]
────────────────────────

⚠️ 절대 규칙:
- assistantMessage는 반드시 예쁜 형식으로 출력해야 함
- 줄바꿈(\\n)을 사용해 문단/문장을 나누고 읽기 편하게 작성
- 긴 문장은 1~2줄 단위로 끊어서 출력
- 목록은 "- 항목" 또는 "• 항목" 형태로 정리
- 선택지는 "1) ..." 형태로 각 줄 분리
- "시작해", "요리 시작"과 같은 명령이 오기 전에는 절대 steps를 출력하지 말 것
- "시작해볼까요", "바로 시작해요" 같은 문장도 금지

assistantMessage 마지막에는 반드시 아래 2줄을 포함하세요:

"레시피를 업데이트했어요!
추가로 조정할 부분이 있다면 말씀해주세요."

⚠️ assistantMessage 안에는 '시작해', '요리 시작', '시작할까요' 같은 표현을 넣지 마세요.
시작 여부는 사용자가 직접 말합니다.

────────────────────────
[처리해야 할 상황]
────────────────────────
1) 재료 없음:
   - "양파 없어", "대파 없는데" 등
   → 가능한 대체재료 2~4개를 bullet 형태로 제안하고,
     1) 대체재료로 바꾸기
     2) 해당 재료 없이 만들기
     같은 선택지를 제공합니다.

2) 재료 빼고 싶음:
   - "당근은 안 넣고 싶어", "버섯 빼줘"
   → 해당 재료를 fullIngredients/ingredients/steps에서 제거하고,
     변경된 레시피를 반환합니다.

3) 재료 부족/과다:
   - "~밖에 없어", "~이 더 많아", "2개밖에 없음", "4개 있는데?" 등
   → 반드시 아래 3가지 선택지를 assistantMessage에 포함합니다.

   1) 지금 가진 양에 맞춰 레시피 전체 비율 조정하기
   2) 원래 레시피 기준 양만 사용하기
   3) 해당 재료만 양을 줄이거나 늘려서 조정하기

   사용자가 선택하면:
   - fullIngredients의 양을 새 비율에 맞게 조정
   - steps 내용도 양에 맞게 자연스럽게 수정

4) 모든 assistantMessage는 예쁜 형식으로 줄바꿈 포함

────────────────────────
[fullIngredients 재료 출력 규칙 - follow-up에서도 유지]
────────────────────────
- 레시피를 수정하거나 재생성할 때,
  fullIngredients는 항상 "• 재료 + 양" 형식의 문자열 배열이어야 합니다.

예:
"fullIngredients": [
  "• 묵은 김치 300g",
  "• 두부 200g",
  "• 돼지고기 앞다리살 150g"
]

────────────────────────
[출력 JSON 형식]
────────────────────────
반드시 다음 형식으로만 응답:

{
  "assistantMessage": "",
  "recipe": {
    "recipeName": "",
    "image": "",
    "fullIngredients": [],
    "ingredients": [],
    "steps": []
  }
}
- image 필드가 이미 있는 경우, 특별한 언급이 없으면 기존 값을 그대로 유지합니다.
- 새로운 요리로 완전히 바꾸는 경우에는 그 요리에 맞는 새로운 이미지 URL을 넣습니다.

JSON 외 텍스트 절대 금지.
        `,
      },
      {
        role: "user",
        content: `
현재 레시피(JSON): ${JSON.stringify(recipeForGPT)}
사용자 입력: ${question}

위 규칙을 지켜서 예쁘게 들여쓰기된 assistantMessage와 JSON만 출력하세요.
        `,
      },
    ],
  });

    return JSON.parse(res.choices[0].message.content);
}

// ===============================
// intent (기존 기능 유지)
// ===============================
export async function askIntent(text) {
    const res = await client.chat.completions.create({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
            {
                role: "system",
                content: `
너는 사용자의 요리 시작 의도를 판단하는 AI이다.

start → "요리를 시작하겠다"라는 명확한 의도를 가진 말
none → 그 외 모든 말

예:
"시작해" → start
"응 시작" → start
"ㄱㄱ" → start
"가보자" → start

"대파 없어" → none  
"대체재료 알려줘" → none  
"오이 4개 있어" → none  

{"intent":"start"} 또는 {"intent":"none"} 만 출력
        `,
            },
            { role: "user", content: text },
        ],
    });

    return JSON.parse(res.choices[0].message.content);
}

// ===============================
// STT (기존 기능 유지)
// ===============================
export async function stt(audioBuffer) {
    try {
        const file = await toFile(audioBuffer, "audio.webm", {
            contentType: "audio/webm",
        });

        const res = await client.audio.transcriptions.create({
            file,
            model: "whisper-1",
        });

        return res.text;
    } catch (err) {
        console.error("STT Error:", err);
        throw new Error("STT 변환 실패");
    }
}