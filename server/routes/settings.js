/**
 * server/routes/settings.js
 * GET /api/settings      — leggi impostazioni dell'utente
 * PUT /api/settings      — salva impostazioni
 */

const router          = require('express').Router();
const db              = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => {
  const rows = db.all(
    'SELECT categoria, session_min, break_min FROM settings WHERE user_id = $1',
    [req.userId]
  );
  return res.json(rows);
});

router.put('/', (req, res) => {
  const items = req.body;   // [{ categoria, session_min, break_min }]
  for (const item of items) {
    db.run(
      `INSERT INTO settings (user_id, categoria, session_min, break_min)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT(user_id, categoria) DO UPDATE SET
         session_min = EXCLUDED.session_min,
         break_min   = EXCLUDED.break_min`,
      [req.userId, item.categoria, item.session_min, item.break_min]
    );
  }
  return res.json({ ok: true });
});

module.exports = router;
