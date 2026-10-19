import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import gameRoutes from './routes/gameRoutes.js';

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, db: mongoose.connection.readyState === 1 });
});
app.use('/api', gameRoutes);

app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

const PORT = process.env.PORT || 5001;
await connectDB(); // top-level await works because of "type": "module"
app.listen(PORT, () => console.log(`UNO server running on http://localhost:${PORT}`));