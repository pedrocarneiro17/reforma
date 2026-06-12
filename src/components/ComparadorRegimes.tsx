import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { calcularTodosOsRegimes, fmt } from '../engine/calculadora'
import type { ResultadoCalculo, TipoRegime } from '../types'

type RegimeColor = 'emerald' | 'blue' | 'violet' | 'orange' | 'amber'

interface RegimeMeta {
  label: string
  dot: string
  color: RegimeColor
  desc: string
}

const META: Record<TipoRegime, RegimeMeta> = {
  simples_nacional: {
    label: 'Simples Nacional',
    dot: 'bg-emerald-500',
    color: 'emerald',
    desc: 'DAS unificado · até R$ 4,8M/ano',
  },
  lucro_presumido: {
    label: 'Lucro Presumido',
    dot: 'bg-blue-500',
    color: 'blue',
    desc: 'Presunção de lucro · PIS+COFINS cumulativos',
  },
  lucro_real: {
    label: 'Lucro Real',
    dot: 'bg-violet-500',
    color: 'violet',
    desc: 'Lucro efetivo · PIS+COFINS não-cumulativos',
  },
  mei: {
    label: 'MEI',
    dot: 'bg-orange-400',
    color: 'orange',
    desc: 'DAS fixo · até R$ 169.200/ano',
  },
  profissional_liberal: {
    label: 'Prof. Liberal (PF)',
    dot: 'bg-amber-500',
    color: 'amber',
    desc: 'IRPF progressivo + ISS · sem CNPJ',
  },
  produtor_rural: {
    label: 'Produtor Rural',
    dot: 'bg-emerald-700',
    color: 'emerald',
    desc: 'Não-contribuinte IBS/CBS · abaixo de R$3,6M/ano',
  },
}

const COR_TEXT: Record<RegimeColor, string> = {
  emerald: 'text-success',
  blue:    'text-info',
  violet:  'text-gold',
  orange:  'text-warning',
  amber:   'text-warning',
}
const COR_BG: Record<RegimeColor, string> = {
  emerald: 'bg-success-soft border-success-border',
  blue:    'bg-info-soft border-info-border',
  violet:  'bg-raised border-border',
  orange:  'bg-warning-soft border-warning-border',
  amber:   'bg-warning-soft border-warning-border',
}
const COR_RING: Record<RegimeColor, string> = {
  emerald: 'ring-success-border',
  blue:    'ring-info-border',
  violet:  'ring-border',
  orange:  'ring-warning-border',
  amber:   'ring-warning-border',
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-lg p-4 shadow-lg text-sm min-w-[200px]">
      <p className="text-ink font-semibold mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: p.fill }} />
            <span className="text-ink-secondary text-xs">{p.name}</span>
          </div>
          <span className="text-ink font-medium num">{fmt.moeda(p.value ?? 0)}</span>
        </div>
      ))}
    </div>
  )
}

interface ComparadorRegimesProps {
  dadosBase: ResultadoCalculo
}

export default function ComparadorRegimes({ dadosBase }: ComparadorRegimesProps) {
  const comparativo = useMemo(
    () => calcularTodosOsRegimes(dadosBase),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dadosBase.faturamentoMensal, dadosBase.insumosMensais, dadosBase.setor?.value, dadosBase.perfilClientes],
  )

  const dataGrafico = [
    {
      cenario: 'Hoje (atual)',
      'Simples Nacional': Math.round(comparativo[0].impostoAtualMensal),
      'Lucro Presumido':  Math.round(comparativo[1].impostoAtualMensal),
      'Lucro Real':       Math.round(comparativo[2].impostoAtualMensal),
    },
    {
      cenario: 'IVA Dual (2033)',
      'Simples Nacional': Math.round(comparativo[0].impostoIVALiquidoMensal),
      'Lucro Presumido':  Math.round(comparativo[1].impostoIVALiquidoMensal),
      'Lucro Real':       Math.round(comparativo[2].impostoIVALiquidoMensal),
    },
  ]

  const scoreTotal = comparativo.map(r => ({
    regime: r.regime,
    total: r.impostoAtualMensal + r.impostoIVALiquidoMensal,
  }))
  const menorTotal = Math.min(...scoreTotal.map(s => s.total))
  const recomendado = scoreTotal.find(s => s.total === menorTotal)?.regime

  return (
    <div className="card p-6 space-y-6">
      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink font-display">
            Comparador de Regimes Tributários
          </h3>
          <p className="text-ink-muted text-xs mt-0.5">
            Mesmo faturamento e setor simulados nos 3 regimes · Mostra qual é mais vantajoso hoje e no IVA Dual
          </p>
        </div>
        {recomendado && META[recomendado] && (
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md border text-xs font-medium
            ${COR_BG[META[recomendado].color]}`}
          >
            <span className={COR_TEXT[META[recomendado].color]}>
              {META[recomendado].label} — melhor custo-benefício geral
            </span>
          </div>
        )}
      </div>

      {/* ── Cards por regime ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {comparativo.map(r => {
          const meta = META[r.regime]
          const isAtual = r.regime === dadosBase.regime
          const badges: { txt: string; cls: string }[] = []
          if (r.melhorAtual) badges.push({ txt: 'Menor custo hoje', cls: 'badge badge-warning' })
          if (r.melhorIVA)   badges.push({ txt: 'Menor custo no IVA', cls: 'badge badge-info' })
          if (r.menorImpacto && !r.melhorAtual && !r.melhorIVA)
            badges.push({ txt: 'Menor impacto da reforma', cls: 'badge badge-neutral' })

          return (
            <div
              key={r.regime}
              className={`rounded-xl border p-5 space-y-4 transition-all
                ${isAtual
                  ? `ring-2 ${COR_RING[meta.color]} bg-[#EFEAE1] border-[#9A9286]`
                  : 'bg-white border-[#C4BDB4]'
                }
                ${r.inaplicavel ? 'opacity-50' : ''}
              `}
            >
              {/* Linha de indicador — todos os cards têm a mesma altura aqui */}
              <div className="h-5 flex items-center">
                {isAtual && (
                  <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">
                    Regime atual
                  </span>
                )}
                {r.inaplicavel && (
                  <span className="badge badge-danger">acima do limite</span>
                )}
              </div>

              <div>
                <div className="mb-0.5">
                  <span className={`font-bold text-sm ${COR_TEXT[meta.color]}`}>{meta.label}</span>
                </div>
                <p className="text-ink-muted text-xs">{meta.desc}</p>
              </div>

              <div className="space-y-3">
                <div className="bg-[#FBFAF7] border border-[#D4CEC7] rounded-md p-3">
                  <div className="text-ink-muted text-xs mb-1">Carga hoje / mês</div>
                  <div className={`font-bold text-lg num ${COR_TEXT[meta.color]}`}>
                    {fmt.moeda(r.impostoAtualMensal)}
                  </div>
                  <div className="text-ink-muted text-xs num">{fmt.pct(r.aliquotaAtual)} efetivo</div>
                </div>

                <div className="flex items-center gap-1.5 text-ink-muted text-xs justify-center">
                  <div className="flex-1 h-px bg-border" />
                  <span>Reforma Tributária</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                <div className="bg-[#FBFAF7] border border-[#D4CEC7] rounded-md p-3">
                  <div className="text-ink-muted text-xs mb-1">Carga IVA Dual / mês</div>
                  <div className={`font-bold text-lg num ${
                    r.variacaoAbsolutaMensal > 0 ? 'text-danger' : 'text-success'
                  }`}>
                    {fmt.moeda(r.impostoIVALiquidoMensal)}
                  </div>
                  <div className="text-ink-muted text-xs num">{fmt.pct(r.aliquotaIVAEfetiva)} efetivo líquido</div>
                </div>

                <div className={`flex items-center justify-between rounded-md px-3 py-2 text-sm border
                  ${r.variacaoAbsolutaMensal > 0
                    ? 'bg-danger-soft border-danger-border'
                    : 'bg-success-soft border-success-border'
                  }`}
                >
                  <span className="text-ink-secondary text-xs">Variação</span>
                  <span className={`font-bold text-sm num ${r.variacaoAbsolutaMensal > 0 ? 'text-danger' : 'text-success'}`}>
                    {r.variacaoAbsolutaMensal > 0 ? '+' : ''}{fmt.moeda(r.variacaoAbsolutaMensal)}/mês
                  </span>
                </div>
              </div>

              {badges.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {badges.map(b => (
                    <span key={b.txt} className={b.cls}>
                      {b.txt}
                    </span>
                  ))}
                </div>
              )}

              {r.inaplicavel && (
                <p className="text-danger text-xs leading-relaxed">
                  Seu faturamento anual ultrapassa R$ 4,8M — empresa não é elegível ao Simples Nacional.
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Gráfico comparativo ───────────────────────────────────────── */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-ink-secondary">Imposto mensal por regime — hoje vs IVA Dual (2033)</h4>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dataGrafico} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4DDD2" vertical={false} />
              <XAxis
                dataKey="cenario"
                tick={{ fill: '#5F5A52', fontSize: 12, fontWeight: 600 }}
                axisLine={{ stroke: '#E4DDD2' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: '#9A9286', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={62}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#9A9286', paddingTop: '8px' }} />
              <Bar dataKey="Simples Nacional" fill="rgba(47,125,87,0.7)"   radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="Lucro Presumido"  fill="rgba(49,92,140,0.7)"   radius={[4, 4, 0, 0]} barSize={32} />
              <Bar dataKey="Lucro Real"       fill="rgba(163,132,89,0.7)"  radius={[4, 4, 0, 0]} barSize={32} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Tabela resumo ─────────────────────────────────────────────── */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="table-premium w-full text-sm min-w-[520px]">
          <thead>
            <tr className="bg-subtle border-b border-border">
              <th className="text-left py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Regime</th>
              <th className="text-right px-3 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Alíq. Atual</th>
              <th className="text-right px-3 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Imposto Atual/mês</th>
              <th className="text-right px-3 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Alíq. IVA Líq.</th>
              <th className="text-right px-3 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">IVA Dual/mês</th>
              <th className="text-right py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Variação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {comparativo.map(r => {
              const meta = META[r.regime]
              const isAtual = r.regime === dadosBase.regime
              return (
                <tr key={r.regime} className={`transition-colors ${isAtual ? 'bg-subtle' : 'hover:bg-subtle'}`}>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold text-sm ${COR_TEXT[meta.color]}`}>{meta.label}</span>
                      {isAtual && <span className="text-xs text-ink-muted font-normal">(atual)</span>}
                      {r.melhorAtual && <span className="text-warning text-xs font-medium">melhor hoje</span>}
                      {r.melhorIVA && <span className="text-info text-xs font-medium">melhor no IVA</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right text-ink-secondary text-sm num">{fmt.pct(r.aliquotaAtual)}</td>
                  <td className="px-3 py-3 text-right text-ink font-medium text-sm num">{fmt.moeda(r.impostoAtualMensal)}</td>
                  <td className="px-3 py-3 text-right text-ink-secondary text-sm num">{fmt.pct(r.aliquotaIVAEfetiva)}</td>
                  <td className="px-3 py-3 text-right text-ink font-medium text-sm num">{fmt.moeda(r.impostoIVALiquidoMensal)}</td>
                  <td className="py-3 text-right">
                    <span className={`text-sm font-semibold num ${r.variacaoAbsolutaMensal > 0 ? 'text-danger' : 'text-success'}`}>
                      {r.variacaoAbsolutaMensal > 0 ? '+' : ''}{fmt.moeda(r.variacaoAbsolutaMensal)}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-ink-muted text-xs leading-relaxed">
        Simulação comparativa com as mesmas premissas financeiras. A elegibilidade a cada regime depende de outros fatores
        (atividade, composição societária, histórico fiscal). Consulte um contador antes de migrar de regime.
      </p>
    </div>
  )
}
