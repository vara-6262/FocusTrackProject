/**
 * server/middleware/auth.js
 * Middleware Express che verifica il JWT in Authorization: Bearer <token>
 * e inietta req.userId per le route protette.
 */

const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'focustrack-dev-secret-change-in-production';

function requireAuth(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mancante' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;   // sub = user id
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token non valido o scaduto' });
  }
}

module.exports = { requireAuth, JWT_SECRET };
