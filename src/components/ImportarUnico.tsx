import { useRef, useState } from 'react'
import {
  analisarArquivoUnico, sugerirFormulario, ErroUnico, ESCOLHA_PADRAO,
  ROTULO_CATEGORIA, ROTULO_NATUREZA, ROTULO_SITUACAO,
  type CategoriaReceita, type EscolhaCredito, type NaturezaEntrada, type ResumoUnico, type SituacaoCredito, type SugestaoFormulario,
} from '../utils/unico'

interface ImportarUnicoProps {
  /** Recebe a sugestão de campos e as linhas de conferência para mostrar depois da aplicação */
  onImport: (sugestao: SugestaoFormulario, conferencia: string[]) => void
}

const moeda = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const pct = (parte: number, total: number) => (total > 0 ? `${((parte / total) * 100).toFixed(1).replace('.', ',')}%` : '—')
const mesLabel = (m: string) => { const [a, mm] = m.split('-'); return `${mm}/${a}` }

/**
 * Importa o CSV de Produtos do Único (entradas, saídas, serviços prestados e tomados).
 * O arquivo é lido no navegador, resumido e descartado — nada é enviado nem salvo.
 */
export default function ImportarUnico({ onImport }: ImportarUnicoProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<'idle' | 'lendo' | 'erro'>('idle')
  const [erro, setErro] = useState('')
  const [arrasta, setArrasta] = useState(false)
  const [resumo, setResumo] = useState<ResumoUnico | null>(null)
  const [escolha, setEscolha] = useState<EscolhaCredito>(ESCOLHA_PADRAO)

  const processar = async (file: File | undefined) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.csv')) {
      setEstado('erro'); setErro('Envie o arquivo CSV exportado do Único (Produtos).'); return
    }
    setEstado('lendo'); setErro('')
    try {
      setResumo(analisarArquivoUnico(await file.arrayBuffer()))
      setEscolha(ESCOLHA_PADRAO)
      setEstado('idle')
    } catch (e) {
      setResumo(null)
      setEstado('erro')
      setErro(e instanceof ErroUnico ? e.message : 'Não consegui ler este arquivo. Confira se é o CSV de Produtos do Único.')
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  const aplicar = () => {
    if (!resumo) return
    const s = sugerirFormulario(resumo, escolha)
    const c = resumo.receita.porCategoria
    const conferencia = [
      `Período: ${mesLabel(resumo.periodo.inicio)} a ${mesLabel(resumo.periodo.fim)} (${resumo.periodo.meses} meses)`,
      `Faturamento médio mensal: ${moeda(s.faturamentoMensal)} (receita total ${moeda(resumo.receita.total)})`,
      `Compras consideradas para crédito: ${moeda(s.insumosMensais)}/mês${s.pctFornecedoresSimples > 0 ? `, ${s.pctFornecedoresSimples}% sem IBS/CBS destacado (crédito parcial)` : ''}`,
      s.setorValue ? 'Setor: Hotéis, Pousadas, Flats e Temporada (hospedagem é a maior parte da receita)' : 'Setor não identificado — selecione manualmente',
      s.anexo1 && s.anexo2 && s.pctAnexo1 != null
        ? `Receita mista: ${s.pctAnexo1.toString().replace('.', ',')}% serviço (Anexo ${s.anexo1}) e o restante mercadoria (Anexo ${s.anexo2}) — confira o anexo no PGDAS-D`
        : 'Receita de uma só natureza',
      `Itens de alíquota cheia (bebidas alcoólicas e de terceiros): ${s.pctReceitaAliquotaCheia.toString().replace('.', ',')}% da receita`,
      ...(c.alimentacao_preparada > 0 ? ['Alimentação preparada reconhecida pela descrição do item — confirme o preparo no estabelecimento'] : []),
      'Regime atual e perfil de clientes não vêm do arquivo: escolha abaixo',
    ]
    onImport(s, conferencia)
    setResumo(null)
  }

  const alternar = (k: SituacaoCredito) => setEscolha(e => ({ ...e, [k]: !e[k] }))

  return (
    <div className="card p-5 border-l-4 border-l-info space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-ink">Importar CSV do Único (opcional)</h3>
        <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
          Suba o CSV de Produtos (entradas, saídas e serviços) e somamos a receita por tipo, classificamos as compras e
          preenchemos o formulário. O arquivo é lido no seu navegador e <strong>descartado</strong> — não é enviado nem salvo.
        </p>
      </div>

      {!resumo && (
        <div
          onDragOver={e => { e.preventDefault(); setArrasta(true) }}
          onDragLeave={() => setArrasta(false)}
          onDrop={e => { e.preventDefault(); setArrasta(false); processar(e.dataTransfer.files?.[0]) }}
          onClick={() => estado !== 'lendo' && inputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && estado !== 'lendo') inputRef.current?.click() }}
          className={`rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors
            ${arrasta ? 'border-info bg-info-soft' : 'border-[#AFB7C0] hover:border-info hover:bg-[#F5F6F7]'}
            ${estado === 'lendo' ? 'opacity-70 cursor-wait' : ''}`}
        >
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => processar(e.target.files?.[0])} />
          {estado === 'lendo' ? (
            <p className="text-sm text-ink-secondary font-medium">Lendo o arquivo…</p>
          ) : (
            <>
              <p className="text-sm text-ink font-medium">Arraste o CSV aqui ou clique para selecionar</p>
              <p className="text-[11px] text-ink-muted mt-1">Único · exportação de Produtos (.csv)</p>
            </>
          )}
        </div>
      )}

      {estado === 'erro' && <p className="text-danger text-xs leading-relaxed">{erro}</p>}

      {resumo && (
        <div className="space-y-4 text-xs text-ink-secondary">
          <p className="text-sm font-semibold text-ink">
            Resumo de {mesLabel(resumo.periodo.inicio)} a {mesLabel(resumo.periodo.fim)} ({resumo.periodo.meses} meses)
          </p>

          <div>
            <p className="font-semibold text-ink mb-1">Receita — {moeda(resumo.receita.total)} (média {moeda(resumo.receita.mediaMensal)}/mês)</p>
            <table className="w-full">
              <tbody>
                {(Object.keys(resumo.receita.porCategoria) as CategoriaReceita[])
                  .filter(k => resumo.receita.porCategoria[k] > 0)
                  .map(k => (
                    <tr key={k} className="border-b border-border last:border-0">
                      <td className="py-1">{ROTULO_CATEGORIA[k]}</td>
                      <td className="py-1 text-right num">{moeda(resumo.receita.porCategoria[k])}</td>
                      <td className="py-1 text-right num text-ink-muted w-16">{pct(resumo.receita.porCategoria[k], resumo.receita.total)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="font-semibold text-ink mb-1">Entradas — {moeda(resumo.entradas.total)} (já sem descontos)</p>
            <table className="w-full">
              <tbody>
                {(Object.keys(resumo.entradas.porNatureza) as NaturezaEntrada[])
                  .filter(k => resumo.entradas.porNatureza[k] > 0)
                  .map(k => (
                    <tr key={k} className="border-b border-border last:border-0">
                      <td className="py-1">{ROTULO_NATUREZA[k]}</td>
                      <td className="py-1 text-right num">{moeda(resumo.entradas.porNatureza[k])}</td>
                      <td className="py-1 text-right num text-ink-muted w-16">{pct(resumo.entradas.porNatureza[k], resumo.entradas.total)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div>
            <p className="font-semibold text-ink mb-1">Quais compras contam como base de crédito?</p>
            <div className="space-y-1.5">
              {(Object.keys(resumo.entradas.porSituacao) as SituacaoCredito[])
                .filter(k => resumo.entradas.porSituacao[k] > 0)
                .map(k => (
                  <label key={k} className="flex items-start gap-2 cursor-pointer">
                    <input type="checkbox" checked={escolha[k]} onChange={() => alternar(k)} className="mt-0.5" />
                    <span className="flex-1">{ROTULO_SITUACAO[k]}</span>
                    <span className="num">{moeda(resumo.entradas.porSituacao[k])}</span>
                  </label>
                ))}
            </div>
            <p className="text-[11px] text-ink-muted mt-1.5 leading-relaxed">
              Compras sem destaque entram com crédito parcial (tratadas como fornecedor do Simples). Monofásico e alíquota zero ficam de fora por padrão.
            </p>
          </div>

          {resumo.outrasMercadoriasDescricoes.length > 0 && (
            <p className="leading-relaxed">
              <strong className="text-ink">Mercadorias não classificadas</strong> (tratadas como alíquota cheia): {resumo.outrasMercadoriasDescricoes.join('; ')}.
            </p>
          )}

          <ul className="list-disc pl-5 space-y-1 text-ink-muted">
            {resumo.avisos.map((a, i) => <li key={i}>{a}</li>)}
          </ul>

          <div className="flex gap-2">
            <button type="button" onClick={aplicar} className="btn-primary">Aplicar ao formulário</button>
            <button type="button" onClick={() => setResumo(null)} className="btn-secondary">Descartar</button>
          </div>
        </div>
      )}
    </div>
  )
}
