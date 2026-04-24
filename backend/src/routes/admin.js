import { Router } from 'express';
import { pool } from '../db/pool.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth, requireAdmin);

router.get('/overview', async (req, res) => {
  const [{ rows: userRows }, { rows: driveRows }] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS users FROM users'),
    pool.query('SELECT COUNT(*)::int AS drives, COALESCE(SUM(total_distance),0)::float AS total_distance FROM drive_logs')
  ]);

  res.json({
    total_users: userRows[0].users,
    total_drives: driveRows[0].drives,
    total_distance: driveRows[0].total_distance
  });
});

router.get('/model-performance', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT m.log_id, m.rmse, m.predicted_avg_fuel_economy, d.avg_fuel_economy AS actual_avg_fuel_economy, m.created_at
     FROM model_metrics m
     JOIN drive_logs d ON d.id = m.log_id
     ORDER BY m.created_at DESC
     LIMIT 100`
  );

  res.json(rows);
});

export default router;
