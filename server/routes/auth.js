const router  = require('express').Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const db      = require('../db');
const { requireAuth, JWT_SECRET } = require('../middleware/auth');

const TOKEN_TTL = '30d';

function makeToken(userId) {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: TOKEN_TTL });
}

// ── SIGNUP ───────────────────────────────────────────────────────────────

router.post('/signup', async (req, res) => {
  try {
    const { email, password, profile } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password obbligatorie' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password minimo 6 caratteri' });
    }

    const normalizedEmail = email.toLowerCase();

    const existing = await db.get(
      'SELECT id FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (existing) {
      return res.status(409).json({ error: 'Email già registrata' });
    }

    const hash = await bcrypt.hash(password, 10);

    const userId = await db.insert(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2)',
      [normalizedEmail, hash]
    );

    if (profile) {
      await db.upsertProfile(userId, profile);
    }

    await db.seedUserSettings(userId);

    return res.status(201).json({
      token: makeToken(userId),
      userId
    });

  } catch (err) {
    console.error('signup error:', err);
    return res.status(500).json({ error: 'Errore interno server' });
  }
});

// ── LOGIN ────────────────────────────────────────────────────────────────

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email e password obbligatorie' });
    }

    const normalizedEmail = email.toLowerCase();

    const user = await db.get(
      'SELECT * FROM users WHERE email = $1',
      [normalizedEmail]
    );

    if (!user) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Credenziali non valide' });
    }

    return res.json({
      token: makeToken(user.id),
      userId: user.id
    });

  } catch (err) {
    console.error('login error:', err);
    return res.status(500).json({ error: 'Errore interno server' });
  }
});

// ── ME ────────────────────────────────────────────────────────────────

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await db.get(
      'SELECT id, email, created_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (!user) {
      return res.status(404).json({ error: 'Utente non trovato' });
    }

    const profile = await db.get(
      'SELECT * FROM profiles WHERE user_id = $1',
      [req.userId]
    );

    return res.json({
      user,
      profile: profile ?? null
    });

  } catch (err) {
    console.error('me error:', err);
    return res.status(500).json({ error: 'Errore interno server' });
  }
});

// ── UPDATE PROFILE ───────────────────────────────────────────────────────

router.put('/profile', requireAuth, async (req, res) => {
  try {
    await db.upsertProfile(req.userId, req.body);
    return res.json({ ok: true });

  } catch (err) {
    console.error('profile error:', err);
    return res.status(500).json({ error: 'Errore interno server' });
  }
});

module.exports = router;