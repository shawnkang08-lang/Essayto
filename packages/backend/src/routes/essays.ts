import { Router, Request, Response, NextFunction } from 'express';
import { EssayService } from '../services/EssayService.js';
import { EssayRepository } from '../repositories/EssayRepository.js';
import { CorrectionService } from '../services/CorrectionService.js';
import { LLMClient } from '../services/LLMClient.js';
import { CacheService } from '../config/redis.js';
import { AuthService } from '../services/AuthService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { authenticate } from '../middleware/auth.js';
import { essayLimiter } from '../middleware/rateLimit.js';
import { ValidationError } from '../types/errors.js';
import { z } from 'zod';

// Validation schemas
const createDraftSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters').max(10000, 'Text cannot exceed 10,000 characters'),
  language: z.enum(['id', 'zh', 'en']).optional(),
  topic: z
    .object({
      title: z.string(),
      description: z.string(),
      mode: z.enum(['academic', 'professional', 'creative', 'exam']).optional(),
      difficulty: z.number().min(1).max(5).optional(),
    })
    .optional(),
});

const updateDraftSchema = z.object({
  text: z.string().min(10).max(10000).optional(),
  language: z.enum(['id', 'zh', 'en']).optional(),
  topic: z
    .object({
      title: z.string(),
      description: z.string(),
    })
    .optional(),
});

const listEssaysSchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('10'),
  language: z.enum(['id', 'zh', 'en']).optional(),
  status: z.enum(['draft', 'processing', 'completed', 'failed']).optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  minScore: z.string().optional(),
  maxScore: z.string().optional(),
  topic: z.string().optional(),
});

export function createEssayRouter(cacheService?: CacheService): Router {
  const router = Router();

  // Initialize services
  const essayRepository = new EssayRepository();
  const llmClient = new LLMClient(cacheService);
  const correctionService = new CorrectionService(llmClient);
  const essayService = new EssayService(essayRepository, correctionService);
  
  // Initialize auth service for middleware
  const userRepository = new UserRepository();
  const authService = new AuthService(userRepository, cacheService);

  // All routes require authentication
  router.use(authenticate(authService));

  // POST /api/essays/draft - Save essay draft
  router.post('/draft', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const validatedData = createDraftSchema.parse(req.body);

      const essay = await essayService.saveDraft({
        userId: req.user.id,
        originalText: validatedData.text,
        language: validatedData.language,
        topic: validatedData.topic,
      });

      res.status(201).json({
        data: essay,
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
  });

  // POST /api/essays/:id/submit - Submit essay for correction
  router.post('/:id/submit', essayLimiter, async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const essay = await essayService.submitEssay(req.params.id, req.user.id);

      res.status(200).json({
        data: essay,
        message: 'Essay submitted for processing',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/essays/:id - Get essay by ID
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const essay = await essayService.getEssay(req.params.id, req.user.id);

      res.status(200).json({
        data: essay,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/essays - List essays with filters
  router.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const validatedQuery = listEssaysSchema.parse(req.query);

      const filters: any = {
        userId: req.user.id,
      };

      if (validatedQuery.language) filters.language = validatedQuery.language;
      if (validatedQuery.status) filters.status = validatedQuery.status;
      if (validatedQuery.dateFrom) filters.dateFrom = new Date(validatedQuery.dateFrom);
      if (validatedQuery.dateTo) filters.dateTo = new Date(validatedQuery.dateTo);
      if (validatedQuery.minScore) filters.minScore = parseInt(validatedQuery.minScore);
      if (validatedQuery.maxScore) filters.maxScore = parseInt(validatedQuery.maxScore);
      if (validatedQuery.topic) filters.topic = validatedQuery.topic;

      const pagination = {
        page: parseInt(validatedQuery.page),
        limit: Math.min(parseInt(validatedQuery.limit), 50), // Max 50 per page
      };

      const result = await essayService.listEssays(filters, pagination);

      res.status(200).json({
        data: result.data,
        pagination: result.pagination,
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

  // PATCH /api/essays/:id - Update essay draft
  router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const validatedData = updateDraftSchema.parse(req.body);

      const essay = await essayService.updateDraft(req.params.id, req.user.id, {
        originalText: validatedData.text,
        language: validatedData.language,
        topic: validatedData.topic,
      });

      res.status(200).json({
        data: essay,
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
  });

  // DELETE /api/essays/:id - Delete essay
  router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      await essayService.deleteEssay(req.params.id, req.user.id);

      res.status(200).json({
        data: { message: 'Essay deleted successfully' },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/essays/stats/me - Get user statistics
  router.get('/stats/me', async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ValidationError('User not authenticated');
      }

      const stats = await essayService.getUserStats(req.user.id);

      res.status(200).json({
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
