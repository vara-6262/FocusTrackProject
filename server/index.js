/**
 * server/index.js
 * Entry point Express. Monta tutte le route e avvia il server.
 * Compatible con Render.com: legge PORT da env.
 */

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const path    = require('path');
const { initDb } = require('./db');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── MIDDLEWARE ────────────────────────────────────────────────────────────────

app.use(cors());
app.use(express.json());

// ── API ROUTES ────────────────────────────────────────────────────────────────

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/sessions',     require('./routes/sessions'));
app.use('/api/distractions', require('./routes/distractions'));
app.use('/api/settings',     require('./routes/settings'));
app.use('/api/stats',        require('./routes/stats'));

// ── STATIC FRONTEND ───────────────────────────────────────────────────────────
// Serve la cartella public/ — in produzione Render la serve da qui

app.use(express.static(path.join(__dirname, '..', 'public')));

// SPA fallback: tutto ciò che non è API → index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});


// ── BOOT ──────────────────────────────────────────────────────────────────────

initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`🎯 FocusTrack running at http://localhost:${PORT}`);
    console.log("DB URL presente:", !!process.env.DATABASE_URL);
  });
}).catch(err => {
  console.error('Errore inizializzazione DB:', err);
  process.exit(1);
});
