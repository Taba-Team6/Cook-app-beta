export interface Recipe {
  // AI 전용 필드
  recipeName?: string;           // GPT가 줄 때 name 대신 씀
  fullIngredients?: string[];    // GPT가 줄 때 전체 재료 텍스트 배열

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
    hasIt?: boolean;        // AI/DB 차이 해결: optional로 변경
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
