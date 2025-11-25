import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService.js';
import { UserRepository } from '../repositories/UserRepository.js';
import { AuthenticationError } from '../types/errors.js';
import { User } from '../models/User.js';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

// Authentication middleware
export function authenticate(authService: AuthService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new AuthenticationError('No token provided');
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix

      // Verify token and get user
      const user = await authService.verifyAccessToken(token);

      // Attach user to request
      req.user = user;

      next();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        res.status(401).json({
          error: {
            code: 'AUTHENTICATION_ERROR',
            message: error.message,
            timestamp: new Date().toISOString(),
          },
        });
      } else {
        next(error);
      }
    }
  };
}

// Optional authentication middleware (doesn't fail if no token)
export function optionalAuthenticate(authService: AuthService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const user = await authService.verifyAccessToken(token);
        req.user = user;
      }
      next();
    } catch (error) {
      // Silently fail for optional auth
      next();
    }
  };
}
