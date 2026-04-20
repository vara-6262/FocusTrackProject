const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// ── QUERY HELPERS ─────────────────────────────

async function run(sql, params = []) {
  await pool.query(sql, params);
}

async function all(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows;
}

async function get(sql, params = []) {
  const res = await pool.query(sql, params);
  return res.rows[0] ?? null;
}

async function insert(sql, params = []) {
  const res = await pool.query(sql + ' RETURNING id', params);
  return res.rows[0].id;
}

// ── INIT SCHEMA ──────────────────────────────

async function initDb() {
  await pool.query(`

    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(256) UNIQUE NOT NULL,
      password_hash VARCHAR(256) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id INT PRIMARY KEY,
      situazione VARCHAR(32),
      struttura_giornata VARCHAR(32),
      tipo_lavoro VARCHAR(32),
      stamina_min INT DEFAULT 45,
      distraction_sensitivity INT DEFAULT 50,
      variabilita VARCHAR(32),
      updated_at TIMESTAMP DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settings (
      user_id INT NOT NULL,
      categoria VARCHAR(64) NOT NULL,
      session_min INT DEFAULT 25,
      break_min INT DEFAULT 5,
      PRIMARY KEY (user_id, categoria)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INT NOT NULL,
      timestamp_start TIMESTAMP NOT NULL,
      timestamp_end TIMESTAMP,
      categoria VARCHAR(64),
      slip_count INT DEFAULT 0,
      fatigue_score FLOAT,
      start_cost FLOAT,
      discarded INT DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS distractions (
      id SERIAL PRIMARY KEY,
      session_id INT NOT NULL,
      user_id INT NOT NULL,
      ts TIMESTAMP NOT NULL
    );

  `);

  console.log("✅ PostgreSQL inizializzato");
}

// ── BUSINESS LOGIC (ADATTATA) ─────────────────

async function upsertProfile(userId, p) {
  await pool.query(`
    INSERT INTO profiles (
      user_id, situazione, struttura_giornata, tipo_lavoro,
      stamina_min, distraction_sensitivity, variabilita, updated_at
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())
    ON CONFLICT (user_id)
    DO UPDATE SET
      situazione = EXCLUDED.situazione,
      struttura_giornata = EXCLUDED.struttura_giornata,
      tipo_lavoro = EXCLUDED.tipo_lavoro,
      stamina_min = EXCLUDED.stamina_min,
      distraction_sensitivity = EXCLUDED.distraction_sensitivity,
      variabilita = EXCLUDED.variabilita,
      updated_at = NOW()
  `, [
    userId,
    p.situazione,
    p.struttura_giornata,
    p.tipo_lavoro,
    p.stamina_min ?? 45,
    p.distraction_sensitivity ?? 50,
    p.variabilita
  ]);
}

async function upsertSetting(userId, categoria, session_min, break_min) {
  await pool.query(`
    INSERT INTO settings (user_id, categoria, session_min, break_min)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (user_id, categoria)
    DO UPDATE SET
      session_min = EXCLUDED.session_min,
      break_min = EXCLUDED.break_min
  `, [userId, categoria, session_min, break_min]);
}

async function seedUserSettings(userId) {
  const DEFAULT_CATEGORIES = [
    'Creativity', 'Passive', 'Problem Solving', 'Repetition', 'Reading'
  ];

  for (const cat of DEFAULT_CATEGORIES) {
    await pool.query(`
      INSERT INTO settings (user_id, categoria, session_min, break_min)
      VALUES ($1,$2,25,5)
      ON CONFLICT DO NOTHING
    `, [userId, cat]);
  }
}

module.exports = {
  initDb,
  run,
  all,
  get,
  insert,
  upsertProfile,
  upsertSetting,
  seedUserSettings  
};