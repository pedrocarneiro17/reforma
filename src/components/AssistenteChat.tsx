import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { MessageCircle, Send, X, Loader2, AlertCircle } from 'lucide-react'
import { useApi } from '../auth/useApi'
import { CAMPOS_EMPRESA } from '../assistente/ferramentas'
import type { DadosEntrada } from '../types'

interface Mensagem {
  role: 'user' | 'assistant'
  content: string
  consultas?: string[]   // o que o assistente consultou para responder (transparência)
}

const NOMES_CONSULTA: Record<string, string> = {
  calcular_cenarios: 'cálculo da empresa',
  comparar_regimes: 'comparação de regimes',
  simular_crescimento: 'simulação de crescimento',
  listar_setores: 'lista de setores',
  buscar_na_lei: 'busca na lei',
  consultar_artigo: 'texto da lei',
}

const SUGESTOES_COM_SIMULACAO = [
  'Quanto vou pagar a mais ou a menos em 2033?',
  'Qual regime compensa mais para a minha empresa?',
  'E se meu faturamento dobrar?',
]
const SUGESTOES_SEM_SIMULACAO = [
  'Como funciona o crédito de IBS e CBS?',
  'O que muda para quem está no Simples Nacional?',
  'Hotel que vende bebida alcoólica paga a mesma alíquota?',
]

/** Reduz os dados da simulação ao que o assistente aceita (e troca o setor pelo código). */
export function contextoDoAssistente(dados: DadosEntrada | null): Record<string, unknown> | null {
  if (!dados) return null
  const origem = { ...dados, setor: dados.setor?.value } as unknown as Record<string, unknown>
  const saida: Record<string, unknown> = {}
  for (const k of CAMPOS_EMPRESA) if (origem[k] !== undefined && origem[k] !== null) saida[k] = origem[k]
  return saida
}

/** **negrito** sem usar HTML cru: o texto da IA nunca vira marcação. */
function comNegrito(texto: string): ReactNode[] {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith('**') && parte.endsWith('**') && parte.length > 4
      ? <strong key={i}>{parte.slice(2, -2)}</strong>
      : <span key={i}>{parte}</span>,
  )
}

function Texto({ texto }: { texto: string }) {
  const blocos: ReactNode[] = []
  let itens: string[] = []
  const fecharLista = (chave: number) => {
    if (itens.length) {
      blocos.push(
        <ul key={`l${chave}`} className="list-disc pl-5 space-y-1">
          {itens.map((it, i) => <li key={i}>{comNegrito(it)}</li>)}
        </ul>,
      )
      itens = []
    }
  }
  texto.split('\n').forEach((linha, i) => {
    const item = /^\s*[-*•]\s+(.*)$/.exec(linha)
    if (item) { itens.push(item[1]); return }
    fecharLista(i)
    if (linha.trim()) blocos.push(<p key={`p${i}`}>{comNegrito(linha)}</p>)
  })
  fecharLista(texto.length)
  return <div className="space-y-2">{blocos}</div>
}

export default function AssistenteChat({ dados }: { dados: DadosEntrada | null }) {
  const { req } = useApi()
  const [disponivel, setDisponivel] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [texto, setTexto] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const fimRef = useRef<HTMLDivElement>(null)
  const contexto = contextoDoAssistente(dados)

  useEffect(() => {
    let vivo = true
    req('/api/assistente/status')
      .then(r => r.ok ? r.json() : { disponivel: false })
      .then(d => { if (vivo) setDisponivel(Boolean(d.disponivel)) })
      .catch(() => { if (vivo) setDisponivel(false) })
    return () => { vivo = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { fimRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensagens, carregando])

  if (!disponivel) return null

  const enviar = async (pergunta: string) => {
    const limpa = pergunta.trim()
    if (!limpa || carregando) return
    const historico: Mensagem[] = [...mensagens, { role: 'user', content: limpa }]
    setMensagens(historico)
    setTexto('')
    setErro('')
    setCarregando(true)
    try {
      const res = await req('/api/assistente', {
        method: 'POST',
        body: JSON.stringify({
          mensagens: historico.map(m => ({ role: m.role, content: m.content })),
          contexto,
        }),
      })
      const corpo = await res.json().catch(() => ({}))
      if (!res.ok) { setErro(corpo.erro || 'O assistente não conseguiu responder agora.'); return }
      const consultas = [...new Set<string>((corpo.passos ?? []).map((p: { ferramenta: string }) => NOMES_CONSULTA[p.ferramenta] ?? p.ferramenta))]
      setMensagens([...historico, { role: 'assistant', content: corpo.resposta, consultas }])
    } catch {
      setErro('Não foi possível falar com o assistente. Verifique a conexão e tente de novo.')
    } finally {
      setCarregando(false)
    }
  }

  const sugestoes = contexto ? SUGESTOES_COM_SIMULACAO : SUGESTOES_SEM_SIMULACAO

  return (
    <div className="no-print">
      {!aberto && (
        <button
          onClick={() => setAberto(true)}
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-full bg-prim text-white px-4 py-3 shadow-lg hover:opacity-90 transition-opacity"
          aria-label="Abrir o assistente de perguntas"
        >
          <MessageCircle size={18} strokeWidth={1.75} />
          <span className="text-sm font-medium">Assistente</span>
        </button>
      )}

      {aberto && (
        <section
          className="fixed z-50 bottom-0 right-0 sm:bottom-5 sm:right-5 w-full sm:w-[420px] h-[85vh] sm:h-[620px] max-h-screen bg-white border border-border sm:rounded-2xl shadow-2xl flex flex-col"
          aria-label="Assistente de perguntas"
        >
          <header className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <h2 className="font-display text-sm font-semibold text-ink">Assistente</h2>
              <p className="text-2xs text-ink-muted">
                {contexto ? 'Responde com base na simulação aberta' : 'Responde sobre a Reforma Tributária'}
              </p>
            </div>
            <button onClick={() => setAberto(false)} className="p-1.5 rounded hover:bg-surface text-ink-muted" aria-label="Fechar o assistente">
              <X size={16} />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 text-sm text-ink-secondary leading-relaxed">
            {mensagens.length === 0 && (
              <div className="space-y-3">
                <p>Pergunte sobre a sua simulação ou sobre as regras da reforma. Os números vêm do mesmo motor de cálculo do simulador, e a lei é consultada no texto da LC 214/2025 e do Decreto 12.955/2026.</p>
                <div className="flex flex-col gap-2">
                  {sugestoes.map(s => (
                    <button key={s} onClick={() => enviar(s)} className="text-left text-xs rounded-lg border border-border px-3 py-2 hover:bg-surface text-ink">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mensagens.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
                <div className={m.role === 'user'
                  ? 'max-w-[85%] rounded-2xl rounded-br-sm bg-prim text-white px-3 py-2 whitespace-pre-wrap'
                  : 'max-w-full'}>
                  {m.role === 'user' ? m.content : <Texto texto={m.content} />}
                  {m.consultas && m.consultas.length > 0 && (
                    <p className="mt-2 text-2xs text-ink-muted">Consultou: {m.consultas.join(', ')}</p>
                  )}
                </div>
              </div>
            ))}

            {carregando && (
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Loader2 size={14} className="animate-spin" /> Consultando o motor…
              </div>
            )}
            {erro && (
              <div className="flex items-start gap-2 text-xs text-danger bg-danger-soft border border-danger-border rounded-lg px-3 py-2">
                <AlertCircle size={14} className="flex-shrink-0 mt-0.5" /> <span>{erro}</span>
              </div>
            )}
            <div ref={fimRef} />
          </div>

          <form
            onSubmit={e => { e.preventDefault(); enviar(texto) }}
            className="border-t border-border p-3 flex items-end gap-2"
          >
            <textarea
              value={texto}
              onChange={e => setTexto(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(texto) } }}
              rows={2}
              maxLength={4000}
              placeholder="Escreva sua pergunta…"
              className="flex-1 resize-none rounded-lg border border-border px-3 py-2 text-sm focus:outline-none focus:border-ink-muted"
            />
            <button type="submit" disabled={carregando || !texto.trim()} className="btn-primary !px-3 !py-2" aria-label="Enviar pergunta">
              <Send size={15} />
            </button>
          </form>
          <p className="px-4 pb-3 text-2xs text-ink-muted leading-snug">
            Estimativas para apoio à decisão. Confira com seu contador antes de decidir.
          </p>
        </section>
      )}
    </div>
  )
}
