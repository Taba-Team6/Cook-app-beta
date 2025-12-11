export interface Recipe {
  // AI 전용 필드
  recipeName?: string;           // GPT가 줄 때 name 대신 씀
  fullIngredients?: string[];    // GPT가 줄 때 전체 재료 텍스트 배열
  // 💡 [추가] AI 생성 여부 플래그 (ID 10000+인 경우 true)
  is_generated?: boolean; 

  // 공통 필드
  id: string;
  name: string;
  description?: string | null;
  image?: string | null;

  category?: string | null;

  // 요리 정보 (AI/DB 모두 optional)
  cookingTime?: number | string | null;
  servings?: number | string | null;
  difficulty?: string | null;

  // DB용 (optional로 변경)
  calories?: number | null;

  // 재료
  ingredients?: { 
    name: string; 
    amount: string; 
    hasIt?: boolean;        // AI/DB 차이 해결: optional로 변경
  }[];

  // 조리 단계
  steps?: string[];

  // 팁
  tips?: string[];

  // 영양 정보 (optional로 변경)
  nutrition?: { 
    protein?: number; 
    carbs?: number; 
    fat?: number; 
  };
}

// 💡 [추가] 하이브리드 추천 목록 아이템 타입
export interface AiRecommendation {
    id: string; // 레시피 ID (DB ID 또는 10000+ 임시 ID)
    name: string; // 레시피 이름
    isGpt: boolean; // GPT가 생성한 임시 레시피인지 여부 (UI에서 강조 표시용)
}