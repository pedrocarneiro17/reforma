/**
 * Tipos de Receita Bruta do Simples Nacional (tpRBSN) — NT 2026.005, seções 5.3.2 e 5.3.4.
 *
 * Cada cClassTrib da nota fiscal carrega um tpRBSN que diz como a receita entra no cálculo do
 * IBS/CBS do Simples: se compõe a receita bruta, que fração é tributada e se o valor fica
 * devido ou pendente/suspenso.
 *
 * Fonte: calculadora oficial da Receita Federal (github.com/ReceitaFederal/calculadora-rtc-regime-regular,
 * migrações flyway V0047__tipo_receita_bruta_sn.sql e V0050__parametrizacao_calculo_simples_nacional.sql —
 * tabela TIPO_RECEITA_BRUTA_SIMPLES_NACIONAL, vigência a partir de 01/01/2027). Licença MIT.
 */

export type CodigoTipoReceitaSN = 0 | 1 | 2 | 3 | 4 | 5 | 9

export interface TipoReceitaSimples {
  codigo: CodigoTipoReceitaSN
  descricao: string
  /** false = a receita do item não entra na receita bruta (vRBSNitem = 0) */
  compoeReceita: boolean
  /** Fração da receita bruta tributada por IBS/CBS (1 = integral, 0,5 = metade, 0 = nada) */
  fatorReceita: number
  /** true = o IBS/CBS calculado fica pendente/suspenso em vez de devido */
  pendenteSuspenso: boolean
  /** Exemplos de cClassTrib da tabela oficial com este tipo */
  exemplos: string
}

export const VIGENCIA_TIPOS_RECEITA_SIMPLES = '2027-01-01'

export const TIPOS_RECEITA_SIMPLES: readonly TipoReceitaSimples[] = [
  { codigo: 0, descricao: 'Não é receita bruta', compoeReceita: false, fatorReceita: 0, pendenteSuspenso: false,
    exemplos: '34 cClassTrib (ex.: 410001–410003, 550002, 800001 — devoluções, transferências, bonificações)' },
  { codigo: 1, descricao: 'Receita bruta - interna', compoeReceita: true, fatorReceita: 1, pendenteSuspenso: false,
    exemplos: 'vendas e serviços no mercado interno (tributação integral, inclusive com redução de alíquota)' },
  { codigo: 2, descricao: 'Receita bruta - interna sem cálculo de IBS e CBS', compoeReceita: true, fatorReceita: 0, pendenteSuspenso: false,
    exemplos: '410008 livros, jornais e periódicos · 410009 fonogramas · 410010 radiodifusão aberta · 410011 ouro ativo financeiro · 510001 energia com diferimento' },
  { codigo: 3, descricao: 'Receita bruta - exportação direta', compoeReceita: true, fatorReceita: 0, pendenteSuspenso: false,
    exemplos: '410004 exportações de bens e serviços · 410013 exportação de combustíveis · 410027 exportação de serviço ou bem imaterial' },
  { codigo: 4, descricao: 'Receita bruta - exportação indireta', compoeReceita: true, fatorReceita: 1, pendenteSuspenso: true,
    exemplos: '550001 exportação de bens materiais (comercial exportadora) · 550004/550005 regimes de depósito · 550014 ZPE · 550021 industrialização destinada a exportação' },
  { codigo: 5, descricao: 'Receita bruta - mercado interno e exportação', compoeReceita: true, fatorReceita: 0.5, pendenteSuspenso: false,
    exemplos: '222001 transporte internacional de passageiros com ida e volta vendidas em conjunto' },
  { codigo: 9, descricao: 'Fornecimento incompatível com SN', compoeReceita: true, fatorReceita: 0, pendenteSuspenso: false,
    exemplos: '33 cClassTrib (ex.: 010001, 200016–200018, 620001–620005) — operações que o optante não pode realizar' },
]

export function getTipoReceitaSimples(codigo: CodigoTipoReceitaSN): TipoReceitaSimples {
  const t = TIPOS_RECEITA_SIMPLES.find(x => x.codigo === codigo)
  if (!t) throw new Error(`tpRBSN desconhecido: ${codigo}`)
  return t
}

export type TipoExportacaoSimples = 'direta' | 'indireta'

/** tpRBSN da receita de exportação: direta → 3; por comercial exportadora/ZPE/depósito → 4 */
export function tipoReceitaDaExportacao(tipo: TipoExportacaoSimples): TipoReceitaSimples {
  return getTipoReceitaSimples(tipo === 'indireta' ? 4 : 3)
}

/**
 * Efeito do tpRBSN sobre a parcela de IBS/CBS do DAS de uma receita.
 * @param receita       valor da receita no mês
 * @param fracCbsIbsDAS parcela de CBS+IBS do DAS como fração da receita (ex.: 0,0216)
 */
export function efeitoTipoReceitaSimples(tipo: TipoReceitaSimples, receita: number, fracCbsIbsDAS: number) {
  const calculado = tipo.compoeReceita ? receita * tipo.fatorReceita * fracCbsIbsDAS : 0
  const devido    = tipo.pendenteSuspenso ? 0 : calculado
  const suspenso  = tipo.pendenteSuspenso ? calculado : 0
  /** Quanto o DAS fica menor do que se a receita fosse interna (tpRBSN 1) */
  const reducaoDAS = Math.max(0, receita * fracCbsIbsDAS - devido)
  return { calculado, devido, suspenso, reducaoDAS }
}
