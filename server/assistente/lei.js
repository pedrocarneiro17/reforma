/**
 * Base de consulta da lei para o assistente: LC 214/2025 e Decreto 12.955/2026, a partir dos textos
 * em .claude/skills/reforma-tributaria. O assistente só pode citar artigo que esta base devolveu.
 *
 * Os arquivos de texto têm um defeito de origem: vogais e símbolos acentuados foram gravados como
 * se fossem Windows-1250 (ã virou ă, õ virou ő, º virou ş). A função reparar() desfaz isso.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const MAPA_REPARO = {
  '\u015a': '\u0152',
  '\u015b': '\u0153',
  '\u017a': '\u0178',
  '\u02c7': '\u00a1',
  '\u02d8': '\u00a2',
  '\u0141': '\u00a3',
  '\u0104': '\u00a5',
  '\u015e': '\u00aa',
  '\u017b': '\u00af',
  '\u02db': '\u00b2',
  '\u0142': '\u00b3',
  '\u0105': '\u00b9',
  '\u015f': '\u00ba',
  '\u013d': '\u00bc',
  '\u02dd': '\u00bd',
  '\u013e': '\u00be',
  '\u017c': '\u00bf',
  '\u0154': '\u00c0',
  '\u0102': '\u00c3',
  '\u0139': '\u00c5',
  '\u0106': '\u00c6',
  '\u010c': '\u00c8',
  '\u0118': '\u00ca',
  '\u011a': '\u00cc',
  '\u010e': '\u00cf',
  '\u0110': '\u00d0',
  '\u0143': '\u00d1',
  '\u0147': '\u00d2',
  '\u0150': '\u00d5',
  '\u0158': '\u00d8',
  '\u016e': '\u00d9',
  '\u0170': '\u00db',
  '\u0162': '\u00de',
  '\u0155': '\u00e0',
  '\u0103': '\u00e3',
  '\u013a': '\u00e5',
  '\u0107': '\u00e6',
  '\u010d': '\u00e8',
  '\u0119': '\u00ea',
  '\u011b': '\u00ec',
  '\u010f': '\u00ef',
  '\u0111': '\u00f0',
  '\u0144': '\u00f1',
  '\u0148': '\u00f2',
  '\u0151': '\u00f5',
  '\u0159': '\u00f8',
  '\u016f': '\u00f9',
  '\u0171': '\u00fb',
  '\u0163': '\u00fe',
  '\u02d9': '\u00ff'
}

export function reparar(texto) {
  let saida = ''
  for (const c of texto) saida += MAPA_REPARO[c] ?? c
  return saida
}

const NORMAS = {
  lc214: { pasta: 'lcp214', nome: 'LC 214/2025' },
  decreto12955: { pasta: 'decreto-12955', nome: 'Decreto 12.955/2026' },
}

const INICIO_ARTIGO = /^Art\.\s*(\d+)\s*(?:º|°)?(?:\s*-\s*([A-Z]))?\s*[.\-–]/

export function normalizar(t) {
  return t.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

/** Lê os arquivos de uma norma e separa o texto por artigo. */
function indexarNorma(raiz, chave) {
  const dir = join(raiz, NORMAS[chave].pasta)
  const artigos = new Map()
  if (!existsSync(dir)) return artigos
  const arquivos = readdirSync(dir).filter(f => f.endsWith('.md') && !f.startsWith('00-')).sort()
  for (const arq of arquivos) {
    const linhas = reparar(readFileSync(join(dir, arq), 'utf-8')).split(/\r?\n/)
    let atual = null
    let emFrontmatter = linhas[0]?.trim() === '---'
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i]
      if (emFrontmatter) {
        if (i > 0 && linha.trim() === '---') emFrontmatter = false
        continue
      }
      const m = INICIO_ARTIGO.exec(linha)
      if (m) {
        const id = m[1] + (m[2] ?? '')
        atual = { norma: chave, id, linhas: [linha], arquivo: arq }
        // O mesmo número pode reaparecer em artigos alterados dentro de outra lei; fica o primeiro
        if (!artigos.has(id)) artigos.set(id, atual)
        else atual = null
      } else if (/^(Seção|Subseção|CAPÍTULO|TÍTULO|LIVRO)\b/.test(linha.trim())) {
        atual = null   // cabeçalho da divisão seguinte: não faz parte do artigo anterior
      } else if (atual) {
        atual.linhas.push(linha)
      }
    }
  }
  return artigos
}

export function criarBaseLei(raiz) {
  const indices = {}
  const carregar = chave => (indices[chave] ??= indexarNorma(raiz, chave))
  const disponivel = () => existsSync(join(raiz, NORMAS.lc214.pasta)) || existsSync(join(raiz, NORMAS.decreto12955.pasta))

  const texto = a => a.linhas.join('\n').trim()

  return {
    disponivel,

    /** Devolve o texto de um artigo (limitado a 6.000 caracteres). */
    consultarArtigo(norma, artigo) {
      if (!NORMAS[norma]) return { erro: `Norma desconhecida. Use: ${Object.keys(NORMAS).join(', ')}.` }
      if (!disponivel()) return { erro: 'A base de leis não está disponível neste servidor.' }
      const id = String(artigo).replace(/[º°.\s]/g, '').replace(/-/g, '').toUpperCase()
      const a = carregar(norma).get(id)
      if (!a) return { erro: `Artigo ${artigo} não encontrado na ${NORMAS[norma].nome}.` }
      const t = texto(a)
      return {
        norma: NORMAS[norma].nome,
        artigo: `Art. ${id}`,
        texto: t.length > 6000 ? t.slice(0, 6000) + '\n[texto cortado]' : t,
      }
    },

    /** Busca por palavras (todas precisam aparecer no artigo); devolve até 8 artigos com um trecho. */
    buscar(termo, norma) {
      if (!disponivel()) return { erro: 'A base de leis não está disponível neste servidor.' }
      const palavras = normalizar(String(termo)).split(/\s+/).filter(p => p.length >= 3)
      if (palavras.length === 0) return { erro: 'Informe ao menos uma palavra com 3 letras ou mais.' }
      const chaves = norma ? [norma] : Object.keys(NORMAS)
      if (chaves.some(c => !NORMAS[c])) return { erro: `Norma desconhecida. Use: ${Object.keys(NORMAS).join(', ')}.` }
      const achados = []
      for (const chave of chaves) {
        for (const a of carregar(chave).values()) {
          const t = texto(a)
          const n = normalizar(t)
          if (!palavras.every(p => n.includes(p))) continue
          const pos = n.indexOf(palavras[0])
          const ocorrencias = palavras.reduce((s, p) => s + n.split(p).length - 1, 0)
          achados.push({
            ocorrencias,
            norma: NORMAS[chave].nome,
            chave,
            artigo: `Art. ${a.id}`,
            trecho: t.slice(Math.max(0, pos - 120), pos + 280).replace(/\s+/g, ' '),
          })
        }
      }
      achados.sort((x, y) => y.ocorrencias - x.ocorrencias)
      return {
        total: achados.length,
        resultados: achados.slice(0, 8).map(({ ocorrencias, ...r }) => r),
        dica: achados.length > 8 ? 'Há mais resultados: refine a busca ou consulte o artigo pelo número.' : undefined,
      }
    },
  }
}
