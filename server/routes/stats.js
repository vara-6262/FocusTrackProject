/**
 * server/routes/stats.js
 * GET /api/stats — statistiche aggregate per oggi
 */

const router          = require('express').Router();
const db              = require('../db');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

router.get('/', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const rows  = db.all(
    `SELECT
       categoria,
       COUNT(*)              AS total,
       AVG(slip_count)       AS avg_slips,
       AVG(fatigue_score)    AS avg_fatigue,
       AVG(start_cost)       AS avg_start_cost
     FROM sessions
     WHERE user_id  = $1
       AND discarded = 0
       AND DATE(timestamp_start) = $2
     GROUP BY categoria`,
    [req.userId, today]
  );
  return res.json(rows);
});

module.exports = router;
