import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ erro: 'Usuário e senha obrigatórios' })

  const { rows } = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username])
  const user = rows[0]
  if (!user || !await bcrypt.compare(password, user.password)) {
    return res.status(401).json({ erro: 'Usuário ou senha incorretos' })
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )

  res.json({
    token,
    usuario: {
      id: user.id,
      username: user.username,
      role: user.role,
      simulacoes_usadas: user.simulacoes_usadas,
      simulacoes_limite: user.simulacoes_limite,
    }
  })
})

export default router
