/**
 * GrupoEmpresas — Módulo de análise societária para Simples Nacional
 *
 * Regra LC 123/2006, Art. 3º, §4º, IV:
 *   Se o sócio tiver mais de 10% do capital em outra empresa, os faturamentos somam.
 *   Se a soma ultrapassar R$ 4.800.000/ano → todas são desenquadradas do Simples.
 *   (Aproximação prática: o inciso V — sócio administrador de outra PJ com fins
 *    lucrativos — dispensa o piso de 10%, mas não é modelado aqui.)
 *
 * Cada empresa do grupo suporta:
 *   - Modo simples: faturamento mensal médio (campo único)
 *   - Modo detalhado: histórico real de 12 meses via DadosMensais
 */

import { useState } from 'react'
import { fmt, LIMITE_SIMPLES_NACIONAL_ANUAL } from '../engine/calculadora'
import DadosMensais from './DadosMensais'
import type { EmpresaGrupo, AggregateMeses } from '../types'

interface GrupoEmpresasProps {
  faturamentoMensalPrincipal: number
  nomePrincipal: string
  regime: string
  numeroCard: number
  onChange: (empresas: EmpresaGrupo[]) => void
}

// ─── Máscara monetária ────────────────────────────────────────────────────────

function mascaraMoeda(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''
  const padded = digits.padStart(3, '0')
  const cents  = padded.slice(-2)
  const reais  = parseInt(padded.slice(0, -2), 10)
  const reaisFmt = isNaN(reais) || reais === 0 ? '0' : reais.toLocaleString('pt-BR')
  return `${reaisFmt},${cents}`
}

function parseMoeda(v: string): number {
  if (!v) return 0
  return parseFloat(v.replace(/\./g, '').replace(',', '.')) || 0
}

// ─── Estado interno de cada empresa ──────────────────────────────────────────

interface EmpresaState extends EmpresaGrupo {
  faturamentoRaw: string    // string formatada do campo simples
  modoDetalhado: boolean    // usa DadosMensais ou campo único
  agregado: AggregateMeses | null  // resultado do DadosMensais
}

function novaEmpresa(idx: number): EmpresaState {
  return {
    id: Math.random().toString(36).slice(2),
    nome: '',
    faturamentoMensal: 0,
    faturamentoRaw: '',
    participacao: 100,
    administrador: false,
    modoDetalhado: false,
    agregado: null,
  }
}

// ─── Componente ───────────────────────────────────────────────────────────────

const REGIMES_APLICAVEIS = ['simples_nacional', 'mei']

const NOME_REGIME: Record<string, string> = {
  lucro_presumido:     'Lucro Presumido',
  lucro_real:          'Lucro Real',
  profissional_liberal:'Profissional Liberal',
}

export default function GrupoEmpresas({ faturamentoMensalPrincipal, nomePrincipal, regime, numeroCard, onChange }: GrupoEmpresasProps) {
  const aplicavel = REGIMES_APLICAVEIS.includes(regime)
  const [ativo, setAtivo] = useState(false)
  const [empresas, setEmpresas] = useState<EmpresaState[]>([])

  // Emite apenas os campos do tipo EmpresaGrupo para o pai
  const emitir = (lista: EmpresaState[]) => {
    onChange(lista.map(({ faturamentoRaw: _, modoDetalhado: __, agregado: ___, ...rest }) => rest))
  }

  // ── Totais em tempo real ──────────────────────────────────────────────────
  const faturamentoAnualPrincipal = faturamentoMensalPrincipal * 12
  // LC 123/2006 Art. 3º §4º: soma quando participação > 10% (inciso IV) OU sócio administrador (inciso V)
  const empresasQueContam = empresas.filter(e => e.participacao > 10 || e.administrador === true)
  const faturamentoAnualGrupo = empresasQueContam.reduce(
    (soma, e) => soma + e.faturamentoMensal * 12, 0,
  )
  const totalAnual = faturamentoAnualPrincipal + faturamentoAnualGrupo
  const pct        = Math.min(110, (totalAnual / LIMITE_SIMPLES_NACIONAL_ANUAL) * 100)
  const excedeu    = totalAnual > LIMITE_SIMPLES_NACIONAL_ANUAL
  const alerta     = !excedeu && pct >= 80

  // ── Cores contextuais ─────────────────────────────────────────────────────
  const corBarra = excedeu ? 'bg-danger'    : alerta ? 'bg-warning'    : 'bg-success'
  const corCard  = excedeu ? 'bg-danger-soft border-danger-border'   : alerta ? 'bg-warning-soft border-warning-border' : 'bg-subtle border-border'
  const corTexto = excedeu ? 'text-danger'  : alerta ? 'text-warning'  : 'text-ink-secondary'
  const corValor = excedeu ? 'text-danger'  : alerta ? 'text-warning'  : 'text-ink'

  // ── Mutações ──────────────────────────────────────────────────────────────

  const adicionar = () => {
    const nova_lista = [...empresas, novaEmpresa(empresas.length)]
    setEmpresas(nova_lista)
    emitir(nova_lista)
  }

  const remover = (id: string) => {
    const nova_lista = empresas.filter(e => e.id !== id)
    setEmpresas(nova_lista)
    emitir(nova_lista)
  }

  const atualizar = (id: string, patch: Partial<EmpresaState>) => {
    const nova_lista = empresas.map(e => {
      if (e.id !== id) return e
      const atualizada = { ...e, ...patch }
      // se atualizou o raw, recalcula o faturamentoMensal (só no modo simples)
      if ('faturamentoRaw' in patch && !e.modoDetalhado) {
        atualizada.faturamentoMensal = parseMoeda(atualizada.faturamentoRaw)
      }
      return atualizada
    })
    setEmpresas(nova_lista)
    emitir(nova_lista)
  }

  const toggleDetalhado = (id: string) => {
    const nova_lista = empresas.map(e => {
      if (e.id !== id) return e
      const novoModo = !e.modoDetalhado
      return {
        ...e,
        modoDetalhado: novoModo,
        // ao desligar detalhado, volta a usar o campo simples
        faturamentoMensal: novoModo
          ? (e.agregado?.medias.faturamento ?? 0)
          : parseMoeda(e.faturamentoRaw),
      }
    })
    setEmpresas(nova_lista)
    emitir(nova_lista)
  }

  const onAgregado = (id: string, agregado: AggregateMeses) => {
    const nova_lista = empresas.map(e => {
      if (e.id !== id) return e
      return {
        ...e,
        agregado,
        faturamentoMensal: agregado.medias.faturamento,
      }
    })
    setEmpresas(nova_lista)
    emitir(nova_lista)
  }

  const toggle = () => {
    if (!aplicavel) return  // bloqueado para LP/LR/PF
    const novoAtivo = !ativo
    setAtivo(novoAtivo)
    if (!novoAtivo) {
      setEmpresas([])
      onChange([])
    }
  }

  return (
    <div className="card p-6 space-y-5">

      {/* ── Cabeçalho + toggle ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="badge badge-info w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0">{numeroCard}</span>
          <div>
            <h3 className="text-ink font-semibold text-base leading-tight">Grupo Societário</h3>
            <p className="text-ink-muted text-xs mt-0.5">Tenho participação em outras empresas</p>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-pressed={ativo}
          disabled={!aplicavel}
          title={!aplicavel ? `Não aplicável para ${NOME_REGIME[regime] ?? regime}` : undefined}
          className={`toggle-track ${!aplicavel ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <span className={`toggle-thumb ${ativo && aplicavel ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* ── Conteúdo expandível ──────────────────────────────────────────── */}
      {/* Estado bloqueado — regime não aplicável */}
      {!aplicavel && (
        <div className="mt-1 insight-neutral flex items-start gap-3">
          <div>
            <p className="text-sm font-medium">
              Não aplicável para {NOME_REGIME[regime] ?? 'este regime'}
            </p>
            <p className="text-xs mt-1 leading-relaxed opacity-80">
              A regra de soma de faturamento entre empresas do mesmo sócio{' '}
              (LC 123/2006, Art. 3º §4º) é exclusiva do <strong>Simples Nacional</strong> e do{' '}
              <strong>MEI</strong>. Para Lucro Presumido, Lucro Real e Profissional Liberal
              não existe limite de faturamento compartilhado entre sócios.
            </p>
          </div>
        </div>
      )}

      {ativo && aplicavel && (
        <div className="space-y-4">

          {/* Painel de totais */}
          <div className={`rounded-lg p-4 border space-y-2.5 ${corCard}`}>
            <div className="flex items-center justify-between text-sm">
              <span className={`font-medium ${corTexto}`}>
                Faturamento anual consolidado (&gt; 10% ou administrador)
              </span>
              <span className={`font-bold num ${corValor}`}>
                {fmt.moeda(totalAnual)}/ano
              </span>
            </div>
            <div className="h-2 bg-surface/60 rounded-full overflow-hidden border border-border">
              <div
                className={`h-full rounded-full transition-all duration-500 ${corBarra}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className={`num ${corTexto}`}>{pct.toFixed(2)}% do limite Simples</span>
              <span className="text-ink-muted num">Limite: {fmt.moeda(LIMITE_SIMPLES_NACIONAL_ANUAL)}/ano</span>
            </div>

            {/* Breakdown */}
            {totalAnual > 0 && (
              <div className="pt-1 border-t border-border space-y-1 text-xs text-ink-secondary">
                <div className="flex justify-between">
                  <span>{nomePrincipal || 'Empresa principal'} <span className="opacity-60">(esta simulação)</span></span>
                  <span className="num font-medium">{fmt.moeda(faturamentoAnualPrincipal)}/ano</span>
                </div>
                {empresasQueContam.map((e, i) => (
                  <div key={e.id} className="flex justify-between">
                    <span>
                      {e.nome || `Empresa ${i + 2}`}
                      <span className="ml-1 text-info num">({e.participacao.toFixed(2)}%)</span>
                    </span>
                    <span className="num font-medium">{fmt.moeda(e.faturamentoMensal * 12)}/ano</span>
                  </div>
                ))}
              </div>
            )}

            {excedeu && (
              <p className="pt-1 border-t border-danger-border text-xs text-danger font-medium leading-relaxed">
                <strong>Limite excedido!</strong> Todas as empresas do grupo serão desenquadradas do Simples
                Nacional (LC 123/2006, Art. 3º, §4º). Considere reestruturar o grupo ou migrar para Lucro Presumido.
              </p>
            )}
            {alerta && (
              <p className="pt-1 border-t border-warning-border text-xs text-warning font-medium leading-relaxed">
                <strong>Atenção:</strong> o grupo já utiliza <span className="num">{pct.toFixed(1)}%</span> do limite anual.
              </p>
            )}
          </div>

          {/* Lista de outras empresas */}
          {empresas.map((empresa, idx) => (
            <div key={empresa.id} className="border border-border rounded-lg bg-surface overflow-hidden">

              {/* Cabeçalho da empresa */}
              <div className="flex items-center justify-between px-4 py-3 bg-subtle border-b border-border">
                <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">
                  Empresa {idx + 2}
                  {empresa.nome && <span className="ml-1.5 normal-case font-normal text-ink-muted">— {empresa.nome}</span>}
                </span>
                <div className="flex items-center gap-3">
                  {/* Toggle modo detalhado */}
                  <button
                    type="button"
                    onClick={() => toggleDetalhado(empresa.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-all
                      ${empresa.modoDetalhado
                        ? 'bg-info-soft border-info-border text-info'
                        : 'bg-surface border-border text-ink-muted hover:border-ink-muted hover:text-ink-secondary'
                      }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${empresa.modoDetalhado ? 'bg-info' : 'bg-border'}`} />
                    {empresa.modoDetalhado ? 'Detalhado — 12 meses' : 'Simples'}
                  </button>
                  <button
                    type="button"
                    onClick={() => remover(empresa.id)}
                    className="text-xs text-ink-muted hover:text-danger transition-colors"
                  >
                    Remover
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-4">

                {/* Campos de identificação e participação (sempre visíveis) */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Nome */}
                  <div>
                    <label className="label">
                      Nome / CNPJ <span className="text-ink-muted font-normal">(opcional)</span>
                    </label>
                    <input
                      type="text"
                      value={empresa.nome}
                      onChange={e => atualizar(empresa.id, { nome: e.target.value })}
                      placeholder="Ex: Empresa Ltda"
                      className="input-field text-sm"
                    />
                  </div>

                  {/* Faturamento mensal — só no modo simples */}
                  {!empresa.modoDetalhado && (
                    <div>
                      <label className="label label-required">Faturamento Mensal</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm select-none">R$</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={empresa.faturamentoRaw}
                          onChange={e => atualizar(empresa.id, { faturamentoRaw: mascaraMoeda(e.target.value) })}
                          placeholder="0"
                          className="input-field pl-8 text-sm"
                        />
                      </div>
                      {empresa.faturamentoMensal > 0 && (
                        <p className="text-ink-muted text-xs mt-1 num">
                          ≈ {fmt.moeda(empresa.faturamentoMensal * 12)}/ano
                        </p>
                      )}
                    </div>
                  )}

                  {/* Faturamento calculado — no modo detalhado */}
                  {empresa.modoDetalhado && (
                    <div>
                      <label className="label">Faturamento Médio/Mês</label>
                      <div className="flex items-center gap-2 h-10 px-3 bg-subtle border border-border rounded-lg">
                        <span className="text-ink-muted text-sm">R$</span>
                        <span className={`font-semibold text-sm num
                          ${empresa.faturamentoMensal > 0 ? 'text-info' : 'text-ink-muted opacity-40'}`}
                        >
                          {empresa.faturamentoMensal > 0
                            ? empresa.faturamentoMensal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                            : '0,00'}
                        </span>
                        {empresa.faturamentoMensal > 0 && (
                          <span className="text-xs text-ink-muted ml-auto">média 12m</span>
                        )}
                      </div>
                      {empresa.faturamentoMensal > 0 && (
                        <p className="text-ink-muted text-xs mt-1 num">
                          ≈ {fmt.moeda(empresa.faturamentoMensal * 12)}/ano
                        </p>
                      )}
                    </div>
                  )}

                  {/* Participação societária */}
                  <div>
                    <label className="label label-required">Sua participação</label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={empresa.participacao}
                        onChange={e => atualizar(empresa.id, {
                          participacao: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                        })}
                        className="input-field pr-7 text-sm num"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted text-sm select-none">%</span>
                    </div>
                    {empresa.participacao > 0 && empresa.participacao <= 10 && !empresa.administrador && (
                      <p className="text-xs text-ink-muted mt-1">≤ 10% — não soma (salvo se administrador)</p>
                    )}
                    {empresa.participacao > 10 && (
                      <p className="text-xs text-info mt-1">&gt; 10% — soma ao faturamento do grupo</p>
                    )}
                    {empresa.participacao <= 10 && empresa.administrador && (
                      <p className="text-xs text-info mt-1">Administrador — soma ao grupo (inciso V)</p>
                    )}
                  </div>
                </div>

                {/* Sócio administrador — gatilho do inciso V (sem piso de 10%) */}
                <label className="flex items-start gap-2 text-xs text-ink-secondary cursor-pointer">
                  <input
                    type="checkbox"
                    checked={empresa.administrador ?? false}
                    onChange={e => atualizar(empresa.id, { administrador: e.target.checked })}
                    className="accent-[var(--color-ink)] w-4 h-4 mt-0.5 flex-shrink-0"
                  />
                  <span>
                    Sou <strong>sócio-administrador</strong> desta empresa
                    <span className="text-ink-muted"> — LC 123/2006 Art. 3º §4º V: nesse caso a receita soma ao grupo mesmo com participação de até 10%.</span>
                  </span>
                </label>

                {/* Tabela 12 meses — modo detalhado */}
                {empresa.modoDetalhado && (
                  <div className="border-t border-border pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-ink-secondary leading-relaxed">
                        Preencha o histórico mensal desta empresa para apurar o faturamento médio real.
                      </p>
                      {empresa.agregado && empresa.agregado.totais.faturamento > 0 && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-success-soft border border-success-border rounded text-xs">
                          <span className="text-success font-medium num">
                            Média: {fmt.moeda(empresa.agregado.medias.faturamento)}/mês
                          </span>
                          {empresa.agregado.aliquotaRealApurada && (
                            <>
                              <span className="text-success opacity-40">|</span>
                              <span className="text-success font-medium num">
                                Alíq. real: {(empresa.agregado.aliquotaRealApurada * 100).toFixed(2).replace('.', ',')}%
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <DadosMensais
                      onChange={agregado => onAgregado(empresa.id, agregado)}
                      valoresIniciais={{
                        faturamento: empresa.faturamentoRaw,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Botão adicionar */}
          <button
            type="button"
            onClick={adicionar}
            className="w-full py-3 border-2 border-dashed border-border rounded-lg text-ink-muted text-sm font-medium
              hover:border-prim hover:text-prim transition-colors"
          >
            + Adicionar outra empresa
          </button>

          {/* Nota legal */}
          <p className="text-ink-muted text-xs leading-relaxed">
            <strong className="text-ink-secondary">LC 123/2006, Art. 3º, §4º:</strong> os faturamentos somam para o limite do
            Simples Nacional (R$ 4.800.000/ano) quando o sócio tem <strong>mais de 10%</strong> do capital de outra empresa
            (inciso IV) <strong>ou</strong> é <strong>administrador</strong> de outra PJ com fins lucrativos (inciso V, sem piso de 10%).
          </p>
        </div>
      )}
    </div>
  )
}
