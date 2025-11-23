// src/utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    // JWT_SECRET 환경 변수는 .env 파일에 정의되어야 합니다.
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

module.exports = generateToken;