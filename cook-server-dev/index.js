console.log("✅ RECEIPT ROUTES INDEX LOADED");

// ================================
// 📌 통합 서버 index.js (완전본)
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

// 🔥 새로 추가될 라우트들 (두번째 서버)
import sttRoutes from './routes/sttRoutes.js';
import receiptRoutes from './routes/receiptRoutes.js';
import completedRecipesRoutes from './routes/completedRecipes.js';
//import savedRecipeRoutes from './routes/savedRecipeRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// Middleware
// ============================================

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error('Not allowed by CORS'));
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

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cooking Assistant API',
    version: '1.0.0',
    status: 'running',
  });
});

// 🔥 STT API (두 번째 서버에서 가져온 것)
app.use('/api/voice', sttRoutes);

// 기존 API
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ingredients', ingredientsRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api', aiRoutes);

// 🔥 영수증 OCR + 자동 재료 등록
app.use('/api/receipt', receiptRoutes);

// 🔥 완료한 요리
app.use('/api/completed-recipes', completedRecipesRoutes);

// 🔥 saved recipes
//app.use('/api/saved-recipes', savedRecipeRoutes);


// ============================================
// Error Handling
// ============================================

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.url} not found`,
  });
});

// Global Error Handler
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
  console.log(`🔑 OpenAI: ${process.env.OPENAI_API_KEY ? "OK" : "X"}`);
  console.log(`🔑 JWT: ${process.env.JWT_SECRET ? "OK" : "X"}`);
});

export default app;
