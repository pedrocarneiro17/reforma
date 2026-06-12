/**
 * HoldingPatrimonial — Análise tributária de holding com receita de aluguéis
 *
 * Regras aplicadas:
 *  - IBS/CBS: Art. 261 §único LC 214/2025 — locação imóveis redução 70% → alíq. efetiva 7,95%
 *  - Uso gratuito: LC 227/2026 (Art. 5º LC 214) — "sem crédito, sem tributo"
 *  - Comparação PF × PJ: IRPF (carnê-leão 2025 + Lei 15.270/2025) vs. LP/LR + IBS/CBS
 */

import { useState, useMemo } from 'react'
import { analisarHolding, fmt, ALIQUOTA_IBS_CBS_IMOVEL, ALIQUOTA_LP_HOLDING, ALIQUOTA_LR_HOLDING } from '../engine/calculadora'
import type { ImovelHolding, AnaliseHolding, DestinatarioAluguel, RegimeHolding } from '../types'

// ─── Máscara monetária ────────────────────────────────────────────────────────

function mascaraMoeda(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''
  const padded = digits.padStart(3, '0')
  const cents  = padded.slice(-2)
  const reais  = parseInt(padded.slice(0, -2), 10)
  const reaisFmt = isNaN(reais) || reais === 0 ? '0' : reais.toLocaleString('pt-BR')
  return `${reaisFmt},${cents}`
}

function parseMoeda(v: string): number {
  if (!v) return 0
  return parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface HoldingPatrimonialProps {
  numeroCard: number
  onChange: (analise: AnaliseHolding | null) => void
}

// ─── Destinatário options ─────────────────────────────────────────────────────

const DESTINATARIOS: { value: DestinatarioAluguel; label: string; desc: string }[] = [
  { value: 'empresa_grupo',        label: 'Empresa do grupo',       desc: 'Aluguel oneroso — tributado normalmente com redução 70%' },
  { value: 'terceiro_pj',          label: 'Terceiro PJ',            desc: 'Pessoa jurídica fora do grupo — tributado com redução 70%' },
  { value: 'terceiro_pf',          label: 'Terceiro PF',            desc: 'Pessoa física fora do grupo — tributado com redução 70%' },
  { value: 'uso_gratuito_socio',   label: 'Uso gratuito pelo sócio', desc: 'LC 227/2026: tributado só se holding tomou créditos na aquisição' },
]

// ─── Componente ───────────────────────────────────────────────────────────────

export default function HoldingPatrimonial({ numeroCard, onChange }: HoldingPatrimonialProps) {
  const [ativo, setAtivo]       = useState(false)
  const [regime, setRegime]     = useState<RegimeHolding>('lucro_presumido')
  const [imoveis, setImoveis]   = useState<(ImovelHolding & { receitaRaw: string })[]>([])

  // ── Análise local (só para exibição no PainelAnalise interno) ───────────────
  const analise = useMemo<AnaliseHolding | null>(() => {
    if (!ativo || imoveis.length === 0) return null
    return analisarHolding(regime, imoveis)
  }, [ativo, regime, imoveis])

  // ── Emissão ao pai — chamada nos handlers, nunca durante render ─────────────
  const emitir = (ativo_: boolean, regime_: RegimeHolding, lista: typeof imoveis) => {
    if (!ativo_ || lista.length === 0) { onChange(null); return }
    onChange(analisarHolding(regime_, lista))
  }

  // ── Mutações ────────────────────────────────────────────────────────────────

  const adicionar = () => {
    const nova = {
      id: Math.random().toString(36).slice(2),
      nome: '',
      receitaMensalAluguel: 0,
      receitaRaw: '',
      destinatario: 'terceiro_pf' as const,
      creditosIBSCBSNaAquisicao: false,
      residencial: false,
    }
    const lista = [...imoveis, nova]
    setImoveis(lista)
    emitir(ativo, regime, lista)
  }

  const remover = (id: string) => {
    const lista = imoveis.filter(i => i.id !== id)
    setImoveis(lista)
    emitir(ativo, regime, lista)
  }

  const atualizar = (id: string, patch: Partial<ImovelHolding & { receitaRaw: string }>) => {
    const lista = imoveis.map(i => {
      if (i.id !== id) return i
      const next = { ...i, ...patch }
      if ('receitaRaw' in patch) next.receitaMensalAluguel = parseMoeda(next.receitaRaw)
      return next
    })
    setImoveis(lista)
    emitir(ativo, regime, lista)
  }

  const onRegimeChange = (novo: RegimeHolding) => {
    setRegime(novo)
    emitir(ativo, novo, imoveis)
  }

  const toggle = () => {
    const novo = !ativo
    setAtivo(novo)
    if (!novo) { setImoveis([]); onChange(null) }
    else emitir(true, regime, imoveis)
  }

  // ── UI auxiliar ─────────────────────────────────────────────────────────────
  const pct = (v: number) => `${(v * 100).toFixed(4).replace('.', ',')}%`

  return (
    <div className="card p-6 space-y-5">

      {/* ── Cabeçalho + toggle ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="badge badge-gold w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0">
            {numeroCard}
          </span>
          <div>
            <h3 className="text-ink font-semibold text-base leading-tight">Holding Patrimonial</h3>
            <p className="text-ink-muted text-xs mt-0.5">Tenho uma holding com receita de aluguéis</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={ativo}
          className="toggle-track"
        >
          <span className={`toggle-thumb ${ativo ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {ativo && (
        <div className="space-y-5">

          {/* Regime da holding */}
          <div>
            <label className="label label-required">Regime Tributário da Holding</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'lucro_presumido' as RegimeHolding, label: 'Lucro Presumido', desc: `${pct(ALIQUOTA_LP_HOLDING + ALIQUOTA_IBS_CBC)} carga total (${pct(ALIQUOTA_LP_HOLDING)} IRPJ/CSLL/PIS/COFINS + ${pct(ALIQUOTA_IBS_CBS_IMOVEL)} IBS/CBS)`, aliq: ALIQUOTA_LP_HOLDING + ALIQUOTA_IBS_CBS_IMOVEL },
                { value: 'lucro_real'      as RegimeHolding, label: 'Lucro Real',      desc: `${pct(ALIQUOTA_LR_HOLDING + ALIQUOTA_IBS_CBS_IMOVEL)} carga estimada (${pct(ALIQUOTA_LR_HOLDING)} IRPJ/CSLL/PIS/COFINS + ${pct(ALIQUOTA_IBS_CBS_IMOVEL)} IBS/CBS)`, aliq: ALIQUOTA_LR_HOLDING + ALIQUOTA_IBS_CBS_IMOVEL },
              ] as const).map(r => (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => onRegimeChange(r.value)}
                  className={`flex flex-col gap-1 p-3 rounded-lg border text-left transition-all
                    ${regime === r.value
                      ? 'bg-raised border-gold'
                      : 'bg-subtle border-border hover:border-ink-muted'
                    }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0
                      ${regime === r.value ? 'border-gold bg-gold' : 'border-border'}`} />
                    <span className={`font-semibold text-sm ${regime === r.value ? 'text-gold' : 'text-ink'}`}>
                      {r.label}
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed pl-5">{r.desc}</p>
                </button>
              ))}
            </div>
            {regime === 'lucro_real' && (
              <p className="mt-2 insight-warning text-xs px-3 py-2">
                LR estimado com margem líquida de 50% e créditos PIS/COFINS de 5%. Valores variam conforme despesas reais.
              </p>
            )}
          </div>

          {/* Lista de imóveis */}
          {imoveis.length > 0 && (
            <div className="space-y-3">
              {imoveis.map((imovel, idx) => (
                <div key={imovel.id} className="border border-border rounded-lg bg-surface overflow-hidden">

                  {/* Cabeçalho do imóvel */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-subtle border-b border-border">
                    <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">
                      Imóvel {idx + 1}
                      {imovel.nome && <span className="ml-1.5 normal-case font-normal text-ink-muted">— {imovel.nome}</span>}
                    </span>
                    <button type="button" onClick={() => remover(imovel.id)}
                      className="text-xs text-ink-muted hover:text-danger transition-colors">
                      Remover
                    </button>
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">

                      {/* Nome */}
                      <div>
                        <label className="label">Descrição <span className="text-ink-muted font-normal">(opcional)</span></label>
                        <input
                          type="text"
                          value={imovel.nome}
                          onChange={e => atualizar(imovel.id, { nome: e.target.value })}
                          placeholder="Ex: Sala comercial"
                          className="input-field text-sm"
                        />
                      </div>

                      {/* Receita */}
                      <div>
                        <label className="label label-required">Receita Mensal de Aluguel</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm select-none">R$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={imovel.receitaRaw}
                            onChange={e => atualizar(imovel.id, { receitaRaw: mascaraMoeda(e.target.value) })}
                            placeholder="0"
                            className="input-field pl-8 text-sm"
                          />
                        </div>
                        {imovel.receitaMensalAluguel > 0 && (
                          <p className="text-ink-muted text-xs mt-1 num">
                            ≈ {fmt.moeda(imovel.receitaMensalAluguel * 12)}/ano
                          </p>
                        )}
                      </div>

                      {/* Destinatário */}
                      <div>
                        <label className="label label-required">Destinatário</label>
                        <select
                          value={imovel.destinatario}
                          onChange={e => atualizar(imovel.id, { destinatario: e.target.value as DestinatarioAluguel })}
                          className="select-field text-sm"
                        >
                          {DESTINATARIOS.map(d => (
                            <option key={d.value} value={d.value}>{d.label}</option>
                          ))}
                        </select>
                        <p className="text-ink-muted text-xs mt-1 leading-relaxed">
                          {DESTINATARIOS.find(d => d.value === imovel.destinatario)?.desc}
                        </p>
                      </div>
                    </div>

                    {/* Uso do imóvel — define o redutor social (Art. 260) */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-medium text-ink-secondary">Uso do imóvel:</span>
                      {[
                        { value: false, label: 'Comercial' },
                        { value: true,  label: 'Residencial' },
                      ].map(op => (
                        <button
                          key={String(op.value)}
                          type="button"
                          onClick={() => atualizar(imovel.id, { residencial: op.value })}
                          className={`px-3 py-1 rounded-lg border text-xs font-medium transition-all
                            ${(imovel.residencial ?? false) === op.value
                              ? 'border-gold bg-raised text-gold'
                              : 'border-border bg-surface text-ink-secondary hover:border-ink-muted'
                            }`}
                        >
                          {op.label}
                        </button>
                      ))}
                      {imovel.residencial && (
                        <span className="text-xs text-success">
                          − {fmt.moeda(600)}/mês de redutor social na base (Art. 260)
                        </span>
                      )}
                    </div>

                    {/* Pergunta LC 227 — uso gratuito */}
                    {imovel.destinatario === 'uso_gratuito_socio' && (
                      <div className="bg-raised border border-border rounded-lg p-3 space-y-2">
                        <p className="text-gold text-xs font-semibold">
                          LC 227/2026 — Regra "Sem crédito, sem tributo"
                        </p>
                        <p className="text-ink-secondary text-xs leading-relaxed">
                          A holding tomou créditos de IBS/CBS ao adquirir este imóvel?
                        </p>
                        <div className="flex gap-3">
                          {[
                            { label: 'Sim — adquirido após 2027 (com créditos)', value: true,  cor: 'border-danger-border bg-danger-soft text-danger' },
                            { label: 'Não — adquirido antes da reforma (sem créditos)', value: false, cor: 'border-success-border bg-success-soft text-success' },
                          ].map(op => (
                            <button
                              key={String(op.value)}
                              type="button"
                              onClick={() => atualizar(imovel.id, { creditosIBSCBSNaAquisicao: op.value })}
                              className={`flex-1 py-2 px-3 rounded-lg border text-xs font-medium text-left transition-all
                                ${imovel.creditosIBSCBSNaAquisicao === op.value
                                  ? op.cor
                                  : 'border-border bg-surface text-ink-secondary hover:border-ink-muted'
                                }`}
                            >
                              {op.label}
                            </button>
                          ))}
                        </div>
                        <p className={`text-xs font-medium ${imovel.creditosIBSCBSNaAquisicao ? 'text-danger' : 'text-success'}`}>
                          {imovel.creditosIBSCBSNaAquisicao
                            ? 'IBS/CBS incide sobre o valor de mercado do aluguel (uso gratuito tributado)'
                            : 'Uso gratuito NÃO tributado — imóvel adquirido sem créditos de IBS/CBS'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Botão adicionar */}
          <button
            type="button"
            onClick={adicionar}
            className="w-full py-3 border-2 border-dashed border-border rounded-lg text-ink-muted text-sm font-medium
              hover:border-gold hover:text-gold transition-colors"
          >
            + Adicionar imóvel
          </button>

          {/* Painel de análise — só mostra com pelo menos 1 imóvel com receita */}
          {analise && analise.receitaTotalMensal > 0 && (
            <PainelAnalise analise={analise} regime={regime} />
          )}

          {/* Nota legal */}
          <p className="text-ink-muted text-xs leading-relaxed">
            <strong className="text-ink-secondary">Base legal:</strong>{' '}
            Art. 261 §único LC 214/2025 (redução 70% IBS/CBS em locação) ·
            Art. 260 (redutor social R$ 600/mês por imóvel residencial) ·
            Art. 251 §1º (PF locadora vira contribuinte se &gt; 3 imóveis e &gt; R$ 240 mil/ano) ·
            LC 227/2026 Art. 5º (uso gratuito — "sem crédito, sem tributo") ·
            Lei 9.249/1995 + Lei 9.718/1998 (LP aluguéis — presunção 32%).
            {' '}Os valores de R$ 600 e R$ 240.000 são corrigidos pelo IPCA a partir da publicação da lei — aqui usamos o valor nominal.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── Constante auxiliar (LP + IBS/CBS) ───────────────────────────────────────

const ALIQUOTA_IBS_CBC = ALIQUOTA_IBS_CBS_IMOVEL  // alias para leitura no JSX acima

// ─── Painel de análise ────────────────────────────────────────────────────────

function PainelAnalise({ analise, regime }: { analise: AnaliseHolding; regime: RegimeHolding }) {
  const {
    receitaTotalMensal, receitaGratuitaNaoTributada,
    redutorSocialMensal, baseIBSCBSMensal,
    aliquotaIBSCBS, ibsCBSMensal,
    aliquotaTributosCorrentes, tributosCorrMensal,
    cargaTotalMensal, cargaTotalPercentual,
    cargaPFMensal, cargaPFPercentual,
    pfEhContribuinteImovel, pfIbsCBSMensal,
    vantagemHolding, economiaMensalHolding,
    imoveisGratuitosSemCredito, imoveisGratuitosComCredito,
  } = analise

  const pct = (v: number, casas = 4) =>
    `${(v * 100).toFixed(casas).replace('.', ',')}%`

  return (
    <div className="space-y-4">

      {/* Receita tributável */}
      {receitaGratuitaNaoTributada > 0 && (
        <div className="insight-success text-xs leading-relaxed">
          <strong className="num">{fmt.moeda(receitaGratuitaNaoTributada)}/mês</strong> em uso gratuito sem créditos
          NÃO entra na base de cálculo do IBS/CBS (LC 227/2026).
          Base tributável: <strong className="num">{fmt.moeda(receitaTotalMensal)}/mês</strong>.
        </div>
      )}

      {/* Detalhamento da carga na holding */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-raised border-b border-border">
          <h4 className="text-xs font-bold text-gold uppercase tracking-wide">
            Carga Tributária — Holding ({regime === 'lucro_presumido' ? 'Lucro Presumido' : 'Lucro Real'})
          </h4>
        </div>
        <div className="divide-y divide-gray-100 text-sm">
          <LinhaCalculo label="Receita base (tributável)" valor={receitaTotalMensal} moeda />
          {redutorSocialMensal > 0 && (
            <LinhaCalculo
              label="Redutor social — locação residencial"
              valor={-redutorSocialMensal}
              moeda
              sublabel={`Art. 260 LC 214/2025 — base IBS/CBS: ${fmt.moeda(baseIBSCBSMensal)}`}
            />
          )}
          <LinhaCalculo
            label={`IBS/CBS — redução 70% (alíq. ${pct(aliquotaIBSCBS, 2)})`}
            valor={ibsCBSMensal}
            moeda
            sublabel="Art. 261 §único LC 214/2025"
          />
          <LinhaCalculo
            label={`${regime === 'lucro_presumido' ? 'IRPJ/CSLL/PIS/COFINS — LP' : 'IRPJ/CSLL/PIS/COFINS — LR'} (${pct(aliquotaTributosCorrentes, 4)})`}
            valor={tributosCorrMensal}
            moeda
            sublabel={regime === 'lucro_presumido' ? 'Exato por lei: 4,80+2,88+0,65+3,00' : 'Estimado: margem 50%, créditos PIS/COFINS 5%'}
          />
          <LinhaCalculo
            label="Carga Total Mensal na Holding"
            valor={cargaTotalMensal}
            moeda
            destaque
          />
          <LinhaCalculo
            label="Alíquota efetiva total"
            valor={cargaTotalPercentual}
            sublabel={`${pct(aliquotaIBSCBS, 2)} IBS/CBS + ${pct(aliquotaTributosCorrentes, 4)} tributos correntes`}
          />
        </div>
      </div>

      {/* Comparação PF × Holding */}
      <div className="bg-surface border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-raised border-b border-border">
          <h4 className="text-xs font-bold text-gold uppercase tracking-wide">
            Comparativo — PF (Carnê-Leão) × Holding
          </h4>
        </div>
        <div className="divide-y divide-border text-sm">
          <LinhaCalculo
            label={pfEhContribuinteImovel ? 'IRPF + IBS/CBS — PF contribuinte' : 'IRPF — PF (tabela progressiva 2025)'}
            valor={cargaPFMensal}
            moeda
            sublabel={pfEhContribuinteImovel
              ? `inclui ${fmt.moeda(pfIbsCBSMensal)} de IBS/CBS · alíq. efetiva ${pct(cargaPFPercentual, 2)}`
              : `alíq. efetiva ${pct(cargaPFPercentual, 2)}`}
          />
          <LinhaCalculo label="Carga total — Holding" valor={cargaTotalMensal} moeda sublabel={`alíq. efetiva ${pct(cargaTotalPercentual, 2)}`} />
          <div className={`flex items-center justify-between px-4 py-3 font-semibold text-sm
            ${vantagemHolding ? 'bg-success-soft' : 'bg-danger-soft'}`}
          >
            <span className={vantagemHolding ? 'text-success' : 'text-danger'}>
              {vantagemHolding ? 'Holding economiza' : 'PF economiza'}
            </span>
            <span className={`num ${vantagemHolding ? 'text-success' : 'text-danger'}`}>
              {fmt.moeda(Math.abs(economiaMensalHolding))}/mês
            </span>
          </div>
        </div>
      </div>

      {/* Alertas uso gratuito */}
      {imoveisGratuitosComCredito.length > 0 && (
        <div className="insight-danger text-xs space-y-1">
          <p className="font-semibold">Uso gratuito tributado (LC 227/2026)</p>
          <p className="leading-relaxed">
            Os seguintes imóveis foram adquiridos <strong>com créditos de IBS/CBS</strong> e
            o uso gratuito pelo sócio é tributado com base no valor de mercado do aluguel:
          </p>
          <ul className="list-disc pl-4 space-y-0.5">
            {imoveisGratuitosComCredito.map(i => (
              <li key={i.id}>{i.nome || 'Imóvel sem nome'} — <span className="num">{fmt.moeda(i.receitaMensalAluguel)}/mês</span></li>
            ))}
          </ul>
        </div>
      )}

      {imoveisGratuitosSemCredito.length > 0 && (
        <div className="insight-success text-xs space-y-1">
          <p className="font-semibold">Uso gratuito não tributado (LC 227/2026)</p>
          <p className="leading-relaxed">
            Os seguintes imóveis foram adquiridos <strong>sem créditos de IBS/CBS</strong> (patrimônio
            pré-reforma) e o uso gratuito pelo sócio <strong>não é tributado</strong>:
          </p>
          <ul className="list-disc pl-4 space-y-0.5">
            {imoveisGratuitosSemCredito.map(i => (
              <li key={i.id}>{i.nome || 'Imóvel sem nome'}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Projeção anual */}
      {(cargaTotalMensal > 0 || cargaPFMensal > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Receita anual', valor: receitaTotalMensal * 12, cor: 'text-ink' },
            { label: 'Carga holding/ano', valor: cargaTotalMensal * 12, cor: 'text-gold' },
            { label: 'Carga PF/ano', valor: cargaPFMensal * 12, cor: 'text-info' },
            { label: vantagemHolding ? 'Economia anual' : 'Custo extra/ano', valor: Math.abs(economiaMensalHolding) * 12, cor: vantagemHolding ? 'text-success' : 'text-danger' },
          ].map(item => (
            <div key={item.label} className="bg-subtle border border-border rounded-lg p-3">
              <p className="text-ink-muted text-xs mb-1">{item.label}</p>
              <p className={`font-bold text-sm num ${item.cor}`}>{fmt.moeda(item.valor)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── LinhaCalculo ─────────────────────────────────────────────────────────────

function LinhaCalculo({
  label, valor, moeda = false, sublabel, destaque = false,
}: {
  label: string
  valor: number
  moeda?: boolean
  sublabel?: string
  destaque?: boolean
}) {
  return (
    <div className={`flex items-start justify-between px-4 py-3 gap-4 ${destaque ? 'bg-raised font-semibold' : ''}`}>
      <div className="min-w-0">
        <p className={`text-sm ${destaque ? 'text-gold' : 'text-ink-secondary'}`}>{label}</p>
        {sublabel && <p className="text-xs text-ink-muted mt-0.5">{sublabel}</p>}
      </div>
      <span className={`num flex-shrink-0 text-sm ${destaque ? 'text-gold' : 'text-ink-secondary'}`}>
        {moeda
          ? fmt.moeda(valor)
          : `${(valor * 100).toFixed(4).replace('.', ',')}%`
        }
      </span>
    </div>
  )
}
