import { useState, useCallback } from 'react'
import { fmt, calcularIRPF, INSS_TETO_2026, INSS_ALIQ_SEGURADO_SOCIO, INSS_ALIQ_PATRONAL } from '../engine/calculadora'
import type { SocioAdministrador } from '../types'

function mascaraMoeda(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''
  const padded = digits.padStart(3, '0')
  const cents  = padded.slice(-2)
  const reais  = parseInt(padded.slice(0, -2), 10)
  const reaisFmt = isNaN(reais) || reais === 0 ? '0' : reais.toLocaleString('pt-BR')
  return `${reaisFmt},${cents}`
}

function parseMoeda(v: string | number): number {
  if (typeof v === 'number') return v
  if (!v) return 0
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0
}

function gerarId() {
  return Math.random().toString(36).slice(2, 9)
}

interface SocioRow {
  id: string
  nome: string
  prolaboreStr: string
}

interface SociosAdministradoresProps {
  regime: string
  numeroCard: number
  onChange: (socios: SocioAdministrador[]) => void
}

export default function SociosAdministradores({ regime, numeroCard, onChange }: SociosAdministradoresProps) {
  const [aberto, setAberto] = useState(false)
  const [socios, setSocios] = useState<SocioRow[]>([])

  const emit = useCallback((rows: SocioRow[]) => {
    onChange(rows
      .filter(r => parseMoeda(r.prolaboreStr) > 0)
      .map(r => ({ id: r.id, nome: r.nome || `Sócio ${r.id.slice(0,4)}`, prolaboreMensal: parseMoeda(r.prolaboreStr) }))
    )
  }, [onChange])

  const adicionar = () => {
    const novo = { id: gerarId(), nome: '', prolaboreStr: '' }
    const prox = [...socios, novo]
    setSocios(prox)
    emit(prox)
  }

  const remover = (id: string) => {
    const prox = socios.filter(s => s.id !== id)
    setSocios(prox)
    emit(prox)
  }

  const atualizar = (id: string, campo: 'nome' | 'prolaboreStr', valor: string) => {
    const prox = socios.map(s => s.id === id
      ? { ...s, [campo]: campo === 'prolaboreStr' ? mascaraMoeda(valor) : valor }
      : s
    )
    setSocios(prox)
    emit(prox)
  }

  const isLP = regime === 'lucro_presumido'
  const isLR = regime === 'lucro_real'
  if (!isLP && !isLR) return null

  return (
    <div className="card-elevated p-6 space-y-5">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="badge badge-info w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {numeroCard}
          </span>
          <div>
            <h3 className="section-title font-display text-base">Pró-labore dos Sócios</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Calcula IRPF e INSS individualmente por sócio — opcional, para análise de custo total
            </p>
          </div>
        </div>
        <div
          role="switch"
          aria-checked={aberto}
          aria-pressed={aberto}
          onClick={() => {
            if (aberto) { setSocios([]); onChange([]) }
            setAberto(v => !v)
          }}
          className="toggle-track flex-shrink-0"
        >
          <div className="toggle-thumb" />
        </div>
      </div>

      {aberto && (
        <div className="space-y-4">
          <p className="text-xs text-ink-muted leading-relaxed">
            Informe o pró-labore de cada sócio-administrador. O IRPF e o INSS são calculados individualmente (tabela progressiva por pessoa).
            {isLP && ' No Lucro Presumido o pró-labore não é dedutível — o custo é integralmente do sócio + empresa.'}
            {isLR && ' No Lucro Real o pró-labore é dedutível — a empresa economiza IRPJ + CSLL (24%) sobre o valor total.'}
          </p>

          {/* Lista de sócios */}
          {socios.length > 0 && (
            <div className="space-y-3">
              {socios.map((s, i) => {
                const pl = parseMoeda(s.prolaboreStr)
                const irpf = pl > 0 ? calcularIRPF(pl) : 0
                const inssEmp = pl > 0 ? Math.min(pl, INSS_TETO_2026) * INSS_ALIQ_SEGURADO_SOCIO : 0
                const inssPatronal = pl > 0 ? pl * INSS_ALIQ_PATRONAL : 0
                const beneficioLR = isLR && pl > 0 ? pl * 0.24 : 0
                const custoLiquido = Math.max(0, irpf + inssEmp + inssPatronal - beneficioLR)

                return (
                  <div key={s.id} className="bg-[#FBFAF7] border border-[#E4DDD2] rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold text-ink-muted w-5 text-center">{i + 1}</span>
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Nome */}
                        <div>
                          <label className="label mb-1">Nome <span className="text-ink-muted font-normal">(opcional)</span></label>
                          <input
                            type="text"
                            value={s.nome}
                            onChange={e => atualizar(s.id, 'nome', e.target.value)}
                            placeholder={`Sócio ${i + 1}`}
                            className="input-field"
                          />
                        </div>
                        {/* Pró-labore */}
                        <div>
                          <label className="label mb-1">Pró-labore Mensal</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium select-none">R$</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              value={s.prolaboreStr}
                              onChange={e => atualizar(s.id, 'prolaboreStr', e.target.value)}
                              placeholder="0"
                              className="input-field pl-10 num"
                            />
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => remover(s.id)}
                        className="flex-shrink-0 p-1.5 rounded-lg text-ink-muted hover:text-danger hover:bg-danger-soft transition-colors"
                        title="Remover sócio"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>

                    {/* Preview IRPF + INSS */}
                    {pl > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                        <div className="bg-white border border-[#E4DDD2] rounded-lg px-3 py-2">
                          <p className="text-ink-muted uppercase tracking-wide font-semibold" style={{fontSize:'10px'}}>IRPF</p>
                          <p className="font-bold num text-danger mt-0.5">{fmt.moeda(irpf)}/mês</p>
                        </div>
                        <div className="bg-white border border-[#E4DDD2] rounded-lg px-3 py-2">
                          <p className="text-ink-muted uppercase tracking-wide font-semibold" style={{fontSize:'10px'}}>INSS sócio</p>
                          <p className="font-bold num text-danger mt-0.5">{fmt.moeda(inssEmp)}/mês</p>
                        </div>
                        <div className="bg-white border border-[#E4DDD2] rounded-lg px-3 py-2">
                          <p className="text-ink-muted uppercase tracking-wide font-semibold" style={{fontSize:'10px'}}>INSS patronal</p>
                          <p className="font-bold num text-danger mt-0.5">{fmt.moeda(inssPatronal)}/mês</p>
                        </div>
                        <div className={`rounded-lg px-3 py-2 border ${custoLiquido > 0 ? 'bg-[#FDECEC] border-[#F4A9A5]' : 'bg-[#E7F4ED] border-[#A8D5BC]'}`}>
                          <p className="uppercase tracking-wide font-semibold" style={{fontSize:'10px', color: custoLiquido > 0 ? '#B42318' : '#2F7D57'}}>Custo líquido</p>
                          <p className={`font-bold num mt-0.5 ${custoLiquido > 0 ? 'text-danger' : 'text-success'}`}>{fmt.moeda(custoLiquido)}/mês</p>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Totais */}
          {socios.filter(s => parseMoeda(s.prolaboreStr) > 0).length > 1 && (() => {
            const validos = socios.filter(s => parseMoeda(s.prolaboreStr) > 0)
            const totalPL     = validos.reduce((a, s) => a + parseMoeda(s.prolaboreStr), 0)
            const totalIRPF   = validos.reduce((a, s) => a + calcularIRPF(parseMoeda(s.prolaboreStr)), 0)
            const totalInssE  = validos.reduce((a, s) => a + Math.min(parseMoeda(s.prolaboreStr), INSS_TETO_2026) * INSS_ALIQ_SEGURADO_SOCIO, 0)
            const totalInssP  = validos.reduce((a, s) => a + parseMoeda(s.prolaboreStr) * INSS_ALIQ_PATRONAL, 0)
            const beneficioLR = isLR ? totalPL * 0.24 : 0
            const custoLiq    = Math.max(0, totalIRPF + totalInssE + totalInssP - beneficioLR)
            return (
              <div className="bg-[#EFEAE1] border border-[#9A9286] rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">Total — todos os sócios</p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div><span className="text-ink-muted">IRPF total</span><br/><span className="font-bold num text-danger">{fmt.moeda(totalIRPF)}/mês</span></div>
                  <div><span className="text-ink-muted">INSS sócios</span><br/><span className="font-bold num text-danger">{fmt.moeda(totalInssE)}/mês</span></div>
                  <div><span className="text-ink-muted">INSS patronal</span><br/><span className="font-bold num text-danger">{fmt.moeda(totalInssP)}/mês</span></div>
                  <div>
                    <span className="text-ink-muted">{isLR ? 'Custo líquido (após LR)' : 'Custo líquido'}</span><br/>
                    <span className={`font-bold num ${custoLiq > 0 ? 'text-danger' : 'text-success'}`}>{fmt.moeda(custoLiq)}/mês</span>
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Botão adicionar */}
          <button
            type="button"
            onClick={adicionar}
            className="btn-secondary text-sm flex items-center gap-2"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Adicionar sócio
          </button>
        </div>
      )}
    </div>
  )
}
