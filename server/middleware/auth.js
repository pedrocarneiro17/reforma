import jwt from 'jsonwebtoken'

export function autenticar(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ erro: 'Não autenticado' })
  try {
    req.usuario = jwt.verify(header.slice(7), process.env.JWT_SECRET)
    next()
  } catch {
    res.status(401).json({ erro: 'Token inválido' })
  }
}

export function apenasAdmin(req, res, next) {
  if (req.usuario?.role !== 'admin') return res.status(403).json({ erro: 'Acesso restrito a administradores' })
  next()
}
