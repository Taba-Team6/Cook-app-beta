// src/routes/savedRecipeRoutes.js
const express = require('express');
const {
    getSavedRecipes,
    saveRecipe,
    removeSavedRecipe
} = require('../controllers/savedRecipeControllers');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// 모든 저장된 레시피 관련 경로는 인증이 필요합니다.
router.route('/')
    .get(protect, getSavedRecipes) //
    .post(protect, saveRecipe); //

router.route('/:id')
    .delete(protect, removeSavedRecipe); //

module.exports = router;