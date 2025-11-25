import { Router, Request, Response, NextFunction } from 'express';
import { TopicGeneratorService } from '../services/TopicGeneratorService.js';
import { LLMClient } from '../services/LLMClient.js';
import { AuthService } from '../services/AuthService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { CacheService } from '../config/redis.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { ValidationError } from '../types/errors.js';
import { z } from 'zod';

const generateSchema = z.object({
  mode: z.enum(['academic', 'professional', 'creative', 'exam']),
  difficulty: z.number().min(1).max(5).optional(),
  language: z.enum(['id', 'zh', 'en']),
});

const historySchema = z.object({
  limit: z.string().optional().default('10'),
});

export function createTopicRouter(cacheService?: CacheService): Router {
  const router = Router();

  // Initialize services
  const llmClient = new LLMClient(cacheService);
  const topicService = new TopicGeneratorService(llmClient);
  const userRepository = new UserRepository();
  const authService = new AuthService(userRepository, cacheService);

  // POST /api/topics/generate - Generate personalized topic
  router.post(
    '/generate',
    optionalAuthenticate(authService),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validatedData = generateSchema.parse(req.body);

        const topic = await topicService.generateTopic({
          mode: validatedData.mode,
          difficulty: validatedData.difficulty,
          language: validatedData.language,
          userId: req.user?.id,
        });

        res.status(200).json({
          data: topic,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        if (error instanceof z.ZodError) {
          res.status(400).json({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid input data',
              details: error.errors,
              timestamp: new Date().toISOString(),
            },
          });
        } else {
          next(error);
        }
      }
    }
  );

  // GET /api/topics/history - Get topic history (requires auth)
  router.get(
    '/history',
    authenticate(authService),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new ValidationError('User not authenticated');
        }

        const validatedQuery = historySchema.parse(req.query);
        const limit = Math.min(parseInt(validatedQuery.limit), 50);

        const topics = await topicService.getTopicHistory(req.user.id, limit);

        res.status(200).json({
          data: {
            topics,
            count: topics.length,
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
    }
  );

  return router;
}
