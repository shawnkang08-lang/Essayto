import { Router, Request, Response, NextFunction } from 'express';
import { ProgressService } from '../services/ProgressService.js';
import { AuthService } from '../services/AuthService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { CacheService } from '../config/redis.js';
import { authenticate } from '../middleware/auth.js';
import { ValidationError } from '../types/errors.js';
import { z } from 'zod';

const trendsSchema = z.object({
  days: z.string().optional().default('30'),
});

export function createProgressRouter(cacheService?: CacheService): Router {
  const router = Router();
  const progressService = new ProgressService();

  // Initialize auth service for middleware
  const userRepository = new UserRepository();
  const authService = new AuthService(userRepository, cacheService);

  // All routes require authentication
  router.use(authenticate(authService));

  // GET /api/progress - Get user progress summary
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const progress = await progressService.getUserProgress(req.user.id);

      res.status(200).json({
        data: progress,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/progress/trends - Get score trends over time
  router.get('/trends', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const validatedQuery = trendsSchema.parse(req.query);
      const days = Math.min(parseInt(validatedQuery.days), 365); // Max 1 year

      const trends = await progressService.getScoreTrends(req.user.id, days);

      res.status(200).json({
        data: {
          trends,
          period: `${days} days`,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid query parameters',
            details: error.errors,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        next(error);
      }
    }
  });

  // GET /api/progress/weaknesses - Get identified weaknesses
  router.get('/weaknesses', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const progress = await progressService.getUserProgress(req.user.id);

      res.status(200).json({
        data: {
          weaknesses: progress.weaknesses,
          totalEssays: progress.totalEssays,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/progress/achievements - Get earned achievements
  router.get('/achievements', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const progress = await progressService.getUserProgress(req.user.id);

      res.status(200).json({
        data: {
          achievements: progress.achievements,
          count: progress.achievements.length,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/progress/snapshot - Create progress snapshot (manual trigger)
  router.post('/snapshot', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      await progressService.createSnapshot(req.user.id);

      res.status(201).json({
        data: { message: 'Progress snapshot created successfully' },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
