import { useAuth } from './AuthContext'

export function useApi() {
  const { token, logout } = useAuth()

  const req = async (path: string, opts: RequestInit = {}) => {
    const res = await fetch(path, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(opts.headers as Record<string, string> ?? {}),
      },
    })
    if (res.status === 401) { logout(); throw new Error('Sessão expirada') }
    return res
  }

  return { req }
}
