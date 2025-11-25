import { pool } from '../config/database.js';
import { User, CreateUserDto, UpdateUserDto } from '../models/User.js';
import bcrypt from 'bcrypt';
import { NotFoundError, ValidationError } from '../types/errors.js';

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export class UserRepository {
  // Email validation
  private validateEmail(email: string): boolean {
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  }

  // Password validation
  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      throw new ValidationError('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      throw new ValidationError('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      throw new ValidationError('Password must contain at least one number');
    }
  }

  // Hash password
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  // Verify password
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  // Create user
  async create(data: CreateUserDto): Promise<User> {
    // Validate email
    if (!this.validateEmail(data.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate password
    this.validatePassword(data.password);

    // Check if email already exists
    const existingUser = await this.findByEmail(data.email);
    if (existingUser) {
      throw new ValidationError('Email already registered');
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Insert user
    const query = `
      INSERT INTO users (email, password_hash, username, preferred_language)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, password_hash as "passwordHash", username, 
                preferred_language as "preferredLanguage", created_at as "createdAt", 
                last_login_at as "lastLoginAt", settings
    `;

    const values = [
      data.email.toLowerCase(),
      passwordHash,
      data.username,
      data.preferredLanguage || 'en',
    ];

    const result = await pool.query<User>(query, values);
    return result.rows[0];
  }

  // Find user by ID
  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash as "passwordHash", username, 
             preferred_language as "preferredLanguage", created_at as "createdAt", 
             last_login_at as "lastLoginAt", settings
      FROM users
      WHERE id = $1
    `;

    const result = await pool.query<User>(query, [id]);
    return result.rows[0] || null;
  }

  // Find user by email
  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT id, email, password_hash as "passwordHash", username, 
             preferred_language as "preferredLanguage", created_at as "createdAt", 
             last_login_at as "lastLoginAt", settings
      FROM users
      WHERE email = $1
    `;

    const result = await pool.query<User>(query, [email.toLowerCase()]);
    return result.rows[0] || null;
  }

  // Update user
  async update(id: string, data: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.username !== undefined) {
      updates.push(`username = $${paramCount++}`);
      values.push(data.username);
    }

    if (data.preferredLanguage !== undefined) {
      updates.push(`preferred_language = $${paramCount++}`);
      values.push(data.preferredLanguage);
    }

    if (data.settings !== undefined) {
      updates.push(`settings = settings || $${paramCount++}::jsonb`);
      values.push(JSON.stringify(data.settings));
    }

    if (updates.length === 0) {
      return user;
    }

    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, email, password_hash as "passwordHash", username, 
                preferred_language as "preferredLanguage", created_at as "createdAt", 
                last_login_at as "lastLoginAt", settings
    `;

    const result = await pool.query<User>(query, values);
    return result.rows[0];
  }

  // Update last login
  async updateLastLogin(id: string): Promise<void> {
    const query = `
      UPDATE users
      SET last_login_at = NOW()
      WHERE id = $1
    `;

    await pool.query(query, [id]);
  }

  // Delete user
  async delete(id: string): Promise<void> {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);

    if (result.rowCount === 0) {
      throw new NotFoundError('User not found');
    }
  }

  // Check if user exists
  async exists(id: string): Promise<boolean> {
    const result = await pool.query('SELECT 1 FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  // Get user count
  async count(): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    return parseInt(result.rows[0].count);
  }
}
