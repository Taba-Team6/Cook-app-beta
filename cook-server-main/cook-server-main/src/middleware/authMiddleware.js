// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // 토큰 추출 (Bearer token에서 'Bearer '를 제거)
            token = req.headers.authorization.split(' ')[1];

            // 토큰 검증 및 디코드
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // 디코드된 사용자 ID로 사용자 조회 (비밀번호 제외)
            req.user = await User.findById(decoded.id).select('-password');

            if (!req.user) {
                res.status(401).json({ success: false, error: 'Not authorized, user not found' });
                return;
            }

            next();
        } catch (error) {
            console.error(error);
            res.status(401).json({ success: false, error: 'Not authorized, token failed' });
            return;
        }
    }

    if (!token) {
        // 클라이언트 api.ts의 requiresAuth: false 로직을 위해 publicAnonKey를 처리하는 로직을 가정
        // 여기서는 실제 인증이 필요한 경우 토큰이 없는 경우 401을 반환합니다.
        res.status(401).json({ success: false, error: 'Not authorized, no token' });
    }
};

module.exports = { protect };