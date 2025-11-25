import { pool } from '../config/database.js';
import { UserProgress, Rank, ScoreTrend, Achievement } from '../models/Progress.js';
import { CorrectionType } from '../models/Correction.js';

export class ProgressService {
  /**
   * Calculate user rank based on essay count and average score
   */
  calculateRank(essayCount: number, avgScore: number): Rank {
    if (essayCount < 5) return 'bronze';
    if (essayCount < 15 || avgScore < 60) return 'bronze';
    if (essayCount < 30 || avgScore < 70) return 'silver';
    if (essayCount < 50 || avgScore < 80) return 'gold';
    if (essayCount < 100 || avgScore < 90) return 'platinum';
    return 'diamond';
  }

  /**
   * Get user progress summary
   */
  async getUserProgress(userId: string): Promise<UserProgress> {
    // Get total essays and average score
    const statsQuery = `
      SELECT 
        COUNT(*) as total_essays,
        AVG((score->>'overall')::int) as avg_score
      FROM essays
      WHERE user_id = $1 AND status = 'completed' AND score IS NOT NULL
    `;
    const statsResult = await pool.query(statsQuery, [userId]);
    const stats = statsResult.rows[0];

    const totalEssays = parseInt(stats.total_essays) || 0;
    const averageScore = stats.avg_score ? parseFloat(stats.avg_score) : 0;

    // Calculate weekly improvement
    const weeklyImprovement = await this.calculateWeeklyImprovement(userId);

    // Get weaknesses
    const weaknesses = await this.identifyWeaknesses(userId);

    // Calculate rank
    const rank = this.calculateRank(totalEssays, averageScore);

    // Get achievements
    const achievements = await this.getAchievements(userId, totalEssays, averageScore);

    return {
      totalEssays,
      averageScore: Math.round(averageScore * 100) / 100,
      weeklyImprovement,
      weaknesses,
      rank,
      achievements,
    };
  }

  /**
   * Calculate weekly improvement percentage
   */
  private async calculateWeeklyImprovement(userId: string): Promise<number> {
    const query = `
      WITH weekly_scores AS (
        SELECT 
          DATE_TRUNC('week', created_at) as week,
          AVG((score->>'overall')::int) as avg_score
        FROM essays
        WHERE user_id = $1 AND status = 'completed' AND score IS NOT NULL
          AND created_at >= NOW() - INTERVAL '2 weeks'
        GROUP BY DATE_TRUNC('week', created_at)
        ORDER BY week DESC
        LIMIT 2
      )
      SELECT 
        CASE 
          WHEN COUNT(*) = 2 THEN
            ((MAX(avg_score) - MIN(avg_score)) / NULLIF(MIN(avg_score), 0)) * 100
          ELSE 0
        END as improvement
      FROM weekly_scores
    `;

    const result = await pool.query(query, [userId]);
    const improvement = result.rows[0]?.improvement || 0;

    return Math.round(parseFloat(improvement) * 100) / 100;
  }

  /**
   * Identify top 3 weakness categories
   */
  private async identifyWeaknesses(
    userId: string
  ): Promise<Array<{ category: string; count: number }>> {
    const query = `
      SELECT 
        correction->>'type' as category,
        COUNT(*) as count
      FROM essays,
      LATERAL jsonb_array_elements(corrections) as correction
      WHERE user_id = $1 AND status = 'completed'
      GROUP BY correction->>'type'
      ORDER BY count DESC
      LIMIT 3
    `;

    const result = await pool.query(query, [userId]);

    return result.rows.map((row) => ({
      category: row.category,
      count: parseInt(row.count),
    }));
  }

  /**
   * Get score trends over time
   */
  async getScoreTrends(userId: string, days: number = 30): Promise<ScoreTrend[]> {
    const query = `
      SELECT 
        DATE(created_at) as date,
        AVG((score->>'overall')::int) as score,
        COUNT(*) as essay_count
      FROM essays
      WHERE user_id = $1 
        AND status = 'completed' 
        AND score IS NOT NULL
        AND created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `;

    const result = await pool.query(query, [userId]);

    return result.rows.map((row) => ({
      date: row.date,
      score: Math.round(parseFloat(row.score) * 100) / 100,
      essayCount: parseInt(row.essay_count),
    }));
  }

  /**
   * Get achievements based on milestones
   */
  private async getAchievements(
    userId: string,
    totalEssays: number,
    avgScore: number
  ): Promise<Achievement[]> {
    const achievements: Achievement[] = [];

    // Essay count achievements
    if (totalEssays >= 1) {
      achievements.push({
        id: 'first-essay',
        name: 'First Steps',
        description: 'Completed your first essay',
        icon: '🎯',
        unlockedAt: new Date(),
      });
    }

    if (totalEssays >= 10) {
      achievements.push({
        id: 'ten-essays',
        name: 'Dedicated Writer',
        description: 'Completed 10 essays',
        icon: '📝',
        unlockedAt: new Date(),
      });
    }

    if (totalEssays >= 50) {
      achievements.push({
        id: 'fifty-essays',
        name: 'Essay Master',
        description: 'Completed 50 essays',
        icon: '🏆',
        unlockedAt: new Date(),
      });
    }

    if (totalEssays >= 100) {
      achievements.push({
        id: 'hundred-essays',
        name: 'Century Club',
        description: 'Completed 100 essays',
        icon: '💯',
        unlockedAt: new Date(),
      });
    }

    // Score achievements
    if (avgScore >= 80) {
      achievements.push({
        id: 'high-scorer',
        name: 'High Achiever',
        description: 'Maintained 80+ average score',
        icon: '⭐',
        unlockedAt: new Date(),
      });
    }

    if (avgScore >= 90) {
      achievements.push({
        id: 'excellent',
        name: 'Excellence',
        description: 'Maintained 90+ average score',
        icon: '🌟',
        unlockedAt: new Date(),
      });
    }

    // Perfect score achievement
    const perfectQuery = `
      SELECT COUNT(*) as count
      FROM essays
      WHERE user_id = $1 AND (score->>'overall')::int = 100
    `;
    const perfectResult = await pool.query(perfectQuery, [userId]);
    if (parseInt(perfectResult.rows[0].count) > 0) {
      achievements.push({
        id: 'perfect-score',
        name: 'Perfection',
        description: 'Achieved a perfect score',
        icon: '💎',
        unlockedAt: new Date(),
      });
    }

    return achievements;
  }

  /**
   * Create daily progress snapshot
   */
  async createSnapshot(userId: string): Promise<void> {
    const progress = await this.getUserProgress(userId);

    const query = `
      INSERT INTO progress_snapshots 
        (user_id, total_essays, average_score, weekly_improvement, weaknesses, rank, snapshot_date)
      VALUES ($1, $2, $3, $4, $5, $6, CURRENT_DATE)
      ON CONFLICT (user_id, snapshot_date) 
      DO UPDATE SET
        total_essays = EXCLUDED.total_essays,
        average_score = EXCLUDED.average_score,
        weekly_improvement = EXCLUDED.weekly_improvement,
        weaknesses = EXCLUDED.weaknesses,
        rank = EXCLUDED.rank
    `;

    await pool.query(query, [
      userId,
      progress.totalEssays,
      progress.averageScore,
      progress.weeklyImprovement,
      JSON.stringify(progress.weaknesses),
      progress.rank,
    ]);
  }
}
