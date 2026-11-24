import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { fmt } from '../engine/calculadora'
import type { ResultadoCalculo } from '../types'

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
  const { projecaoAnos, impostoAtualAnual, regime, anoAnalise } = resultados
  const ehLPouLR = regime === 'lucro_presumido' || regime === 'lucro_real'
  // LP/LR: referência final é a carga total pós-reforma (IVA + IRPJ/CSLL + contrib. prev.)
  // Simples/MEI: carga pós-reforma = DAS inalterado (cargaTotalReformaMensal já reflete isso)
  const ehSimplesOuMEI = regime === 'simples_nacional' || regime === 'mei'
  // A referência final é sempre o ano pleno (2033), qualquer que seja o ano em análise
  const pleno = projecaoAnos[projecaoAnos.length - 1]
  const referenciaFinalAnual = ehLPouLR || ehSimplesOuMEI ? pleno.impostoAnual : pleno.ivaLiquidoMensal * 12

  const data: GraficoData[] = projecaoAnos
    .map(p => ({
      ano: p.ano.toString(),
      'Regime Atual': Math.round(p.parcelaAtualAnual),
      'IVA Dual (CBS+IBS)': Math.round(p.parcelaNovaAnual),
      total: Math.round(p.impostoAnual),
    }))

  const maxValor = Math.max(impostoAtualAnual, referenciaFinalAnual, ...projecaoAnos.map(p => p.impostoAnual)) * 1.15

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h3 className="text-base font-semibold text-ink font-display">Projeção da Carga Tributária Anual</h3>
          <p className="text-ink-muted text-xs mt-0.5">Composição do imposto por ano de transição (2026 → 2033)</p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#004766' }} />
            <span className="text-ink-secondary">Regime Atual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: '#005221' }} />
            <span className="text-ink-secondary">IVA Dual</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }} barSize={26}>
            <CartesianGrid strokeDasharray="3 3" stroke="#D9DDE3" vertical={false} />
            <XAxis
              dataKey="ano"
              tick={{ fill: '#4E5865', fontSize: 12, fontWeight: 600 }}
              axisLine={{ stroke: '#D9DDE3' }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={v => `R$ ${(v / 1000).toFixed(0)}k`}
              tick={{ fill: '#6C7684', fontSize: 10 }}
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
              y={referenciaFinalAnual}
              stroke="rgba(47,125,87,0.35)"
              strokeDasharray="4 4"
              label={{ value: ehLPouLR ? 'Pós-reforma' : 'IVA líquido', position: 'insideBottomRight', fill: 'rgba(47,125,87,0.6)', fontSize: 10 }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Linha de totais por ano */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
        {data.map(d => (
          <div key={d.ano} className={`bg-subtle border rounded-lg p-2 text-center ${d.ano === String(anoAnalise) ? 'border-ink ring-1 ring-ink' : 'border-border'}`}>
            <div className="text-ink font-bold text-xs num">{fmt.moeda(d.total)}</div>
            <div className="text-ink-muted text-xs mt-0.5 num">{d.ano}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
