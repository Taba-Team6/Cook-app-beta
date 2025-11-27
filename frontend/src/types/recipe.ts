// src/types/recipe.ts

export interface Recipe {
  recipeName? : string;
  fullIngredients?: string[];
  id: string;
  name: string;
  description: string;
  image: string;
  cookingTime: number;
  servings: number;
  difficulty: string;
  calories: number;
  category: string;
  ingredients: { name: string; amount: string; hasIt: boolean }[];
  steps: string[];
  tips: string[];
  nutrition: { protein: number; carbs: number; fat: number };
}