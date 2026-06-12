import { useState, Component } from 'react'
import type { ReactNode } from 'react'
import {
  Calculator, BarChart2, ChevronLeft, ChevronRight,
  FileText, AlertTriangle, RefreshCw, LogOut, Shield, AlertCircle,
} from 'lucide-react'
// FileText mantido para ícone no sidebar; PDF export removido intencionalmente
import FormularioEntrada from './components/FormularioEntrada'
import ResultadosDashboard from './components/ResultadosDashboard'
import { calcularTodosOsCenarios } from './engine/calculadora'
import type { ResultadoCalculo, DadosEntrada } from './types'
import { useAuth } from './auth/AuthContext'
import { useApi } from './auth/useApi'
import Login from './pages/Login'
import Admin from './pages/Admin'

// ─── ErrorBoundary ────────────────────────────────────────────────────────────

interface EBProps  { onVoltar?: () => void; children: ReactNode }
interface EBState  { erro: Error | null }

class ErrorBoundary extends Component<EBProps, EBState> {
  constructor(p: EBProps) { super(p); this.state = { erro: null } }
  static getDerivedStateFromError(e: Error): EBState { return { erro: e } }
  render() {
    if (this.state.erro) return (
      <div className="m-8 card-elevated p-8 text-center space-y-4 max-w-lg mx-auto">
        <div className="w-12 h-12 rounded-full bg-danger-soft flex items-center justify-center mx-auto">
          <AlertTriangle size={22} strokeWidth={1.75} className="text-danger" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold text-ink mb-1">Erro ao exibir os resultados</h3>
          <p className="text-sm text-ink-secondary">Ocorreu um problema inesperado. Volte ao formulário e tente novamente.</p>
        </div>
        <pre className="text-danger text-xs bg-danger-soft rounded-lg p-3 text-left overflow-auto max-h-32 border border-danger-border">
          {this.state.erro?.message}
        </pre>
        <button
          onClick={() => { this.setState({ erro: null }); this.props.onVoltar?.() }}
          className="btn-secondary mx-auto"
        >
          ← Voltar ao formulário
        </button>
      </div>
    )
    return this.props.children
  }
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

interface SidebarProps {
  etapa: 'formulario' | 'resultados'
  collapsed: boolean
  onToggle: () => void
  onReset: () => void
  onAdmin?: () => void
  onLogout: () => void
  username: string
  isAdmin: boolean
  simulacoesUsadas: number
  simulacoesLimite: number | null
}

function Sidebar({ etapa, collapsed, onReset, onAdmin, onLogout, username, isAdmin, simulacoesUsadas, simulacoesLimite }: SidebarProps) {
  return (
    <aside className="sidebar h-full w-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-border overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-prim flex items-center justify-center flex-shrink-0">
          <Calculator size={15} strokeWidth={1.75} className="text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-display font-semibold text-sm text-ink leading-tight">ReformaCalc</div>
            <div className="text-2xs text-ink-muted leading-tight">Tributário Profissional</div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {!collapsed && <p className="sidebar-group-label mt-2">Simulação</p>}

        <button
          onClick={etapa === 'resultados' ? onReset : undefined}
          className={`sidebar-item w-full ${etapa === 'formulario' ? 'active' : ''}`}
          title={collapsed ? 'Dados da Empresa' : undefined}
        >
          <FileText size={17} strokeWidth={1.75} className="flex-shrink-0" />
          {!collapsed && <span>Dados da Empresa</span>}
        </button>

        <button
          className={`sidebar-item w-full ${etapa === 'resultados' ? 'active' : ''} ${etapa === 'formulario' ? 'opacity-40 cursor-not-allowed' : ''}`}
          title={collapsed ? 'Análise Tributária' : undefined}
          disabled={etapa === 'formulario'}
        >
          <BarChart2 size={17} strokeWidth={1.75} className="flex-shrink-0" />
          {!collapsed && <span>Análise Tributária</span>}
        </button>

        {isAdmin && (
          <>
            {!collapsed && <p className="sidebar-group-label mt-3">Administração</p>}
            <button
              onClick={onAdmin}
              className="sidebar-item w-full"
              title={collapsed ? 'Painel Admin' : undefined}
            >
              <Shield size={17} strokeWidth={1.75} className="flex-shrink-0" />
              {!collapsed && <span>Painel Admin</span>}
            </button>
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="p-2 border-t border-border space-y-1">
        {etapa === 'resultados' && (
          <button onClick={onReset} className="sidebar-item w-full text-ink-secondary" title={collapsed ? 'Nova simulação' : undefined}>
            <RefreshCw size={15} strokeWidth={1.75} className="flex-shrink-0" />
            {!collapsed && <span className="text-xs">Nova simulação</span>}
          </button>
        )}

        {/* Contador de simulações */}
        {!collapsed && !isAdmin && simulacoesLimite != null && (
          <div className="px-3 py-2">
            <div className="flex justify-between text-2xs text-ink-muted mb-1">
              <span>Simulações</span>
              <span className={simulacoesUsadas >= simulacoesLimite ? 'text-danger font-medium' : ''}>
                {simulacoesUsadas}/{simulacoesLimite}
              </span>
            </div>
            <div className="h-1 rounded-full bg-border overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${simulacoesUsadas >= simulacoesLimite ? 'bg-danger' : simulacoesUsadas / simulacoesLimite > 0.7 ? 'bg-amber-500' : 'bg-prim'}`}
                style={{ width: `${Math.min((simulacoesUsadas / simulacoesLimite) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Usuário logado */}
        {!collapsed && (
          <div className="px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-2xs font-medium text-ink truncate max-w-[120px]">{username}</div>
              {isAdmin && <span className="badge badge-gold text-2xs">Admin</span>}
            </div>
            <button onClick={onLogout} title="Sair" className="p-1 rounded hover:bg-surface text-ink-muted hover:text-danger transition-colors">
              <LogOut size={13} />
            </button>
          </div>
        )}

        {collapsed && (
          <button onClick={onLogout} title="Sair" className="sidebar-item w-full text-ink-muted">
            <LogOut size={15} strokeWidth={1.75} className="flex-shrink-0" />
          </button>
        )}

        {!collapsed && (
          <div className="px-3 py-1">
            <span className="badge badge-gold text-2xs">Beta · LC 214/2025</span>
          </div>
        )}
      </div>
    </aside>
  )
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepBar({ etapa }: { etapa: 'formulario' | 'resultados' }) {
  const steps = [
    { n: 1, label: 'Dados da Empresa',  done: etapa === 'resultados', active: etapa === 'formulario' },
    { n: 2, label: 'Análise Tributária', done: false,                  active: etapa === 'resultados' },
  ]
  return (
    <div className="flex items-center gap-3">
      {steps.map((s, i) => (
        <div key={s.n} className="flex items-center gap-3">
          {i > 0 && <div className="w-6 h-px bg-border" />}
          <div className="flex items-center gap-2">
            <div className={`step-dot ${s.active ? 'active' : s.done ? 'done' : 'inactive'}`}>
              {s.done ? '✓' : s.n}
            </div>
            <span className={`text-xs font-medium hidden sm:block ${s.active ? 'text-ink' : 'text-ink-muted'}`}>
              {s.label}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── SimuladorApp (isolado por usuário via key) ───────────────────────────────

type Etapa = 'formulario' | 'resultados'

interface SimuladorAppProps {
  usuario: import('./auth/AuthContext').Usuario
  onAdmin: () => void
  onLogout: () => void
}

function SimuladorApp({ usuario, onAdmin, onLogout }: SimuladorAppProps) {
  const { req } = useApi()
  const { atualizarContador } = useAuth()

  const [etapa, setEtapa]           = useState<Etapa>('formulario')
  const [resultados, setResultados] = useState<ResultadoCalculo | null>(null)
  const [collapsed, setCollapsed]   = useState(false)
  const [erroLimite, setErroLimite] = useState('')

  const handleCalcular = async (dados: DadosEntrada) => {
    setErroLimite('')
    try {
      const res  = await req('/api/simulacao/autorizar', { method: 'POST' })
      const data = await res.json()
      if (!res.ok || !data.autorizado) {
        setErroLimite(data.erro || 'Limite de simulações atingido.')
        return
      }
      atualizarContador(data.usadas, data.limite)
    } catch {
      setErroLimite('Erro ao verificar limite. Tente novamente.')
      return
    }
    const calc = calcularTodosOsCenarios(dados)
    setResultados(calc)
    setEtapa('resultados')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleVoltar = () => {
    setEtapa('formulario')
    setErroLimite('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="flex min-h-screen bg-page">
      <div className="relative flex-shrink-0 h-screen sticky top-0 z-30" style={{ width: collapsed ? 68 : 240, transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }}>
        <Sidebar
          etapa={etapa}
          collapsed={collapsed}
          onToggle={() => setCollapsed(v => !v)}
          onReset={handleVoltar}
          onAdmin={onAdmin}
          onLogout={onLogout}
          username={usuario.username}
          isAdmin={usuario.role === 'admin'}
          simulacoesUsadas={usuario.simulacoes_usadas}
          simulacoesLimite={usuario.simulacoes_limite}
        />
        <button
          onClick={() => setCollapsed(v => !v)}
          title={collapsed ? 'Expandir' : 'Recolher'}
          className="absolute -right-3.5 top-1/2 -translate-y-1/2 z-40
            w-7 h-7 rounded-full bg-white border border-[#E4DDD2]
            flex items-center justify-center shadow-sm
            text-[#9A9286] hover:text-[#171717] hover:border-[#9A9286]
            transition-colors duration-150"
        >
          {collapsed ? <ChevronRight size={13} strokeWidth={2} /> : <ChevronLeft size={13} strokeWidth={2} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <header className="page-header flex-shrink-0">
          <div>
            {etapa === 'formulario' ? (
              <>
                <h1 className="page-title">Simulador de Impacto</h1>
                <p className="page-subtitle">Análise do IVA Dual conforme LC 214/2025 · LC 227/2026</p>
              </>
            ) : (
              <>
                <h1 className="page-title">
                  {resultados?.nomePrincipal ? resultados.nomePrincipal : 'Análise Tributária'}
                </h1>
                <p className="page-subtitle">
                  {resultados?.setor.label.split('(')[0].trim()} · {resultados?.regime.replace('_', ' ')}
                </p>
              </>
            )}
          </div>
          <div className="flex items-center gap-3">
            <StepBar etapa={etapa} />
          </div>
        </header>

        <main className="flex-1 px-6 sm:px-8 py-8 max-w-5xl mx-auto w-full">
          {erroLimite && (
            <div className="mb-6 flex items-start gap-3 bg-danger-soft border border-danger-border rounded-xl px-4 py-4 text-sm text-danger">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Limite de simulações atingido</p>
                <p className="text-danger/80 mt-0.5">{erroLimite}</p>
              </div>
            </div>
          )}

          {etapa === 'formulario' ? (
            <FormularioEntrada onCalcular={handleCalcular} />
          ) : resultados ? (
            <ErrorBoundary onVoltar={handleVoltar}>
              <ResultadosDashboard resultados={resultados} onVoltar={handleVoltar} />
            </ErrorBoundary>
          ) : null}
        </main>

        <footer className="border-t border-border py-6 px-8">
          <p className="text-xs text-ink-muted text-center leading-relaxed max-w-2xl mx-auto">
            Simulação baseada na{' '}
            <strong className="text-ink-secondary">LC 214/2025</strong> e{' '}
            <strong className="text-ink-secondary">LC 227/2026</strong>.
            Alíquota padrão <strong className="text-ink-secondary">26,5%</strong> (CBS + IBS).
            Valores para fins educacionais — consulte um contador para análise fiscal completa.
          </p>
        </footer>
      </div>
    </div>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

type View = 'simulador' | 'admin'

export default function App() {
  const { usuario, logout } = useAuth()
  const [view, setView]     = useState<View>('simulador')

  if (!usuario) return <Login />
  if (view === 'admin' && usuario.role === 'admin') return <Admin onVoltar={() => setView('simulador')} />

  // key={usuario.id} garante que ao trocar de usuário todo o estado do simulador é destruído
  return (
    <SimuladorApp
      key={usuario.id}
      usuario={usuario}
      onAdmin={() => setView('admin')}
      onLogout={logout}
    />
  )
}
