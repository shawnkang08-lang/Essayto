import { Router, Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { CacheService } from '../config/redis.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { ValidationError } from '../types/errors.js';
import { z } from 'zod';

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  username: z.string().min(2, 'Username must be at least 2 characters').max(100),
  preferredLanguage: z.enum(['id', 'zh', 'en']).optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export function createAuthRouter(
  userRepository: UserRepository,
  cacheService?: CacheService
): Router {
  const router = Router();
  const authService = new AuthService(userRepository, cacheService);

  // POST /api/auth/register - Register new user
  router.post(
    '/register',
    authLimiter,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Validate request body
        const validatedData = registerSchema.parse(req.body);

        // Register user
        const result = await authService.register(validatedData);

        res.status(201).json({
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
    }
  );

  // POST /api/auth/login - Login user
  router.post(
    '/login',
    authLimiter,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Validate request body
        const validatedData = loginSchema.parse(req.body);

        // Login user
        const result = await authService.login(validatedData.email, validatedData.password);

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
    }
  );

  // POST /api/auth/refresh - Refresh access token
  router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request body
      const validatedData = refreshSchema.parse(req.body);

      // Refresh token
      const tokens = await authService.refreshToken(validatedData.refreshToken);

      res.status(200).json({
        data: tokens,
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

  // POST /api/auth/logout - Logout user
  router.post(
    '/logout',
    authenticate(authService),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new ValidationError('User not authenticated');
        }

        // Logout user
        await authService.logout(req.user.id);

        res.status(200).json({
          data: { message: 'Logged out successfully' },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // DELETE /api/auth/account - Delete user account (GDPR compliance)
  router.delete(
    '/account',
    authenticate(authService),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new ValidationError('User not authenticated');
        }

        // Delete account
        await authService.deleteAccount(req.user.id);

        res.status(200).json({
          data: { message: 'Account deleted successfully' },
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // GET /api/auth/me - Get current user
  router.get(
    '/me',
    authenticate(authService),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        if (!req.user) {
          throw new ValidationError('User not authenticated');
        }

        const { passwordHash, ...userWithoutPassword } = req.user;

        res.status(200).json({
          data: userWithoutPassword,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}
