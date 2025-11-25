import { Router, Request, Response, NextFunction } from 'express';
import { LanguageDetectionService } from '../services/LanguageDetectionService.js';
import { z } from 'zod';

// Validation schemas
const detectSchema = z.object({
  text: z.string().min(10, 'Text must be at least 10 characters long'),
  manualLanguage: z.enum(['id', 'zh', 'en']).optional(),
});

export function createLanguageRouter(): Router {
  const router = Router();
  const languageService = new LanguageDetectionService();

  // POST /api/language/detect - Detect language from text
  router.post('/detect', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validatedData = detectSchema.parse(req.body);

      // Detect language
      const result = languageService.detect(validatedData.text);

      res.status(200).json({
        data: {
          detected: result,
          override: validatedData.manualLanguage || null,
          final: languageService.detectWithFallback(
            validatedData.text,
            validatedData.manualLanguage
          ),
        },
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

  // POST /api/language/detect-multiple - Detect multiple languages in text
  router.post('/detect-multiple', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validatedData = z
        .object({
          text: z.string().min(10, 'Text must be at least 10 characters long'),
        })
        .parse(req.body);

      // Detect multiple languages
      const results = languageService.detectMultiple(validatedData.text);

      res.status(200).json({
        data: {
          languages: results,
          primary: results[0]?.language || 'en',
        },
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

  // GET /api/language/supported - Get list of supported languages
  router.get('/supported', (_req: Request, res: Response) => {
    const languages = languageService.getSupportedLanguages();

    res.status(200).json({
      data: {
        languages,
        count: languages.length,
      },
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}
