import { fmt, labelTerceiros } from '../engine/calculadora'
import type { ResultadoCalculo } from '../types'

/**
 * Memória de Cálculo — auditoria linha a linha de como o sistema chegou a cada valor.
 * Pensada para o contador conferir e apresentar ao cliente. Todos os números vêm dos
 * campos já calculados em ResultadoCalculo, garantindo consistência com o restante da tela.
 */

interface MemoriaCalculoProps {
  resultados: ResultadoCalculo
}

// ─── Blocos e linhas ─────────────────────────────────────────────────────────

function Bloco({ numero, titulo, base, children }: { numero: number; titulo: string; base?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-white overflow-hidden">
      <div className="flex items-center gap-3 px-5 py-3 bg-subtle border-b border-border">
        <span className="badge badge-neutral w-6 h-6 flex items-center justify-center text-xs font-bold flex-shrink-0">{numero}</span>
        <h4 className="text-sm font-semibold text-ink flex-1">{titulo}</h4>
        {base && <span className="text-[10px] text-ink-muted font-medium text-right">{base}</span>}
      </div>
      <div className="divide-y divide-border">{children}</div>
    </div>
  )
}

function Linha({ label, formula, valor, refLegal, destaque, negativo }: {
  label: string
  formula?: React.ReactNode
  valor: number | string
  refLegal?: string
  destaque?: boolean
  negativo?: boolean
}) {
  return (
    <div className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-2.5 ${destaque ? 'bg-[#FBFAF7]' : ''}`}>
      <div className="flex-1 min-w-[140px]">
        <div className={`text-sm ${destaque ? 'font-bold text-ink' : 'text-ink-secondary'}`}>{label}</div>
        {refLegal && <div className="text-[10px] text-ink-muted mt-0.5">{refLegal}</div>}
      </div>
      {formula != null && (
        <div className="text-xs text-ink-muted num font-mono flex-1 min-w-[180px] text-right sm:text-left">{formula}</div>
      )}
      <div className={`num text-right w-28 flex-shrink-0 ${destaque ? 'font-bold text-base' : 'text-sm'} ${negativo ? 'text-success' : 'text-ink'}`}>
        {typeof valor === 'number' ? `${negativo ? '−' : ''}${fmt.moeda(Math.abs(valor))}` : valor}
      </div>
    </div>
  )
}

// ─── Componente principal ────────────────────────────────────────────────────

export default function MemoriaCalculo({ resultados }: MemoriaCalculoProps) {
  const {
    regime, setor, faturamentoMensal, insumosMensais, exportacoesMensais,
    aliquotaAtual, impostoAtualMensal,
    apuracaoLucroPresumido: aLP, apuracaoLucroReal: aLR,
    aliquotaIVABruta, baseCalculoEfetiva, impostoIVABrutoMensal, creditoInsumosMensal,
    impostoIVALiquidoMensal, irpjCsllPersistenteMensal, contribPrevidenciariaMensal,
    inssPatronalFolhaMensal, terceirosFolhaMensal, cppProLaboreMensal,
    cargaTotalReformaMensal, variacaoAbsolutaMensal,
    cbsSimplesEfetivo, ibsSimplesEfetivo, anexoSimples, nomePrincipal, perfilClientes,
    creditoProdutorRural, creditoTranspAutonomo, creditoCapitalImediato, creditoDespesasAdicionais,
    creditoRegimeAutomotivo, creditoZFMIbs, creditoZFMCbs,
    ivaZeradoVendasRural, ivaZeradoVendasTransp, produtorRuralNaoContribuinte,
    gorjetaMensal, pctFornecedoresSimples, inssAutonomoMensal,
    alertaMEI, analiseProlabore, analiseFatorR, analiseGrupoSimples, analiseHolding,
    cenarioHibridoVerdadeiro,
  } = resultados

  const NOMES_REGIME: Record<string, string> = {
    simples_nacional: 'Simples Nacional', lucro_presumido: 'Lucro Presumido', lucro_real: 'Lucro Real',
    mei: 'MEI', profissional_liberal: 'Profissional Liberal', produtor_rural: 'Produtor Rural',
  }
  const ehLPouLR = regime === 'lucro_presumido' || regime === 'lucro_real'
  const folhaMensal = inssPatronalFolhaMensal / 0.20     // deriva a folha usada (CPP = 20% × folha)
  const proLaboreMensal = cppProLaboreMensal / 0.20
  const pct = (v: number) => fmt.pct(v)
  const moeda = (v: number) => fmt.moeda(v)
  const hoje = new Date().toLocaleDateString('pt-BR')

  // ── Bloco: carga tributária atual (específico por regime) ──────────────────
  const blocoCargaAtual = (n: number) => {
    if (regime === 'lucro_presumido' && aLP) return (
      <Bloco key="ca" numero={n} titulo="Carga tributária atual — Lucro Presumido" base="RIR/2018 · Lei 9.249/1995 · Lei 9.718/1998">
        <Linha label="Base presumida (IRPJ)" formula={`${moeda(faturamentoMensal)} × ${pct(aLP.lucroPresumidoBase / faturamentoMensal)}`} valor={aLP.lucroPresumidoBase} refLegal="Presunção conforme atividade (Art. 15 Lei 9.249/1995)" />
        <Linha label="IRPJ" formula={`${moeda(aLP.lucroPresumidoBase)} × 15%`} valor={aLP.irpj} />
        <Linha label="IRPJ adicional" formula={aLP.irpjAdicional > 0 ? `(${moeda(aLP.lucroPresumidoBase)} − ${moeda(20000)}) × 10%` : 'base ≤ R$ 20.000/mês — não incide'} valor={aLP.irpjAdicional} refLegal="Art. 3º §1º Lei 9.249/1995" />
        <Linha label="CSLL" formula={`${moeda(aLP.csll / 0.09)} × 9%`} valor={aLP.csll} />
        <Linha label="PIS/COFINS cumulativo" formula={`${moeda(faturamentoMensal)} × 3,65%`} valor={aLP.pisCofins} refLegal="PIS 0,65% + COFINS 3% (Lei 9.718/1998)" />
        {aLP.icms > 0 && <Linha label="ICMS" formula={`${moeda(faturamentoMensal)} × ${pct(aLP.icms / faturamentoMensal)}`} valor={aLP.icms} refLegal={aLP.icmsIssInformado ? 'Alíquota efetiva informada' : 'Média nacional 12%'} />}
        {aLP.iss > 0 && <Linha label="ISS" formula={`${moeda(faturamentoMensal)} × ${pct(aLP.iss / faturamentoMensal)}`} valor={aLP.iss} refLegal={aLP.icmsIssInformado ? 'Alíquota efetiva informada' : 'Média nacional 3%'} />}
        {aLP.ipi > 0 && <Linha label="IPI" formula={`${moeda(faturamentoMensal)} × 5%`} valor={aLP.ipi} refLegal="Média indústria" />}
        {aLP.inssPatronal > 0 && <Linha label="CPP patronal (folha)" formula={`${moeda(folhaMensal)} × 20%`} valor={aLP.inssPatronal} refLegal="Art. 22 I Lei 8.212/1991" />}
        {aLP.terceiros > 0 && <Linha label="Terceiros (Sistema S)" formula={`${moeda(folhaMensal)} × 5,8%`} valor={aLP.terceiros} refLegal={labelTerceiros(setor.tipo)} />}
        {aLP.cppProLabore > 0 && <Linha label="CPP sobre pró-labore" formula={`${moeda(proLaboreMensal)} × 20%`} valor={aLP.cppProLabore} refLegal="Contribuinte individual — Art. 22 III Lei 8.212/1991" />}
        <Linha label="Carga total mensal (hoje)" valor={aLP.totalImpostos} destaque />
        <Linha label="Alíquota efetiva sobre a receita" formula={`${moeda(aLP.totalImpostos)} ÷ ${moeda(faturamentoMensal)}`} valor={pct(aLP.totalImpostos / faturamentoMensal)} />
      </Bloco>
    )
    if (regime === 'lucro_real' && aLR) return (
      <Bloco key="ca" numero={n} titulo="Carga tributária atual — Lucro Real" base="RIR/2018 · Leis 10.637/2002 e 10.833/2003">
        <Linha label="Receita bruta" valor={faturamentoMensal} />
        <Linha label="(−) CMV / insumos" valor={insumosMensais} negativo />
        {aLR.folhaPagamento > 0 && <Linha label="(−) Folha de pagamento" valor={aLR.folhaPagamento} negativo />}
        {aLR.inssPatronal > 0 && <Linha label="(−) CPP patronal (20%)" valor={aLR.inssPatronal} negativo />}
        {aLR.terceiros > 0 && <Linha label="(−) Terceiros (5,8%)" valor={aLR.terceiros} negativo refLegal={labelTerceiros(setor.tipo)} />}
        {aLR.proLabore > 0 && <Linha label="(−) Pró-labore dos sócios" valor={aLR.proLabore} negativo />}
        {aLR.cppProLabore > 0 && <Linha label="(−) CPP pró-labore (20%)" valor={aLR.cppProLabore} negativo />}
        {aLR.despesasOperacionais > 0 && <Linha label="(−) Despesas operacionais" valor={aLR.despesasOperacionais} negativo />}
        {aLR.icmsLiquido > 0 && <Linha label="(−) ICMS" valor={aLR.icmsLiquido} negativo />}
        {aLR.issLiquido > 0 && <Linha label="(−) ISS" valor={aLR.issLiquido} negativo />}
        <Linha label="(−) PIS/COFINS não-cumulativo (9,25%)" formula={`(${moeda(faturamentoMensal)} − ${moeda(insumosMensais)}) × 9,25%`} valor={aLR.pisCofinsLiquido} negativo refLegal="PIS 1,65% + COFINS 7,6% com créditos" />
        <Linha label="= Lucro Real (base IRPJ/CSLL)" valor={aLR.lucroRealBase} destaque />
        <Linha label="IRPJ (15%)" formula={`${moeda(aLR.lucroRealBase)} × 15%`} valor={aLR.irpj} />
        <Linha label="IRPJ adicional" formula={aLR.irpjAdicional > 0 ? `(${moeda(aLR.lucroRealBase)} − ${moeda(20000)}) × 10%` : 'base ≤ R$ 20.000/mês — não incide'} valor={aLR.irpjAdicional} />
        <Linha label="CSLL (9%)" formula={`${moeda(aLR.lucroRealBase)} × 9%`} valor={aLR.csll} />
        <Linha label="Carga total mensal (hoje)" formula="IRPJ + CSLL + PIS/COFINS + ICMS + ISS + previdenciária" valor={aLR.totalImpostos} destaque />
        <Linha label="Alíquota efetiva sobre a receita" formula={`${moeda(aLR.totalImpostos)} ÷ ${moeda(faturamentoMensal)}`} valor={pct(aLR.totalImpostos / faturamentoMensal)} />
      </Bloco>
    )
    if (regime === 'simples_nacional') return (
      <Bloco key="ca" numero={n} titulo="Carga tributária atual — Simples Nacional" base={`DAS unificado${anexoSimples ? ` · Anexo ${anexoSimples}` : ''} · LC 123/2006`}>
        <Linha label="DAS mensal" formula={`${moeda(faturamentoMensal)} × ${pct(aliquotaAtual)}`} valor={impostoAtualMensal} refLegal="Alíquota efetiva da faixa de faturamento" />
        {cbsSimplesEfetivo != null && cbsSimplesEfetivo > 0 && <Linha label="├ CBS embutida no DAS" formula={`${moeda(faturamentoMensal)} × ${pct(cbsSimplesEfetivo)}`} valor={faturamentoMensal * cbsSimplesEfetivo} />}
        {ibsSimplesEfetivo != null && ibsSimplesEfetivo > 0 && <Linha label="├ IBS embutido no DAS" formula={`${moeda(faturamentoMensal)} × ${pct(ibsSimplesEfetivo)}`} valor={faturamentoMensal * ibsSimplesEfetivo} />}
        {cbsSimplesEfetivo != null && ibsSimplesEfetivo != null && (
          <Linha label="└ IRPJ + CSLL + CPP (demais tributos)" formula={`${pct(Math.max(0, aliquotaAtual - cbsSimplesEfetivo - ibsSimplesEfetivo))} da receita`} valor={faturamentoMensal * Math.max(0, aliquotaAtual - cbsSimplesEfetivo - ibsSimplesEfetivo)} />
        )}
        <Linha label="Carga total mensal (hoje)" valor={impostoAtualMensal} destaque />
      </Bloco>
    )
    if (regime === 'mei') return (
      <Bloco key="ca" numero={n} titulo="Carga tributária atual — MEI" base="Valor fixo mensal · LC 123/2006 Art. 18-A">
        <Linha label="DAS fixo mensal" formula="valor fixo por atividade — independe do faturamento" valor={impostoAtualMensal} refLegal="INSS + ICMS (comércio) ou ISS (serviços)" destaque />
        {alertaMEI && <Linha label="Limite anual do MEI" formula={`${pct(Math.min(1, alertaMEI.limitePercentual / 100))} utilizado`} valor={alertaMEI.limiteAnual} refLegal={alertaMEI.acimaDaFaixa ? 'ACIMA do limite — desenquadramento' : 'dentro do limite'} />}
      </Bloco>
    )
    if (regime === 'profissional_liberal') {
      const issPF = faturamentoMensal * 0.03
      const irpfPF = Math.max(0, impostoAtualMensal - issPF - inssAutonomoMensal)
      return (
        <Bloco key="ca" numero={n} titulo="Carga tributária atual — Profissional Liberal (PF)" base="Carnê-Leão + ISS + INSS">
          <Linha label="IRPF (tabela progressiva)" formula="carnê-leão mensal sobre o rendimento" valor={irpfPF} refLegal="Tabela progressiva 2025 + Lei 15.270/2025" />
          <Linha label="ISS" formula={`${moeda(faturamentoMensal)} × 3%`} valor={issPF} refLegal="Alíquota municipal média" />
          <Linha label="INSS (contribuinte individual)" formula="20% até o teto do RGPS" valor={inssAutonomoMensal} refLegal="Art. 21 Lei 8.212/1991" />
          <Linha label="Carga total mensal (hoje)" valor={impostoAtualMensal} destaque />
        </Bloco>
      )
    }
    // produtor_rural (base Lucro Presumido)
    return (
      <Bloco key="ca" numero={n} titulo="Carga tributária atual — Produtor Rural (PJ)" base="Base Lucro Presumido · Arts. 164-168 LC 214/2025">
        <Linha label="Carga IRPJ/CSLL/PIS-COFINS (presunção do setor)" formula={`${moeda(faturamentoMensal)} × ${pct(aliquotaAtual)}`} valor={impostoAtualMensal} destaque />
        {produtorRuralNaoContribuinte && <Linha label="IBS/CBS na reforma" formula="não-contribuinte (receita < R$ 3,6M/ano)" valor="R$ 0 (isento)" refLegal="Art. 164 §1º LC 214/2025" />}
      </Bloco>
    )
  }

  // ── Bloco: apuração do IVA Dual (reconcilia com o líquido exibido) ─────────
  const baseReduzida = baseCalculoEfetiva < faturamentoMensal - 0.5
  const redutorSetor = Math.max(0, faturamentoMensal - gorjetaMensal - baseCalculoEfetiva)
  const aliqCreditoEfetiva = insumosMensais > 0 ? creditoInsumosMensal / insumosMensais : aliquotaIVABruta
  const blocoIVA = (n: number) => (
    <Bloco key="iva" numero={n} titulo="Apuração do IVA Dual (CBS + IBS)" base="Não-cumulatividade — Arts. 47-56 LC 214/2025">
      {baseReduzida && <Linha label="Faturamento (base inicial)" valor={faturamentoMensal} />}
      {gorjetaMensal > 0 && <Linha label="(−) Gorjeta excluída da base" valor={gorjetaMensal} negativo refLegal="Art. 274 §único I LC 214/2025" />}
      {redutorSetor > 0.5 && <Linha label="(−) Redutor de base do setor" valor={redutorSetor} negativo refLegal="Redutor de ajuste/social ou repasse (imóveis, agências)" />}
      {baseReduzida && <Linha label="Base de cálculo efetiva" valor={baseCalculoEfetiva} destaque />}
      <Linha label="IBS/CBS sobre a base" formula={`${moeda(baseCalculoEfetiva)} × ${pct(aliquotaIVABruta)}`} valor={baseCalculoEfetiva * aliquotaIVABruta} />
      {ivaZeradoVendasRural > 0 && <Linha label="(−) Vendas a produtor rural (alíq. zero)" valor={ivaZeradoVendasRural} negativo refLegal="Art. 110 LC 214/2025" />}
      {ivaZeradoVendasTransp > 0 && <Linha label="(−) Vendas a transportador autônomo (alíq. zero)" valor={ivaZeradoVendasTransp} negativo refLegal="Art. 110 LC 214/2025" />}
      <Linha label="= IBS/CBS bruto (débito)" valor={impostoIVABrutoMensal} destaque />
      <Linha
        label="(−) Crédito sobre insumos"
        formula={`${moeda(insumosMensais)} × ${pct(aliqCreditoEfetiva)}`}
        valor={creditoInsumosMensal}
        negativo
        refLegal={pctFornecedoresSimples > 0 ? `Crédito reduzido — ${pctFornecedoresSimples}% das compras de fornecedores no Simples` : 'Crédito amplo — Art. 47 LC 214/2025'}
      />
      {creditoProdutorRural > 0 && <Linha label="(−) Crédito presumido — produtor rural" valor={creditoProdutorRural} negativo refLegal="Art. 168 LC 214/2025" />}
      {creditoTranspAutonomo > 0 && <Linha label="(−) Crédito presumido — transportador autônomo" valor={creditoTranspAutonomo} negativo refLegal="Art. 169 LC 214/2025" />}
      {creditoCapitalImediato > 0 && <Linha label="(−) Crédito de bens de capital (imediato)" valor={creditoCapitalImediato} negativo refLegal="Art. 108 LC 214/2025" />}
      {creditoDespesasAdicionais > 0 && <Linha label="(−) Crédito de despesas (não-cumulatividade ampla)" valor={creditoDespesasAdicionais} negativo refLegal="aluguel, energia, seguros, marketing, TI…" />}
      {creditoRegimeAutomotivo > 0 && <Linha label="(−) Crédito presumido — regime automotivo" valor={creditoRegimeAutomotivo} negativo refLegal="Arts. 309-316 LC 214/2025" />}
      {creditoZFMIbs > 0 && <Linha label="(−) Crédito presumido ZFM (IBS)" valor={creditoZFMIbs} negativo refLegal="Art. 450 LC 214/2025" />}
      {creditoZFMCbs > 0 && <Linha label="(−) Crédito presumido ZFM (CBS)" valor={creditoZFMCbs} negativo refLegal="Art. 450 §2º II LC 214/2025" />}
      {produtorRuralNaoContribuinte
        ? <Linha label="= IBS/CBS líquido (não-contribuinte)" formula="produtor rural não-contribuinte não recolhe" valor={impostoIVALiquidoMensal} destaque />
        : <Linha label="= IBS/CBS líquido a recolher" valor={impostoIVALiquidoMensal} destaque />}
    </Bloco>
  )

  // ── Blocos condicionais montados na ordem de exibição ──────────────────────
  const blocos: Array<(n: number) => React.ReactNode> = []
  blocos.push(blocoCargaAtual)
  blocos.push(blocoIVA)

  if (ehLPouLR) blocos.push(n => (
    <Bloco key="pos" numero={n} titulo="Carga total pós-reforma (2033)" base="Tributos que não são substituídos pelo IVA Dual">
      <Linha label="IBS/CBS líquido" valor={impostoIVALiquidoMensal} />
      <Linha label="(+) IRPJ + CSLL" formula="sobre o lucro pós-reforma (sem dedução de ICMS/ISS/PIS-COFINS)" valor={irpjCsllPersistenteMensal} refLegal="IR/CSLL não são substituídos pela reforma" />
      {contribPrevidenciariaMensal > 0 && (
        <Linha label="(+) Contribuição previdenciária" formula={`CPP ${moeda(inssPatronalFolhaMensal)} + terceiros ${moeda(terceirosFolhaMensal)}${cppProLaboreMensal > 0 ? ` + pró-labore ${moeda(cppProLaboreMensal)}` : ''}`} valor={contribPrevidenciariaMensal} />
      )}
      <Linha label="= Carga total pós-reforma" valor={cargaTotalReformaMensal} destaque />
      <Linha label="Alíquota efetiva total" formula={`${moeda(cargaTotalReformaMensal)} ÷ ${moeda(faturamentoMensal)}`} valor={pct(cargaTotalReformaMensal / faturamentoMensal)} />
    </Bloco>
  ))

  if (cenarioHibridoVerdadeiro) blocos.push(n => (
    <Bloco key="hib" numero={n} titulo="Cenário Simples Híbrido — CBS/IBS por fora" base="Arts. 412-416 LC 214/2025">
      <Linha label="DAS reduzido (só IRPJ+CSLL+CPP)" formula={`${moeda(faturamentoMensal)} × ${pct(cenarioHibridoVerdadeiro.aliquotaDasReduzido)}`} valor={cenarioHibridoVerdadeiro.dasReduzidoMensal} />
      <Linha label="CBS/IBS bruto por fora" valor={cenarioHibridoVerdadeiro.ibsCBSBrutoMensal} />
      <Linha label="(−) Crédito de insumos" valor={cenarioHibridoVerdadeiro.creditoMensal} negativo />
      <Linha label="CBS/IBS líquido" valor={cenarioHibridoVerdadeiro.ibsCBSLiquidoMensal} />
      <Linha label="= Total no regime híbrido" valor={cenarioHibridoVerdadeiro.totalMensal} destaque />
      <Linha label="Custo adicional vs Simples Pleno" formula={`${moeda(cenarioHibridoVerdadeiro.totalMensal)} − ${moeda(impostoAtualMensal)}`} valor={`${cenarioHibridoVerdadeiro.custoAdicionalVsSimples > 0 ? '+' : ''}${moeda(cenarioHibridoVerdadeiro.custoAdicionalVsSimples)}`} />
    </Bloco>
  ))

  if (analiseFatorR) blocos.push(n => (
    <Bloco key="fr" numero={n} titulo="Fator R — enquadramento no Simples (serviços)" base="LC 123/2006 Art. 18 §5-J">
      <Linha label="Fator R (folha ÷ faturamento)" formula={`${moeda(analiseFatorR.folhaMensal)} ÷ ${moeda(analiseFatorR.faturamentoMensal)}`} valor={pct(analiseFatorR.fatorR)} refLegal={analiseFatorR.fatorR >= 0.28 ? '≥ 28% → Anexo III' : '< 28% → Anexo V'} />
      <Linha label="Anexo aplicável" valor={`Anexo ${analiseFatorR.anexo}`} />
      <Linha label="Alíquota Anexo III" valor={pct(analiseFatorR.aliquotaAnexoIII)} />
      <Linha label="Alíquota Anexo V" valor={pct(analiseFatorR.aliquotaAnexoV)} />
      <Linha label="Diferença mensal (V − III)" formula="positivo = Anexo III é mais vantajoso" valor={analiseFatorR.diferencaMensal} destaque />
    </Bloco>
  ))

  if (analiseProlabore && analiseProlabore.totalProlabore > 0) blocos.push(n => (
    <Bloco key="pl" numero={n} titulo="Pró-labore dos sócios — custo total" base="IRPF + INSS por sócio">
      {analiseProlabore.detalhes.map((d, i) => (
        <Linha key={i} label={d.socio.nome || `Sócio ${i + 1}`} formula={`pró-labore ${moeda(d.socio.prolaboreMensal)} · IRPF ${moeda(d.irpfMensal)} + INSS ${moeda(d.inssEmpregado)}`} valor={d.custoTotal} />
      ))}
      <Linha label="INSS patronal (empresa, 20%)" valor={analiseProlabore.totalInssPatronal} />
      {analiseProlabore.beneficioFiscalEmpresa > 0 && <Linha label="(−) Economia IRPJ/CSLL (dedutível no LR)" valor={analiseProlabore.beneficioFiscalEmpresa} negativo refLegal="24% sobre o pró-labore" />}
      <Linha label="Custo líquido do pró-labore" valor={analiseProlabore.custoLiquido} destaque />
    </Bloco>
  ))

  if (analiseGrupoSimples) blocos.push(n => (
    <Bloco key="gr" numero={n} titulo="Grupo societário — limite do Simples" base="LC 123/2006 Art. 3º §4º">
      <Linha label="Faturamento anual (esta empresa)" valor={analiseGrupoSimples.faturamentoAnualPrincipal} />
      <Linha label="Faturamento anual (sócios >10%)" valor={analiseGrupoSimples.faturamentoAnualGrupo} />
      <Linha label="Total do grupo" valor={analiseGrupoSimples.faturamentoAnualTotal} destaque />
      <Linha label="Limite do Simples Nacional" formula={`${pct(Math.min(2, analiseGrupoSimples.percentualUtilizado / 100))} utilizado`} valor={analiseGrupoSimples.limiteAnual} refLegal={analiseGrupoSimples.dentroDoLimite ? 'dentro do limite' : 'ACIMA — desenquadra o grupo'} />
    </Bloco>
  ))

  if (analiseHolding && analiseHolding.receitaTotalMensal > 0) blocos.push(n => (
    <Bloco key="hd" numero={n} titulo="Holding patrimonial" base="Redução 70% IBS/CBS · Art. 261 §único LC 214/2025">
      <Linha label="Receita tributável mensal" valor={analiseHolding.receitaTotalMensal} />
      <Linha label={`IBS/CBS (${pct(analiseHolding.aliquotaIBSCBS)})`} formula={`${moeda(analiseHolding.baseIBSCBSMensal)} × ${pct(analiseHolding.aliquotaIBSCBS)}`} valor={analiseHolding.ibsCBSMensal} refLegal="26,5% × 30% = 7,95%" />
      <Linha label={`Tributos correntes (${pct(analiseHolding.aliquotaTributosCorrentes)})`} valor={analiseHolding.tributosCorrMensal} />
      <Linha label="Carga total na holding" valor={analiseHolding.cargaTotalMensal} destaque />
      <Linha label="Comparação: mesma renda como PF" formula="IRPF carnê-leão" valor={analiseHolding.cargaPFMensal} />
    </Bloco>
  ))

  const cargaPosReforma = ehLPouLR ? cargaTotalReformaMensal : impostoIVALiquidoMensal
  blocos.push(n => (
    <Bloco key="comp" numero={n} titulo="Comparativo — hoje vs pós-reforma">
      <Linha label="Carga hoje" valor={impostoAtualMensal} />
      <Linha label="Carga pós-reforma" valor={cargaPosReforma} />
      <Linha
        label={variacaoAbsolutaMensal > 0 ? 'Aumento de carga' : variacaoAbsolutaMensal < 0 ? 'Redução de carga' : 'Carga neutra'}
        formula={`${moeda(cargaPosReforma)} − ${moeda(impostoAtualMensal)}`}
        valor={`${variacaoAbsolutaMensal > 0 ? '+' : variacaoAbsolutaMensal < 0 ? '−' : ''}${moeda(Math.abs(variacaoAbsolutaMensal))}/mês`}
        destaque
      />
      <Linha label="Impacto anual" valor={`${variacaoAbsolutaMensal > 0 ? '+' : variacaoAbsolutaMensal < 0 ? '−' : ''}${moeda(Math.abs(variacaoAbsolutaMensal) * 12)}/ano`} />
    </Bloco>
  ))

  return (
    <div className="space-y-5 memoria-print-root">
      {/* Cabeçalho de impressão — só aparece no PDF/impressão */}
      <div className="only-print mb-4">
        <div className="flex items-baseline justify-between border-b border-border pb-2">
          <div>
            <div className="text-lg font-bold text-ink">Memória de Cálculo</div>
            {nomePrincipal && <div className="text-sm text-ink-secondary">{nomePrincipal}</div>}
          </div>
          <div className="text-xs text-ink-muted text-right leading-relaxed">
            {NOMES_REGIME[regime]} · {setor.label.split('(')[0].trim()}<br />
            Faturamento {moeda(faturamentoMensal)}/mês · {perfilClientes.toUpperCase()}<br />
            Emitido em {hoje}
          </div>
        </div>
      </div>

      {/* ── Bloco 1 — Premissas ─────────────────────────────────────────── */}
      <Bloco numero={1} titulo="Premissas (dados informados)">
        <Linha label="Faturamento mensal" valor={faturamentoMensal} />
        <Linha label="Compras / insumos mensais" valor={insumosMensais} />
        {exportacoesMensais > 0 && <Linha label="Exportações mensais" valor={exportacoesMensais} refLegal="Isentas de IBS/CBS — Art. 79 LC 214/2025" />}
        {folhaMensal > 0 && <Linha label="Folha de pagamento (empregados)" valor={folhaMensal} />}
        {proLaboreMensal > 0 && <Linha label="Pró-labore dos sócios" valor={proLaboreMensal} />}
        <Linha label="Setor de atuação" formula={setor.tipo} valor={setor.label.split('(')[0].trim()} />
        <Linha
          label="Alíquota de referência IVA Dual (CBS + IBS)"
          formula={setor.reducao > 0 ? `26,5% × (1 − ${pct(setor.reducao)} redução)` : '26,5% (alíquota cheia)'}
          valor={pct(aliquotaIVABruta)}
          refLegal="Estimativa de mercado — a ser fixada pelo Senado (LC 214/2025)"
        />
      </Bloco>

      {/* Blocos 2..N (numerados sequencialmente após Premissas) */}
      {blocos.map((f, i) => f(i + 2))}

      <p className="text-xs text-ink-muted leading-relaxed">
        Modelo simplificado para fins de planejamento. Não substitui a apuração oficial (LALUR, compensações de prejuízo,
        RAT/FAP, créditos específicos, adições e exclusões). A alíquota de 26,5% do IVA Dual é estimativa de mercado.
        Consulte sempre o contador responsável antes de decisões fiscais.
      </p>
    </div>
  )
}
