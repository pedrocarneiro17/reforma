import React, { useMemo } from 'react'
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
    () => calcularTodosOsRegimes(dadosBase, { desdobrarFatorR: true }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dadosBase.faturamentoMensal, dadosBase.insumosMensais, dadosBase.setor?.value, dadosBase.perfilClientes,
     dadosBase.folhaPagamentoLRMensal, dadosBase.aliquotaICMSEfetiva, dadosBase.aliquotaISSEfetiva,
     dadosBase.despesasOperacionaisMensais, dadosBase.sociosAdministradores],
  )

  const snHibridoMensal = dadosBase.cenarioHibridoVerdadeiro?.totalMensal ?? null

  // Simples pode vir desdobrado em dois cenários (Anexo III e V) para atividades sujeitas ao Fator R.
  const snEntries = comparativo.filter(r => r.regime === 'simples_nacional')
  const desdobrado = snEntries.length > 1
  const lp = comparativo.find(r => r.regime === 'lucro_presumido')!
  const lr = comparativo.find(r => r.regime === 'lucro_real')!
  const snIII = snEntries.find(r => r.anexoComparado === 'III')
  const snV   = snEntries.find(r => r.anexoComparado === 'V')
  const snUnico = !desdobrado ? snEntries[0] : null
  const R = Math.round

  const dataGrafico = [
    {
      cenario: 'Hoje (atual)',
      ...(desdobrado
        ? { 'SN Anexo III': R(snIII!.impostoAtualMensal), 'SN Anexo V': R(snV!.impostoAtualMensal) }
        : { 'SN Pleno': R(snUnico!.impostoAtualMensal) }),
      'Lucro Presumido': R(lp.impostoAtualMensal),
      'Lucro Real':      R(lr.impostoAtualMensal),
    },
    {
      cenario: 'Pós-reforma (2033)',
      ...(desdobrado
        ? { 'SN Anexo III': R(snIII!.cargaTotalReformaMensal), 'SN Anexo V': R(snV!.cargaTotalReformaMensal) }
        : {
            'SN Pleno':   R(snUnico!.cargaTotalReformaMensal),
            'SN Híbrido': snHibridoMensal != null ? R(snHibridoMensal) : undefined,
          }),
      'Lucro Presumido': R(lp.cargaTotalReformaMensal),
      'Lucro Real':      R(lr.cargaTotalReformaMensal),
    },
  ]

  // Recomendação só entre regimes aplicáveis E atingíveis: exclui Simples vedado/acima do limite,
  // MEI acima do limite, o anexo não atingível pelo Fator R e os anexos de atingibilidade
  // desconhecida (folha não informada) — nesses casos não se coroa um Simples.
  const coroavel = (r: typeof comparativo[number]) =>
    !r.inaplicavel && r.anexoAtingivel !== false && !(r.anexoComparado != null && r.anexoAtingivel == null)
  const scoreTotal = comparativo
    .filter(coroavel)
    .map(r => ({
      regime: r.regime,
      total: r.impostoAtualMensal + r.cargaTotalReformaMensal,
    }))
  const menorTotal = scoreTotal.length ? Math.min(...scoreTotal.map(s => s.total)) : Infinity
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
            Mesmo faturamento e setor nos 3 regimes · Carga total pelo conjunto de tributos (CBS, IBS, IRPJ, CSLL, ICMS/ISS e contribuição previdenciária) — não por um imposto isolado
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
          const naoAtingivel = r.anexoAtingivel === false
          const atingibilidadeIndefinida = r.anexoComparado != null && r.anexoAtingivel == null
          const badges: { txt: string; cls: string }[] = []
          if (r.melhorAtual) badges.push({ txt: 'Menor custo hoje', cls: 'badge badge-warning' })
          if (r.melhorIVA)   badges.push({ txt: 'Menor custo pós-reforma', cls: 'badge badge-info' })
          if (r.menorImpacto && !r.melhorAtual && !r.melhorIVA)
            badges.push({ txt: 'Menor impacto da reforma', cls: 'badge badge-neutral' })

          return (
            <div
              key={`${r.regime}-${r.anexoComparado ?? ''}`}
              className={`rounded-xl border p-5 space-y-4 transition-all
                ${isAtual
                  ? `ring-2 ${COR_RING[meta.color]} bg-[#EFEAE1] border-[#9A9286]`
                  : 'bg-white border-[#C4BDB4]'
                }
                ${r.inaplicavel ? 'opacity-50' : ''}
                ${naoAtingivel ? 'opacity-60' : ''}
              `}
            >
              {/* Linha de indicador — todos os cards têm a mesma altura aqui */}
              <div className="h-5 flex items-center gap-1.5">
                {isAtual && (
                  <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">
                    Regime atual
                  </span>
                )}
                {r.inaplicavel && (
                  <span className="badge badge-danger">{r.vedadoSimplesAtividade ? 'atividade vedada' : 'acima do limite'}</span>
                )}
                {naoAtingivel && (
                  <span className="badge badge-danger">não atingível · Fator R</span>
                )}
                {atingibilidadeIndefinida && (
                  <span className="badge badge-neutral">depende da folha</span>
                )}
              </div>

              <div>
                <div className="mb-0.5">
                  <span className={`font-bold text-sm ${COR_TEXT[meta.color]}`}>
                    {meta.label}{r.anexoComparado ? ` — Anexo ${r.anexoComparado}` : ''}
                  </span>
                </div>
                <p className="text-ink-muted text-xs">
                  {r.anexoComparado
                    ? (r.anexoComparado === 'III' ? 'Fator R ≥ 28% da folha' : 'Fator R < 28% da folha')
                    : meta.desc}
                </p>
              </div>

              <div className="space-y-3">
                <div className="bg-[#FBFAF7] border border-[#D4CEC7] rounded-md p-3">
                  <div className="text-ink-muted text-xs mb-1">Carga hoje / mês</div>
                  <div className={`font-bold text-lg num ${COR_TEXT[meta.color]}`}>
                    {fmt.moeda(r.impostoAtualMensal)}
                  </div>
                  <div className="text-ink-muted text-xs num">{fmt.pct(r.aliquotaAtual)} efetivo</div>
                  {(r.regime === 'lucro_presumido' || r.regime === 'lucro_real') && (
                    <div className="mt-2 pt-2 border-t border-[#D4CEC7] space-y-0.5">
                      <div className="flex justify-between text-[10px] text-ink-muted">
                        <span>Federais (IRPJ/CSLL/PIS-COFINS)</span>
                        <span className="num">{fmt.moeda(r.impostoAtualMensal - r.icmsAtualMensal - r.issAtualMensal - r.contribPrevidenciariaMensal)}</span>
                      </div>
                      {r.icmsAtualMensal > 0 && (
                        <div className="flex justify-between text-[10px] text-ink-muted">
                          <span>ICMS</span>
                          <span className="num">{fmt.moeda(r.icmsAtualMensal)}</span>
                        </div>
                      )}
                      {r.issAtualMensal > 0 && (
                        <div className="flex justify-between text-[10px] text-ink-muted">
                          <span>ISS</span>
                          <span className="num">{fmt.moeda(r.issAtualMensal)}</span>
                        </div>
                      )}
                      {r.contribPrevidenciariaMensal > 0 && (
                        <div className="flex justify-between text-[10px] text-warning font-medium">
                          <span>Contrib. previdenciária</span>
                          <span className="num">{fmt.moeda(r.contribPrevidenciariaMensal)}</span>
                        </div>
                      )}
                      <p className="text-[9px] text-ink-muted leading-tight mt-1">No SN a CPP já está dentro do DAS</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1.5 text-ink-muted text-xs justify-center">
                  <div className="flex-1 h-px bg-border" />
                  <span>Reforma Tributária</span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {r.regime === 'simples_nacional' && snHibridoMensal != null && !r.anexoComparado ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-[#FBFAF7] border border-[#D4CEC7] rounded-md p-2.5">
                        <div className="text-ink-muted text-[10px] mb-1 font-medium">Pleno / mês</div>
                        <div className={`font-bold text-base num ${r.variacaoAbsolutaMensal > 0 ? 'text-danger' : 'text-success'}`}>
                          {fmt.moeda(r.impostoIVALiquidoMensal)}
                        </div>
                        <div className="text-ink-muted text-[10px] num">{fmt.pct(r.aliquotaIVAEfetiva)} ef.</div>
                      </div>
                      <div className="bg-[#FBFAF7] border border-danger-border rounded-md p-2.5">
                        <div className="text-ink-muted text-[10px] mb-1 font-medium">Híbrido / mês</div>
                        <div className="font-bold text-base num text-danger">
                          {fmt.moeda(snHibridoMensal)}
                        </div>
                        <div className="text-ink-muted text-[10px] num">
                          {fmt.pct(snHibridoMensal / dadosBase.faturamentoMensal)} ef.
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className={`flex items-center justify-between rounded-md px-3 py-2 text-sm border
                        ${r.variacaoAbsolutaMensal > 0 ? 'bg-danger-soft border-danger-border' : 'bg-success-soft border-success-border'}`}>
                        <span className="text-ink-secondary text-xs">Pleno vs hoje</span>
                        <span className={`font-bold text-sm num ${r.variacaoAbsolutaMensal > 0 ? 'text-danger' : 'text-success'}`}>
                          {r.variacaoAbsolutaMensal > 0 ? '+' : ''}{fmt.moeda(r.variacaoAbsolutaMensal)}/mês
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-md px-3 py-2 text-sm border bg-danger-soft border-danger-border">
                        <span className="text-ink-secondary text-xs">Híbrido vs hoje</span>
                        <span className="font-bold text-sm num text-danger">
                          +{fmt.moeda(snHibridoMensal - r.impostoAtualMensal)}/mês
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-[#FBFAF7] border border-[#D4CEC7] rounded-md p-3">
                      <div className="text-ink-muted text-xs mb-1">Carga total pós-reforma / mês</div>
                      <div className={`font-bold text-lg num ${
                        r.variacaoAbsolutaMensal > 0 ? 'text-danger' : 'text-success'
                      }`}>
                        {fmt.moeda(r.cargaTotalReformaMensal)}
                      </div>
                      <div className="text-ink-muted text-xs num">
                        {fmt.pct(r.faturamentoMensal > 0 ? r.cargaTotalReformaMensal / r.faturamentoMensal : 0)} efetivo total
                      </div>
                      {(r.regime === 'lucro_presumido' || r.regime === 'lucro_real') && (
                        <div className="mt-2 pt-2 border-t border-[#D4CEC7] space-y-0.5">
                          <div className="flex justify-between text-[10px] text-ink-muted">
                            <span>CBS + IBS líquido</span>
                            <span className="num">{fmt.moeda(r.impostoIVALiquidoMensal)}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-ink-muted">
                            <span>IRPJ + CSLL</span>
                            <span className="num">{fmt.moeda(r.irpjCsllPersistenteMensal)}</span>
                          </div>
                          {r.contribPrevidenciariaMensal > 0 && (
                            <div className="flex justify-between text-[10px] text-warning font-medium">
                              <span>Contrib. previdenciária</span>
                              <span className="num">{fmt.moeda(r.contribPrevidenciariaMensal)}</span>
                            </div>
                          )}
                          <p className="text-[9px] text-ink-muted leading-tight mt-1">IRPJ/CSLL e contrib. previdenciária não são substituídos pelo IVA Dual</p>
                        </div>
                      )}
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
                  </>
                )}
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
                  {r.vedadoSimplesAtividade
                    ? 'Esta atividade é vedada ao Simples Nacional (LC 123/2006 Art. 17 / Art. 3º §4º) — a empresa não pode optar por este regime. Os valores acima são apenas ilustrativos.'
                    : 'Seu faturamento anual ultrapassa R$ 4,8M — empresa não é elegível ao Simples Nacional.'}
                </p>
              )}

              {!r.inaplicavel && naoAtingivel && (
                <p className="text-danger text-xs leading-relaxed">
                  Com a folha informada, o Fator R não enquadra a empresa neste anexo — ela ficaria no
                  Anexo {r.anexoComparado === 'III' ? 'V' : 'III'}. Mostrado apenas para referência; não entra como "melhor".
                </p>
              )}
              {!r.inaplicavel && atingibilidadeIndefinida && (
                <p className="text-ink-muted text-xs leading-relaxed">
                  O enquadramento neste anexo depende do Fator R (folha ÷ faturamento ≥ 28% → Anexo III).
                  Informe a folha para saber qual anexo se aplica — por isso nenhum é marcado como "melhor".
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Gráfico comparativo ───────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-[#FBFAF7] p-5 space-y-3">
        <h4 className="text-sm font-medium text-ink-secondary">Carga tributária total por regime — hoje vs pós-reforma (2033): CBS, IBS, IR, CSLL e INSS</h4>
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
              {desdobrado ? (
                <>
                  <Bar dataKey="SN Anexo III" fill="rgba(47,125,87,0.75)"  radius={[4, 4, 0, 0]} barSize={22} />
                  <Bar dataKey="SN Anexo V"   fill="rgba(47,125,87,0.4)"   radius={[4, 4, 0, 0]} barSize={22} />
                </>
              ) : (
                <>
                  <Bar dataKey="SN Pleno"     fill="rgba(47,125,87,0.7)"   radius={[4, 4, 0, 0]} barSize={22} />
                  <Bar dataKey="SN Híbrido"   fill="rgba(220,38,38,0.55)"  radius={[4, 4, 0, 0]} barSize={22} />
                </>
              )}
              <Bar dataKey="Lucro Presumido" fill="rgba(49,92,140,0.7)"   radius={[4, 4, 0, 0]} barSize={22} />
              <Bar dataKey="Lucro Real"      fill="rgba(163,132,89,0.7)"  radius={[4, 4, 0, 0]} barSize={22} />
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
              <th className="text-right px-3 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Alíq. Total Pós-Reforma</th>
              <th className="text-right px-3 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Total Pós-Reforma/mês</th>
              <th className="text-right py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Variação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {comparativo.map(r => {
              const meta = META[r.regime]
              const isAtual = r.regime === dadosBase.regime
              const isSN = r.regime === 'simples_nacional'
              return (
                <React.Fragment key={`${r.regime}-${r.anexoComparado ?? ''}`}>
                  <tr className={`transition-colors ${isAtual ? 'bg-subtle' : 'hover:bg-subtle'}`}>
                    <td className="py-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-semibold text-sm ${COR_TEXT[meta.color]}`}>
                            {meta.label}{r.anexoComparado ? ` — Anexo ${r.anexoComparado}` : ''}
                          </span>
                          {isAtual && <span className="text-xs text-ink-muted font-normal">(atual)</span>}
                          {r.anexoAtingivel === false && (
                            <span className="text-[10px] text-danger font-medium">não atingível</span>
                          )}
                          {r.anexoComparado != null && r.anexoAtingivel == null && (
                            <span className="text-[10px] text-ink-muted font-normal">depende da folha</span>
                          )}
                          {isSN && snHibridoMensal != null && !r.anexoComparado && (
                            <span className="text-[10px] text-ink-muted font-normal">— Pleno</span>
                          )}
                        </div>
                        {(r.melhorAtual || r.melhorIVA) && (
                          <div className="flex flex-wrap gap-1">
                            {r.melhorAtual && <span className="badge badge-warning text-[10px]">melhor hoje</span>}
                            {r.melhorIVA && <span className="badge badge-info text-[10px]">melhor pós-reforma</span>}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-ink-secondary text-sm num">{fmt.pct(r.aliquotaAtual)}</td>
                    <td className="px-3 py-3 text-right text-sm num">
                      <div className={`font-medium text-ink`}>{fmt.moeda(r.impostoAtualMensal)}</div>
                      {(r.regime === 'lucro_presumido' || r.regime === 'lucro_real') && (r.icmsAtualMensal > 0 || r.issAtualMensal > 0 || r.contribPrevidenciariaMensal > 0) && (
                        <div className="text-[10px] text-ink-muted font-normal">
                          {r.icmsAtualMensal > 0 && <>ICMS {fmt.moeda(r.icmsAtualMensal)} · </>}
                          {r.issAtualMensal > 0 && <>ISS {fmt.moeda(r.issAtualMensal)} · </>}
                          {r.contribPrevidenciariaMensal > 0 && <span className="text-warning">prev. {fmt.moeda(r.contribPrevidenciariaMensal)}</span>}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right text-ink-secondary text-sm num">
                      {fmt.pct(r.faturamentoMensal > 0 ? r.cargaTotalReformaMensal / r.faturamentoMensal : 0)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm num">
                      <div className="text-ink font-medium">{fmt.moeda(r.cargaTotalReformaMensal)}</div>
                      {(r.regime === 'lucro_presumido' || r.regime === 'lucro_real') && (
                        <div className="text-[10px] text-ink-muted font-normal">
                          IVA {fmt.moeda(r.impostoIVALiquidoMensal)} + IR/CSLL {fmt.moeda(r.irpjCsllPersistenteMensal)}
                          {r.contribPrevidenciariaMensal > 0 && <> + prev. {fmt.moeda(r.contribPrevidenciariaMensal)}</>}
                        </div>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      <span className={`text-sm font-semibold num ${r.variacaoAbsolutaMensal > 0 ? 'text-danger' : 'text-success'}`}>
                        {r.variacaoAbsolutaMensal > 0 ? '+' : ''}{fmt.moeda(r.variacaoAbsolutaMensal)}
                      </span>
                    </td>
                  </tr>
                  {isSN && snHibridoMensal != null && !r.anexoComparado && (
                    <tr key="sn-hibrido" className="transition-colors hover:bg-subtle bg-danger-soft/30">
                      <td className="py-3 pl-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-sm text-success">Simples Nacional</span>
                          <span className="text-[10px] text-danger font-medium">— Híbrido</span>
                        </div>
                        <div className="text-[10px] text-ink-muted mt-0.5">CBS/IBS por fora · Art. 412–416</div>
                      </td>
                      <td className="px-3 py-3 text-right text-ink-secondary text-sm num">{fmt.pct(r.aliquotaAtual)}</td>
                      <td className="px-3 py-3 text-right text-ink font-medium text-sm num">{fmt.moeda(r.impostoAtualMensal)}</td>
                      <td className="px-3 py-3 text-right text-ink-secondary text-sm num">
                        {fmt.pct(snHibridoMensal / dadosBase.faturamentoMensal)}
                      </td>
                      <td className="px-3 py-3 text-right text-danger font-medium text-sm num">{fmt.moeda(snHibridoMensal)}</td>
                      <td className="py-3 text-right">
                        <span className="text-sm font-semibold num text-danger">
                          +{fmt.moeda(snHibridoMensal - r.impostoAtualMensal)}
                        </span>
                      </td>
                    </tr>
                  )}
              </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Simples Nacional: Pleno vs Híbrido ──────────────────────────── */}
      {dadosBase.regime === 'simples_nacional' && dadosBase.cenarioHibridoVerdadeiro && (
        <div className="rounded-xl border border-success-border bg-success-soft p-5 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-success">Simples Nacional — Caminhos pós-Reforma</h4>
            <p className="text-ink-muted text-xs mt-1">
              A partir de 2027 o CBS entra no DAS; em 2029 o IBS substitui ICMS/ISS. Empresas podem optar pelo regime híbrido
              (Art. 412–416 LC 214/2025) e recolher CBS/IBS por fora, com direito a créditos plenos.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Simples Pleno */}
            <div className="rounded-lg border border-border bg-surface p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-success inline-block" />
                <span className="text-sm font-semibold text-ink">Simples Pleno</span>
                <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-success-soft text-success border border-success-border">
                  sem mudança de custo
                </span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                CBS e IBS migram para dentro do DAS progressivamente. Custo total idêntico ao atual. Clientes B2B
                só creditam a alíquota nominal embutida no DAS — menor que os 26,5% da alíquota plena do IVA Dual.
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">DAS mensal (inalterado)</span>
                  <span className="font-semibold num text-ink">{fmt.moeda(dadosBase.impostoAtualMensal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">CBS embutida no DAS</span>
                  <span className="num text-ink-secondary">{fmt.pct(dadosBase.cbsSimplesEfetivo ?? 0)}</span>
                </div>
                {dadosBase.ibsSimplesEfetivo != null && dadosBase.ibsSimplesEfetivo > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-ink-muted">IBS embutido no DAS</span>
                    <span className="num text-ink-secondary">{fmt.pct(dadosBase.ibsSimplesEfetivo)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs border-t border-border pt-1.5 mt-1">
                  <span className="text-ink-muted font-medium">Crédito que o cliente recebe</span>
                  <span className="num text-warning font-medium">
                    {fmt.pct((dadosBase.cbsSimplesEfetivo ?? 0) + (dadosBase.ibsSimplesEfetivo ?? 0))}
                    {' '}(vs 26,5% IVA pleno)
                  </span>
                </div>
              </div>
            </div>

            {/* Híbrido Verdadeiro */}
            <div className="rounded-lg border border-danger-border bg-danger-soft p-4 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-danger inline-block" />
                <span className="text-sm font-semibold text-ink">Híbrido (Art. 412–416)</span>
                <span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-danger-soft text-danger border border-danger-border">
                  custo maior
                </span>
              </div>
              <p className="text-xs text-ink-muted leading-relaxed">
                Recolhe CBS/IBS por fora do DAS à alíquota plena (26,5%), com crédito total de insumos.
                DAS recolhido apenas sobre IRPJ+CSLL+CPP. Clientes recebem crédito integral — vantagem em B2B.
              </p>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">DAS reduzido (só IRPJ+CPP)</span>
                  <span className="font-semibold num text-ink">{fmt.moeda(dadosBase.cenarioHibridoVerdadeiro.dasReduzidoMensal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">CBS/IBS bruto (26,5%)</span>
                  <span className="num text-ink-secondary">{fmt.moeda(dadosBase.cenarioHibridoVerdadeiro.ibsCBSBrutoMensal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">Crédito de insumos</span>
                  <span className="num text-success">− {fmt.moeda(dadosBase.cenarioHibridoVerdadeiro.creditoMensal)}</span>
                </div>
                <div className="flex justify-between text-xs border-t border-border pt-1.5 mt-1">
                  <span className="text-ink-muted font-medium">Total mensal</span>
                  <span className="num text-danger font-bold">{fmt.moeda(dadosBase.cenarioHibridoVerdadeiro.totalMensal)}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-ink-muted">Custo adicional vs Pleno</span>
                  <span className={`num font-semibold ${dadosBase.cenarioHibridoVerdadeiro.custoAdicionalVsSimples > 0 ? 'text-danger' : 'text-success'}`}>
                    {dadosBase.cenarioHibridoVerdadeiro.custoAdicionalVsSimples > 0 ? '+' : ''}
                    {fmt.moeda(dadosBase.cenarioHibridoVerdadeiro.custoAdicionalVsSimples)}/mês
                  </span>
                </div>
              </div>
            </div>
          </div>

          <p className="text-ink-muted text-[11px] leading-relaxed border-t border-success-border pt-3">
            <strong>Quando o Híbrido compensa?</strong> Se seus clientes são empresas (B2B) que se beneficiam do crédito pleno de CBS/IBS,
            o custo adicional pode ser repassado ou compensado pela competitividade. Para vendas B2C (consumidor final), o Simples Pleno
            tende a ser mais vantajoso.
          </p>
        </div>
      )}

      <p className="text-ink-muted text-xs leading-relaxed">
        Simulação comparativa com as mesmas premissas financeiras. A elegibilidade a cada regime depende de outros fatores
        (atividade, composição societária, histórico fiscal). Consulte um contador antes de migrar de regime.
      </p>
    </div>
  )
}
