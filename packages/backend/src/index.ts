import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { connectDatabase } from './config/database.js';
import { connectRedis, CacheService, getRedisClient } from './config/redis.js';
import { UserRepository } from './repositories/UserRepository.js';
import { createAuthRouter } from './routes/auth.js';
import { createLanguageRouter } from './routes/language.js';
import { createEssayRouter } from './routes/essays.js';
import { createProgressRouter } from './routes/progress.js';
import { createTopicRouter } from './routes/topics.js';
import { createTranslateRouter } from './routes/translate.js';
import { apiLimiter } from './middleware/rateLimit.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
if (NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    uptime: process.uptime(),
  });
});

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// API routes placeholder
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'PAPERPAL API v1.0.0',
    version: '1.0.0',
    documentation: '/api/docs',
  });
});

// Initialize services and routes
async function initializeApp() {
  try {
    // Connect to database
    await connectDatabase();

    // Connect to Redis (optional - app will work without it)
    let cacheService: CacheService | undefined;
    try {
      const redisClient = await connectRedis();
      cacheService = new CacheService(redisClient);
    } catch (error) {
      console.warn('⚠️  Redis connection failed, continuing without cache');
    }

    // Initialize repositories
    const userRepository = new UserRepository();

    // Mount routes
    app.use('/api/auth', createAuthRouter(userRepository, cacheService));
    app.use('/api/language', createLanguageRouter());
    app.use('/api/essays', createEssayRouter(cacheService));
    app.use('/api/progress', createProgressRouter(cacheService));
    app.use('/api/topics', createTopicRouter(cacheService));
    app.use('/api/translate', createTranslateRouter(cacheService));

    // 404 handler - MUST be after routes
    app.use((_req: Request, res: Response) => {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'The requested resource was not found',
          timestamp: new Date().toISOString(),
        },
      });
    });

    // Global error handling middleware
    app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Error:', err.message);
      console.error('Stack:', err.stack);

      const statusCode = (err as any).statusCode || 500;
      const errorCode = (err as any).code || 'INTERNAL_SERVER_ERROR';

      res.status(statusCode).json({
        error: {
          code: errorCode,
          message: NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
          ...(NODE_ENV === 'development' && { stack: err.stack }),
        },
      });
    });

    console.log('✅ Application initialized successfully');
    console.log('✅ All routes mounted');
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Initialize and start server
async function startServer() {
  await initializeApp();
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 PAPERPAL API server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🌍 Environment: ${NODE_ENV}`);
  });
  
  return server;
}

startServer();

export default app;
