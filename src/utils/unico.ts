/**
 * Importador do CSV de "Produtos" do Único (exportação de notas fiscais: entradas, saídas, serviços
 * prestados e serviços tomados). Tudo roda no navegador: o arquivo é lido, resumido e descartado.
 *
 * O importador NÃO calcula imposto. Ele só soma e classifica o que está no arquivo, e sugere os campos
 * do formulário; quem calcula é o motor (src/engine/calculadora.ts). Cada regra de classificação é
 * uma heurística sobre CFOP, NCM, descrição e os campos de IBS/CBS do próprio arquivo — e o resumo
 * mostra o que foi suposto, para o usuário conferir.
 */

// ─── Leitura do arquivo ──────────────────────────────────────────────────────

/** Decodifica o arquivo: UTF-8 quando válido; senão Windows-1252 (padrão dos exportadores brasileiros). */
export function decodificarArquivo(bytes: ArrayBuffer | Uint8Array): string {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(u8).replace(/^﻿/, '')
  } catch {
    return new TextDecoder('windows-1252').decode(u8)
  }
}

/** Lê CSV separado por ponto e vírgula, com aspas e quebras de linha dentro de campo. */
export function lerCsv(texto: string, separador = ';'): string[][] {
  const linhas: string[][] = []
  let campo = ''
  let linha: string[] = []
  let aspas = false
  const fechaCampo = () => { linha.push(campo); campo = '' }
  const fechaLinha = () => {
    fechaCampo()
    if (!(linha.length === 1 && linha[0] === '')) linhas.push(linha)
    linha = []
  }
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]
    if (aspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') { campo += '"'; i++ } else aspas = false
      } else campo += c
    } else if (c === '"') aspas = true
    else if (c === separador) fechaCampo()
    else if (c === '\n') fechaLinha()
    else if (c === '\r') { /* CRLF: o \n fecha a linha */ }
    else campo += c
  }
  if (campo !== '' || linha.length) fechaLinha()
  return linhas
}

const semAcento = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '')
const chave = (t: string) => semAcento(t).toLowerCase().replace(/[^a-z0-9/]+/g, ' ').trim()

/** Valor no formato brasileiro ("1.144,96") ou do Excel (`="00"`). Vazio vira 0. */
export function numeroBR(v: string | undefined): number {
  if (!v) return 0
  const limpo = v.replace(/^=?"?|"?$/g, '').trim()
  if (!limpo) return 0
  const n = parseFloat(limpo.replace(/\./g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : 0
}

const textoLimpo = (v: string | undefined) => (v ?? '').replace(/^=?"?|"?$/g, '').trim()

// ─── Linhas do arquivo ───────────────────────────────────────────────────────

export type TipoLancamento = 'entrada' | 'saida' | 'servico_emitido' | 'servico_recebido'

export interface LinhaUnico {
  tipo: TipoLancamento
  cancelada: boolean
  mes: string              // AAAA-MM
  cfop: string             // "1.407"
  descricao: string
  ncm: string              // só dígitos
  valorProduto: number
  desconto: number
  /** valor do item já abatido o desconto */
  valorLiquido: number
  cClassTrib: string
  cst: string
  bcIbsCbs: number
  valorCbs: number
  valorIbs: number
}

export class ErroUnico extends Error {}

const CABECALHOS = {
  tipo: ['tipo de lancamento'],
  data: ['data'],
  cfop: ['cfop'],
  descricao: ['descricao'],
  ncm: ['ncm'],
  valor: ['valor do produto'],
  desconto: ['desconto do produto'],
  situacao: ['situacao da nota'],
  cClassTrib: ['cclasstrib ibs/cbs'],
  cst: ['cst ibs/cbs'],
  bc: ['bc ibs/cbs'],
  cbs: ['valor cbs'],
  ibsUf: ['valor ibs uf'],
  ibsMun: ['valor ibs mun'],
} as const

function tipoDe(v: string): TipoLancamento | null {
  const k = chave(v)
  if (k.startsWith('entrada')) return 'entrada'
  if (k.startsWith('saida')) return 'saida'
  if (k.startsWith('servico emitido')) return 'servico_emitido'
  if (k.startsWith('servico recebido')) return 'servico_recebido'
  return null
}

export function lerLinhasUnico(texto: string): LinhaUnico[] {
  const tabela = lerCsv(texto)
  if (tabela.length < 2) throw new ErroUnico('O arquivo está vazio ou não tem linhas de dados.')
  const cab = tabela[0].map(chave)
  const idx = (nomes: readonly string[]) => cab.findIndex(c => nomes.includes(c))
  const col = Object.fromEntries(Object.entries(CABECALHOS).map(([k, nomes]) => [k, idx(nomes)])) as Record<keyof typeof CABECALHOS, number>
  for (const obrigatoria of ['tipo', 'data', 'cfop', 'valor'] as const) {
    if (col[obrigatoria] < 0) {
      throw new ErroUnico(`Não reconheci este arquivo como a exportação de Produtos do Único (coluna "${CABECALHOS[obrigatoria][0]}" ausente).`)
    }
  }
  const pega = (l: string[], i: number) => (i >= 0 ? l[i] : undefined)

  const saida: LinhaUnico[] = []
  for (const l of tabela.slice(1)) {
    const tipo = tipoDe(textoLimpo(pega(l, col.tipo)))
    if (!tipo) continue
    const m = /(\d{2})\/(\d{2})\/(\d{4})/.exec(textoLimpo(pega(l, col.data)))
    if (!m) continue
    const valorProduto = numeroBR(pega(l, col.valor))
    const desconto = numeroBR(pega(l, col.desconto))
    saida.push({
      tipo,
      cancelada: /cancel/i.test(semAcento(textoLimpo(pega(l, col.situacao)))),
      mes: `${m[3]}-${m[2]}`,
      cfop: textoLimpo(pega(l, col.cfop)).slice(0, 5),
      descricao: textoLimpo(pega(l, col.descricao)),
      ncm: textoLimpo(pega(l, col.ncm)).replace(/\D/g, ''),
      valorProduto,
      desconto,
      valorLiquido: valorProduto - desconto,
      cClassTrib: textoLimpo(pega(l, col.cClassTrib)),
      cst: textoLimpo(pega(l, col.cst)),
      bcIbsCbs: numeroBR(pega(l, col.bc)),
      valorCbs: numeroBR(pega(l, col.cbs)),
      valorIbs: numeroBR(pega(l, col.ibsUf)) + numeroBR(pega(l, col.ibsMun)),
    })
  }
  if (saida.length === 0) throw new ErroUnico('Não encontrei lançamentos de entrada, saída ou serviço neste arquivo.')
  return saida
}

// ─── Classificação ───────────────────────────────────────────────────────────

export type NaturezaEntrada = 'revenda_insumo' | 'uso_consumo' | 'ativo_imobilizado' | 'combustivel' | 'servico_tomado' | 'outras'
export type SituacaoCredito = 'com_destaque' | 'sem_destaque' | 'monofasico' | 'aliquota_zero'
export type CategoriaReceita =
  | 'hospedagem' | 'outros_servicos'
  | 'alimentacao_preparada' | 'bebida_alcoolica' | 'bebida_terceiros' | 'outras_mercadorias'

export const ROTULO_NATUREZA: Record<NaturezaEntrada, string> = {
  revenda_insumo: 'Compra para revenda / insumo',
  uso_consumo: 'Uso e consumo',
  ativo_imobilizado: 'Ativo imobilizado',
  combustivel: 'Combustíveis e lubrificantes',
  servico_tomado: 'Serviços tomados',
  outras: 'Outras entradas',
}

export const ROTULO_SITUACAO: Record<SituacaoCredito, string> = {
  com_destaque: 'Com IBS/CBS destacado na nota',
  sem_destaque: 'Sem destaque (fornecedor do Simples/MEI ou sem informação)',
  monofasico: 'Tributação monofásica (crédito com regra própria)',
  aliquota_zero: 'Alíquota zero ou sem imposto',
}

export const ROTULO_CATEGORIA: Record<CategoriaReceita, string> = {
  hospedagem: 'Hospedagem (serviço)',
  outros_servicos: 'Outros serviços',
  alimentacao_preparada: 'Alimentação preparada no estabelecimento',
  bebida_alcoolica: 'Bebidas alcoólicas',
  bebida_terceiros: 'Bebidas e alimentos de terceiros, sem preparo',
  outras_mercadorias: 'Outras mercadorias',
}

export function naturezaDaEntrada(l: Pick<LinhaUnico, 'tipo' | 'cfop'>): NaturezaEntrada {
  if (l.tipo === 'servico_recebido') return 'servico_tomado'
  const m = /^([123])\.(\d{3})$/.exec(l.cfop)
  if (!m) return 'outras'
  const c = m[2]
  if (['406', '551', '552', '553', '554', '555'].includes(c)) return 'ativo_imobilizado'   // 1.406: bem do ativo com ST
  if (['407', '556', '557'].includes(c)) return 'uso_consumo'
  if (['652', '653', '656'].includes(c)) return 'combustivel'
  if (['101', '102', '111', '113', '116', '117', '118', '120', '121', '122', '401', '403', '405'].includes(c)) return 'revenda_insumo'
  return 'outras'   // inclui 1.923/2.923 (venda à ordem) e demais CFOPs: revise a mão
}

/** Situação do crédito de IBS/CBS segundo os campos do próprio arquivo (ano-teste 2026). */
export function situacaoDoCredito(l: Pick<LinhaUnico, 'cst' | 'cClassTrib' | 'bcIbsCbs' | 'valorCbs' | 'valorIbs'>): SituacaoCredito {
  if (l.cst.startsWith('62') || l.cClassTrib.startsWith('62')) return 'monofasico'
  if (l.bcIbsCbs > 0 && l.valorCbs + l.valorIbs > 0) return 'com_destaque'
  if (l.bcIbsCbs > 0) return 'aliquota_zero'
  return 'sem_destaque'
}

const BEBIDA_ALCOOLICA = /^220[3-8]/
const BEBIDA_TERCEIROS = /^(2201|2202|2009)/
const ALIMENTACAO_PREPARADA = /(cafe da manha|refei[cç]|almo[cç]o|jantar|prato|lanche|marmit|buffet|brunch)/i

export function categoriaDaReceita(l: Pick<LinhaUnico, 'tipo' | 'ncm' | 'descricao'>): CategoriaReceita {
  if (l.tipo === 'servico_emitido') return /hospedagem|hotel|pousada/i.test(semAcento(l.descricao)) ? 'hospedagem' : 'outros_servicos'
  if (BEBIDA_ALCOOLICA.test(l.ncm)) return 'bebida_alcoolica'
  if (BEBIDA_TERCEIROS.test(l.ncm)) return 'bebida_terceiros'
  if (ALIMENTACAO_PREPARADA.test(semAcento(l.descricao))) return 'alimentacao_preparada'
  return 'outras_mercadorias'
}

// ─── Resumo ──────────────────────────────────────────────────────────────────

export interface ResumoUnico {
  periodo: { inicio: string; fim: string; meses: number }
  documentosCancelados: number
  receita: {
    total: number
    mediaMensal: number
    porCategoria: Record<CategoriaReceita, number>
    porMes: Record<string, number>
  }
  entradas: {
    total: number
    descontosAbatidos: number
    porNatureza: Record<NaturezaEntrada, number>
    porSituacao: Record<SituacaoCredito, number>
    porMes: Record<string, number>
    /** IBS e CBS já destacados nas notas (ano-teste: 0,1% + 0,9%) — informativo, não é o crédito de 2033 */
    ibsCbsDestacado: number
  }
  /** mercadorias de saída que o importador não soube classificar (tratadas como alíquota cheia) */
  outrasMercadoriasDescricoes: string[]
  avisos: string[]
}

const ZERO_NATUREZA = (): Record<NaturezaEntrada, number> => ({ revenda_insumo: 0, uso_consumo: 0, ativo_imobilizado: 0, combustivel: 0, servico_tomado: 0, outras: 0 })
const ZERO_SITUACAO = (): Record<SituacaoCredito, number> => ({ com_destaque: 0, sem_destaque: 0, monofasico: 0, aliquota_zero: 0 })
const ZERO_CATEGORIA = (): Record<CategoriaReceita, number> => ({ hospedagem: 0, outros_servicos: 0, alimentacao_preparada: 0, bebida_alcoolica: 0, bebida_terceiros: 0, outras_mercadorias: 0 })

const r2 = (n: number) => Math.round(n * 100) / 100

function mesesEntre(inicio: string, fim: string): number {
  const [a1, m1] = inicio.split('-').map(Number)
  const [a2, m2] = fim.split('-').map(Number)
  return (a2 - a1) * 12 + (m2 - m1) + 1
}

export function resumirUnico(linhas: LinhaUnico[]): ResumoUnico {
  const validas = linhas.filter(l => !l.cancelada)
  if (validas.length === 0) throw new ErroUnico('Todos os documentos do arquivo estão cancelados.')
  const meses = [...new Set(validas.map(l => l.mes))].sort()
  const inicio = meses[0], fim = meses[meses.length - 1]

  const receitaCat = ZERO_CATEGORIA()
  const receitaMes: Record<string, number> = {}
  const entNat = ZERO_NATUREZA()
  const entSit = ZERO_SITUACAO()
  const entMes: Record<string, number> = {}
  let descontos = 0, ibsCbs = 0
  const desconhecidas = new Map<string, number>()

  for (const l of validas) {
    if (l.tipo === 'servico_emitido' || l.tipo === 'saida') {
      const cat = categoriaDaReceita(l)
      receitaCat[cat] += l.valorLiquido
      receitaMes[l.mes] = (receitaMes[l.mes] ?? 0) + l.valorLiquido
      if (cat === 'outras_mercadorias') desconhecidas.set(l.descricao, (desconhecidas.get(l.descricao) ?? 0) + l.valorLiquido)
    } else {
      const nat = naturezaDaEntrada(l)
      const sit = situacaoDoCredito(l)
      entNat[nat] += l.valorLiquido
      entSit[sit] += l.valorLiquido
      entMes[l.mes] = (entMes[l.mes] ?? 0) + l.valorLiquido
      descontos += l.desconto
      ibsCbs += l.valorCbs + l.valorIbs
    }
  }

  const totalReceita = Object.values(receitaCat).reduce((s, v) => s + v, 0)
  const totalEntradas = Object.values(entNat).reduce((s, v) => s + v, 0)
  const nMeses = mesesEntre(inicio, fim)
  const arred = <T extends Record<string, number>>(o: T): T =>
    Object.fromEntries(Object.entries(o).map(([k, v]) => [k, r2(v)])) as T

  const avisos: string[] = []
  const cancelados = linhas.length - validas.length
  if (cancelados > 0) avisos.push(`${cancelados} linha(s) de documentos cancelados foram ignoradas.`)
  if (descontos > 0) avisos.push(`Os descontos das entradas (R$ ${r2(descontos).toLocaleString('pt-BR')}) foram abatidos: o crédito só vale sobre o valor efetivamente pago.`)
  if (nMeses < 12) avisos.push(`O arquivo cobre ${nMeses} ${nMeses === 1 ? 'mês' : 'meses'}. As médias mensais projetam esse período; empresa com sazonalidade forte pode precisar dos 12 meses para a faixa do Simples (RBT12).`)
  if (receitaCat.alimentacao_preparada > 0) avisos.push('Alimentação preparada foi reconhecida pela descrição do item (ex.: "café da manhã"). Confirme que o preparo é feito no estabelecimento.')
  if (receitaCat.outras_mercadorias > 0) avisos.push('Mercadorias que não pareceram bebida nem alimentação preparada foram tratadas como alíquota cheia (conservador). Revise a lista abaixo.')
  if (entSit.monofasico > 0) avisos.push('Entradas com tributação monofásica (ex.: gás, combustíveis) têm regra própria de crédito e ficam de fora do crédito por padrão.')
  if (ibsCbs > 0) avisos.push('O IBS/CBS destacado nas notas é do ano-teste de 2026 (0,9% de CBS e 0,1% de IBS). Serve para saber QUEM destaca, não é o crédito de 2033.')

  return {
    periodo: { inicio, fim, meses: nMeses },
    documentosCancelados: cancelados,
    receita: { total: r2(totalReceita), mediaMensal: r2(totalReceita / nMeses), porCategoria: arred(receitaCat), porMes: arred(receitaMes) },
    entradas: {
      total: r2(totalEntradas),
      descontosAbatidos: r2(descontos),
      porNatureza: arred(entNat),
      porSituacao: arred(entSit),
      porMes: arred(entMes),
      ibsCbsDestacado: r2(ibsCbs),
    },
    outrasMercadoriasDescricoes: [...desconhecidas.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([d]) => d),
    avisos,
  }
}

// ─── Sugestão para o formulário ──────────────────────────────────────────────

export interface EscolhaCredito {
  com_destaque: boolean
  sem_destaque: boolean
  monofasico: boolean
  aliquota_zero: boolean
}

export const ESCOLHA_PADRAO: EscolhaCredito = { com_destaque: true, sem_destaque: true, monofasico: false, aliquota_zero: false }

export interface SugestaoFormulario {
  setorValue: string | null
  faturamentoMensal: number
  insumosMensais: number
  /** % das compras sem IBS/CBS destacado (o motor trata como fornecedor do Simples: crédito parcial) */
  pctFornecedoresSimples: number
  /** quando há serviço e mercadoria: anexos e a fatia da receita no primeiro anexo */
  anexo1: 'III' | null
  anexo2: 'I' | null
  pctAnexo1: number | null
  /** % da receita fora do regime específico de hotelaria/restaurante (alíquota cheia) */
  pctReceitaAliquotaCheia: number
}

/**
 * Converte o resumo nos campos do formulário. `escolha` define quais compras entram como base de crédito.
 * A hospedagem vai para o Anexo III e as mercadorias para o Anexo I (premissa mostrada no resumo).
 */
export function sugerirFormulario(r: ResumoUnico, escolha: EscolhaCredito = ESCOLHA_PADRAO): SugestaoFormulario {
  const c = r.receita.porCategoria
  const total = r.receita.total
  const servicos = c.hospedagem + c.outros_servicos
  const mercadorias = total - servicos
  const ehHotel = total > 0 && c.hospedagem / total >= 0.5

  let baseCredito = 0
  for (const s of Object.keys(escolha) as SituacaoCredito[]) if (escolha[s]) baseCredito += r.entradas.porSituacao[s]
  const semDestaque = escolha.sem_destaque ? r.entradas.porSituacao.sem_destaque : 0

  const misto = servicos > 0 && mercadorias > 0
  const foraRegime = ehHotel ? c.bebida_alcoolica + c.bebida_terceiros + c.outras_mercadorias : 0

  return {
    setorValue: ehHotel ? 'hoteis_pousadas' : null,
    faturamentoMensal: r2(r.receita.mediaMensal),
    insumosMensais: r2(baseCredito / r.periodo.meses),
    pctFornecedoresSimples: baseCredito > 0 ? Math.round((semDestaque / baseCredito) * 100) : 0,
    anexo1: misto ? 'III' : null,
    anexo2: misto ? 'I' : null,
    pctAnexo1: misto ? Math.round((servicos / total) * 10000) / 100 : null,
    pctReceitaAliquotaCheia: total > 0 ? Math.round((foraRegime / total) * 10000) / 100 : 0,
  }
}

/** Atalho: bytes do arquivo → resumo. */
export function analisarArquivoUnico(bytes: ArrayBuffer | Uint8Array): ResumoUnico {
  return resumirUnico(lerLinhasUnico(decodificarArquivo(bytes)))
}
