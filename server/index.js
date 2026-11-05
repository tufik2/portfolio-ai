import path from 'node:path';
import express from 'express';
import pool from './src/controllers/db.js';
import MigrationCtrl from './src/controllers/MigrationCtrl.js';
import { executeGraphql } from './src/graphql/index.js';

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

// GraphQL endpoint: body { query, variables?, operationName? }.
app.post('/graphql', express.json(), async (req, res) => {
  const { query, variables, operationName } = req.body ?? {};
  if (typeof query !== 'string' || !query.trim()) {
    return res.status(400).json({
      errors: [{ message: 'Request body must include a "query" string.' }],
    });
  }
  const result = await executeGraphql({
    query,
    variables,
    operationName,
    context: { req },
  });
  res.json(result);
});

// SPA fallback: let React Router handle any non-API route.
app.get('/{*splat}', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(www, 'index.html'), (err) => {
    if (err) next();
  });
});

// Run pending SQL migrations before accepting requests. The server still
// starts if they fail (e.g. database down); /api/health reports the DB state.
try {
  await MigrationCtrl.init();
} catch (error) {
  console.error(error.message);
}

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
