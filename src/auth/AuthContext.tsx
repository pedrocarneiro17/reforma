import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface Usuario {
  id: number
  username: string
  role: 'admin' | 'user'
  simulacoes_usadas: number
  simulacoes_limite: number | null
}

interface AuthCtx {
  usuario: Usuario | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  atualizarContador: (usadas: number, limite: number | null) => void
}

const Ctx = createContext<AuthCtx | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken]     = useState<string | null>(() => localStorage.getItem('rc_token'))
  const [usuario, setUsuario] = useState<Usuario | null>(() => {
    const s = localStorage.getItem('rc_user')
    return s ? JSON.parse(s) : null
  })

  const login = async (username: string, password: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.erro || 'Erro ao fazer login')
    setToken(data.token)
    setUsuario(data.usuario)
    localStorage.setItem('rc_token', data.token)
    localStorage.setItem('rc_user', JSON.stringify(data.usuario))
  }

  const logout = () => {
    setToken(null)
    setUsuario(null)
    localStorage.removeItem('rc_token')
    localStorage.removeItem('rc_user')
  }

  const atualizarContador = (usadas: number, limite: number | null) => {
    setUsuario(u => {
      if (!u) return u
      const updated = { ...u, simulacoes_usadas: usadas, simulacoes_limite: limite ?? u.simulacoes_limite }
      localStorage.setItem('rc_user', JSON.stringify(updated))
      return updated
    })
  }

  return (
    <Ctx.Provider value={{ usuario, token, login, logout, atualizarContador }}>
      {children}
    </Ctx.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAuth fora do AuthProvider')
  return ctx
}
