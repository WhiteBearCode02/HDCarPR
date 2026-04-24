import { Router } from 'express';
import { z } from 'zod';
import { pool } from '../db/pool.js';
import { requireAuth } from '../middleware/auth.js';
import { inferFuelDiagnosis } from '../services/aiClient.js';

const router = Router();

router.use(requireAuth);

router.post('/ingest', async (req, res) => {
  const schema = z.object({
    start_time: z.string(),
    end_time: z.string(),
    total_distance: z.number().nonnegative(),
    avg_fuel_economy: z.number().positive(),
    segments: z.array(z.object({
      segment_no: z.number().int().positive(),
      latitude: z.number(),
      longitude: z.number(),
      speed: z.number().nonnegative(),
      rpm: z.number().nonnegative(),
      accel_pedal: z.number().nonnegative(),
      traffic_index: z.number().nonnegative(),
      slope: z.number(),
      climate_load: z.number().nonnegative(),
      fuel_economy: z.number().positive()
    })).default([])
  });

  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO drive_logs (user_id, start_time, end_time, total_distance, avg_fuel_economy)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [req.user.user_id, parsed.data.start_time, parsed.data.end_time, parsed.data.total_distance, parsed.data.avg_fuel_economy]
    );

    const logId = rows[0].id;

    for (const segment of parsed.data.segments) {
      await client.query(
        `INSERT INTO segment_analysis
         (log_id, segment_no, latitude, longitude, speed, fuel_economy, raw_features)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          logId,
          segment.segment_no,
          segment.latitude,
          segment.longitude,
          segment.speed,
          segment.fuel_economy,
          segment
        ]
      );
    }

    await client.query('COMMIT');
    return res.status(201).json({ log_id: logId, segments_saved: parsed.data.segments.length });
  } catch (e) {
    await client.query('ROLLBACK');
    return res.status(500).json({ message: 'Failed to ingest drive data' });
  } finally {
    client.release();
  }
});

router.get('/', async (req, res) => {
  const { rows } = await pool.query(
    `SELECT id, start_time, end_time, total_distance, avg_fuel_economy, memo
     FROM drive_logs
     WHERE user_id = $1
     ORDER BY start_time DESC`,
    [req.user.user_id]
  );
  res.json(rows);
});

router.patch('/:id/memo', async (req, res) => {
  const { memo } = req.body;
  const { rows } = await pool.query(
    `UPDATE drive_logs SET memo = $1
     WHERE id = $2 AND user_id = $3
     RETURNING id, memo`,
    [memo ?? '', req.params.id, req.user.user_id]
  );

  if (!rows[0]) {
    return res.status(404).json({ message: 'Drive not found' });
  }

  return res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { rowCount } = await pool.query(
    `DELETE FROM drive_logs WHERE id = $1 AND user_id = $2`,
    [req.params.id, req.user.user_id]
  );

  if (!rowCount) {
    return res.status(404).json({ message: 'Drive not found' });
  }

  return res.status(204).send();
});

router.post('/:id/analyze', async (req, res) => {
  const segments = await pool.query(
    `SELECT id, segment_no, raw_features
     FROM segment_analysis
     WHERE log_id = $1
     ORDER BY segment_no ASC`,
    [req.params.id]
  );

  if (!segments.rowCount) {
    return res.status(404).json({ message: 'No segments found for this drive log' });
  }

  const payload = {
    segments: segments.rows.map((row) => ({ id: row.id, ...row.raw_features }))
  };

  const result = await inferFuelDiagnosis(payload);

  for (const item of result.results) {
    await pool.query(
      `UPDATE segment_analysis
       SET ai_diagnosis_result = $1, contribution = $2
       WHERE id = $3`,
      [item.coaching_guide, item.contributions, item.id]
    );
  }

  await pool.query(
    `INSERT INTO model_metrics (log_id, rmse, predicted_avg_fuel_economy)
     VALUES ($1, $2, $3)
     ON CONFLICT (log_id) DO UPDATE SET rmse = excluded.rmse, predicted_avg_fuel_economy = excluded.predicted_avg_fuel_economy`,
    [req.params.id, result.rmse, result.predicted_avg_fuel_economy]
  );

  return res.json(result);
});

export default router;
