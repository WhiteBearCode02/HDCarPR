import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { pool } from '../db/pool.js';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  car_model: z.string().min(1),
  car_year: z.number().int().min(1990).max(2100)
});

router.get('/hyundai/oauth/url', (req, res) => {
  const redirectUri = encodeURIComponent(process.env.HYUNDAI_REDIRECT_URI || 'http://localhost:3000/callback');
  const clientId = process.env.HYUNDAI_CLIENT_ID || 'demo-client-id';
  const authUrl = `https://api.hyundai.com/oauth2/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}`;
  res.json({ authUrl });
});

router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json(parsed.error.flatten());
  }

  const { email, password, car_model, car_year } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, car_model, car_year)
       VALUES ($1, $2, $3, $4)
       RETURNING id, email, car_model, car_year, is_admin`,
      [email, passwordHash, car_model, car_year]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ message: 'Email already exists' });
    }
    return res.status(500).json({ message: 'Failed to register' });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'email/password required' });
  }

  const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  if (!rows[0]) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const valid = await bcrypt.compare(password, rows[0].password_hash);
  if (!valid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { user_id: rows[0].id, email: rows[0].email, is_admin: rows[0].is_admin },
    process.env.JWT_SECRET,
    { expiresIn: '12h' }
  );

  return res.json({
    token,
    user: {
      id: rows[0].id,
      email: rows[0].email,
      car_model: rows[0].car_model,
      car_year: rows[0].car_year,
      is_admin: rows[0].is_admin
    }
  });
});

export default router;
