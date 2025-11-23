// src/routes/ingredientRoutes.js
const express = require('express');
const {
    getIngredients,
    addIngredient,
    updateIngredient,
    deleteIngredient
} = require('../controllers/ingredientControllers');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// 모든 재료 관련 경로는 인증이 필요합니다.
router.route('/')
    .get(protect, getIngredients) //
    .post(protect, addIngredient); //

router.route('/:id')
    .put(protect, updateIngredient) //
    .delete(protect, deleteIngredient); //

module.exports = router;