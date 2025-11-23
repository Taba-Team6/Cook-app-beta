// src/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name'],
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
            'Please use a valid email address',
        ],
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false, // 기본적으로 쿼리에서 제외
    },
    preferences: { // updateProfile에서 사용할 수 있는 필드
        type: [String], // 예: vegetarian, gluten-free
        default: [],
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// 비밀번호 해싱 미들웨어
UserSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

// 비밀번호 일치 확인 메소드
UserSchema.methods.matchPassword = async function (enteredPassword) {
    // 저장된 비밀번호가 select: false이므로, 이 메소드 사용 전에 select 해야 할 수 있습니다.
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);