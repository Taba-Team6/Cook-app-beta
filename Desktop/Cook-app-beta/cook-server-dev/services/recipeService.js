// src/services/recipeService.js
import Recipe from "../models/Recipe.js";

class RecipeService {
  // 모든 레시피 조회
  async findAllRecipes() {
    return await Recipe.find({});
  }

  // 특정 ID로 레시피 조회
  async findRecipeById(id) {
    return await Recipe.findById(id);
  }

  // 새 레시피 생성
  async createRecipe(recipeData) {
    return await Recipe.create(recipeData);
  }

  // 레시피 업데이트
  async updateRecipe(id, recipeData) {
    const recipe = await Recipe.findByIdAndUpdate(id, recipeData, {
      new: true,           // 업데이트된 문서를 반환
      runValidators: true, // 스키마 유효성 검사 실행
    });
    return recipe;
  }

  // 레시피 삭제
  async deleteRecipe(id) {
    return await Recipe.findByIdAndDelete(id);
  }
}

export default new RecipeService();
