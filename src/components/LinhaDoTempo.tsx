import { fmt } from '../engine/calculadora'
import type { ResultadoCalculo } from '../types'

const pctRef = (x: number) => `${(x * 100).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`

/** O que muda em cada ano, com a base legal (LC 214/2025). */
const FASE_DO_ANO: Record<number, string> = {
  2026: 'Ano de teste: CBS de 0,9% e IBS de 0,1% só no destaque da nota, compensados com o PIS/COFINS — sem custo a mais (arts. 343, 346 e 348). O Simples Nacional fica de fora.',
  2027: 'A CBS passa a valer na alíquota de referência e substitui o PIS/COFINS (art. 347 reduz 0,1 p.p. em 2027–2028, compensado pelo IBS de teste de 0,05% + 0,05% do art. 344). ICMS e ISS seguem inteiros.',
  2028: 'Igual a 2027: CBS na alíquota de referência no lugar do PIS/COFINS; IBS ainda só de teste; ICMS e ISS inteiros.',
  2029: 'O IBS entra com 10% da alíquota plena e o ICMS e o ISS caem 10% (arts. 361, 501 e 508).',
  2030: 'IBS em 20% da alíquota plena; ICMS e ISS em 80% do que eram.',
  2031: 'IBS em 30% da alíquota plena; ICMS e ISS em 70% do que eram.',
  2032: 'IBS em 40% da alíquota plena; ICMS e ISS em 60% do que eram — último ano com os dois convivendo.',
  2033: 'Regime pleno: IBS e CBS nas alíquotas de referência cheias; ICMS e ISS extintos.',
}

interface Props {
  resultados: ResultadoCalculo
  onMudarAno: (ano: number) => void
}

/**
 * Seletor do ano da transição. Cada botão mostra a carga mensal e a variação contra hoje naquele ano; ao escolher
 * um ano, todo o painel (alíquotas, créditos, Simples híbrido, comparador, preço) passa a descrever aquele ano.
 */
export default function LinhaDoTempo({ resultados, onMudarAno }: Props) {
  const { projecaoAnos, anoAnalise, aliquotaReferencia, impostoAtualMensal } = resultados
  const hoje = impostoAtualMensal
  const atual = projecaoAnos.find(p => p.ano === anoAnalise)
  const temHibrido = projecaoAnos.some(p => p.hibrido != null)

  return (
    <div className="card p-4 sm:p-5 space-y-3 no-print">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-sm font-semibold text-ink font-display">Ano da transição em análise</h3>
        <p className="text-xs text-ink-muted">
          A reforma entra aos poucos: escolha o ano e o painel inteiro passa a mostrar aquele ano.
        </p>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-8 gap-2" role="tablist" aria-label="Ano da transição">
        {projecaoAnos.map(p => {
          const ativo = p.ano === anoAnalise
          const sobe = p.variacaoMensal > 0.5
          const cai = p.variacaoMensal < -0.5
          return (
            <button
              key={p.ano}
              role="tab"
              aria-selected={ativo}
              onClick={() => onMudarAno(p.ano)}
              className={`rounded-lg border px-2 py-2 text-center transition-colors
                ${ativo ? 'border-ink bg-subtle ring-1 ring-ink' : 'border-border hover:border-ink-muted'}`}
            >
              <div className={`text-sm font-bold num ${ativo ? 'text-ink' : 'text-ink-secondary'}`}>{p.ano}</div>
              <div className="text-[11px] text-ink-muted num leading-tight mt-0.5">{fmt.moeda(p.impostoMensal)}</div>
              <div className={`text-[11px] font-medium num leading-tight ${sobe ? 'text-danger' : cai ? 'text-success' : 'text-ink-muted'}`}>
                {p.ano === 2026 ? 'hoje' : sobe ? '▲' : cai ? '▼' : '='} {p.ano === 2026 ? '' : `${Math.abs(p.variacaoPercentual).toFixed(1).replace('.', ',')}%`}
              </div>
              {temHibrido && (
                <div className={`text-[10px] leading-tight mt-0.5 ${p.hibrido?.vale ? 'text-success' : 'text-ink-muted'}`}>
                  {p.hibrido == null ? '—' : p.hibrido.vale ? 'híbrido vale' : 'híbrido não'}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {atual && (
        <div className="text-xs text-ink-secondary bg-subtle rounded-md px-3 py-2.5 leading-relaxed space-y-1">
          {atual.ano === 2026 ? (
            <p>
              <strong className="text-ink">Em 2026:</strong> nada de IBS/CBS a recolher (só o teste de 0,9% + 0,1%) · PIS/COFINS e ICMS/ISS
              {' '}em <strong className="num text-ink">100%</strong> do que são hoje.
            </p>
          ) : (
            <p>
              <strong className="text-ink">Em {atual.ano}:</strong> CBS <strong className="num text-ink">{pctRef(atual.aliquotaCBS)}</strong>
              {' '}+ IBS <strong className="num text-ink">{pctRef(atual.aliquotaIBS)}</strong>
              {' '}= <strong className="num text-ink">{pctRef(atual.aliquotaCBS + atual.aliquotaIBS)}</strong> de IVA em vigor (de {pctRef(aliquotaReferencia)} no ano pleno)
              {' '}· ICMS/ISS em <strong className="num text-ink">{Math.round(atual.fracaoLegadoIcmsIss * 100)}%</strong> do que são hoje.
            </p>
          )}
          <p>{FASE_DO_ANO[atual.ano]}</p>
          {atual.ano !== 2026 && (
            <p>
              Frente a hoje ({fmt.moeda(hoje)}/mês): <strong className={`num ${atual.variacaoMensal > 0.5 ? 'text-danger' : atual.variacaoMensal < -0.5 ? 'text-success' : 'text-ink'}`}>
                {atual.variacaoMensal > 0 ? '+' : atual.variacaoMensal < 0 ? '−' : ''}{fmt.moeda(Math.abs(atual.variacaoMensal))}/mês
              </strong>
              {atual.reajustePrecoNecessario > 0 && <> · preço para manter a margem: <strong className="num text-ink">+{atual.reajustePrecoNecessario.toFixed(2).replace('.', ',')}%</strong></>}.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
