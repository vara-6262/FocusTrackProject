/**
 * server/routes/distractions.js
 * POST /api/distractions — registra timestamp di una distrazione
 */

const router          = require('express').Router();
const db              = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.post('/', (req, res) => {
  const { session_id, ts } = req.body;
  db.insert(
    'INSERT INTO distractions (session_id, user_id, ts) VALUES ($1, $2, $3)',
    [session_id, req.userId, ts]
  );
  return res.status(201).json({ ok: true });
});

module.exports = router;
