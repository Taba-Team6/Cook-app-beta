// src/models/SavedRecipe.js
const mongoose = require('mongoose');

const SavedRecipeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    // 클라이언트에서 전달된 레시피 데이터 (유연한 구조를 위해 Mixed 타입 사용)
    recipeData: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Please provide recipe data'],
    },
    // 검색 및 표시를 위해 몇 가지 필드를 중복 저장
    recipeId: {
        type: String,
        required: [true, 'Please provide a recipe ID'],
        unique: true,
    },
    recipeTitle: {
        type: String,
        required: [true, 'Please provide a recipe title'],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('SavedRecipe', SavedRecipeSchema);