import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { fmt } from '../engine/calculadora'
import type { ResultadoCalculo } from '../types'

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-lg p-4 shadow-lg text-sm min-w-[210px]">
      <p className="text-ink font-semibold mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: (p.color ?? p.stroke) as string }} />
            <span className="text-ink-secondary">{p.name}</span>
          </div>
          <span className="text-ink font-medium num">
            {p.name?.includes('Alíq') ? `${Number(p.value).toFixed(1)}%` : fmt.moeda(p.value ?? 0)}
          </span>
        </div>
      ))}
    </div>
  )
}

interface PainelHistorico12mProps {
  resultados: ResultadoCalculo
}

export default function PainelHistorico12m({ resultados }: PainelHistorico12mProps) {
  const {
    projecaoMesAMes, aliquotaAtual, aliquotaAtualEstimada, fonteAliquota,
    regime, irpjCsllPersistenteMensal, contribPrevidenciariaMensal,
  } = resultados

  if (!projecaoMesAMes) return null

  // LP/LR: os impostos reais informados incluem IRPJ/CSLL e contribuição previdenciária —
  // a série simulada precisa somar esses componentes (que persistem na reforma) ao IVA
  // do mês para comparar conjunto com conjunto.
  const ehLPouLR = regime === 'lucro_presumido' || regime === 'lucro_real'
  const fixoMensalReforma = ehLPouLR ? irpjCsllPersistenteMensal + contribPrevidenciariaMensal : 0
  const labelSimulado = ehLPouLR ? 'Pós-reforma (simulado)' : 'IVA Dual (simulado)'

  const data = projecaoMesAMes.map(m => ({
    mes: m.label,
    'Faturamento': m.faturamento,
    'Impostos Reais Pagos': m.impostosReais || 0,
    [labelSimulado]: Math.round(m.ivaLiquido + fixoMensalReforma),
    'Alíq. Real (%)': m.aliquotaEfetivaReal != null
      ? parseFloat((m.aliquotaEfetivaReal * 100).toFixed(2))
      : null,
  }))

  const temImpostosReais = projecaoMesAMes.some(m => m.impostosReais > 0)
  const temExportacoes = projecaoMesAMes.some(m => m.exportacoes > 0)

  const totalFat = projecaoMesAMes.reduce((s, m) => s + m.faturamento, 0)
  const totalImpReais = projecaoMesAMes.reduce((s, m) => s + m.impostosReais, 0)
  const totalIVASimulado = projecaoMesAMes.reduce((s, m) => s + m.ivaLiquido + fixoMensalReforma, 0)
  const totalExportacoes = projecaoMesAMes.reduce((s, m) => s + m.exportacoes, 0)
  const totalInsumos = projecaoMesAMes.reduce((s, m) => s + m.insumos, 0)

  const diffAnual = temImpostosReais ? totalIVASimulado - totalImpReais : null

  return (
    <div className="card p-6 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-ink font-display">
            Histórico Real — Últimos 12 Meses
          </h3>
          <p className="text-ink-muted text-xs mt-0.5">
            Dados informados mês a mês · Comparativo: impostos reais pagos vs {ehLPouLR ? 'carga pós-reforma simulada' : 'IVA Dual simulado'}
          </p>
        </div>
        {fonteAliquota === 'real' && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-success-soft border border-success-border rounded-md">
            <span className="text-success text-xs font-medium">Usando alíquota real apurada</span>
          </div>
        )}
      </div>

      {/* ── KPIs do período ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KPICard label="Faturamento 12m" valor={fmt.moeda(totalFat)} sub="período completo" color="blue" />
        <KPICard
          label="Insumos 12m"
          valor={fmt.moeda(totalInsumos)}
          sub={`${totalFat > 0 ? ((totalInsumos / totalFat) * 100).toFixed(1) : 0}% do faturamento`}
          color="orange"
        />
        {temImpostosReais && (
          <KPICard
            label="Impostos Reais 12m"
            valor={fmt.moeda(totalImpReais)}
            sub={`alíquota efetiva ${fmt.pct(aliquotaAtual)}`}
            color="amber"
          />
        )}
        {temImpostosReais && (
          <KPICard
            label={ehLPouLR ? 'Pós-reforma Simulado 12m' : 'IVA Dual Simulado 12m'}
            valor={fmt.moeda(totalIVASimulado)}
            sub={diffAnual != null
              ? `${diffAnual > 0 ? '▲' : '▼'} ${fmt.moeda(Math.abs(diffAnual))} vs atual`
              : 'simulado'
            }
            color={diffAnual != null && diffAnual > 0 ? 'rose' : 'emerald'}
          />
        )}
        {!temImpostosReais && (
          <KPICard
            label={ehLPouLR ? 'Pós-reforma Simulado 12m' : 'IVA Dual Simulado 12m'}
            valor={fmt.moeda(totalIVASimulado)}
            sub="baseado na alíquota do setor"
            color="cyan"
          />
        )}
        {temExportacoes && (
          <KPICard
            label="Exportações 12m"
            valor={fmt.moeda(totalExportacoes)}
            sub="isentas de IVA"
            color="emerald"
          />
        )}
      </div>

      {/* ── Comparativo alíquota real vs estimada ───────────────────────── */}
      {temImpostosReais && fonteAliquota === 'real' && (
        <div className={`rounded-lg p-4 border flex flex-wrap items-center gap-4
          ${Math.abs(aliquotaAtual - aliquotaAtualEstimada) > 0.02
            ? 'bg-warning-soft border-warning-border'
            : 'bg-subtle border-border'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-ink-muted text-xs mb-1">Alíquota estimada (tabela)</div>
              <div className="text-ink-secondary font-bold text-lg num">{fmt.pct(aliquotaAtualEstimada)}</div>
            </div>
            <div className="text-ink-muted text-xl font-light">→</div>
            <div className="text-center">
              <div className="text-warning text-xs mb-1">Alíquota real apurada</div>
              <div className="text-warning font-bold text-lg num">{fmt.pct(aliquotaAtual)}</div>
            </div>
          </div>
          <p className="text-ink-secondary text-xs leading-relaxed flex-1 min-w-[180px]">
            {Math.abs(aliquotaAtual - aliquotaAtualEstimada) > 0.02
              ? `Há uma diferença de ${fmt.pct(Math.abs(aliquotaAtual - aliquotaAtualEstimada))} entre a estimativa e a realidade.
                 A simulação foi ajustada para usar a alíquota real.`
              : 'A alíquota real confirmou a estimativa de tabela — sua empresa está dentro do perfil esperado.'
            }
          </p>
        </div>
      )}

      {/* ── Gráfico barras: faturamento + impostos ──────────────────────── */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-ink-secondary">
          {temImpostosReais
            ? `Faturamento vs Impostos Reais vs ${ehLPouLR ? 'Pós-reforma' : 'IVA Dual'} por mês`
            : `Faturamento vs ${ehLPouLR ? 'carga pós-reforma' : 'IVA Dual'} simulado por mês`}
        </h4>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4DDD2" vertical={false} />
              <XAxis
                dataKey="mes"
                tick={{ fill: '#9A9286', fontSize: 10, fontWeight: 600 }}
                axisLine={{ stroke: '#E4DDD2' }}
                tickLine={false}
              />
              <YAxis
                yAxisId="left"
                tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: '#9A9286', fontSize: 9 }}
                axisLine={false}
                tickLine={false}
                width={58}
              />
              {temImpostosReais && (
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tickFormatter={v => `${v}%`}
                  tick={{ fill: 'rgba(192,138,64,0.6)', fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                  width={36}
                />
              )}
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#9A9286', paddingTop: '8px' }} />
              <Bar yAxisId="left" dataKey="Faturamento" fill="rgba(49,92,140,0.2)" radius={[3, 3, 0, 0]} barSize={18} />
              {temImpostosReais && (
                <Bar yAxisId="left" dataKey="Impostos Reais Pagos" fill="rgba(192,138,64,0.6)" radius={[3, 3, 0, 0]} barSize={18} />
              )}
              <Bar yAxisId="left" dataKey={labelSimulado} fill="rgba(47,125,87,0.65)" radius={[3, 3, 0, 0]} barSize={18} />
              {temImpostosReais && (
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="Alíq. Real (%)"
                  stroke="rgba(192,138,64,0.8)"
                  strokeWidth={1.5}
                  dot={{ r: 2, fill: 'rgba(192,138,64,0.8)', strokeWidth: 0 }}
                  connectNulls
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {ehLPouLR && fixoMensalReforma > 0 && (
          <p className="text-[11px] text-ink-muted leading-relaxed">
            Pós-reforma (simulado) = IVA líquido do mês + {fmt.moeda(fixoMensalReforma)}/mês de IRPJ/CSLL e
            contribuição previdenciária — tributos que persistem após a reforma e estão incluídos nos impostos reais informados.
          </p>
        )}
      </div>

      {/* ── Tabela detalhada por mês ─────────────────────────────────────── */}
      <details className="group">
        <summary className="cursor-pointer text-sm text-ink-muted hover:text-ink transition-colors flex items-center gap-2 select-none">
          <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
          Ver tabela detalhada mês a mês
        </summary>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="table-premium w-full text-xs min-w-[560px]">
            <thead>
              <tr className="bg-subtle border-b border-border">
                <th className="text-left py-3 text-ink-muted font-medium uppercase tracking-wide">Mês</th>
                <th className="text-right px-3 py-3 text-info font-medium uppercase tracking-wide">Faturamento</th>
                <th className="text-right px-3 py-3 text-warning font-medium uppercase tracking-wide">Insumos</th>
                {temImpostosReais && <th className="text-right px-3 py-3 text-warning font-medium uppercase tracking-wide">Imp. Reais</th>}
                {temImpostosReais && <th className="text-right px-3 py-3 text-warning font-medium uppercase tracking-wide">Alíq. Real</th>}
                <th className="text-right px-3 py-3 text-ink-secondary font-medium uppercase tracking-wide">IVA Bruto</th>
                <th className="text-right px-3 py-3 text-success font-medium uppercase tracking-wide">Crédito</th>
                <th className="text-right py-3 text-success font-medium uppercase tracking-wide">IVA Líquido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projecaoMesAMes.map((m, i) => (
                <tr key={i} className="hover:bg-subtle transition-colors">
                  <td className="py-2.5 text-ink font-semibold">{m.label}</td>
                  <td className="px-3 py-2.5 text-right text-info num">{fmt.moeda(m.faturamento)}</td>
                  <td className="px-3 py-2.5 text-right text-warning num">{fmt.moeda(m.insumos)}</td>
                  {temImpostosReais && (
                    <td className="px-3 py-2.5 text-right text-warning num">{fmt.moeda(m.impostosReais)}</td>
                  )}
                  {temImpostosReais && (
                    <td className="px-3 py-2.5 text-right">
                      {m.aliquotaEfetivaReal != null ? (
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium num
                          ${m.aliquotaEfetivaReal > 0.20 ? 'bg-danger-soft text-danger border border-danger-border' :
                            m.aliquotaEfetivaReal > 0.12 ? 'bg-warning-soft text-warning border border-warning-border' :
                            'bg-success-soft text-success border border-success-border'}`}
                        >
                          {fmt.pct(m.aliquotaEfetivaReal)}
                        </span>
                      ) : <span className="text-ink-muted opacity-30">—</span>}
                    </td>
                  )}
                  <td className="px-3 py-2.5 text-right text-ink-secondary num">{fmt.moeda(m.ivaDebito)}</td>
                  <td className="px-3 py-2.5 text-right text-success num">−{fmt.moeda(m.ivaCredito)}</td>
                  <td className="py-2.5 text-right text-success font-semibold num">{fmt.moeda(m.ivaLiquido)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border bg-subtle font-bold">
                <td className="pl-4 py-3 text-ink-secondary text-xs uppercase">TOTAL</td>
                <td className="px-3 py-3 text-right text-info num">{fmt.moeda(totalFat)}</td>
                <td className="px-3 py-3 text-right text-warning num">{fmt.moeda(totalInsumos)}</td>
                {temImpostosReais && <td className="px-3 py-3 text-right text-warning num">{fmt.moeda(totalImpReais)}</td>}
                {temImpostosReais && <td className="px-3 py-3 text-right text-warning num">{fmt.pct(aliquotaAtual)}</td>}
                <td className="px-3 py-3 text-right text-ink-secondary num">{fmt.moeda(projecaoMesAMes.reduce((s, m) => s + m.ivaDebito, 0))}</td>
                <td className="px-3 py-3 text-right text-success num">−{fmt.moeda(projecaoMesAMes.reduce((s, m) => s + m.ivaCredito, 0))}</td>
                <td className="pr-4 py-3 text-right text-success num">{fmt.moeda(totalIVASimulado)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </details>
    </div>
  )
}

// ─── KPICard ──────────────────────────────────────────────────────────────────

type KPIColor = 'blue' | 'orange' | 'amber' | 'emerald' | 'rose' | 'cyan'

interface KPICardProps {
  label: string
  valor: string
  sub?: string
  color: KPIColor
}

function KPICard({ label, valor, sub, color }: KPICardProps) {
  const colors: Record<KPIColor, string> = {
    blue: 'text-info', orange: 'text-warning', amber: 'text-warning',
    emerald: 'text-success', rose: 'text-danger', cyan: 'text-success',
  }
  return (
    <div className="bg-subtle border border-border rounded-md p-4">
      <div className="text-ink-muted text-xs font-medium uppercase tracking-wide mb-1.5">{label}</div>
      <div className={`font-bold text-base num ${colors[color] ?? 'text-ink'}`}>{valor}</div>
      {sub && <div className="text-ink-muted text-xs mt-1">{sub}</div>}
    </div>
  )
}
