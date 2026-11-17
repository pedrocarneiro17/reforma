/**
 * Catálogo oficial de atividades do Simples Nacional — código cAtivSN dos documentos fiscais
 * (NF-e, NFC-e, NFS-e) a partir de 2027, conforme a NT 2026.005.
 *
 * Fonte: calculadora oficial da Receita Federal (github.com/ReceitaFederal/calculadora-rtc-regime-regular,
 * migração flyway V0049__catalogo_oficial_atividades_simples_nacional.sql — tabela
 * ATIVIDADE_SIMPLES_NACIONAL, vigência a partir de 01/01/2027). Licença MIT.
 *
 * O cAtivSN é informado item a item na nota fiscal e diz à calculadora oficial como tratar
 * o IBS/CBS do Simples. A alíquota efetiva (RBT12) continua sendo calculada pelo PGDAS-D.
 */

import type { AnexoSimples, Setor } from '../types'

export type CodigoAtividadeSN =
  | '01' | '02' | '03' | '04' | '05' | '06' | '07' | '08' | '09' | '10'
  | '11' | '12' | '13' | '14' | '90'

export interface AtividadeSimples {
  codigo: CodigoAtividadeSN
  descricao: string
  /** Anexo de apuração sem Fator R (null só no código 90 — operações não tributáveis) */
  anexoSemFatorR: AnexoSimples | null
  /** Anexo quando o Fator R é inferior a 28% (só a atividade 09) */
  anexoComFatorR: AnexoSimples | null
  /** Rótulo da tabela oficial — indica ajustes de partilha (ex.: "III, menos ISS, mais ICMS do I") */
  rotulo: string
  naoTributavel: boolean
}

export const VIGENCIA_ATIVIDADES_SIMPLES = '2027-01-01'

export const ATIVIDADES_SIMPLES: readonly AtividadeSimples[] = [
  { codigo: '01', descricao: 'Revenda de mercadorias, venda de mercadorias industrializadas pelo contribuinte', anexoSemFatorR: 'I', anexoComFatorR: null, rotulo: 'I', naoTributavel: false },
  { codigo: '02', descricao: 'Operações com os demais bens materiais, sem incidência de ICMS', anexoSemFatorR: 'I', anexoComFatorR: null, rotulo: 'I, menos ICMS', naoTributavel: false },
  { codigo: '03', descricao: 'Venda de mercadorias industrializadas pelo contribuinte, com industrialização incentivada na Zona Franca de Manaus', anexoSemFatorR: 'II', anexoComFatorR: null, rotulo: 'II', naoTributavel: false },
  { codigo: '04', descricao: 'Operações com os demais bens materiais, com industrialização incentivada na Zona Franca de Manaus, sem incidência de ICMS', anexoSemFatorR: 'II', anexoComFatorR: null, rotulo: 'II, menos ICMS', naoTributavel: false },
  { codigo: '05', descricao: 'Prestação de serviços de transporte intermunicipal e interestadual de carga ou de passageiros autorizados no inciso VI do art. 17 da LC 123', anexoSemFatorR: 'III', anexoComFatorR: null, rotulo: 'III, menos ISS, mais ICMS do I', naoTributavel: false },
  { codigo: '06', descricao: 'Prestação de serviços de comunicação', anexoSemFatorR: 'III', anexoComFatorR: null, rotulo: 'III, menos ISS, mais ICMS do I', naoTributavel: false },
  { codigo: '07', descricao: 'Prestação de serviços, cessão de direitos, de uso ou de espaço com incidência do ISS, tributados exclusivamente pelo Anexo III', anexoSemFatorR: 'III', anexoComFatorR: null, rotulo: 'III', naoTributavel: false },
  { codigo: '08', descricao: 'Prestação de serviços contábeis autorizados a pagar o ISS em valor fixo em guia do Município', anexoSemFatorR: 'III', anexoComFatorR: null, rotulo: 'III, menos o ISS', naoTributavel: false },
  { codigo: '09', descricao: 'Prestação de serviços — sujeitos ao Fator "R"', anexoSemFatorR: 'III', anexoComFatorR: 'V', rotulo: 'III ou V', naoTributavel: false },
  { codigo: '10', descricao: 'Prestação de serviços de transporte municipal rodoviário, metroviário, ferroviário e aquaviário de passageiros relacionados no subitem 16.01 da lista anexa à LC 116/2003', anexoSemFatorR: 'III', anexoComFatorR: null, rotulo: 'III', naoTributavel: false },
  { codigo: '11', descricao: 'Locação de bens móveis e operações com serviços, bens imateriais e direitos, inclusive com bens imóveis, sem incidência de ISS', anexoSemFatorR: 'III', anexoComFatorR: null, rotulo: 'III, menos o ISS', naoTributavel: false },
  { codigo: '12', descricao: 'Prestação de serviços da área da construção civil relacionados nos subitens 7.02 e 7.05 da lista anexa à LC 116/2003 (apuração pelo Anexo III)', anexoSemFatorR: 'III', anexoComFatorR: null, rotulo: 'III', naoTributavel: false },
  { codigo: '13', descricao: 'Prestação de serviços da área da construção civil relacionados nos subitens 7.02 e 7.05 da lista anexa à LC 116/2003 (apuração pelo Anexo IV)', anexoSemFatorR: 'IV', anexoComFatorR: null, rotulo: 'IV', naoTributavel: false },
  { codigo: '14', descricao: 'Prestação de serviços', anexoSemFatorR: 'IV', anexoComFatorR: null, rotulo: 'IV', naoTributavel: false },
  { codigo: '90', descricao: 'Operações não tributáveis', anexoSemFatorR: null, anexoComFatorR: null, rotulo: 'Não tributável', naoTributavel: true },
]

export function getAtividadeSimples(codigo: CodigoAtividadeSN): AtividadeSimples {
  const a = ATIVIDADES_SIMPLES.find(x => x.codigo === codigo)
  if (!a) throw new Error(`cAtivSN desconhecido: ${codigo}`)
  return a
}

/**
 * Setores cujo código não sai só do anexo (transporte, comunicação, ZFM, construção).
 * Os demais são derivados do anexo efetivo em atividadeSimplesDoSetor().
 */
const CODIGO_POR_SETOR: Partial<Record<string, CodigoAtividadeSN>> = {
  zfm_industria_incentivada:            '03', // industrialização incentivada na ZFM (Anexo II)
  transporte_rodoviario_intermunicipal: '05', // transporte intermunicipal/interestadual de passageiros
  logistica_transporte:                 '05', // transporte intermunicipal/interestadual de cargas
  aviacao_civil:                        '05',
  radiodifusao_aberta:                  '06', // serviço de comunicação
  transporte_metro_vlt:                 '10', // transporte municipal de passageiros (subitem 16.01)
}

/**
 * Código cAtivSN da atividade principal do setor, coerente com o anexo efetivo do cálculo.
 * Retorna null quando o setor é vedado ao Simples ou o anexo não se encaixa em nenhuma atividade.
 *
 * Observação: o catálogo oficial enquadra a venda de mercadoria industrializada pelo próprio
 * contribuinte no código 01 (rótulo "I"), embora o DAS dessa receita seja apurado pelo Anexo II
 * (LC 123/2006). Mantemos o Anexo II no cálculo e usamos 01 como código da nota.
 */
export function atividadeSimplesDoSetor(setor: Setor, anexoEfetivo?: AnexoSimples): AtividadeSimples | null {
  if (setor.vedadoSimples) return null
  const especifico = CODIGO_POR_SETOR[setor.value]
  if (especifico) return getAtividadeSimples(especifico)

  // Mesma inferência do motor quando nenhum anexo foi informado (comércio → I, indústria → II, demais → III)
  const anexo: AnexoSimples = anexoEfetivo ?? setor.anexoFixo
    ?? (setor.tipo === 'comercio' ? 'I' : setor.tipo === 'industria' ? 'II' : 'III')
  if (setor.value === 'construcao_civil') return getAtividadeSimples(anexo === 'III' ? '12' : '13')
  if (setor.fatorR && (anexo === 'III' || anexo === 'V')) return getAtividadeSimples('09')

  switch (anexo) {
    case 'I':
    case 'II':  return getAtividadeSimples('01')
    case 'III': return getAtividadeSimples('07')
    case 'IV':  return getAtividadeSimples('14')
    case 'V':   return getAtividadeSimples('09')
  }
}

/** Anexos em que a atividade pode ser apurada (para checar coerência com o anexo do cálculo) */
export function anexosDaAtividade(a: AtividadeSimples): AnexoSimples[] {
  return [a.anexoSemFatorR, a.anexoComFatorR].filter((x): x is AnexoSimples => x != null)
}
