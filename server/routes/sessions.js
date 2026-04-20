/**
 * server/routes/sessions.js
 * POST   /api/sessions          — crea sessione
 * PUT    /api/sessions/:id      — aggiorna fine sessione
 * GET    /api/sessions          — lista sessioni di oggi (utente corrente)
 * GET    /api/sessions/:id/distractions — lista distrazioni di una sessione
 */

const router       = require('express').Router();
const db           = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// ── CREATE ───────────────────────────────────────────────────────────────────

router.post('/', (req, res) => {
  const { timestamp_start, categoria, start_cost } = req.body;
  const id = db.insert(
    `INSERT INTO sessions (user_id, timestamp_start, categoria, start_cost)
     VALUES (?, ?, ?, ?)`,
    [req.userId, timestamp_start, categoria, start_cost ?? 0]
  );
  return res.status(201).json({ id });
});

// ── UPDATE ───────────────────────────────────────────────────────────────────

router.put('/:id', (req, res) => {
  const { timestamp_end, fatigue_score, slip_count, discarded } = req.body;
  db.run(
    `UPDATE sessions SET
       timestamp_end = ?,
       fatigue_score = ?,
       slip_count    = ?,
       discarded     = ?
     WHERE id = ? AND user_id = ?`,
    [
      timestamp_end  ?? null,
      fatigue_score  ?? null,
      slip_count     ?? 0,
      discarded      ?? 0,
      req.params.id,
      req.userId,
    ]
  );
  return res.json({ ok: true });
});

// ── LIST (today) ──────────────────────────────────────────────────────────────

router.get('/', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const rows  = db.all(
    `SELECT s.*, COUNT(d.id) AS d_count
     FROM sessions s
     LEFT JOIN distractions d ON d.session_id = s.id
     WHERE s.user_id   = ?
       AND s.discarded = 0
       AND date(s.timestamp_start) = ?
     GROUP BY s.id
     ORDER BY s.timestamp_start DESC
     LIMIT 50`,
    [req.userId, today]
  );
  return res.json(rows);
});

// ── DISTRACTIONS OF SESSION ───────────────────────────────────────────────────

router.get('/:id/distractions', (req, res) => {
  const rows = db.all(
    `SELECT * FROM distractions
     WHERE session_id = ? AND user_id = ?
     ORDER BY ts`,
    [req.params.id, req.userId]
  );
  return res.json(rows);
});

module.exports = router;
