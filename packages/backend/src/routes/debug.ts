import { Router, Request, Response } from 'express';
import { pool } from '../config/database.js';

export function createDebugRouter(): Router {
  const router = Router();

  // GET /api/debug/essays - Check essay statuses
  router.get('/essays', async (_req: Request, res: Response) => {
    try {
      const result = await pool.query(`
        SELECT id, status, language, 
               LENGTH(original_text) as text_length,
               created_at, completed_at
        FROM essays
        ORDER BY created_at DESC
        LIMIT 10
      `);

      res.json({
        data: result.rows,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // POST /api/debug/reset-essay/:id - Reset essay to draft
  router.post('/reset-essay/:id', async (req: Request, res: Response) => {
    try {
      await pool.query(
        `UPDATE essays SET status = 'draft', corrections = '[]', polished_version = NULL, score = NULL WHERE id = $1`,
        [req.params.id]
      );

      res.json({
        message: 'Essay reset to draft',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
