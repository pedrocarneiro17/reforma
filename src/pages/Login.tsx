import { useState, FormEvent } from 'react'
import { Lock, User, AlertCircle, Eye, EyeOff, BarChart2, Scale, FileText } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
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

  const campo = 'w-full h-12 pl-11 pr-11 rounded-[14px] border-[1.5px] border-ink-muted bg-white text-[15px] text-ink placeholder:text-ink-muted focus:outline-none focus:border-prim focus:ring-[3px] focus:ring-prim/20'

  return (
    <div className="min-h-screen bg-white grid lg:grid-cols-[52%_48%]">
      {/* Lado marinho com as barras da logo */}
      <aside className="hidden lg:flex relative overflow-hidden text-white p-12 flex-col justify-between"
        style={{ background: 'linear-gradient(160deg, hsl(215 44% 28%), hsl(214 62% 22%) 55%, hsl(213 62% 17%))' }}>
        <svg aria-hidden focusable="false" viewBox="0 0 405 437" preserveAspectRatio="xMaxYMax meet" className="barras-marca" style={{ height: 300, right: 40, opacity: 0.4 }}>
          <polygon points="0,437 0,333 57,300 57,437" />
          <polygon points="117,437 117,261 174,222 174,437" />
          <polygon points="231,437 231,176 288,126 288,437" />
          <polygon points="348,437 348,67 405,0 405,437" />
        </svg>
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.svg" alt="Contajur" className="w-11 h-11 rounded-xl bg-white p-1" />
          <span className="font-display font-bold text-xl tracking-[0.14em]">CONTAJUR</span>
        </div>
        <div className="relative z-10">
          <h1 className="font-display font-bold text-[40px] leading-[1.1] mb-3" style={{ color: '#fff' }}>ReformaCalc</h1>
          <p className="text-[16px] leading-relaxed max-w-sm" style={{ color: 'hsl(214 52% 88%)' }}>
            Simulador da Reforma Tributária: compare a carga de hoje com o IVA Dual (CBS + IBS) de 2026 a 2033, por setor e regime.
          </p>
          <ul className="mt-7 space-y-3">
            {[[BarChart2, 'Comparativo de regimes e transição ano a ano'], [Scale, 'Base legal: LC 214/2025 e LC 227/2026'], [FileText, 'Memória de cálculo e relatório em PDF']].map(([Icone, texto]: any) => (
              <li key={texto} className="flex items-center gap-3 text-[14px]" style={{ color: 'hsl(217 56% 94%)' }}>
                <span className="w-8 h-8 rounded-full border-[1.5px] border-white/35 grid place-items-center flex-shrink-0"><Icone size={15} strokeWidth={1.75} /></span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <small className="relative z-10 text-xs" style={{ color: 'hsl(214 52% 88%)' }}>Contajur Contabilidade · estimativas educacionais</small>
      </aside>

      {/* Formulário */}
      <main className="grid place-items-center px-6 py-10">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <img src="/logo.svg" alt="Contajur" className="w-9 h-9 rounded-[10px] border border-border p-[3px]" />
            <span className="font-display font-bold tracking-[0.12em] text-prim">REFORMACALC</span>
          </div>
          <h1 className="font-display font-bold text-[28px] text-prim mb-1">Entrar</h1>
          <p className="text-ink-secondary mb-6">Acesse com suas credenciais</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-semibold text-ink mb-1.5">Usuário</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  className={campo}
                  placeholder="seu.usuario"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-ink mb-1.5">Senha</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted" />
                <input
                  type={mostrarSenha ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={campo}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setMostrarSenha(v => !v)} aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full grid place-items-center text-ink-muted hover:bg-subtle">
                  {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {erro && (
              <div className="flex items-center gap-2 text-sm text-danger bg-danger-soft rounded-[12px] px-3 py-2.5 border border-danger-border">
                <AlertCircle size={14} className="flex-shrink-0" />
                {erro}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center disabled:opacity-60"
              style={{ minHeight: 48, fontSize: 15 }}
            >
              {loading ? 'Entrando…' : 'Entrar'}
            </button>
          </form>

          <p className="text-xs text-ink-muted mt-6">Acesso restrito · LC 214/2025</p>
        </div>
      </main>
    </div>
  )
}
