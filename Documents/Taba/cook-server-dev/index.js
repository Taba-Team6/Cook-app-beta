// ================================
// 📌 통합 서버 index.js (CORS 완벽 해결 버전)
// ================================
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// 기존 서버 라우트
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import ingredientsRoutes from './routes/ingredients.js';
import recipesRoutes from './routes/recipes.js';
import aiRoutes from './routes/ai.js';

// 🔥 새로 추가될 라우트들
import sttRoutes from './routes/sttRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// Middleware
// ============================================

// [수정 핵심] .env 설정과 상관없이 안드로이드/iOS 필수 주소를 강제로 포함시킵니다.
const defaultOrigins = [
  'http://localhost:5173',      // 리액트 웹
  'http://localhost:3000',      // 로컬 테스트
  'http://localhost',           // 👈 안드로이드(Capacitor) 필수
  'capacitor://localhost',      // 👈 iOS(Capacitor) 필수
  'http://10.0.2.2:3001'        // 👈 에뮬레이터 필수
];

// .env에 설정된 ORIGIN이 있다면 가져오고, 없으면 빈 배열
const envOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',')
    : [];

// 두 리스트를 합치고 중복 제거 (Set 사용)
const allowedOrigins = [...new Set([...defaultOrigins, ...envOrigins])];

app.use(cors({
  origin: (origin, callback) => {
    // origin이 없는 경우(Postman, 서버 간 통신 등)는 허용
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('🚫 Blocked by CORS. Origin:', origin);
      console.log('✅ Allowed Origins:', allowedOrigins); // 디버깅용 출력
      callback(new Error(`Not allowed by CORS (Origin: ${origin})`));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

process.env.NODE_ENV !== 'production'
    ? app.use(morgan('dev'))
    : app.use(morgan('combined'));

// ============================================
// Routes
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Cooking Assistant API is running',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Cooking Assistant API',
    version: '1.0.0',
    status: 'running',
  });
});

app.use('/api/voice', sttRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ingredients', ingredientsRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api', aiRoutes);

// ============================================
// Error Handling
// ============================================

app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.url} not found`,
  });
});

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
  });
});

// ============================================
// Start Server
// ============================================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`✅ CORS Allowed Origins:`, allowedOrigins); // 서버 시작 시 허용 목록 출력
  console.log(`🔑 OpenAI: ${process.env.OPENAI_API_KEY ? "OK" : "X"}`);
});

export default app;