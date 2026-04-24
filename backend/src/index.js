import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import drivesRouter from './routes/drives.js';
import adminRouter from './routes/admin.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.use('/auth', authRouter);
app.use('/drives', drivesRouter);
app.use('/admin', adminRouter);

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Main backend listening on ${port}`);
});
