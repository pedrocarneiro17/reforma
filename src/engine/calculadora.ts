/**
 * Motor de Cálculo — Reforma Tributária Brasileira (IVA Dual: CBS + IBS)
 *
 * Referências: PEC 45/2019 · LC 214/2025 · LC 227/2026 · Lei 15.270/2025
 * Atualizado em: 05/2026
 * AVISO: Valores estimados para fins de simulação educacional.
 * Consulte um contador para análise fiscal completa.
 */

import type {
  TipoSetor,
  TipoRegime,
  Setor,
  DadosMes,
  DadosEntrada,
  ProjecaoAno,
  AnaliseSimplesHibrido,
  AlertaMEI,
  ProjecaoMes,
  ResultadoCalculo,
  ResultadoComparativo,
  PontoCrescimento,
  FonteAliquota,
  EmpresaGrupo,
  AnaliseGrupoSimples,
  ImovelHolding,
  AnaliseHolding,
  RegimeHolding,
  AnaliseICMS,
  AnaliseFatorR,
  AnaliseProlabore,
} from '../types'

// ─── Constantes ──────────────────────────────────────────────────────────────

/**
 * Alíquota padrão estimada do IVA Dual (CBS + IBS).
 * AVISO: a LC 214/2025 (Art. 14) NÃO fixa este valor — ele será definido por lei ordinária
 * da União e, na ausência, pela alíquota de referência fixada por Resolução do Senado Federal
 * com base em cálculos do TCU (Art. 466 Dec. 12.955/2026). Os 26,5% são estimativa de mercado,
 * não um valor legalmente fixado.
 */
export const ALIQUOTA_IVA_PADRAO = 0.265

/**
 * INSS — Contribuinte Individual (Autônomo / Profissional Liberal)
 * Alíquota: 20% (RPS — Art. 21 Lei 8.212/1991)
 * Teto do salário de contribuição 2026: R$ 8.157,41 (Portaria MPS/MF — atualização estimada)
 * Contribuição máxima: 20% × R$ 8.157,41 ≈ R$ 1.631,48/mês
 */
/**
 * Crédito de CBS/IBS disponível ao comprador quando o fornecedor está no Simples Nacional.
 * O fornecedor Simples remete CBS proporcional à sua alíquota DAS (não os 26,5% cheios).
 * Estimativa conservadora: ~5,88% do valor da compra (média ponderada CBS nos Anexos I–V).
 * Fonte: análise técnica LC 214/2025, Arts. 412–416 (regime transitório Simples).
 */
export const ALIQUOTA_CBS_SIMPLES_MEDIA = 0.0588

/**
 * Análise de Pró-labore — Lucro Presumido e Lucro Real
 *
 * Pró-labore gera:
 *   • Para o sócio: IRPF (tabela progressiva) + INSS contribuinte individual (20%, até o teto)
 *   • Para a empresa: INSS patronal (20% sobre o pró-labore)
 *   • Para LR apenas: dedutível do lucro real → economia de IRPJ (15%+adicional) + CSLL (9%)
 *   • Para LP: NÃO dedutível — base é sempre receita × presunção, independente do pró-labore
 *
 * Distribuição de lucros (atual): isenta de IRPF para o sócio (Lei 9.249/1995 Art. 10).
 * Portanto, em LP o pró-labore tem custo líquido = IRPF + INSS empregado + INSS patronal.
 * Em LR, a economia de IRPJ/CSLL pode compensar parcialmente esse custo.
 */
export const INSS_ALIQ_PATRONAL  = 0.20   // INSS patronal padrão sobre pró-labore
export const INSS_ALIQ_SEGURADO_SOCIO = 0.11 // Segurado contribuinte individual (sócio) sobre pró-labore, quando a empresa recolhe os 20% patronais (Lei 9.876/1999)
export const IRPJ_CSLL_RATE_LR   = 0.24   // IRPJ 15% + CSLL 9% sobre lucro real

export function calcularProlabore(
  socios: import('../types').SocioAdministrador[],
  regime: 'lucro_presumido' | 'lucro_real',
): AnaliseProlabore {
  const detalhes: import('../types').DetalheSocio[] = socios.map(s => {
    const irpfMensal    = calcularIRPF(s.prolaboreMensal)
    const inssEmpregado = Math.min(s.prolaboreMensal, INSS_TETO_2026) * INSS_ALIQ_SEGURADO_SOCIO
    const inssPatronal  = s.prolaboreMensal * INSS_ALIQ_PATRONAL
    return { socio: s, irpfMensal, inssEmpregado, inssPatronal, custoTotal: irpfMensal + inssEmpregado + inssPatronal }
  })

  const totalProlabore      = detalhes.reduce((s, d) => s + d.socio.prolaboreMensal, 0)
  const totalIrpf           = detalhes.reduce((s, d) => s + d.irpfMensal, 0)
  const totalInssEmpregado  = detalhes.reduce((s, d) => s + d.inssEmpregado, 0)
  const totalInssPatronal   = detalhes.reduce((s, d) => s + d.inssPatronal, 0)
  const beneficioFiscalEmpresa = regime === 'lucro_real' ? totalProlabore * IRPJ_CSLL_RATE_LR : 0
  const custoTotalBruto     = totalIrpf + totalInssEmpregado + totalInssPatronal
  const custoLiquido        = Math.max(0, custoTotalBruto - beneficioFiscalEmpresa)

  return {
    socios, detalhes, totalProlabore,
    totalIrpf, totalInssEmpregado, totalInssPatronal,
    beneficioFiscalEmpresa, custoTotalBruto, custoLiquido,
    regime,
  }
}

export const INSS_TETO_2026       = 8_157.41
export const INSS_ALIQ_AUTONOMO   = 0.20
export const INSS_MAXIMO_AUTONOMO = INSS_TETO_2026 * INSS_ALIQ_AUTONOMO  // ≈ R$ 1.631/mês

export function calcularINSSAutonomo(rendimentoMensal: number): number {
  const base = Math.min(rendimentoMensal, INSS_TETO_2026)
  return base * INSS_ALIQ_AUTONOMO
}

/**
 * MEI — DAS fixo mensal por tipo de atividade (valores 2026).
 * Salário-mínimo 2026 = R$ 1.621 → INSS MEI = 5% × R$ 1.621 = R$ 81,05
 * ICMS = R$ 1,00 | ISS = R$ 5,00
 */
export const MEI_DAS_FIXO: Record<TipoSetor, number> = {
  comercio:  82.05,   // INSS (81,05) + ICMS (1,00)
  industria: 87.05,   // INSS (81,05) + ICMS (1,00) + ISS (5,00)
  servico:   86.05,   // INSS (81,05) + ISS (5,00)
  misto:     87.05,
}
/**
 * Limite de faturamento anual do MEI — R$ 81.000/ano (LC 155/2016, vigente).
 * Nota: propostas de aumento para R$ 130.000–R$ 150.000 estão em tramitação
 * (PLP 67/2025 e PLP 60/2025), mas ainda não aprovadas.
 */
export const LIMITE_MEI_ANUAL  = 81_000
export const LIMITE_MEI_MENSAL = LIMITE_MEI_ANUAL / 12  // R$ 6.750/mês

/**
 * Redução anual das alíquotas de ICMS e ISS durante a transição (2029–2032).
 *
 * Fontes legais:
 *   ICMS → Art. 501 LC 214/2025, que insere o Art. 31-A na LC 87/1996:
 *     I  – 10% em 2029 | II – 20% em 2030 | III – 30% em 2031 | IV – 40% em 2032
 *   ISS  → Art. 508 LC 214/2025, que insere o Art. 8-B na LC 116/2003:
 *     I  – 10% em 2029 | II – 20% em 2030 | III – 30% em 2031 | IV – 40% em 2032
 *
 * Percentuais aplicados sobre as alíquotas vigentes em 31/12/2028.
 * Em 2033 ICMS e ISS são extintos; IVA Dual pleno.
 * 2026–2028: CBS substitui PIS/COFINS (swap neutro); ICMS/ISS inalterados.
 * Simples Nacional/MEI: DAS total permanece constante (partilha interna rebalanceia ICMS→IBS).
 */
export const REDUCAO_ICMS_ISS: Record<number, number> = {
  2026: 0.00,
  2027: 0.00,
  2028: 0.00,
  2029: 0.10,  // Art. 501 I (ICMS) / Art. 508 I (ISS)
  2030: 0.20,  // Art. 501 II / Art. 508 II
  2031: 0.30,  // Art. 501 III / Art. 508 III
  2032: 0.40,  // Art. 501 IV / Art. 508 IV
  2033: 1.00,  // ICMS e ISS extintos
}

// ─── IRPF — Tabela Progressiva Mensal (MP 1.206/2024) + Lei 15.270/2025 ──────

/**
 * Calcula o IRPF mensal com base na tabela progressiva em vigor e na Lei 15.270/2025.
 *
 * Tabela progressiva mensal (MP 1.206/2024 → Lei 14.848/2024):
 *   Até R$ 2.259,20          → isento
 *   R$ 2.259,21–2.826,65     → 7,5%  (dedução R$ 169,44)
 *   R$ 2.826,66–3.751,05     → 15%   (dedução R$ 381,44)
 *   R$ 3.751,06–4.664,68     → 22,5% (dedução R$ 662,77)
 *   Acima de R$ 4.664,68     → 27,5% (dedução R$ 896,00)
 *
 * Lei 15.270/2025 — desconto especial sobreposto à tabela:
 *   Até R$ 5.000/mês   → isenção total (desconto integral)
 *   R$ 5.001–R$ 7.350  → isenção reduzida gradualmente
 *   Acima de R$ 7.350  → tabela progressiva plena
 */
export function calcularIRPF(rendimento: number): number {
  // Tabela progressiva mensal em vigor (MP 1.206/2024 → Lei 14.848/2024)
  let irpfBruto: number
  if (rendimento <= 2_259.20)      irpfBruto = 0
  else if (rendimento <= 2_826.65) irpfBruto = rendimento * 0.075 - 169.44
  else if (rendimento <= 3_751.05) irpfBruto = rendimento * 0.15  - 381.44
  else if (rendimento <= 4_664.68) irpfBruto = rendimento * 0.225 - 662.77
  else                             irpfBruto = rendimento * 0.275 - 896.00

  if (irpfBruto <= 0) return 0

  // Lei 15.270/2025 — desconto especial (isenção efetiva até R$ 5.000)
  if (rendimento <= 5_000.00) return 0
  if (rendimento <= 7_350.00) {
    const fatorDesconto = (7_350 - rendimento) / (7_350 - 5_000)
    return Math.max(0, irpfBruto * (1 - fatorDesconto))
  }

  return irpfBruto
}

// ─── Simples Nacional — Tabelas Completas (LC 123/2006 + LC 155/2016, vigência 2018) ────

type FaixaSimples = { limite: number; nominal: number; deducao: number }

/** Tabelas de alíquota nominal e valor a deduzir — Anexos I a V (LC 123/2006, vigência 01/01/2018) */
export const SIMPLES_TABELAS: Record<import('../types').AnexoSimples, FaixaSimples[]> = {
  I: [   // Comércio
    { limite: 180_000,    nominal: 0.040, deducao: 0 },
    { limite: 360_000,    nominal: 0.073, deducao: 5_940 },
    { limite: 720_000,    nominal: 0.095, deducao: 13_860 },
    { limite: 1_800_000,  nominal: 0.107, deducao: 22_500 },
    { limite: 3_600_000,  nominal: 0.143, deducao: 87_300 },
    { limite: 4_800_000,  nominal: 0.190, deducao: 378_000 },
  ],
  II: [  // Indústria
    { limite: 180_000,    nominal: 0.045, deducao: 0 },
    { limite: 360_000,    nominal: 0.078, deducao: 5_940 },
    { limite: 720_000,    nominal: 0.100, deducao: 13_860 },
    { limite: 1_800_000,  nominal: 0.112, deducao: 22_500 },
    { limite: 3_600_000,  nominal: 0.147, deducao: 85_500 },
    { limite: 4_800_000,  nominal: 0.300, deducao: 720_000 },
  ],
  III: [ // Serviços gerais (locação bens móveis + serviços não listados no §5-C)
    { limite: 180_000,    nominal: 0.060, deducao: 0 },
    { limite: 360_000,    nominal: 0.112, deducao: 9_360 },
    { limite: 720_000,    nominal: 0.135, deducao: 17_640 },  // 13,5% — corrigido (era 13,2% no código antigo)
    { limite: 1_800_000,  nominal: 0.160, deducao: 35_640 },
    { limite: 3_600_000,  nominal: 0.210, deducao: 125_640 },
    { limite: 4_800_000,  nominal: 0.330, deducao: 648_000 },
  ],
  IV: [  // Serviços §5-C (construção, limpeza, vigilância, telemarketing — sem CPP no DAS)
    { limite: 180_000,    nominal: 0.045, deducao: 0 },
    { limite: 360_000,    nominal: 0.090, deducao: 8_100 },
    { limite: 720_000,    nominal: 0.102, deducao: 12_420 },
    { limite: 1_800_000,  nominal: 0.140, deducao: 39_780 },
    { limite: 3_600_000,  nominal: 0.220, deducao: 183_780 },
    { limite: 4_800_000,  nominal: 0.330, deducao: 828_000 },
  ],
  V: [   // Serviços §5-I (auditoria, consultoria, jornalismo, tecnologia, publicidade, etc.)
    { limite: 180_000,    nominal: 0.155, deducao: 0 },
    { limite: 360_000,    nominal: 0.180, deducao: 4_500 },
    { limite: 720_000,    nominal: 0.195, deducao: 9_900 },
    { limite: 1_800_000,  nominal: 0.205, deducao: 17_100 },
    { limite: 3_600_000,  nominal: 0.230, deducao: 62_100 },
    { limite: 4_800_000,  nominal: 0.305, deducao: 540_000 },
  ],
}

/**
 * Percentual de Repartição CBS (COFINS + PIS/Pasep) dentro do DAS por anexo e faixa.
 * Fonte: LC 123/2006 Anexos I–V, tabela de partilha vigente desde 01/01/2018 (LC 155/2016).
 * CBS = DAS_efetivo × partilha_CBS  (Art. 47 §2 Dec. 12.955/2026)
 */
export const PARTILHA_CBS_SIMPLES: Record<import('../types').AnexoSimples, number[]> = {
  I:   [0.1550, 0.1550, 0.1550, 0.1550, 0.1550, 0.3440], // faixas 1–5: 15,50% | faixa 6: 34,40%
  II:  [0.1400, 0.1400, 0.1400, 0.1400, 0.1400, 0.2550], // faixas 1–5: 14,00% | faixa 6: 25,50%
  III: [0.1560, 0.1710, 0.1660, 0.1660, 0.1560, 0.1950], // varia por faixa
  IV:  [0.2150, 0.2500, 0.2400, 0.2300, 0.2200, 0.2500], // varia por faixa
  V:   [0.1715, 0.1715, 0.1815, 0.1915, 0.1715, 0.2000], // varia por faixa
}

/**
 * Percentual de Repartição IBS (ICMS/ISS) dentro do DAS por anexo e faixa.
 * LC 123/2006 Anexos I–V — partilha ICMS (comércio/indústria) e ISS (serviços).
 * Em Faixa 6 o ICMS/ISS é recolhido fora do DAS (sublimite estadual/municipal excedido) → 0%.
 * A partir de 2029 essa parcela transita gradualmente para IBS (Arts. 501/508 LC 214/2025).
 */
export const PARTILHA_IBS_SIMPLES: Record<import('../types').AnexoSimples, number[]> = {
  I:   [0.3400, 0.3400, 0.3400, 0.3350, 0.3350, 0.0000], // ICMS; F6: sublimite → fora do DAS
  II:  [0.3200, 0.3200, 0.3200, 0.3200, 0.3200, 0.0000], // ICMS (IPI tratado como federal)
  III: [0.3350, 0.3200, 0.3250, 0.3250, 0.3350, 0.0215], // ISS
  IV:  [0.4050, 0.3800, 0.3857, 0.4023, 0.3992, 0.0000], // ISS; F6: fora do DAS
  V:   [0.1414, 0.1414, 0.1700, 0.1800, 0.1950, 0.1485], // ISS
}

function getFaixaIdx(faturamentoAnual: number, tabela: FaixaSimples[]): number {
  for (let i = 0; i < tabela.length; i++) {
    if (faturamentoAnual <= tabela[i].limite) return i
  }
  return tabela.length - 1
}

export function getAliquotaDAS(anexo: import('../types').AnexoSimples, faturamentoAnual: number): number {
  if (faturamentoAnual <= 0) return 0
  const tabela = SIMPLES_TABELAS[anexo]
  const { nominal, deducao } = tabela[getFaixaIdx(faturamentoAnual, tabela)]
  return Math.max(0, (faturamentoAnual * nominal - deducao) / faturamentoAnual)
}

/** CBS componente do DAS = DAS_efetivo × partilha_CBS(anexo, faixa) */
export function getCBSSimples(anexo: import('../types').AnexoSimples, faturamentoAnual: number): number {
  const das = getAliquotaDAS(anexo, faturamentoAnual)
  const faixaIdx = getFaixaIdx(faturamentoAnual, SIMPLES_TABELAS[anexo])
  return das * PARTILHA_CBS_SIMPLES[anexo][faixaIdx]
}

/** IBS (ICMS/ISS) componente do DAS = DAS_efetivo × partilha_IBS(anexo, faixa) */
export function getIBSSimples(anexo: import('../types').AnexoSimples, faturamentoAnual: number): number {
  const das = getAliquotaDAS(anexo, faturamentoAnual)
  const faixaIdx = getFaixaIdx(faturamentoAnual, SIMPLES_TABELAS[anexo])
  return das * PARTILHA_IBS_SIMPLES[anexo][faixaIdx]
}

/** Fallback: infere anexo padrão pelo tipo de setor quando usuário não informou */
function inferirAnexo(tipoSetor: TipoSetor): import('../types').AnexoSimples {
  if (tipoSetor === 'comercio') return 'I'
  if (tipoSetor === 'industria') return 'II'
  return 'III'
}

function getAliquotaSimplesNacional(tipoSetor: TipoSetor, faturamentoAnual: number, anexo?: import('../types').AnexoSimples): number {
  return getAliquotaDAS(anexo ?? inferirAnexo(tipoSetor), faturamentoAnual)
}

/**
 * Alíquota DAS ponderada para empresas com receitas em dois anexos distintos.
 * LC 123/2006 Art. 18 §4-A: cada parcela de receita é tributada pelo seu próprio anexo.
 * A faixa (RBT12) é determinada pelo faturamento total — apenas o percentual de partilha varia.
 */
function getAliquotaSimplesNacionalMisto(
  faturamentoAnual: number,
  anexo1: import('../types').AnexoSimples,
  pct1: number,          // 0–1
  anexo2: import('../types').AnexoSimples,
): number {
  const pct2 = 1 - pct1
  return pct1 * getAliquotaDAS(anexo1, faturamentoAnual) + pct2 * getAliquotaDAS(anexo2, faturamentoAnual)
}

function getCBSSimplesMisto(
  faturamentoAnual: number,
  anexo1: import('../types').AnexoSimples,
  pct1: number,
  anexo2: import('../types').AnexoSimples,
): number {
  const pct2 = 1 - pct1
  return pct1 * getCBSSimples(anexo1, faturamentoAnual) + pct2 * getCBSSimples(anexo2, faturamentoAnual)
}

// ─── Fator R — mantido para compatibilidade mas não usado no cálculo principal ──

export const FATOR_R_LIMIAR = 0.28

export function calcularFatorR(
  faturamentoMensal: number,
  folhaMensal: number,
): AnaliseFatorR {
  const faturamentoAnual = faturamentoMensal * 12
  const fatorR = faturamentoMensal > 0 ? folhaMensal / faturamentoMensal : 0
  const jaEstaNoIII = fatorR >= FATOR_R_LIMIAR

  const aliquotaAnexoIII = getAliquotaDAS('III', faturamentoAnual)
  const aliquotaAnexoV   = getAliquotaDAS('V',   faturamentoAnual)

  const impostoIII = faturamentoMensal * aliquotaAnexoIII
  const impostoV   = faturamentoMensal * aliquotaAnexoV
  const diferencaMensal = impostoV - impostoIII

  return {
    aplicavel: true,
    folhaMensal,
    faturamentoMensal,
    fatorR,
    anexo: jaEstaNoIII ? 'III' : 'V',
    aliquotaAnexoIII,
    aliquotaAnexoV,
    diferencaMensal,
    folhaMinimaPara28pct: faturamentoMensal * FATOR_R_LIMIAR,
    jaEstaNoIII,
  }
}

// ─── IRPJ Adicional de 10% ────────────────────────────────────────────────────

/**
 * Calcula o IRPJ Adicional (10%) sobre a parcela do lucro mensal que excede R$ 20.000.
 * Base legal: RIR/2018 (Decreto 9.580/2018), Art. 622 — apuração trimestral convertida em mensal.
 *
 * LP: lucro presumido = faturamento × percentual de presunção (32% serviços, 8% comércio/indústria)
 * LR: lucro real estimado com margem conservadora (10% serviços, 5% comércio/indústria)
 */
const IRPJ_ADICIONAL_LIMIAR = 20_000  // R$ 20.000/mês (R$ 60.000/trimestre)

const PRESUNCAO_LP_IRPJ: Record<TipoSetor, number> = {
  servico:   0.32,
  misto:     0.32,
  comercio:  0.08,
  industria: 0.08,
}
const PRESUNCAO_LP_CSLL: Record<TipoSetor, number> = {
  servico:   0.32,
  misto:     0.32,
  comercio:  0.12,
  industria: 0.12,
}

const MARGEM_LR: Record<TipoSetor, number> = {
  servico:  0.10,
  misto:    0.10,
  comercio: 0.05,
  industria: 0.05,
}

/**
 * Contribuições de terceiros ("Sistema S" + outras entidades) sobre a folha de EMPREGADOS.
 * Somam-se aos 20% da CPP patronal. Variam conforme a atividade (código FPAS).
 * Pró-labore de sócios NÃO tem terceiros — apenas os 20% de CPP.
 * Total padrão 5,8%: entidade (1,5%) + aprendizagem (1,0%) + INCRA (0,2%) + Salário-Educação (2,5%) + SEBRAE (0,6%).
 */
const TERCEIROS_FOLHA: Record<TipoSetor, number> = {
  comercio:  0.058, // SESC 1,5% + SENAC 1,0% + INCRA 0,2% + Sal-Educação 2,5% + SEBRAE 0,6%
  industria: 0.058, // SESI 1,5% + SENAI 1,0% + INCRA 0,2% + Sal-Educação 2,5% + SEBRAE 0,6%
  servico:   0.058, // SESC 1,5% + SENAC 1,0% + INCRA 0,2% + Sal-Educação 2,5% + SEBRAE 0,6% (FPAS 515)
  misto:     0.058,
}

/** Rótulo das entidades de terceiros conforme a atividade — para exibição na UI. */
export function labelTerceiros(tipo: TipoSetor): string {
  return tipo === 'industria' ? 'SESI/SENAI + Sal-Educação + INCRA + SEBRAE' : 'SESC/SENAC + Sal-Educação + INCRA + SEBRAE'
}

export function calcularIRPJAdicional(
  regime: TipoRegime,
  tipoSetor: TipoSetor,
  faturamentoMensal: number,
  setor?: import('../types').Setor,
): number {
  if (regime !== 'lucro_presumido' && regime !== 'lucro_real') return 0
  const presuncao = setor?.presuncaoLPIRPJ ?? PRESUNCAO_LP_IRPJ[tipoSetor]
  const lucroMensal = regime === 'lucro_presumido'
    ? faturamentoMensal * presuncao
    : faturamentoMensal * MARGEM_LR[tipoSetor]
  return Math.max(0, lucroMensal - IRPJ_ADICIONAL_LIMIAR) * 0.10
}

/**
 * Alíquotas efetivas do Lucro Presumido — valores exatos derivados das alíquotas legais fixas.
 * Fontes: RIR/2018 (Decreto 9.580/2018), Lei 9.249/1995, Lei 9.718/1998.
 *
 * Fórmula: IRPJ (15% × presunção) + CSLL (9% × presunção) + PIS (0,65%) + COFINS (3%) + ISS/ICMS
 * O IRPJ adicional (10%) é calculado separadamente em calcularIRPJAdicional().
 */
function getAliquotaLucroPresumido(tipoSetor: TipoSetor, setor?: import('../types').Setor): number {
  const pIRPJ = setor?.presuncaoLPIRPJ ?? PRESUNCAO_LP_IRPJ[tipoSetor]
  const pCSLL = setor?.presuncaoLPCSLL ?? PRESUNCAO_LP_CSLL[tipoSetor]

  // IRPJ = 15% × presunção | CSLL = 9% × presunção
  const irpj  = 0.15 * pIRPJ
  const csll  = 0.09 * pCSLL
  const pisCofins = 0.0365  // cumulativo: PIS 0,65% + COFINS 3,00%

  if (tipoSetor === 'servico' || tipoSetor === 'misto') {
    // ISS médio 3% (varia 2–5% por município); sem ICMS para serviços
    const iss = 0.03
    return irpj + csll + pisCofins + iss
  }
  if (tipoSetor === 'comercio') {
    // ICMS 12% média nacional (sem crédito no LP cumulativo)
    return irpj + csll + pisCofins + 0.12
  }
  // industria
  return irpj + csll + pisCofins + 0.12 + 0.05  // ICMS 12% + IPI 5% médio
}

/**
 * Alíquotas efetivas estimadas do Lucro Real — variam conforme margem líquida e créditos reais.
 * PIS (1,65%) + COFINS (7,6%) não-cumulativos com créditos sobre insumos + IRPJ/CSLL sobre lucro real.
 * Premissas: margem líquida ~10% (serviços) / ~5% (comércio/indústria); créditos PIS/COFINS ~25-40%.
 */
function getAliquotaLucroReal(tipoSetor: TipoSetor): number {
  if (tipoSetor === 'servico' || tipoSetor === 'misto') {
    // PIS/COFINS bruto 9,25% − créditos (insumos 25% receita): 9,25% × 0,75 = 6,9375%
    // ISS: 3,00% | IRPJ: 15% × 10% = 1,50% | CSLL: 9% × 10% = 0,90%
    // Total exato: 6,9375 + 3,00 + 1,50 + 0,90 = 12,3375%
    return 0.123375
  }

  if (tipoSetor === 'comercio') {
    // PIS/COFINS bruto 9,25% − créditos (COGS ~60% receita) = 3,70%
    // ICMS 17% (média estados 17-18%) − créditos (40% eficiência) = 10,20%
    // IRPJ: 15% × 5% = 0,75% | CSLL: 9% × 5% = 0,45%
    // Total: 3,70 + 10,20 + 0,75 + 0,45 = 15,10%
    return 0.1510
  }

  // industria
  // PIS/COFINS bruto 9,25% − créditos (insumos ~60% receita) = 3,70%
  // ICMS 12% − créditos (60%) = 4,80% | IPI 5% − créditos (60%) = 2,00%
  // IRPJ: 15% × 5% = 0,75% | CSLL: 9% × 5% = 0,45%
  // Total: 3,70 + 4,80 + 2,00 + 0,75 + 0,45 = 11,70%
  return 0.1170
}

// ─── Análise de Grupo Societário — Simples Nacional ──────────────────────────

/**
 * Verifica se a soma de faturamento do grupo societário excede o limite do Simples Nacional.
 *
 * Regra: LC 123/2006, Art. 3º, §4º — se o sócio tiver ≥10% do capital em outra empresa,
 * os faturamentos de TODAS somam para o limite de R$ 4.800.000/ano.
 * Se excedido, todas as empresas do grupo são desenquadradas do Simples.
 */
export const LIMITE_SIMPLES_NACIONAL_ANUAL = 4_800_000

export function analisarGrupoSimples(
  faturamentoMensalPrincipal: number,
  empresasGrupo: EmpresaGrupo[],
): AnaliseGrupoSimples {
  // LC 123/2006 Art. 3º §4º: soma a receita global quando o sócio:
  //   IV - participa com MAIS de 10% do capital de outra empresa; ou
  //   V  - é administrador de outra PJ com fins lucrativos (sem piso de 10%).
  const contaParaGrupo = (e: EmpresaGrupo) => e.participacao > 10 || e.administrador === true
  const empresasQueContam    = empresasGrupo.filter(contaParaGrupo)
  const empresasQueNaoContam = empresasGrupo.filter(e => !contaParaGrupo(e))

  const faturamentoAnualPrincipal = faturamentoMensalPrincipal * 12
  const faturamentoAnualGrupo     = empresasQueContam.reduce(
    (soma, e) => soma + e.faturamentoMensal * 12,
    0,
  )
  const faturamentoAnualTotal   = faturamentoAnualPrincipal + faturamentoAnualGrupo
  const percentualUtilizado     = (faturamentoAnualTotal / LIMITE_SIMPLES_NACIONAL_ANUAL) * 100

  return {
    ativo: true,
    empresasGrupo,
    faturamentoAnualPrincipal,
    faturamentoAnualGrupo,
    faturamentoAnualTotal,
    dentroDoLimite: faturamentoAnualTotal <= LIMITE_SIMPLES_NACIONAL_ANUAL,
    limiteAnual: LIMITE_SIMPLES_NACIONAL_ANUAL,
    percentualUtilizado,
    empresasQueContam,
    empresasQueNaoContam,
  }
}

// ─── ICMS por UF ─────────────────────────────────────────────────────────────

/**
 * Alíquotas internas gerais do ICMS por UF (mercadorias em geral — 2025/2026).
 * Fontes: RICMS de cada estado + alterações legislativas recentes.
 * Notas por estado incluídas em ICMS_NOTAS.
 */
export const ICMS_ALIQUOTA_INTERNA: Record<string, number> = {
  AC: 0.17,
  AL: 0.19,    // 17% + 2% FCP
  AM: 0.20,
  AP: 0.18,
  BA: 0.19,
  CE: 0.20,
  DF: 0.20,
  ES: 0.17,
  GO: 0.17,
  MA: 0.22,
  MG: 0.18,
  MS: 0.17,
  MT: 0.17,
  PA: 0.17,
  PB: 0.18,
  PE: 0.205,   // 18% + 2,5% FCP
  PI: 0.21,
  PR: 0.195,   // 19% + 0,5% FCP
  RJ: 0.20,
  RN: 0.18,
  RO: 0.175,
  RR: 0.20,
  RS: 0.17,
  SC: 0.17,
  SE: 0.19,
  SP: 0.18,    // 12% geral + maioria dos produtos sujeitos a 18%; varia por NCM
  TO: 0.20,
}

export const ICMS_NOTAS: Record<string, string> = {
  AL: 'Inclui FCP de 2%',
  PE: 'Inclui FCP de 2,5%',
  PR: 'Inclui FCP de 0,5%',
  SP: 'SP: 12% base legal; maioria dos produtos em 18%. Verifique o NCM do produto.',
  MA: 'MA possui uma das maiores alíquotas do país (22%)',
}

export const UF_NOMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AM: 'Amazonas', AP: 'Amapá', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MG: 'Minas Gerais', MS: 'Mato Grosso do Sul', MT: 'Mato Grosso',
  PA: 'Pará', PB: 'Paraíba', PE: 'Pernambuco', PI: 'Piauí', PR: 'Paraná',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RO: 'Rondônia', RR: 'Roraima',
  RS: 'Rio Grande do Sul', SC: 'Santa Catarina', SE: 'Sergipe', SP: 'São Paulo',
  TO: 'Tocantins',
}

/**
 * Calcula o ICMS por UF para Lucro Presumido e Lucro Real.
 * Para Simples Nacional, MEI e PF, o ICMS é tratado de forma diferente.
 *
 * Método de crédito:
 *   ICMS débito  = faturamento × alíquota interna da UF
 *   ICMS crédito = insumos × alíquota interna (aproximação — assume que todos os insumos
 *                  são tributados pelo ICMS, o que pode subestimar o crédito real)
 *   ICMS líquido = débito − crédito
 */
export function calcularICMS(
  regime: TipoRegime,
  uf: string,
  faturamentoMensal: number,
  insumosMensais: number,
): AnaliseICMS {
  const aliquota = ICMS_ALIQUOTA_INTERNA[uf] ?? 0

  // Simples Nacional e MEI: ICMS incluído no DAS — não calculamos separadamente
  if (regime === 'simples_nacional') {
    return {
      uf, aliquotaInterna: aliquota, icmsDebito: 0, icmsCredito: 0,
      icmsLiquido: 0, aliquotaEfetivaICMS: 0, aplicavel: false,
      nota: 'No Simples Nacional, o ICMS está incluído no DAS. Não há apuração separada de débito e crédito.',
    }
  }
  if (regime === 'mei') {
    return {
      uf, aliquotaInterna: aliquota, icmsDebito: 0, icmsCredito: 0,
      icmsLiquido: 0, aliquotaEfetivaICMS: 0, aplicavel: false,
      nota: 'No MEI, o ICMS está fixado em R$ 1,00/mês no DAS.',
    }
  }
  if (regime === 'profissional_liberal') {
    return {
      uf, aliquotaInterna: aliquota, icmsDebito: 0, icmsCredito: 0,
      icmsLiquido: 0, aliquotaEfetivaICMS: 0, aplicavel: false,
      nota: 'Profissional Liberal (PF) recolhe ISS, não ICMS. ICMS incide sobre circulação de mercadorias.',
    }
  }

  // Lucro Presumido e Lucro Real: apuração normal por débito/crédito
  const icmsDebito  = faturamentoMensal * aliquota
  const icmsCredito = insumosMensais    * aliquota
  const icmsLiquido = Math.max(0, icmsDebito - icmsCredito)
  const aliquotaEfetivaICMS = faturamentoMensal > 0 ? icmsLiquido / faturamentoMensal : 0

  const notaBase = ICMS_NOTAS[uf] ?? ''
  const nota = [
    notaBase,
    'Crédito calculado sobre o total de insumos informados (aproximação — insumos de serviços podem não gerar crédito).',
  ].filter(Boolean).join(' ')

  return {
    uf, aliquotaInterna: aliquota,
    icmsDebito, icmsCredito, icmsLiquido, aliquotaEfetivaICMS,
    aplicavel: true, nota,
  }
}

// ─── Análise de Holding Patrimonial ───────────────────────────────────────────

/**
 * Calcula o impacto tributário de uma holding patrimonial com receita de aluguéis.
 *
 * IBS/CBS: Art. 261 §único LC 214/2025 — locação de imóveis tem redução de 70%.
 *   Alíquota efetiva = 26,5% × (1 − 0,70) = 26,5% × 0,30 = 7,95% exato.
 *
 * Uso gratuito (LC 227/2026 — Art. 5º LC 214):
 *   Sem créditos de IBS/CBS na aquisição → uso gratuito NÃO é tributado ("sem crédito, sem tributo").
 *   Com créditos na aquisição → uso gratuito É tributado (base = valor de mercado do aluguel).
 *
 * LP Aluguéis (exato por lei):
 *   IRPJ: 15% × 32% = 4,80% | CSLL: 9% × 32% = 2,88% | PIS: 0,65% | COFINS: 3,00% → 11,33%
 *
 * LR Aluguéis (estimativa — margem 50%, créditos PIS/COFINS 5%):
 *   PIS/COFINS líquido: 9,25% × 0,95 = 8,7875%
 *   IRPJ: 15% × 50% = 7,50% | CSLL: 9% × 50% = 4,50% → total: 20,7875%
 */

// IBS/CBS sobre locação: 26,5% × 30% = 7,95% (exato)
export const ALIQUOTA_IBS_CBS_IMOVEL = ALIQUOTA_IVA_PADRAO * (1 - 0.70)

// LP — exato por lei (Lei 9.249/1995 + Lei 9.718/1998)
export const ALIQUOTA_LP_HOLDING = 0.1133  // 4,80 + 2,88 + 0,65 + 3,00

// LR — estimativa componente a componente (margem 50%, créditos PIS/COFINS 5%)
export const ALIQUOTA_LR_HOLDING = 0.207875  // 8,7875 + 7,50 + 4,50

// Redutor social da locação residencial — R$ 600/mês por imóvel (Art. 260 LC 214/2025)
export const REDUTOR_SOCIAL_LOCACAO_RESIDENCIAL = 600

// Limiar para a PF locadora ser contribuinte de IBS/CBS (Art. 251 §1º I LC 214/2025):
// receita de locação > R$ 240.000/ano (cumulativo com mais de 3 imóveis distintos)
export const LIMITE_PF_CONTRIBUINTE_IMOVEL_ANUAL = 240_000

export function analisarHolding(
  regime: RegimeHolding,
  imoveis: ImovelHolding[],
): AnaliseHolding {
  const imoveisGratuitosSemCredito = imoveis.filter(
    i => i.destinatario === 'uso_gratuito_socio' && !i.creditosIBSCBSNaAquisicao,
  )
  const imoveisGratuitosComCredito = imoveis.filter(
    i => i.destinatario === 'uso_gratuito_socio' && i.creditosIBSCBSNaAquisicao,
  )
  const imoveisOnerosos = imoveis.filter(i => i.destinatario !== 'uso_gratuito_socio')

  const receitaOnerosaTotal       = imoveisOnerosos.reduce((s, i) => s + i.receitaMensalAluguel, 0)
  const receitaGratuitaTributada  = imoveisGratuitosComCredito.reduce((s, i) => s + i.receitaMensalAluguel, 0)
  const receitaGratuitaNaoTributada = imoveisGratuitosSemCredito.reduce((s, i) => s + i.receitaMensalAluguel, 0)
  const receitaTotalMensal        = receitaOnerosaTotal + receitaGratuitaTributada

  // Redutor social da locação residencial (Art. 260 LC 214/2025): R$ 600/mês por imóvel
  // residencial, limitado à base de cada imóvel. Deduz da base de IBS/CBS (não dos tributos correntes).
  const imoveisTributaveis = [...imoveisOnerosos, ...imoveisGratuitosComCredito]
  const redutorSocialMensal = imoveisTributaveis
    .filter(i => i.residencial)
    .reduce((s, i) => s + Math.min(REDUTOR_SOCIAL_LOCACAO_RESIDENCIAL, i.receitaMensalAluguel), 0)
  const baseIBSCBSMensal = Math.max(0, receitaTotalMensal - redutorSocialMensal)

  const aliquotaIBSCBS           = ALIQUOTA_IBS_CBS_IMOVEL
  const ibsCBSMensal             = baseIBSCBSMensal * aliquotaIBSCBS

  const aliquotaTributosCorrentes = regime === 'lucro_presumido'
    ? ALIQUOTA_LP_HOLDING
    : ALIQUOTA_LR_HOLDING
  const tributosCorrMensal        = receitaTotalMensal * aliquotaTributosCorrentes

  const cargaTotalMensal          = ibsCBSMensal + tributosCorrMensal
  const cargaTotalPercentual      = receitaTotalMensal > 0
    ? cargaTotalMensal / receitaTotalMensal
    : 0

  // Comparação PF: IRPF progressivo 2025 (tabela + Lei 15.270/2025) sobre renda de aluguéis.
  // Art. 251 §1º I LC 214/2025: a PF locadora também é contribuinte de IBS/CBS quando, no ano anterior,
  // a receita de locação excede R$ 240.000 E há mais de 3 imóveis distintos (requisitos cumulativos).
  // Nesse caso a PF paga o mesmo IBS/CBS da holding (redução 70% + redutor social residencial).
  const pfEhContribuinteImovel =
    imoveis.length > 3 && receitaTotalMensal * 12 > LIMITE_PF_CONTRIBUINTE_IMOVEL_ANUAL
  const pfIbsCBSMensal            = pfEhContribuinteImovel ? ibsCBSMensal : 0
  const cargaPFMensal             = calcularIRPF(receitaTotalMensal) + pfIbsCBSMensal
  const cargaPFPercentual         = receitaTotalMensal > 0
    ? cargaPFMensal / receitaTotalMensal
    : 0

  const economiaMensalHolding     = cargaPFMensal - cargaTotalMensal

  return {
    ativo: true,
    regime,
    imoveis,
    receitaOnerosaTotal,
    receitaGratuitaTributada,
    receitaGratuitaNaoTributada,
    receitaTotalMensal,
    redutorSocialMensal,
    baseIBSCBSMensal,
    aliquotaIBSCBS,
    ibsCBSMensal,
    aliquotaTributosCorrentes,
    tributosCorrMensal,
    cargaTotalMensal,
    cargaTotalPercentual,
    cargaPFMensal,
    cargaPFPercentual,
    pfEhContribuinteImovel,
    pfIbsCBSMensal,
    vantagemHolding: economiaMensalHolding > 0,
    economiaMensalHolding,
    imoveisGratuitosSemCredito,
    imoveisGratuitosComCredito,
  }
}

// ─── Componente ICMS/ISS para o cronograma de transição ──────────────────────

/**
 * Estima o componente mensal de ICMS (comércio/indústria) ou ISS (serviços/PF)
 * da carga tributária atual, usado para aplicar a redução gradual per Arts. 501/508 LC 214.
 *
 * Simples Nacional / MEI: retorna 0 — o DAS total permanece constante durante a transição;
 *   a partilha interna apenas rebalanceia ICMS/ISS → IBS sem alterar o valor total pago.
 * LP Comércio/Indústria: ICMS = 12% × faturamento (regime cumulativo, sem crédito na presunção).
 * LP/LR Serviço/Misto e PF Liberal: ISS = 3% × faturamento (alíquota média municipal).
 * LR Comércio/Indústria com UF: usa calcularICMS() (débito − crédito por UF).
 * LR Comércio/Indústria sem UF: 10,2% × faturamento (17% médio − 40% crédito efetivo).
 */
function estimarICMSISS(
  regime: TipoRegime,
  tipoSetor: TipoSetor,
  faturamentoMensal: number,
  insumosMensais: number,
  uf: string,
): number {
  if (regime === 'simples_nacional' || regime === 'mei') return 0

  // Produtor rural: tratado como LP para fins de estimativa ICMS/ISS
  const regimeEfetivo = regime === 'produtor_rural' ? 'lucro_presumido' : regime

  if (regimeEfetivo === 'profissional_liberal' || tipoSetor === 'servico' || tipoSetor === 'misto') {
    return faturamentoMensal * 0.03  // ISS médio 3% — Art. 508 LC 214/2025
  }

  // Comércio e Indústria — ICMS (Art. 501 LC 214/2025)
  if (uf) {
    return calcularICMS(regimeEfetivo, uf, faturamentoMensal, insumosMensais).icmsLiquido
  }
  // Fallback sem UF
  if (regimeEfetivo === 'lucro_presumido') {
    return faturamentoMensal * 0.12  // ICMS cumulativo LP — sem crédito na presunção
  }
  return faturamentoMensal * 0.102  // LR: 17% médio × (1 − 40% eficiência de crédito)
}

// ─── Função Principal de Cálculo ──────────────────────────────────────────────

/**
 * Recebe os dados do formulário e retorna todos os cenários calculados.
 */
export function calcularTodosOsCenarios(dados: DadosEntrada): ResultadoCalculo {
  const {
    regime, setor, faturamentoMensal, insumosMensais, perfilClientes,
    pctClientesPJ = 50,
    aliquotaAtualOverride = null,
    dadosMensais = null,
    exportacoesMensais = 0,
    empresasGrupo = [],
    nomePrincipal = '',
    analiseHolding = null,
    uf = '',
    anexoSimples,
    anexoSimples2,
    pctAnexo1,
    folhaMensal = 0,
    pctFornecedoresSimples = 0,
    sociosAdministradores = [],
    pctCustoImovel = 0,
    redutorSocialMensal = 0,
    pctRepasseAgencia = 0,
    pctVendasGoverno = 0,
    pctGorjeta = 0,
    pctInsumosProdutorRural = 0,
    pctFreteAutonomo = 0,
    vendaImobilizadoMensal = 0,
    investimentoCapitalMensal = 0,
    pctVendasAliqZeroRural = 0,
    pctVendasAliqZeroTransp = 0,
    despesasCrediteisAdicionais = 0,
    regimeAutomotivoHabilitado = false,
    faseRegimeAutomotivo = 1,
    tipoBemZFM = 'consumo_final',
    pctMedicamentos = 0,
    pctCestaZero = 0,
    pctCestaReduzida = 0,
    folhaPagamentoLRMensal = 0,
    aliquotaICMSEfetiva,
    aliquotaISSEfetiva,
    despesasOperacionaisMensais = 0,
  } = dados
  const faturamentoAnual = faturamentoMensal * 12

  // Fração das vendas a PJ (empresas) — determina quanto do IVA é aproveitável como crédito
  // pelo cliente (só PJ credita). b2b = 100%, b2c = 0%, misto = pctClientesPJ informado.
  const fracClientesPJ = perfilClientes === 'b2b' ? 1
    : perfilClientes === 'b2c' ? 0
    : Math.min(1, Math.max(0, pctClientesPJ / 100))
  // Atividade impedida de optar pelo Simples Nacional (LC 123/2006 Art. 17 / Art. 3º §4º)
  const setorVedadoSimples = setor.vedadoSimples === true

  // Anexo efetivo: usa o informado pelo usuário ou infere pelo tipo de setor
  const anexoEfetivo: import('../types').AnexoSimples | undefined = (regime === 'simples_nacional' || regime === 'mei')
    ? (anexoSimples ?? inferirAnexo(setor.tipo))
    : undefined

  // Fator R — para atividades sujeitas (setor.fatorR), a folha determina o anexo por lei:
  // folha ÷ faturamento ≥ 28% → Anexo III; < 28% → Anexo V (LC 123/2006 Art. 18 §5-J/§5-M).
  // Folha do Fator R: usa o campo próprio (folhaMensal, coletado quando o regime atual é Simples)
  // ou, quando ausente — caso do comparador para uma empresa hoje LP/LR —, reconstrói com a
  // folha de empregados + pró-labore, para que o cenário Simples do comparador aplique o Fator R.
  const folhaFatorR = folhaMensal > 0
    ? folhaMensal
    : folhaPagamentoLRMensal + sociosAdministradores.reduce((s, so) => s + so.prolaboreMensal, 0)
  const analiseFatorR: AnaliseFatorR | null =
    regime === 'simples_nacional' && setor.fatorR === true && folhaFatorR > 0
      ? calcularFatorR(faturamentoMensal, folhaFatorR)
      : null

  // Anexo efetivo: para setores sujeitos ao Fator R com folha informada, o Fator R decide
  // (III ou V) e sobrepõe a escolha manual — pois nesses casos o anexo é determinado por lei.
  // Sem folha informada (ou setor sem Fator R), usa o anexo informado/inferido.
  const anexoEfetivoComFatorR = analiseFatorR != null
    ? (analiseFatorR.jaEstaNoIII ? 'III' : 'V')
    : anexoEfetivo

  // ── Contribuição Previdenciária Patronal e ICMS/ISS — comuns a LP e LR ──────
  // (LC 8.212/1991): CPP 20% sobre folha de EMPREGADOS + terceiros (Sistema S) conforme atividade;
  // CPP 20% sobre pró-labore de sócios (sem terceiros). No Simples estão embutidos no DAS (CPP).
  const ehLPouLR = regime === 'lucro_presumido' || regime === 'lucro_real'
  // Fallback: se a folha específica LP/LR não foi informada, usa a folha do Fator R (Simples) —
  // garante que o comparador de regimes considere o custo de pessoal também para quem é do SN.
  const folhaEmpregadosMensal  = folhaPagamentoLRMensal > 0 ? folhaPagamentoLRMensal : folhaMensal
  const terceirosAliq          = TERCEIROS_FOLHA[setor.tipo]
  const cppFolhaEmpregados     = ehLPouLR ? folhaEmpregadosMensal * INSS_ALIQ_PATRONAL : 0
  const terceirosFolhaMensal   = ehLPouLR ? folhaEmpregadosMensal * terceirosAliq : 0
  const totalProLaboreMensal   = sociosAdministradores.reduce((s, so) => s + so.prolaboreMensal, 0)
  const cppProLaboreMensal     = ehLPouLR ? totalProLaboreMensal * INSS_ALIQ_PATRONAL : 0
  // Contribuição previdenciária total da empresa (folha empregados + terceiros + pró-labore)
  const contribPrevidenciariaMensal   = cppFolhaEmpregados + terceirosFolhaMensal + cppProLaboreMensal
  // Encargos dedutíveis do lucro real (folha bruta + CPP + terceiros)
  const encargosFolhaEmpregadosMensal = folhaEmpregadosMensal + cppFolhaEmpregados + terceirosFolhaMensal
  // ICMS "hoje" (LP/LR) — apuração por débito/crédito (não-cumulativo):
  // débito = alíquota × vendas ; crédito = alíquota × compras de mercadorias informadas (insumos).
  // ICMS a recolher = max(0, débito − crédito). Sem alíquota informada, cai na média por setor.
  const icmsAliquotaAtual = aliquotaICMSEfetiva != null
    ? aliquotaICMSEfetiva
    : (setor.tipo === 'comercio' || setor.tipo === 'industria') ? 0.12 : 0
  const icmsDebitoAtualMensal  = ehLPouLR ? faturamentoMensal * icmsAliquotaAtual : 0
  const icmsCreditoAtualMensal = ehLPouLR ? insumosMensais * icmsAliquotaAtual : 0
  const icmsAtualMensal = Math.max(0, icmsDebitoAtualMensal - icmsCreditoAtualMensal)
  // ISS é cumulativo (incide sobre a receita de serviços, sem crédito sobre compras)
  const issAtualMensal = ehLPouLR
    ? (aliquotaISSEfetiva != null
        ? faturamentoMensal * aliquotaISSEfetiva
        : (setor.tipo === 'servico' || setor.tipo === 'misto')
          ? faturamentoMensal * 0.03
          : 0)
    : 0

  // ── 1. Carga Atual ──────────────────────────────────────────────────────────
  let aliquotaAtual: number
  let impostoAtualMensal: number
  let fonteAliquota: FonteAliquota = 'estimada'
  // Detalhamento da carga atual do Lucro Presumido (preenchido no branch abaixo)
  let apuracaoLucroPresumido: import('../types').ResultadoCalculo['apuracaoLucroPresumido'] = null

  if (aliquotaAtualOverride != null && aliquotaAtualOverride > 0) {
    aliquotaAtual = aliquotaAtualOverride
    impostoAtualMensal = faturamentoMensal * aliquotaAtual
    fonteAliquota = 'real'
  } else if (regime === 'mei') {
    impostoAtualMensal = MEI_DAS_FIXO[setor.tipo]
    aliquotaAtual = faturamentoMensal > 0 ? impostoAtualMensal / faturamentoMensal : 0
  } else if (regime === 'profissional_liberal') {
    const irpfMensal = calcularIRPF(faturamentoMensal)
    const issMensal  = faturamentoMensal * 0.03
    const inssMensal = calcularINSSAutonomo(faturamentoMensal)
    impostoAtualMensal = irpfMensal + issMensal + inssMensal
    aliquotaAtual = faturamentoMensal > 0 ? impostoAtualMensal / faturamentoMensal : 0
  } else if (regime === 'simples_nacional') {
    const isMisto = anexoSimples2 != null && pctAnexo1 != null && pctAnexo1 > 0 && pctAnexo1 < 100
    aliquotaAtual = isMisto
      ? getAliquotaSimplesNacionalMisto(faturamentoAnual, anexoEfetivoComFatorR!, pctAnexo1! / 100, anexoSimples2!)
      : getAliquotaSimplesNacional(setor.tipo, faturamentoAnual, anexoEfetivoComFatorR)
    impostoAtualMensal = faturamentoMensal * aliquotaAtual
  } else if (regime === 'lucro_presumido') {
    // Carga hoje decomposta por tributo (RIR/2018, Lei 9.249/1995, Lei 9.718/1998):
    // IRPJ 15% × presunção + adicional 10% + CSLL 9% × presunção + PIS/COFINS cumulativo 3,65%
    // + ICMS/ISS pelas alíquotas efetivas informadas no formulário (fallback: média por setor)
    // + INSS patronal 20% × folha (CPP — no Simples já está dentro do DAS)
    const pIRPJ = setor.presuncaoLPIRPJ ?? PRESUNCAO_LP_IRPJ[setor.tipo]
    const pCSLL = setor.presuncaoLPCSLL ?? PRESUNCAO_LP_CSLL[setor.tipo]
    const lucroPresumido = faturamentoMensal * pIRPJ
    const irpjLP          = lucroPresumido * 0.15
    const irpjAdicionalLP = Math.max(0, lucroPresumido - IRPJ_ADICIONAL_LIMIAR) * 0.10
    const csllLP          = faturamentoMensal * pCSLL * 0.09
    const pisCofinsLP     = faturamentoMensal * 0.0365  // cumulativo: PIS 0,65% + COFINS 3%
    // IPI médio 5% para indústria apenas quando o usuário não informou alíquotas próprias
    const ipiLP = setor.tipo === 'industria' && aliquotaICMSEfetiva == null ? faturamentoMensal * 0.05 : 0
    impostoAtualMensal = irpjLP + irpjAdicionalLP + csllLP + pisCofinsLP + icmsAtualMensal + issAtualMensal + ipiLP + contribPrevidenciariaMensal
    aliquotaAtual = faturamentoMensal > 0 ? impostoAtualMensal / faturamentoMensal : 0
    apuracaoLucroPresumido = {
      lucroPresumidoBase: lucroPresumido,
      irpj: irpjLP,
      irpjAdicional: irpjAdicionalLP,
      csll: csllLP,
      pisCofins: pisCofinsLP,
      icms: icmsAtualMensal,
      icmsDebito: icmsDebitoAtualMensal,
      icmsCredito: icmsCreditoAtualMensal,
      iss: issAtualMensal,
      ipi: ipiLP,
      inssPatronal: cppFolhaEmpregados,
      terceiros: terceirosFolhaMensal,
      cppProLabore: cppProLaboreMensal,
      icmsIssInformado: aliquotaICMSEfetiva != null || aliquotaISSEfetiva != null,
      totalImpostos: impostoAtualMensal,
    }
  } else if (regime === 'produtor_rural') {
    // Produtor rural PJ: base LP (presunção 8% comércio/agroindústria); sem IBS/CBS se não-contribuinte
    aliquotaAtual = getAliquotaLucroPresumido(setor.tipo, setor)
    impostoAtualMensal = faturamentoMensal * aliquotaAtual + calcularIRPJAdicional('lucro_presumido', setor.tipo, faturamentoMensal, setor)
    aliquotaAtual = faturamentoMensal > 0 ? impostoAtualMensal / faturamentoMensal : aliquotaAtual
  } else {
    // lucro_real
    const temDadosLR = folhaEmpregadosMensal > 0 || aliquotaICMSEfetiva != null || aliquotaISSEfetiva != null || despesasOperacionaisMensais > 0 || totalProLaboreMensal > 0
    if (temDadosLR) {
      // Cálculo efetivo: base real de IRPJ/CSLL deduzindo folha (+CPP+terceiros), pró-labore (+CPP),
      // despesas, ICMS, ISS e PIS/COFINS não-cumulativo. Todos são dedutíveis do lucro real.
      const pisCofinsAliq   = 0.0925  // PIS 1,65% + COFINS 7,6% não-cumulativos
      const pisCofinsCredito = insumosMensais * pisCofinsAliq
      const pisCofinsDebito  = faturamentoMensal * pisCofinsAliq
      const pisCofinsLiquido = Math.max(0, pisCofinsDebito - pisCofinsCredito)
      const lucroReal = Math.max(0,
        faturamentoMensal - insumosMensais - encargosFolhaEmpregadosMensal - totalProLaboreMensal - cppProLaboreMensal
        - despesasOperacionaisMensais - icmsAtualMensal - issAtualMensal - pisCofinsLiquido
      )
      const irpjBase    = lucroReal * 0.15
      const irpjAdicional = Math.max(0, lucroReal - IRPJ_ADICIONAL_LIMIAR) * 0.10
      const csll        = lucroReal * 0.09
      impostoAtualMensal = irpjBase + irpjAdicional + csll + pisCofinsLiquido + icmsAtualMensal + issAtualMensal + contribPrevidenciariaMensal
      aliquotaAtual = faturamentoMensal > 0 ? impostoAtualMensal / faturamentoMensal : 0
    } else {
      aliquotaAtual = getAliquotaLucroReal(setor.tipo)
      impostoAtualMensal = faturamentoMensal * aliquotaAtual + calcularIRPJAdicional('lucro_real', setor.tipo, faturamentoMensal)
      // Contribuição previdenciária quando não há dados de custo: estimativa via margem
      impostoAtualMensal += contribPrevidenciariaMensal
      aliquotaAtual = faturamentoMensal > 0 ? impostoAtualMensal / faturamentoMensal : aliquotaAtual
    }
  }

  // Alíquota estimada de tabela (sempre calculada para comparativo na UI)
  let aliquotaAtualEstimada: number
  if (regime === 'mei') {
    const das = MEI_DAS_FIXO[setor.tipo]
    aliquotaAtualEstimada = faturamentoMensal > 0 ? das / faturamentoMensal : 0
  } else if (regime === 'profissional_liberal') {
    const irpfMensal = calcularIRPF(faturamentoMensal)
    aliquotaAtualEstimada = faturamentoMensal > 0
      ? (irpfMensal + faturamentoMensal * 0.03 + calcularINSSAutonomo(faturamentoMensal)) / faturamentoMensal
      : 0
  } else if (regime === 'simples_nacional') {
    const isMisto = anexoSimples2 != null && pctAnexo1 != null && pctAnexo1 > 0 && pctAnexo1 < 100
    aliquotaAtualEstimada = isMisto
      ? getAliquotaSimplesNacionalMisto(faturamentoAnual, anexoEfetivoComFatorR!, pctAnexo1! / 100, anexoSimples2!)
      : getAliquotaSimplesNacional(setor.tipo, faturamentoAnual, anexoEfetivoComFatorR)
  } else if (regime === 'lucro_presumido' || regime === 'produtor_rural') {
    aliquotaAtualEstimada = getAliquotaLucroPresumido(setor.tipo, setor)
  } else {
    aliquotaAtualEstimada = getAliquotaLucroReal(setor.tipo)
  }

  const impostoAtualAnual = impostoAtualMensal * 12

  // ── 2. Carga Nova — IVA Dual ────────────────────────────────────────────────
  // Alíquota bruta do setor. Para farmácias (cesta mista), faz a média ponderada:
  // parcela de medicamentos tem 60% de redução (Art. 133); o restante fica na alíquota do setor.
  let aliquotaIVABruta = ALIQUOTA_IVA_PADRAO * (1 - setor.reducao)
  if (setor.vendeMedicamentos && pctMedicamentos > 0) {
    const fracMed = Math.min(1, Math.max(0, pctMedicamentos / 100))
    const aliqMedicamentos = ALIQUOTA_IVA_PADRAO * (1 - 0.60)  // Art. 133: medicamentos 60% de redução
    aliquotaIVABruta = fracMed * aliqMedicamentos + (1 - fracMed) * aliquotaIVABruta
  }
  // Supermercados — cesta mista: parte alíquota zero, parte redução 60%, restante cheia
  if (setor.cestaMista && (pctCestaZero > 0 || pctCestaReduzida > 0)) {
    const fz = Math.min(1, Math.max(0, pctCestaZero / 100))            // Arts. 125/148: alíquota zero
    const fr = Math.min(1 - fz, Math.max(0, pctCestaReduzida / 100))   // Art. 128: redução 60%
    const fc = Math.max(0, 1 - fz - fr)                               // restante: alíquota do setor (cheia)
    const aliqRed60 = ALIQUOTA_IVA_PADRAO * (1 - 0.60)
    aliquotaIVABruta = fz * 0 + fr * aliqRed60 + fc * aliquotaIVABruta
  }

  // Base de cálculo efetiva — aplica redutores quando aplicável
  // Imóveis (Arts. 369-376): base = faturamento × (1 − pctCusto) − redutorSocial
  // Agências de turismo (Art. 418): base = faturamento × (1 − pctRepasse)
  // Vendas ao governo (Art. 441): redutor progressivo 2029-2032
  let baseCalculoEfetiva: number = faturamentoMensal
  if (setor.regimeImobiliario && (pctCustoImovel > 0 || redutorSocialMensal > 0)) {
    baseCalculoEfetiva = Math.max(0,
      faturamentoMensal * (1 - pctCustoImovel / 100) - redutorSocialMensal
    )
  } else if (setor.baseReduzidaRepasse && pctRepasseAgencia > 0) {
    baseCalculoEfetiva = faturamentoMensal * (1 - pctRepasseAgencia / 100)
  }

  // Gorjeta — excluída da base IBS/CBS (Art. 274 §único I LC 214/2025)
  // Aplica apenas para bares/restaurantes; limite legal: até 15% do valor da conta.
  const gorjetaMensal = faturamentoMensal * Math.min(15, Math.max(0, pctGorjeta)) / 100
  if (gorjetaMensal > 0) {
    baseCalculoEfetiva = Math.max(0, baseCalculoEfetiva - gorjetaMensal)
  }

  // Produtor rural não-contribuinte: faturamento < R$3,6M/ano (Art. 164 §1º LC 214/2025)
  const LIMITE_PRODUTOR_RURAL_ANUAL = 3_600_000
  const produtorRuralNaoContribuinte =
    (regime === 'produtor_rural' || setor.produtorRural === true) &&
    faturamentoAnual < LIMITE_PRODUTOR_RURAL_ANUAL

  const cbsSimplesEfetivo: number | null = (() => {
    if (regime !== 'simples_nacional' || anexoEfetivoComFatorR == null) return null
    const isMisto = anexoSimples2 != null && pctAnexo1 != null && pctAnexo1 > 0 && pctAnexo1 < 100
    return isMisto
      ? getCBSSimplesMisto(faturamentoAnual, anexoEfetivoComFatorR, pctAnexo1! / 100, anexoSimples2!)
      : getCBSSimples(anexoEfetivoComFatorR, faturamentoAnual)
  })()

  const ibsSimplesEfetivo: number | null = (() => {
    if (regime !== 'simples_nacional' || anexoEfetivoComFatorR == null) return null
    const isMisto = anexoSimples2 != null && pctAnexo1 != null && pctAnexo1 > 0 && pctAnexo1 < 100
    return isMisto
      ? (pctAnexo1! / 100) * getIBSSimples(anexoEfetivoComFatorR, faturamentoAnual)
        + (1 - pctAnexo1! / 100) * getIBSSimples(anexoSimples2!, faturamentoAnual)
      : getIBSSimples(anexoEfetivoComFatorR, faturamentoAnual)
  })()

  // Taxa CBS típica de fornecedores Simples (Anexo I Faixa 3 — estimativa conservadora)
  // Real = DAS_efetivo × partilha_CBS; varia por anexo/faixa do fornecedor (desconhecido)
  const cbsFornecedorSimples = getCBSSimples('I', Math.min(faturamentoAnual, 720_000))

  const fracSimples = Math.min(1, Math.max(0, pctFornecedoresSimples / 100))
  const aliquotaCreditoEfetiva = fracSimples * cbsFornecedorSimples + (1 - fracSimples) * aliquotaIVABruta
  const creditoInsumosMensal = insumosMensais * aliquotaCreditoEfetiva
  const creditoPerdidoFornecedorSimples = insumosMensais * fracSimples * (aliquotaIVABruta - cbsFornecedorSimples)

  // Crédito presumido — Arts. 168-169 LC 214/2025
  // Produtor rural não-contribuinte: crédito = compras × alíquota que incidiria (insumos agropecuários: 60% redução → 10,6%)
  const ALIQ_PRESUMIDA_PRODUTOR_RURAL  = ALIQUOTA_IVA_PADRAO * (1 - 0.60)  // Anexo IX LC 214/2025: 60% reducao
  // Transportador autônomo PF: crédito = frete × alíquota que incidiria (transporte rodoviário: 40% redução → 15,9%)
  const ALIQ_PRESUMIDA_TRANSP_AUTONOMO = ALIQUOTA_IVA_PADRAO * (1 - 0.40)  // Art. 128 + Anexo II LC 214/2025: 40% redução
  const creditoProdutorRural  = (insumosMensais * pctInsumosProdutorRural / 100) * ALIQ_PRESUMIDA_PRODUTOR_RURAL
  const creditoTranspAutonomo = (insumosMensais * pctFreteAutonomo / 100) * ALIQ_PRESUMIDA_TRANSP_AUTONOMO

  // Art. 108 LC 214/2025 — crédito integral e imediato na aquisição de bens de capital
  // (não amortizado em 48 parcelas como no PIS/COFINS — crédito 100% no mês da compra)
  const creditoCapitalImediato = (investimentoCapitalMensal ?? 0) * aliquotaIVABruta
  // Comparação: quanto o PIS/COFINS creditaria no mesmo mês (9,25% ÷ 48 meses)
  const PISC_ALIQ_NAO_CUMULATIVO = 0.0925
  const creditoCapitalPISCOFINS  = (investimentoCapitalMensal ?? 0) * PISC_ALIQ_NAO_CUMULATIVO / 48
  const ganhoFluxoCaixaCapital   = creditoCapitalImediato - creditoCapitalPISCOFINS

  // Art. 110 LC 214/2025 — alíquota zero: venda de maquinário agrícola para produtor rural
  // e venda de veículos de carga para transportador autônomo PF não-contribuinte
  // O débito IVA nessas vendas = 0; créditos de entradas são mantidos normalmente
  const ivaZeradoVendasRural  = faturamentoMensal * (pctVendasAliqZeroRural  ?? 0) / 100 * aliquotaIVABruta
  const ivaZeradoVendasTransp = faturamentoMensal * (pctVendasAliqZeroTransp ?? 0) / 100 * aliquotaIVABruta

  // Não-cumulatividade ampla — despesas que hoje não geram crédito de PIS/COFINS
  // mas gerarão crédito de IBS/CBS (aluguel, energia, seguros, marketing, serviços adm, TI, etc.)
  const creditoDespesasAdicionais = (despesasCrediteisAdicionais ?? 0) * aliquotaIVABruta

  // Comparativo PIS/COFINS (DAS) vs CBS (IVA Dual) — exclusivo Simples Nacional
  // CBS representa ~33,2% do IVA Dual (8,8% / 26,5% — estimativa de mercado)
  const CBS_SHARE_IVA = 8.8 / 26.5
  const pisCofinsNoDAsMensal = (regime === 'simples_nacional' && cbsSimplesEfetivo != null)
    ? faturamentoMensal * cbsSimplesEfetivo
    : 0

  // Alertas informativos
  const alertaExportadorHabilitavel =
    exportacoesMensais > 0 && faturamentoMensal > 0 &&
    (exportacoesMensais / faturamentoMensal) >= 0.50  // Art. 82 LC 214/2025
  const alertaContratoAdministrativo = (pctVendasGoverno ?? 0) > 0  // Arts. 373-377 LC 214/2025

  const impostoIVABrutoMensal = Math.max(0,
    baseCalculoEfetiva * aliquotaIVABruta - ivaZeradoVendasRural - ivaZeradoVendasTransp
  )

  // Regime Automotivo — crédito presumido CBS (Art. 311 LC 214/2025)
  // Apenas projetos habilitados (Lei 9.440/1997). Percentual sobre vendas no mercado interno
  // com exigência integral da CBS. Reduzido 20%/ano entre 2029-2032; extinto em 2033.
  const PCT_REGIME_AUTOMOTIVO: Record<1 | 2 | 3, number> = {
    1: 0.1160,  // até o 12º mês de fruição
    2: 0.1000,  // do 13º ao 48º mês
    3: 0.0870,  // do 49º ao 60º mês
  }
  const creditoRegimeAutomotivo =
    setor.regimeAutomotivo === true && regimeAutomotivoHabilitado
      ? faturamentoMensal * (PCT_REGIME_AUTOMOTIVO[faseRegimeAutomotivo] ?? 0)
      : 0

  // Zona Franca de Manaus — créditos presumidos IBS e CBS (Art. 450 LC 214/2025)
  // Estimativa da partilha IBS/CBS dentro dos 26,5%: CBS ~8,8% (federal) + IBS ~17,7% (estadual/municipal).
  // A partilha exata depende da alíquota de referência fixada pelo Senado — usada como estimativa, igual aos 26,5%.
  const IBS_SHARE_ESTIMADO = 0.668  // ≈ 17,7 ÷ 26,5
  const PCT_ZFM_IBS: Record<import('../types').TipoBemZFM, number> = {
    consumo_final: 0.55,    // Art. 450 §1º I
    capital:       0.75,    // Art. 450 §1º II
    intermediario: 0.9025,  // Art. 450 §1º III
    informatica:   1.00,    // Art. 450 §1º IV
  }
  const creditoZFMIbs = setor.zfm === true ? impostoIVABrutoMensal * IBS_SHARE_ESTIMADO * PCT_ZFM_IBS[tipoBemZFM] : 0
  const creditoZFMCbs = setor.zfm === true ? faturamentoMensal * 0.02 : 0  // Art. 450 §2º II: 2% sobre o valor da operação

  let impostoIVALiquidoMensal = Math.max(0,
    impostoIVABrutoMensal
    - creditoInsumosMensal
    - creditoProdutorRural
    - creditoTranspAutonomo
    - creditoCapitalImediato
    - creditoDespesasAdicionais
    - creditoRegimeAutomotivo
    - creditoZFMIbs
    - creditoZFMCbs
  )
  // Produtor rural não-contribuinte (Art. 164 §1º LC 214/2025): não recolhe IBS/CBS abaixo de R$3,6M/ano
  if (produtorRuralNaoContribuinte) impostoIVALiquidoMensal = 0

  const impostoIVALiquidoAnual = impostoIVALiquidoMensal * 12
  const cbsIVADualMensal = impostoIVALiquidoMensal * CBS_SHARE_IVA

  // Imposto Seletivo (Anexo XVII + Arts. 419-423 LC 214/2025)
  const alertaImpostoSeletivo = setor.impostSeletivo === true

  // Cashback ao consumidor de baixa renda (Art. 118 LC 214/2025)
  const alertaCashback = setor.cashbackConsumidor === true

  // Bens de capital usados — venda de ativo imobilizado (Arts. 406-407 LC 214/2025)
  // IBS/CBS incide à alíquota plena do setor (não há redução específica na transição para vendas do imobilizado)
  const ivaVendaImobilizado = (vendaImobilizadoMensal ?? 0) * aliquotaIVABruta

  const aliquotaIVAEfetiva = faturamentoMensal > 0
    ? impostoIVALiquidoMensal / faturamentoMensal
    : 0

  // ── 3a. Carga total pós-reforma (CBS/IBS + IRPJ/CSLL + INSS patronal) ──────
  // impostoIVALiquidoMensal só substitui ICMS/ISS/PIS-COFINS — IRPJ, CSLL e INSS
  // patronal continuam existindo após 2033 e precisam ser somados para refletir
  // a carga tributária real pós-reforma em LP e LR.
  const irpjCsllPersistenteMensal = (() => {
    if (regime === 'lucro_presumido') {
      const pIRPJ = setor.presuncaoLPIRPJ ?? PRESUNCAO_LP_IRPJ[setor.tipo]
      const pCSLL = setor.presuncaoLPCSLL ?? PRESUNCAO_LP_CSLL[setor.tipo]
      const lucro = faturamentoMensal * pIRPJ
      return lucro * 0.15 + Math.max(0, lucro - IRPJ_ADICIONAL_LIMIAR) * 0.10 + faturamentoMensal * pCSLL * 0.09
    }
    if (regime === 'lucro_real') {
      const temDadosLR = folhaEmpregadosMensal > 0 || aliquotaICMSEfetiva != null || aliquotaISSEfetiva != null || despesasOperacionaisMensais > 0 || totalProLaboreMensal > 0
      if (temDadosLR) {
        // Pós-reforma (2033): ICMS/ISS/PIS-COFINS extintos; IBS/CBS é "por fora" e não
        // reduz a base de IRPJ/CSLL — o lucro tributável fica MAIOR que o atual.
        const lucroReal = Math.max(0,
          faturamentoMensal - insumosMensais - encargosFolhaEmpregadosMensal - totalProLaboreMensal - cppProLaboreMensal - despesasOperacionaisMensais
        )
        return lucroReal * 0.15 + Math.max(0, lucroReal - IRPJ_ADICIONAL_LIMIAR) * 0.10 + lucroReal * 0.09
      }
      // Sem dados reais: estimativa via margem presumida (mesma base do Lucro Presumido)
      const pIRPJ = PRESUNCAO_LP_IRPJ[setor.tipo]
      const pCSLL = PRESUNCAO_LP_CSLL[setor.tipo]
      const lucro = faturamentoMensal * pIRPJ
      return lucro * 0.15 + Math.max(0, lucro - IRPJ_ADICIONAL_LIMIAR) * 0.10 + faturamentoMensal * pCSLL * 0.09
    }
    return 0
  })()

  // Contribuição previdenciária (folha + terceiros + pró-labore) persiste após a reforma
  const cargaTotalReformaMensal = ehLPouLR
    ? impostoIVALiquidoMensal + irpjCsllPersistenteMensal + contribPrevidenciariaMensal
    : impostoIVALiquidoMensal

  // ── 3. Projeção de Transição por Ano ────────────────────────────────────────
  // Arts. 501 (ICMS) e 508 (ISS) LC 214/2025: redução de 10%/ano de 2029 a 2032 (base: 31/12/2028).
  // 2027: CBS substitui PIS/COFINS. 2033: ICMS e ISS extintos; IVA Dual (CBS+IBS) pleno.
  // Simples Nacional/MEI: DAS total constante durante toda a transição (partilha interna rebalanceia).
  // Redutor governo (Art. 349 III LC 214 — estimativa, valores fixados anualmente pelo Senado):
  const REDUTOR_GOVERNO: Record<number, number> = { 2029: 0.10, 2030: 0.20, 2031: 0.30, 2032: 0.40 }
  const fracGoverno = Math.min(1, Math.max(0, pctVendasGoverno / 100))

  // Componente ICMS/ISS da carga atual: base para aplicar a redução per Arts. 501/508
  // LP/LR: usa ICMS/ISS já apurados (alíquotas informadas ou médias); demais regimes usam a estimativa
  const icmsIssMensalEstimado = ehLPouLR
    ? icmsAtualMensal + issAtualMensal
    : estimarICMSISS(regime, setor.tipo, faturamentoMensal, insumosMensais, uf)
  const baseFixaMensal = impostoAtualMensal - icmsIssMensalEstimado  // IRPJ/CSLL + PIS/COFINS (este swap→CBS neutro)

  // Decomposição da carga atual (LP sempre; LR quando há dados efetivos) — permite projetar
  // a transição pelo CONJUNTO de tributos, convergindo de impostoAtualMensal (2026) para
  // cargaTotalReformaMensal (2033) sem dupla contagem do PIS/COFINS→CBS.
  const temDecomposicaoLPLR =
    regime === 'lucro_presumido' ||
    (regime === 'lucro_real' && (folhaEmpregadosMensal > 0 || aliquotaICMSEfetiva != null || aliquotaISSEfetiva != null || despesasOperacionaisMensais > 0 || totalProLaboreMensal > 0))
  const pisCofinsHojeComp = regime === 'lucro_presumido'
    ? faturamentoMensal * 0.0365
    : Math.max(0, (faturamentoMensal - insumosMensais) * 0.0925)
  const icmsIssHojeComp = icmsAtualMensal + issAtualMensal + (apuracaoLucroPresumido?.ipi ?? 0)
  const irpjCsllHojeComp = Math.max(0, impostoAtualMensal - pisCofinsHojeComp - icmsIssHojeComp - contribPrevidenciariaMensal)

  const anosProjecao = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]
  const projecaoAnos: ProjecaoAno[] = anosProjecao.map(ano => {
    const reducaoAnual = REDUCAO_ICMS_ISS[ano] ?? 0
    const redutorGov = fracGoverno * (REDUTOR_GOVERNO[ano] ?? 0)
    const impostoIVAAjustado = impostoIVALiquidoMensal * (1 - redutorGov)

    if (temDecomposicaoLPLR) {
      // Modelo por componentes (alinhado à carga total do comparador):
      // • PIS/COFINS → extinto em 2027, substituído pela CBS (fatia federal do IVA)
      // • ICMS/ISS/IPI → reduzem 10%/ano 2029-2032 e extinguem em 2033 (Arts. 501/508)
      // • IBS (fatia estadual/municipal do IVA) cresce na mesma proporção
      // • IRPJ/CSLL migram da base atual para a base pós-reforma conforme a transição
      // • Contribuição previdenciária constante (não é substituída)
      const pisCofinsAno = ano >= 2027 ? 0 : pisCofinsHojeComp
      const cbsAno       = ano >= 2027 ? impostoIVAAjustado * CBS_SHARE_IVA : 0
      const icmsIssAno   = icmsIssHojeComp * (1 - reducaoAnual)
      const ibsAno       = impostoIVAAjustado * (1 - CBS_SHARE_IVA) * reducaoAnual
      const irpjCsllAno  = irpjCsllHojeComp + (irpjCsllPersistenteMensal - irpjCsllHojeComp) * reducaoAnual
      const impostoMensal = pisCofinsAno + cbsAno + icmsIssAno + ibsAno + irpjCsllAno + contribPrevidenciariaMensal

      const parcelaAtual = pisCofinsAno + icmsIssAno + irpjCsllAno + contribPrevidenciariaMensal
      const parcelaNova  = cbsAno + ibsAno
      return {
        ano,
        impostoMensal,
        impostoAnual: impostoMensal * 12,
        parcelaAtual,
        parcelaAtualAnual: parcelaAtual * 12,
        parcelaNovaAnual:  parcelaNova * 12,
        aliquotaEfetiva: faturamentoMensal > 0 ? impostoMensal / faturamentoMensal : 0,
      }
    }

    // Modelo legado (SN/MEI/PF/produtor rural e LR sem dados): ICMS/ISS reduzem
    // per Arts. 501/508; IBS cresce na mesma proporção; demais tributos constantes.
    const icmsIssResidual = icmsIssMensalEstimado * (1 - reducaoAnual)
    const ibsProporcional  = impostoIVAAjustado   * reducaoAnual
    const impostoMensal    = baseFixaMensal + icmsIssResidual + ibsProporcional

    const parcelaAtual = baseFixaMensal + icmsIssResidual
    const parcelaNova  = ibsProporcional
    return {
      ano,
      impostoMensal,
      impostoAnual: impostoMensal * 12,
      parcelaAtual,
      parcelaAtualAnual: parcelaAtual * 12,
      parcelaNovaAnual:  parcelaNova * 12,
      aliquotaEfetiva: faturamentoMensal > 0 ? impostoMensal / faturamentoMensal : 0,
    }
  })

  // ── 4. Análise Comparativa e Alertas ────────────────────────────────────────
  const variacaoAbsolutaMensal = cargaTotalReformaMensal - impostoAtualMensal
  const variacaoPercentual = impostoAtualMensal > 0
    ? (variacaoAbsolutaMensal / impostoAtualMensal) * 100
    : 0

  // Reajuste de preço para manter a mesma margem líquida: compara alíquotas do CONJUNTO
  // de tributos (hoje vs pós-reforma), não apenas o IVA isolado.
  const aliquotaTotalReforma = faturamentoMensal > 0 ? cargaTotalReformaMensal / faturamentoMensal : 0
  let reajustePrecoNecessario = 0
  if (aliquotaTotalReforma > aliquotaAtual && aliquotaTotalReforma < 1) {
    reajustePrecoNecessario = ((1 - aliquotaAtual) / (1 - aliquotaTotalReforma) - 1) * 100
  }

  // ── 5. Análise do Simples Nacional Híbrido / MEI Híbrido ────────────────────
  const analiseSimplesHibrido: AnaliseSimplesHibrido | null =
    (regime === 'simples_nacional' || regime === 'mei') &&
    (perfilClientes === 'b2b' || perfilClientes === 'misto')
      ? calcularSimplesHibrido(faturamentoMensal, insumosMensais, impostoAtualMensal, aliquotaIVABruta, fracClientesPJ)
      : null

  // ── 6. Análise do Grupo Societário (Simples/MEI) ────────────────────────────
  const analiseGrupoSimples: AnaliseGrupoSimples | null =
    (regime === 'simples_nacional' || regime === 'mei') && empresasGrupo.length > 0
      ? analisarGrupoSimples(faturamentoMensal, empresasGrupo)
      : null

  // ── 7. Alertas específicos MEI ──────────────────────────────────────────────
  const alertaMEI: AlertaMEI | null = regime === 'mei' ? {
    acimaDaFaixa: faturamentoMensal > LIMITE_MEI_MENSAL,
    faturamentoAnualProjetado: faturamentoAnual,
    dasFixoMensal: MEI_DAS_FIXO[setor.tipo],
    limiteAnual: LIMITE_MEI_ANUAL,
    limitePercentual: Math.min(100, (faturamentoAnual / LIMITE_MEI_ANUAL) * 100),
  } : null

  // ── 8. Projeção IVA mês a mês com dados reais (quando disponível) ──────────
  const projecaoMesAMes: ProjecaoMes[] | null = dadosMensais
    ? calcularProjecaoMesAMes(dadosMensais, aliquotaIVABruta)
    : null

  return {
    regime,
    setor,
    faturamentoMensal,
    faturamentoAnual,
    insumosMensais,
    exportacoesMensais,
    perfilClientes,
    fracClientesPJ,
    setorVedadoSimples,
    dadosMensais,

    // Ecoa os dados de entrada para que o comparador de regimes recalcule LP/LR
    // com o mesmo conjunto completo de tributos (folha, ICMS/ISS, despesas, pró-labore).
    folhaPagamentoLRMensal,
    folhaMensal,
    aliquotaICMSEfetiva,
    aliquotaISSEfetiva,
    despesasOperacionaisMensais,
    sociosAdministradores,
    pctClientesPJ,

    aliquotaAtual,
    aliquotaAtualEstimada,
    fonteAliquota,
    impostoAtualMensal,
    impostoAtualAnual,
    irpjAdicionalMensal: calcularIRPJAdicional(regime, setor.tipo, faturamentoMensal, setor),
    inssAutonomoMensal: regime === 'profissional_liberal' ? calcularINSSAutonomo(faturamentoMensal) : 0,
    anexoSimples: anexoEfetivoComFatorR,
    anexoSimples2: anexoSimples2 ?? undefined,
    pctAnexo1: pctAnexo1 ?? undefined,
    cbsSimplesEfetivo,
    ibsSimplesEfetivo,
    cenarioHibridoVerdadeiro: (() => {
      if (regime !== 'simples_nacional' || cbsSimplesEfetivo == null || ibsSimplesEfetivo == null) return null
      // DAS reduzido: remove CBS e IBS internos — fica só IRPJ+CSLL+CPP
      const aliquotaDasReduzido = Math.max(0, aliquotaAtual - cbsSimplesEfetivo - ibsSimplesEfetivo)
      const dasReduzidoMensal = faturamentoMensal * aliquotaDasReduzido
      const totalMensal = dasReduzidoMensal + impostoIVALiquidoMensal
      return {
        aliquotaDasReduzido,
        dasReduzidoMensal,
        ibsCBSBrutoMensal: impostoIVABrutoMensal,
        creditoMensal: creditoInsumosMensal,
        ibsCBSLiquidoMensal: impostoIVALiquidoMensal,
        totalMensal,
        aliquotaEfetiva: faturamentoMensal > 0 ? totalMensal / faturamentoMensal : 0,
        custoAdicionalVsSimples: totalMensal - impostoAtualMensal,
      }
    })(),
    baseCalculoEfetiva,
    pctFornecedoresSimples,
    creditoPerdidoFornecedorSimples,
    analiseProlabore: (regime === 'lucro_presumido' || regime === 'lucro_real') && sociosAdministradores.length > 0
      ? calcularProlabore(sociosAdministradores, regime as 'lucro_presumido' | 'lucro_real')
      : null,

    aliquotaIVABruta,
    aliquotaIVAEfetiva,
    impostoIVABrutoMensal,
    creditoInsumosMensal,
    impostoIVALiquidoMensal,
    impostoIVALiquidoAnual,

    variacaoAbsolutaMensal,
    variacaoPercentual,
    reajustePrecoNecessario,

    projecaoAnos,
    analiseSimplesHibrido,
    alertaMEI,
    projecaoMesAMes,
    analiseGrupoSimples,
    analiseHolding,
    analiseFatorR,
    nomePrincipal,
    analiseICMS: uf ? calcularICMS(regime, uf, faturamentoMensal, insumosMensais) : null,
    gorjetaMensal,
    creditoProdutorRural,
    creditoTranspAutonomo,
    alertaImpostoSeletivo,
    produtorRuralNaoContribuinte,
    ivaVendaImobilizado,
    creditoCapitalImediato,
    creditoCapitalPISCOFINS,
    ganhoFluxoCaixaCapital,
    ivaZeradoVendasRural,
    ivaZeradoVendasTransp,
    creditoDespesasAdicionais,
    alertaExportadorHabilitavel,
    alertaContratoAdministrativo,
    alertaCashback,
    creditoRegimeAutomotivo,
    creditoZFMIbs,
    creditoZFMCbs,
    pisCofinsNoDAsMensal,
    cbsIVADualMensal,
    irpjCsllLPMensal: (() => {
      if (regime !== 'simples_nacional') return 0
      const anexoParaTipo = (a: import('../types').AnexoSimples): TipoSetor =>
        a === 'I' ? 'comercio' : a === 'II' ? 'industria' : 'servico'
      // Misto: cada parte usa presunção padrão do seu anexo
      const calcAnexo = (a: import('../types').AnexoSimples, receita: number) => {
        const tipo = anexoParaTipo(a)
        const pIRPJ = PRESUNCAO_LP_IRPJ[tipo]
        const pCSLL = PRESUNCAO_LP_CSLL[tipo]
        const lucro = receita * pIRPJ
        return lucro * 0.15 + Math.max(0, lucro - IRPJ_ADICIONAL_LIMIAR) * 0.10 + receita * pCSLL * 0.09
      }
      const isMisto = anexoSimples2 != null && pctAnexo1 != null && pctAnexo1 > 0 && pctAnexo1 < 100
      if (isMisto) {
        const frac1 = pctAnexo1! / 100
        return calcAnexo(anexoEfetivoComFatorR!, faturamentoMensal * frac1)
             + calcAnexo(anexoSimples2!, faturamentoMensal * (1 - frac1))
      }
      // Anexo único: respeita override de presunção do setor (ex: hospitais com 8%)
      const pIRPJ = setor.presuncaoLPIRPJ ?? PRESUNCAO_LP_IRPJ[setor.tipo]
      const pCSLL = setor.presuncaoLPCSLL ?? PRESUNCAO_LP_CSLL[setor.tipo]
      const lucro = faturamentoMensal * pIRPJ
      return lucro * 0.15 + Math.max(0, lucro - IRPJ_ADICIONAL_LIMIAR) * 0.10 + faturamentoMensal * pCSLL * 0.09
    })(),

    inssPatronalFolhaMensal: cppFolhaEmpregados,
    terceirosFolhaMensal,
    cppProLaboreMensal,
    contribPrevidenciariaMensal,
    icmsAtualMensal,
    issAtualMensal,

    irpjCsllPersistenteMensal,
    cargaTotalReformaMensal,
    apuracaoLucroPresumido,

    apuracaoLucroReal: (() => {
      if (regime !== 'lucro_real') return null
      const temDadosLR = folhaEmpregadosMensal > 0 || aliquotaICMSEfetiva != null || aliquotaISSEfetiva != null || despesasOperacionaisMensais > 0 || totalProLaboreMensal > 0
      if (!temDadosLR) return null
      const pisCofinsAliq    = 0.0925
      const pisCofinsCredito = insumosMensais * pisCofinsAliq
      const pisCofinsDebito  = faturamentoMensal * pisCofinsAliq
      const pisCofinsLiquido = Math.max(0, pisCofinsDebito - pisCofinsCredito)
      const lucroRealBase  = Math.max(0,
        faturamentoMensal - insumosMensais - encargosFolhaEmpregadosMensal - totalProLaboreMensal - cppProLaboreMensal
        - despesasOperacionaisMensais - icmsAtualMensal - issAtualMensal - pisCofinsLiquido
      )
      const irpj = lucroRealBase * 0.15
      const irpjAdicional = Math.max(0, lucroRealBase - IRPJ_ADICIONAL_LIMIAR) * 0.10
      const csll = lucroRealBase * 0.09
      return {
        pisCofinsLiquido,
        icmsLiquido: icmsAtualMensal,
        icmsDebito: icmsDebitoAtualMensal,
        icmsCredito: icmsCreditoAtualMensal,
        issLiquido: issAtualMensal,
        inssPatronal: cppFolhaEmpregados,
        terceiros: terceirosFolhaMensal,
        cppProLabore: cppProLaboreMensal,
        proLabore: totalProLaboreMensal,
        folhaPagamento: folhaEmpregadosMensal,
        despesasOperacionais: despesasOperacionaisMensais,
        lucroRealBase,
        irpj,
        irpjAdicional,
        csll,
        totalImpostos: irpj + irpjAdicional + csll + pisCofinsLiquido + icmsAtualMensal + issAtualMensal + contribPrevidenciariaMensal,
      }
    })(),
  }
}

// ─── Projeção mês a mês usando dados reais dos 12 meses ─────────────────────

function calcularProjecaoMesAMes(dadosMensais: DadosMes[], aliquotaIVABruta: number): ProjecaoMes[] {
  return dadosMensais.map(m => {
    const ivaCredito = m.insumos * aliquotaIVABruta
    const ivaDebito = m.faturamento * aliquotaIVABruta
    const ivaCreditoExportacao = (m.exportacoes ?? 0) * aliquotaIVABruta
    const ivaLiquido = Math.max(0, ivaDebito - ivaCredito - ivaCreditoExportacao)
    const aliquotaEfetivaReal = m.faturamento > 0 && m.impostos > 0
      ? m.impostos / m.faturamento
      : null
    return {
      label: m.label,
      faturamento: m.faturamento,
      insumos: m.insumos,
      impostosReais: m.impostos,
      exportacoes: m.exportacoes ?? 0,
      ivaDebito,
      ivaCredito,
      ivaLiquido,
      aliquotaEfetivaReal,
      aliquotaIVAEfetiva: m.faturamento > 0 ? ivaLiquido / m.faturamento : 0,
    }
  })
}

// ─── Análise do Simples Nacional Híbrido ────────────────────────────────────

/**
 * Avalia se vale optar pelo "Simples Nacional Híbrido":
 * a empresa paga CBS e IBS por fora do DAS para dar crédito integral a clientes B2B.
 */
function calcularSimplesHibrido(
  faturamentoMensal: number,
  insumosMensais: number,
  impostoAtualMensal: number,
  aliquotaIVABruta: number,
  fracClientesPJ: number,   // fração das vendas a PJ — só clientes PJ aproveitam o crédito
): AnaliseSimplesHibrido {
  const creditoInsumos = insumosMensais * aliquotaIVABruta
  const ivaHibridoLiquido = Math.max(0, faturamentoMensal * aliquotaIVABruta - creditoInsumos)

  const custoAdicionalMensal = ivaHibridoLiquido - impostoAtualMensal
  // Só a parcela vendida a PJ gera crédito aproveitável ao cliente
  const creditoDisponibilizadoAoCliente = faturamentoMensal * aliquotaIVABruta * fracClientesPJ
  const vale = creditoDisponibilizadoAoCliente >= custoAdicionalMensal

  return {
    vale,
    ivaHibridoLiquido,
    custoAdicionalMensal,
    creditoDisponibilizadoAoCliente,
    aliquotaIVABruta,
  }
}

// ─── Comparador de todos os regimes ─────────────────────────────────────────

/**
 * Roda calcularTodosOsCenarios para os 3 regimes tributários (+ MEI/PF se aplicável)
 * com os mesmos dados financeiros, permitindo comparação lado a lado.
 */
export function calcularTodosOsRegimes(dados: DadosEntrada): ResultadoComparativo[] {
  const LIMITE_SIMPLES_ANUAL = 4_800_000
  const faturamentoAnual = dados.faturamentoMensal * 12

  const REGIMES_BASE: TipoRegime[] = ['simples_nacional', 'lucro_presumido', 'lucro_real']
  const regimeAtual = dados.regime
  const regimesExtras: TipoRegime[] = (['mei', 'profissional_liberal'] as TipoRegime[]).includes(regimeAtual) ? [regimeAtual] : []
  const REGIMES: TipoRegime[] = [...new Set([...REGIMES_BASE, ...regimesExtras])]

  const resultados = REGIMES.map(regime => {
    const override = regime === regimeAtual ? (dados.aliquotaAtualOverride ?? null) : null
    return calcularTodosOsCenarios({
      ...dados,
      regime,
      aliquotaAtualOverride: override,
      dadosMensais: null,
    })
  })

  const acimaDaFaixaSimples = faturamentoAnual > LIMITE_SIMPLES_ANUAL
  const acimaDaFaixaMEI     = faturamentoAnual > LIMITE_MEI_ANUAL

  // Um regime é INAPLICÁVEL quando a empresa não pode optar por ele:
  // Simples acima do limite OU vedado por atividade; MEI acima do limite.
  const ehInaplicavel = (r: ResultadoCalculo): boolean =>
    (r.regime === 'simples_nacional' && (acimaDaFaixaSimples || r.setorVedadoSimples)) ||
    (r.regime === 'mei' && acimaDaFaixaMEI)

  // "Melhor" é sempre pelo CONJUNTO de tributos, não por um imposto isolado, e SÓ entre
  // os regimes aplicáveis — um regime que a empresa não pode adotar nunca é "melhor".
  const aplicaveis = resultados.filter(r => !ehInaplicavel(r))
  const menorAtual = aplicaveis.length ? Math.min(...aplicaveis.map(r => r.impostoAtualMensal)) : Infinity
  const menorIVA   = aplicaveis.length ? Math.min(...aplicaveis.map(r => r.cargaTotalReformaMensal)) : Infinity
  const menorDelta = aplicaveis.length ? Math.min(...aplicaveis.map(r => Math.abs(r.variacaoAbsolutaMensal))) : Infinity

  return resultados.map(r => {
    const inaplicavel = ehInaplicavel(r)
    return {
      ...r,
      melhorAtual:  !inaplicavel && r.impostoAtualMensal === menorAtual,
      melhorIVA:    !inaplicavel && r.cargaTotalReformaMensal === menorIVA,
      menorImpacto: !inaplicavel && Math.abs(r.variacaoAbsolutaMensal) === menorDelta,
      inaplicavel,
      acimaDaFaixaSimples,
      acimaDaFaixaMEI,
      vedadoSimplesAtividade: r.regime === 'simples_nacional' && r.setorVedadoSimples,
    }
  })
}

// ─── Simulador de Crescimento de Faturamento ────────────────────────────────

/**
 * Gera uma curva de impacto tributário para diferentes níveis de faturamento.
 */
export function calcularCurvaCrescimento(dados: DadosEntrada, percentuais: number[]): PontoCrescimento[] {
  const LIMITE_SIMPLES_ANUAL = 4_800_000

  return percentuais.map(pct => {
    const fator = 1 + pct / 100
    const fatAjustado = dados.faturamentoMensal * fator
    const insAjustado = dados.insumosMensais * fator

    // Folha permanece fixa ao crescer faturamento (cenário realista para Fator R):
    // quando faturamento cresce mas contratações não acompanham, o Fator R cai
    // e a empresa pode migrar de Anexo III → V no Simples Nacional.
    const resultado = calcularTodosOsCenarios({
      ...dados,
      faturamentoMensal: fatAjustado,
      insumosMensais: insAjustado,
      folhaMensal: dados.folhaMensal ?? 0,  // folha NÃO escala — mantém valor absoluto
      aliquotaAtualOverride: null,
      dadosMensais: null,
    })

    const fatAnual = fatAjustado * 12
    return {
      pct,
      faturamentoMensal: fatAjustado,
      faturamentoAnual: fatAnual,
      impostoAtualMensal: resultado.impostoAtualMensal,
      // Carga total pós-reforma (IVA + IRPJ/CSLL + contrib. prev.) — comparável com impostoAtualMensal
      impostoIVAMensal: resultado.cargaTotalReformaMensal,
      aliquotaAtual: resultado.aliquotaAtual,
      aliquotaIVA: fatAjustado > 0 ? resultado.cargaTotalReformaMensal / fatAjustado : 0,
      acimaDaFaixaSimples: fatAnual > LIMITE_SIMPLES_ANUAL,
    }
  })
}

// ─── Utilitários de formatação ───────────────────────────────────────────────

export const fmt = {
  /** Formata número como moeda BRL */
  moeda: (valor: number): string =>
    isFinite(valor)
      ? valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
      : 'R$ —',

  /** Formata número como percentual com N casas decimais */
  pct: (valor: number, casas = 2): string =>
    `${(valor * 100).toFixed(casas).replace('.', ',')}%`,

  /** Formata número com separador de milhar */
  num: (valor: number): string => valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 }),
}
