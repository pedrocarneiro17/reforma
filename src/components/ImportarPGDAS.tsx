import { useRef, useState } from 'react'
import { lerPGDAS, type DadosPGDAS } from '../utils/pgdas'

interface ImportarPGDASProps {
  onImport: (dados: DadosPGDAS) => void
}

/**
 * Botão/área para importar um PGDAS-D (PDF) e preencher o formulário automaticamente.
 * O PDF é lido inteiramente no navegador (pdf.js) e descartado — nada é enviado nem salvo.
 */
export default function ImportarPGDAS({ onImport }: ImportarPGDASProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [estado, setEstado] = useState<'idle' | 'lendo' | 'erro'>('idle')
  const [erro, setErro] = useState('')
  const [arrasta, setArrasta] = useState(false)

  const processar = async (file: File | undefined) => {
    if (!file) return
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setEstado('erro'); setErro('Envie o PDF do PGDAS-D (Extrato do Simples Nacional).'); return
    }
    setEstado('lendo'); setErro('')
    try {
      const dados = await lerPGDAS(file)
      if (!dados.optanteSimples && dados.faturamentoMensal == null) {
        setEstado('erro')
        setErro('Não reconheci este PDF como um PGDAS-D. Confira se é o extrato correto.')
        return
      }
      onImport(dados)
      setEstado('idle')
    } catch (e) {
      console.error('Falha ao ler PGDAS:', e)
      setEstado('erro'); setErro('Não consegui ler este PDF. Ele pode estar protegido ou não ser um PGDAS-D.')
    } finally {
      // limpa o input para permitir reimportar o mesmo arquivo e não reter referência
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="card p-5 border-l-4 border-l-info space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-ink">Importar do PGDAS-D (opcional)</h3>
          <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
            Suba o PDF do extrato do Simples Nacional e preenchemos regime, faturamento, UF, anexo e a
            alíquota real automaticamente. O arquivo é lido no seu navegador e <strong>descartado</strong> — não é enviado nem salvo.
          </p>
        </div>
      </div>

      <div
        onDragOver={e => { e.preventDefault(); setArrasta(true) }}
        onDragLeave={() => setArrasta(false)}
        onDrop={e => { e.preventDefault(); setArrasta(false); processar(e.dataTransfer.files?.[0]) }}
        onClick={() => estado !== 'lendo' && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if ((e.key === 'Enter' || e.key === ' ') && estado !== 'lendo') inputRef.current?.click() }}
        className={`rounded-xl border-2 border-dashed px-4 py-6 text-center cursor-pointer transition-colors
          ${arrasta ? 'border-info bg-info-soft' : 'border-[#C4BDB4] hover:border-info hover:bg-[#FBFAF7]'}
          ${estado === 'lendo' ? 'opacity-70 cursor-wait' : ''}`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={e => processar(e.target.files?.[0])}
        />
        {estado === 'lendo' ? (
          <p className="text-sm text-ink-secondary font-medium">Lendo o PGDAS…</p>
        ) : (
          <>
            <p className="text-sm text-ink font-medium">Arraste o PDF aqui ou clique para selecionar</p>
            <p className="text-[11px] text-ink-muted mt-1">PGDAS-D · Declaração do Simples Nacional (PDF)</p>
          </>
        )}
      </div>

      {estado === 'erro' && (
        <p className="text-danger text-xs leading-relaxed">{erro}</p>
      )}
    </div>
  )
}
