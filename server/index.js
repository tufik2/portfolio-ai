import path from 'node:path';
import express from 'express';
import pool from './db.js';

const app = express();
const port = process.env.PORT || 3000;
const www = path.join(import.meta.dirname, 'www');

app.use(express.static(www));

app.get('/api/health', async (req, res) => {
  const env = process.env.NODE_ENV;
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', env, db: 'ok' });
  } catch {
    res.status(503).json({ status: 'error', env, db: 'error' });
  }
});

// SPA fallback: let React Router handle any non-API route.
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(www, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
