import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import pool from '../db.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {}
  if (!username || !password) return res.status(400).json({ erro: 'Usuário e senha obrigatórios' })
  // Só strings: outros tipos (número, objeto) fariam o bcrypt lançar erro e cair no fallback abaixo
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ erro: 'Usuário e senha inválidos' })
  }

  let user
  try {
    const { rows } = await pool.query('SELECT * FROM usuarios WHERE username = $1', [username])
    user = rows[0]
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ erro: 'Usuário ou senha incorretos' })
    }
  } catch (_dbErr) {
    // Em produção, banco fora do ar = serviço indisponível. O fallback abaixo é só de
    // DESENVOLVIMENTO: sem esta trava, qualquer falha neste bloco (banco, bcrypt...) aceitava as
    // credenciais do .env — ou admin/admin123 se ausentes — e emitia um token de admin (id 0).
    if (process.env.NODE_ENV === 'production') {
      return res.status(503).json({ erro: 'Serviço temporariamente indisponível. Tente novamente.' })
    }
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
