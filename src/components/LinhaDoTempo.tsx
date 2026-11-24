import { fmt, anoVigenteAnalise, ANO_PLENO } from '../engine/calculadora'
import type { ProjecaoAno, ResultadoCalculo } from '../types'

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

const classeVariacao = (v: number) => (v > 0.5 ? 'text-danger' : v < -0.5 ? 'text-success' : 'text-ink')
const setaVariacao = (v: number) => (v > 0.5 ? '▲' : v < -0.5 ? '▼' : '=')

/**
 * Duas visões isoladas — o ano vigente (hoje, a previsão de 2027; em 2028 passa a ser 2028, e assim por diante) e o
 * fim do processo (2033) — mais o panorama do avanço da reforma de 2026 a 2033, só para leitura. Os anos
 * intermediários não têm visão própria até chegarem: aparecem apenas no panorama.
 */
export default function LinhaDoTempo({ resultados, onMudarAno }: Props) {
  const { projecaoAnos, anoAnalise, aliquotaReferencia, impostoAtualMensal } = resultados
  const vigente = anoVigenteAnalise()
  const temVigente = vigente !== ANO_PLENO
  const anoCorrente = new Date().getFullYear()
  const previsao = anoCorrente < vigente   // o ano vigente ainda não começou: é previsão
  const ponto = (ano: number): ProjecaoAno | undefined => projecaoAnos.find(p => p.ano === ano)
  const atual = ponto(anoAnalise)
  const temHibrido = projecaoAnos.some(p => p.hibrido != null)

  const visoes: { ano: number; titulo: string; subtitulo: string }[] = [
    ...(temVigente ? [{
      ano: vigente,
      titulo: previsao ? `Próximo ano · ${vigente}` : `Ano vigente · ${vigente}`,
      subtitulo: previsao ? 'previsão' : 'em curso',
    }] : []),
    { ano: ANO_PLENO, titulo: `Visão final · ${ANO_PLENO}`, subtitulo: 'regime pleno' },
  ]

  return (
    <div className="card p-4 sm:p-5 space-y-4 no-print">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="text-sm font-semibold text-ink font-display">Impacto da reforma</h3>
        <p className="text-xs text-ink-muted">
          O ano vigente e o fim do processo, com o avanço de toda a transição logo abaixo.
        </p>
      </div>

      {/* ── As duas visões ─────────────────────────────────────────────── */}
      <div className={`grid gap-3 ${visoes.length > 1 ? 'sm:grid-cols-2' : ''}`} role="tablist" aria-label="Visão da análise">
        {visoes.map(v => {
          const p = ponto(v.ano)
          const ativo = v.ano === anoAnalise
          return (
            <button
              key={v.ano}
              role="tab"
              aria-selected={ativo}
              onClick={() => onMudarAno(v.ano)}
              className={`rounded-lg border px-4 py-3 text-left transition-colors
                ${ativo ? 'border-ink bg-subtle ring-1 ring-ink' : 'border-border hover:border-ink-muted'}`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-bold text-ink">{v.titulo}</span>
                <span className="text-[11px] uppercase tracking-wide text-ink-muted">{v.subtitulo}</span>
              </div>
              {p && (
                <div className="mt-1 flex items-baseline gap-2 flex-wrap">
                  <span className="text-lg font-bold num text-ink">{fmt.moeda(p.impostoMensal)}<span className="text-xs font-normal text-ink-muted">/mês</span></span>
                  <span className={`text-xs font-medium num ${classeVariacao(p.variacaoMensal)}`}>
                    {setaVariacao(p.variacaoMensal)} {Math.abs(p.variacaoPercentual).toFixed(1).replace('.', ',')}% vs. hoje
                  </span>
                </div>
              )}
            </button>
          )
        })}
      </div>

      {/* ── Panorama: o avanço da reforma, só leitura ───────────────────── */}
      <div>
        <p className="text-xs font-medium text-ink-secondary mb-2">
          Panorama da transição · 2026 → 2033 <span className="font-normal text-ink-muted">(carga mensal e variação contra hoje, em cada ano)</span>
        </p>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
          {projecaoAnos.map(p => {
            const destaque = p.ano === anoAnalise
            return (
              <div
                key={p.ano}
                className={`rounded-lg border px-2 py-2 text-center ${destaque ? 'border-ink bg-subtle' : 'border-border'}`}
              >
                <div className={`text-sm font-bold num ${destaque ? 'text-ink' : 'text-ink-secondary'}`}>{p.ano}</div>
                <div className="text-[11px] text-ink-muted num leading-tight mt-0.5">{fmt.moeda(p.impostoMensal)}</div>
                <div className={`text-[11px] font-medium num leading-tight ${p.ano === 2026 ? 'text-ink-muted' : classeVariacao(p.variacaoMensal)}`}>
                  {p.ano === 2026 ? 'hoje' : `${setaVariacao(p.variacaoMensal)} ${Math.abs(p.variacaoPercentual).toFixed(1).replace('.', ',')}%`}
                </div>
                {temHibrido && (
                  <div className={`text-[10px] leading-tight mt-0.5 ${p.hibrido?.vale ? 'text-success' : 'text-ink-muted'}`}>
                    {p.hibrido == null ? '—' : p.hibrido.vale ? 'híbrido vale' : 'híbrido não'}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Detalhe da visão escolhida ──────────────────────────────────── */}
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
              Frente a hoje ({fmt.moeda(impostoAtualMensal)}/mês): <strong className={`num ${classeVariacao(atual.variacaoMensal)}`}>
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
