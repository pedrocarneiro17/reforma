import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { fmt } from '../engine/calculadora'
import type { ResultadoCalculo } from '../types'

const ANOS_CHAVE = [2026, 2027, 2030, 2033]

interface GraficoData {
  ano: string
  'Regime Atual': number
  'IVA Dual (CBS+IBS)': number
  total: number
}

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null
  const total = payload.reduce((s, p) => s + (p.value ?? 0), 0)
  return (
    <div className="bg-surface border border-border rounded-lg p-4 shadow-lg text-sm min-w-[200px]">
      <p className="text-ink font-semibold mb-2">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ background: p.fill }} />
            <span className="text-ink-secondary">{p.name}</span>
          </div>
          <span className="text-ink font-medium num">{fmt.moeda(p.value ?? 0)}</span>
        </div>
      ))}
      <div className="border-t border-border mt-2 pt-2 flex justify-between">
        <span className="text-ink-muted text-xs">Total anual</span>
        <span className="text-ink font-bold num">{fmt.moeda(total)}</span>
      </div>
    </div>
  )
}

interface GraficoTransicaoProps {
  resultados: ResultadoCalculo
}

export default function GraficoTransicao({ resultados }: GraficoTransicaoProps) {
  const { projecaoAnos, impostoAtualAnual, impostoIVALiquidoAnual } = resultados

  const data: GraficoData[] = projecaoAnos
    .filter(p => ANOS_CHAVE.includes(p.ano))
    .map(p => ({
      ano: p.ano.toString(),
      'Regime Atual': Math.round(p.parcelaAtualAnual),
      'IVA Dual (CBS+IBS)': Math.round(p.parcelaNovaAnual),
      total: Math.round(p.impostoAnual),
    }))

  const maxValor = Math.max(impostoAtualAnual, impostoIVALiquidoAnual) * 1.15

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink font-display">Projeção da Carga Tributária Anual</h3>
          <p className="text-ink-muted text-xs mt-0.5">Composição do imposto por ano de transição (2026 → 2033)</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#315C8C' }} />
            <span className="text-ink-secondary">Regime Atual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#2F7D57' }} />
            <span className="text-ink-secondary">IVA Dual</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barSize={36}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E4DDD2" vertical={false} />
            <XAxis
              dataKey="ano"
              tick={{ fill: '#5F5A52', fontSize: 12, fontWeight: 600 }}
              axisLine={{ stroke: '#E4DDD2' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`}
              tick={{ fill: '#9A9286', fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              domain={[0, maxValor]}
              width={68}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
            <Bar dataKey="Regime Atual" stackId="a" fill="rgba(49,92,140,0.7)" radius={[0, 0, 0, 0]} />
            <Bar dataKey="IVA Dual (CBS+IBS)" stackId="a" fill="rgba(47,125,87,0.75)" radius={[4, 4, 0, 0]} />
            <ReferenceLine
              y={impostoAtualAnual}
              stroke="rgba(49,92,140,0.35)"
              strokeDasharray="4 4"
              label={{ value: 'Atual', position: 'insideTopRight', fill: 'rgba(49,92,140,0.6)', fontSize: 10 }}
            />
            <ReferenceLine
              y={impostoIVALiquidoAnual}
              stroke="rgba(47,125,87,0.35)"
              strokeDasharray="4 4"
              label={{ value: 'IVA líquido', position: 'insideBottomRight', fill: 'rgba(47,125,87,0.6)', fontSize: 10 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Linha de totais por ano */}
      <div className="grid grid-cols-4 gap-2">
        {data.map(d => (
          <div key={d.ano} className="bg-subtle border border-border rounded-lg p-3 text-center">
            <div className="text-ink font-bold text-sm num">{fmt.moeda(d.total)}</div>
            <div className="text-ink-muted text-xs mt-0.5 num">{d.ano}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
