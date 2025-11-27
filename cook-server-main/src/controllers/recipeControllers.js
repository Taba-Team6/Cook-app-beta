// src/controllers/recipeController.js
const recipeService = require('../services/recipeService');

// @desc    모든 레시피 가져오기
// @route   GET /api/recipes
exports.getAllRecipes = async (req, res) => {
    try {
        const recipes = await recipeService.findAllRecipes();
        res.status(200).json({ success: true, count: recipes.length, data: recipes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    특정 레시피 가져오기
// @route   GET /api/recipes/:id
exports.getRecipeById = async (req, res) => {
    try {
        const recipe = await recipeService.findRecipeById(req.params.id);

        if (!recipe) {
            return res.status(404).json({ success: false, error: 'Recipe not found' });
        }
        res.status(200).json({ success: true, data: recipe });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(400).json({ success: false, error: 'Invalid Recipe ID format' });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    새 레시피 생성
// @route   POST /api/recipes
exports.createRecipe = async (req, res) => {
    try {
        const recipe = await recipeService.createRecipe(req.body);
        res.status(201).json({ success: true, data: recipe });
    } catch (error) {
        // Validation Error 처리
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// ... (getAllRecipes, getRecipeById, createRecipe 함수 정의 부분 생략)

// @desc    레시피 업데이트
// @route   PUT /api/recipes/:id
exports.updateRecipe = async (req, res) => { // <-- 반드시 'exports.'가 붙어 있어야 합니다.
    try {
        const recipe = await recipeService.updateRecipe(req.params.id, req.body);

        if (!recipe) {
            return res.status(404).json({ success: false, error: 'Recipe not found' });
        }
        res.status(200).json({ success: true, data: recipe });
    } catch (error) {
        // ... 에러 처리 로직 ...
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    레시피 삭제
// @route   DELETE /api/recipes/:id
exports.deleteRecipe = async (req, res) => { // <-- 반드시 'exports.'가 붙어 있어야 합니다.
    try {
        const recipe = await recipeService.deleteRecipe(req.params.id);

        if (!recipe) {
            return res.status(404).json({ success: false, error: 'Recipe not found' });
        }
        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};