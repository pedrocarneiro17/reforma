import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { fileURLToPath } from 'url'
import { join, dirname } from 'path'
import { existsSync } from 'fs'
import { initDb } from './db.js'
import authRoutes from './routes/auth.js'
import adminRoutes from './routes/admin.js'
import simulacaoRoutes from './routes/simulacao.js'
import bcrypt from 'bcryptjs'
import pool from './db.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ ok: true }))
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/simulacao', simulacaoRoutes)

// Serve frontend buildado em produção
const distPath = join(__dirname, '..', 'dist')
if (existsSync(distPath)) {
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(join(distPath, 'index.html')))
}

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ erro: 'Erro interno do servidor' })
})

async function criarAdminSeNecessario() {
  const { rows } = await pool.query("SELECT id FROM usuarios WHERE role = 'admin' LIMIT 1")
  if (rows.length) return

  const senha = process.env.ADMIN_PASSWORD || 'admin123'
  const hash = await bcrypt.hash(senha, 10)
  const user = process.env.ADMIN_USERNAME || 'admin'
  await pool.query(
    "INSERT INTO usuarios (username, password, role) VALUES ($1, $2, 'admin')",
    [user, hash]
  )
  console.log(`✓ Admin criado: ${user} / ${senha}`)
}

const PORT = process.env.PORT || 3001
initDb()
  .then(criarAdminSeNecessario)
  .then(() => app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`)))
  .catch(e => { console.error('Falha ao iniciar:', e); process.exit(1) })
