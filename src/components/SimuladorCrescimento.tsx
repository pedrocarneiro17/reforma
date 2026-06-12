import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from 'recharts'
import type { TooltipProps } from 'recharts'
import { calcularCurvaCrescimento, fmt } from '../engine/calculadora'
import type { ResultadoCalculo, PontoCrescimento } from '../types'

const LIMITE_SIMPLES_MENSAL = 400_000

const PERCENTUAIS = [-40, -30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 75, 100, 125, 150, 200]

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null
  const fat = (payload[0]?.payload as { faturamentoMensal?: number })?.faturamentoMensal ?? 0
  return (
    <div className="bg-surface border border-border rounded-lg p-4 shadow-lg text-sm min-w-[210px]">
      <p className="text-ink font-semibold mb-1">
        {(label as number) >= 0 ? '+' : ''}{label}% de crescimento
      </p>
      <p className="text-ink-muted text-xs mb-3">Faturamento: <span className="num">{fmt.moeda(fat)}/mês</span></p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-4 mb-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ background: p.stroke }} />
            <span className="text-ink-secondary text-xs">{p.name}</span>
          </div>
          <span className="text-ink font-medium num">{fmt.moeda(p.value ?? 0)}</span>
        </div>
      ))}
    </div>
  )
}

interface SimuladorCrescimentoProps {
  dadosBase: ResultadoCalculo
}

export default function SimuladorCrescimento({ dadosBase }: SimuladorCrescimentoProps) {
  const [crescimentoPct, setCrescimentoPct] = useState(0)

  const curva = useMemo(
    () => calcularCurvaCrescimento(dadosBase, PERCENTUAIS),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dadosBase.faturamentoMensal, dadosBase.insumosMensais, dadosBase.setor?.value, dadosBase.regime],
  )

  const pontoAtual = useMemo<PontoCrescimento | undefined>(() => {
    const pts = calcularCurvaCrescimento(dadosBase, [crescimentoPct])
    return pts[0]
  }, [dadosBase, crescimentoPct])

  const dataGrafico = curva.map(p => ({
    pct: p.pct,
    faturamentoMensal: p.faturamentoMensal,
    'Regime Atual': Math.round(p.impostoAtualMensal),
    'IVA Dual': Math.round(p.impostoIVAMensal),
  }))

  const limiteSimplesPct = useMemo(() => {
    return ((LIMITE_SIMPLES_MENSAL / dadosBase.faturamentoMensal) - 1) * 100
  }, [dadosBase.faturamentoMensal])

  const isSimples = dadosBase.regime === 'simples_nacional'
  const acimaDaFaixaAtual = (pontoAtual?.faturamentoMensal ?? 0) > LIMITE_SIMPLES_MENSAL
  const limiteVisivelNoGrafico = isSimples && limiteSimplesPct > -40 && limiteSimplesPct < 200

  const diffMensal = pontoAtual
    ? pontoAtual.impostoIVAMensal - pontoAtual.impostoAtualMensal
    : 0

  return (
    <div className="card p-6 space-y-6">
      {/* ── Cabeçalho ─────────────────────────────────────────────────── */}
      <div>
        <h3 className="text-base font-semibold text-ink font-display">
          Simulador de Crescimento
        </h3>
        <p className="text-ink-muted text-xs mt-0.5">
          Arraste o slider para ver como a carga tributária evolui com o crescimento do faturamento
        </p>
      </div>

      {/* ── Slider + KPIs em tempo real (oculto na impressão) ───────── */}
      <div className="card-elevated p-5 space-y-5 print:hidden">
        {/* Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-ink-secondary">
              Variação do Faturamento
            </label>
            <span className={`text-lg font-black num ${
              crescimentoPct > 0 ? 'text-success' :
              crescimentoPct < 0 ? 'text-danger' : 'text-ink-muted'
            }`}>
              {crescimentoPct > 0 ? '+' : ''}{crescimentoPct}%
            </span>
          </div>

          <div className="relative">
            <input
              type="range"
              min="-40"
              max="200"
              step="5"
              value={crescimentoPct}
              onChange={e => setCrescimentoPct(Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{
                background: `linear-gradient(to right,
                  rgba(239,68,68,0.4) 0%,
                  rgba(239,68,68,0.4) ${((crescimentoPct + 40) / 240) * 100}%,
                  #E5E7EB ${((crescimentoPct + 40) / 240) * 100}%,
                  #E5E7EB 100%)`,
              }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-0.5 h-4 bg-border pointer-events-none"
              style={{ left: `${(40 / 240) * 100}%` }}
            />
          </div>

          <div className="flex justify-between text-xs text-ink-muted">
            <span className="num">−40%</span>
            <span>base (atual)</span>
            <span className="num">+200%</span>
          </div>
        </div>

        {/* KPIs do ponto selecionado */}
        {pontoAtual && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <KPILive
              label="Faturamento projetado"
              valor={fmt.moeda(pontoAtual.faturamentoMensal) + '/mês'}
              sub={fmt.moeda(pontoAtual.faturamentoAnual) + '/ano'}
              color="blue"
            />
            <KPILive
              label="Imposto atual"
              valor={fmt.moeda(pontoAtual.impostoAtualMensal) + '/mês'}
              sub={fmt.pct(pontoAtual.aliquotaAtual) + ' efetivo'}
              color="gray"
            />
            <KPILive
              label="IVA Dual simulado"
              valor={fmt.moeda(pontoAtual.impostoIVAMensal) + '/mês'}
              sub={fmt.pct(pontoAtual.aliquotaIVA) + ' efetivo líquido'}
              color={diffMensal > 0 ? 'rose' : 'emerald'}
            />
            <KPILive
              label="Diferença atual → IVA"
              valor={(diffMensal > 0 ? '+' : '') + fmt.moeda(diffMensal) + '/mês'}
              sub={(diffMensal > 0 ? '▲ carga maior' : '▼ carga menor') + ' no IVA'}
              color={diffMensal > 0 ? 'rose' : 'emerald'}
            />
          </div>
        )}

        {/* Alerta: acima do limite do Simples */}
        {isSimples && acimaDaFaixaAtual && (
          <div className="insight-warning">
            <p className="text-sm font-medium">
              Neste cenário, o faturamento anual supera R$ 4,8M — limite do Simples Nacional.
            </p>
            <p className="text-xs mt-0.5 leading-relaxed opacity-80">
              Com <span className="num">{fmt.moeda(pontoAtual?.faturamentoMensal ?? 0)}</span>/mês a empresa precisaria migrar para
              Lucro Presumido ou Lucro Real. Use o Comparador de Regimes acima para avaliar qual é mais vantajoso.
            </p>
          </div>
        )}
      </div>

      {/* ── Gráfico da curva ──────────────────────────────────────────── */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-ink-muted">
          Imposto mensal × crescimento do faturamento
        </h4>
        <div className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataGrafico} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E4DDD2" vertical={false} />
              <XAxis
                dataKey="pct"
                tickFormatter={v => `${v > 0 ? '+' : ''}${v}%`}
                tick={{ fill: '#9A9286', fontSize: 10 }}
                axisLine={{ stroke: '#E4DDD2' }}
                tickLine={false}
              />
              <YAxis
                tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
                tick={{ fill: '#9A9286', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={60}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#9A9286', paddingTop: '6px' }} />

              {isSimples && limiteVisivelNoGrafico && (
                <ReferenceArea
                  x1={Math.ceil(limiteSimplesPct / 5) * 5}
                  x2={200}
                  fill="rgba(188,68,45,0.05)"
                  label={{ value: 'fora do Simples', position: 'insideTopRight', fill: 'rgba(188,68,45,0.5)', fontSize: 9 }}
                />
              )}

              <ReferenceLine
                x={crescimentoPct}
                stroke="#E4DDD2"
                strokeDasharray="4 3"
                label={{ value: `${crescimentoPct > 0 ? '+' : ''}${crescimentoPct}%`, position: 'top', fill: '#9A9286', fontSize: 10 }}
              />

              {crescimentoPct !== 0 && (
                <ReferenceLine
                  x={0}
                  stroke="#E4DDD2"
                  strokeDasharray="2 3"
                />
              )}

              <Line
                type="monotone"
                dataKey="Regime Atual"
                stroke="rgba(49,92,140,0.8)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#315C8C', strokeWidth: 0 }}
              />
              <Line
                type="monotone"
                dataKey="IVA Dual"
                stroke="rgba(47,125,87,0.8)"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: '#2F7D57', strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Insights automáticos ──────────────────────────────────────── */}
      <InsightsCrescimento
        curva={curva}
        dadosBase={dadosBase}
        isSimples={isSimples}
        limiteSimplesPct={limiteSimplesPct}
      />
    </div>
  )
}

// ─── InsightsCrescimento ──────────────────────────────────────────────────────

interface InsightItem {
  color: string
  text: string
}

interface InsightsCrescimentoProps {
  curva: PontoCrescimento[]
  dadosBase: ResultadoCalculo
  isSimples: boolean
  limiteSimplesPct: number
}

function InsightsCrescimento({ curva, isSimples, limiteSimplesPct }: InsightsCrescimentoProps) {
  const insights = useMemo<InsightItem[]>(() => {
    try {
      const lista: InsightItem[] = []

      let cruzamento: number | null = null
      for (let i = 1; i < curva.length; i++) {
        const prev = curva[i - 1]
        const curr = curva[i]
        if (prev.impostoIVAMensal <= prev.impostoAtualMensal &&
            curr.impostoIVAMensal > curr.impostoAtualMensal) {
          cruzamento = curr.pct
          break
        }
      }

      const ivaSempreMenor = curva.every(p => p.impostoIVAMensal <= p.impostoAtualMensal)
      const ivaSeempreMaior = curva.every(p => p.impostoIVAMensal >= p.impostoAtualMensal)

      if (ivaSeempreMaior) {
        const base = curva.find(p => p.pct === 0)
        lista.push({
          color: 'rose',
          text: `O IVA Dual é mais caro que o regime atual em todos os cenários analisados. Ao nível atual de faturamento, a diferença é de ${fmt.moeda((base?.impostoIVAMensal ?? 0) - (base?.impostoAtualMensal ?? 0))}/mês.`,
        })
      } else if (ivaSempreMenor) {
        lista.push({
          color: 'emerald',
          text: 'O IVA Dual resulta em carga menor que o regime atual em todos os cenários de crescimento analisados. Seu setor se beneficia da Reforma.',
        })
      } else if (cruzamento != null) {
        lista.push({
          color: 'amber',
          text: `O IVA Dual começa a superar o regime atual a partir de +${cruzamento}% de crescimento no faturamento. Abaixo disso, a Reforma é favorável para você.`,
        })
      }

      if (isSimples && limiteSimplesPct > 0 && limiteSimplesPct < 150) {
        lista.push({
          color: 'blue',
          text: `Com crescimento de +${Math.ceil(limiteSimplesPct)}% você ultrapassaria o teto do Simples Nacional (R$ 4,8M/ano). Planeje com antecedência a migração de regime antes de chegar nesse limite.`,
        })
      }

      const ponto50 = curva.find(p => p.pct === 50)
      if (ponto50) {
        const base = curva.find(p => p.pct === 0)
        const crescTax = (base != null && base.impostoAtualMensal > 0)
          ? ((ponto50.impostoAtualMensal - base.impostoAtualMensal) / base.impostoAtualMensal) * 100
          : null
        lista.push({
          color: 'blue',
          text: crescTax != null && base != null
            ? `Se o faturamento crescer 50%, o imposto mensal no regime atual aumenta de ${fmt.moeda(base.impostoAtualMensal)} para ${fmt.moeda(ponto50.impostoAtualMensal)} (+${crescTax.toFixed(0)}%). No IVA Dual seria ${fmt.moeda(ponto50.impostoIVAMensal)}.`
            : `Se o faturamento crescer 50%, o imposto no IVA Dual seria ${fmt.moeda(ponto50.impostoIVAMensal)}/mês.`,
        })
      }

      return lista
    } catch {
      return []
    }
  }, [curva, isSimples, limiteSimplesPct])

  if (!insights.length) return null

  const colorMap: Record<string, string> = {
    rose:    'insight-danger',
    emerald: 'insight-success',
    amber:   'insight-warning',
    blue:    'insight-info',
  }

  return (
    <div className="space-y-2.5">
      <h4 className="text-sm font-medium text-ink-muted">Insights do simulador</h4>
      {insights.map((ins, i) => (
        <div key={i} className={`rounded-md p-4 text-sm ${colorMap[ins.color] ?? 'insight-neutral'}`}>
          <p className="leading-relaxed">{ins.text}</p>
        </div>
      ))}
    </div>
  )
}

// ─── KPILive ──────────────────────────────────────────────────────────────────

type KPIColor = 'blue' | 'rose' | 'emerald' | 'gray'

interface KPILiveProps {
  label: string
  valor: string
  sub?: string
  color: KPIColor
}

function KPILive({ label, valor, sub, color }: KPILiveProps) {
  const colorText: Record<KPIColor, string> = {
    blue: 'text-info', rose: 'text-danger',
    emerald: 'text-success', gray: 'text-ink',
  }
  return (
    <div className="bg-subtle border border-border rounded-md p-3">
      <div className="text-ink-muted text-xs font-medium mb-1.5 leading-tight">{label}</div>
      <div className={`font-bold text-sm leading-tight num ${colorText[color] ?? 'text-ink'}`}>{valor}</div>
      {sub && <div className="text-ink-muted text-xs mt-1">{sub}</div>}
    </div>
  )
}
