import { Router, Request, Response, NextFunction } from 'express';
import { TranslationService } from '../services/TranslationService.js';
import { LLMClient } from '../services/LLMClient.js';
import { CacheService } from '../config/redis.js';
import { z } from 'zod';

const translateSchema = z.object({
  text: z.string().min(1, 'Text cannot be empty').max(10000, 'Text cannot exceed 10,000 characters'),
  sourceLanguage: z.enum(['id', 'zh', 'en']),
  targetLanguage: z.enum(['id', 'zh', 'en']),
});

export function createTranslateRouter(cacheService?: CacheService): Router {
  const router = Router();

  // Initialize services
  const llmClient = new LLMClient(cacheService);
  const translationService = new TranslationService(llmClient);

  // POST /api/translate - Translate text
  router.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = translateSchema.parse(req.body);

      const result = await translationService.translate({
        text: validatedData.text,
        sourceLanguage: validatedData.sourceLanguage,
        targetLanguage: validatedData.targetLanguage,
      });

      res.status(200).json({
        data: result,
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

  // GET /api/translate/languages - Get supported language pairs
  router.get('/languages', (_req: Request, res: Response) => {
    const pairs = translationService.getSupportedLanguagePairs();

    res.status(200).json({
      data: {
        pairs,
        count: pairs.length,
      },
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
