import { projectId, publicAnonKey } from './supabase/info';

const API_BASE_URL = "http://localhost:4000/api";

// Get auth token from session storage
function getAuthToken(): string | null {
  return sessionStorage.getItem('cooking_assistant_auth_token');
}

// Set auth token to session storage
export function setAuthToken(token: string) {
  sessionStorage.setItem('cooking_assistant_auth_token', token);
}

// Remove auth token from session storage
export function removeAuthToken() {
  sessionStorage.removeItem('cooking_assistant_auth_token');
}

// Generic API call function
async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = false
) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      headers['Authorization'] = `Bearer ${publicAnonKey}`;
    }
  } else {
    headers['Authorization'] = `Bearer ${publicAnonKey}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    throw error;
  }
}

// ============================================
// AUTH API
// ============================================
export async function signUp(email: string, password: string, name: string) {
  return apiCall('/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

// ============================================
// PROFILE API
// ============================================
export async function getProfile() {
  return apiCall('/profile', {}, true);
}

export async function updateProfile(profileData: any) {
  return apiCall('/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }, true);
}

// ============================================
// INGREDIENTS API
// ============================================
export async function getIngredients() {
  return apiCall('/ingredients', {}, true);
}

export async function addIngredient(ingredientData: any) {
  return apiCall('/ingredients', {
    method: 'POST',
    body: JSON.stringify(ingredientData),
  }, true);
}

export async function updateIngredient(id: string, ingredientData: any) {
  return apiCall(`/ingredients/${id}`, {
    method: 'PUT',
    body: JSON.stringify(ingredientData),
  }, true);
}

export async function deleteIngredient(id: string) {
  return apiCall(`/ingredients/${id}`, {
    method: 'DELETE',
  }, true);
}

// ============================================
// SAVED RECIPES API
// ============================================
export async function getSavedRecipes() {
  return apiCall('/saved-recipes', {}, true);
}

export async function saveRecipe(recipeData: any) {
  return apiCall('/saved-recipes', {
    method: 'POST',
    body: JSON.stringify(recipeData),
  }, true);
}

export async function removeSavedRecipe(id: string) {
  return apiCall(`/saved-recipes/${id}`, {
    method: 'DELETE',
  }, true);
}

// ============================================
// HEALTH CHECK
// ============================================
export async function healthCheck() {
  return apiCall('/health');
}

// ============================================
// AI VOICE ASSISTANT API
// ============================================

// Text → Speech
export async function textToSpeech(text: string) {
  return apiCall('/ai/voice/tts', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }, true);
}

// ============================================
// GPT API
// ============================================

export async function askGPT_raw(message: string) {
  const response = await fetch("http://localhost:4000/api/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });

  const data = await response.json();
  return data.reply; // JSON 문자열
}

//============================================
// gpt followup (레시피 + 대화 동시 업데이트)
//============================================
export async function askCookingFollowup(recipe: any, question: string) {
  const response = await fetch("http://localhost:4000/api/ai/followup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipe, question }),
  });

  const data = await response.json();
  return data;  // 🔥 이제 { assistantMessage, recipe } 그대로 반환
}



// ============================================
// STT API  (🔥최종 정상 버전)
// ============================================
export async function speechToText(audioBlob: Blob) {
  const formData = new FormData();
  formData.append("audio", audioBlob);

  const res = await fetch("http://localhost:4000/api/voice/stt", {
    method: "POST",
    body: formData, // 절대 헤더 넣지 마라!!
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("STT API Error:", data);
    throw new Error(data.error || "STT 실패");
  }

  console.log("STT API 결과:", data); // 🔥 디버깅용
  return data; // { text: "..." }
}


// =======================================
// 🔥 사용자의 "시작 의도" 감지 API
// =======================================
export async function detectStartIntent(text: string) {
  try {
    const res = await fetch("http://localhost:4000/ai/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    return data.intent; // "start" | "none"
  } catch (err) {
    console.error("INTENT API ERROR:", err);
    return "none";
  }
}
