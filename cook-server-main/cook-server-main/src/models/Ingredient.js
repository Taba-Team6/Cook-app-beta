// src/models/Ingredient.js
const mongoose = require('mongoose');

const IngredientSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    name: {
        type: String,
        required: [true, 'Please add an ingredient name'],
        trim: true,
        maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    quantity: {
        type: Number,
        default: 1,
    },
    unit: {
        type: String,
        trim: true,
        maxlength: [20, 'Unit cannot be more than 20 characters'],
    },
    expiryDate: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Ingredient', IngredientSchema);