import jwt from 'jsonwebtoken';
import { UserRepository } from '../repositories/UserRepository.js';
import { User, CreateUserDto, toUserResponse, UserResponse } from '../models/User.js';
import { AuthenticationError, ValidationError } from '../types/errors.js';
import { CacheService } from '../config/redis.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '1h';
const JWT_REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

export interface TokenPayload {
  userId: string;
  email: string;
  type: 'access' | 'refresh';
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface LoginResponse {
  user: UserResponse;
  tokens: AuthTokens;
}

export class AuthService {
  private userRepository: UserRepository;
  private cacheService: CacheService | null;

  constructor(userRepository: UserRepository, cacheService?: CacheService) {
    this.userRepository = userRepository;
    this.cacheService = cacheService || null;
  }

  // Generate JWT token
  private generateToken(payload: TokenPayload, expiresIn: string): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
  }

  // Verify JWT token
  verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired token');
    }
  }

  // Generate access and refresh tokens
  private generateTokens(user: User): AuthTokens {
    const accessPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      type: 'access',
    };

    const refreshPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      type: 'refresh',
    };

    const accessToken = this.generateToken(accessPayload, JWT_ACCESS_EXPIRY);
    const refreshToken = this.generateToken(refreshPayload, JWT_REFRESH_EXPIRY);

    // Calculate expiry in seconds
    const expiresIn = this.parseExpiry(JWT_ACCESS_EXPIRY);

    return {
      accessToken,
      refreshToken,
      expiresIn,
    };
  }

  // Parse expiry string to seconds
  private parseExpiry(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) return 3600; // Default 1 hour

    const value = parseInt(match[1]);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return 3600;
    }
  }

  // Register new user
  async register(data: CreateUserDto): Promise<LoginResponse> {
    // Create user
    const user = await this.userRepository.create(data);

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Cache refresh token
    if (this.cacheService) {
      await this.cacheService.set(
        `refresh_token:${user.id}`,
        tokens.refreshToken,
        this.parseExpiry(JWT_REFRESH_EXPIRY)
      );
    }

    return {
      user: toUserResponse(user),
      tokens,
    };
  }

  // Login user
  async login(email: string, password: string): Promise<LoginResponse> {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.userRepository.verifyPassword(password, user.passwordHash);
    if (!isValidPassword) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Cache refresh token
    if (this.cacheService) {
      await this.cacheService.set(
        `refresh_token:${user.id}`,
        tokens.refreshToken,
        this.parseExpiry(JWT_REFRESH_EXPIRY)
      );
    }

    return {
      user: toUserResponse(user),
      tokens,
    };
  }

  // Refresh access token
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    // Verify refresh token
    const payload = this.verifyToken(refreshToken);

    if (payload.type !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }

    // Check if refresh token is cached (not revoked)
    if (this.cacheService) {
      const cachedToken = await this.cacheService.get<string>(`refresh_token:${payload.userId}`);
      if (cachedToken !== refreshToken) {
        throw new AuthenticationError('Token has been revoked');
      }
    }

    // Get user
    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Update cached refresh token
    if (this.cacheService) {
      await this.cacheService.set(
        `refresh_token:${user.id}`,
        tokens.refreshToken,
        this.parseExpiry(JWT_REFRESH_EXPIRY)
      );
    }

    return tokens;
  }

  // Logout user
  async logout(userId: string): Promise<void> {
    // Remove refresh token from cache
    if (this.cacheService) {
      await this.cacheService.delete(`refresh_token:${userId}`);
    }
  }

  // Verify access token and get user
  async verifyAccessToken(token: string): Promise<User> {
    const payload = this.verifyToken(token);

    if (payload.type !== 'access') {
      throw new AuthenticationError('Invalid token type');
    }

    const user = await this.userRepository.findById(payload.userId);
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    return user;
  }

  // Delete user account
  async deleteAccount(userId: string): Promise<void> {
    // Logout user (revoke tokens)
    await this.logout(userId);

    // Delete user
    await this.userRepository.delete(userId);
  }
}
