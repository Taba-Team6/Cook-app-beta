// src/routes/recipeRoutes.js
const express = require('express');
const {
    getAllRecipes,
    getRecipeById,
    createRecipe,
    updateRecipe,
    deleteRecipe
} = require('../controllers/recipeControllers');

const router = express.Router();

// GET /api/recipes (모든 레시피), POST /api/recipes (새 레시피 생성)
router.route('/').get(getAllRecipes).post(createRecipe);

// GET, PUT, DELETE /api/recipes/:id (특정 레시피 조회, 업데이트, 삭제)
router.route('/:id').get(getRecipeById).put(updateRecipe).delete(deleteRecipe);

module.exports = router;