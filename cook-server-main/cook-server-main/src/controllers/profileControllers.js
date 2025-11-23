// src/controllers/profileControllers.js
const User = require('../models/User');

// @desc    프로필 정보 가져오기
// @route   GET /profile
exports.getProfile = async (req, res) => { //
    try {
        // 인증 미들웨어에서 req.user에 사용자 정보가 담겨 있습니다.
        const user = req.user;

        // 민감한 정보(비밀번호)가 이미 제외된 상태로 가정
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    프로필 정보 업데이트
// @route   PUT /profile
exports.updateProfile = async (req, res) => { //
    const { name, preferences } = req.body; // 클라이언트에서 profileData를 JSON 형태로 보냄
    const userId = req.user._id;

    try {
        // 비밀번호를 제외한 정보만 업데이트 (비밀번호 변경은 별도의 엔드포인트가 바람직함)
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, preferences },
            { new: true, runValidators: true } // 업데이트된 문서를 반환하고 스키마 유효성 검사 실행
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        // Validation Error 처리
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(val => val.message);
            return res.status(400).json({ success: false, error: messages.join(', ') });
        }
        res.status(500).json({ success: false, error: error.message });
    }
};