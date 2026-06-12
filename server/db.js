import pg from 'pg'

const { Pool } = pg

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
})

export async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id          SERIAL PRIMARY KEY,
      username    TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL DEFAULT 'user',
      simulacoes_usadas  INTEGER NOT NULL DEFAULT 0,
      simulacoes_limite  INTEGER NOT NULL DEFAULT 10,
      criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
}

export default pool
