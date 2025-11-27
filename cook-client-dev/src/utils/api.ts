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

export async function updateProfile(profileData: any) {
  return apiCall(
    "/profile",
    { method: "PUT", body: JSON.stringify(profileData) },
    true
  );
}

// 프론트에서 import하는 함수 (없으면 오류남)
export async function getCurrentUser() {
  return getProfile();
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

// ===============================
// SAVED RECIPES
// ===============================
export async function getSavedRecipes() {
  const res = await apiCall("/saved-recipes", {}, true);
  return {
    savedRecipes: res.data || res.savedRecipes || [],
  };
}

export async function saveRecipe(recipeData: any) {
  const res = await apiCall(
    "/saved-recipes",
    { method: "POST", body: JSON.stringify(recipeData) },
    true
  );
  return { savedRecipe: res.data || res.savedRecipe };
}

export async function removeSavedRecipe(id: string) {
  return apiCall(`/saved-recipes/${id}`, { method: "DELETE" }, true);
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
