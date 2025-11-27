// src/controllers/ingredientControllers.js
const Ingredient = require('../models/Ingredient');
const mongoose = require('mongoose');

// @desc    사용자의 모든 재료 가져오기
// @route   GET /ingredients
exports.getIngredients = async (req, res) => { //
    try {
        const ingredients = await Ingredient.find({ user: req.user._id });

        res.status(200).json({ success: true, count: ingredients.length, data: ingredients });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    새 재료 추가
// @route   POST /ingredients
exports.addIngredient = async (req, res) => { //
    try {
        const ingredientData = {
            ...req.body,
            user: req.user._id, // 인증된 사용자 ID를 재료에 연결
        };

        const ingredient = await Ingredient.create(ingredientData);

        res.status(201).json({ success: true, data: ingredient });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    특정 재료 업데이트
// @route   PUT /ingredients/:id
exports.updateIngredient = async (req, res) => { //
    const { id } = req.params;
    const ingredientData = req.body; // 클라이언트에서 ingredientData를 JSON 형태로 보냄

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, error: 'Invalid Ingredient ID format' });
    }

    try {
        // 사용자 ID와 재료 ID를 모두 확인하여 본인 소유의 재료만 수정 가능
        const ingredient = await Ingredient.findOneAndUpdate(
            { _id: id, user: req.user._id },
            ingredientData,
            { new: true, runValidators: true }
        );

        if (!ingredient) {
            return res.status(404).json({ success: false, error: 'Ingredient not found or unauthorized' });
        }

        res.status(200).json({ success: true, data: ingredient });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    특정 재료 삭제
// @route   DELETE /ingredients/:id
exports.deleteIngredient = async (req, res) => { //
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, error: 'Invalid Ingredient ID format' });
    }

    try {
        // 사용자 ID와 재료 ID를 모두 확인하여 본인 소유의 재료만 삭제 가능
        const ingredient = await Ingredient.findOneAndDelete({ _id: id, user: req.user._id });

        if (!ingredient) {
            return res.status(404).json({ success: false, error: 'Ingredient not found or unauthorized' });
        }

        res.status(200).json({ success: true, data: {} });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};