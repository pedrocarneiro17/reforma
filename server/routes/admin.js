import { Router } from 'express'
import bcrypt from 'bcryptjs'
import pool from '../db.js'
import { autenticar, apenasAdmin } from '../middleware/auth.js'

const router = Router()
router.use(autenticar, apenasAdmin)

// Listar todos os usuários
router.get('/usuarios', async (_req, res) => {
  const { rows } = await pool.query(
    'SELECT id, username, role, simulacoes_usadas, simulacoes_limite, criado_em FROM usuarios ORDER BY criado_em DESC'
  )
  res.json(rows)
})

// Criar usuário
router.post('/usuarios', async (req, res) => {
  const { username, password, simulacoes_limite = 10 } = req.body
  if (!username || !password) return res.status(400).json({ erro: 'Usuário e senha obrigatórios' })

  const hash = await bcrypt.hash(password, 10)
  try {
    const { rows } = await pool.query(
      'INSERT INTO usuarios (username, password, simulacoes_limite) VALUES ($1, $2, $3) RETURNING id, username, simulacoes_usadas, simulacoes_limite, criado_em',
      [username, hash, simulacoes_limite]
    )
    res.status(201).json(rows[0])
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ erro: 'Usuário já existe' })
    throw e
  }
})

// Editar limite de simulações
router.patch('/usuarios/:id', async (req, res) => {
  const { simulacoes_limite, resetar } = req.body
  const updates = []
  const vals = []

  if (simulacoes_limite != null) { updates.push(`simulacoes_limite = $${vals.length + 1}`); vals.push(simulacoes_limite) }
  if (resetar) { updates.push(`simulacoes_usadas = 0`) }
  if (!updates.length) return res.status(400).json({ erro: 'Nada a atualizar' })

  vals.push(req.params.id)
  const { rows } = await pool.query(
    `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${vals.length} RETURNING id, username, simulacoes_usadas, simulacoes_limite`,
    vals
  )
  if (!rows.length) return res.status(404).json({ erro: 'Usuário não encontrado' })
  res.json(rows[0])
})

// Excluir usuário
router.delete('/usuarios/:id', async (req, res) => {
  const { rowCount } = await pool.query('DELETE FROM usuarios WHERE id = $1 AND role != $2', [req.params.id, 'admin'])
  if (!rowCount) return res.status(404).json({ erro: 'Usuário não encontrado ou é admin' })
  res.json({ ok: true })
})

export default router
