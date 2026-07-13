import { Router } from 'express'
import pool from '../db.js'
import { autenticar } from '../middleware/auth.js'

const router = Router()
router.use(autenticar)

// Verificar crédito e consumir 1 simulação
router.post('/autorizar', async (req, res) => {
  // Admin e fallback sem banco: sempre autorizado
  if (req.usuario.role === 'admin') return res.json({ autorizado: true, usadas: 0, limite: null })

  try {
    const { rows } = await pool.query(
      'SELECT simulacoes_usadas, simulacoes_limite FROM usuarios WHERE id = $1',
      [req.usuario.id]
    )
    const user = rows[0]
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' })

    if (user.simulacoes_usadas >= user.simulacoes_limite) {
      return res.status(403).json({
        autorizado: false,
        erro: `Limite de ${user.simulacoes_limite} simulações atingido. Entre em contato com o administrador.`,
        usadas: user.simulacoes_usadas,
        limite: user.simulacoes_limite,
      })
    }

    const { rows: updated } = await pool.query(
      'UPDATE usuarios SET simulacoes_usadas = simulacoes_usadas + 1 WHERE id = $1 RETURNING simulacoes_usadas, simulacoes_limite',
      [req.usuario.id]
    )
    res.json({ autorizado: true, usadas: updated[0].simulacoes_usadas, limite: updated[0].simulacoes_limite })
  } catch (_dbErr) {
    // Fallback dev: sem banco, autoriza sempre
    res.json({ autorizado: true, usadas: 0, limite: null })
  }
})

// Consultar status atual
router.get('/status', async (req, res) => {
  if (req.usuario.role === 'admin') return res.json({ usadas: 0, limite: null })
  try {
    const { rows } = await pool.query(
      'SELECT simulacoes_usadas, simulacoes_limite FROM usuarios WHERE id = $1',
      [req.usuario.id]
    )
    res.json(rows[0] ?? { usadas: 0, limite: 10 })
  } catch (_dbErr) {
    res.json({ usadas: 0, limite: null })
  }
})

export default router
