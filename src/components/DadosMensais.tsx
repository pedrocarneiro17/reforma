import { useState, useEffect, useMemo, useCallback } from 'react'
import { fmt } from '../engine/calculadora'
import type { AggregateMeses } from '../types'

const NOMES_MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function getUltimos12Meses() {
  const hoje = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - 11 + i, 1)
    return {
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${NOMES_MESES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
    }
  })
}

const MESES = getUltimos12Meses()

interface LinhaInput {
  faturamento: string
  insumos: string
  impostos: string
  exportacoes: string
  folha: string
}

const LINHA_VAZIA: LinhaInput = { faturamento: '', insumos: '', impostos: '', exportacoes: '', folha: '' }

function mascaraMoeda(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''
  const padded = digits.padStart(3, '0')
  const cents  = padded.slice(-2)
  const reais  = parseInt(padded.slice(0, -2), 10)
  const reaisFmt = isNaN(reais) || reais === 0
    ? '0'
    : reais.toLocaleString('pt-BR')
  return `${reaisFmt},${cents}`
}

function valorParaMascara(v: string | number): string {
  const num = typeof v === 'number'
    ? v
    : parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0
  if (!num) return ''
  return mascaraMoeda(Math.round(num * 100).toString())
}

function parseNum(v: string | number): number {
  if (typeof v === 'number') return v
  // Remove pontos de milhar, substitui vírgula decimal por ponto
  const n = parseFloat(String(v).replace(/\./g, '').replace(',', '.'))
  return isNaN(n) || n < 0 ? 0 : n
}

function soma(arr: LinhaInput[], campo: keyof LinhaInput): number {
  return arr.reduce((acc, m) => acc + parseNum(m[campo]), 0)
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

interface SparklineProps {
  valores: number[]
  color?: string
}

function Sparkline({ valores, color = '#38bdf8' }: SparklineProps) {
  if (!valores.length || valores.every(v => v === 0)) return null
  const max = Math.max(...valores)
  const min = Math.min(...valores)
  const range = max - min || 1
  const W = 80
  const H = 24
  const points = valores
    .map((v, i) => {
      const x = (i / (valores.length - 1)) * W
      const y = H - ((v - min) / range) * (H - 4) - 2
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg width={W} height={H} className="opacity-70">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" points={points} />
    </svg>
  )
}

// ─── DadosMensais ─────────────────────────────────────────────────────────────

interface DadosMensaisProps {
  onChange?: (aggregates: AggregateMeses) => void
  valoresIniciais?: {
    faturamento?: string | number
    insumos?: string | number
  }
}

export default function DadosMensais({ onChange, valoresIniciais }: DadosMensaisProps) {
  const [linhas, setLinhas] = useState<LinhaInput[]>(() =>
    MESES.map(() => ({ ...LINHA_VAZIA }))
  )
  const [mostrarImpostos, setMostrarImpostos] = useState(false)
  const [mostrarExportacoes, setMostrarExportacoes] = useState(false)
  const [mostrarFolha, setMostrarFolha] = useState(false)
  const [fillValue, setFillValue] = useState<LinhaInput>({ faturamento: '', insumos: '', impostos: '', exportacoes: '', folha: '' })
  const [showFillBar, setShowFillBar] = useState(false)

  useEffect(() => {
    if (valoresIniciais?.faturamento || valoresIniciais?.insumos) {
      const fmtFat = valoresIniciais.faturamento ? valorParaMascara(valoresIniciais.faturamento) : ''
      const fmtIns = valoresIniciais.insumos ? valorParaMascara(valoresIniciais.insumos) : ''
      setLinhas(prev => prev.map(l => ({
        ...l,
        faturamento: l.faturamento || fmtFat,
        insumos: l.insumos || fmtIns,
      })))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const aggregates = useMemo<AggregateMeses>(() => {
    const totalFat = soma(linhas, 'faturamento')
    const totalIns = soma(linhas, 'insumos')
    const totalImp = soma(linhas, 'impostos')
    const totalExp = soma(linhas, 'exportacoes')
    const totalFolha = soma(linhas, 'folha')

    const temImpostos = mostrarImpostos && totalImp > 0
    const temExportacoes = mostrarExportacoes && totalExp > 0
    const temFolha = mostrarFolha && totalFolha > 0
    const mesesComDados = linhas.filter(l => parseNum(l.faturamento) > 0).length || 12

    return {
      meses: MESES.map((m, i) => ({
        ...m,
        faturamento: parseNum(linhas[i].faturamento),
        insumos: parseNum(linhas[i].insumos),
        impostos: parseNum(linhas[i].impostos),
        exportacoes: parseNum(linhas[i].exportacoes),
      })),
      totais: { faturamento: totalFat, insumos: totalIns, impostos: totalImp, exportacoes: totalExp, folha: totalFolha },
      medias: {
        faturamento: totalFat / mesesComDados,
        insumos: totalIns / mesesComDados,
        impostos: totalImp / mesesComDados,
        exportacoes: totalExp / mesesComDados,
        folha: totalFolha / mesesComDados,
      },
      aliquotaRealApurada: temImpostos && totalFat > 0 ? totalImp / totalFat : null,
      temImpostos,
      temExportacoes,
      temFolha,
    }
  }, [linhas, mostrarImpostos, mostrarExportacoes, mostrarFolha])

  useEffect(() => {
    onChange?.(aggregates)
  }, [aggregates]) // eslint-disable-line react-hooks/exhaustive-deps

  const setLinha = useCallback((idx: number, campo: keyof LinhaInput, valor: string) => {
    setLinhas(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], [campo]: mascaraMoeda(valor) }
      return next
    })
  }, [])

  const preencherTudo = () => {
    setLinhas(prev => prev.map(l => ({
      faturamento: fillValue.faturamento || l.faturamento,
      insumos: fillValue.insumos || l.insumos,
      impostos: fillValue.impostos || l.impostos,
      exportacoes: fillValue.exportacoes || l.exportacoes,
      folha: fillValue.folha || l.folha,
    })))
    setShowFillBar(false)
    setFillValue({ faturamento: '', insumos: '', impostos: '', exportacoes: '', folha: '' })
  }

  const limparTudo = () => setLinhas(MESES.map(() => ({ ...LINHA_VAZIA })))

  const faturamentos = aggregates.meses.map(m => m.faturamento)
  const impostos = aggregates.meses.map(m => m.impostos)

  const camposExibidos = [
    'faturamento',
    'insumos',
    ...(mostrarImpostos ? ['impostos'] : []),
    ...(mostrarExportacoes ? ['exportacoes'] : []),
    ...(mostrarFolha ? ['folha'] : []),
  ] as (keyof LinhaInput)[]

  return (
    <div className="space-y-4">

      {/* ── Barra de controles ──────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              role="switch"
              aria-checked={mostrarImpostos}
              onClick={() => setMostrarImpostos(v => !v)}
              className="toggle-track"
              aria-pressed={mostrarImpostos}
            >
              <div className="toggle-thumb" />
            </div>
            <span className="text-xs text-ink-secondary font-medium">Impostos pagos</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              role="switch"
              aria-checked={mostrarExportacoes}
              onClick={() => setMostrarExportacoes(v => !v)}
              className="toggle-track"
              aria-pressed={mostrarExportacoes}
            >
              <div className="toggle-thumb" />
            </div>
            <span className="text-xs text-ink-secondary font-medium">Exportações (isentas de IVA)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              role="switch"
              aria-checked={mostrarFolha}
              onClick={() => setMostrarFolha(v => !v)}
              className="toggle-track"
              aria-pressed={mostrarFolha}
            >
              <div className="toggle-thumb" />
            </div>
            <span className="text-xs text-ink-secondary font-medium">Folha mensal (Fator R)</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowFillBar(v => !v)}
            className="btn-secondary text-xs px-3 py-1.5"
          >
            Preencher em lote
          </button>
          <button
            type="button"
            onClick={limparTudo}
            className="btn-secondary text-xs px-3 py-1.5 text-ink-muted hover:text-danger hover:border-danger"
          >
            Limpar
          </button>
        </div>
      </div>

      {/* ── Barra de preenchimento em lote ──────────────────────────────── */}
      {showFillBar && (
        <div className="insight-info rounded-lg p-4">
          <p className="text-xs font-medium mb-3">
            Digite o valor que será replicado em todos os meses em branco:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {camposExibidos.map(campo => (
              <div key={campo}>
                <label className="label capitalize text-xs">
                  {campo === 'exportacoes' ? 'Exportações' : campo.charAt(0).toUpperCase() + campo.slice(1)}
                </label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-muted text-xs">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={fillValue[campo]}
                    onChange={e => setFillValue(prev => ({ ...prev, [campo]: mascaraMoeda(e.target.value) }))}
                    placeholder="0"
                    className="input-field pl-7 py-2 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            <button type="button" onClick={preencherTudo} className="btn-primary py-2 px-5 text-sm">
              Aplicar
            </button>
            <button type="button" onClick={() => setShowFillBar(false)} className="btn-secondary py-2 px-4 text-sm">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Tabela de 12 meses ──────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="table-premium w-full text-sm min-w-[480px]">
          <thead>
            <tr className="bg-subtle border-b border-border">
              <th className="text-left pr-2 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide w-20 sticky left-0 bg-subtle">
                Mês
              </th>
              <th className="text-right px-3 py-3 text-info font-medium text-xs uppercase tracking-wide">
                Faturamento
              </th>
              <th className="text-right px-3 py-3 text-warning font-medium text-xs uppercase tracking-wide">
                Compras / Insumos
              </th>
              {mostrarImpostos && (
                <th className="text-right px-3 py-3 text-warning font-medium text-xs uppercase tracking-wide">
                  Impostos Pagos
                </th>
              )}
              {mostrarExportacoes && (
                <th className="text-right px-3 py-3 text-success font-medium text-xs uppercase tracking-wide">
                  Exportações
                </th>
              )}
              {mostrarFolha && (
                <th className="text-right px-3 py-3 text-ink-secondary font-medium text-xs uppercase tracking-wide">
                  Folha
                </th>
              )}
              {mostrarImpostos && (
                <th className="text-right pl-2 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">
                  Alíq. Real
                </th>
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-border">
            {MESES.map((mes, idx) => {
              const linha = linhas[idx]
              const fat = parseNum(linha.faturamento)
              const imp = parseNum(linha.impostos)
              const aliqReal = mostrarImpostos && fat > 0 && imp > 0 ? (imp / fat) * 100 : null
              const isLast = idx === 11

              return (
                <tr
                  key={mes.key}
                  className={`group transition-colors ${isLast ? 'bg-info-soft' : 'hover:bg-subtle'}`}
                >
                  <td className="pr-2 py-2.5 sticky left-0 bg-surface group-hover:bg-subtle transition-colors">
                    <span className="text-ink font-semibold text-sm">{mes.label}</span>
                    {isLast && <span className="ml-1.5 text-xs text-info">(último)</span>}
                  </td>

                  <td className="px-2 py-2">
                    <MoneyInput value={linha.faturamento} onChange={v => setLinha(idx, 'faturamento', v)} color="blue" />
                  </td>

                  <td className="px-2 py-2">
                    <MoneyInput value={linha.insumos} onChange={v => setLinha(idx, 'insumos', v)} color="orange" />
                  </td>

                  {mostrarImpostos && (
                    <td className="px-2 py-2">
                      <MoneyInput value={linha.impostos} onChange={v => setLinha(idx, 'impostos', v)} color="amber" />
                    </td>
                  )}

                  {mostrarExportacoes && (
                    <td className="px-2 py-2">
                      <MoneyInput value={linha.exportacoes} onChange={v => setLinha(idx, 'exportacoes', v)} color="emerald" />
                    </td>
                  )}

                  {mostrarFolha && (
                    <td className="px-2 py-2">
                      <MoneyInput value={linha.folha} onChange={v => setLinha(idx, 'folha', v)} color="slate" />
                    </td>
                  )}

                  {mostrarImpostos && (
                    <td className="pl-2 py-2.5 text-right">
                      {aliqReal !== null ? (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md border num
                          ${aliqReal > 20 ? 'bg-danger-soft text-danger border-danger-border' :
                            aliqReal > 12 ? 'bg-warning-soft text-warning border-warning-border' :
                            'bg-success-soft text-success border-success-border'}`}
                        >
                          {aliqReal.toFixed(1).replace('.', ',')}%
                        </span>
                      ) : (
                        <span className="text-ink-muted opacity-30 text-xs">—</span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>

          <tfoot>
            <TotalRow
              label="TOTAL 12M"
              faturamento={aggregates.totais.faturamento}
              insumos={aggregates.totais.insumos}
              impostos={mostrarImpostos ? aggregates.totais.impostos : null}
              exportacoes={mostrarExportacoes ? aggregates.totais.exportacoes : null}
              folha={mostrarFolha ? aggregates.totais.folha : null}
              aliquotaGlobal={aggregates.aliquotaRealApurada}
              isTotais
            />
            <TotalRow
              label="MÉDIA MÊS"
              faturamento={aggregates.medias.faturamento}
              insumos={aggregates.medias.insumos}
              impostos={mostrarImpostos ? aggregates.medias.impostos : null}
              exportacoes={mostrarExportacoes ? aggregates.medias.exportacoes : null}
              folha={mostrarFolha ? aggregates.medias.folha : null}
            />
          </tfoot>
        </table>
      </div>

      {/* ── Painel de métricas / sparklines ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <MetricCard
          label="Faturamento Médio/Mês"
          valor={aggregates.medias.faturamento}
          total={aggregates.totais.faturamento}
          color="blue"
          sparkline={faturamentos}
          sparkColor="#315C8C"
        />
        <MetricCard
          label="Insumos Médios/Mês"
          valor={aggregates.medias.insumos}
          total={aggregates.totais.insumos}
          color="orange"
          sparkline={aggregates.meses.map(m => m.insumos)}
          sparkColor="#C08A40"
          extra={aggregates.totais.faturamento > 0
            ? `${((aggregates.totais.insumos / aggregates.totais.faturamento) * 100).toFixed(1)}% do faturamento`
            : undefined
          }
        />
        {mostrarImpostos ? (
          <MetricCard
            label="Alíquota Real Apurada"
            isAliquota
            valor={aggregates.aliquotaRealApurada ?? 0}
            total={aggregates.totais.impostos}
            color="amber"
            sparkline={impostos}
            sparkColor="#C08A40"
            extra="baseada nos impostos informados"
          />
        ) : (
          <div className="bg-subtle border border-dashed border-border rounded-lg p-4 flex flex-col items-center justify-center text-center gap-2">
            <p className="text-ink-muted text-xs leading-relaxed">
              Ative <strong className="text-ink-secondary">Impostos pagos</strong> para calcular a alíquota real e melhorar a precisão da simulação.
            </p>
          </div>
        )}
      </div>

      {/* ── Alerta: alíquota real vs estimada ───────────────────────────── */}
      {aggregates.aliquotaRealApurada != null && (
        <div className="insight-warning flex items-start gap-3">
          <div>
            <p className="text-sm font-medium">
              Alíquota real de <span className="num">{fmt.pct(aggregates.aliquotaRealApurada)}</span> apurada a partir dos dados reais.
            </p>
            <p className="text-xs mt-1 leading-relaxed opacity-80">
              O motor de cálculo vai usar essa alíquota real no lugar da estimativa de tabela, tornando a simulação mais precisa para a sua empresa.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── MoneyInput ───────────────────────────────────────────────────────────────

type InputColor = 'blue' | 'orange' | 'amber' | 'emerald' | 'slate'

const COLOR_RING: Record<InputColor, string> = {
  blue:    'focus:ring-info-border/50 border-info-border focus:border-info',
  orange:  'focus:ring-warning-border/50 border-warning-border focus:border-warning',
  amber:   'focus:ring-warning-border/50 border-warning-border focus:border-warning',
  emerald: 'focus:ring-success-border/50 border-success-border focus:border-success',
  slate:   'focus:ring-[#9A9286]/30 border-[#C4BDB4] focus:border-[#9A9286]',
}

interface MoneyInputProps {
  value: string
  onChange: (v: string) => void
  color?: InputColor
}

function MoneyInput({ value, onChange, color = 'blue' }: MoneyInputProps) {
  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-ink-muted text-xs select-none">R$</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={e => onChange(mascaraMoeda(e.target.value))}
        placeholder="0"
        className={`w-full bg-surface border rounded-lg pl-6 pr-2 py-1.5 text-ink text-sm text-right num
          placeholder-ink-muted focus:outline-none focus:ring-1 transition-all
          ${COLOR_RING[color] ?? COLOR_RING.blue}`}
      />
    </div>
  )
}

// ─── TotalRow ─────────────────────────────────────────────────────────────────

interface TotalRowProps {
  label: string
  faturamento: number
  insumos: number
  impostos?: number | null
  exportacoes?: number | null
  folha?: number | null
  aliquotaGlobal?: number | null
  isTotais?: boolean
}

function TotalRow({ label, faturamento, insumos, impostos, exportacoes, folha, aliquotaGlobal, isTotais }: TotalRowProps) {
  return (
    <tr className={`border-t-2 ${isTotais ? 'border-border bg-subtle' : 'border-border bg-raised'}`}>
      <td className={`pr-2 py-3 sticky left-0 font-bold text-xs uppercase tracking-wider
        ${isTotais ? 'text-ink-secondary bg-subtle' : 'text-ink-muted bg-raised'}`}
      >
        {label}
      </td>
      <td className="px-2 py-3 text-right">
        <span className={`font-bold text-sm num ${isTotais ? 'text-info' : 'text-info opacity-80'}`}>
          {fmt.moeda(faturamento)}
        </span>
      </td>
      <td className="px-2 py-3 text-right">
        <span className={`font-bold text-sm num ${isTotais ? 'text-warning' : 'text-warning opacity-80'}`}>
          {fmt.moeda(insumos)}
        </span>
      </td>
      {impostos !== null && impostos !== undefined && (
        <td className="px-2 py-3 text-right">
          <span className={`font-bold text-sm num ${isTotais ? 'text-warning' : 'text-warning opacity-80'}`}>
            {fmt.moeda(impostos)}
          </span>
        </td>
      )}
      {exportacoes !== null && exportacoes !== undefined && (
        <td className="px-2 py-3 text-right">
          <span className={`font-bold text-sm num ${isTotais ? 'text-success' : 'text-success opacity-80'}`}>
            {fmt.moeda(exportacoes)}
          </span>
        </td>
      )}
      {folha !== null && folha !== undefined && (
        <td className="px-2 py-3 text-right">
          <span className={`font-bold text-sm num ${isTotais ? 'text-ink-secondary' : 'text-ink-secondary opacity-80'}`}>
            {fmt.moeda(folha)}
          </span>
        </td>
      )}
      {aliquotaGlobal !== undefined && (
        <td className="pl-2 py-3 text-right">
          {aliquotaGlobal != null && isTotais ? (
            <span className={`text-sm font-bold px-2 py-0.5 rounded-md border num
              ${aliquotaGlobal > 0.20 ? 'bg-danger-soft text-danger border-danger-border' :
                aliquotaGlobal > 0.12 ? 'bg-warning-soft text-warning border-warning-border' :
                'bg-success-soft text-success border-success-border'}`}
            >
              {fmt.pct(aliquotaGlobal)}
            </span>
          ) : (
            <span className="text-ink-muted opacity-40 text-xs">—</span>
          )}
        </td>
      )}
    </tr>
  )
}

// ─── MetricCard ───────────────────────────────────────────────────────────────

type MetricColor = 'blue' | 'orange' | 'amber' | 'emerald'

interface MetricCardProps {
  label: string
  valor: number
  total: number
  color: MetricColor
  sparkline: number[]
  sparkColor: string
  extra?: string
  isAliquota?: boolean
}

function MetricCard({ label, valor, total, color, sparkline, sparkColor, extra, isAliquota }: MetricCardProps) {
  const hasData = valor != null && valor > 0
  const colorText: Record<MetricColor, string> = {
    blue: 'text-info',
    orange: 'text-warning',
    amber: 'text-warning',
    emerald: 'text-success',
  }
  return (
    <div className="bg-subtle border border-border rounded-lg p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-ink-muted text-xs font-medium uppercase tracking-wide">{label}</span>
        {hasData && <Sparkline valores={sparkline} color={sparkColor} />}
      </div>
      <div className={`text-xl font-bold num ${colorText[color] ?? 'text-ink'}`}>
        {!hasData
          ? <span className="text-ink-muted opacity-30 text-base">—</span>
          : isAliquota
          ? fmt.pct(valor)
          : fmt.moeda(valor)
        }
      </div>
      {hasData && total > 0 && (
        <div className="text-ink-muted text-xs num">
          {isAliquota
            ? `Total impostos: ${fmt.moeda(total)}`
            : `Total 12m: ${fmt.moeda(total)}`
          }
        </div>
      )}
      {extra && hasData && (
        <div className="text-ink-muted text-xs">{extra}</div>
      )}
    </div>
  )
}
