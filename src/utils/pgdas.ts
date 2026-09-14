// ─── Leitor de PGDAS-D (Extrato do Simples Nacional) ─────────────────────────
// Lê o PDF do PGDAS-D DECLARATÓRIO inteiramente no navegador (pdf.js), extrai os
// dados úteis para preencher o simulador e descarta o arquivo — nada é enviado
// nem armazenado. Baseado no layout oficial "Programa Gerador do Documento de
// Arrecadação do Simples Nacional - Declaratório".

import type { AnexoSimples } from '../types'

export interface DadosPGDAS {
  nomeEmpresa: string | null
  cnpj: string | null
  optanteSimples: boolean
  uf: string | null
  municipio: string | null
  periodoApuracao: string | null          // "03/2026"
  faturamentoMensal: number | null        // RPA — Receita do Período de Apuração
  rbt12: number | null                     // Receita bruta acumulada 12 meses (define a faixa)
  anexo: AnexoSimples | null
  fatorRAplicavel: boolean | null          // false = "Não se aplica"
  totalDebito: number | null               // DAS total do mês
  aliquotaEfetiva: number | null           // totalDebito / faturamento (fração)
  impedidoICMSISS: boolean | null
  descricaoAtividade: string | null        // texto da atividade (para detectar o setor)
  tributos: {
    irpj: number; csll: number; cofins: number; pis: number
    cpp: number; icms: number; ipi: number; iss: number
  } | null
  historico12m: { mes: string; receita: number }[]  // receitas brutas mês a mês (seção 2.2.1)
}

/** "1.092.257,77" → 1092257.77 */
function parseBRL(s: string | undefined | null): number | null {
  if (!s) return null
  const n = parseFloat(s.replace(/\./g, '').replace(',', '.'))
  return isNaN(n) ? null : n
}

function romano(s: string | undefined): AnexoSimples | null {
  const up = (s ?? '').toUpperCase().trim()
  return (['I', 'II', 'III', 'IV', 'V'] as const).includes(up as AnexoSimples)
    ? (up as AnexoSimples)
    : null
}

/** Extrai o texto de todas as páginas do PDF, normalizado em uma única string.
 *  O pdf.js é carregado sob demanda (dynamic import) para não pesar no bundle inicial. */
export async function extrairTextoPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist')
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default
  pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl

  const buf = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise
  let texto = ''
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p)
    const content = await page.getTextContent()
    const linha = content.items.map((it: any) => ('str' in it ? it.str : '')).join(' ')
    texto += linha + '\n'
  }
  // pdf.destroy libera memória; o arquivo é descartado ao sair da função
  await pdf.destroy()
  return texto.replace(/[ \t]+/g, ' ')
}

const NUM = '([\\d.]+,\\d{2})'

/** Interpreta o texto de um PGDAS-D e devolve os campos aproveitáveis. */
export function parsePGDAS(texto: string): DadosPGDAS {
  const t = texto.replace(/\s+/g, ' ')

  const nomeEmpresa =
    t.match(/Nome empresarial:\s*(.+?)\s+Data de abertura/i)?.[1]?.trim() ?? null
  const cnpj = t.match(/CNPJ Matriz:\s*([\d./-]+)/i)?.[1]?.trim() ?? null
  const optanteSimples = /Optante pelo Simples Nacional:\s*Sim/i.test(t)

  const uf = t.match(/\bUF:\s*([A-Z]{2})\b/)?.[1] ?? null
  const municipio = t.match(/Munic[íi]pio:\s*(.+?)\s+UF:/i)?.[1]?.trim() ?? null

  const per = t.match(/Per[íi]odo de Apura[çc][ãa]o:\s*\d{2}\/(\d{2}\/\d{4})/i)?.[1] ?? null

  const faturamentoMensal = parseBRL(
    t.match(new RegExp(`Receita Bruta do PA \\(RPA\\)[^\\d]*${NUM}`, 'i'))?.[1],
  )
  const rbt12 = parseBRL(t.match(new RegExp(`\\(RBT12\\)\\s*${NUM}`, 'i'))?.[1])

  // Anexo — vem na descrição da atividade ("tributados pelo Anexo III")
  const anexo = romano(t.match(/tributad[oa]s?\s+pelo\s+Anexo\s+(I{1,3}|IV|V)\b/i)?.[1])
    ?? romano(t.match(/\bAnexo\s+(I{1,3}|IV|V)\b/i)?.[1])

  const fatorRTxt = t.match(/Fator\s*r\s*=?\s*(N[ãa]o se aplica|[^.]+?)(?:\s+2\.5|\s+Valores Fixos|$)/i)?.[1] ?? ''
  const fatorRAplicavel = fatorRTxt ? !/n[ãa]o se aplica/i.test(fatorRTxt) : null

  const impedidoTxt = t.match(/Impedido de recolher ICMS\/ISS no DAS:\s*(Sim|N[ãa]o)/i)?.[1]
  const impedidoICMSISS = impedidoTxt ? /sim/i.test(impedidoTxt) : null

  const descricaoAtividade =
    t.match(/Valor do D[ée]bito por Tributo para a Atividade[^:]*:\s*(.+?)\s+Receita Bruta Informada/i)?.[1]?.trim()
    ?? null

  // Linha de tributos: 9 números após o cabeçalho IRPJ CSLL ... Total
  const trib = t.match(new RegExp(
    `IRPJ\\s+CSLL\\s+COFINS\\s+PIS\\/Pasep\\s+INSS\\/CPP\\s+ICMS\\s+IPI\\s+ISS\\s+Total\\s+` +
    `${NUM}\\s+${NUM}\\s+${NUM}\\s+${NUM}\\s+${NUM}\\s+${NUM}\\s+${NUM}\\s+${NUM}\\s+${NUM}`, 'i',
  ))
  const tributos = trib ? {
    irpj:   parseBRL(trib[1]) ?? 0,
    csll:   parseBRL(trib[2]) ?? 0,
    cofins: parseBRL(trib[3]) ?? 0,
    pis:    parseBRL(trib[4]) ?? 0,
    cpp:    parseBRL(trib[5]) ?? 0,
    icms:   parseBRL(trib[6]) ?? 0,
    ipi:    parseBRL(trib[7]) ?? 0,
    iss:    parseBRL(trib[8]) ?? 0,
  } : null

  // DAS total: da linha de tributos (9º número = Total) ou do resumo 2.6
  const totalDebito =
    parseBRL(trib?.[9]) ??
    parseBRL(t.match(new RegExp(`Valor Total do D[ée]bito Declarado[^\\d]*${NUM}\\s+${NUM}`, 'i'))?.[2])

  const aliquotaEfetiva =
    totalDebito != null && faturamentoMensal ? totalDebito / faturamentoMensal : null

  // Receitas brutas mês a mês — seção "2.2.1) Mercado Interno"
  const blocoMI = t.match(/2\.2\.1\)?\s*Mercado Interno(.*?)2\.2\.2\)/is)?.[1] ?? ''
  const historico12m: { mes: string; receita: number }[] = []
  const reMes = /(\d{2}\/\d{4})\s+([\d.]+,\d{2})/g
  let mm: RegExpExecArray | null
  while ((mm = reMes.exec(blocoMI)) !== null) {
    const r = parseBRL(mm[2])
    if (r != null) historico12m.push({ mes: mm[1], receita: r })
  }

  return {
    nomeEmpresa, cnpj, optanteSimples, uf, municipio,
    periodoApuracao: per, faturamentoMensal, rbt12, anexo,
    fatorRAplicavel, totalDebito, aliquotaEfetiva, impedidoICMSISS,
    descricaoAtividade, tributos, historico12m,
  }
}

/** Lê um arquivo PGDAS e retorna os dados extraídos (o PDF é descartado após ler). */
export async function lerPGDAS(file: File): Promise<DadosPGDAS> {
  const texto = await extrairTextoPDF(file)
  return parsePGDAS(texto)
}
