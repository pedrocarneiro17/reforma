"""
Gera src/data/partilhaSimples.ts a partir do texto da LC 214/2025 (Anexos I–V do Simples
Nacional) em .claude/skills/reforma-tributaria/lcp214/088–092.

Uso (na raiz do projeto):  python -I scripts/gerar_partilha_simples.py

Regras:
- lê as tabelas "Percentual de Repartição dos Tributos" de cada ano-calendário;
- quando a lei traz duas redações para o mesmo ano, vale a última (redação da LC 227/2026);
- as notas de teto do ISS (5ª faixa) não são tabelas principais e ficam de fora;
- colunas ausentes numa faixa (6ª faixa: ICMS/ISS/IBS fora do DAS) valem 0;
- toda linha precisa somar 100% (senão o script falha).
"""
import glob
import io
import os
import re

PCT = re.compile(r'^\s*(\d{1,3},\d{1,3})\s*%\s*(?:\(\*+\))?\s*$')
FAIXA = re.compile(r'^\s*(\d)\s*\S*\s*Faixa\s*$')
ANOS = re.compile(r'(?:Para o(?:s)? anos?-calend.rio|A partir do ano-calend.rio)\s+(\d{4})(?:\s+e\s+(\d{4}))?')
ORDEM = ['IRPJ', 'CSLL', 'CBS', 'CPP', 'IPI', 'ICMS', 'ISS', 'IBS']


def ler_anexo(path):
    linhas = io.open(path, encoding='utf-8', errors='replace').read().splitlines()
    ctx, tabelas, i = None, {}, 0
    while i < len(linhas):
        linha = linhas[i]
        m = ANOS.search(linha)
        if m:
            a = int(m.group(1))
            b = int(m.group(2)) if m.group(2) else a
            ctx = list(range(a, b + 1))
        if 'Percentual de Reparti' in linha:
            cols = []
            i += 1
            while i < len(linhas) and not FAIXA.match(linhas[i]):
                c = linhas[i].replace('(*)', '').strip()
                if c:
                    cols.append(c)
                i += 1
            faixas = {}
            while i < len(linhas):
                fm = FAIXA.match(linhas[i])
                if not fm:
                    break
                n, vals = int(fm.group(1)), []
                i += 1
                while i < len(linhas) and PCT.match(linhas[i]):
                    vals.append(float(PCT.match(linhas[i]).group(1).replace(',', '.')) / 100)
                    i += 1
                faixas[n] = dict(zip(cols, vals + [0.0] * (len(cols) - len(vals))))
            for ano in (ctx or []):
                tabelas[ano] = faixas  # redação mais recente (LC 227) vem depois e sobrescreve
            continue
        i += 1
    return tabelas


CAP_ISS = re.compile(r'efetivo m.ximo devido ao ISS ser. de ([\d,]+)\s*%')
LIMIAR = re.compile(r'efetiva for superior a ([\d,]+)\s*%')
MULT = re.compile(r'\(Al.quota efetiva - ([\d,]+)\s*%\)\s*x\s*([\d,]+)\s*%')
FIXO = re.compile(r'Percentual de ISS fixo em ([\d,]+)\s*%')


def _num(s):
    return float(s.replace(',', '.'))


def ler_limites_iss(path):
    """
    Notas "(*)" da 5ª faixa dos Anexos III e IV: acima de um limiar de alíquota efetiva o ISS
    fica limitado a um teto e a diferença é repartida entre os demais tributos na proporção
    informada. Devolve {ano: {limiar, iss_max, mult:{tributo: % do excedente}}} em pontos
    percentuais. Redação mais recente (LC 227/2026) sobrescreve a anterior; blocos que não
    seguem o formato esperado são ignorados (a redação seguinte do mesmo ano os substitui).
    """
    linhas = io.open(path, encoding='utf-8', errors='replace').read().splitlines()
    ctx, limites, i = None, {}, 0
    while i < len(linhas):
        linha = linhas[i]
        m = ANOS.search(linha)
        if m:
            a = int(m.group(1))
            b = int(m.group(2)) if m.group(2) else a
            ctx = list(range(a, b + 1))
        mc = CAP_ISS.search(linha)
        if mc and ctx:
            cap = _num(mc.group(1))
            limiar = _num(LIMIAR.search(linha).group(1))
            i += 1
            cols = []
            while i < len(linhas) and not re.match(r'^\s*5\S*\s*Faixa, com al.quota efetiva', linhas[i]):
                c = linhas[i].replace('(*)', '').strip()
                if c in ORDEM:  # ignora rótulos soltos (ex.: "Faixa") que alguns blocos trazem
                    cols.append(c)
                i += 1
                if len(cols) > 8:
                    break
            i += 1
            mult, ok = {}, True
            for col in cols:
                if i >= len(linhas):
                    ok = False
                    break
                if col == 'ISS':
                    f = FIXO.match(linhas[i].strip())
                    ok = ok and bool(f) and abs(_num(f.group(1)) - cap) < 1e-9
                else:
                    mm = MULT.match(linhas[i].strip())
                    ok = ok and bool(mm) and abs(_num(mm.group(1)) - cap) < 1e-9
                    if mm:
                        mult[col] = _num(mm.group(2))
                i += 1
            if ok and abs(sum(mult.values()) - 100) < 0.05:
                for ano in ctx:
                    limites[ano] = {'limiar': limiar, 'iss_max': cap, 'mult': mult}
            continue
        i += 1
    return limites


def fmt(v):
    return ('%.2f' % (v * 100)).rstrip('0').rstrip('.')


def fmt_pp(v):
    return ('%.5f' % v).rstrip('0').rstrip('.')


CABECALHO = """/**
 * Partilha oficial do DAS do Simples Nacional na transição da Reforma Tributária —
 * Anexos I a V da LC 214/2025 (redação da LC 227/2026), por ano-calendário e faixa.
 *
 * Valores em % do DAS (cada linha soma 100). GERADO por scripts/gerar_partilha_simples.py
 * a partir de .claude/skills/reforma-tributaria/lcp214/088–092. Não editar à mão.
 *
 * • 2027–2028: CBS substitui PIS/COFINS; IBS de teste (~0,17%); ICMS/ISS seguem no DAS
 * • 2029–2032: ICMS/ISS migram para o IBS (10%/ano do total de ICMS/ISS)
 * • 2033+:     só CBS e IBS — idênticos à partilha de PIS/COFINS e ICMS/ISS da LC 123/2006
 * • 6ª faixa: ICMS/ISS/IBS recolhidos fora do DAS (0 aqui)
 * Não modela as notas de teto do ISS na 5ª faixa (alíquota efetiva acima de 14,92537%).
 */

import type { AnexoSimples } from '../types'

export type TributoPartilhaSN = 'IRPJ' | 'CSLL' | 'CBS' | 'CPP' | 'IPI' | 'ICMS' | 'ISS' | 'IBS'
/** Partilha de uma faixa: % do DAS por tributo */
export type LinhaPartilhaSN = Partial<Record<TributoPartilhaSN, number>>

/** Anos com tabela própria; anos anteriores a 2027 usam a LC 123 (ver partilhaConsumoSimples) */
export const ANOS_PARTILHA_LC214 = [2027, 2028, 2029, 2030, 2031, 2032, 2033] as const

export const PARTILHA_SIMPLES_LC214: Record<AnexoSimples, Record<number, LinhaPartilhaSN[]>> = {"""

RODAPE = """}

/**
 * Teto do ISS na 5ª faixa (Anexos III e IV): quando a alíquota efetiva do DAS passa do limiar, o ISS
 * fica limitado a `issMax` (% da receita) e o excedente (alíquota efetiva − issMax) é repartido entre
 * os demais tributos na proporção `mult` (% do excedente). Valores em pontos percentuais.
 * Só 2027–2032: em 2033 o ISS é extinto e a lei não traz a nota.
 */
export interface LimiteIssSN {
  limiar: number
  issMax: number
  mult: Partial<Record<TributoPartilhaSN, number>>
}

export const LIMITE_ISS_5A_FAIXA: Partial<Record<AnexoSimples, Record<number, LimiteIssSN>>> = {
{LIMITES}}

/** Parcelas de tributos sobre consumo dentro do DAS (frações do DAS, 0–1) num ano */
export interface PartilhaConsumoSN {
  pisCofins: number  // até 2026 (LC 123)
  cbs: number        // a partir de 2027
  icmsIss: number    // até 2032 (decrescente a partir de 2029)
  ibs: number        // a partir de 2027 (teste em 2027–2028; cresce até 2033)
}

/**
 * Partilha de tributos sobre consumo do DAS para anexo/faixa/ano.
 * Antes de 2027 vale a LC 123/2006 — cujos PIS/COFINS e ICMS/ISS coincidem, linha a linha,
 * com a CBS e o IBS da tabela de 2033 da LC 214.
 */
export function partilhaConsumoSimples(
  anexo: AnexoSimples, faixaIdx: number, ano: number,
  /** alíquota efetiva do DAS (fração) — necessária para o teto do ISS na 5ª faixa */
  aliquotaEfetiva?: number,
): PartilhaConsumoSN {
  const tabela = PARTILHA_SIMPLES_LC214[anexo]
  const f = Math.min(5, Math.max(0, faixaIdx))
  if (ano < 2027) {
    const pleno = tabela[2033][f]
    return { pisCofins: (pleno.CBS ?? 0) / 100, cbs: 0, icmsIss: (pleno.IBS ?? 0) / 100, ibs: 0 }
  }
  const lim = f === 4 && aliquotaEfetiva ? LIMITE_ISS_5A_FAIXA[anexo]?.[ano] : undefined
  if (lim && aliquotaEfetiva! * 100 > lim.limiar) {
    const excesso = aliquotaEfetiva! - lim.issMax / 100
    return {
      pisCofins: 0,
      cbs: (excesso * (lim.mult.CBS ?? 0)) / 100 / aliquotaEfetiva!,
      icmsIss: lim.issMax / 100 / aliquotaEfetiva!,
      ibs: (excesso * (lim.mult.IBS ?? 0)) / 100 / aliquotaEfetiva!,
    }
  }
  const linha = tabela[Math.min(2033, ano)][f]
  return {
    pisCofins: 0,
    cbs: (linha.CBS ?? 0) / 100,
    icmsIss: ((linha.ICMS ?? 0) + (linha.ISS ?? 0)) / 100,
    ibs: (linha.IBS ?? 0) / 100,
  }
}
"""


def main():
    raiz = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    base = os.path.join(raiz, '.claude', 'skills', 'reforma-tributaria', 'lcp214')
    arquivos = {'I': '088', 'II': '089', 'III': '090', 'IV': '091', 'V': '092'}
    out = [CABECALHO]
    limites = {}
    for anexo, num in arquivos.items():
        arquivo = glob.glob(os.path.join(base, num + '-*.md'))[0]
        if anexo in ('III', 'IV'):
            limites[anexo] = ler_limites_iss(arquivo)
            assert sorted(limites[anexo]) == list(range(2027, 2033)), (anexo, sorted(limites[anexo]))
        tabelas = ler_anexo(arquivo)
        assert sorted(tabelas) == list(range(2027, 2034)), (anexo, sorted(tabelas))
        out.append('  %s: {' % anexo)
        for ano in sorted(tabelas):
            faixas = tabelas[ano]
            assert sorted(faixas) == [1, 2, 3, 4, 5, 6], (anexo, ano, sorted(faixas))
            out.append('    %d: [' % ano)
            for f in sorted(faixas):
                r = faixas[f]
                assert abs(sum(r.values()) - 1) < 0.0006, (anexo, ano, f, sum(r.values()))
                campos = ', '.join('%s: %s' % (k, fmt(r[k])) for k in ORDEM if r.get(k, 0) > 0)
                out.append('      { %s },' % campos)
            out.append('    ],')
        out.append('  },')
    blocos = []
    for anexo in ('III', 'IV'):
        blocos.append('  %s: {' % anexo)
        for ano in sorted(limites[anexo]):
            l = limites[anexo][ano]
            mult = ', '.join('%s: %s' % (k, fmt_pp(l['mult'][k])) for k in ORDEM if k in l['mult'])
            blocos.append('    %d: { limiar: %s, issMax: %s, mult: { %s } },' % (ano, fmt_pp(l['limiar']), fmt_pp(l['iss_max']), mult))
        blocos.append('  },')
    out.append(RODAPE.replace('{LIMITES}', '\n'.join(blocos) + '\n'))
    dest =os.path.join(raiz, 'src', 'data', 'partilhaSimples.ts')
    io.open(dest, 'w', encoding='utf-8', newline='\n').write('\n'.join(out))
    print('ok:', dest)


if __name__ == '__main__':
    main()
