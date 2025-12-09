// ========================================
// 🟩 utils/api.ts — 최종 통합 버전
// ========================================

const API_BASE_URL = "http://localhost:3001/api";

// ===============================
// AUTH TOKEN
// ===============================
function getAuthToken(): string | null {
  return sessionStorage.getItem("cooking_assistant_auth_token");
}

export function setAuthToken(token: string) {
  sessionStorage.setItem("cooking_assistant_auth_token", token);
}

export function removeAuthToken() {
  sessionStorage.removeItem("cooking_assistant_auth_token");
}

// ===============================
// 공통 API 호출
// ===============================
async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = false
) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers ? (options.headers as Record<string, string>) : {}),
  };

  if (requiresAuth) {
    const token = getAuthToken();
    if (!token) throw new Error("로그인이 필요합니다.");
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  let data: any = {};
  try {
    data = await response.json();
  } catch {}

  if (!response.ok) {
    throw new Error(data.error || data.message || "API 요청 실패");
  }

  return data;
}

// ===============================
// AUTH
// ===============================
export async function signUp(email: string, password: string, name: string) {
  return apiCall("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(email: string, password: string) {
  return apiCall("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// ===============================
// PROFILE
// ===============================
export async function getProfile() {
  return apiCall("/profile", {}, true);
}

export async function updateProfile(data: {
  name?: string;
  allergies?: string[];
  preferences?: any;
}) {
  const token = localStorage.getItem("cooking_assistant_token"); // 프로젝트에서 실제로 쓰는 저장소 이름 확인해서 맞춰줘

  const res = await fetch(`${API_BASE_URL}/profile`, {
    method: "PUT",
    headers: {  
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    console.error("updateProfile 실패:", res.status, errorBody);
    throw new Error("Failed to update profile");
  }

  return res.json(); // { profile: ... } 형태로 백엔드에서 보내줌
}

// 프론트에서 import하는 함수
export async function getCurrentUser() {
  const res = await getProfile();     // { profile: {...} }
  const profile = res.profile;

  // App.tsx에서 기대하는 user 형태로 변환
  const user = {
    id: profile.id,
    email: profile.email,
    name: profile.name,
  };

  return {
    user,
    profile,
  };
}




// ===============================
// INGREDIENTS
// ===============================
export async function getIngredients() {
  const res = await apiCall("/ingredients", {}, true);
  return {
    ingredients: res.data || res.ingredients || [],
  };
}

export async function addIngredient(data: any) {
  const res = await apiCall(
    "/ingredients",
    { method: "POST", body: JSON.stringify(data) },
    true
  );
  return { ingredient: res.data || res.ingredient };
}

export async function updateIngredient(id: string, data: any) {
  const res = await apiCall(
    `/ingredients/${id}`,
    { method: "PUT", body: JSON.stringify(data) },
    true
  );
  return { ingredient: res.data || res.ingredient };
}

export async function deleteIngredient(id: string) {
  return apiCall(`/ingredients/${id}`, { method: "DELETE" }, true);
}

// ✅ 영수증 OCR 파싱 (수정본)
export async function parseReceiptImage(formData: FormData) {
  const res = await fetch(
    "http://localhost:3001/api/receipt/parse",
    {
      method: "POST",
      body: formData,
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "영수증 분석 실패");
  }

  return res.json(); // { success: true, ingredients: [...] }
}




// ===============================
// SAVED RECIPES
// ===============================
export async function getSavedRecipes() {
  const res = await apiCall("/recipes", {}, true);
  // 백엔드에서 { recipes: [...] } 형태로 보내준다고 가정
  const list = res.recipes || res.data || res.savedRecipes || [];
  return list;  // 🔥 배열 자체를 반환
}



export async function saveRecipe(recipeData: any) {
  const payload = {
    ...recipeData,
    // DB에서 NOT NULL이라 기본값 한 번 더 보정
    category: recipeData.category ?? "기타",
  };

  const res = await apiCall(
    "/recipes",                                   // ✅ 수정
    { method: "POST", body: JSON.stringify(payload) },
    true
  );
  return { savedRecipe: res.recipe || res.data || res.savedRecipe };
}

export async function removeSavedRecipe(id: string) {
  return apiCall(`/recipes/${id}`, { method: "DELETE" }, true);  // ✅ 수정
}

// ✅ AI 완료 레시피 단건 조회
export const getCompletedRecipeById = async (id: string) => {
  const token = sessionStorage.getItem("cooking_assistant_auth_token");

  const res = await fetch(
    `http://localhost:3001/api/completed-recipes/${id}`,
    {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }
  );

  if (!res.ok) {
    throw new Error("완료된 레시피 조회 실패");
  }

  return res.json();
};







// ===============================
// PUBLIC RECIPES (추가됨)
// ===============================

/**
 * 공개 레시피 목록 조회 (필터 및 검색 포함)
 * @param {object} params - { category, search, limit, offset }
 */
export async function getPublicRecipes(params: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  // 쿼리 파라미터 생성
  const urlParams = new URLSearchParams();
  if (params.category) urlParams.append("category", params.category);
  if (params.search) urlParams.append("search", params.search);
  if (params.limit !== undefined) urlParams.append("limit", String(params.limit));
  if (params.offset !== undefined) urlParams.append("offset", String(params.offset));

  const endpoint = `/recipes/public?${urlParams.toString()}`;

  // 인증이 필요 없는 공개 API 호출
  const res = await apiCall(endpoint, { method: "GET" }, false);
  
  // 백엔드 응답 구조에 맞게 recipes를 반환
  return {
    recipes: res.recipes || [],
    total: res.total || 0,
    limit: res.limit || 50,
    offset: res.offset || 0,
  };
}

/**
 * 레시피 상세 정보 조회 (식약처 API 실시간 조회)
 * @param {string} id - 레시피 ID
 */
export async function getRecipeDetail(id: string) {
  // 실시간 조회이므로 인증 없이 호출
  const res = await apiCall(`/recipes/detail/${id}`, { method: "GET" }, false);
  return res.recipe;
}

/**
 * 레시피 전체 상세 정보 조회 (DB 크롤링 데이터)
 * @param {string} id - 레시피 ID
 */
export async function getFullRecipeDetail(id: string) {
  // DB에 저장된 전체 레시피를 조회하므로 인증 없이 호출
  const res = await apiCall(`/recipes/full/${id}`, { method: "GET" }, false);
  return res.recipe;
}


// ===============================
// GPT — 기본 대화 (레시피 생성)
// ===============================
export async function askGPT_raw(data: { message: string; profile: any }) {
  const res = await fetch("http://localhost:3001/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  const json = await res.json();
  return json.reply;
}

// ===============================
// GPT — Followup (레시피 + 대화)
// ===============================
export async function askCookingFollowup(
  recipe: any,
  question: string,
  profile: any
) {
  const res = await fetch("http://localhost:3001/api/ai/followup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipe, question, profile }),
  });

  return res.json();
}

// ===============================
// GPT — Intent (시작 의도 감지)
// ===============================
export async function detectStartIntent(text: string) {
  const res = await fetch("http://localhost:3001/api/ai/intent", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });

  const data = await res.json();
  return data.intent;
}

// ===============================
// STT — Whisper
// ===============================
export async function speechToText(audioBlob: Blob) {
  const formData = new FormData();
  formData.append("audio", audioBlob);

  const res = await fetch("http://localhost:3001/api/voice/stt", {
    method: "POST",
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error);
  return data;
}

// ===============================
// TTS — Text → Speech (Google TTS)
// ===============================
export async function textToSpeech(text: string) {
  return apiCall(
    "/ai/voice/tts",
    { method: "POST", body: JSON.stringify({ text }) },
    true
  );
}

// ===============================
// HEALTH CHECK
// ===============================
export async function healthCheck() {
  return apiCall("/health");
}

// ===============================
// COMPLETED RECIPES
// ===============================
// 프론트에서 쓸 재료 타입
export type CompletedIngredient = {
  name: string;
  amount: string;
};

// ⬇️ 서버에서 오는 한 줄(ROW) 모양
interface CompletedRecipeRow {
  id: string;              // completed_recipes.id
  user_id: string;
  recipe_id: string;
  name: string;
  image: string | null;
  description: string | null;
  category: string;
  cooking_method: string | null;
  hashtags: string | null;
  ingredients_json: string | null;   // JSON 문자열
  steps_json: string | null;         // JSON 문자열
  cooking_time: string | number | null;
  servings: string | number | null;
  difficulty: string | null;
  completed_at: string;             // DATETIME → 문자열
}

// ⬇️ 프론트에서 상태/화면에 쓸 최종 타입
export interface CompletedRecipe {
  id: string;                        // 여기서는 recipe_id 로 통일
  name: string;
  image: string | null;
  description: string | null;
  category: string;
  cooking_method?: string | null;
  hashtags?: string | null;
  ingredients: CompletedIngredient[];
  steps: string[];
  completedAt: string;
  cookingTime?: string | number | null;
  servings?: string | number | null;
  difficulty?: string | null;
}

// ⬇️ 서버에 저장할 때(POST) 쓰는 payload
export interface CompletedRecipePayload {
  id: string;              // recipe_id
  name: string;
  image: string | null;
  description: string | null;
  category: string;
  // ✅ 필수 → 선택(Optional)로 변경
  cooking_method?: string | null;
  hashtags?: string | null;

  ingredients: CompletedIngredient[]; // 배열 그대로 보냄
  steps: string[];                    // 배열 그대로 보냄
  completedAt: string;
  cookingTime?: string | number | null;
  servings?: string | number | null;
  difficulty?: string | null;
}

// 한 건 추가 (POST)
export async function addCompletedRecipe(payload: CompletedRecipePayload) {
  const token = sessionStorage.getItem("cooking_assistant_auth_token");

  const res = await fetch("http://localhost:3001/api/completed-recipes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error("❌ completed-recipes 저장 실패:", errorText);
    throw new Error("completed-recipes 저장 실패");
  }

  return res.json();
}


// 목록 가져오기 (GET) → CompletedRecipe[] 로 변환해서 반환
export async function getCompletedRecipes(): Promise<CompletedRecipe[]> {
  const res = await apiCall("/completed-recipes", {}, true);
  const rows = (res.recipes ?? []) as CompletedRecipeRow[];

  return rows.map((r) => {
    let ingredients: CompletedIngredient[] = [];
    let steps: string[] = [];

    // ---------- 재료 파싱 ----------
    try {
      const raw =
        typeof r.ingredients_json === "string"
          ? JSON.parse(r.ingredients_json)
          : r.ingredients_json;

      if (Array.isArray(raw)) {
        ingredients = raw.map((item: any) => ({
          name:
            item.name ??
            item.ingredient ??
            item.ingredientName ??
            item.item ??
            "",
          amount:
            item.amount ??
            item.quantity ??
            item.qty ??
            "",
        }));
      }
    } catch (e) {
      console.error(
        "Failed to parse ingredients_json",
        e,
        r.ingredients_json
      );
    }

    // ---------- 단계(steps) 파싱 ----------
    try {
      const rawSteps =
        typeof r.steps_json === "string"
          ? JSON.parse(r.steps_json)
          : r.steps_json;

      if (Array.isArray(rawSteps)) {
        steps = rawSteps.map((s: any) => String(s));
      }
    } catch (e) {
      console.error("Failed to parse steps_json", e, r.steps_json);
    }

    return {
      id: r.recipe_id,                      // 우리가 쓸 "레시피 id"
      name: r.name,
      image: r.image,
      description: r.description,
      category: r.category,
      cooking_method: r.cooking_method,
      hashtags: r.hashtags,
      ingredients,
      steps,
      completedAt: r.completed_at ?? "",
      cookingTime: r.cooking_time ?? null,
      servings: r.servings ?? null,
      difficulty: r.difficulty ?? null,
    };
  });
}

  // ✅ 기존 호출부 유지용 "브리지 함수"
export const getSavedRecipeById = async (recipeId: string) => {
  return getCompletedRecipeById(recipeId);
};


