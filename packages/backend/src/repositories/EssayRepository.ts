import { pool } from '../config/database.js';
import { Essay, CreateEssayDto, UpdateEssayDto, EssayFilters, PaginationParams } from '../models/Essay.js';
import { NotFoundError, ValidationError } from '../types/errors.js';
import { PaginatedResponse } from '../types/index.js';

export class EssayRepository {
  /**
   * Create new essay
   */
  async create(data: CreateEssayDto): Promise<Essay> {
    // Validate text length
    if (data.originalText.length > 10000) {
      throw new ValidationError('Essay text cannot exceed 10,000 characters');
    }

    if (data.originalText.trim().length === 0) {
      throw new ValidationError('Essay text cannot be empty');
    }

    const query = `
      INSERT INTO essays (user_id, original_text, language, topic, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, user_id as "userId", original_text as "originalText", 
                language, corrections, polished_version as "polishedVersion",
                score, topic, status, created_at as "createdAt", 
                completed_at as "completedAt"
    `;

    const values = [
      data.userId,
      data.originalText,
      data.language || 'en',
      data.topic ? JSON.stringify(data.topic) : null,
      'draft',
    ];

    const result = await pool.query<Essay>(query, values);
    return result.rows[0];
  }

  /**
   * Find essay by ID
   */
  async findById(id: string, userId?: string): Promise<Essay | null> {
    let query = `
      SELECT id, user_id as "userId", original_text as "originalText", 
             language, corrections, polished_version as "polishedVersion",
             score, topic, status, created_at as "createdAt", 
             completed_at as "completedAt"
      FROM essays
      WHERE id = $1
    `;

    const values: any[] = [id];

    if (userId) {
      query += ' AND user_id = $2';
      values.push(userId);
    }

    const result = await pool.query<Essay>(query, values);
    return result.rows[0] || null;
  }

  /**
   * Find essays with filters and pagination
   */
  async find(filters: EssayFilters, pagination: PaginationParams): Promise<PaginatedResponse<Essay>> {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    // Build WHERE clause
    const conditions: string[] = ['user_id = $1'];
    const values: any[] = [filters.userId];
    let paramCount = 2;

    if (filters.language) {
      conditions.push(`language = $${paramCount++}`);
      values.push(filters.language);
    }

    if (filters.status) {
      conditions.push(`status = $${paramCount++}`);
      values.push(filters.status);
    }

    if (filters.dateFrom) {
      conditions.push(`created_at >= $${paramCount++}`);
      values.push(filters.dateFrom);
    }

    if (filters.dateTo) {
      conditions.push(`created_at <= $${paramCount++}`);
      values.push(filters.dateTo);
    }

    if (filters.minScore !== undefined) {
      conditions.push(`(score->>'overall')::int >= $${paramCount++}`);
      values.push(filters.minScore);
    }

    if (filters.maxScore !== undefined) {
      conditions.push(`(score->>'overall')::int <= $${paramCount++}`);
      values.push(filters.maxScore);
    }

    if (filters.topic) {
      conditions.push(`topic->>'title' ILIKE $${paramCount++}`);
      values.push(`%${filters.topic}%`);
    }

    const whereClause = conditions.join(' AND ');

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM essays WHERE ${whereClause}`;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated data
    const dataQuery = `
      SELECT id, user_id as "userId", original_text as "originalText", 
             language, corrections, polished_version as "polishedVersion",
             score, topic, status, created_at as "createdAt", 
             completed_at as "completedAt"
      FROM essays
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;

    values.push(limit, offset);
    const dataResult = await pool.query<Essay>(dataQuery, values);

    return {
      data: dataResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update essay
   */
  async update(id: string, userId: string, data: UpdateEssayDto): Promise<Essay> {
    const essay = await this.findById(id, userId);
    if (!essay) {
      throw new NotFoundError('Essay not found');
    }

    const updates: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.originalText !== undefined) {
      if (data.originalText.length > 10000) {
        throw new ValidationError('Essay text cannot exceed 10,000 characters');
      }
      updates.push(`original_text = $${paramCount++}`);
      values.push(data.originalText);
    }

    if (data.language !== undefined) {
      updates.push(`language = $${paramCount++}`);
      values.push(data.language);
    }

    if (data.topic !== undefined) {
      updates.push(`topic = $${paramCount++}`);
      values.push(JSON.stringify(data.topic));
    }

    if (updates.length === 0) {
      return essay;
    }

    values.push(id, userId);

    const query = `
      UPDATE essays
      SET ${updates.join(', ')}
      WHERE id = $${paramCount} AND user_id = $${paramCount + 1}
      RETURNING id, user_id as "userId", original_text as "originalText", 
                language, corrections, polished_version as "polishedVersion",
                score, topic, status, created_at as "createdAt", 
                completed_at as "completedAt"
    `;

    const result = await pool.query<Essay>(query, values);
    return result.rows[0];
  }

  /**
   * Update essay status and results
   */
  async updateResults(
    id: string,
    corrections: any[],
    polishedVersion: string,
    score: any,
    status: 'completed' | 'failed'
  ): Promise<Essay> {
    const query = `
      UPDATE essays
      SET corrections = $1,
          polished_version = $2,
          score = $3,
          status = $4,
          completed_at = NOW()
      WHERE id = $5
      RETURNING id, user_id as "userId", original_text as "originalText", 
                language, corrections, polished_version as "polishedVersion",
                score, topic, status, created_at as "createdAt", 
                completed_at as "completedAt"
    `;

    const values = [JSON.stringify(corrections), polishedVersion, JSON.stringify(score), status, id];

    const result = await pool.query<Essay>(query, values);

    if (result.rowCount === 0) {
      throw new NotFoundError('Essay not found');
    }

    return result.rows[0];
  }

  /**
   * Update essay status
   */
  async updateStatus(id: string, status: 'draft' | 'processing' | 'completed' | 'failed'): Promise<void> {
    const query = 'UPDATE essays SET status = $1 WHERE id = $2';
    await pool.query(query, [status, id]);
  }

  /**
   * Delete essay
   */
  async delete(id: string, userId: string): Promise<void> {
    const result = await pool.query('DELETE FROM essays WHERE id = $1 AND user_id = $2', [id, userId]);

    if (result.rowCount === 0) {
      throw new NotFoundError('Essay not found');
    }
  }

  /**
   * Get essay count for user
   */
  async countByUser(userId: string): Promise<number> {
    const result = await pool.query('SELECT COUNT(*) as count FROM essays WHERE user_id = $1', [userId]);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get average score for user
   */
  async getAverageScore(userId: string): Promise<number | null> {
    const query = `
      SELECT AVG((score->>'overall')::int) as avg_score
      FROM essays
      WHERE user_id = $1 AND status = 'completed' AND score IS NOT NULL
    `;

    const result = await pool.query(query, [userId]);
    const avgScore = result.rows[0]?.avg_score;

    return avgScore ? parseFloat(avgScore) : null;
  }
}
