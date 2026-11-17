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


def fmt(v):
    return ('%.2f' % (v * 100)).rstrip('0').rstrip('.')


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
export function partilhaConsumoSimples(anexo: AnexoSimples, faixaIdx: number, ano: number): PartilhaConsumoSN {
  const tabela = PARTILHA_SIMPLES_LC214[anexo]
  const f = Math.min(5, Math.max(0, faixaIdx))
  if (ano < 2027) {
    const pleno = tabela[2033][f]
    return { pisCofins: (pleno.CBS ?? 0) / 100, cbs: 0, icmsIss: (pleno.IBS ?? 0) / 100, ibs: 0 }
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
    for anexo, num in arquivos.items():
        tabelas = ler_anexo(glob.glob(os.path.join(base, num + '-*.md'))[0])
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
    out.append(RODAPE)
    dest = os.path.join(raiz, 'src', 'data', 'partilhaSimples.ts')
    io.open(dest, 'w', encoding='utf-8', newline='\n').write('\n'.join(out))
    print('ok:', dest)


if __name__ == '__main__':
    main()
