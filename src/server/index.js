import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import profileRoutes from './routes/profile.js';
import ingredientsRoutes from './routes/ingredients.js';
import recipesRoutes from './routes/recipes.js';
import aiRoutes from './routes/ai.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// Middleware
// ============================================

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// Routes
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Cooking Assistant API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Cooking Assistant API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      auth: '/api/auth',
      profile: '/api/profile',
      ingredients: '/api/ingredients',
      recipes: '/api/recipes',
      ai: '/api/ai',
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/ingredients', ingredientsRoutes);
app.use('/api/recipes', recipesRoutes);
app.use('/api/ai', aiRoutes);

// ============================================
// Error Handling
// ============================================

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.url} not found`,
    path: req.path,
    method: req.method,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log('\n🚀 ================================================');
  console.log('   Cooking Assistant API Server');
  console.log('================================================');
  console.log(`📡 Server running on: http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 OpenAI API: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log(`🔑 Google API: ${process.env.GOOGLE_CLOUD_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
  console.log('================================================\n');
  console.log('📚 Available endpoints:');
  console.log('   GET  /health');
  console.log('   POST /api/auth/signup');
  console.log('   POST /api/auth/login');
  console.log('   GET  /api/auth/me');
  console.log('   GET  /api/profile');
  console.log('   PUT  /api/profile');
  console.log('   GET  /api/ingredients');
  console.log('   POST /api/ingredients');
  console.log('   GET  /api/recipes');
  console.log('   POST /api/recipes');
  console.log('   POST /api/ai/stt');
  console.log('   POST /api/ai/tts');
  console.log('================================================\n');
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

export default app;
