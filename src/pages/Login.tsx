import { useState, FormEvent } from 'react'
import { Calculator, Lock, User, AlertCircle } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro]         = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setErro('')
    setLoading(true)
    try {
      await login(username, password)
    } catch (err: any) {
      setErro(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-page flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-prim flex items-center justify-center">
            <Calculator size={18} strokeWidth={1.75} className="text-white" />
          </div>
          <div>
            <div className="font-display font-semibold text-base text-ink">ReformaCalc</div>
            <div className="text-xs text-ink-muted">Tributário Profissional</div>
          </div>
        </div>

        <div className="card-elevated p-8 space-y-6">
          <div className="text-center">
            <h1 className="font-display text-xl font-semibold text-ink">Entrar</h1>
            <p className="text-sm text-ink-secondary mt-1">Acesse com suas credenciais</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-secondary">Usuário</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-white text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-prim/30 focus:border-prim"
                  placeholder="seu.usuario"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-ink-secondary">Senha</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-border bg-white text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-prim/30 focus:border-prim"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            {erro && (
              <div className="flex items-center gap-2 text-sm text-danger bg-danger-soft rounded-lg px-3 py-2.5 border border-danger-border">
                <AlertCircle size={14} className="flex-shrink-0" />
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-60"
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-ink-muted mt-6">
          Acesso restrito · LC 214/2025
        </p>
      </div>
    </div>
  )
}
