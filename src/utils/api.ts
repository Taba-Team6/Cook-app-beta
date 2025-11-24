/**
 * MySQL Backend API Client
 * 
 * MySQL + Node.js 백엔드용 API 클라이언트입니다.
 * Supabase에서 MySQL로 완전히 전환되었습니다.
 */

// 환경변수 또는 기본값
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) 
  ? import.meta.env.VITE_API_URL 
  : 'http://localhost:3001/api';

console.log('🔌 API Base URL:', API_BASE_URL);

// ============================================
// Auth Token Management
// ============================================

function getAuthToken(): string | null {
  return sessionStorage.getItem('cooking_assistant_auth_token');
}

export function setAuthToken(token: string) {
  sessionStorage.setItem('cooking_assistant_auth_token', token);
}

export function removeAuthToken() {
  sessionStorage.removeItem('cooking_assistant_auth_token');
}

// ============================================
// Generic API Call Function
// ============================================

async function apiCall(
  endpoint: string,
  options: RequestInit = {},
  requiresAuth = false
) {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (requiresAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'API request failed');
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
  const response = await apiCall('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
  
  // 토큰 자동 저장
  if (response.token) {
    setAuthToken(response.token);
  }
  
  return response;
}

export async function login(email: string, password: string) {
  const response = await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  
  // 토큰 자동 저장
  if (response.token) {
    setAuthToken(response.token);
  }
  
  return response;
}

export async function logout() {
  removeAuthToken();
  return { success: true };
}

export async function getCurrentUser() {
  return apiCall('/auth/me', {}, true);
}

export async function verifyToken() {
  return apiCall('/auth/verify', {}, true);
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

export async function getProfileStats() {
  return apiCall('/profile/stats', {}, true);
}

// ============================================
// INGREDIENTS API
// ============================================

export async function getIngredients() {
  return apiCall('/ingredients', {}, true);
}

export async function getIngredient(id: string) {
  return apiCall(`/ingredients/${id}`, {}, true);
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

export async function getIngredientsByCategory(category: string) {
  return apiCall(`/ingredients/category/${category}`, {}, true);
}

export async function getExpiringSoonIngredients(days: number = 7) {
  return apiCall(`/ingredients/expiring/soon?days=${days}`, {}, true);
}

// ============================================
// SAVED RECIPES API
// ============================================

export async function getSavedRecipes() {
  return apiCall('/recipes', {}, true);
}

export async function saveRecipe(recipeData: any) {
  return apiCall('/recipes', {
    method: 'POST',
    body: JSON.stringify(recipeData),
  }, true);
}

export async function removeSavedRecipe(id: string) {
  return apiCall(`/recipes/${id}`, {
    method: 'DELETE',
  }, true);
}

export async function checkRecipeSaved(recipeId: string) {
  return apiCall(`/recipes/check/${recipeId}`, {}, true);
}

export async function getRecipesByCategory(category: string) {
  return apiCall(`/recipes/category/${category}`, {}, true);
}

export async function addCookingHistory(historyData: any) {
  return apiCall('/recipes/history', {
    method: 'POST',
    body: JSON.stringify(historyData),
  }, true);
}

export async function getCookingHistory(limit: number = 50) {
  return apiCall(`/recipes/history?limit=${limit}`, {}, true);
}

// ============================================
// PUBLIC RECIPES API (식약처 기반)
// ============================================

export async function getPublicRecipes(params?: {
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const queryParams = new URLSearchParams();
  if (params?.category) queryParams.append('category', params.category);
  if (params?.search) queryParams.append('search', params.search);
  if (params?.limit) queryParams.append('limit', params.limit.toString());
  if (params?.offset) queryParams.append('offset', params.offset.toString());
  
  return apiCall(`/recipes/public?${queryParams.toString()}`, {}, false);
}

export async function getRecipeDetail(recipeId: string) {
  return apiCall(`/recipes/detail/${recipeId}`, {}, false);
}

export async function crawlRecipes() {
  return apiCall('/recipes/crawl', { method: 'POST' }, false);
}

// ============================================
// COOKING SESSION API
// ============================================

export async function startCookingSession(recipeId: string, recipeName: string) {
  return apiCall('/recipes/session/start', {
    method: 'POST',
    body: JSON.stringify({ recipe_id: recipeId, recipe_name: recipeName }),
  }, true);
}

export async function finishCookingSession(sessionId: string, rating?: number, memo?: string) {
  return apiCall(`/recipes/session/finish/${sessionId}`, {
    method: 'PUT',
    body: JSON.stringify({ rating, memo }),
  }, true);
}

export async function getActiveCookingSession() {
  return apiCall('/recipes/session/active', {}, true);
}

// ============================================
// INGREDIENTS EXPIRY NOTIFICATIONS
// ============================================

export async function getExpiryNotifications() {
  return apiCall('/ingredients/notifications/expiry', {}, true);
}

export async function aiRegisterIngredient(imageBase64: string) {
  return apiCall('/ingredients/ai-register', {
    method: 'POST',
    body: JSON.stringify({ image: imageBase64 }),
  }, true);
}

// ============================================
// AI VOICE ASSISTANT API
// ============================================

export async function speechToText(
  audioBlob: Blob, 
  currentStep?: string, 
  recipeName?: string
) {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  if (currentStep) formData.append('currentStep', currentStep);
  if (recipeName) formData.append('recipeName', recipeName);

  const token = getAuthToken();
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/ai/stt`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Speech to text failed');
    }

    return data;
  } catch (error) {
    console.error('STT API Error:', error);
    throw error;
  }
}

export async function textToSpeech(text: string) {
  return apiCall('/ai/tts', {
    method: 'POST',
    body: JSON.stringify({ text }),
  }, true);
}

export async function checkAIHealth() {
  return apiCall('/ai/health', {}, true);
}

// ============================================
// HEALTH CHECK
// ============================================

export async function healthCheck() {
  try {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return await response.json();
  } catch (error) {
    console.error('Health check failed:', error);
    throw error;
  }
}

// ============================================
// Compatibility Layer (기존 코드와 호환)
// ============================================

// signUp, login, getCurrentUser는 이미 위에서 export됨
// 추가 별칭만 제공
export const signIn = login;
export const getUser = getCurrentUser;