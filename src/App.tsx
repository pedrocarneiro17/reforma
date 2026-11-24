import { useState, useMemo, useEffect, Component } from 'react'
import type { ReactNode } from 'react'
import {
  Calculator, BarChart2, ChevronLeft, ChevronRight,
  FileText, AlertTriangle, RefreshCw, LogOut, Shield, AlertCircle, Menu,
} from 'lucide-react'
// FileText mantido para ícone no sidebar; PDF export removido intencionalmente
import FormularioEntrada from './components/FormularioEntrada'
import ResultadosDashboard from './components/ResultadosDashboard'
import AssistenteChat from './components/AssistenteChat'
import { calcularTodosOsCenarios, ANO_PLENO } from './engine/calculadora'
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
      <div className="flex items-center gap-3 px-4 py-5 overflow-hidden">
        <img src="/logo.svg" alt="Contajur" className="w-10 h-10 rounded-xl bg-white p-1 flex-shrink-0" />
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="font-display font-bold text-[15px] text-white leading-tight tracking-wide">ReformaCalc</div>
            <div className="text-[11.5px] leading-tight" style={{ color: 'hsl(214 52% 88%)' }}>Tributário Profissional</div>
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
      <div className="p-2 space-y-1">
        {etapa === 'resultados' && (
          <button onClick={onReset} className="sidebar-item w-full" title={collapsed ? 'Nova simulação' : undefined}>
            <RefreshCw size={15} strokeWidth={1.75} className="flex-shrink-0" />
            {!collapsed && <span className="text-xs">Nova simulação</span>}
          </button>
        )}

        {/* Contador de simulações */}
        {!collapsed && !isAdmin && simulacoesLimite != null && (
          <div className="px-3 py-2">
            <div className="flex justify-between text-2xs mb-1" style={{ color: 'hsl(214 52% 88%)' }}>
              <span>Simulações</span>
              <span className={simulacoesUsadas >= simulacoesLimite ? 'font-bold' : ''} style={simulacoesUsadas >= simulacoesLimite ? { color: 'hsl(4 98% 82%)' } : undefined}>
                {simulacoesUsadas}/{simulacoesLimite}
              </span>
            </div>
            <div className="h-1 rounded-full bg-white/20 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${simulacoesUsadas >= simulacoesLimite ? 'bg-marca' : simulacoesUsadas / simulacoesLimite > 0.7 ? 'bg-amber-300' : 'bg-white'}`}
                style={{ width: `${Math.min((simulacoesUsadas / simulacoesLimite) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Usuário logado */}
        {!collapsed && (
          <div className="px-3 py-2 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-white truncate max-w-[120px]">{username}</div>
              {isAdmin && <span className="badge text-2xs" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}>Admin</span>}
            </div>
            <button onClick={onLogout} title="Sair" className="p-1.5 rounded-full hover:bg-white/10 transition-colors" style={{ color: 'hsl(4 98% 82%)' }}>
              <LogOut size={13} />
            </button>
          </div>
        )}

        {collapsed && (
          <button onClick={onLogout} title="Sair" className="sidebar-item w-full">
            <LogOut size={15} strokeWidth={1.75} className="flex-shrink-0" />
          </button>
        )}

        {!collapsed && (
          <div className="px-3 py-1">
            <span className="badge text-2xs" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff' }}>Beta · LC 214/2025</span>
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
  const [collapsed, setCollapsed]   = useState(false)
  const [menuAberto, setMenuAberto] = useState(false)   // gaveta do menu no celular
  const [erroLimite, setErroLimite] = useState('')
  const [ultimosDados, setUltimosDados] = useState<DadosEntrada | null>(null)  // contexto do assistente
  // Ano da transição em análise: trocar o ano recalcula na hora, sem gastar uma simulação do limite
  const [anoAnalise, setAnoAnalise] = useState(ANO_PLENO)
  const resultados: ResultadoCalculo | null = useMemo(
    () => (ultimosDados ? calcularTodosOsCenarios({ ...ultimosDados, anoAnalise }) : null),
    [ultimosDados, anoAnalise],
  )
  // O assistente responde sobre o mesmo ano que está na tela
  const dadosDoAssistente = useMemo(() => (ultimosDados ? { ...ultimosDados, anoAnalise } : null), [ultimosDados, anoAnalise])

  useEffect(() => { setMenuAberto(false) }, [etapa])

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
    setUltimosDados(dados)
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
      {menuAberto && <div className="fixed inset-0 z-40 bg-black/45 lg:hidden no-print" onClick={() => setMenuAberto(false)} />}
      <div
        className={`${menuAberto ? 'fixed inset-y-0 left-0 z-50 w-[268px]' : 'hidden'} lg:block lg:relative lg:inset-auto lg:flex-shrink-0 lg:h-screen lg:sticky lg:top-0 lg:z-30 lg:w-[var(--larg)] no-print`}
        style={{ ['--larg' as any]: `${collapsed ? 68 : 240}px`, transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)' }}
      >
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
          className="hidden lg:flex absolute -right-3 top-[26px] z-40
            w-6 h-6 rounded-full border-[1.5px] border-white/35
            items-center justify-center text-white
            hover:brightness-125 transition duration-150"
          style={{ background: 'hsl(215 44% 28%)' }}
        >
          {collapsed ? <ChevronRight size={13} strokeWidth={2} /> : <ChevronLeft size={13} strokeWidth={2} />}
        </button>
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        <div className="lg:hidden flex items-center justify-between h-14 px-4 no-print">
          <button type="button" aria-label="Abrir menu" onClick={() => setMenuAberto(true)}
            className="w-10 h-10 rounded-full border-[1.5px] border-ink-muted bg-white text-prim grid place-items-center">
            <Menu size={20} />
          </button>
          <img src="/logo.svg" alt="" aria-hidden className="w-8 h-8 rounded-lg" />
        </div>
        <header className="page-header flex-shrink-0">
          <div>
            <h1 className="page-title">Simulador de Impacto</h1>
            <p className="page-subtitle">Análise do IVA Dual conforme LC 214/2025 · LC 227/2026</p>
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
              <ResultadosDashboard resultados={resultados} onVoltar={handleVoltar} onMudarAno={setAnoAnalise} />
            </ErrorBoundary>
          ) : null}
        </main>

        <footer className="border-t border-border py-6 px-8">
          <p className="text-xs text-ink-muted text-center leading-relaxed max-w-2xl mx-auto">
            Simulação baseada na{' '}
            <strong className="text-ink-secondary">LC 214/2025</strong> e{' '}
            <strong className="text-ink-secondary">LC 227/2026</strong>.
            Alíquota de referência de <strong className="text-ink-secondary">26,5%</strong> (CBS + IBS) por padrão — a lei não a fixa; ajustável no formulário.
            Valores para fins educacionais — consulte um contador para análise fiscal completa.
          </p>
        </footer>
      </div>

      <AssistenteChat dados={dadosDoAssistente} />
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
