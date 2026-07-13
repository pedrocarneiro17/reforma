import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) return res.status(400).json({ erro: 'Usuário e senha obrigatórios' })

  let user
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username])
    user = rows[0]
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ erro: 'Usuário ou senha incorretos' })
    }
  } catch (_dbErr) {
    // Fallback dev: autentica com credenciais do .env quando o banco está indisponível
    const adminUser = process.env.ADMIN_USERNAME || 'admin'
    const adminPass = process.env.ADMIN_PASSWORD || 'admin123'
    if (username !== adminUser || password !== adminPass) {
      return res.status(401).json({ erro: 'Usuário ou senha incorretos' })
    }
    user = { id: 0, username: adminUser, role: 'admin', simulacoes_usadas: 0, simulacoes_limite: null }
  }

  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  )

  const isAdmin = user.role === 'admin'
  res.json({
    token,
    usuario: {
      id: user.id,
      username: user.username,
      role: user.role,
      simulacoes_usadas: isAdmin ? 0 : user.simulacoes_usadas,
      simulacoes_limite: isAdmin ? null : user.simulacoes_limite,
    }
  })
})

export default router
