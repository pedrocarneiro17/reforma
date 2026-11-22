/**
 * Ferramentas do assistente de perguntas — a ponte entre a IA e o motor de cálculo.
 *
 * Regra de ouro: a IA NUNCA calcula imposto. Ela traduz a pergunta em chamadas a estas funções e
 * explica o resultado. Todo número que ela cita sai de calcularTodosOsCenarios / calcularTodosOsRegimes /
 * calcularCurvaCrescimento, com as mesmas regras e os mesmos testes do simulador.
 *
 * Este arquivo não depende de DOM, nem de rede, nem do sistema de arquivos. O servidor o carrega a
 * partir do pacote gerado por `npm run build:engine` (server/gerado/ferramentas.mjs).
 */
import {
  ALERTA_DEFINICAO_ALIQUOTA,
  ALIQUOTA_IVA_PADRAO,
  calcularCurvaCrescimento,
  calcularTodosOsCenarios,
  calcularTodosOsRegimes,
} from '../engine/calculadora'
import { SETORES } from '../data/setores'
import type { AnexoSimples, DadosEntrada, PerfilClientes, ResultadoCalculo, TipoRegime } from '../types'

// ─── Definição das ferramentas (formato da API de mensagens) ─────────────────

const REGIMES: TipoRegime[] = ['simples_nacional', 'lucro_presumido', 'lucro_real', 'mei', 'profissional_liberal', 'produtor_rural']
const ANEXOS: AnexoSimples[] = ['I', 'II', 'III', 'IV', 'V']
const PERFIS: PerfilClientes[] = ['b2c', 'b2b', 'misto']

const PROPRIEDADES_EMPRESA = {
  regime: { type: 'string', enum: REGIMES, description: 'Regime tributário ATUAL da empresa.' },
  setor: { type: 'string', description: 'Código do setor (campo "value" de listar_setores). Obrigatório: use listar_setores para achar o código certo.' },
  faturamentoMensal: { type: 'number', description: 'Faturamento médio mensal em reais (receita bruta).' },
  insumosMensais: { type: 'number', description: 'Compras e insumos mensais em reais que geram crédito (0 se não souber).' },
  perfilClientes: { type: 'string', enum: PERFIS, description: 'b2c = vende a consumidor final; b2b = vende a empresas; misto = os dois.' },
  pctClientesPJ: { type: 'number', description: 'Só para perfil misto: % das vendas feitas a empresas (0 a 100).' },
  uf: { type: 'string', description: 'Sigla do estado (ex.: MG). Opcional; refina o ICMS.' },
  exportacoesMensais: { type: 'number', description: 'Parte do faturamento mensal que é exportação (imune de IBS/CBS).' },
  anexoSimples: { type: 'string', enum: ANEXOS, description: 'Simples: anexo da atividade principal, quando não for o padrão do setor.' },
  anexoSimples2: { type: 'string', enum: ANEXOS, description: 'Simples com duas atividades: segundo anexo.' },
  pctAnexo1: { type: 'number', description: 'Simples com duas atividades: % da receita no primeiro anexo (0 a 100).' },
  folhaMensal: { type: 'number', description: 'Folha de pagamento mensal (inclui pró-labore). Define o Fator R no Simples.' },
  pctFornecedoresSimples: { type: 'number', description: '% das compras feitas de fornecedores do Simples Nacional (geram crédito menor).' },
  pctReceitaAliquotaCheia: { type: 'number', description: 'Hotelaria e restaurantes: % da receita em bebidas alcoólicas e itens de terceiros sem preparo (alíquota cheia, sem os 40% de redução).' },
  pctMedicamentos: { type: 'number', description: 'Farmácias: % da receita em medicamentos.' },
  pctGorjeta: { type: 'number', description: 'Restaurantes: % de gorjeta repassada integralmente (até 15%).' },
  pctVendasGoverno: { type: 'number', description: '% das vendas feitas a órgãos públicos.' },
  despesasCrediteisAdicionais: { type: 'number', description: 'R$/mês em despesas (aluguel, energia, TI...) que passam a gerar crédito.' },
  despesasOperacionaisMensais: { type: 'number', description: 'Lucro Real: despesas operacionais mensais dedutíveis.' },
  folhaPagamentoLRMensal: { type: 'number', description: 'Lucro Presumido/Real: folha de empregados mensal.' },
  aliquotaICMSEfetiva: { type: 'number', description: 'Alíquota efetiva de ICMS informada (0,08 = 8%).' },
  aliquotaISSEfetiva: { type: 'number', description: 'Alíquota de ISS informada (0,03 = 3%).' },
  vendaImobilizadoMensal: { type: 'number', description: 'Venda mensal de bens do ativo imobilizado.' },
  investimentoCapitalMensal: { type: 'number', description: 'Investimento mensal em bens de capital.' },
} as const

const OBRIGATORIOS = ['regime', 'setor', 'faturamentoMensal']

/** Campos da empresa que o assistente aceita (também usados para filtrar o contexto vindo da tela). */
export const CAMPOS_EMPRESA: string[] = Object.keys(PROPRIEDADES_EMPRESA)

export const FERRAMENTAS_MOTOR = [
  {
    name: 'listar_setores',
    description: 'Procura o código do setor de atuação por palavra (ex.: "hotel", "advocacia", "farmácia"). Devolve até 15 setores com código, nome, grupo e redução de alíquota. Use sempre antes de calcular, para obter o código válido.',
    input_schema: {
      type: 'object',
      properties: { busca: { type: 'string', description: 'Palavra ou trecho do nome do setor.' } },
      required: ['busca'],
    },
  },
  {
    name: 'calcular_cenarios',
    description: 'Roda o motor do simulador para UMA empresa: carga tributária de hoje, carga pós-reforma em 2033, projeção ano a ano (2026–2033), IBS/CBS bruto, crédito e líquido, cenário híbrido do Simples e alertas. É a única fonte de números do assistente.',
    input_schema: { type: 'object', properties: PROPRIEDADES_EMPRESA, required: OBRIGATORIOS },
  },
  {
    name: 'comparar_regimes',
    description: 'Compara Simples Nacional, Lucro Presumido e Lucro Real (e MEI/profissional liberal quando couber) com os mesmos dados. Indica qual regime é inaplicável e qual tem menor carga hoje e em 2033.',
    input_schema: { type: 'object', properties: PROPRIEDADES_EMPRESA, required: OBRIGATORIOS },
  },
  {
    name: 'simular_crescimento',
    description: 'Mostra como a carga tributária muda se o faturamento variar (ex.: [-20, 0, 50, 100] = menos 20%, igual, mais 50%, dobro). Insumos e exportações crescem junto; a folha fica fixa. Aponta quando passa dos limites do Simples.',
    input_schema: {
      type: 'object',
      properties: {
        ...PROPRIEDADES_EMPRESA,
        percentuais: { type: 'array', items: { type: 'number' }, description: 'Variações do faturamento em %, de -90 a 1000. Máximo de 12 pontos.' },
      },
      required: [...OBRIGATORIOS, 'percentuais'],
    },
  },
] as const

// ─── Validação da entrada (a IA pode errar tipos; o motor só recebe o que passa aqui) ───

const arred = (n: number) => Math.round(n * 100) / 100
const pct = (frac: number) => Math.round(frac * 10000) / 100   // 0,1559 → 15,59

function numero(v: unknown, nome: string, min = 0, max = 1e12): number | undefined {
  if (v === undefined || v === null) return undefined
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`"${nome}" deve ser um número.`)
  if (v < min || v > max) throw new Error(`"${nome}" deve estar entre ${min} e ${max}.`)
  return v
}

function opcao<T extends string>(v: unknown, nome: string, validos: readonly T[]): T | undefined {
  if (v === undefined || v === null) return undefined
  if (typeof v !== 'string' || !(validos as readonly string[]).includes(v)) {
    throw new Error(`"${nome}" deve ser um de: ${validos.join(', ')}.`)
  }
  return v as T
}

/** Converte a entrada da ferramenta em DadosEntrada, recusando o que não é válido. */
export function montarDados(entrada: Record<string, unknown>): DadosEntrada {
  const regime = opcao(entrada.regime, 'regime', REGIMES)
  if (!regime) throw new Error('Informe o regime tributário atual.')
  const codigoSetor = typeof entrada.setor === 'string' ? entrada.setor : ''
  const setor = SETORES.find(s => s.value === codigoSetor)
  if (!setor) throw new Error(`Setor "${codigoSetor}" não existe. Use listar_setores para achar o código.`)
  const faturamentoMensal = numero(entrada.faturamentoMensal, 'faturamentoMensal', 0)
  if (faturamentoMensal === undefined || faturamentoMensal <= 0) throw new Error('Informe um faturamento mensal maior que zero.')

  const dados: DadosEntrada = {
    regime,
    setor,
    faturamentoMensal,
    insumosMensais: numero(entrada.insumosMensais, 'insumosMensais') ?? 0,
    perfilClientes: opcao(entrada.perfilClientes, 'perfilClientes', PERFIS) ?? 'b2c',
  }
  const set = <K extends keyof DadosEntrada>(chave: K, valor: DadosEntrada[K] | undefined) => {
    if (valor !== undefined) dados[chave] = valor as DadosEntrada[K]
  }
  set('pctClientesPJ', numero(entrada.pctClientesPJ, 'pctClientesPJ', 0, 100))
  set('exportacoesMensais', numero(entrada.exportacoesMensais, 'exportacoesMensais'))
  set('anexoSimples', opcao(entrada.anexoSimples, 'anexoSimples', ANEXOS))
  set('anexoSimples2', opcao(entrada.anexoSimples2, 'anexoSimples2', ANEXOS))
  set('pctAnexo1', numero(entrada.pctAnexo1, 'pctAnexo1', 0, 100))
  set('folhaMensal', numero(entrada.folhaMensal, 'folhaMensal'))
  set('pctFornecedoresSimples', numero(entrada.pctFornecedoresSimples, 'pctFornecedoresSimples', 0, 100))
  set('pctReceitaAliquotaCheia', numero(entrada.pctReceitaAliquotaCheia, 'pctReceitaAliquotaCheia', 0, 100))
  set('pctMedicamentos', numero(entrada.pctMedicamentos, 'pctMedicamentos', 0, 100))
  set('pctGorjeta', numero(entrada.pctGorjeta, 'pctGorjeta', 0, 15))
  set('pctVendasGoverno', numero(entrada.pctVendasGoverno, 'pctVendasGoverno', 0, 100))
  set('despesasCrediteisAdicionais', numero(entrada.despesasCrediteisAdicionais, 'despesasCrediteisAdicionais'))
  set('despesasOperacionaisMensais', numero(entrada.despesasOperacionaisMensais, 'despesasOperacionaisMensais'))
  set('folhaPagamentoLRMensal', numero(entrada.folhaPagamentoLRMensal, 'folhaPagamentoLRMensal'))
  set('aliquotaICMSEfetiva', numero(entrada.aliquotaICMSEfetiva, 'aliquotaICMSEfetiva', 0, 1))
  set('aliquotaISSEfetiva', numero(entrada.aliquotaISSEfetiva, 'aliquotaISSEfetiva', 0, 1))
  set('vendaImobilizadoMensal', numero(entrada.vendaImobilizadoMensal, 'vendaImobilizadoMensal'))
  set('investimentoCapitalMensal', numero(entrada.investimentoCapitalMensal, 'investimentoCapitalMensal'))
  if (typeof entrada.uf === 'string' && /^[A-Za-z]{2}$/.test(entrada.uf)) dados.uf = entrada.uf.toUpperCase()
  return dados
}

// ─── Resumos compactos (a IA não precisa dos ~200 campos do resultado) ───────

const PREMISSAS = [
  `A alíquota de referência de IBS+CBS (${pct(ALIQUOTA_IVA_PADRAO)}%) é uma estimativa de mercado: a LC 214/2025 não a fixa.`,
  'Os valores são estimativas para apoio à decisão e não substituem a apuração do contador.',
]

function alertas(r: ResultadoCalculo): string[] {
  const a: string[] = []
  if (r.setorVedadoSimples && r.regime === 'simples_nacional') a.push('Atividade vedada ao Simples Nacional (LC 123, art. 17).')
  if (r.sublimiteExcedido) a.push('Receita acima do sublimite de R$ 3,6 milhões: ICMS e ISS saem do DAS e são pagos por fora; com a reforma viram IBS no regime regular.')
  if (r.naoContribuinteSetor) a.push('O setor não é contribuinte de IBS/CBS por lei (LC 214, art. 26).')
  if (r.nanoempreendedor) a.push('Pessoa física com receita abaixo de R$ 40.500/ano: nanoempreendedor, não contribuinte de IBS/CBS.')
  if (r.alertaImpostoSeletivo) a.push('Setor sujeito ao Imposto Seletivo (alíquota ainda a ser fixada em lei ordinária).')
  if (r.alertaExportadorHabilitavel) a.push('Exportações acima de 50% da receita: possível habilitação como exportador (LC 214, art. 82).')
  if (r.alertaContratoAdministrativo) a.push('Há vendas ao governo: direito a reequilíbrio dos contratos administrativos (LC 214, arts. 373–377).')
  if (r.alertaCashback) a.push('Setor com cashback elevado ao consumidor de baixa renda (LC 214, art. 118).')
  if (r.setor.creditoVedadoComprador) a.push('Quem compra deste setor (hotelaria, restaurantes, parques) não pode creditar IBS/CBS.')
  const p2033 = r.projecaoAnos[r.projecaoAnos.length - 1]
  if (p2033 && Math.abs(p2033.impostoMensal - r.cargaTotalReformaMensal) > 1) {
    a.push('A projeção ano a ano e a carga total de 2033 partem de bases diferentes neste caso. Cite a carga total de 2033 como resultado principal e avise o usuário da divergência.')
  }
  return a
}

export function resumirResultado(r: ResultadoCalculo) {
  const cargaAtual = r.impostoAtualMensal
  const cargaPos = r.cargaTotalReformaMensal
  const h = r.cenarioHibridoVerdadeiro
  return {
    empresa: {
      regime: r.regime,
      setor: { codigo: r.setor.value, nome: r.setor.label, reducaoAliquotaPct: pct(r.setor.reducao) },
      faturamentoMensal: arred(r.faturamentoMensal),
      insumosMensais: arred(r.insumosMensais),
      perfilClientes: r.perfilClientes,
    },
    cargaHoje: {
      impostoMensal: arred(cargaAtual),
      aliquotaEfetivaPct: pct(r.faturamentoMensal > 0 ? cargaAtual / r.faturamentoMensal : 0),
      origemDaAliquota: r.fonteAliquota === 'real' ? 'informada pelo usuário' : 'estimada pelo motor',
    },
    cargaPosReforma2033: {
      impostoMensal: arred(cargaPos),
      aliquotaEfetivaPct: pct(r.faturamentoMensal > 0 ? cargaPos / r.faturamentoMensal : 0),
      variacaoMensal: arred(cargaPos - cargaAtual),
      variacaoPct: cargaAtual > 0 ? pct((cargaPos - cargaAtual) / cargaAtual) : null,
    },
    ivaDual: {
      aliquotaBrutaAplicadaPct: pct(r.aliquotaIVABruta),
      debitoMensal: arred(r.impostoIVABrutoMensal),
      creditoMensal: arred(r.creditoInsumosMensal),
      liquidoMensal: arred(r.impostoIVALiquidoMensal),
    },
    projecaoAnoAno: r.projecaoAnos.map(p => ({
      ano: p.ano,
      impostoMensal: arred(p.impostoMensal),
      aliquotaEfetivaPct: pct(p.aliquotaEfetiva),
    })),
    simples: r.regime === 'simples_nacional' ? {
      anexo: r.anexoSimples ?? null,
      anexo2: r.anexoSimples2 ?? null,
      pctReceitaNoAnexo1: r.pctAnexo1 ?? null,
      cbsDentroDoDasPct: r.cbsSimplesEfetivo != null ? pct(r.cbsSimplesEfetivo) : null,
      ibsDentroDoDasPct: r.ibsSimplesEfetivo != null ? pct(r.ibsSimplesEfetivo) : null,
      fatorR: r.analiseFatorR ? { razaoPct: pct(r.analiseFatorR.fatorR), anexoResultante: r.analiseFatorR.anexo } : null,
      sublimiteExcedido: r.sublimiteExcedido,
      icmsIssPorForaMensal: arred(r.icmsIssPorForaSimplesMensal),
      ibsRegularSublimiteMensal: arred(r.ibsRegularSublimiteMensal),
      hibrido: h ? {
        dasReduzidoMensal: arred(h.dasReduzidoMensal),
        ibsCbsBrutoMensal: arred(h.ibsCBSBrutoMensal),
        creditoMensal: arred(h.creditoMensal),
        ibsCbsLiquidoMensal: arred(h.ibsCBSLiquidoMensal),
        totalMensal: arred(h.totalMensal),
        aliquotaEfetivaPct: pct(h.aliquotaEfetiva),
        custoAdicionalVsSimplesMensal: arred(h.custoAdicionalVsSimples),
        observacao: 'Híbrido = DAS sem a parcela de consumo (IRPJ, CSLL, CPP) + IBS/CBS líquido pago por fora.',
      } : null,
    } : null,
    alertas: alertas(r),
    premissas: [...PREMISSAS, ALERTA_DEFINICAO_ALIQUOTA],
  }
}

// ─── Execução ────────────────────────────────────────────────────────────────

function normalizar(t: string): string {
  return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

export function listarSetores(busca: string) {
  const termo = normalizar(busca).trim()
  const achados = SETORES.filter(s => !termo || normalizar(`${s.value} ${s.label} ${s.grupo}`).includes(termo))
  return {
    total: achados.length,
    setores: achados.slice(0, 15).map(s => ({
      codigo: s.value,
      nome: s.label,
      grupo: s.grupo,
      reducaoAliquotaPct: pct(s.reducao),
      vedadoNoSimples: s.vedadoSimples === true,
    })),
    dica: achados.length > 15 ? 'Há mais resultados: use uma busca mais específica.' : undefined,
  }
}

/** Executa uma ferramenta do motor. Erros de validação voltam como { erro } para a IA corrigir a chamada. */
export function executarFerramentaMotor(nome: string, entrada: unknown): unknown {
  const obj = (entrada && typeof entrada === 'object' ? entrada : {}) as Record<string, unknown>
  try {
    switch (nome) {
      case 'listar_setores':
        return listarSetores(typeof obj.busca === 'string' ? obj.busca : '')

      case 'calcular_cenarios':
        return resumirResultado(calcularTodosOsCenarios(montarDados(obj)))

      case 'comparar_regimes': {
        const dados = montarDados(obj)
        const lista = calcularTodosOsRegimes(dados, { desdobrarFatorR: true })
        return {
          regimes: lista.map(r => ({
            regime: r.regime,
            anexo: r.anexoComparado ?? r.anexoSimples ?? null,
            aplicavel: !r.inaplicavel,
            motivoInaplicavel: r.inaplicavel
              ? (r.vedadoSimplesAtividade ? 'atividade vedada ao Simples'
                : r.acimaDaFaixaSimples ? 'receita acima do limite do Simples (R$ 4,8 milhões)'
                : r.acimaDaFaixaMEI ? 'receita acima do limite do MEI' : 'não aplicável')
              : null,
            cargaHojeMensal: arred(r.impostoAtualMensal),
            cargaPos2033Mensal: arred(r.cargaTotalReformaMensal),
            aliquotaHojePct: pct(r.faturamentoMensal > 0 ? r.impostoAtualMensal / r.faturamentoMensal : 0),
            aliquotaPos2033Pct: pct(r.faturamentoMensal > 0 ? r.cargaTotalReformaMensal / r.faturamentoMensal : 0),
            menorCustoHoje: r.melhorAtual,
            menorCustoPos2033: r.melhorIVA,
            sePrecisarDeFatorR: r.anexoAtingivel,
          })),
          premissas: [...PREMISSAS, 'No Simples, a carga pós-reforma não inclui IRPJ/CSLL/CPP à parte: estão dentro do DAS.'],
        }
      }

      case 'simular_crescimento': {
        const dados = montarDados(obj)
        const bruto = Array.isArray(obj.percentuais) ? obj.percentuais : []
        if (bruto.length === 0) throw new Error('Informe ao menos um percentual de variação.')
        if (bruto.length > 12) throw new Error('No máximo 12 pontos por simulação.')
        const percentuais = bruto.map(p => {
          if (typeof p !== 'number' || !Number.isFinite(p) || p < -90 || p > 1000) throw new Error('Cada percentual deve estar entre -90 e 1000.')
          return p
        })
        return {
          pontos: calcularCurvaCrescimento(dados, percentuais).map(p => ({
            variacaoFaturamentoPct: p.pct,
            faturamentoMensal: arred(p.faturamentoMensal),
            cargaHojeMensal: arred(p.impostoAtualMensal),
            cargaPos2033Mensal: arred(p.impostoIVAMensal),
            aliquotaHojePct: pct(p.aliquotaAtual),
            aliquotaPos2033Pct: pct(p.aliquotaIVA),
            acimaDoLimiteDoSimples: p.acimaDaFaixaSimples,
          })),
          observacao: 'Insumos, exportações e despesas operacionais crescem junto com o faturamento; folha, venda de imobilizado e créditos adicionais ficam fixos.',
        }
      }

      default:
        return { erro: `Ferramenta desconhecida: ${nome}` }
    }
  } catch (e) {
    return { erro: e instanceof Error ? e.message : 'Entrada inválida.' }
  }
}
