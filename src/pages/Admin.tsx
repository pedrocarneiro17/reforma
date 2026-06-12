import { useState, useEffect, FormEvent } from 'react'
import { Users, Plus, Trash2, RefreshCw, X, Shield, ChevronLeft } from 'lucide-react'
import { useApi } from '../auth/useApi'
import { useAuth } from '../auth/AuthContext'

interface UsuarioRow {
  id: number
  username: string
  role: string
  simulacoes_usadas: number
  simulacoes_limite: number
  criado_em: string
}

export default function Admin({ onVoltar }: { onVoltar: () => void }) {
  const { req }              = useApi()
  const { usuario: me }      = useAuth()
  const [usuarios, setUsuarios] = useState<UsuarioRow[]>([])
  const [loading, setLoading]   = useState(true)
  const [modal, setModal]       = useState(false)
  const [form, setForm]         = useState({ username: '', password: '', simulacoes_limite: '10' })
  const [formErro, setFormErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  const carregar = async () => {
    setLoading(true)
    const res = await req('/api/admin/usuarios')
    if (res.ok) setUsuarios(await res.json())
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  const criarUsuario = async (e: FormEvent) => {
    e.preventDefault()
    setFormErro('')
    setSalvando(true)
    try {
      const res = await req('/api/admin/usuarios', {
        method: 'POST',
        body: JSON.stringify({ ...form, simulacoes_limite: Number(form.simulacoes_limite) }),
      })
      const data = await res.json()
      if (!res.ok) { setFormErro(data.erro); return }
      setModal(false)
      setForm({ username: '', password: '', simulacoes_limite: '10' })
      carregar()
    } finally {
      setSalvando(false)
    }
  }

  const resetar = async (id: number) => {
    if (!confirm('Zerar as simulações deste usuário?')) return
    await req(`/api/admin/usuarios/${id}`, { method: 'PATCH', body: JSON.stringify({ resetar: true }) })
    carregar()
  }

  const excluir = async (id: number, username: string) => {
    if (!confirm(`Excluir o usuário "${username}"? Esta ação não pode ser desfeita.`)) return
    await req(`/api/admin/usuarios/${id}`, { method: 'DELETE' })
    carregar()
  }

  return (
    <div className="min-h-screen bg-page">
      {/* Header */}
      <header className="page-header">
        <div className="flex items-center gap-3">
          <button onClick={onVoltar} className="btn-secondary">
            <ChevronLeft size={15} /> Simulador
          </button>
          <div>
            <h1 className="page-title flex items-center gap-2">
              <Shield size={18} className="text-prim" /> Painel Admin
            </h1>
            <p className="page-subtitle">Gerenciamento de usuários e simulações</p>
          </div>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary">
          <Plus size={15} /> Novo usuário
        </button>
      </header>

      <main className="px-6 sm:px-8 py-8 max-w-5xl mx-auto">
        {loading ? (
          <div className="text-center text-ink-muted py-16">Carregando…</div>
        ) : (
          <div className="card-elevated overflow-hidden">
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <Users size={16} className="text-ink-secondary" />
              <span className="font-medium text-sm text-ink">{usuarios.length} usuários</span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-ink-muted">
                  <th className="px-6 py-3 font-medium">Usuário</th>
                  <th className="px-4 py-3 font-medium">Perfil</th>
                  <th className="px-4 py-3 font-medium text-center">Simulações</th>
                  <th className="px-4 py-3 font-medium">Criado em</th>
                  <th className="px-4 py-3 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(u => {
                  const pct = u.simulacoes_limite ? u.simulacoes_usadas / u.simulacoes_limite : 0
                  const atingiu = u.simulacoes_usadas >= u.simulacoes_limite && u.role !== 'admin'
                  return (
                    <tr key={u.id} className="border-b border-border last:border-0 hover:bg-surface/50">
                      <td className="px-6 py-3.5 font-medium text-ink">{u.username}</td>
                      <td className="px-4 py-3.5">
                        <span className={`badge ${u.role === 'admin' ? 'badge-gold' : 'text-xs px-2 py-0.5 rounded-full bg-surface border border-border text-ink-secondary'}`}>
                          {u.role === 'admin' ? 'Admin' : 'Usuário'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        {u.role === 'admin' ? (
                          <span className="text-ink-muted text-xs">ilimitado</span>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`font-medium ${atingiu ? 'text-danger' : 'text-ink'}`}>
                              {u.simulacoes_usadas} / {u.simulacoes_limite}
                            </span>
                            <div className="w-20 h-1.5 rounded-full bg-border overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${atingiu ? 'bg-danger' : pct > 0.7 ? 'bg-amber-500' : 'bg-prim'}`}
                                style={{ width: `${Math.min(pct * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-ink-muted">
                        {new Date(u.criado_em).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {u.role !== 'admin' && (
                            <>
                              <button
                                onClick={() => resetar(u.id)}
                                title="Zerar simulações"
                                className="p-1.5 rounded hover:bg-surface text-ink-muted hover:text-ink transition-colors"
                              >
                                <RefreshCw size={14} />
                              </button>
                              {u.id !== me?.id && (
                                <button
                                  onClick={() => excluir(u.id, u.username)}
                                  title="Excluir usuário"
                                  className="p-1.5 rounded hover:bg-danger-soft text-ink-muted hover:text-danger transition-colors"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Modal novo usuário */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="card-elevated w-full max-w-sm p-6 space-y-5 mx-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-semibold text-ink">Novo usuário</h2>
              <button onClick={() => { setModal(false); setFormErro('') }} className="p-1 rounded hover:bg-surface">
                <X size={16} className="text-ink-muted" />
              </button>
            </div>
            <form onSubmit={criarUsuario} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-secondary">Usuário</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-prim/30 focus:border-prim"
                  placeholder="joao.silva"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-secondary">Senha</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-prim/30 focus:border-prim"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-ink-secondary">Limite de simulações</label>
                <input
                  type="number"
                  min={1}
                  max={9999}
                  value={form.simulacoes_limite}
                  onChange={e => setForm(f => ({ ...f, simulacoes_limite: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-ink focus:outline-none focus:ring-2 focus:ring-prim/30 focus:border-prim"
                />
              </div>
              {formErro && (
                <p className="text-xs text-danger bg-danger-soft rounded px-3 py-2 border border-danger-border">{formErro}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => { setModal(false); setFormErro('') }} className="btn-secondary flex-1 justify-center">
                  Cancelar
                </button>
                <button type="submit" disabled={salvando} className="btn-primary flex-1 justify-center">
                  {salvando ? 'Criando…' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
