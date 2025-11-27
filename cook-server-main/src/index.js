// src/index.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const aiRoutes = require('./routes/aiRoutes'); // gpt

// === 무조건 맨 위에서 환경변수 로딩 ===
// .env 위치 강제로 지정
dotenv.config({ path: __dirname + '/../.env' });

// 디버깅용 출력
console.log("JWT_SECRET:", process.env.JWT_SECRET);
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY);

// DB 모듈 로드
const { testConnection } = require('./config/db');

// 라우터 모듈 불러오기
const recipeRoutes = require('./routes/recipeRoutes');
const authRoutes = require('./routes/authRoutes'); 
const profileRoutes = require('./routes/profileRoutes');
const ingredientRoutes = require('./routes/ingredientRoutes');
const savedRecipeRoutes = require('./routes/savedRecipeRoutes');
const miscRoutes = require('./routes/miscRoutes');
const sttRoutes = require("./routes/sttRoutes");

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// ===============================
// 🚨 STT 라우트는 인증보다 먼저!
// ===============================
app.use("/api/voice", sttRoutes);

// 기본 라우트
app.get('/', (req, res) => {
    res.send('Cook Server API is running with MySQL! 🚀');
});

// ===============================
// 여기부터 인증 라우트들 (protect 걸림)
// ===============================
app.use('/api/recipes', recipeRoutes);
app.use('/api', miscRoutes);
app.use('/api', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ingredients', ingredientRoutes);
app.use('/api/saved-recipes', savedRecipeRoutes);

// GPT
app.use('/api', aiRoutes);

// 서버 시작
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
