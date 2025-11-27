// src/controllers/savedRecipeControllers.js
const SavedRecipe = require('../models/SavedRecipe');
const mongoose = require('mongoose');

// @desc    사용자의 모든 저장된 레시피 가져오기
// @route   GET /saved-recipes
exports.getSavedRecipes = async (req, res) => { //
    try {
        const savedRecipes = await SavedRecipe.find({ user: req.user._id });
        res.status(200).json({ success: true, count: savedRecipes.length, data: savedRecipes });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    레시피 저장
// @route   POST /saved-recipes
exports.saveRecipe = async (req, res) => { //
    // 클라이언트에서 recipeData를 JSON 형태로 보냄
    const { recipeData, recipeId, recipeTitle } = req.body;

    try {
        // 중복 저장을 방지하기 위해 recipeId와 user를 함께 확인 (선택 사항)
        const exists = await SavedRecipe.findOne({ user: req.user._id, recipeId });
        if (exists) {
            return res.status(409).json({ success: false, error: 'Recipe already saved' });
        }

        const savedRecipe = await SavedRecipe.create({
            user: req.user._id, // 인증된 사용자 ID를 레시피에 연결
            recipeData,
            recipeId,
            recipeTitle: recipeTitle || (recipeData.title ? recipeData.title : 'Untitled Recipe'), // 제목이 없으면 기본값 설정
        });

        res.status(201).json({ success: true, data: savedRecipe });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    저장된 레시피 제거
// @route   DELETE /saved-recipes/:id
exports.removeSavedRecipe = async (req, res) => { //
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, error: 'Invalid Saved Recipe ID format' });
    }

    try {
        // 사용자 ID와 레시피 ID를 모두 확인하여 본인 소유의 레시피만 삭제 가능
        const savedRecipe = await SavedRecipe.findOneAndDelete({ _id: id, user: req.user._id });

        if (!savedRecipe) {
            return res.status(404).json({ success: false, error: 'Saved Recipe not found or unauthorized' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};