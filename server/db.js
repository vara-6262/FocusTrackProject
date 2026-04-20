/**
 * server/db.js
 * Inizializza SQLite via sql.js e espone helpers sincroni.
 * Schema MySQL-compatible.
 */

const initSqlJs = require('sql.js');
const fs        = require('fs');
const path      = require('path');

const DB_DIR  = path.join(__dirname, '..', 'db');
const DB_FILE = path.join(DB_DIR, 'focustrack.db');

let _db = null;

// ── SCHEMA ───────────────────────────────────────────────────────────────────

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         VARCHAR(256) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id                  INT PRIMARY KEY,
    situazione               VARCHAR(32),
    struttura_giornata       VARCHAR(32),
    tipo_lavoro              VARCHAR(32),
    stamina_min              INT  DEFAULT 45,
    distraction_sensitivity  INT  DEFAULT 50,
    variabilita              VARCHAR(32),
    updated_at               DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    user_id     INT         NOT NULL,
    categoria   VARCHAR(64) NOT NULL,
    session_min INT         DEFAULT 25,
    break_min   INT         DEFAULT 5,
    PRIMARY KEY (user_id, categoria),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INT      NOT NULL,
    timestamp_start DATETIME NOT NULL,
    timestamp_end   DATETIME,
    categoria       VARCHAR(64),
    slip_count      INT   DEFAULT 0,
    fatigue_score   FLOAT,
    start_cost      FLOAT,
    discarded       INT   DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS distractions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id INT      NOT NULL,
    user_id    INT      NOT NULL,
    ts         DATETIME NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id),
    FOREIGN KEY (user_id)    REFERENCES users(id)
  );
`;

const DEFAULT_CATEGORIES = [
  'Creativity', 'Passive', 'Problem Solving', 'Repetition', 'Reading',
];

// ── INIT ─────────────────────────────────────────────────────────────────────

async function initDb() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_FILE)) {
    _db = new SQL.Database(fs.readFileSync(DB_FILE));
  } else {
    _db = new SQL.Database();
  }

  _db.run('PRAGMA foreign_keys = ON;');
  _db.run(SCHEMA);
  _persist();

  console.log('✅ Database inizializzato:', DB_FILE);
}

// ── PERSIST ───────────────────────────────────────────────────────────────────

function _persist() {
  fs.writeFileSync(DB_FILE, Buffer.from(_db.export()));
}

// ── HELPERS ───────────────────────────────────────────────────────────────────

/** Esegue una query senza risultati (INSERT/UPDATE/DELETE) */
function run(sql, params = []) {
  _db.run(sql, params);
  _persist();
}

/** Ritorna tutti i risultati come array di oggetti plain */
function all(sql, params = []) {
  const stmt    = _db.prepare(sql);
  const results = [];
  stmt.bind(params);
  while (stmt.step()) results.push(stmt.getAsObject());
  stmt.free();
  return results;
}

/** Ritorna il primo risultato o null */
function get(sql, params = []) {
  return all(sql, params)[0] ?? null;
}

/** INSERT e ritorna l'id generato */
function insert(sql, params = []) {
  _db.run(sql, params);
  // leggi l'id PRIMA di _persist() che ricrea il db e azzera last_insert_rowid
  const stmt = _db.prepare('SELECT last_insert_rowid() as id');
  stmt.step();
  const { id } = stmt.getAsObject();
  stmt.free();
  _persist();
  return id;
}

/** Upsert profilo (compatibile sql.js) */
function upsertProfile(userId, p) {
  const existing = get('SELECT user_id FROM profiles WHERE user_id = ?', [userId]);
  if (existing) {
    run(
      `UPDATE profiles SET
         situazione = ?, struttura_giornata = ?, tipo_lavoro = ?,
         stamina_min = ?, distraction_sensitivity = ?, variabilita = ?,
         updated_at = CURRENT_TIMESTAMP
       WHERE user_id = ?`,
      [p.situazione, p.struttura_giornata, p.tipo_lavoro,
       p.stamina_min ?? 45, p.distraction_sensitivity ?? 50, p.variabilita,
       userId]
    );
  } else {
    run(
      `INSERT INTO profiles
         (user_id, situazione, struttura_giornata, tipo_lavoro,
          stamina_min, distraction_sensitivity, variabilita)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, p.situazione, p.struttura_giornata, p.tipo_lavoro,
       p.stamina_min ?? 45, p.distraction_sensitivity ?? 50, p.variabilita]
    );
  }
}

/** Upsert settings per categoria */
function upsertSetting(userId, categoria, session_min, break_min) {
  const existing = get(
    'SELECT user_id FROM settings WHERE user_id = ? AND categoria = ?',
    [userId, categoria]
  );
  if (existing) {
    run(
      'UPDATE settings SET session_min = ?, break_min = ? WHERE user_id = ? AND categoria = ?',
      [session_min, break_min, userId, categoria]
    );
  } else {
    run(
      'INSERT INTO settings (user_id, categoria, session_min, break_min) VALUES (?, ?, ?, ?)',
      [userId, categoria, session_min, break_min]
    );
  }
}

/** Inizializza settings default per nuovo utente */
function seedUserSettings(userId) {
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = get(
      'SELECT user_id FROM settings WHERE user_id = ? AND categoria = ?',
      [userId, cat]
    );
    if (!existing) {
      run(
        'INSERT INTO settings (user_id, categoria, session_min, break_min) VALUES (?, ?, 25, 5)',
        [userId, cat]
      );
    }
  }
}

module.exports = { initDb, run, all, get, insert, upsertProfile, upsertSetting, seedUserSettings };
