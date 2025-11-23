// src/controllers/authControllers.js
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    회원가입
// @route   POST /signup
exports.signUp = async (req, res) => { //
    const { email, password, name } = req.body; //

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400).json({ success: false, error: 'User already exists' });
            return;
        }

        const user = await User.create({ name, email, password }); // 비밀번호는 pre-save 미들웨어에서 해싱됨

        if (user) {
            res.status(201).json({
                success: true,
                data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    token: generateToken(user._id),
                },
            });
        } else {
            res.status(400).json({ success: false, error: 'Invalid user data' });
        }
    } catch (error) {
        // Validation Error 처리 (예시)
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    로그인 (클라이언트의 토큰 획득을 위해 필요)
// @route   POST /login
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 비밀번호 조회를 위해 select('+password') 사용
        const user = await User.findOne({ email }).select('+password');

        if (user && (await user.matchPassword(password))) {
            res.status(200).json({
                success: true,
                data: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    token: generateToken(user._id),
                },
            });
        } else {
            res.status(401).json({ success: false, error: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};