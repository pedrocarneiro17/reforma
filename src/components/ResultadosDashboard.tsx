import { useState } from 'react'
import { fmt, labelTerceiros } from '../engine/calculadora'
import GraficoTransicao from './GraficoTransicao'
import PainelHistorico12m from './PainelHistorico12m'
import ComparadorRegimes from './ComparadorRegimes'
import SimuladorCrescimento from './SimuladorCrescimento'
import MemoriaCalculo from './MemoriaCalculo'
import type { ResultadoCalculo, TipoRegime, PerfilClientes, AnaliseGrupoSimples, AnaliseHolding, AnaliseICMS, AnaliseFatorR, AnaliseProlabore } from '../types'
import { UF_NOMES } from '../engine/calculadora'

const NOMES_REGIME: Record<TipoRegime, string> = {
  simples_nacional:    'Simples Nacional',
  lucro_presumido:     'Lucro Presumido',
  lucro_real:          'Lucro Real',
  mei:                 'MEI',
  profissional_liberal:'Profissional Liberal (PF)',
  produtor_rural:      'Produtor Rural',
}

const NOMES_PERFIL: Record<PerfilClientes, string> = {
  b2c: 'Pessoa Física (B2C)',
  b2b: 'Empresas (B2B)',
  misto: 'Misto (B2C e B2B)',
}

interface ResultadosDashboardProps {
  resultados: ResultadoCalculo
  onVoltar: () => void
}

export default function ResultadosDashboard({ resultados, onVoltar }: ResultadosDashboardProps) {
  const [aba, setAba] = useState<'analise' | 'memoria'>('analise')
  const {
    regime, setor, faturamentoMensal, insumosMensais, perfilClientes,
    aliquotaAtual, impostoAtualMensal, impostoAtualAnual,
    aliquotaIVABruta, aliquotaIVAEfetiva,
    impostoIVABrutoMensal, creditoInsumosMensal, impostoIVALiquidoMensal, impostoIVALiquidoAnual,
    variacaoAbsolutaMensal, variacaoPercentual, reajustePrecoNecessario,
    projecaoAnos, analiseSimplesHibrido, alertaMEI, analiseGrupoSimples,
    analiseHolding, nomePrincipal, analiseICMS,
    anexoSimples, cbsSimplesEfetivo, ibsSimplesEfetivo, cenarioHibridoVerdadeiro, baseCalculoEfetiva,
    irpjAdicionalMensal, inssAutonomoMensal,
    pctFornecedoresSimples, creditoPerdidoFornecedorSimples,
    analiseProlabore,
    gorjetaMensal, creditoProdutorRural, creditoTranspAutonomo,
    alertaImpostoSeletivo, produtorRuralNaoContribuinte, ivaVendaImobilizado,
    creditoCapitalImediato, creditoCapitalPISCOFINS, ganhoFluxoCaixaCapital,
    ivaZeradoVendasRural, ivaZeradoVendasTransp,
    creditoDespesasAdicionais,
    alertaExportadorHabilitavel, alertaContratoAdministrativo,
    alertaCashback, creditoRegimeAutomotivo, creditoZFMIbs, creditoZFMCbs,
    pisCofinsNoDAsMensal, cbsIVADualMensal,
    irpjCsllLPMensal,
    apuracaoLucroReal, apuracaoLucroPresumido,
    cargaTotalReformaMensal, irpjCsllPersistenteMensal, contribPrevidenciariaMensal,
  } = resultados

  const ehLPouLR = regime === 'lucro_presumido' || regime === 'lucro_real'

  const isMEI = regime === 'mei'
  const isPF  = regime === 'profissional_liberal'

  const cargaAumentou = variacaoAbsolutaMensal > 0
  const cargaReducao = variacaoAbsolutaMensal < 0
  const isento = setor.reducao === 1
  const vendeB2B = perfilClientes === 'b2b' || perfilClientes === 'misto'

  // ── Resumo executivo — o recado factual mais relevante para este caso ──────
  const resumo: { texto: string; tom: 'success' | 'danger' | 'info' } = (() => {
    if (isento || aliquotaIVABruta === 0)
      return { tom: 'success', texto: 'Setor isento — alíquota zero no IVA Dual. Não há IBS/CBS sobre suas vendas.' }
    if (produtorRuralNaoContribuinte)
      return { tom: 'success', texto: 'Produtor rural não-contribuinte — sem IBS/CBS abaixo de R$ 3,6M/ano.' }
    if (cargaReducao)
      return { tom: 'success', texto: `Com o IVA Dual, sua carga líquida cai ${Math.abs(variacaoPercentual).toFixed(1)}% — economia de ${fmt.moeda(Math.abs(variacaoAbsolutaMensal))}/mês.` }
    if (cargaAumentou && vendeB2B)
      return { tom: 'info', texto: `O imposto destacado passa a ${fmt.moeda(impostoIVALiquidoMensal)}/mês, mas seus clientes empresas (B2B) creditam esse valor integralmente — é repasse na cadeia, não custo direto da sua operação. O impacto real está no preço final ao consumidor e no fluxo de caixa (split payment).` }
    if (cargaAumentou)
      return { tom: 'danger', texto: `Com o IVA Dual, sua carga líquida sobe ${Math.abs(variacaoPercentual).toFixed(1)}% — ${fmt.moeda(variacaoAbsolutaMensal)}/mês. Como você vende ao consumidor final (B2C), o aumento tende a recair sobre o preço.` }
    return { tom: 'info', texto: 'Carga praticamente neutra entre o regime atual e o IVA Dual.' }
  })()
  const resumoClasse = resumo.tom === 'success' ? 'insight-success' : resumo.tom === 'danger' ? 'insight-danger' : 'insight-info'

  return (
    <div className="space-y-6">

      {/* ── Cabeçalho dos resultados ─────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button onClick={onVoltar} className="btn-ghost flex items-center gap-1.5 mb-3 -ml-1 no-print">
            ← Voltar aos dados
          </button>
          {nomePrincipal && (
            <p className="text-xs font-semibold text-ink-muted uppercase tracking-widest mb-1">{nomePrincipal}</p>
          )}
          <h2 className="text-2xl sm:text-3xl font-bold text-ink font-display">
            Análise Tributária — <span className="text-gradient">{setor.label.split('(')[0].trim()}</span>
          </h2>
          <p className="text-ink-secondary text-sm mt-1.5">
            {NOMES_REGIME[regime]} · <span className="num">{fmt.moeda(faturamentoMensal)}/mês</span> · {NOMES_PERFIL[perfilClientes]}
          </p>
        </div>
      </div>

      {/* ── Abas: Análise Tributária | Memória de Cálculo ────────────────── */}
      <div className="flex items-center justify-between gap-3 border-b border-border -mt-2 no-print">
        <div className="flex gap-1">
          {([['analise', 'Análise Tributária'], ['memoria', 'Memória de Cálculo']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors
                ${aba === id ? 'border-ink text-ink' : 'border-transparent text-ink-muted hover:text-ink-secondary'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => window.print()}
          className="btn-ghost flex items-center gap-1.5 text-sm flex-shrink-0"
          title="Gera um PDF da aba atual (use 'Salvar como PDF' na caixa de impressão)"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" />
          </svg>
          Imprimir / PDF
        </button>
      </div>

      {aba === 'memoria' ? (
        <MemoriaCalculo resultados={resultados} />
      ) : (
      <>
      {/* ── Resumo executivo — recado factual no topo ────────────────────── */}
      <div className={`${resumoClasse} text-sm leading-relaxed`}>
        {resumo.texto}
      </div>

      {/* ── Cards de resumo ──────────────────────────────────────────────── */}
      {regime === 'simples_nacional' && cenarioHibridoVerdadeiro != null && cbsSimplesEfetivo != null && ibsSimplesEfetivo != null ? (
        /* Simples Nacional: dois cenários comparados */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Carga Atual */}
          <div className="stat-card border-l-4 border-l-info">
            <span className="stat-label">Carga Atual — DAS (Mensal)</span>
            <span className="stat-value text-info num">{fmt.moeda(impostoAtualMensal)}</span>
            <span className="text-xs text-ink-muted num">{fmt.pct(aliquotaAtual)} efetivo · {fmt.moeda(impostoAtualAnual)}/ano</span>
            <div className="mt-2 text-xs text-ink-secondary bg-subtle rounded-md px-3 py-2 leading-relaxed space-y-0.5">
              <div>CBS: <strong className="num">{fmt.pct(cbsSimplesEfetivo)}</strong> · IBS: <strong className="num">{fmt.pct(ibsSimplesEfetivo)}</strong></div>
              <div>IRPJ+CSLL+CPP: <strong className="num">{fmt.pct(Math.max(0, aliquotaAtual - cbsSimplesEfetivo - ibsSimplesEfetivo))}</strong></div>
            </div>
          </div>

          {/* Cenário 1 — Simples Pleno */}
          <div className="stat-card border-l-4 border-l-info">
            <span className="stat-label flex items-center gap-1.5">
              Cenário 1 — Simples Pleno
              <span className="badge badge-neutral text-[10px] font-medium">sem mudança</span>
            </span>
            <span className="stat-value text-info num">{fmt.moeda(impostoAtualMensal)}</span>
            <span className="text-xs text-ink-muted num">{fmt.pct(aliquotaAtual)} efetivo · DAS inalterado</span>
            <div className="mt-2 text-xs rounded-md px-3 py-2 leading-relaxed border bg-subtle border-border text-ink-secondary">
              Permanece no Simples. CBS e IBS migram internamente no DAS sem alterar o valor total.
            </div>
          </div>

          {/* Cenário 2 — Híbrido */}
          <div className="stat-card border-l-4 border-l-warning">
            <span className="stat-label flex items-center gap-1.5">
              Cenário 2 — Regime Híbrido
              <span
                className="badge badge-neutral text-[10px] font-medium cursor-help"
                title="A alíquota padrão de 26,5% (CBS+IBS) é uma estimativa de mercado — a LC 214/2025 não a fixa."
              >estimativa</span>
            </span>
            <span className="stat-value text-warning num">{fmt.moeda(cenarioHibridoVerdadeiro.totalMensal)}</span>
            <span className="text-xs text-ink-muted num">
              {fmt.pct(cenarioHibridoVerdadeiro.aliquotaEfetiva)} efetivo
              {' '}· <span className="text-danger">+{fmt.moeda(cenarioHibridoVerdadeiro.custoAdicionalVsSimples)}/mês</span>
            </span>
            <div className="mt-2 text-xs rounded-md px-3 py-2 leading-relaxed border bg-warning-soft border-warning-border text-ink-secondary">
              DAS reduzido + IVA pleno. Custo maior, mas clientes B2B creditam os <strong>{fmt.pct(aliquotaIVABruta)}</strong> cheios.
            </div>
          </div>
        </div>
      ) : (
        /* Demais regimes: cards originais */
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Carga Atual */}
          <div className="stat-card border-l-4 border-l-info">
            <span className="stat-label">Carga Atual (Mensal)</span>
            <span className="stat-value text-info num">{fmt.moeda(impostoAtualMensal)}</span>
            <span className="text-xs text-ink-muted num">{fmt.pct(aliquotaAtual)} efetivo · {fmt.moeda(impostoAtualAnual)}/ano</span>
            <div className="mt-2 text-xs text-ink-secondary bg-subtle rounded-md px-3 py-2 leading-relaxed flex items-center gap-2 flex-wrap">
              <span>Regime: <strong className="text-ink">{NOMES_REGIME[regime]}</strong></span>
              {resultados.fonteAliquota === 'real' && (
                <span className="badge badge-warning text-xs font-medium">
                  alíquota real
                </span>
              )}
            </div>
          </div>

          {/* Carga Nova */}
          <div className={`stat-card border-l-4 ${cargaAumentou ? 'border-l-danger' : 'border-l-success'}`}>
            <span className="stat-label flex items-center gap-1.5">
              {ehLPouLR ? 'Carga Nova — Pós-Reforma (Mensal)' : 'Carga Nova — IVA Dual (Mensal)'}
              {!isento && (
                <span
                  className="badge badge-neutral text-[10px] font-medium cursor-help"
                  title="A alíquota padrão de 26,5% (CBS+IBS) é uma estimativa de mercado — a LC 214/2025 não a fixa. O valor final será definido por lei ordinária e resolução do Senado."
                >
                  estimativa
                </span>
              )}
            </span>
            <span className={`stat-value num ${cargaAumentou ? 'text-danger' : 'text-success'}`}>
              {fmt.moeda(ehLPouLR ? cargaTotalReformaMensal : impostoIVALiquidoMensal)}
            </span>
            <span className="text-xs text-ink-muted num">
              {ehLPouLR
                ? <>{fmt.pct(faturamentoMensal > 0 ? cargaTotalReformaMensal / faturamentoMensal : 0)} total · {fmt.moeda(cargaTotalReformaMensal * 12)}/ano</>
                : <>{fmt.pct(aliquotaIVAEfetiva)} líquido · {fmt.moeda(impostoIVALiquidoAnual)}/ano</>}
            </span>
            <div className="mt-2 text-xs text-ink-secondary bg-subtle rounded-md px-3 py-2 leading-relaxed">
              {ehLPouLR
                ? <>IVA <strong className="text-ink num">{fmt.moeda(impostoIVALiquidoMensal)}</strong>
                    {' '}+ IR/CSLL <strong className="text-ink num">{fmt.moeda(irpjCsllPersistenteMensal)}</strong>
                    {contribPrevidenciariaMensal > 0 && <> + prev. <strong className="text-ink num">{fmt.moeda(contribPrevidenciariaMensal)}</strong></>}
                  </>
                : <>Alíquota bruta: <strong className="text-ink num">{fmt.pct(aliquotaIVABruta)}</strong>
                    {' '}→ créditos: <strong className="text-success num">−{fmt.moeda(creditoInsumosMensal)}</strong></>}
            </div>
          </div>

          {/* Variação */}
          <div className={`stat-card border-l-4 ${cargaAumentou ? 'border-l-danger' : 'border-l-success'}`}>
            <span className="stat-label">Variação Mensal</span>
            <span className={`stat-value num ${cargaAumentou ? 'text-danger' : 'text-success'}`}>
              {cargaAumentou ? '+' : ''}{fmt.moeda(variacaoAbsolutaMensal)}
            </span>
            <span className="text-xs text-ink-muted num">
              {cargaAumentou ? '▲' : '▼'} {Math.abs(variacaoPercentual).toFixed(1)}% em relação à carga atual
            </span>
            <div className={`mt-2 text-xs rounded-md px-3 py-2 leading-relaxed border
              ${cargaAumentou
                ? 'bg-danger-soft border-danger-border text-danger'
                : 'bg-success-soft border-success-border text-success'
              }`}
            >
              {isento
                ? 'Setor isento — alíquota zero no IVA Dual'
                : cargaAumentou && vendeB2B
                ? 'Sobe, mas repassável — cliente PJ credita o IVA'
                : cargaAumentou
                ? 'Carga aumenta — recai sobre o preço final (B2C)'
                : 'Carga reduzida com a Reforma Tributária'
              }
            </div>
          </div>
        </div>
      )}

      {/* ── Painel histórico 12 meses ─────────────────────────────────────── */}
      {resultados.projecaoMesAMes && (
        <PainelHistorico12m resultados={resultados} />
      )}

      {/* ── Detalhamento da apuração ─────────────────────────────────────── */}
      <div className="card p-6">
        <h3 className="section-title mb-5"><span className="font-display">Detalhamento da Apuração</span></h3>
        <div className="overflow-x-auto">
          <table className="table-premium w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left pb-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Item</th>
                <th className="text-right pb-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Regime Atual</th>
                <th className="text-right pb-3 text-ink-muted font-medium text-xs uppercase tracking-wide">
                  {regime === 'simples_nacional' ? 'IVA Dual (LP referência)' : 'IVA Dual'}
                </th>
                <th className="text-right pb-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Diferença</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(() => {
                // Decomposição da carga atual (LP/LR) para alinhar as linhas da tabela:
                // IRPJ/CSLL hoje + contrib. prev. hoje; o restante são tributos sobre consumo.
                const irpjCsllHoje = regime === 'lucro_presumido' && apuracaoLucroPresumido
                  ? apuracaoLucroPresumido.irpj + apuracaoLucroPresumido.irpjAdicional + apuracaoLucroPresumido.csll
                  : regime === 'lucro_real' && apuracaoLucroReal
                  ? apuracaoLucroReal.irpj + apuracaoLucroReal.irpjAdicional + apuracaoLucroReal.csll
                  : 0
                const consumoHoje = ehLPouLR
                  ? Math.max(0, impostoAtualMensal - irpjCsllHoje - contribPrevidenciariaMensal)
                  : impostoAtualMensal
                return (
                  <>
                    <TabelaRow label="Faturamento Mensal" atual={faturamentoMensal} nova={faturamentoMensal} neutro />
                    <TabelaRow label="Insumos / Compras" atual={insumosMensais} nova={insumosMensais} neutro />
                    <TabelaRow
                      label={regime === 'simples_nacional' ? 'IBS + CBS (bruto)' : ehLPouLR ? 'Tributos s/ consumo → IBS+CBS (bruto)' : 'Imposto Bruto'}
                      atual={consumoHoje}
                      nova={impostoIVABrutoMensal}
                    />
                    <TabelaRow label="Créditos de IVA nos Insumos" atual={0} nova={-creditoInsumosMensal} credito />
                    <TabelaRow
                      label={regime === 'simples_nacional' ? 'IBS + CBS (líquido)' : ehLPouLR ? 'Tributos s/ consumo → IBS+CBS (líquido)' : 'Imposto Líquido (devido)'}
                      atual={consumoHoje}
                      nova={impostoIVALiquidoMensal}
                      destaque={!ehLPouLR && regime !== 'simples_nacional'}
                    />
                    {regime === 'simples_nacional' && irpjCsllLPMensal > 0 && (
                      <TabelaRow label="IRPJ + CSLL (Lucro Presumido)" atual={0} nova={irpjCsllLPMensal} />
                    )}
                    {regime === 'simples_nacional' && irpjCsllLPMensal > 0 && (
                      <TabelaRow label="Carga Total (IBS+CBS+IRPJ+CSLL)" atual={impostoAtualMensal} nova={impostoIVALiquidoMensal + irpjCsllLPMensal} destaque />
                    )}
                    {ehLPouLR && irpjCsllHoje > 0 && (
                      <TabelaRow label="IRPJ + CSLL" atual={irpjCsllHoje} nova={irpjCsllPersistenteMensal} />
                    )}
                    {ehLPouLR && contribPrevidenciariaMensal > 0 && (
                      <TabelaRow label="Contribuição previdenciária" atual={contribPrevidenciariaMensal} nova={contribPrevidenciariaMensal} />
                    )}
                    {ehLPouLR && (
                      <TabelaRow label="Carga Total (conjunto de tributos)" atual={impostoAtualMensal} nova={cargaTotalReformaMensal} destaque />
                    )}
                  </>
                )
              })()}
              <TabelaRow
                label="Alíquota Efetiva"
                atual={aliquotaAtual}
                nova={regime === 'simples_nacional' && irpjCsllLPMensal > 0
                  ? (impostoIVALiquidoMensal + irpjCsllLPMensal) / faturamentoMensal
                  : ehLPouLR
                  ? (faturamentoMensal > 0 ? cargaTotalReformaMensal / faturamentoMensal : 0)
                  : aliquotaIVAEfetiva}
                isPct
              />
            </tbody>
          </table>
        </div>
        {regime === 'simples_nacional' && irpjCsllLPMensal > 0 && (
          <p className="text-xs text-ink-muted mt-3 leading-relaxed">
            <strong>Nota:</strong> O Simples Nacional unifica todos os tributos (IRPJ, CSLL, PIS/COFINS, ICMS, ISS, CPP) em um único DAS.
            A coluna "IVA Dual" mostra IBS+CBS (tributos sobre consumo) + IRPJ+CSLL calculados pelo Lucro Presumido,
            para comparar a carga total caso a empresa migre para o regime pleno.
          </p>
        )}
      </div>

      {/* ── Card de Créditos IVA ─────────────────────────────────────────── */}
      {!isMEI && !isPF && <CardCreditoIVA resultados={resultados} />}

      {/* ── Comparativo PIS/COFINS vs CBS — exclusivo Simples Nacional ───── */}
      {regime === 'simples_nacional' && cbsSimplesEfetivo != null && (
        <CardPisCofinsVsCBS
          pisCofinsAtualMensal={pisCofinsNoDAsMensal}
          cbsIVADualMensal={cbsIVADualMensal}
          aliquotaPisCofins={cbsSimplesEfetivo}
          aliquotaCbsIVA={aliquotaIVAEfetiva * (8.8 / 26.5)}
          creditoInsumosCBSMensal={creditoInsumosMensal * (8.8 / 26.5)}
          faturamentoMensal={faturamentoMensal}
          anexo={anexoSimples}
        />
      )}

      {/* ── Cenários Simples Nacional — Composição CBS/IBS ──────────────── */}
      {regime === 'simples_nacional' && cbsSimplesEfetivo != null && ibsSimplesEfetivo != null && cenarioHibridoVerdadeiro != null && (
        <div className="card p-6 space-y-5">
          <div>
            <h3 className="section-title mb-1"><span className="font-display">Cenários Simples Nacional — Reforma Tributária</span></h3>
            <p className="text-xs text-ink-muted leading-relaxed">
              A partir de 2027 o CBS substitui PIS/COFINS internamente no DAS; a partir de 2029 o IBS substitui ICMS/ISS gradualmente.
              Abaixo dois caminhos possíveis para sua empresa.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Cenário 1 — Simples Pleno */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-0.5">Cenário 1</div>
                <div className="font-semibold text-sm text-ink-primary">Simples Nacional Pleno</div>
                <div className="text-xs text-ink-muted">Permanece no Simples. DAS inalterado; partilha interna migra ICMS/ISS → IBS e PIS/COFINS → CBS.</div>
              </div>

              <table className="w-full text-xs">
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-1.5 text-ink-secondary">DAS Total / mês</td>
                    <td className="py-1.5 text-right font-medium num">{fmt.moeda(impostoAtualMensal)}</td>
                    <td className="py-1.5 text-right text-ink-muted num w-16">{fmt.pct(aliquotaAtual)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-ink-secondary pl-3">→ CBS (PIS/COFINS)</td>
                    <td className="py-1.5 text-right num">{fmt.moeda(faturamentoMensal * cbsSimplesEfetivo)}</td>
                    <td className="py-1.5 text-right text-ink-muted num">{fmt.pct(cbsSimplesEfetivo)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-ink-secondary pl-3">→ IBS (ICMS/ISS)</td>
                    <td className="py-1.5 text-right num">{fmt.moeda(faturamentoMensal * ibsSimplesEfetivo)}</td>
                    <td className="py-1.5 text-right text-ink-muted num">{fmt.pct(ibsSimplesEfetivo)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-ink-secondary pl-3">→ IRPJ + CSLL + CPP</td>
                    <td className="py-1.5 text-right num">{fmt.moeda(Math.max(0, impostoAtualMensal - faturamentoMensal * (cbsSimplesEfetivo + ibsSimplesEfetivo)))}</td>
                    <td className="py-1.5 text-right text-ink-muted num">{fmt.pct(Math.max(0, aliquotaAtual - cbsSimplesEfetivo - ibsSimplesEfetivo))}</td>
                  </tr>
                  <tr className="border-t-2 border-border font-semibold">
                    <td className="pt-2 text-ink-primary">Carga Total</td>
                    <td className="pt-2 text-right num">{fmt.moeda(impostoAtualMensal)}</td>
                    <td className="pt-2 text-right text-ink-primary num">{fmt.pct(aliquotaAtual)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="rounded-lg bg-warning-soft border border-warning-border px-3 py-2 text-xs text-ink-secondary leading-relaxed">
                Seus clientes B2B creditam apenas <strong>{fmt.pct(cbsSimplesEfetivo)}</strong> de CBS (embutido no DAS),
                não os {fmt.pct(aliquotaIVABruta)} cheios do IVA. Isso pode reduzir sua competitividade em cadeias B2B.
              </div>
            </div>

            {/* Cenário 2 — Híbrido */}
            <div className="rounded-xl border border-border bg-surface p-4 space-y-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-wide text-ink-muted mb-0.5">Cenário 2</div>
                <div className="font-semibold text-sm text-ink-primary">Regime Híbrido (CBS/IBS por fora)</div>
                <div className="text-xs text-ink-muted">Opta pela CBS/IBS plena (Art. 412–416 LC 214/2025). DAS reduzido ao IRPJ+CSLL+CPP; paga IVA com créditos plenos.</div>
              </div>

              <table className="w-full text-xs">
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="py-1.5 text-ink-secondary">DAS Reduzido / mês</td>
                    <td className="py-1.5 text-right num">{fmt.moeda(cenarioHibridoVerdadeiro.dasReduzidoMensal)}</td>
                    <td className="py-1.5 text-right text-ink-muted num w-16">{fmt.pct(cenarioHibridoVerdadeiro.aliquotaDasReduzido)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-ink-secondary">IBS + CBS Bruto</td>
                    <td className="py-1.5 text-right num">{fmt.moeda(cenarioHibridoVerdadeiro.ibsCBSBrutoMensal)}</td>
                    <td className="py-1.5 text-right text-ink-muted num">{fmt.pct(aliquotaIVABruta)}</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-success pl-3">→ Créditos de insumos</td>
                    <td className="py-1.5 text-right text-success num">({fmt.moeda(cenarioHibridoVerdadeiro.creditoMensal)})</td>
                    <td className="py-1.5 text-right text-success num">({fmt.pct(cenarioHibridoVerdadeiro.creditoMensal / faturamentoMensal)})</td>
                  </tr>
                  <tr>
                    <td className="py-1.5 text-ink-secondary">IBS + CBS Líquido</td>
                    <td className="py-1.5 text-right num">{fmt.moeda(cenarioHibridoVerdadeiro.ibsCBSLiquidoMensal)}</td>
                    <td className="py-1.5 text-right text-ink-muted num">{fmt.pct(cenarioHibridoVerdadeiro.ibsCBSLiquidoMensal / faturamentoMensal)}</td>
                  </tr>
                  <tr className="border-t-2 border-border font-semibold">
                    <td className="pt-2 text-ink-primary">Carga Total</td>
                    <td className="pt-2 text-right num">{fmt.moeda(cenarioHibridoVerdadeiro.totalMensal)}</td>
                    <td className="pt-2 text-right text-ink-primary num">{fmt.pct(cenarioHibridoVerdadeiro.aliquotaEfetiva)}</td>
                  </tr>
                </tbody>
              </table>

              <div className={`rounded-lg px-3 py-2 text-xs leading-relaxed border ${
                cenarioHibridoVerdadeiro.custoAdicionalVsSimples > 0
                  ? 'bg-danger-soft border-danger-border text-danger'
                  : 'bg-success-soft border-success-border text-success'
              }`}>
                Custo adicional vs Simples Pleno:{' '}
                <strong>
                  {cenarioHibridoVerdadeiro.custoAdicionalVsSimples > 0 ? '+' : ''}
                  {fmt.moeda(cenarioHibridoVerdadeiro.custoAdicionalVsSimples)}/mês
                </strong>
                {' '}— mas seus clientes B2B creditam os <strong>{fmt.pct(aliquotaIVABruta)}</strong> cheios do IVA.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ── Gráfico de transição ─────────────────────────────────────────── */}
      <div className="card p-6">
        <GraficoTransicao resultados={resultados} />
      </div>

      {/* ── Comparador de Regimes ────────────────────────────────────────── */}
      <div className="print:break-before-page">
        <ComparadorRegimes dadosBase={resultados} />
      </div>

      {/* ── Simulador de Crescimento ─────────────────────────────────────── */}
      <div className="print:break-before-page">
        <SimuladorCrescimento dadosBase={resultados} />
      </div>

      {/* ── Pró-labore ───────────────────────────────────────────────── */}
      {analiseProlabore && <CardProlabore analise={analiseProlabore} />}

      {/* ── Split Payment ────────────────────────────────────────────── */}
      {(regime === 'lucro_presumido' || regime === 'lucro_real' || regime === 'simples_nacional') && (
        <CardSplitPayment
          impostoIVAMensal={impostoIVALiquidoMensal}
          impostoIVABrutoMensal={impostoIVABrutoMensal}
          perfilClientes={perfilClientes}
        />
      )}

      {/* ── Bens usados — nota de regime diferenciado ────────────────── */}
      {setor.baseReduzidaMargem && (
        <div className="insight-warning flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-warning flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Regime Diferenciado — Base Reduzida à Margem (Cap. X Dec. 12.955/2026)</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Para revenda de bens usados comprados de pessoa física, a CBS incide apenas sobre a <strong>margem de lucro</strong> (preço de venda − preço pago ao PF),
              não sobre a receita bruta. A simulação acima usa margem típica de <strong>30%</strong> — ajuste conforme sua operação real.
              Quanto menor sua margem, menor a carga efetiva de CBS.
            </p>
          </div>
        </div>
      )}

      {/* ── Crédito vedado ao comprador (restaurantes, hotelaria, parques) ── */}
      {setor.creditoVedadoComprador && (perfilClientes === 'b2b' || perfilClientes === 'misto') && (
        <div className="insight-warning flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-warning flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Atenção — Crédito de CBS vedado ao comprador (Arts. 401/407 Dec. 12.955/2026)</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Mesmo que seus clientes sejam empresas (B2B), eles <strong>não podem tomar crédito de CBS</strong> nas compras deste setor.
              Isso significa que a alíquota reduzida de {fmt.pct(aliquotaIVABruta)} <strong>não se converte em vantagem competitiva</strong> para clientes no regime pleno —
              o IVA Dual incide mas sem gerar crédito na cadeia. Avalie impacto na precificação B2B.
            </p>
          </div>
        </div>
      )}

      {/* ── Gorjeta excluída da base (Art. 274 LC 214/2025) ──────────────── */}
      {gorjetaMensal > 0 && (
        <div className="insight-info flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-info flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Gorjeta excluída da base IBS/CBS — Art. 274 §único I LC 214/2025</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Gorjeta excluída: <strong className="num">{fmt.moeda(gorjetaMensal)}/mês</strong> — base de cálculo reduzida para{' '}
              <strong className="num">{fmt.moeda(faturamentoMensal - gorjetaMensal)}/mês</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Crédito presumido — Arts. 168-169 LC 214/2025 ──────────────── */}
      {(creditoProdutorRural > 0 || creditoTranspAutonomo > 0) && (
        <div className="insight-info flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-info flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><polyline points="20 6 9 17 4 12"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Crédito Presumido aplicado — Arts. 168-169 LC 214/2025</p>
            {creditoProdutorRural > 0 && (
              <p className="text-xs text-ink-secondary">
                Produtor rural não-contribuinte: crédito de <strong className="num">{fmt.moeda(creditoProdutorRural)}/mês</strong> (10,6% das compras rurais — Art. 168)
              </p>
            )}
            {creditoTranspAutonomo > 0 && (
              <p className="text-xs text-ink-secondary">
                Transportador autônomo PF: crédito de <strong className="num">{fmt.moeda(creditoTranspAutonomo)}/mês</strong> (15,9% do frete autônomo — Art. 169)
              </p>
            )}
            <p className="text-xs text-ink-muted">* Percentuais estimados com base nas reduções legais. Valores exatos definidos anualmente por MF/CGIBS.</p>
          </div>
        </div>
      )}

      {/* ── Produtor rural não-contribuinte (Art. 164 LC 214/2025) ─────── */}
      {produtorRuralNaoContribuinte && (
        <div className="insight-info flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-info flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Não-Contribuinte — IBS/CBS = R$ 0 (Art. 164 §1º LC 214/2025)</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Com faturamento anual abaixo de <strong>R$ 3.600.000</strong>, o produtor rural não é contribuinte do IBS e da CBS.
              Os seus compradores têm direito a crédito presumido (Art. 168 LC 214/2025) equivalente ao imposto que seria pago.
            </p>
          </div>
        </div>
      )}

      {/* ── Imposto Seletivo — alerta (Anexo XVII LC 214/2025) ──────────── */}
      {alertaImpostoSeletivo && (
        <div className="insight-warning flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-warning flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Atenção — Imposto Seletivo (IS) — Anexo XVII LC 214/2025</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Este setor é sujeito ao <strong>Imposto Seletivo</strong> sobre bens/serviços prejudiciais à saúde ou ao meio ambiente.
              A alíquota ainda <strong>não foi fixada</strong> por lei ordinária — o IS <em>não está incluído</em> neste cálculo.
              Acompanhe a tramitação antes de precificar.
            </p>
          </div>
        </div>
      )}

      {/* ── Cashback ao consumidor de baixa renda (Art. 118 LC 214/2025) ── */}
      {alertaCashback && (
        <div className="insight-info flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-info flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Cashback ao Consumidor — Devolução Personalizada (Art. 118 LC 214/2025)</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Seus clientes pessoa física de <strong>baixa renda</strong> (CadÚnico) recebem devolução de IBS/CBS: <strong>100% da CBS + 20% do IBS</strong> em energia elétrica domiciliar, água, esgoto, gás canalizado, GLP (botijão até 13 kg) e telecomunicações. A devolução não altera o imposto recolhido pela empresa — incide na cobrança ao consumidor final.
            </p>
          </div>
        </div>
      )}

      {/* ── Bens de capital usados — alerta (Arts. 406-407 LC 214/2025) ── */}
      {ivaVendaImobilizado > 0 && (
        <div className="insight-warning flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-warning flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Venda de Ativo Imobilizado — IBS/CBS Estimado (Arts. 406-407 LC 214/2025)</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              IBS/CBS estimado na venda de bens do ativo imobilizado: <strong className="num">{fmt.moeda(ivaVendaImobilizado)}/mês</strong> (alíquota plena do setor: {fmt.pct(aliquotaIVABruta)}).
              Não há redução específica na transição para este tipo de venda.
            </p>
          </div>
        </div>
      )}

      {/* ── Art. 108 — Crédito imediato bens de capital ─────────────────── */}
      {creditoCapitalImediato > 0 && (
        <div className="insight-success flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-success flex-shrink-0 mt-0.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Crédito Integral e Imediato — Bens de Capital (Art. 108 LC 214/2025)</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Crédito IBS/CBS no mês da compra: <strong className="num">{fmt.moeda(creditoCapitalImediato)}</strong>.
              {' '}PIS/COFINS creditaria apenas <strong className="num">{fmt.moeda(creditoCapitalPISCOFINS)}/mês</strong> (1/48 avos).
              {' '}Ganho de fluxo de caixa neste mês: <strong className="num text-success">{fmt.moeda(ganhoFluxoCaixaCapital)}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Art. 110 — Alíquota zero vendas rural / transportador ────────── */}
      {(ivaZeradoVendasRural > 0 || ivaZeradoVendasTransp > 0) && (
        <div className="insight-success flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-success flex-shrink-0 mt-0.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Alíquota Zero — Art. 110 LC 214/2025</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              {ivaZeradoVendasRural > 0 && <>Maquinário agrícola para produtor rural não-contribuinte: economia de <strong className="num">{fmt.moeda(ivaZeradoVendasRural)}/mês</strong> em IBS/CBS (débito = 0, créditos de entradas mantidos). </>}
              {ivaZeradoVendasTransp > 0 && <>Veículos para transportador autônomo PF: economia de <strong className="num">{fmt.moeda(ivaZeradoVendasTransp)}/mês</strong> em IBS/CBS.</>}
            </p>
          </div>
        </div>
      )}

      {/* ── Regime Automotivo — crédito presumido CBS (Arts. 309-316) ───── */}
      {creditoRegimeAutomotivo > 0 && (
        <div className="insight-success flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-success flex-shrink-0 mt-0.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Regime Automotivo — Crédito Presumido CBS (Arts. 309-316 LC 214/2025)</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Crédito presumido de CBS para projeto habilitado: <strong className="num">{fmt.moeda(creditoRegimeAutomotivo)}/mês</strong> (<strong className="num">{fmt.moeda(creditoRegimeAutomotivo * 12)}/ano</strong>), já deduzido no IVA líquido acima. O percentual é reduzido em 20% ao ano entre 2029 e 2032, extinguindo-se em 2033.
            </p>
          </div>
        </div>
      )}

      {/* ── Zona Franca de Manaus — créditos presumidos (Art. 450) ──────── */}
      {(creditoZFMIbs > 0 || creditoZFMCbs > 0) && (
        <div className="insight-success flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-success flex-shrink-0 mt-0.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Zona Franca de Manaus — Crédito Presumido (Art. 450 LC 214/2025)</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Crédito presumido de IBS: <strong className="num">{fmt.moeda(creditoZFMIbs)}/mês</strong> · CBS: <strong className="num">{fmt.moeda(creditoZFMCbs)}/mês</strong>. Total <strong className="num text-success">{fmt.moeda((creditoZFMIbs + creditoZFMCbs))}/mês</strong>, já deduzido no IVA líquido acima.
            </p>
            <p className="text-xs text-ink-muted leading-relaxed">
              A parcela de IBS usa estimativa da partilha IBS/CBS dentro dos 26,5% (≈17,7% IBS). Os créditos só compensam IBS/CBS devidos (sem ressarcimento em dinheiro) e prescrevem em 5 anos (Art. 452).
            </p>
          </div>
        </div>
      )}

      {/* ── Não-cumulatividade ampla — despesas creditáveis adicionais ──── */}
      {creditoDespesasAdicionais > 0 && (
        <div className="insight-success flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-success flex-shrink-0 mt-0.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Não-cumulatividade Ampla — IBS/CBS</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Crédito IBS/CBS sobre despesas que hoje não geram crédito de PIS/COFINS: <strong className="num">{fmt.moeda(creditoDespesasAdicionais)}/mês</strong>.
              Este crédito já está deduzido no imposto IVA líquido acima.
            </p>
          </div>
        </div>
      )}

      {/* ── Exportador habilitável — Art. 82 LC 214/2025 ─────────────────── */}
      {alertaExportadorHabilitavel && (
        <div className="insight-info flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-info flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Exportador Habilitável — Art. 82 LC 214/2025</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Mais de 50% da receita é de exportações: você pode se habilitar para <strong>suspensão de IBS/CBS</strong> nas compras de insumos destinados à exportação. Isso evita acúmulo de créditos e melhora o fluxo de caixa. Solicite habilitação junto ao Comitê Gestor do IBS / Receita Federal.
            </p>
          </div>
        </div>
      )}

      {/* ── Contratos administrativos — Arts. 373-377 LC 214/2025 ────────── */}
      {alertaContratoAdministrativo && (
        <div className="insight-info flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-info flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Reequilíbrio de Contratos Administrativos — Arts. 373-377 LC 214/2025</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Sua empresa fornece para o governo. A LC 214/2025 garante o <strong>direito ao reequilíbrio econômico-financeiro</strong> de contratos administrativos impactados pela reforma tributária. Se a carga tributária efetiva aumentar, você pode requerer a revisão do preço contratual. Documente a carga atual antes da transição.
            </p>
          </div>
        </div>
      )}

      {/* ── Base de cálculo reduzida — imóveis / agências ───────────────── */}
      {(setor.regimeImobiliario || setor.baseReduzidaRepasse) && baseCalculoEfetiva < faturamentoMensal && (
        <div className="insight-info flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-info flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">
              Base de cálculo efetiva: {fmt.moeda(baseCalculoEfetiva)}/mês
              {' '}({((baseCalculoEfetiva / faturamentoMensal) * 100).toFixed(1)}% da receita bruta)
            </p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              {setor.regimeImobiliario
                ? 'Arts. 369-376 Dec. 12.955/2026: CBS calculada sobre o valor da venda menos o redutor de ajuste (custo corrigido) e o redutor social. Os valores acima já refletem essa base reduzida.'
                : 'Art. 418 Dec. 12.955/2026: CBS calculada sobre o valor cobrado menos os repasses a fornecedores. Os valores acima já refletem essa base reduzida.'
              }
            </p>
          </div>
        </div>
      )}

      {/* ── Crédito perdido — fornecedor Simples ─────────────────────── */}
      {creditoPerdidoFornecedorSimples > 0 && (
        <div className="insight-warning flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-warning flex-shrink-0 mt-0.5">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Crédito de IVA reduzido — {pctFornecedoresSimples}% das compras vêm do Simples Nacional</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Fornecedores no Simples geram crédito de apenas <strong>~5,88%</strong> (vs. {fmt.pct(0.265 * (1 - setor.reducao))} do IVA cheio do seu setor).
              O crédito perdido chega a <strong className="num">{fmt.moeda(creditoPerdidoFornecedorSimples)}/mês</strong>{' '}
              (<strong className="num">{fmt.moeda(creditoPerdidoFornecedorSimples * 12)}/ano</strong>).
            </p>
          </div>
        </div>
      )}

      {/* ── INSS Autônomo ────────────────────────────────────────────────── */}
      {inssAutonomoMensal > 0 && (
        <div className="insight-info flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-info flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">INSS Contribuinte Individual incluído no cálculo</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Como autônomo (PF), você recolhe INSS de{' '}
              <strong>20%</strong> sobre os rendimentos, limitado ao teto previdenciário de{' '}
              <strong className="num">{fmt.moeda(8_157.41)}/mês</strong>.
              Isso representa <strong className="num">{fmt.moeda(inssAutonomoMensal)}/mês</strong>{' '}
              ({fmt.moeda(inssAutonomoMensal * 12)}/ano) já contabilizados na carga atual —
              um custo frequentemente ignorado na comparação PF × PJ.
            </p>
          </div>
        </div>
      )}

      {/* ── IRPJ Adicional ───────────────────────────────────────────────── */}
      {irpjAdicionalMensal > 0 && (
        <div className="insight-info flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-info flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">IRPJ Adicional de 10% incluído no cálculo</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Com o faturamento atual, o lucro presumido excede R$ 20.000/mês — incide IRPJ adicional de 10% sobre o excedente,
              representando <strong className="num">{fmt.moeda(irpjAdicionalMensal)}/mês</strong> ({fmt.moeda(irpjAdicionalMensal * 12)}/ano) já contabilizados na carga tributária atual.
              Esse valor é muitas vezes ignorado em simulações, mas tem impacto real no planejamento de regime.
            </p>
          </div>
        </div>
      )}

      {/* ── Alerta MEI: DAS fixo + limite + B2B ─────────────────────────── */}
      {isMEI && alertaMEI && (
        <div className="space-y-4">
          <div className="card border-warning-border bg-warning-soft p-6">
            <div className="space-y-3">
              <div>
                <h3 className="text-warning font-semibold text-base">MEI — Como funciona seu imposto hoje e no IVA Dual</h3>
                <p className="text-ink-secondary text-sm mt-1.5 leading-relaxed">
                  No MEI, o DAS é <strong>fixo em <span className="num">{fmt.moeda(alertaMEI.dasFixoMensal)}</span>/mês</strong> independente
                  do faturamento. A carga efetiva atual de <strong className="num">{fmt.pct(aliquotaAtual)}</strong> é muito baixa justamente por isso.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="bg-surface border border-warning-border rounded-md p-3">
                  <div className="text-ink-muted text-xs mb-1">DAS fixo atual/mês</div>
                  <div className="text-warning font-bold text-lg num">{fmt.moeda(alertaMEI.dasFixoMensal)}</div>
                  <div className="text-ink-muted text-xs mt-0.5">independente do faturamento</div>
                </div>
                <div className="bg-surface border border-warning-border rounded-md p-3">
                  <div className="text-ink-muted text-xs mb-1">IVA Dual (se migrar)/mês</div>
                  <div className={`font-bold text-lg num ${variacaoAbsolutaMensal > 0 ? 'text-danger' : 'text-success'}`}>
                    {fmt.moeda(impostoIVALiquidoMensal)}
                  </div>
                  <div className="text-ink-muted text-xs mt-0.5">com crédito de insumos</div>
                </div>
                <div className="bg-surface border border-warning-border rounded-md p-3">
                  <div className="text-ink-muted text-xs mb-1">Faturamento anual atual</div>
                  <div className="text-ink font-bold text-lg num">{fmt.moeda(faturamentoMensal * 12)}</div>
                  <div className="text-ink-muted text-xs mt-0.5">
                    limite: <span className="num">{fmt.moeda(alertaMEI.limiteAnual)}</span>/ano (<span className="num">{alertaMEI.limitePercentual.toFixed(0)}%</span> utilizado)
                  </div>
                </div>
              </div>
              <div className="insight-warning text-xs leading-relaxed">
                <strong>Como o IVA Dual afeta o MEI:</strong> o MEI continuará recolhendo o DAS
                (que vai incorporar gradualmente uma parcela de CBS/IBS). A principal desvantagem
                é para clientes B2B — eles <em>não conseguem creditar</em> o IVA embutido no DAS, tornando
                o MEI menos competitivo como fornecedor para empresas.
              </div>
            </div>
          </div>

          {alertaMEI.acimaDaFaixa && (
            <div className="insight-danger p-5">
              <div>
                <h3 className="font-semibold text-sm mb-1">Faturamento acima do limite MEI</h3>
                <p className="text-sm leading-relaxed opacity-90">
                  Com <span className="num">{fmt.moeda(faturamentoMensal * 12)}</span>/ano, você está acima do teto de{' '}
                  <span className="num">{fmt.moeda(alertaMEI.limiteAnual)}</span>/ano. O MEI é inaplicável nesse nível —
                  o Comparador de Regimes abaixo mostra qual regime empresarial é mais vantajoso para você.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Nota Profissional Liberal PF ─────────────────────────────────── */}
      {isPF && (
        <div className="card border-info-border bg-info-soft p-6">
          <div className="space-y-3">
            <div>
              <h3 className="text-info font-semibold text-base">Profissional Liberal (PF) — Como a Reforma afeta você</h3>
              <p className="text-ink-secondary text-sm mt-1.5 leading-relaxed">
                A carga atual de <strong className="num">{fmt.pct(aliquotaAtual)}</strong> é composta por{' '}
                IRPF (tabela progressiva até 27,5%) + ISS (~3%). Com o IVA Dual, o{' '}
                <strong>ISS é substituído pelo IBS</strong> — e você passa a ter direito a{' '}
                créditos sobre seus insumos.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-surface border border-info-border rounded-md p-3">
                <div className="text-ink-muted text-xs mb-1">O que NÃO muda</div>
                <div className="text-ink font-medium text-sm">IRPF (tabela progressiva)</div>
                <div className="text-ink-muted text-xs mt-0.5">continua sendo recolhido via Carnê-Leão</div>
              </div>
              <div className="bg-surface border border-info-border rounded-md p-3">
                <div className="text-ink-muted text-xs mb-1">O que MUDA</div>
                <div className="text-ink font-medium text-sm">ISS → IBS</div>
                <div className="text-ink-muted text-xs mt-0.5">com não-cumulatividade e créditos de insumos</div>
              </div>
            </div>
            {(perfilClientes === 'b2b' || perfilClientes === 'misto') && (
              <div className="insight-info text-xs leading-relaxed">
                <strong>Atenção — B2B como PF:</strong> autônomos sem CNPJ não geram crédito de IVA
                para clientes empresariais. Se seus principais clientes forem empresas, considere se
                formalizar como Simples Nacional ou Lucro Presumido para se tornar mais competitivo.
                O Comparador de Regimes abaixo mostra os números concretos.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Alerta: Reajuste de Margem ──────────────────────────────────── */}
      {cargaAumentou && reajustePrecoNecessario > 0 && (
        <div className="card border-danger-border bg-danger-soft p-6">
          <div className="space-y-3">
            <div>
              <h3 className="text-danger font-semibold text-base">Risco de Compressão de Margem</h3>
              <p className="text-ink-secondary text-sm mt-1">
                A carga do IVA Dual é <strong className="text-danger num">{Math.abs(variacaoPercentual).toFixed(1)}% maior</strong> que
                a tributação atual. Se não houver reajuste de preços, seu lucro diminuirá.
              </p>
            </div>
            <div className="bg-surface border border-danger-border rounded-md p-4">
              <p className="text-ink-secondary text-sm leading-relaxed">
                Para <strong className="text-ink">manter a mesma receita líquida</strong> com a nova carga tributária,
                você precisará reajustar seus preços em:
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-4xl font-black text-danger num">
                  +{reajustePrecoNecessario.toFixed(2).replace('.', ',')}%
                </span>
                <div className="text-sm text-ink-secondary leading-snug">
                  <div>Alíquota atual: <strong className="text-ink num">{fmt.pct(aliquotaAtual)}</strong></div>
                  <div>Alíquota pós-reforma: <strong className="text-ink num">{fmt.pct(faturamentoMensal > 0 ? cargaTotalReformaMensal / faturamentoMensal : 0)}</strong></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-surface border border-danger-border rounded-md p-3">
                <div className="text-ink-muted text-xs mb-1">Custo adicional mensal</div>
                <div className="text-danger font-bold text-lg num">{fmt.moeda(variacaoAbsolutaMensal)}</div>
              </div>
              <div className="bg-surface border border-danger-border rounded-md p-3">
                <div className="text-ink-muted text-xs mb-1">Custo adicional anual</div>
                <div className="text-danger font-bold text-lg num">{fmt.moeda(variacaoAbsolutaMensal * 12)}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Feedback positivo (carga caiu) ──────────────────────────────── */}
      {cargaReducao && !isento && (
        <div className="card border-success-border bg-success-soft p-6">
          <div>
            <h3 className="text-success font-semibold text-base">Redução de Carga Tributária Confirmada</h3>
            <p className="text-ink-secondary text-sm mt-2 leading-relaxed">
              O seu setor se beneficia da Reforma Tributária. Com o IVA Dual, a carga líquida cai{' '}
              <strong className="text-success num">{Math.abs(variacaoPercentual).toFixed(1)}%</strong>, gerando
              uma economia de <strong className="text-success num">{fmt.moeda(Math.abs(variacaoAbsolutaMensal))}/mês</strong>.
            </p>
          </div>
        </div>
      )}

      {/* ── Feedback: Isento ─────────────────────────────────────────────── */}
      {isento && (
        <div className="card border-success-border bg-success-soft p-6">
          <div>
            <h3 className="text-success font-semibold text-base">Setor Isento do IVA Dual</h3>
            <p className="text-ink-secondary text-sm mt-2 leading-relaxed">
              O setor <strong className="text-ink">{setor.label}</strong> possui isenção total de CBS e IBS.
              Atenção: tributos como IRPJ, CSLL e CPP continuam sendo devidos normalmente — apenas o IVA sobre o consumo é zerado.
            </p>
          </div>
        </div>
      )}

      {/* ── Análise: Simples Nacional Híbrido ───────────────────────────── */}
      {analiseSimplesHibrido && (
        <div className="card border-warning-border bg-warning-soft p-6">
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-warning font-semibold text-base">
                  {regime === 'mei' ? 'MEI Híbrido' : 'Simples Nacional Híbrido'} — Vale a pena?
                </h3>
                <span className={`badge ${analiseSimplesHibrido.vale ? 'badge-success' : 'badge-danger'}`}>
                  {analiseSimplesHibrido.vale ? 'RECOMENDADO' : 'NÃO RECOMENDADO'}
                </span>
              </div>
              <p className="text-ink-secondary text-sm mt-1.5 leading-relaxed">
                Como você vende para empresas (B2B) e está no {regime === 'mei' ? 'MEI' : 'Simples Nacional'},
                seus clientes <em>não conseguem creditar</em> o tributo embutido no DAS. Isso pode torná-lo
                menos competitivo frente a fornecedores no Lucro Presumido/Real.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="bg-surface border border-warning-border rounded-md p-3">
                <div className="text-ink-muted text-xs mb-1">IVA Híbrido Líquido/mês</div>
                <div className="text-warning font-bold text-base num">
                  {fmt.moeda(analiseSimplesHibrido.ivaHibridoLiquido)}
                </div>
                <div className="text-ink-muted text-xs mt-0.5">CBS+IBS pagos por fora do DAS</div>
              </div>
              <div className="bg-surface border border-warning-border rounded-md p-3">
                <div className="text-ink-muted text-xs mb-1">Custo adicional/mês</div>
                <div className={`font-bold text-base num ${analiseSimplesHibrido.custoAdicionalMensal > 0 ? 'text-danger' : 'text-success'}`}>
                  {analiseSimplesHibrido.custoAdicionalMensal > 0 ? '+' : ''}
                  {fmt.moeda(analiseSimplesHibrido.custoAdicionalMensal)}
                </div>
                <div className="text-ink-muted text-xs mt-0.5">vs. Simples clássico</div>
              </div>
              <div className="bg-surface border border-warning-border rounded-md p-3">
                <div className="text-ink-muted text-xs mb-1">Crédito p/ seus clientes</div>
                <div className="text-success font-bold text-base num">
                  {fmt.moeda(analiseSimplesHibrido.creditoDisponibilizadoAoCliente)}
                </div>
                <div className="text-ink-muted text-xs mt-0.5">que eles podem abater do IVA deles</div>
              </div>
            </div>

            <div className={`rounded-md p-4 border text-sm leading-relaxed
              ${analiseSimplesHibrido.vale
                ? 'bg-success-soft border-success-border text-success'
                : 'bg-danger-soft border-danger-border text-danger'
              }`}
            >
              <strong>Análise:</strong>{' '}
              {analiseSimplesHibrido.vale
                ? `O crédito de IVA disponibilizado aos seus clientes (${fmt.moeda(analiseSimplesHibrido.creditoDisponibilizadoAoCliente)}/mês)
                   é maior que o custo adicional do modelo híbrido. Seus clientes B2B tendem a preferir
                   fornecedores que geram crédito, tornando-o mais competitivo mesmo com o custo extra.`
                : `O custo adicional do modelo híbrido (${fmt.moeda(analiseSimplesHibrido.custoAdicionalMensal)}/mês) é alto
                   em relação ao benefício gerado aos clientes. Avalie permanecer no Simples clássico
                   ou migrar completamente para o Lucro Presumido.`
              }
            </div>

            <p className="text-ink-muted text-xs leading-relaxed">
              O Simples Nacional Híbrido ainda está sendo regulamentado. Acompanhe as instruções normativas da
              Receita Federal para a implementação formal prevista a partir de 2027.
            </p>
          </div>
        </div>
      )}

      {/* ── ICMS por Estado ──────────────────────────────────────────────── */}
      {analiseICMS && (
        <CardICMS analise={analiseICMS} regime={regime} />
      )}

      {/* ── Alerta: Grupo Societário ─────────────────────────────────────── */}
      {analiseGrupoSimples && (
        <CardGrupoSimples analise={analiseGrupoSimples} nomePrincipal={nomePrincipal} />
      )}

      {/* ── CBS Simples — crédito gerado para clientes B2B ──────────────── */}
      {regime === 'simples_nacional' && cbsSimplesEfetivo !== null && cbsSimplesEfetivo !== undefined && (
        perfilClientes === 'b2b' || perfilClientes === 'misto'
      ) && (
        <div className="insight-info flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-info flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">
              CBS que você gera para clientes B2B — Anexo {anexoSimples ?? '?'}: {fmt.pct(cbsSimplesEfetivo)}
            </p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Seus clientes no regime pleno (LP/LR) podem creditar <strong className="num">{fmt.pct(cbsSimplesEfetivo)}</strong> sobre cada compra feita de você —
              contra <strong className="num">{fmt.pct(aliquotaIVABruta)}</strong> que eles obteriam comprando de um fornecedor fora do Simples.
              {perfilClientes === 'b2b' && aliquotaIVABruta > 0 && cbsSimplesEfetivo < aliquotaIVABruta && (
                <> Diferença de <strong className="num text-warning">{fmt.pct(aliquotaIVABruta - cbsSimplesEfetivo)}</strong> por real comprado — avalie a opção pelo regime regular CBS (Art. 41 §3 Dec. 12.955/2026).</>
              )}
            </p>
          </div>
        </div>
      )}

      {/* ── Análise: Holding Patrimonial ─────────────────────────────────── */}
      {analiseHolding && analiseHolding.receitaTotalMensal > 0 && (
        <CardHolding analise={analiseHolding} />
      )}

      {/* ── Apuração da carga atual — Lucro Presumido ────────────────────── */}
      {regime === 'lucro_presumido' && apuracaoLucroPresumido && (
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink font-display">Composição da Carga Atual — Lucro Presumido</h3>
            <p className="text-ink-muted text-xs mt-0.5">
              Tributos federais (IRPJ, CSLL, PIS/COFINS), estaduais/municipais (ICMS/ISS
              {apuracaoLucroPresumido.icmsIssInformado ? ' — alíquotas informadas no formulário' : ' — médias nacionais'})
              e contribuição previdenciária (CPP 20% + terceiros sobre a folha; CPP 20% sobre o pró-labore).
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#FBFAF7] border border-border rounded-lg p-4 space-y-1.5 text-sm">
              <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Tributos federais</div>
              <div className="flex justify-between text-ink-muted"><span>Base presumida (presunção × receita)</span><span className="num">{fmt.moeda(apuracaoLucroPresumido.lucroPresumidoBase)}</span></div>
              <div className="flex justify-between text-ink-secondary"><span>IRPJ (15% da base presumida)</span><span className="num">{fmt.moeda(apuracaoLucroPresumido.irpj)}</span></div>
              <div className="flex justify-between text-ink-secondary"><span>IRPJ adicional (10% acima de R$ 20 mil)</span><span className="num">{fmt.moeda(apuracaoLucroPresumido.irpjAdicional)}</span></div>
              <div className="flex justify-between text-ink-secondary"><span>CSLL (9% da base presumida)</span><span className="num">{fmt.moeda(apuracaoLucroPresumido.csll)}</span></div>
              <div className="flex justify-between text-ink-secondary"><span>PIS/COFINS cumulativo (3,65%)</span><span className="num">{fmt.moeda(apuracaoLucroPresumido.pisCofins)}</span></div>
            </div>
            <div className="bg-[#FBFAF7] border border-border rounded-lg p-4 space-y-1.5 text-sm">
              <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">ICMS / ISS / Encargos</div>
              <div className="flex justify-between text-ink-secondary"><span>ICMS{apuracaoLucroPresumido.icmsIssInformado ? ' (alíquota informada)' : ' (média 12%)'}</span><span className="num">{fmt.moeda(apuracaoLucroPresumido.icms)}</span></div>
              <div className="flex justify-between text-ink-secondary"><span>ISS{apuracaoLucroPresumido.icmsIssInformado ? ' (alíquota informada)' : ' (média 3%)'}</span><span className="num">{fmt.moeda(apuracaoLucroPresumido.iss)}</span></div>
              {apuracaoLucroPresumido.ipi > 0 && (
                <div className="flex justify-between text-ink-secondary"><span>IPI (média 5% — indústria)</span><span className="num">{fmt.moeda(apuracaoLucroPresumido.ipi)}</span></div>
              )}
              {apuracaoLucroPresumido.inssPatronal > 0 && (
                <div className="flex justify-between text-warning font-medium"><span>CPP patronal (20% folha)</span><span className="num">{fmt.moeda(apuracaoLucroPresumido.inssPatronal)}</span></div>
              )}
              {apuracaoLucroPresumido.terceiros > 0 && (
                <div className="flex justify-between text-warning font-medium"><span>Terceiros — {labelTerceiros(setor.tipo)} (5,8%)</span><span className="num">{fmt.moeda(apuracaoLucroPresumido.terceiros)}</span></div>
              )}
              {apuracaoLucroPresumido.cppProLabore > 0 && (
                <div className="flex justify-between text-warning font-medium"><span>CPP pró-labore (20%)</span><span className="num">{fmt.moeda(apuracaoLucroPresumido.cppProLabore)}</span></div>
              )}
              <div className="flex justify-between font-bold text-danger border-t border-border pt-2 mt-1">
                <span>Carga total do mês</span><span className="num">{fmt.moeda(apuracaoLucroPresumido.totalImpostos)}</span>
              </div>
              <div className="flex justify-between text-xs text-ink-muted">
                <span>Alíquota efetiva sobre receita</span>
                <span className="num">{fmt.pct(faturamentoMensal > 0 ? apuracaoLucroPresumido.totalImpostos / faturamentoMensal : 0)}</span>
              </div>
            </div>
          </div>
          {!apuracaoLucroPresumido.icmsIssInformado && (
            <p className="text-ink-muted text-[11px] leading-relaxed">
              ICMS/ISS estimados por média nacional. Informe as alíquotas efetivas no formulário
              (card "Dados da Apuração — Folha, ICMS e ISS") para usar os valores reais da sua empresa.
            </p>
          )}
        </div>
      )}

      {/* ── Apuração efetiva do Lucro Real ───────────────────────────────── */}
      {regime === 'lucro_real' && apuracaoLucroReal && (
        <div className="card p-6 space-y-4">
          <div>
            <h3 className="text-base font-semibold text-ink font-display">Apuração do Lucro Real — Dados Efetivos</h3>
            <p className="text-ink-muted text-xs mt-0.5">
              IRPJ e CSLL calculados sobre o lucro efetivo informado, em vez da margem estimada de tabela.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-[#FBFAF7] border border-border rounded-lg p-4 space-y-1.5 text-sm">
              <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Formação do lucro tributável</div>
              <div className="flex justify-between text-ink-secondary"><span>Receita bruta</span><span className="num">{fmt.moeda(faturamentoMensal)}</span></div>
              <div className="flex justify-between text-ink-muted"><span>(−) CMV / Insumos</span><span className="num">−{fmt.moeda(insumosMensais)}</span></div>
              {apuracaoLucroReal.folhaPagamento > 0 && (
                <div className="flex justify-between text-ink-muted"><span>(−) Folha de pagamento</span><span className="num">−{fmt.moeda(apuracaoLucroReal.folhaPagamento)}</span></div>
              )}
              {apuracaoLucroReal.inssPatronal > 0 && (
                <div className="flex justify-between text-ink-muted"><span>(−) CPP patronal (20%)</span><span className="num">−{fmt.moeda(apuracaoLucroReal.inssPatronal)}</span></div>
              )}
              {apuracaoLucroReal.terceiros > 0 && (
                <div className="flex justify-between text-ink-muted"><span>(−) Terceiros — {labelTerceiros(setor.tipo)} (5,8%)</span><span className="num">−{fmt.moeda(apuracaoLucroReal.terceiros)}</span></div>
              )}
              {apuracaoLucroReal.proLabore > 0 && (
                <div className="flex justify-between text-ink-muted"><span>(−) Pró-labore dos sócios</span><span className="num">−{fmt.moeda(apuracaoLucroReal.proLabore)}</span></div>
              )}
              {apuracaoLucroReal.cppProLabore > 0 && (
                <div className="flex justify-between text-ink-muted"><span>(−) CPP pró-labore (20%)</span><span className="num">−{fmt.moeda(apuracaoLucroReal.cppProLabore)}</span></div>
              )}
              {apuracaoLucroReal.despesasOperacionais > 0 && (
                <div className="flex justify-between text-ink-muted"><span>(−) Despesas operacionais</span><span className="num">−{fmt.moeda(apuracaoLucroReal.despesasOperacionais)}</span></div>
              )}
              <div className="flex justify-between text-ink-muted"><span>(−) ICMS líquido</span><span className="num">−{fmt.moeda(apuracaoLucroReal.icmsLiquido)}</span></div>
              <div className="flex justify-between text-ink-muted"><span>(−) ISS</span><span className="num">−{fmt.moeda(apuracaoLucroReal.issLiquido)}</span></div>
              <div className="flex justify-between text-ink-muted"><span>(−) PIS/COFINS líquido</span><span className="num">−{fmt.moeda(apuracaoLucroReal.pisCofinsLiquido)}</span></div>
              <div className="flex justify-between font-bold text-ink border-t border-border pt-2 mt-1">
                <span>Lucro Real (base IRPJ/CSLL)</span><span className="num">{fmt.moeda(apuracaoLucroReal.lucroRealBase)}</span>
              </div>
            </div>
            <div className="bg-[#FBFAF7] border border-border rounded-lg p-4 space-y-1.5 text-sm">
              <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-2">Impostos do mês</div>
              <div className="flex justify-between text-ink-secondary"><span>IRPJ (15%)</span><span className="num">{fmt.moeda(apuracaoLucroReal.irpj)}</span></div>
              <div className="flex justify-between text-ink-secondary"><span>IRPJ adicional (10% acima de R$ 20 mil)</span><span className="num">{fmt.moeda(apuracaoLucroReal.irpjAdicional)}</span></div>
              <div className="flex justify-between text-ink-secondary"><span>CSLL (9%)</span><span className="num">{fmt.moeda(apuracaoLucroReal.csll)}</span></div>
              <div className="flex justify-between text-ink-secondary"><span>PIS/COFINS líquido (9,25%)</span><span className="num">{fmt.moeda(apuracaoLucroReal.pisCofinsLiquido)}</span></div>
              <div className="flex justify-between text-ink-secondary"><span>ICMS líquido</span><span className="num">{fmt.moeda(apuracaoLucroReal.icmsLiquido)}</span></div>
              <div className="flex justify-between text-ink-secondary"><span>ISS</span><span className="num">{fmt.moeda(apuracaoLucroReal.issLiquido)}</span></div>
              {apuracaoLucroReal.inssPatronal > 0 && (
                <div className="flex justify-between text-warning font-medium"><span>CPP patronal (20% folha)</span><span className="num">{fmt.moeda(apuracaoLucroReal.inssPatronal)}</span></div>
              )}
              {apuracaoLucroReal.terceiros > 0 && (
                <div className="flex justify-between text-warning font-medium"><span>Terceiros (Sistema S — 5,8%)</span><span className="num">{fmt.moeda(apuracaoLucroReal.terceiros)}</span></div>
              )}
              {apuracaoLucroReal.cppProLabore > 0 && (
                <div className="flex justify-between text-warning font-medium"><span>CPP pró-labore (20%)</span><span className="num">{fmt.moeda(apuracaoLucroReal.cppProLabore)}</span></div>
              )}
              <div className="flex justify-between font-bold text-danger border-t border-border pt-2 mt-1">
                <span>Carga total do mês</span><span className="num">{fmt.moeda(apuracaoLucroReal.totalImpostos)}</span>
              </div>
              <div className="flex justify-between text-xs text-ink-muted">
                <span>Alíquota efetiva sobre receita</span>
                <span className="num">{fmt.pct(faturamentoMensal > 0 ? apuracaoLucroReal.totalImpostos / faturamentoMensal : 0)}</span>
              </div>
            </div>
          </div>
          <p className="text-ink-muted text-[11px] leading-relaxed">
            Inclui CPP patronal (20%) + terceiros (Sistema S, 5,8%) sobre a folha e CPP (20%) sobre o pró-labore.
            Modelo simplificado: não considera adições/exclusões do LALUR, compensação de prejuízos fiscais (trava de 30%),
            créditos de PIS/COFINS sobre despesas (energia, aluguéis, depreciação) nem RAT/FAP sobre a folha (1% a 3% conforme o risco).
            Apuração real do IRPJ é trimestral ou anual com estimativas — valores mensais são aproximação.
          </p>
        </div>
      )}

      {/* ── JCP — Lucro Real ─────────────────────────────────────────────── */}
      {regime === 'lucro_real' && <CardJCP faturamentoMensal={faturamentoMensal} />}

      {/* ── Créditos de ICMS na Transição ────────────────────────────────── */}
      {(regime === 'lucro_presumido' || regime === 'lucro_real') && (
        <CardCreditosICMS faturamentoMensal={faturamentoMensal} />
      )}

      {/* ── Alerta reforma do IR — dividendos ────────────────────────────── */}
      {(regime === 'lucro_presumido' || regime === 'lucro_real' || regime === 'profissional_liberal') && (
        <AlertaDividendos regime={regime} />
      )}

      {/* ── Nota: monofásico — postos de combustível ─────────────────────── */}
      {setor.monofasico && (
        <div className="insight-info flex items-start gap-3">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-info flex-shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-ink">Regime Monofásico — CBS/IBS recolhida upstream (Art. 259 Dec. 12.955/2026)</p>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Para combustíveis, a CBS e o IBS são recolhidos integralmente pelo <strong>produtor ou distribuidor</strong> — o posto varejista não recolhe CBS/IBS sobre suas vendas.
              Isso significa que a carga nova de IVA Dual no ponto de venda é <strong>zero</strong>. O imposto já vem embutido no custo de aquisição do combustível.
              A comparação acima mostra o impacto no custo de compra (insumos), não em saídas do posto.
            </p>
          </div>
        </div>
      )}

      {/* ── Tabela de transição completa ─────────────────────────────────── */}
      <div className="card p-6">
        <h3 className="section-title mb-4"><span className="font-display">Cronograma de Transição Completo</span></h3>
        <div className="overflow-x-auto">
          <table className="table-premium text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Ano</th>
                <th className="text-right px-4 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Imposto / Mês</th>
                <th className="text-right px-4 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Imposto / Ano</th>
                <th className="text-right px-4 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Alíq. Efetiva</th>
                <th className="text-right py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">vs. Atual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {projecaoAnos.map(p => {
                const delta = p.impostoMensal - impostoAtualMensal
                const isLast = p.ano === 2033
                return (
                  <tr key={p.ano} className={`transition-colors ${isLast ? 'bg-info-soft' : 'hover:bg-subtle'}`}>
                    <td className="py-3 text-ink font-semibold num">
                      {p.ano}
                      {p.ano === 2026 && <span className="ml-2 text-xs text-ink-muted font-normal">(atual)</span>}
                      {p.ano === 2033 && <span className="ml-2 text-xs text-info font-normal">(IVA pleno)</span>}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-secondary num">{fmt.moeda(p.impostoMensal)}</td>
                    <td className="px-4 py-3 text-right text-ink-secondary num">{fmt.moeda(p.impostoAnual)}</td>
                    <td className="px-4 py-3 text-right text-ink-muted num">{fmt.pct(p.aliquotaEfetiva)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={`text-xs font-medium num ${
                        Math.abs(delta) < 1 ? 'text-ink-muted opacity-40' :
                        delta > 0 ? 'text-danger' : 'text-success'
                      }`}>
                        {Math.abs(delta) < 1 ? '—' : `${delta > 0 ? '+' : ''}${fmt.moeda(delta)}/mês`}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CTA final ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 justify-center pt-2 pb-6">
        <button onClick={onVoltar} className="btn-secondary">
          ← Simular outra empresa
        </button>
      </div>
      </>
      )}

    </div>
  )
}

// ─── CardGrupoSimples ─────────────────────────────────────────────────────────

function CardGrupoSimples({ analise, nomePrincipal }: { analise: AnaliseGrupoSimples; nomePrincipal: string }) {
  const {
    faturamentoAnualPrincipal, faturamentoAnualGrupo, faturamentoAnualTotal,
    dentroDoLimite, limiteAnual, percentualUtilizado,
    empresasQueContam, empresasQueNaoContam,
  } = analise

  const excedeu = !dentroDoLimite
  const alerta  = dentroDoLimite && percentualUtilizado >= 80
  const pctBar  = Math.min(100, percentualUtilizado)

  const cor = excedeu ? {
    card: 'border-danger-border bg-danger-soft', titulo: 'text-danger',
    barra: 'bg-danger', badge: 'badge-danger',
  } : alerta ? {
    card: 'border-warning-border bg-warning-soft', titulo: 'text-warning',
    barra: 'bg-warning', badge: 'badge-warning',
  } : {
    card: 'border-success-border bg-success-soft', titulo: 'text-success',
    barra: 'bg-success', badge: 'badge-success',
  }

  return (
    <div className={`card p-6 border ${cor.card}`}>
      <div className="space-y-4">

        {/* Título */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className={`font-semibold text-base ${cor.titulo}`}>
            Grupo Societário — Limite do Simples Nacional
          </h3>
          <span className={`badge ${cor.badge}`}>
            {excedeu ? 'LIMITE EXCEDIDO' : alerta ? 'ATENÇÃO' : 'DENTRO DO LIMITE'}
          </span>
        </div>

        {/* Barra de progresso */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-ink-secondary">
            <span>Faturamento anual do grupo (participações ≥ 10%)</span>
            <span className="num font-semibold text-ink">
              {fmt.moeda(faturamentoAnualTotal)}/ano
            </span>
          </div>
          <div className="h-3 bg-surface/70 rounded-full overflow-hidden border border-border">
            <div
              className={`h-full rounded-full transition-all ${cor.barra}`}
              style={{ width: `${pctBar}%` }}
            />
          </div>
          <div className="flex justify-between text-xs">
            <span className={`num ${cor.titulo}`}>{percentualUtilizado.toFixed(2)}% do limite</span>
            <span className="text-ink-muted num">Limite LC 123: {fmt.moeda(limiteAnual)}/ano</span>
          </div>
        </div>

        {/* Breakdown por empresa */}
        <div className="bg-surface/60 rounded-lg border border-border divide-y divide-border text-sm">
          <div className="flex justify-between px-4 py-2.5 text-ink">
            <span className="font-medium">{nomePrincipal || 'Empresa principal'} <span className="text-ink-muted font-normal text-xs">(esta simulação)</span></span>
            <span className="num font-semibold">{fmt.moeda(faturamentoAnualPrincipal)}/ano</span>
          </div>
          {empresasQueContam.map((e, i) => (
            <div key={e.id} className="flex justify-between px-4 py-2.5 text-ink">
              <span>{e.nome || `Empresa ${i + 2}`}
                <span className="ml-1.5 text-xs text-info font-medium num">({e.participacao.toFixed(2)}%)</span>
              </span>
              <span className="num font-semibold">{fmt.moeda(e.faturamentoMensal * 12)}/ano</span>
            </div>
          ))}
          <div className={`flex justify-between px-4 py-2.5 font-bold ${cor.titulo}`}>
            <span>Total consolidado</span>
            <span className="num">{fmt.moeda(faturamentoAnualTotal)}/ano</span>
          </div>
        </div>

        {/* Empresas que não contam */}
        {empresasQueNaoContam.length > 0 && (
          <p className="text-xs text-ink-muted leading-relaxed">
            <strong className="text-ink-secondary">Não somam ao limite</strong> (participação {'< 10%'}):
            {' '}{empresasQueNaoContam.map(e => e.nome || 'empresa sem nome').join(', ')}.
          </p>
        )}

        {/* Mensagem de diagnóstico */}
        <div className={`rounded-md p-4 border text-sm leading-relaxed
          ${excedeu ? 'bg-danger-soft border-danger-border text-danger'
          : alerta  ? 'bg-warning-soft border-warning-border text-warning'
          : 'bg-success-soft border-success-border text-success'}`}
        >
          {excedeu ? (
            <>
              <strong>Desenquadramento do Simples Nacional:</strong> com faturamento consolidado de{' '}
              {fmt.moeda(faturamentoAnualTotal)}/ano, o grupo ultrapassa o limite de{' '}
              {fmt.moeda(limiteAnual)}/ano em {fmt.moeda(faturamentoAnualTotal - limiteAnual)}.
              Conforme LC 123/2006, Art. 3º, §4º, <strong>todas as empresas do grupo serão
              excluídas do Simples</strong>. Verifique o Comparador de Regimes para avaliar
              Lucro Presumido ou Lucro Real.
            </>
          ) : alerta ? (
            <>
              <strong>Risco de extrapolação:</strong> o grupo já usa {percentualUtilizado.toFixed(2)}% do
              limite. Restam {fmt.moeda(limiteAnual - faturamentoAnualTotal)}/ano de margem. Monitore
              o crescimento para não acionar o desenquadramento automático.
            </>
          ) : (
            <>
              <strong>Grupo dentro do limite:</strong> faturamento consolidado de{' '}
              {fmt.moeda(faturamentoAnualTotal)}/ano — {fmt.moeda(limiteAnual - faturamentoAnualTotal)}/ano
              de margem disponível até o teto do Simples Nacional.
            </>
          )}
        </div>

        <p className="text-ink-muted text-xs leading-relaxed">
          Base legal: <strong className="text-ink-secondary">LC 123/2006, Art. 3º, §4º</strong> —
          o sócio com ≥ 10% do capital em outra empresa tem os faturamentos somados para o limite.
          A exclusão do Simples ocorre a partir do mês seguinte ao estouro do teto.
        </p>
      </div>
    </div>
  )
}

// ─── CardICMS ────────────────────────────────────────────────────────────────

function CardICMS({ analise, regime }: { analise: AnaliseICMS; regime: TipoRegime }) {
  const {
    uf, aliquotaInterna, icmsDebito, icmsCredito, icmsLiquido,
    aliquotaEfetivaICMS, aplicavel, nota,
  } = analise

  const nomeUF = UF_NOMES[uf] ?? uf
  const pct = (v: number, casas = 3) => `${(v * 100).toFixed(casas).replace('.', ',')}%`

  return (
    <div className="card p-6">
      <div className="space-y-4">

        {/* Título */}
        <div className="flex items-center gap-3 flex-wrap">
          <h3 className="section-title">
            ICMS — {uf} · {nomeUF}
          </h3>
          <span className="px-2.5 py-0.5 bg-orange-50 border border-orange-200 rounded text-xs font-semibold text-orange-700">
            Alíquota interna: {pct(aliquotaInterna, aliquotaInterna % 0.01 !== 0 ? 1 : 0)}
          </span>
        </div>

        {/* Regime não aplicável */}
        {!aplicavel ? (
          <div className="insight-neutral flex items-start gap-3">
            <div>
              <p className="text-sm font-medium">ICMS não apurado separadamente</p>
              <p className="text-xs mt-1 leading-relaxed opacity-80">{nota}</p>
            </div>
          </div>
        ) : (
          <>
            {/* Cards de métricas */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="stat-card border-l-4 border-l-warning">
                <span className="stat-label">ICMS Débito (saída)</span>
                <span className="stat-value text-warning num">{fmt.moeda(icmsDebito)}</span>
                <span className="text-xs text-ink-muted num">
                  {fmt.moeda(icmsDebito * 12)}/ano · {pct(aliquotaInterna)} × faturamento
                </span>
              </div>

              <div className="stat-card border-l-4 border-l-success">
                <span className="stat-label">Crédito ICMS (entradas)</span>
                <span className="stat-value text-success num">−{fmt.moeda(icmsCredito)}</span>
                <span className="text-xs text-ink-muted num">
                  {fmt.moeda(icmsCredito * 12)}/ano · {pct(aliquotaInterna)} × insumos
                </span>
              </div>

              <div className={`stat-card border-l-4 ${icmsLiquido > 0 ? 'border-l-danger' : 'border-l-success'}`}>
                <span className="stat-label">ICMS a Recolher (líquido)</span>
                <span className={`stat-value num ${icmsLiquido > 0 ? 'text-danger' : 'text-success'}`}>
                  {fmt.moeda(icmsLiquido)}
                </span>
                <span className="text-xs text-ink-muted num">
                  {fmt.moeda(icmsLiquido * 12)}/ano · alíq. efetiva {pct(aliquotaEfetivaICMS)}
                </span>
              </div>
            </div>

            {/* Detalhamento */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="table-premium w-full text-sm">
                <thead>
                  <tr className="bg-subtle border-b border-border">
                    <th className="text-left px-4 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Componente</th>
                    <th className="text-right px-4 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Mensal</th>
                    <th className="text-right px-4 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Anual</th>
                    <th className="text-right px-4 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">% Faturamento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-subtle">
                    <td className="px-4 py-3 text-ink">ICMS Débito (saídas)</td>
                    <td className="px-4 py-3 text-right text-warning font-medium num">{fmt.moeda(icmsDebito)}</td>
                    <td className="px-4 py-3 text-right text-warning num">{fmt.moeda(icmsDebito * 12)}</td>
                    <td className="px-4 py-3 text-right text-ink-secondary num">{pct(aliquotaInterna)}</td>
                  </tr>
                  <tr className="hover:bg-subtle">
                    <td className="px-4 py-3 text-ink">Crédito ICMS (entradas)</td>
                    <td className="px-4 py-3 text-right text-success font-medium num">−{fmt.moeda(icmsCredito)}</td>
                    <td className="px-4 py-3 text-right text-success num">−{fmt.moeda(icmsCredito * 12)}</td>
                    <td className="px-4 py-3 text-right text-ink-secondary num">−{pct(aliquotaInterna)}</td>
                  </tr>
                  <tr className="bg-subtle font-semibold border-t-2 border-border">
                    <td className="px-4 py-3 text-ink">ICMS Líquido a Recolher</td>
                    <td className={`px-4 py-3 text-right num ${icmsLiquido > 0 ? 'text-danger' : 'text-success'}`}>
                      {fmt.moeda(icmsLiquido)}
                    </td>
                    <td className={`px-4 py-3 text-right num ${icmsLiquido > 0 ? 'text-danger' : 'text-success'}`}>
                      {fmt.moeda(icmsLiquido * 12)}
                    </td>
                    <td className={`px-4 py-3 text-right num ${icmsLiquido > 0 ? 'text-danger' : 'text-success'}`}>
                      {pct(aliquotaEfetivaICMS)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Nota do estado */}
            <p className="text-ink-muted text-xs leading-relaxed bg-subtle border border-border rounded-lg px-4 py-3">
              <strong className="text-ink-secondary">Atenção:</strong> {nota}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ─── CardProlabore ────────────────────────────────────────────────────────────

function CardProlabore({ analise }: { analise: AnaliseProlabore }) {
  const {
    socios, detalhes, totalIrpf, totalInssEmpregado, totalInssPatronal,
    beneficioFiscalEmpresa, custoTotalBruto, custoLiquido, regime,
  } = analise

  return (
    <div className="card-elevated p-6 space-y-5">
      <h3 className="section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted flex-shrink-0">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        <span className="font-display">Análise de Pró-labore — {socios.length} sócio{socios.length > 1 ? 's' : ''}</span>
      </h3>

      {/* Detalhamento por sócio */}
      {detalhes.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[#E4DDD2]">
          <table className="table-premium w-full text-sm">
            <thead>
              <tr className="border-b border-[#E4DDD2]">
                <th className="text-left py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Sócio</th>
                <th className="text-right px-3 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Pró-labore</th>
                <th className="text-right px-3 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">IRPF</th>
                <th className="text-right px-3 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">INSS sócio</th>
                <th className="text-right px-3 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">INSS patronal</th>
                <th className="text-right py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Custo total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE3]">
              {detalhes.map(d => (
                <tr key={d.socio.id} className="hover:bg-[#FBFAF7] transition-colors">
                  <td className="py-3 text-ink font-medium">{d.socio.nome}</td>
                  <td className="px-3 py-3 text-right text-ink-secondary num">{fmt.moeda(d.socio.prolaboreMensal)}</td>
                  <td className="px-3 py-3 text-right text-danger num">{fmt.moeda(d.irpfMensal)}</td>
                  <td className="px-3 py-3 text-right text-danger num">{fmt.moeda(d.inssEmpregado)}</td>
                  <td className="px-3 py-3 text-right text-danger num">{fmt.moeda(d.inssPatronal)}</td>
                  <td className="py-3 text-right font-semibold text-danger num">{fmt.moeda(d.custoTotal)}</td>
                </tr>
              ))}
            </tbody>
            {detalhes.length > 1 && (
              <tfoot>
                <tr className="border-t-2 border-[#E4DDD2] bg-[#FBFAF7]">
                  <td className="py-3 font-bold text-xs uppercase tracking-wider text-ink-secondary">Total</td>
                  <td className="px-3 py-3 text-right font-bold text-ink num">{fmt.moeda(analise.totalProlabore)}</td>
                  <td className="px-3 py-3 text-right font-bold text-danger num">{fmt.moeda(totalIrpf)}</td>
                  <td className="px-3 py-3 text-right font-bold text-danger num">{fmt.moeda(totalInssEmpregado)}</td>
                  <td className="px-3 py-3 text-right font-bold text-danger num">{fmt.moeda(totalInssPatronal)}</td>
                  <td className="py-3 text-right font-bold text-danger num">{fmt.moeda(custoTotalBruto)}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#FDECEC] border border-[#F4A9A5] rounded-xl p-4">
          <p className="text-xs text-[#B42318] font-semibold uppercase tracking-wide">Custo total bruto</p>
          <p className="text-xl font-bold num text-[#B42318] mt-1">{fmt.moeda(custoTotalBruto)}<span className="text-xs font-normal">/mês</span></p>
          <p className="text-xs text-[#B42318] opacity-70 mt-0.5">{fmt.moeda(custoTotalBruto * 12)}/ano</p>
        </div>
        {beneficioFiscalEmpresa > 0 ? (
          <div className="bg-[#E7F4ED] border border-[#A8D5BC] rounded-xl p-4">
            <p className="text-xs text-[#2F7D57] font-semibold uppercase tracking-wide">Economia IRPJ/CSLL (LR)</p>
            <p className="text-xl font-bold num text-[#2F7D57] mt-1">−{fmt.moeda(beneficioFiscalEmpresa)}<span className="text-xs font-normal">/mês</span></p>
            <p className="text-xs text-[#2F7D57] opacity-70 mt-0.5">24% sobre pró-labore total</p>
          </div>
        ) : (
          <div className="bg-[#FBFAF7] border border-[#E4DDD2] rounded-xl p-4">
            <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">LP — sem dedução</p>
            <p className="text-sm text-ink-muted leading-relaxed mt-1">Pró-labore não reduz base de IRPJ no Lucro Presumido</p>
          </div>
        )}
        <div className={`rounded-xl p-4 border ${custoLiquido > 0 ? 'bg-[#FDECEC] border-[#F4A9A5]' : 'bg-[#E7F4ED] border-[#A8D5BC]'}`}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: custoLiquido > 0 ? '#B42318' : '#2F7D57' }}>
            Custo líquido vs. distribuição
          </p>
          <p className={`text-xl font-bold num mt-1 ${custoLiquido > 0 ? 'text-[#B42318]' : 'text-[#2F7D57]'}`}>
            {fmt.moeda(custoLiquido)}<span className="text-xs font-normal">/mês</span>
          </p>
          <p className="text-xs opacity-70 mt-0.5" style={{ color: custoLiquido > 0 ? '#B42318' : '#2F7D57' }}>
            {fmt.moeda(custoLiquido * 12)}/ano a mais que distribuição
          </p>
        </div>
      </div>

      <div className={`text-xs leading-relaxed ${custoLiquido > 0 ? 'insight-warning' : 'insight-success'}`}>
        {custoLiquido > 0
          ? <>Manter esses pró-labores custa <strong className="num">{fmt.moeda(custoLiquido)}/mês</strong> a mais do que distribuir os mesmos valores como lucros (isentos de IRPF). {regime === 'lucro_presumido' ? 'No LP, o pró-labore não reduz IRPJ — considere reduzir ao mínimo exigido pelo INSS.' : `No LR a dedução de IRPJ/CSLL reduz o custo em ${fmt.moeda(beneficioFiscalEmpresa)}/mês, mas ainda há custo líquido.`}</>
          : <>No Lucro Real, a economia de IRPJ/CSLL ({fmt.moeda(beneficioFiscalEmpresa)}/mês) cobre integralmente o custo de IRPF + INSS — pró-labore é vantajoso nesse nível.</>
        }
      </div>

      <p className="text-xs text-ink-muted">
        Distribuição de lucros isenta de IRPF (Lei 9.249/1995, Art. 10). INSS patronal: 20%. INSS contribuinte individual: 20% até o teto de {fmt.moeda(8_157.41)}/mês.
      </p>
    </div>
  )
}

// ─── CardFatorR ───────────────────────────────────────────────────────────────

function CardFatorR({ analise }: { analise: AnaliseFatorR }) {
  const {
    folhaMensal, faturamentoMensal, fatorR, anexo,
    aliquotaAnexoIII, aliquotaAnexoV,
    diferencaMensal, folhaMinimaPara28pct, jaEstaNoIII,
  } = analise

  const faltaParaIII = Math.max(0, folhaMinimaPara28pct - folhaMensal)
  const pctBarra = Math.min(100, (fatorR / 0.28) * 100)

  return (
    <div className="card-elevated p-6 space-y-5">
      <h3 className="section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted flex-shrink-0">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
        <span className="font-display">Fator R — Simples Nacional</span>
        <span className={`badge text-xs ${jaEstaNoIII ? 'badge-success' : 'badge-warning'}`}>
          Anexo {anexo}
        </span>
      </h3>

      {/* Barra de progresso do Fator R */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-ink-secondary font-medium">Fator R atual</span>
          <span className={`font-bold num ${jaEstaNoIII ? 'text-success' : 'text-warning'}`}>
            {(fatorR * 100).toFixed(1)}% {jaEstaNoIII ? '≥ 28%' : '< 28%'}
          </span>
        </div>
        <div className="relative h-2 bg-[#E4DDD2] rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${jaEstaNoIII ? 'bg-success' : 'bg-warning'}`}
            style={{ width: `${pctBarra}%` }}
          />
          {/* Marcador do limiar em 28% */}
          <div className="absolute top-0 h-full w-px bg-[#9A9286]" style={{ left: '100%' }} />
        </div>
        <div className="flex justify-between text-xs text-ink-muted">
          <span>0%</span>
          <span className="font-medium">Limiar: 28%</span>
        </div>
      </div>

      {/* Cards comparativos */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-xl border p-4 space-y-1 ${jaEstaNoIII ? 'bg-[#E7F4ED] border-[#A8D5BC]' : 'bg-[#FBFAF7] border-[#E4DDD2]'}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2F7D57]">Anexo III</p>
          <p className="text-lg font-bold num text-[#2F7D57]">{fmt.pct(aliquotaAnexoIII)}</p>
          <p className="text-xs text-[#5F5A52]">Folha ≥ 28% do fat.</p>
          <p className="text-xs font-medium text-[#2F7D57] num">{fmt.moeda(faturamentoMensal * aliquotaAnexoIII)}/mês</p>
        </div>
        <div className={`rounded-xl border p-4 space-y-1 ${!jaEstaNoIII ? 'bg-[#FFF4DA] border-[#F4C97A]' : 'bg-[#FBFAF7] border-[#E4DDD2]'}`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#B7791F]">Anexo V</p>
          <p className="text-lg font-bold num text-[#B7791F]">{fmt.pct(aliquotaAnexoV)}</p>
          <p className="text-xs text-[#5F5A52]">Folha &lt; 28% do fat.</p>
          <p className="text-xs font-medium text-[#B7791F] num">{fmt.moeda(faturamentoMensal * aliquotaAnexoV)}/mês</p>
        </div>
      </div>

      {/* Insight principal */}
      {jaEstaNoIII ? (
        <div className="insight-success text-xs leading-relaxed">
          Sua folha representa <strong className="num">{(fatorR * 100).toFixed(1)}%</strong> do faturamento —
          acima do limiar de 28%. Você está no <strong>Anexo III</strong> e paga{' '}
          <strong className="num">{fmt.moeda(diferencaMensal)}/mês</strong> a menos do que pagaria no Anexo V.
        </div>
      ) : (
        <div className="insight-warning text-xs leading-relaxed">
          Sua folha está em <strong className="num">{(fatorR * 100).toFixed(1)}%</strong> do faturamento —
          abaixo do limiar de 28%. Aumentar o pró-labore em{' '}
          <strong className="num">{fmt.moeda(faltaParaIII)}/mês</strong> migraria para o Anexo III e economizaria{' '}
          <strong className="num">{fmt.moeda(diferencaMensal)}/mês</strong> em DAS.
        </div>
      )}

      <p className="text-xs text-ink-muted">
        Fator R = Folha 12 meses ÷ Receita bruta 12 meses (LC 123/2006, Art. 18, §5º-M).
        A folha inclui pró-labore, salários CLT, pagamentos a autônomos com retenção de INSS e CPP (contribuição patronal previdenciária).
        Verifique com seu contador se a atividade específica está sujeita ao Fator R.
      </p>
    </div>
  )
}

// ─── CardHolding ─────────────────────────────────────────────────────────────

function CardHolding({ analise }: { analise: AnaliseHolding }) {
  const {
    regime, imoveis,
    receitaTotalMensal, receitaGratuitaNaoTributada,
    aliquotaIBSCBS, ibsCBSMensal,
    aliquotaTributosCorrentes, tributosCorrMensal,
    cargaTotalMensal, cargaTotalPercentual,
    cargaPFMensal, cargaPFPercentual,
    vantagemHolding, economiaMensalHolding,
    imoveisGratuitosSemCredito, imoveisGratuitosComCredito,
  } = analise

  const pct = (v: number, casas = 2) => `${(v * 100).toFixed(casas).replace('.', ',')}%`
  const nomeRegime = regime === 'lucro_presumido' ? 'Lucro Presumido' : 'Lucro Real'

  return (
    <div className="card border-gold bg-raised p-6">
      <div className="space-y-4">

        {/* Título */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <h3 className="text-gold font-semibold text-base">
            Holding Patrimonial — Análise Tributária
          </h3>
          <span className={`badge ${vantagemHolding ? 'badge-success' : 'badge-danger'}`}>
            {vantagemHolding ? 'HOLDING VANTAJOSA' : 'PF VANTAJOSA'}
          </span>
          <span className="badge badge-gold">
            {nomeRegime}
          </span>
        </div>

        {/* Aviso uso gratuito sem crédito */}
        {receitaGratuitaNaoTributada > 0 && (
          <div className="insight-success text-xs">
            <strong className="num">{fmt.moeda(receitaGratuitaNaoTributada)}/mês</strong> em uso gratuito
            (patrimônio pré-reforma sem créditos) <strong>não é tributado</strong> pelo IBS/CBS — LC 227/2026.
          </div>
        )}

        {/* Cards de métricas */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Receita tributável/mês', valor: receitaTotalMensal, cor: 'text-ink' },
            { label: `IBS/CBS (${pct(aliquotaIBSCBS)})/mês`, valor: ibsCBSMensal, cor: 'text-gold' },
            { label: `${nomeRegime} (${pct(aliquotaTributosCorrentes, 4)})/mês`, valor: tributosCorrMensal, cor: 'text-info' },
            { label: 'Carga total holding/mês', valor: cargaTotalMensal, cor: 'text-gold' },
          ].map(item => (
            <div key={item.label} className="bg-surface border border-border rounded-lg p-3">
              <p className="text-ink-muted text-xs mb-1 leading-snug">{item.label}</p>
              <p className={`font-bold text-base num ${item.cor}`}>{fmt.moeda(item.valor)}</p>
            </div>
          ))}
        </div>

        {/* Comparativo PF × Holding */}
        <div className="bg-surface border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 bg-raised border-b border-border">
            <h4 className="text-xs font-bold text-gold uppercase tracking-wide">PF (Carnê-Leão) × Holding</h4>
          </div>
          <div className="divide-y divide-border text-sm">
            <div className="flex justify-between items-center px-4 py-3">
              <div>
                <p className="text-ink">IRPF — Pessoa Física</p>
                <p className="text-xs text-ink-muted">Tabela progressiva 2025 + Lei 15.270/2025</p>
              </div>
              <div className="text-right">
                <p className="font-semibold num text-ink">{fmt.moeda(cargaPFMensal)}/mês</p>
                <p className="text-xs text-ink-muted num">{pct(cargaPFPercentual)} efetivo</p>
              </div>
            </div>
            <div className="flex justify-between items-center px-4 py-3">
              <div>
                <p className="text-ink">Carga total — Holding ({nomeRegime})</p>
                <p className="text-xs text-ink-muted num">IBS/CBS {pct(aliquotaIBSCBS)} + tributos correntes {pct(aliquotaTributosCorrentes, 4)}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold num text-gold">{fmt.moeda(cargaTotalMensal)}/mês</p>
                <p className="text-xs text-ink-muted num">{pct(cargaTotalPercentual)} efetivo</p>
              </div>
            </div>
            <div className={`flex justify-between items-center px-4 py-3 font-semibold
              ${vantagemHolding ? 'bg-success-soft' : 'bg-danger-soft'}`}
            >
              <span className={vantagemHolding ? 'text-success' : 'text-danger'}>
                {vantagemHolding ? 'Holding economiza por mês' : 'PF economiza por mês'}
              </span>
              <span className={`num ${vantagemHolding ? 'text-success' : 'text-danger'}`}>
                {fmt.moeda(Math.abs(economiaMensalHolding))}/mês · {fmt.moeda(Math.abs(economiaMensalHolding) * 12)}/ano
              </span>
            </div>
          </div>
        </div>

        {/* Alertas uso gratuito */}
        {imoveisGratuitosComCredito.length > 0 && (
          <div className="insight-danger text-xs">
            <p className="font-semibold mb-1">Imóveis com uso gratuito tributado (LC 227/2026)</p>
            <p className="leading-relaxed">
              Adquiridos <strong>com créditos de IBS/CBS</strong> — uso gratuito pelo sócio é tributado
              (base = valor de mercado):{' '}
              {imoveisGratuitosComCredito.map(i => i.nome || 'imóvel').join(', ')}.
            </p>
          </div>
        )}

        {/* Lista de imóveis */}
        <div className="bg-surface/60 rounded-lg border border-border divide-y divide-border text-sm">
          {imoveis.map((im, i) => (
            <div key={im.id} className="flex justify-between px-4 py-2.5 text-ink">
              <span className="text-ink-secondary">
                {im.nome || `Imóvel ${i + 1}`}
                {im.destinatario === 'uso_gratuito_socio' && (
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded border
                    ${im.creditosIBSCBSNaAquisicao
                      ? 'bg-danger-soft border-danger-border text-danger'
                      : 'bg-success-soft border-success-border text-success'}`}
                  >
                    {im.creditosIBSCBSNaAquisicao ? 'uso gratuito tributado' : 'uso gratuito isento'}
                  </span>
                )}
              </span>
              <span className="num font-medium">
                {im.destinatario === 'uso_gratuito_socio' && !im.creditosIBSCBSNaAquisicao
                  ? '—'
                  : fmt.moeda(im.receitaMensalAluguel) + '/mês'}
              </span>
            </div>
          ))}
          <div className="flex justify-between px-4 py-2.5 font-bold text-gold">
            <span>Total tributável</span>
            <span className="num">{fmt.moeda(receitaTotalMensal)}/mês</span>
          </div>
        </div>

        <p className="text-ink-muted text-xs leading-relaxed">
          <strong className="text-ink-secondary">Base legal:</strong>{' '}
          Art. 261 §único LC 214/2025 (redução 70% IBS/CBS) ·
          LC 227/2026 Art. 5º (uso gratuito sem créditos não tributado) ·
          Lei 9.249/1995 (presunção LP aluguéis 32%).
          {regime === 'lucro_real' && ' LR: estimativa com margem 50% e créditos PIS/COFINS 5%.'}
        </p>
      </div>
    </div>
  )
}

// ─── CardPisCofinsVsCBS ───────────────────────────────────────────────────────

interface CardPisCofinsVsCBSProps {
  pisCofinsAtualMensal: number
  cbsIVADualMensal: number
  aliquotaPisCofins: number
  aliquotaCbsIVA: number
  creditoInsumosCBSMensal: number
  faturamentoMensal: number
  anexo?: import('../types').AnexoSimples
}

function CardPisCofinsVsCBS({
  pisCofinsAtualMensal,
  cbsIVADualMensal,
  aliquotaPisCofins,
  aliquotaCbsIVA,
  creditoInsumosCBSMensal,
  faturamentoMensal,
  anexo,
}: CardPisCofinsVsCBSProps) {
  const diferenca     = cbsIVADualMensal - pisCofinsAtualMensal
  const aumentou      = diferenca > 0
  const cbsBrutaMensal = cbsIVADualMensal + creditoInsumosCBSMensal

  return (
    <div className="card p-6 space-y-5">
      <div>
        <h3 className="section-title mb-1">
          <span className="font-display">PIS/COFINS no DAS vs CBS no IVA Dual</span>
        </h3>
        <p className="text-xs text-ink-muted leading-relaxed">
          Comparativo entre o PIS/COFINS embutido no DAS atual{anexo ? ` (Anexo ${anexo})` : ''} e a CBS estimada
          no IVA Dual pleno. A CBS é não-cumulativa — permite deduzir créditos sobre insumos.
          Proporção CBS estimada em 33,2% do IVA (8,8/26,5 pp — estimativa de mercado).
        </p>
      </div>

      {/* Três colunas comparativas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

        {/* PIS/COFINS atual */}
        <div className="rounded-xl border border-border bg-[#FBFAF7] p-4 space-y-2">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide">PIS/COFINS hoje (DAS)</div>
          <div className="text-2xl font-black text-info num">{fmt.moeda(pisCofinsAtualMensal)}</div>
          <div className="text-xs text-ink-muted num">{fmt.pct(aliquotaPisCofins)} efetivo</div>
          <div className="mt-2 rounded-md bg-info-soft border border-info-border px-3 py-2 text-xs text-info leading-relaxed">
            <strong>Cumulativo:</strong> incide sobre a receita bruta, sem direito a crédito sobre compras ou insumos
          </div>
        </div>

        {/* CBS bruta IVA Dual */}
        <div className="rounded-xl border border-border bg-[#FBFAF7] p-4 space-y-2">
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide">CBS bruta (IVA Dual)</div>
          <div className="text-2xl font-black text-ink num">{fmt.moeda(cbsBrutaMensal)}</div>
          <div className="text-xs text-ink-muted">
            antes dos créditos de insumos
          </div>
          <div className="mt-2 rounded-md bg-subtle border border-border px-3 py-2 text-xs text-ink-secondary leading-relaxed">
            <strong>Crédito de insumos:</strong>{' '}
            <span className="text-success font-medium num">− {fmt.moeda(creditoInsumosCBSMensal)}</span>
            {' '}(CBS proporcional sobre suas compras)
          </div>
        </div>

        {/* CBS líquida IVA Dual */}
        <div className={`rounded-xl border p-4 space-y-2 ${aumentou ? 'border-danger-border bg-danger-soft' : 'border-success-border bg-success-soft'}`}>
          <div className="text-xs font-semibold text-ink-muted uppercase tracking-wide">CBS líquida (IVA Dual)</div>
          <div className={`text-2xl font-black num ${aumentou ? 'text-danger' : 'text-success'}`}>{fmt.moeda(cbsIVADualMensal)}</div>
          <div className={`text-xs num ${aumentou ? 'text-danger' : 'text-success'}`}>{fmt.pct(aliquotaCbsIVA)} efetivo líquido</div>
          <div className={`mt-2 rounded-md px-3 py-2 text-xs leading-relaxed border
            ${aumentou ? 'bg-danger-soft border-danger-border text-danger' : 'bg-success-soft border-success-border text-success'}`}>
            <strong>vs. PIS/COFINS:</strong>{' '}
            {aumentou ? '+' : ''}{fmt.moeda(diferenca)}/mês
            {' '}({aumentou ? '▲' : '▼'} {faturamentoMensal > 0 ? Math.abs((diferenca / faturamentoMensal) * 100).toFixed(2) : '0,00'} pp sobre a receita)
          </div>
        </div>
      </div>

      {/* Tabela detalhada */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="table-premium w-full text-sm">
          <thead>
            <tr className="bg-subtle border-b border-border">
              <th className="text-left py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Item</th>
              <th className="text-right px-4 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">PIS/COFINS — DAS atual</th>
              <th className="text-right px-4 py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">CBS — IVA Dual</th>
              <th className="text-right py-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Diferença</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr className="hover:bg-subtle">
              <td className="py-3 text-ink-secondary">Incidência sobre a receita</td>
              <td className="px-4 py-3 text-right num text-ink">{fmt.moeda(pisCofinsAtualMensal)}</td>
              <td className="px-4 py-3 text-right num text-ink">{fmt.moeda(cbsBrutaMensal)}</td>
              <td className="py-3 text-right">
                <span className={`num text-sm font-medium ${cbsBrutaMensal - pisCofinsAtualMensal > 0 ? 'text-danger' : 'text-success'}`}>
                  {cbsBrutaMensal - pisCofinsAtualMensal > 0 ? '+' : ''}{fmt.moeda(cbsBrutaMensal - pisCofinsAtualMensal)}
                </span>
              </td>
            </tr>
            <tr className="hover:bg-subtle">
              <td className="py-3 text-ink-secondary">Crédito sobre insumos/compras</td>
              <td className="px-4 py-3 text-right num text-ink-muted">—</td>
              <td className="px-4 py-3 text-right num text-success">− {fmt.moeda(creditoInsumosCBSMensal)}</td>
              <td className="py-3 text-right num text-success text-sm font-medium">− {fmt.moeda(creditoInsumosCBSMensal)}</td>
            </tr>
            <tr className="bg-subtle font-semibold">
              <td className="py-3 text-ink">CBS / PIS+COFINS líquidos</td>
              <td className="px-4 py-3 text-right num text-ink">{fmt.moeda(pisCofinsAtualMensal)}</td>
              <td className="px-4 py-3 text-right num text-ink">{fmt.moeda(cbsIVADualMensal)}</td>
              <td className="py-3 text-right">
                <span className={`num text-sm font-bold ${aumentou ? 'text-danger' : 'text-success'}`}>
                  {aumentou ? '+' : ''}{fmt.moeda(diferenca)}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-muted leading-relaxed">
        A alíquota de CBS estimada usa a proporção de 8,8 pp dentro dos 26,5% do IVA Dual — valor de mercado, não fixado em lei.
        O crédito de insumos corresponde à CBS proporcional sobre suas compras tributadas, conforme Art. 103 LC 214/2025.
      </p>
    </div>
  )
}

// ─── CardCreditoIVA ───────────────────────────────────────────────────────────

function CardCreditoIVA({ resultados }: { resultados: ResultadoCalculo }) {
  const {
    faturamentoMensal, insumosMensais, exportacoesMensais,
    aliquotaIVABruta, impostoIVABrutoMensal, creditoInsumosMensal,
    impostoIVALiquidoMensal, perfilClientes, setor, regime,
    cbsSimplesEfetivo, anexoSimples, pctFornecedoresSimples,
  } = resultados

  // Crédito bruto sobre insumos (sem ajuste de fornecedores Simples)
  const creditoBruto = insumosMensais * aliquotaIVABruta
  // Crédito real (ajustado pelo mix de fornecedores)
  const creditoReal  = creditoInsumosMensal
  // Crédito perdido por fornecedores Simples
  const creditoPerdido = creditoBruto - creditoReal

  // Posição: credora quando créditos > débitos
  const posicaoCredora = creditoReal > impostoIVABrutoMensal
  const saldoCredor    = Math.max(0, creditoReal - impostoIVABrutoMensal)

  // CBS gerada para clientes B2B
  const cbsParaClientes = regime === 'simples_nacional' && cbsSimplesEfetivo != null
    ? faturamentoMensal * cbsSimplesEfetivo
    : impostoIVABrutoMensal  // regime pleno: crédito cheio

  // Taxa de aproveitamento de crédito
  const taxaAproveitamento = impostoIVABrutoMensal > 0
    ? Math.min(100, (creditoReal / impostoIVABrutoMensal) * 100)
    : 0

  const acumulaCredito = exportacoesMensais > 0 || setor.reducao === 1 || posicaoCredora

  return (
    <div className="card-elevated p-6 space-y-5">
      <h3 className="section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted flex-shrink-0">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
        <span className="font-display">Créditos e Débitos de IVA — Não-Cumulatividade</span>
      </h3>

      {/* T-account visual: Débitos vs Créditos */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Débito */}
        <div className="bg-[#FDECEC] border border-[#F4A9A5] rounded-xl p-4">
          <p className="text-xs text-[#B42318] font-semibold uppercase tracking-wide">Débito CBS/IBS</p>
          <p className="text-xl font-bold num text-[#B42318] mt-1">{fmt.moeda(impostoIVABrutoMensal)}</p>
          <p className="text-xs text-[#B42318] opacity-70 mt-0.5">
            {fmt.pct(aliquotaIVABruta)} × {fmt.moeda(faturamentoMensal)} faturamento
          </p>
        </div>

        {/* Crédito */}
        <div className="bg-[#E7F4ED] border border-[#A8D5BC] rounded-xl p-4">
          <p className="text-xs text-[#2F7D57] font-semibold uppercase tracking-wide">Crédito sobre Insumos</p>
          <p className="text-xl font-bold num text-[#2F7D57] mt-1">−{fmt.moeda(creditoReal)}</p>
          <p className="text-xs text-[#2F7D57] opacity-70 mt-0.5">
            {fmt.pct(aliquotaIVABruta)} × {fmt.moeda(insumosMensais)} compras
          </p>
        </div>

        {/* Saldo */}
        <div className={`rounded-xl p-4 border ${posicaoCredora
          ? 'bg-[#EFF6FF] border-[#93C5FD]'
          : 'bg-[#FBFAF7] border-[#E4DDD2]'}`}>
          <p className={`text-xs font-semibold uppercase tracking-wide ${posicaoCredora ? 'text-[#1E40AF]' : 'text-ink-muted'}`}>
            {posicaoCredora ? 'Saldo Credor' : 'IVA Líquido (a pagar)'}
          </p>
          <p className={`text-xl font-bold num mt-1 ${posicaoCredora ? 'text-[#1E40AF]' : 'text-ink'}`}>
            {posicaoCredora ? `+${fmt.moeda(saldoCredor)}` : fmt.moeda(impostoIVALiquidoMensal)}
          </p>
          <p className={`text-xs opacity-70 mt-0.5 ${posicaoCredora ? 'text-[#1E40AF]' : 'text-ink-muted'}`}>
            {posicaoCredora ? 'acumula para ressarcimento' : `${fmt.moeda(impostoIVALiquidoMensal * 12)}/ano`}
          </p>
        </div>
      </div>

      {/* Barra de aproveitamento de crédito */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-ink-secondary">
          <span>Aproveitamento de crédito sobre débitos</span>
          <span className="num font-semibold text-ink">{taxaAproveitamento.toFixed(1)}%</span>
        </div>
        <div className="h-2.5 bg-surface rounded-full overflow-hidden border border-border">
          <div
            className={`h-full rounded-full transition-all ${taxaAproveitamento >= 80 ? 'bg-success' : taxaAproveitamento >= 40 ? 'bg-warning' : 'bg-info'}`}
            style={{ width: `${Math.min(100, taxaAproveitamento)}%` }}
          />
        </div>
        <p className="text-xs text-ink-muted">
          {taxaAproveitamento >= 80
            ? 'Alto aproveitamento — empresa com muitos insumos tributados.'
            : taxaAproveitamento >= 40
            ? 'Aproveitamento médio — verifique se todos os insumos estão gerando crédito.'
            : 'Baixo aproveitamento — empresa com poucos insumos ou fornecedores no Simples.'
          }
        </p>
      </div>

      {/* Detalhes adicionais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">

        {/* CBS gerada para clientes B2B */}
        {(perfilClientes === 'b2b' || perfilClientes === 'misto') && (
          <div className="bg-subtle border border-border rounded-lg p-3 space-y-1">
            <p className="font-semibold text-ink">CBS gerada para seus clientes B2B</p>
            <p className="text-ink-secondary">
              Seus clientes no regime pleno podem creditar{' '}
              <strong className="num">
                {regime === 'simples_nacional' && cbsSimplesEfetivo != null
                  ? fmt.moeda(cbsParaClientes)
                  : fmt.moeda(cbsParaClientes)
                }
              </strong>/mês{' '}
              ({regime === 'simples_nacional' && cbsSimplesEfetivo != null
                ? `Anexo ${anexoSimples ?? '?'}: ${fmt.pct(cbsSimplesEfetivo)} × receita`
                : `${fmt.pct(aliquotaIVABruta)} × receita`
              }).
            </p>
          </div>
        )}

        {/* Crédito perdido por fornecedores Simples */}
        {pctFornecedoresSimples > 0 && creditoPerdido > 0 && (
          <div className="bg-[#FFF7ED] border border-[#F5C27C] rounded-lg p-3 space-y-1">
            <p className="font-semibold text-[#92400E]">Crédito reduzido — fornecedores Simples</p>
            <p className="text-[#92400E] opacity-80">
              {pctFornecedoresSimples}% das compras vêm do Simples → crédito menor.
              Perda: <strong className="num">{fmt.moeda(creditoPerdido)}/mês</strong>.
            </p>
          </div>
        )}

        {/* Acumulação de créditos */}
        {acumulaCredito && (
          <div className="bg-[#F0F7FF] border border-[#93C5FD] rounded-lg p-3 space-y-1">
            <p className="font-semibold text-[#1E40AF]">
              {posicaoCredora ? '⊕ Posição credora' : 'Atenção — possível acumulação de créditos'}
            </p>
            <p className="text-[#1E40AF] opacity-80 leading-relaxed">
              {exportacoesMensais > 0 && 'Exportações são imunes → crédito CBS dos insumos acumula para ressarcimento. '}
              {setor.reducao === 1 && 'Setor isento não gera débito mas pode ter crédito de insumos → solicite ressarcimento à RFB. '}
              {posicaoCredora && !exportacoesMensais && setor.reducao !== 1 && 'Créditos de insumos superam os débitos → solicite ressarcimento ou use como compensação.'}
            </p>
          </div>
        )}

        {/* Crédito vedado */}
        {setor.creditoVedadoComprador && (
          <div className="bg-[#FFF4DA] border border-[#F4C97A] rounded-lg p-3 space-y-1">
            <p className="font-semibold text-[#B7791F]">⊘ Crédito vedado ao comprador</p>
            <p className="text-[#B7791F] opacity-80">
              Seu cliente B2B não pode creditar CBS nas compras deste setor (Arts. 401/407 Dec. 12.955/2026).
              A alíquota reduzida não gera vantagem competitiva na cadeia B2B.
            </p>
          </div>
        )}
      </div>

      <p className="text-xs text-ink-muted leading-relaxed">
        A não-cumulatividade é o mecanismo central do IVA Dual: cada elo da cadeia paga CBS/IBS apenas sobre o valor que agregou.
        {' '}Créditos acumulados podem ser compensados com outros tributos federais ou ressarcidos pela RFB.
      </p>
    </div>
  )
}

// ─── CardJCP ──────────────────────────────────────────────────────────────────

function CardJCP({ faturamentoMensal }: { faturamentoMensal: number }) {
  const plEstimado = faturamentoMensal * 3  // estimativa: PL ≈ 3× receita mensal (padrão)
  const [patrimonioLiquido, setPatrimonioLiquido] = useState(plEstimado)
  const [tjlp, setTjlp] = useState(7.0)

  // JCP = PL × TJLP/12 por mês
  const jcpMensal = patrimonioLiquido * (tjlp / 100) / 12
  // Economia: IRPJ 15% + adicional estimado + CSLL 9% = 24% (conservador; pode chegar a 34% com adicional)
  const economiaMensal = jcpMensal * 0.24
  const economiaAnual  = economiaMensal * 12

  const fmt2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <div className="card-elevated p-6 space-y-5">
      <h3 className="section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted flex-shrink-0">
          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
        </svg>
        <span className="font-display">JCP — Juros sobre Capital Próprio (Lucro Real)</span>
        <span className="badge badge-success text-xs">Reduz IRPJ/CSLL</span>
      </h3>

      <div className="insight-neutral text-xs leading-relaxed">
        <strong>O que é:</strong> No Lucro Real, a empresa pode deduzir da base de IRPJ e CSLL os Juros sobre Capital Próprio —
        calculados sobre o Patrimônio Líquido à taxa TJLP. É uma das ferramentas de planejamento mais poderosas do LR e
        frequentemente ignorada por quem vem do LP.
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
            Patrimônio Líquido da empresa (R$)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={50000} max={10000000} step={50000}
              value={patrimonioLiquido}
              onChange={e => setPatrimonioLiquido(Number(e.target.value))}
              className="flex-1 accent-[var(--color-ink)]"
            />
            <span className="num text-sm font-bold text-ink w-28 text-right">
              R$ {fmt2(patrimonioLiquido)}
            </span>
          </div>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
            TJLP (% a.a.)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range" min={3} max={15} step={0.5}
              value={tjlp}
              onChange={e => setTjlp(Number(e.target.value))}
              className="flex-1 accent-[var(--color-ink)]"
            />
            <span className="num text-sm font-bold text-ink w-12 text-right">{tjlp.toFixed(1)}%</span>
          </div>
          <p className="text-xs text-ink-muted">TJLP 2026 estimada ~7% a.a. (publicada trimestralmente pelo BNDES)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-[#F0F7FF] border border-[#93C5FD] rounded-xl p-4">
          <p className="text-xs text-[#1E40AF] font-semibold uppercase tracking-wide">JCP dedutível/mês</p>
          <p className="text-xl font-bold num text-[#1E40AF] mt-1">{fmt.moeda(jcpMensal)}</p>
          <p className="text-xs text-[#1E40AF] opacity-70 mt-0.5">base de dedução mensal</p>
        </div>
        <div className="bg-[#E7F4ED] border border-[#A8D5BC] rounded-xl p-4">
          <p className="text-xs text-[#2F7D57] font-semibold uppercase tracking-wide">Economia IRPJ+CSLL/mês</p>
          <p className="text-xl font-bold num text-[#2F7D57] mt-1">{fmt.moeda(economiaMensal)}</p>
          <p className="text-xs text-[#2F7D57] opacity-70 mt-0.5">{fmt.moeda(economiaAnual)}/ano</p>
        </div>
        <div className="bg-[#FBFAF7] border border-[#E4DDD2] rounded-xl p-4">
          <p className="text-xs text-ink-muted font-semibold uppercase tracking-wide">Como usar</p>
          <p className="text-xs text-ink-secondary leading-relaxed mt-1">
            Registre a despesa de JCP na contabilidade e pague ao(s) sócio(s). O valor recebido pelo sócio tem
            retenção de 15% de IR na fonte, mas ainda costuma ser vantajoso versus pró-labore.
          </p>
        </div>
      </div>

      <p className="text-xs text-ink-muted">
        Limite: JCP ≤ variação do PL no período × TJLP, e ≤ 50% do lucro do exercício ou dos lucros acumulados. Consulte seu contador para aplicação correta.
      </p>
    </div>
  )
}

// ─── CardCreditosICMS ─────────────────────────────────────────────────────────

function CardCreditosICMS({ faturamentoMensal }: { faturamentoMensal: number }) {
  const [saldoCredor, setSaldoCredor] = useState(faturamentoMensal * 2)

  // Durante a transição (2026–2032), créditos de ICMS acumulados podem compensar CBS/IBS
  // Aproveitamento gradual proporcional ao cronograma de transição
  const cronograma = [
    { ano: 2026, pct: 0.10 }, { ano: 2027, pct: 0.20 }, { ano: 2028, pct: 0.40 },
    { ano: 2029, pct: 0.60 }, { ano: 2030, pct: 0.80 }, { ano: 2031, pct: 0.90 }, { ano: 2032, pct: 1.00 },
  ]
  const aproveitamentoTotal = saldoCredor  // pode ser usado para compensar CBS/IBS devido
  const fmt2 = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })

  return (
    <div className="card-elevated p-6 space-y-5">
      <h3 className="section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted flex-shrink-0">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
        <span className="font-display">Créditos de ICMS Acumulados — Aproveitamento na Transição</span>
        <span className="badge badge-warning text-xs">Oportunidade</span>
      </h3>

      <div className="insight-neutral text-xs leading-relaxed">
        <strong>O que é:</strong> Empresas LP e LR frequentemente acumulam saldo credor de ICMS (créditos que não conseguem usar porque vendem mais para isentos, exportam, ou têm alta carga de insumos).
        Durante a transição 2026–2032, a legislação permite compensar esses créditos históricos com CBS/IBS devido — oportunidade de caixa que pode valer milhões.
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
          Saldo credor de ICMS acumulado (R$)
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0} max={5000000} step={10000}
            value={saldoCredor}
            onChange={e => setSaldoCredor(Number(e.target.value))}
            className="flex-1 accent-[var(--color-ink)]"
          />
          <span className="num text-sm font-bold text-ink w-32 text-right">
            R$ {fmt2(saldoCredor)}
          </span>
        </div>
        <p className="text-xs text-ink-muted">Consulte a SEFAZ do seu estado para confirmar o saldo disponível</p>
      </div>

      {/* Cronograma de aproveitamento */}
      <div className="overflow-x-auto rounded-lg border border-[#E4DDD2]">
        <table className="table-premium w-full text-sm">
          <thead>
            <tr className="border-b border-[#E4DDD2]">
              <th className="text-left py-2.5 px-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Ano</th>
              <th className="text-right py-2.5 px-3 text-ink-muted font-medium text-xs uppercase tracking-wide">% Aproveitável</th>
              <th className="text-right py-2.5 px-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Valor disponível</th>
              <th className="text-right py-2.5 px-3 text-ink-muted font-medium text-xs uppercase tracking-wide">Redução CBS/IBS</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0EBE3]">
            {cronograma.map(c => {
              const disponivel = aproveitamentoTotal * c.pct
              const reducaoCBS = disponivel / 12
              return (
                <tr key={c.ano} className="hover:bg-[#FBFAF7]">
                  <td className="py-2.5 px-3 font-semibold text-ink num">{c.ano}</td>
                  <td className="py-2.5 px-3 text-right text-ink-secondary num">{(c.pct * 100).toFixed(0)}%</td>
                  <td className="py-2.5 px-3 text-right text-ink-secondary num">{fmt.moeda(disponivel)}</td>
                  <td className="py-2.5 px-3 text-right text-success font-semibold num">−{fmt.moeda(reducaoCBS)}/mês</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-ink-muted leading-relaxed">
        As regras exatas de aproveitamento ainda dependem de regulamentação estadual complementar. Converse com seu contador
        para levantar o saldo disponível e planejar o uso estratégico durante a transição.
      </p>
    </div>
  )
}

// ─── AlertaDividendos ─────────────────────────────────────────────────────────

function AlertaDividendos({ regime }: { regime: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className="card border border-warning-border bg-warning-soft p-5">
      <button
        type="button"
        onClick={() => setAberto(v => !v)}
        className="w-full flex items-center justify-between gap-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-warning flex-shrink-0">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span className="text-sm font-semibold text-ink">
            Atenção — PL 1087/2025: Tributação de Dividendos em discussão
          </span>
          <span className="badge badge-warning text-xs">Em tramitação</span>
        </div>
        <svg
          width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
          strokeWidth="2" className={`text-ink-muted flex-shrink-0 transition-transform ${aberto ? 'rotate-180' : ''}`}
        >
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      {aberto && (
        <div className="mt-4 space-y-3 text-xs text-ink-secondary leading-relaxed">
          <p>
            O PL 1087/2025 (Reforma do Imposto de Renda) propõe tributar a <strong>distribuição de lucros e dividendos</strong> com
            retenção de <strong>10% a 20% de IR na fonte</strong> para sócios/acionistas. Hoje dividendos são completamente isentos (Lei 9.249/1995, Art. 10).
          </p>
          {regime === 'lucro_presumido' && (
            <p>
              <strong>Impacto para você (LP):</strong> A principal vantagem do LP sobre o assalariado é exatamente a isenção na distribuição de lucros.
              Se aprovado, a comparação LP vs. CLT e LP vs. LR muda substancialmente — o LP pode perder atratividade dependendo dos valores distribuídos.
            </p>
          )}
          {regime === 'lucro_real' && (
            <p>
              <strong>Impacto para você (LR):</strong> O LR já tem IRPJ/CSLL sobre o lucro. Com tributação adicional nos dividendos, a carga total sobre o sócio
              pode ultrapassar 40%. O JCP (com 15% de retenção) pode se tornar o principal instrumento de remuneração do sócio.
            </p>
          )}
          {regime === 'profissional_liberal' && (
            <p>
              <strong>Impacto para você (PF):</strong> Hoje a "pejotização" permite transformar rendimento tributável (até 27,5% IRPF) em distribuição de lucros isenta.
              Com tributação de dividendos, essa vantagem é reduzida — a comparação PF vs. PJ muda.
            </p>
          )}
          <p className="text-ink-muted">
            O projeto ainda tramita no Congresso e pode ser alterado ou rejeitado. Acompanhe com seu contador antes de tomar decisões estruturais de planejamento societário.
          </p>
        </div>
      )}
    </div>
  )
}

// ─── CardSplitPayment ─────────────────────────────────────────────────────────

function CardSplitPayment({ impostoIVAMensal, impostoIVABrutoMensal, perfilClientes }: { impostoIVAMensal: number; impostoIVABrutoMensal: number; perfilClientes: PerfilClientes }) {
  const defaultPct = perfilClientes === 'b2c' ? 90 : perfilClientes === 'b2b' ? 60 : 75
  const [pctEletronico, setPctEletronico] = useState(defaultPct)
  const [cdi, setCdi] = useState(11)
  const [procedimento, setProcedimento] = useState<'padrao' | 'simplificado'>('padrao')

  // Float = prazo médio entre receber o valor e recolher o imposto na apuração mensal (~30 dias).
  // É esse intervalo que o split payment elimina (o imposto sai no recebimento, não no mês seguinte).
  const FLOAT_DIAS = 30
  // Simplificado (Art. 33): a sobra retida além do devido só retorna até 3 dias úteis APÓS a apuração.
  // Retenção média da sobra ≈ metade do mês até fechar o período (15d) + 3 dias úteis (~5 corridos).
  const DIAS_RETENCAO_SOBRA = 20

  const fracEletronico = pctEletronico / 100

  // Procedimento padrão (Art. 32 LC 214/2025): o PSP consulta o sistema CGIBS/RFB e segrega apenas
  // o débito ainda não extinto — na prática, o fluxo retido converge para o IVA líquido.
  // Procedimento simplificado (Art. 33): retém % preestabelecido sobre o valor da operação
  // (aproximado aqui pelo débito bruto destacado); a sobra volta só depois da apuração.
  const retidoLiquidoMensal = impostoIVAMensal * fracEletronico
  const retidoBrutoMensal   = impostoIVABrutoMensal * fracEletronico
  const sobraRetidaMensal   = Math.max(0, retidoBrutoMensal - retidoLiquidoMensal)

  const impostoRetidoMensal = procedimento === 'padrao' ? retidoLiquidoMensal : retidoBrutoMensal
  // Custo do float = rendimento perdido sobre o valor retido durante o intervalo em que hoje
  // a empresa segura o dinheiro (não o ano inteiro).
  const custoFloatAnual = procedimento === 'padrao'
    ? retidoLiquidoMensal * 12 * (cdi / 100) * (FLOAT_DIAS / 365)
    : retidoLiquidoMensal * 12 * (cdi / 100) * (FLOAT_DIAS / 365)
      + sobraRetidaMensal * 12 * (cdi / 100) * (DIAS_RETENCAO_SOBRA / 365)
  const custoFloatMensal = custoFloatAnual / 12

  return (
    <div className="card-elevated p-6 space-y-5">
      <h3 className="section-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-ink-muted flex-shrink-0">
          <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>
        </svg>
        <span className="font-display">Split Payment — Impacto no Fluxo de Caixa</span>
        <span className="badge badge-warning text-xs">Arts. 31–35 LC 214/2025</span>
      </h3>

      <div className="insight-neutral text-xs leading-relaxed">
        <strong>O que é:</strong> No IVA Dual, o prestador de serviço de pagamento (PIX, cartão) segrega e recolhe o IBS/CBS
        na liquidação financeira, antes de o valor entrar na sua conta (Art. 31). Hoje você recebe o valor cheio e paga o
        imposto na apuração do mês seguinte — segurando o dinheiro por ~{FLOAT_DIAS} dias. Com o split esse "float" desaparece.
      </div>

      {/* Procedimento */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Procedimento de segregação</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setProcedimento('padrao')}
            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors flex-1 text-left
              ${procedimento === 'padrao' ? 'bg-info-soft border-info-border text-info' : 'bg-surface border-border text-ink-muted hover:text-ink'}`}
          >
            <span className="font-bold block">Padrão (Art. 32)</span>
            Consulta em tempo real — retém só o débito ainda não extinto (≈ IVA líquido)
          </button>
          <button
            type="button"
            onClick={() => setProcedimento('simplificado')}
            className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors flex-1 text-left
              ${procedimento === 'simplificado' ? 'bg-warning-soft border-warning-border text-warning' : 'bg-surface border-border text-ink-muted hover:text-ink'}`}
          >
            <span className="font-bold block">Simplificado (Art. 33)</span>
            Retém % fixo sobre a operação (≈ débito bruto); sobra devolvida até 3 dias úteis após a apuração
          </button>
        </div>
      </div>

      {/* Controles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
            % de recebimentos via PIX / cartão
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range" min={0} max={100} step={5}
              value={pctEletronico}
              onChange={e => setPctEletronico(Number(e.target.value))}
              className="flex-1 accent-[var(--color-ink)]"
            />
            <span className="num text-sm font-bold text-ink w-10 text-right">{pctEletronico}%</span>
          </div>
          <p className="text-xs text-ink-muted">Dinheiro em espécie não passa pelo split; no B2B, o adquirente pode recolher direto (Art. 36)</p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
            Taxa de capital de giro (% a.a.)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range" min={5} max={25} step={0.5}
              value={cdi}
              onChange={e => setCdi(Number(e.target.value))}
              className="flex-1 accent-[var(--color-ink)]"
            />
            <span className="num text-sm font-bold text-ink w-12 text-right">{cdi.toFixed(1)}%</span>
          </div>
          <p className="text-xs text-ink-muted">CDI atual ~{cdi.toFixed(1)}% — custo do dinheiro no tempo</p>
        </div>
      </div>

      {/* Resultado */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-[#FFF7ED] border border-[#F5C27C] rounded-xl p-4">
          <p className="text-xs text-[#92400E] font-semibold uppercase tracking-wide">Retido na liquidação/mês</p>
          <p className="text-xl font-bold num text-[#92400E] mt-1">
            {fmt.moeda(impostoRetidoMensal)}<span className="text-xs font-normal">/mês</span>
          </p>
          <p className="text-xs text-[#92400E] opacity-70 mt-0.5">
            {procedimento === 'padrao'
              ? `${pctEletronico}% do IVA líquido mensal`
              : <>{pctEletronico}% do débito bruto · sobra de {fmt.moeda(sobraRetidaMensal)} devolvida após a apuração</>}
          </p>
        </div>
        <div className="bg-[#FDECEC] border border-[#F4A9A5] rounded-xl p-4">
          <p className="text-xs text-[#B42318] font-semibold uppercase tracking-wide">Custo do float — anual</p>
          <p className="text-xl font-bold num text-[#B42318] mt-1">
            {fmt.moeda(custoFloatAnual)}<span className="text-xs font-normal">/ano</span>
          </p>
          <p className="text-xs text-[#B42318] opacity-70 mt-0.5">
            {fmt.moeda(custoFloatMensal)}/mês · rendimento perdido sobre o período retido
          </p>
        </div>
      </div>

      <div className="insight-warning text-xs leading-relaxed">
        <strong>Atenção (Art. 34):</strong> vendas parceladas têm segregação proporcional em cada parcela, e a{' '}
        <strong>antecipação de recebíveis não afasta a retenção</strong> — o imposto é segregado na liquidação de cada
        parcela mesmo com o recebível antecipado. Quem antecipa cartão hoje sentirá o impacto no valor líquido antecipável.
      </div>

      <p className="text-xs text-ink-muted leading-relaxed">
        Implementação gradual a partir de <strong>2027</strong>, junto com o regime efetivo do IBS/CBS, conforme ato conjunto
        CGIBS/RFB (Art. 35 §2º LC 214/2025) — obrigatório primeiro nas vendas a consumidor final pelos principais meios de
        pagamento do varejo. Excedentes retidos são devolvidos em até 3 dias úteis (Arts. 32 §4º e 33 §4º).
        Verifique com seu contador o cronograma para o seu banco/adquirente.
      </p>
    </div>
  )
}

// ─── TabelaRow ────────────────────────────────────────────────────────────────

interface TabelaRowProps {
  label: string
  atual: number
  nova: number
  isPct?: boolean
  credito?: boolean
  neutro?: boolean
  destaque?: boolean
}

function TabelaRow({ label, atual, nova, isPct = false, credito = false, neutro = false, destaque = false }: TabelaRowProps) {
  const diff = nova - atual
  const fmt_val = (v: number) => isPct ? fmt.pct(v) : fmt.moeda(v)

  return (
    <tr className={`${destaque ? 'font-semibold bg-subtle' : 'hover:bg-subtle'} transition-colors`}>
      <td className="py-3 text-ink-secondary text-sm">{label}</td>
      <td className="py-3 text-right text-ink-secondary text-sm num">{fmt_val(atual)}</td>
      <td className={`py-3 text-right text-sm num ${
        credito ? 'text-success' :
        neutro ? 'text-ink-secondary' :
        destaque && diff > 0 ? 'text-danger' :
        destaque && diff < 0 ? 'text-success' :
        'text-ink-secondary'
      }`}>
        {credito && nova < 0 ? `−${fmt.moeda(Math.abs(nova))}` : fmt_val(nova)}
      </td>
      <td className="py-3 text-right text-sm">
        {neutro || isPct ? (
          <span className="text-ink-muted opacity-40 text-xs">—</span>
        ) : (
          <span className={`text-xs font-medium num ${
            Math.abs(diff) < 0.01 ? 'text-ink-muted opacity-40' :
            diff > 0 ? 'text-danger' : 'text-success'
          }`}>
            {Math.abs(diff) < 0.01 ? '—' : `${diff > 0 ? '+' : ''}${fmt.moeda(diff)}`}
          </span>
        )}
      </td>
    </tr>
  )
}
