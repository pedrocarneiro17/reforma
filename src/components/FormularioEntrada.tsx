import { useState, useMemo, useRef, useEffect } from 'react'
import { SETORES } from '../data/setores'
import { fmt, LIMITE_MEI_MENSAL, LIMITE_MEI_ANUAL, ICMS_ALIQUOTA_INTERNA, UF_NOMES } from '../engine/calculadora'
import DadosMensais from './DadosMensais'
import GrupoEmpresas from './GrupoEmpresas'
import HoldingPatrimonial from './HoldingPatrimonial'
import SociosAdministradores from './SociosAdministradores'
import type { Setor, TipoRegime, PerfilClientes, DadosEntrada, AggregateMeses, EmpresaGrupo, AnaliseHolding, SocioAdministrador } from '../types'

// ─── Dados estáticos ──────────────────────────────────────────────────────────

interface GrupoRegime {
  label: string
  regimes: { value: TipoRegime; label: string; desc: string }[]
}

const GRUPOS_REGIME: GrupoRegime[] = [
  {
    label: 'Pessoa Jurídica (Empresa)',
    regimes: [
      {
        value: 'mei',
        label: 'MEI — Microempreendedor Individual',
        desc: `Faturamento até ${fmt.moeda(LIMITE_MEI_ANUAL)}/ano — DAS fixo (~R$ 81/mês) · possui CNPJ`,
      },
      {
        value: 'simples_nacional',
        label: 'Simples Nacional',
        desc: 'Faturamento até R$ 4,8M/ano — pagamento unificado via DAS',
      },
      {
        value: 'lucro_presumido',
        label: 'Lucro Presumido',
        desc: 'Base de cálculo presumida — IRPJ + CSLL + PIS + COFINS + ISS/ICMS',
      },
      {
        value: 'lucro_real',
        label: 'Lucro Real',
        desc: 'Apuração pelo lucro efetivo — PIS/COFINS não-cumulativos (com créditos)',
      },
    ],
  },
  {
    label: 'Regime Especial',
    regimes: [
      {
        value: 'produtor_rural',
        label: 'Produtor Rural',
        desc: 'Não-contribuinte (IBS/CBS = 0) abaixo de R$3,6M/ano · IRPJ calculado como LP',
      },
    ],
  },
  {
    label: 'Pessoa Física',
    regimes: [
      {
        value: 'profissional_liberal',
        label: 'Profissional Liberal / Autônomo',
        desc: 'Carnê-Leão (IRPF progressivo até 27,5%) + ISS municipal (~3%)',
      },
    ],
  },
]

const REGIMES = GRUPOS_REGIME.flatMap(g => g.regimes)


interface PerfilItem { value: PerfilClientes; label: string; desc: string }

const PERFIL_CLIENTES: PerfilItem[] = [
  { value: 'b2c',   label: 'B2C',  desc: 'Pessoa Física' },
  { value: 'b2b',   label: 'B2B',  desc: 'Empresas' },
  { value: 'misto', label: 'Misto', desc: 'PF e PJ' },
]

interface BadgeInfo { cls: string; texto: string }

const BADGE_REDUCAO: Record<number, BadgeInfo> = {
  100: { cls: 'badge-isento', texto: 'Isento — alíquota 0%' },
  70:  { cls: 'badge-70',     texto: 'Redução 70% — alíquota ~7,9%' },
  60:  { cls: 'badge-60',     texto: 'Redução 60% — alíquota ~10,6%' },
  50:  { cls: 'badge-50',     texto: 'Redução 50% — alíquota ~13,3%' },
  40:  { cls: 'badge-40',     texto: 'Redução 40% — alíquota ~15,9%' },
  30:  { cls: 'badge-30',     texto: 'Redução 30% — alíquota ~18,6%' },
  0:   { cls: 'badge-cheio',  texto: 'Alíquota Cheia — 26,5%' },
}

function getBadge(reducao: number): BadgeInfo {
  const pct = Math.round(reducao * 100)
  return BADGE_REDUCAO[pct] ?? BADGE_REDUCAO[0]
}

// ─── Utilitários de formatação monetária ─────────────────────────────────────

/**
 * Máscara monetária estilo calculadora:
 * os dígitos entram pela direita e os 2 últimos são sempre centavos.
 * Ex.: digitar "1","1","1","1","1","1" → "1.111,11"
 */
function mascaraMoeda(input: string): string {
  const digits = input.replace(/\D/g, '')
  if (!digits) return ''
  const padded = digits.padStart(3, '0')          // mínimo 3 chars
  const cents  = padded.slice(-2)                 // últimos 2 = centavos
  const reais  = parseInt(padded.slice(0, -2), 10)
  const reaisFmt = isNaN(reais) || reais === 0
    ? '0'
    : reais.toLocaleString('pt-BR')
  return `${reaisFmt},${cents}`
}

/** Converte um número conhecido (ex.: 50000.5) de volta ao formato mascarado */
function valorParaMascara(v: string | number): string {
  const num = typeof v === 'number'
    ? v
    : parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0
  if (!num) return ''
  return mascaraMoeda(Math.round(num * 100).toString())
}

function parseMoeda(v: string | number): number {
  if (typeof v === 'number') return v
  if (!v) return 0
  return parseFloat(String(v).replace(/\./g, '').replace(',', '.')) || 0
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface FormState {
  regime: string
  setor: string
  faturamentoMensal: string | number
  insumosMensais: string | number
  perfilClientes: string
  pctFornecedoresSimples: number
  prolaboreMensal: string | number
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface FormularioEntradaProps {
  onCalcular: (dados: DadosEntrada) => void
}

export default function FormularioEntrada({ onCalcular }: FormularioEntradaProps) {
  const [modoEntrada, setModoEntrada] = useState<'simples' | 'detalhado'>('simples')

  const [dados, setDados] = useState<FormState>({
    regime: '',
    setor: '',
    faturamentoMensal: '',
    insumosMensais: '',
    perfilClientes: '',
    pctFornecedoresSimples: 0,
    prolaboreMensal: '',
  })
  const [anexoSimples, setAnexoSimples] = useState<import('../types').AnexoSimples | ''>('')
  const [anexoSimples2, setAnexoSimples2] = useState<import('../types').AnexoSimples | ''>('')
  const [pctAnexo1, setPctAnexo1] = useState(50)
  const [ativoAnexoMisto, setAtivoAnexoMisto] = useState(false)
  const [erros, setErros] = useState<Record<string, string>>({})
  const [agregado12m, setAgregado12m] = useState<AggregateMeses | null>(null)
  const [empresasGrupo, setEmpresasGrupo] = useState<EmpresaGrupo[]>([])
  const [nomePrincipal, setNomePrincipal] = useState('')
  const [analiseHolding, setAnaliseHolding] = useState<AnaliseHolding | null>(null)
  const [sociosAdministradores, setSociosAdministradores] = useState<SocioAdministrador[]>([])
  const [uf, setUf] = useState('')
  // Campos condicionais por setor
  const [pctCustoImovel, setPctCustoImovel] = useState(70)          // % custo incorporação
  const [redutorSocialMensal, setRedutorSocialMensal] = useState(0) // R$ redutor social/mês
  const [pctRepasseAgencia, setPctRepasseAgencia] = useState(80)    // % repasse agências
  const [pctVendasGoverno, setPctVendasGoverno] = useState(0)       // % vendas ao governo
  const [pctClientesPJ, setPctClientesPJ] = useState(50)            // % vendas a PJ no perfil Misto
  // Novos campos — LC 214/2025
  const [pctGorjeta, setPctGorjeta] = useState(0)                            // % gorjeta excluída da base (Art. 274)
  const [pctInsumosProdutorRural, setPctInsumosProdutorRural] = useState(0)  // % insumos de produtor rural (Art. 168)
  const [pctFreteAutonomo, setPctFreteAutonomo] = useState(0)                // % frete de autônomo PF (Art. 169)
  const [vendaImobilizadoMensalStr, setVendaImobilizadoMensalStr] = useState('') // venda bens imobilizado (Arts. 406-407)
  const [folhaMensal, setFolhaMensal] = useState('')                         // folha p/ Fator R (Simples)
  const [investimentoCapitalStr, setInvestimentoCapitalStr] = useState('')   // Art. 108 — bens de capital
  const [pctVendasAliqZeroRural, setPctVendasAliqZeroRural] = useState(0)    // Art. 110 — vendas com alíq. zero rural
  const [pctVendasAliqZeroTransp, setPctVendasAliqZeroTransp] = useState(0)  // Art. 110 — vendas com alíq. zero transp.
  const [despesasCrediteisStr, setDespesasCrediteisStr] = useState('')       // não-cumulatividade ampla
  const [exportacoesMensaisStr, setExportacoesMensaisStr] = useState('')     // Art. 82 — exportador habilitável
  const [regimeAutomotivoHabilitado, setRegimeAutomotivoHabilitado] = useState(false)  // Arts. 309-316
  const [faseRegimeAutomotivo, setFaseRegimeAutomotivo] = useState<1 | 2 | 3>(1)        // fase de fruição
  const [tipoBemZFM, setTipoBemZFM] = useState<'consumo_final' | 'capital' | 'intermediario' | 'informatica'>('consumo_final')  // Art. 450 §1º
  const [pctMedicamentos, setPctMedicamentos] = useState(0)  // Art. 133 — % da receita em medicamentos (60% redução)
  const [pctCestaZero, setPctCestaZero] = useState(0)          // supermercados — % alíquota zero
  const [pctCestaReduzida, setPctCestaReduzida] = useState(0)  // supermercados — % redução 60%
  // Lucro Real — apuração efetiva
  const [folhaPagamentoLRStr, setFolhaPagamentoLRStr] = useState('')
  const [despesasOperacionaisStr, setDespesasOperacionaisStr] = useState('')
  const [aliquotaICMSStr, setAliquotaICMSStr] = useState('')   // % efetivo líquido, ex: "8" para 8%
  const [aliquotaISSStr, setAliquotaISSStr] = useState('')     // % efetivo, ex: "3" para 3%

  const setorSelecionado = useMemo<Setor | null>(
    () => SETORES.find(s => s.value === dados.setor) ?? null,
    [dados.setor],
  )

  const relacaoInsumos = useMemo(() => {
    const fat = parseMoeda(dados.faturamentoMensal)
    const ins = parseMoeda(dados.insumosMensais)
    if (!fat || !ins) return 0
    return Math.min(100, (ins / fat) * 100)
  }, [dados.faturamentoMensal, dados.insumosMensais])

  const setoresPorGrupo = useMemo(() =>
    SETORES.reduce<Record<string, Setor[]>>((acc, s) => {
      if (!acc[s.grupo]) acc[s.grupo] = []
      acc[s.grupo].push(s)
      return acc
    }, {}),
  [])

  const set = (campo: keyof FormState, valor: string) => {
    setDados(prev => ({ ...prev, [campo]: valor }))
    if (erros[campo]) setErros(prev => ({ ...prev, [campo]: '' }))
    // Quando regime muda para incompatível com Grupo Societário, limpa as empresas
    if (campo === 'regime' && !['simples_nacional', 'mei'].includes(valor)) {
      setEmpresasGrupo([])
    }
  }

  const setMoeda = (campo: 'faturamentoMensal' | 'insumosMensais', valor: string) => {
    setDados(prev => ({ ...prev, [campo]: mascaraMoeda(valor) }))
    if (erros[campo]) setErros(prev => ({ ...prev, [campo]: '' }))
  }

  const mostrarAnexoSimples = dados.regime === 'simples_nacional'
  const mostrarFornecedorSimples = ['lucro_presumido', 'lucro_real'].includes(dados.regime) && parseMoeda(dados.insumosMensais) > 0
  const mostrarGorjeta = dados.setor === 'restaurantes_bares'
  const mostrarCreditoPresumido = ['lucro_presumido', 'lucro_real', 'produtor_rural'].includes(dados.regime) && parseMoeda(dados.insumosMensais) > 0
  const mostrarFatorR = dados.regime === 'simples_nacional' && (setorSelecionado?.fatorR === true)
  const mostrarCapital = ['lucro_presumido', 'lucro_real', 'produtor_rural'].includes(dados.regime)
  const mostrarAliqZeroRural  = setorSelecionado?.produtorRural === true || dados.setor === 'maquinario_agricola'
  const mostrarAliqZeroTransp = setorSelecionado?.transporteAutonomo === true || dados.setor === 'concessionarias_veiculos' || dados.setor === 'fabricante_veiculos'
  const mostrarDespesasCrediteis = ['lucro_presumido', 'lucro_real'].includes(dados.regime)
  const mostrarRegimeAutomotivo = setorSelecionado?.regimeAutomotivo === true
  const mostrarZFM = setorSelecionado?.zfm === true
  const mostrarMedicamentos = setorSelecionado?.vendeMedicamentos === true
  const mostrarCestaMista = setorSelecionado?.cestaMista === true

  const fatEfetivo = modoEntrada === 'detalhado' && agregado12m
    ? agregado12m.medias.faturamento
    : parseMoeda(dados.faturamentoMensal)

  const insEfetivo = modoEntrada === 'detalhado' && agregado12m
    ? agregado12m.medias.insumos
    : parseMoeda(dados.insumosMensais)

  const validar = (): Record<string, string> => {
    const e: Record<string, string> = {}
    if (!dados.regime) e.regime = 'Selecione o regime tributário.'
    if (!dados.setor) e.setor = 'Selecione o setor de atuação.'
    if (!dados.perfilClientes) e.perfilClientes = 'Selecione o perfil dos seus clientes.'

    if (modoEntrada === 'simples') {
      if (!dados.faturamentoMensal || parseMoeda(dados.faturamentoMensal) <= 0)
        e.faturamentoMensal = 'Informe o faturamento mensal (deve ser maior que zero).'
      if (dados.insumosMensais !== '' && parseMoeda(dados.insumosMensais) < 0)
        e.insumosMensais = 'O volume de compras não pode ser negativo.'
    } else {
      if (!agregado12m || agregado12m.totais.faturamento <= 0)
        e.dados12m = 'Preencha ao menos o faturamento de um mês na tabela de 12 meses.'
    }
    return e
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const novosErros = validar()
    if (Object.keys(novosErros).length > 0) {
      setErros(novosErros)
      setTimeout(() => {
        document.querySelector('[data-error]')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 50)
      return
    }
    if (!setorSelecionado) return
    onCalcular({
      regime: dados.regime as TipoRegime,
      setor: setorSelecionado,
      faturamentoMensal: fatEfetivo,
      insumosMensais: insEfetivo,
      perfilClientes: dados.perfilClientes as PerfilClientes,
      pctClientesPJ: dados.perfilClientes === 'misto' ? pctClientesPJ : undefined,
      aliquotaAtualOverride: agregado12m?.aliquotaRealApurada ?? null,
      dadosMensais: modoEntrada === 'detalhado' ? (agregado12m?.meses ?? null) : null,
      exportacoesMensais: modoEntrada === 'detalhado' ? (agregado12m?.medias.exportacoes ?? 0) : parseMoeda(exportacoesMensaisStr),
      empresasGrupo,
      nomePrincipal,
      analiseHolding,
      uf: uf || undefined,
      anexoSimples: (mostrarAnexoSimples && anexoSimples) ? anexoSimples : undefined,
      anexoSimples2: (ativoAnexoMisto && anexoSimples2) ? anexoSimples2 : undefined,
      pctAnexo1: (ativoAnexoMisto && anexoSimples2) ? pctAnexo1 : undefined,
      pctFornecedoresSimples: mostrarFornecedorSimples ? dados.pctFornecedoresSimples : 0,
      pctCustoImovel: setorSelecionado?.regimeImobiliario ? pctCustoImovel : 0,
      redutorSocialMensal: setorSelecionado?.regimeImobiliario ? redutorSocialMensal : 0,
      pctRepasseAgencia: setorSelecionado?.baseReduzidaRepasse ? pctRepasseAgencia : 0,
      pctVendasGoverno,
      sociosAdministradores,
      pctGorjeta: mostrarGorjeta ? pctGorjeta : 0,
      pctInsumosProdutorRural: mostrarCreditoPresumido ? pctInsumosProdutorRural : 0,
      pctFreteAutonomo: mostrarCreditoPresumido ? pctFreteAutonomo : 0,
      vendaImobilizadoMensal: parseMoeda(vendaImobilizadoMensalStr),
      folhaMensal: mostrarFatorR ? parseMoeda(folhaMensal) : 0,
      investimentoCapitalMensal: mostrarCapital ? parseMoeda(investimentoCapitalStr) : 0,
      pctVendasAliqZeroRural: mostrarAliqZeroRural ? pctVendasAliqZeroRural : 0,
      pctVendasAliqZeroTransp: mostrarAliqZeroTransp ? pctVendasAliqZeroTransp : 0,
      despesasCrediteisAdicionais: mostrarDespesasCrediteis ? parseMoeda(despesasCrediteisStr) : 0,
      regimeAutomotivoHabilitado: mostrarRegimeAutomotivo ? regimeAutomotivoHabilitado : false,
      faseRegimeAutomotivo,
      tipoBemZFM,
      pctMedicamentos: mostrarMedicamentos ? pctMedicamentos : 0,
      pctCestaZero: mostrarCestaMista ? pctCestaZero : 0,
      pctCestaReduzida: mostrarCestaMista ? pctCestaReduzida : 0,
      folhaPagamentoLRMensal: parseMoeda(folhaPagamentoLRStr),
      despesasOperacionaisMensais: parseMoeda(despesasOperacionaisStr),
      aliquotaICMSEfetiva: aliquotaICMSStr ? parseFloat(aliquotaICMSStr.replace(',', '.')) / 100 : undefined,
      aliquotaISSEfetiva:  aliquotaISSStr  ? parseFloat(aliquotaISSStr.replace(',', '.'))  / 100 : undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* ══════════════════════════════════════════════════════════════════
          CARD 1 — Perfil da Empresa
          Layout interno: regime (esq) | setor + perfil (dir)
          ══════════════════════════════════════════════════════════════ */}
      <div className="card-elevated p-8">
        <h3 className="section-title mb-6">
          <span className="badge badge-info w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
          <span className="font-display">Perfil da Empresa</span>
        </h3>

        {/* ── Nome da empresa ─────────────────────────────────────── */}
        <div className="mb-6">
          <label className="label">Nome da Empresa / Razão Social <span className="text-ink-muted font-normal">(opcional — aparece no relatório PDF)</span></label>
          <input
            type="text"
            value={nomePrincipal}
            onChange={e => setNomePrincipal(e.target.value)}
            placeholder="Ex: Empresa XYZ Ltda"
            className="input-field"
          />
        </div>

        <div className="space-y-6">

          {/* ── Regime Tributário ──────────────────────────────────────── */}
          <div data-error={erros.regime ? 'true' : undefined}>
            <label className="label label-required">Regime Tributário Atual</label>
            <RegimeCombobox
              value={dados.regime}
              onChange={v => set('regime', v)}
              grupos={GRUPOS_REGIME}
            />
            {erros.regime && <p className="insight-danger text-xs mt-1.5 px-3 py-1.5">{erros.regime}</p>}
          </div>

          {/* ── Setor + Estado + Perfil ────────────────────────────────── */}
          <div className="space-y-6">

            {/* Setor de Atuação */}
            <div data-error={erros.setor ? 'true' : undefined}>
              <label className="label label-required">Setor de Atuação</label>
              <SetorCombobox
                value={dados.setor}
                onChange={v => set('setor', v)}
                setoresPorGrupo={setoresPorGrupo}
              />
              {erros.setor && <p className="insight-danger text-xs mt-1.5 px-3 py-1.5">{erros.setor}</p>}

              {setorSelecionado && (() => {
                const badge = getBadge(setorSelecionado.reducao)
                return (
                  <div className={`mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold border ${badge.cls}`}>
                    {badge.texto}
                  </div>
                )
              })()}

              {setorSelecionado?.vedadoSimples && (dados.regime === 'simples_nacional' || dados.regime === 'mei') && (
                <div className="mt-2.5 insight-danger">
                  <p className="text-xs leading-relaxed">
                    <strong>Atividade vedada ao Simples Nacional</strong> (LC 123/2006 Art. 17 / Art. 3º §4º).
                    Empresas desta atividade não podem optar pelo {dados.regime === 'mei' ? 'MEI/Simples' : 'Simples Nacional'} —
                    a apuração deve ser por Lucro Presumido ou Lucro Real.
                  </p>
                </div>
              )}
            </div>

            {/* Estado (UF) — para cálculo de ICMS */}
            <div>
              <label className="label">
                Estado (UF){' '}
                <span className="text-ink-muted font-normal">(opcional — habilita cálculo de ICMS)</span>
              </label>
              <select
                value={uf}
                onChange={e => setUf(e.target.value)}
                className="select-field"
              >
                <option value="">Selecione o estado...</option>
                {Object.entries(UF_NOMES).sort(([,a],[,b]) => a.localeCompare(b)).map(([sigla, nome]) => (
                  <option key={sigla} value={sigla}>
                    {sigla} — {nome} ({(ICMS_ALIQUOTA_INTERNA[sigla]! * 100).toFixed(sigla === 'PE' || sigla === 'PR' || sigla === 'RO' ? 1 : 0)}%)
                  </option>
                ))}
              </select>
              {uf && (
                <p className="text-xs text-info mt-1.5">
                  Alíquota interna {uf}: <strong className="num">{(ICMS_ALIQUOTA_INTERNA[uf]! * 100).toFixed(3).replace('.', ',')}%</strong>
                </p>
              )}
            </div>

            {/* Perfil dos Clientes */}
            <div data-error={erros.perfilClientes ? 'true' : undefined}>
              <label className="label label-required">Perfil dos Seus Clientes</label>
              <div className="grid grid-cols-3 gap-2.5">
                {PERFIL_CLIENTES.map(p => {
                  const sel = dados.perfilClientes === p.value
                  return (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => set('perfilClientes', p.value)}
                      className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-md border transition-all duration-150
                        ${sel
                          ? 'bg-[#EFEAE1] border-[#9A9286] text-ink'
                          : 'bg-white border-[#E4DDD2] text-ink-secondary hover:border-[#9A9286]'
                        }`}
                    >
                      <span className="font-bold text-sm">{p.label}</span>
                      <span className="text-xs opacity-70">{p.desc}</span>
                    </button>
                  )
                })}
              </div>
              {erros.perfilClientes && <p className="insight-danger text-xs mt-1.5 px-3 py-1.5">{erros.perfilClientes}</p>}

              {dados.perfilClientes === 'misto' && (
                <div className="mt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                      Composição das vendas — PF × PJ
                    </label>
                    <span className="num text-sm font-bold text-ink">{pctClientesPJ}% PJ</span>
                  </div>
                  <input
                    type="range" min={0} max={100} step={5}
                    value={pctClientesPJ}
                    onChange={e => setPctClientesPJ(Number(e.target.value))}
                    className="w-full accent-[var(--color-ink)]"
                  />
                  <div className="flex justify-between text-[10px] text-ink-muted">
                    <span>{100 - pctClientesPJ}% Pessoa Física (B2C)</span>
                    <span>{pctClientesPJ}% Empresas (B2B)</span>
                  </div>
                  <p className="text-[10px] text-ink-muted leading-relaxed">
                    Só a parcela vendida a <strong>empresas (PJ)</strong> gera crédito de IBS/CBS aproveitável pelo cliente —
                    isso pesa na análise do Simples Híbrido e no repasse do IVA na reforma.
                  </p>
                </div>
              )}

              {(dados.regime === 'simples_nacional' || dados.regime === 'mei') &&
                (dados.perfilClientes === 'b2b' || dados.perfilClientes === 'misto') && (
                <div className="mt-3 insight-warning">
                  <p className="text-xs leading-relaxed">
                    <strong>Atenção — {dados.regime === 'mei' ? 'MEI' : 'Simples'} + B2B:</strong>{' '}
                    o sistema vai analisar se vale optar pelo{' '}
                    <em>{dados.regime === 'mei' ? 'MEI Híbrido' : 'Simples Nacional Híbrido'}</em>,
                    que permite recolher CBS e IBS separadamente para gerar crédito integral aos seus clientes.
                  </p>
                </div>
              )}

              {dados.regime === 'profissional_liberal' && (dados.perfilClientes === 'b2b' || dados.perfilClientes === 'misto') && (
                <div className="mt-3 insight-info">
                  <p className="text-xs leading-relaxed">
                    <strong>PF + B2B:</strong> como autônomo, você não gera crédito de IVA para seus clientes empresariais.
                    O simulador vai mostrar se formalizar como PJ seria vantajoso.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CARD 2 — Dados Financeiros
          Toggle inline no topo; conteúdo expande dentro do card
          ══════════════════════════════════════════════════════════════ */}
      <div className="card-elevated p-8 space-y-6">

        {/* Cabeçalho do card + toggle de modo */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="section-title">
            <span className="badge badge-info w-7 h-7 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
            <span className="font-display">Dados Financeiros</span>
          </h3>

          {/* Segmented control: Simples | Detalhado */}
          <div className="flex p-1 bg-subtle border border-border rounded-md gap-0.5">
            <button
              type="button"
              onClick={() => setModoEntrada('simples')}
              className={`px-4 py-1.5 rounded text-xs font-medium transition-all duration-150
                ${modoEntrada === 'simples'
                  ? 'bg-white border border-[#E4DDD2] text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink-secondary'
                }`}
            >
              Valores mensais médios
            </button>
            <button
              type="button"
              onClick={() => setModoEntrada('detalhado')}
              className={`px-4 py-1.5 rounded text-xs font-medium transition-all duration-150
                ${modoEntrada === 'detalhado'
                  ? 'bg-white border border-[#E4DDD2] text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink-secondary'
                }`}
            >
              Histórico real — 12 meses
            </button>
          </div>
        </div>

        {/* ── Modo simples ──────────────────────────────────────────────── */}
        {modoEntrada === 'simples' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Faturamento Mensal */}
              <div data-error={erros.faturamentoMensal ? 'true' : undefined}>
                <label className="label label-required">Faturamento Médio Mensal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium select-none">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={dados.faturamentoMensal}
                    onChange={e => setMoeda('faturamentoMensal', e.target.value)}
                    placeholder="0"
                    className="input-field pl-10 num"
                  />
                </div>
                {erros.faturamentoMensal
                  ? <p className="insight-danger text-xs mt-1.5 px-3 py-1.5">{erros.faturamentoMensal}</p>
                  : parseMoeda(dados.faturamentoMensal) > 0 && (
                    <p className="text-ink-muted text-xs mt-1.5">
                      ≈ <span className="num">{fmt.moeda(parseMoeda(dados.faturamentoMensal) * 12)}</span> / ano
                    </p>
                  )
                }
              </div>

              {/* Insumos Mensais */}
              <div data-error={erros.insumosMensais ? 'true' : undefined}>
                <label className="label">
                  Compras / Insumos Mensais{' '}
                  <span className="text-ink-muted font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium select-none">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={dados.insumosMensais}
                    onChange={e => setMoeda('insumosMensais', e.target.value)}
                    placeholder="0"
                    className="input-field pl-10 num"
                  />
                </div>
                {erros.insumosMensais
                  ? <p className="insight-danger text-xs mt-1.5 px-3 py-1.5">{erros.insumosMensais}</p>
                  : <p className="text-ink-muted text-xs mt-1.5 leading-relaxed">
                      Mercadorias, matérias-primas, serviços de terceiros, aluguel, etc.
                    </p>
                }
              </div>

              {/* Exportações Mensais — Art. 82 LC 214/2025 (exportador habilitável) */}
              <div>
                <label className="label">
                  Exportações Mensais{' '}
                  <span className="text-ink-muted font-normal">(opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium select-none">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={exportacoesMensaisStr}
                    onChange={e => setExportacoesMensaisStr(mascaraMoeda(e.target.value))}
                    placeholder="0"
                    className="input-field pl-10 num"
                  />
                </div>
                <p className="text-ink-muted text-xs mt-1.5 leading-relaxed">
                  Preencha se exportar — acima de 50% habilita suspensão de IBS/CBS (Art. 82)
                </p>
              </div>
            </div>

            {/* Alertas contextuais — abaixo dos dois campos */}
            {dados.regime === 'mei' && parseMoeda(dados.faturamentoMensal) > LIMITE_MEI_MENSAL && (
              <div className="insight-danger">
                <p className="text-xs leading-relaxed">
                  <strong>Acima do limite MEI:</strong> com <span className="num">{fmt.moeda(parseMoeda(dados.faturamentoMensal) * 12)}</span>/ano você
                  ultrapassa o teto de <span className="num">{fmt.moeda(LIMITE_MEI_ANUAL)}</span>/ano. O MEI é inaplicável nesse faturamento —
                  o simulador mostrará qual regime seria mais vantajoso.
                </p>
              </div>
            )}

            {dados.regime === 'mei' && parseMoeda(dados.faturamentoMensal) > 0 &&
              parseMoeda(dados.faturamentoMensal) <= LIMITE_MEI_MENSAL &&
              parseMoeda(dados.faturamentoMensal) > LIMITE_MEI_MENSAL * 0.7 && (
              <div className="insight-warning">
                <p className="text-xs leading-relaxed">
                  <strong>Atenção:</strong> você está usando{' '}
                  <span className="num">{((parseMoeda(dados.faturamentoMensal) * 12 / LIMITE_MEI_ANUAL) * 100).toFixed(0)}%</span> do limite MEI anual.
                  O Simulador de Crescimento vai alertar quando você se aproximar do teto.
                </p>
              </div>
            )}

            {dados.regime === 'profissional_liberal' && parseMoeda(dados.faturamentoMensal) > 0 && (
              <div className="insight-info">
                <p className="text-xs leading-relaxed">
                  <strong>Para autônomo:</strong> informe seus recebimentos mensais brutos. O IRPF será calculado
                  pela tabela progressiva 2024 e o ISS será estimado em 3% (média municipal).
                </p>
              </div>
            )}

            {/* Indicador relação insumos/faturamento */}
            {parseMoeda(dados.faturamentoMensal) > 0 && parseMoeda(dados.insumosMensais) > 0 && (
              <div className="bg-subtle border border-border rounded-md p-4 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-ink-secondary font-medium">Relação Insumos / Faturamento</span>
                  <span className={`font-bold num ${relacaoInsumos > 70 ? 'text-success' : relacaoInsumos > 40 ? 'text-info' : 'text-ink-secondary'}`}>
                    {relacaoInsumos.toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 bg-border rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      relacaoInsumos > 70 ? 'bg-success' : relacaoInsumos > 40 ? 'bg-info' : 'bg-ink-muted'
                    }`}
                    style={{ width: `${relacaoInsumos}%` }}
                  />
                </div>
                <p className="text-ink-muted text-xs">
                  {relacaoInsumos >= 70
                    ? 'Excelente — você terá créditos expressivos de IVA.'
                    : relacaoInsumos >= 35
                    ? 'Moderado — haverá geração de créditos relevante.'
                    : 'Baixo — poucos insumos para abater no IVA.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Modo detalhado — 12 meses ────────────────────────────────── */}
        {modoEntrada === 'detalhado' && (
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-ink-secondary text-sm leading-relaxed">
                Preencha os dados reais mês a mês para uma simulação com a alíquota efetiva apurada da empresa.
              </p>
              {agregado12m && agregado12m.totais.faturamento > 0 && (
                <div className="flex items-center gap-3 px-3 py-1.5 bg-success-soft border border-success-border rounded-md text-xs">
                  <span className="text-success font-medium">
                    Média mensal: <span className="num">{fmt.moeda(agregado12m.medias.faturamento)}</span>
                  </span>
                  {agregado12m.aliquotaRealApurada && (
                    <>
                      <span className="text-success opacity-40">|</span>
                      <span className="text-success font-medium">
                        Alíq. real: <span className="num">{fmt.pct(agregado12m.aliquotaRealApurada)}</span>
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {erros.dados12m && (
              <div data-error="true" className="insight-danger px-4 py-3">
                <span className="text-sm">{erros.dados12m}</span>
              </div>
            )}

            <DadosMensais
              onChange={setAgregado12m}
              valoresIniciais={{
                faturamento: dados.faturamentoMensal || '',
                insumos: dados.insumosMensais || '',
              }}
            />
          </div>
        )}

        {/* ── Fornecedores no Simples — LP e LR com insumos ───────────── */}
        {mostrarFornecedorSimples && (
          <div className="border border-[#E4DDD2] rounded-xl p-4 space-y-3 bg-[#FBFAF7]">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9286" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">Crédito de IVA — Mix de Fornecedores</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              Ao comprar de fornecedor no <strong className="text-ink-secondary">Simples Nacional</strong>, o crédito de IBS/CBS disponível é de apenas ~5,88% (vs. 26,5% de fornecedores no regime pleno). Informe o percentual das suas compras feitas de fornecedores no Simples para ajustar o cálculo.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="label mb-0">Compras de fornecedores no Simples Nacional</label>
                <span className="text-sm font-bold num text-ink">{dados.pctFornecedoresSimples}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={1}
                value={dados.pctFornecedoresSimples}
                onChange={e => setDados(prev => ({ ...prev, pctFornecedoresSimples: Number(e.target.value) }))}
                className="w-full accent-[#111111]"
              />
              <div className="flex justify-between text-xs text-ink-muted">
                <span>0% — todos no regime pleno</span>
                <span>100% — todos no Simples</span>
              </div>
              {dados.pctFornecedoresSimples > 0 && parseMoeda(dados.insumosMensais) > 0 && (() => {
                const insumos = parseMoeda(dados.insumosMensais)
                const fat = parseMoeda(dados.faturamentoMensal)
                const aliqIVA = 0.265 * (1 - (setorSelecionado?.reducao ?? 0))
                const fracSimples = dados.pctFornecedoresSimples / 100
                const creditoPerdido = insumos * fracSimples * (aliqIVA - 0.0588)
                const aliqEfetiva = fracSimples * 0.0588 + (1 - fracSimples) * aliqIVA
                return (
                  <div className="bg-[#FFF4DA] border border-[#F4C97A] rounded-lg px-3 py-2 text-xs text-[#B7791F] space-y-0.5">
                    <p>Crédito efetivo sobre insumos: <strong className="num">{(aliqEfetiva * 100).toFixed(2)}%</strong> (vs. {(aliqIVA * 100).toFixed(2)}% sem restrição)</p>
                    <p>Crédito perdido estimado: <strong className="num">−{fmt.moeda(creditoPerdido)}/mês</strong> ({fmt.moeda(creditoPerdido * 12)}/ano)</p>
                    {fat > 0 && <p>Impacto na alíquota efetiva: <strong className="num">+{((creditoPerdido / fat) * 100).toFixed(2)}%</strong></p>}
                  </div>
                )
              })()}
            </div>
          </div>
        )}


        {/* ── Anexo Simples Nacional ───────────────────────────────────── */}
        {mostrarAnexoSimples && (
          <div className="border border-[#E4DDD2] rounded-xl p-4 space-y-3 bg-[#FBFAF7]">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9286" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
              </svg>
              <span className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">Anexo do Simples Nacional</span>
            </div>
            <p className="text-xs text-ink-muted leading-relaxed">
              O anexo define a alíquota exata e a composição tributária (incluindo a parcela de CBS). Consulte seu contador ou o PGDAS-D se tiver dúvida.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {([
                { value: 'I',   label: 'Anexo I — Comércio', desc: 'Venda de mercadorias em geral' },
                { value: 'II',  label: 'Anexo II — Indústria', desc: 'Fabricação / transformação industrial' },
                { value: 'III', label: 'Anexo III — Serviços gerais', desc: 'Serviços não listados nos §§5-C e 5-I (ex: salões, academias, transporte)' },
                { value: 'IV',  label: 'Anexo IV — Serviços §5-C', desc: 'Construção civil, limpeza, vigilância, telemarketing — empresa recolhe CPP separado' },
                { value: 'V',   label: 'Anexo V — Serviços §5-I', desc: 'Auditoria, consultoria, jornalismo, tecnologia, publicidade, engenharia e similares' },
              ] as const).map(op => (
                <label key={op.value} className={`flex items-start gap-3 cursor-pointer rounded-lg border px-3 py-2.5 transition-colors
                  ${anexoSimples === op.value
                    ? 'border-[#6B5E4E] bg-white'
                    : 'border-[#E4DDD2] bg-white hover:border-[#9A9286]'
                  }`}>
                  <input
                    type="radio"
                    name="anexoSimples"
                    value={op.value}
                    checked={anexoSimples === op.value}
                    onChange={() => setAnexoSimples(op.value)}
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <span className="text-sm font-semibold text-ink">{op.label}</span>
                    <span className="block text-xs text-ink-muted mt-0.5">{op.desc}</span>
                  </div>
                </label>
              ))}
            </div>
            {!anexoSimples && (
              <p className="text-xs text-warning font-medium">Selecione o anexo para um cálculo preciso. Sem seleção, o sistema infere pelo tipo de setor.</p>
            )}

            {/* ── Atividade mista — dois anexos ─────────────────────── */}
            {anexoSimples && (
              <div className="mt-3 border-t border-[#E4DDD2] pt-3 space-y-3">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={ativoAnexoMisto}
                    onChange={e => {
                      setAtivoAnexoMisto(e.target.checked)
                      if (!e.target.checked) setAnexoSimples2('')
                    }}
                    className="w-4 h-4 accent-[#111111]"
                  />
                  <span className="text-xs font-semibold text-ink-secondary">
                    Atividade mista — empresa fatura em dois anexos distintos
                  </span>
                </label>

                {ativoAnexoMisto && (
                  <div className="space-y-3 bg-[#F5F1EB] rounded-lg p-3">
                    <p className="text-xs text-ink-muted leading-relaxed">
                      LC 123/2006 Art. 18 §4-A: quando a empresa tem receitas de atividades de anexos diferentes, cada parcela é tributada pelo seu próprio anexo. Ex.: venda de produtos (Anexo I) + prestação de serviços de construção (Anexo IV).
                    </p>

                    {/* Segundo anexo */}
                    <div>
                      <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-1.5 block">
                        Segundo Anexo
                      </label>
                      <div className="grid grid-cols-1 gap-1.5">
                        {([
                          { value: 'I',   label: 'Anexo I — Comércio' },
                          { value: 'II',  label: 'Anexo II — Indústria' },
                          { value: 'III', label: 'Anexo III — Serviços gerais' },
                          { value: 'IV',  label: 'Anexo IV — Serviços §5-C' },
                          { value: 'V',   label: 'Anexo V — Serviços §5-I' },
                        ] as const).filter(op => op.value !== anexoSimples).map(op => (
                          <label key={op.value} className={`flex items-center gap-2.5 cursor-pointer rounded-lg border px-3 py-2 transition-colors
                            ${anexoSimples2 === op.value
                              ? 'border-[#6B5E4E] bg-white'
                              : 'border-[#E4DDD2] bg-white hover:border-[#9A9286]'
                            }`}>
                            <input
                              type="radio"
                              name="anexoSimples2"
                              value={op.value}
                              checked={anexoSimples2 === op.value}
                              onChange={() => setAnexoSimples2(op.value)}
                              className="flex-shrink-0"
                            />
                            <span className="text-sm font-medium text-ink">{op.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Slider de split */}
                    {anexoSimples2 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-semibold text-ink-secondary">
                          <span>Divisão da receita</span>
                          <span className="num">{pctAnexo1}% · {100 - pctAnexo1}%</span>
                        </div>
                        <input
                          type="range"
                          min={1}
                          max={99}
                          step={1}
                          value={pctAnexo1}
                          onChange={e => setPctAnexo1(Number(e.target.value))}
                          className="w-full accent-[#111111]"
                        />
                        <div className="flex justify-between text-xs text-ink-muted">
                          <span>{pctAnexo1}% — Anexo {anexoSimples}</span>
                          <span>{100 - pctAnexo1}% — Anexo {anexoSimples2}</span>
                        </div>
                        {fatEfetivo > 0 && (() => {
                          const f1 = fatEfetivo * pctAnexo1 / 100
                          const f2 = fatEfetivo * (100 - pctAnexo1) / 100
                          return (
                            <p className="text-xs text-ink-muted">
                              ≈ <span className="num font-medium">{fmt.moeda(f1)}</span>/mês no Anexo {anexoSimples}{' '}
                              + <span className="num font-medium">{fmt.moeda(f2)}</span>/mês no Anexo {anexoSimples2}
                            </p>
                          )
                        })()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Incorporação Imobiliária — redutor de ajuste + social ────────── */}
      {setorSelecionado?.regimeImobiliario && (
        <div className="card p-5 space-y-4 border-l-4 border-l-[#C2A96A]">
          <div>
            <h3 className="text-sm font-semibold text-ink">Incorporação Imobiliária — Base de Cálculo Real</h3>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Arts. 369-376 Dec. 12.955/2026: CBS incide sobre o valor da venda <strong>menos o redutor de ajuste</strong> (custo corrigido pelo IPCA) e <strong>menos o redutor social</strong> (R$100k por unidade residencial ou R$30k por lote).
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Custo médio do imóvel (% do preço de venda)
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={95} step={1}
                  value={pctCustoImovel}
                  onChange={e => setPctCustoImovel(Number(e.target.value))}
                  className="flex-1 accent-[var(--color-ink)]"
                />
                <span className="num text-sm font-bold text-ink w-10 text-right">{pctCustoImovel}%</span>
              </div>
              <p className="text-xs text-ink-muted">Custo de aquisição + construção ÷ preço de venda</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Redutor social mensal (R$)
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium">R$</span>
                <input type="text" inputMode="numeric"
                  value={redutorSocialMensal > 0 ? redutorSocialMensal.toLocaleString('pt-BR') : ''}
                  onChange={e => setRedutorSocialMensal(Number(e.target.value.replace(/\D/g,'')) || 0)}
                  placeholder="0"
                  className="input-field pl-10 num"
                />
              </div>
              <p className="text-xs text-ink-muted">R$100.000 × unidades residenciais/mês ou R$30.000 × lotes/mês</p>
            </div>
          </div>
          <div className="bg-[#FFF7ED] border border-[#F5C27C] rounded-lg px-3 py-2 text-xs text-[#92400E]">
            Exemplo: vende 1 apartamento/mês a R$500k, custo 70% = R$350k, redutor social R$100k → base CBS = <strong>R$50k</strong> (não R$500k)
          </div>
        </div>
      )}

      {/* ── Agência de Turismo — base sobre margem ───────────────────────── */}
      {setorSelecionado?.baseReduzidaRepasse && (
        <div className="card p-5 space-y-3 border-l-4 border-l-info">
          <div>
            <h3 className="text-sm font-semibold text-ink">Agência de Turismo — CBS sobre Margem</h3>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Art. 418 Dec. 12.955/2026: base de cálculo = receita total <strong>menos repasses</strong> a fornecedores intermediados (hotéis, cias aéreas, etc.).
            </p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
              % da receita repassado a fornecedores
            </label>
            <div className="flex items-center gap-3">
              <input type="range" min={0} max={99} step={1}
                value={pctRepasseAgencia}
                onChange={e => setPctRepasseAgencia(Number(e.target.value))}
                className="flex-1 accent-[var(--color-ink)]"
              />
              <span className="num text-sm font-bold text-ink w-10 text-right">{pctRepasseAgencia}%</span>
            </div>
            <p className="text-xs text-ink-muted">CBS incide apenas sobre os {100 - pctRepasseAgencia}% restantes (comissão/margem)</p>
          </div>
        </div>
      )}

      {/* ── Vendas ao Governo — redutor progressivo ──────────────────────── */}
      {fatEfetivo > 0 && (
        <div className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-ink">Vendas ao Governo (opcional)</h3>
              <p className="text-xs text-ink-muted mt-0.5">Arts. 441-443 Dec. 12.955/2026: CBS reduzida 10-40% sobre a parcela de receita pública (2029–2032)</p>
            </div>
          </div>
          {pctVendasGoverno > 0 || true ? (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                % da receita proveniente de contratos governamentais
              </label>
              <div className="flex items-center gap-3">
                <input type="range" min={0} max={100} step={5}
                  value={pctVendasGoverno}
                  onChange={e => setPctVendasGoverno(Number(e.target.value))}
                  className="flex-1 accent-[var(--color-ink)]"
                />
                <span className="num text-sm font-bold text-ink w-10 text-right">{pctVendasGoverno}%</span>
              </div>
              {pctVendasGoverno === 0 && <p className="text-xs text-ink-muted">0% = sem impacto. Ajuste se vende para União, Estados ou Municípios.</p>}
            </div>
          ) : null}
        </div>
      )}

      {/* ── Gorjeta — excluída da base IBS/CBS (Art. 274 LC 214/2025) ──────── */}
      {mostrarGorjeta && (
        <div className="card p-5 space-y-3 border-l-4 border-l-[#C2A96A]">
          <div>
            <h3 className="text-sm font-semibold text-ink">Gorjeta — Exclusão da Base IBS/CBS</h3>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Art. 274 §único I LC 214/2025: a gorjeta paga pelo consumidor (até 15% do valor da conta) <strong>não integra a base</strong> de cálculo do IBS/CBS.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">% de gorjeta sobre o faturamento</label>
              <span className="num text-sm font-bold text-ink w-10 text-right">{pctGorjeta}%</span>
            </div>
            <input type="range" min={0} max={15} step={1}
              value={pctGorjeta}
              onChange={e => setPctGorjeta(Number(e.target.value))}
              className="w-full accent-[var(--color-ink)]"
            />
            <div className="flex justify-between text-xs text-ink-muted">
              <span>0% — sem gorjeta</span>
              <span>15% — limite legal</span>
            </div>
            {pctGorjeta > 0 && fatEfetivo > 0 && (
              <div className="bg-[#F0FBF0] border border-[#86EFAC] rounded-lg px-3 py-2 text-xs text-[#166534]">
                Gorjeta excluída: <strong className="num">{fmt.moeda(fatEfetivo * pctGorjeta / 100)}/mês</strong> — base IBS/CBS reduzida para <strong className="num">{fmt.moeda(fatEfetivo * (1 - pctGorjeta / 100))}/mês</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Fator R — folha de pagamento (Simples Nacional §5-I) ─────────── */}
      {mostrarFatorR && (
        <div className="card p-5 space-y-3 border-l-4 border-l-info">
          <div>
            <h3 className="text-sm font-semibold text-ink">Fator R — Análise de Anexo (opcional)</h3>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              LC 123/2006 Art. 18 §5-I: se folha ÷ faturamento ≥ 28%, o serviço migra para Anexo III (mais barato que o V). Preencha para ver a análise — o anexo que você selecionou acima <strong>não será alterado</strong>.
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Folha de Pagamento Mensal (pró-labore + CLT)</label>
            <div className="relative mt-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium select-none">R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={folhaMensal}
                onChange={e => setFolhaMensal(mascaraMoeda(e.target.value))}
                placeholder="0"
                className="input-field pl-10 num"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Lucro Real — Apuração Efetiva de IRPJ/CSLL ──────────────────── */}
      {!['mei', 'profissional_liberal', 'produtor_rural'].includes(dados.regime) && (
        <div className="card p-5 space-y-4 border-l-4 border-l-gold">
          <div>
            <h3 className="text-sm font-semibold text-ink">
              {dados.regime === 'lucro_real'
                ? 'Apuração do Lucro Real — IRPJ e CSLL (opcional)'
                : dados.regime === 'lucro_presumido'
                ? 'Dados da Apuração — Folha, ICMS e ISS (opcional)'
                : 'Comparativo Lucro Real — Dados para Simulação (opcional)'}
            </h3>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              {dados.regime === 'lucro_real'
                ? <>Informe os dados reais para calcular IRPJ e CSLL sobre o lucro efetivo em vez de usar a margem estimada.
                  {' '}Base: Receita − CMV/Insumos − Folha − INSS Patronal − Despesas Operacionais − ICMS − ISS − PIS/COFINS líquido.</>
                : dados.regime === 'lucro_presumido'
                ? <>As alíquotas de ICMS/ISS informadas substituem as médias nacionais no cálculo da sua carga atual,
                  e a folha adiciona o INSS patronal (20%). Também alimentam o comparativo com o Lucro Real.</>
                : <>O comparador de regimes simula o Lucro Real com margem estimada. Informe os dados reais para um comparativo preciso.
                  {' '}Base: Receita − CMV/Insumos − Folha − INSS Patronal − Despesas Operacionais − ICMS − ISS − PIS/COFINS líquido.</>}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Folha de pagamento */}
            <div>
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Folha de Pagamento Mensal
              </label>
              <p className="text-[10px] text-ink-muted mt-0.5">Salários brutos (sistema calcula INSS patronal 20% sobre esse valor)</p>
              <div className="relative mt-1.5">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium select-none">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={folhaPagamentoLRStr}
                  onChange={e => setFolhaPagamentoLRStr(mascaraMoeda(e.target.value))}
                  placeholder="0"
                  className="input-field pl-10 num"
                />
              </div>
            </div>

            {/* ICMS */}
            <div>
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                ICMS — Alíquota
              </label>
              <p className="text-[10px] text-ink-muted mt-0.5">Alíquota do ICMS. O crédito sobre as compras informadas é calculado automaticamente. Ex: 18%</p>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  value={aliquotaICMSStr}
                  onChange={e => setAliquotaICMSStr(e.target.value.replace(/[^0-9,.]/g, ''))}
                  placeholder="0,00"
                  className="input-field pr-8 num"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm select-none">%</span>
              </div>
            </div>

            {/* ISS */}
            <div>
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                ISSQN — Alíquota Efetiva
              </label>
              <p className="text-[10px] text-ink-muted mt-0.5">Alíquota municipal sobre serviços. Ex: 2% a 5%</p>
              <div className="relative mt-1.5">
                <input
                  type="text"
                  inputMode="decimal"
                  value={aliquotaISSStr}
                  onChange={e => setAliquotaISSStr(e.target.value.replace(/[^0-9,.]/g, ''))}
                  placeholder="0,00"
                  className="input-field pr-8 num"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm select-none">%</span>
              </div>
            </div>

            {/* Despesas operacionais */}
            <div>
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                Despesas Operacionais Mensais
              </label>
              <p className="text-[10px] text-ink-muted mt-0.5">Aluguel, energia, marketing, adm, depreciação — dedutíveis do IRPJ/CSLL</p>
              <div className="relative mt-1.5">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium select-none">R$</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={despesasOperacionaisStr}
                  onChange={e => setDespesasOperacionaisStr(mascaraMoeda(e.target.value))}
                  placeholder="0"
                  className="input-field pl-10 num"
                />
              </div>
            </div>
          </div>

          {/* Preview do cálculo */}
          {(parseMoeda(folhaPagamentoLRStr) > 0 || aliquotaICMSStr || aliquotaISSStr || parseMoeda(despesasOperacionaisStr) > 0 || sociosAdministradores.length > 0) && (() => {
            const fat = parseMoeda(dados.faturamentoMensal)
            const ins = parseMoeda(dados.insumosMensais)
            const folha = parseMoeda(folhaPagamentoLRStr)
            const cppFolha = folha * 0.20
            const terceiros = folha * 0.058
            const proLabore = sociosAdministradores.reduce((s, so) => s + so.prolaboreMensal, 0)
            const cppProLabore = proLabore * 0.20
            const contribPrev = cppFolha + terceiros + cppProLabore
            const despOp = parseMoeda(despesasOperacionaisStr)
            const aliqICMS = parseFloat((aliquotaICMSStr || '0').replace(',', '.')) / 100 || 0
            const icms = Math.max(0, (fat - ins) * aliqICMS)  // débito sobre vendas − crédito sobre compras
            const iss  = fat * (parseFloat((aliquotaISSStr  || '0').replace(',', '.')) / 100 || 0)
            const pisCofins = Math.max(0, (fat - ins) * 0.0925)
            const lucro = Math.max(0, fat - ins - folha - cppFolha - terceiros - proLabore - cppProLabore - despOp - icms - iss - pisCofins)
            const irpj = lucro * 0.15 + Math.max(0, lucro - 20000) * 0.10
            const csll = lucro * 0.09
            const isLP = dados.regime === 'lucro_presumido'
            return (
              <div className="bg-[#FBFAF7] border border-border rounded-lg p-3 text-xs space-y-1.5">
                <div className="font-semibold text-ink mb-2">
                  {isLP ? 'Prévia — contribuição previdenciária patronal' : 'Prévia da apuração mensal (Lucro Real)'}
                </div>
                {!isLP && <>
                  <div className="flex justify-between text-ink-muted"><span>(−) CMV / Insumos</span><span className="num">−{fmt.moeda(ins)}</span></div>
                  <div className="flex justify-between text-ink-muted"><span>(−) Folha de pagamento (salários)</span><span className="num">−{fmt.moeda(folha)}</span></div>
                  <div className="flex justify-between text-ink-muted"><span>(−) CPP patronal (20%)</span><span className="num">−{fmt.moeda(cppFolha)}</span></div>
                  <div className="flex justify-between text-ink-muted"><span>(−) Terceiros — Sistema S (5,8%)</span><span className="num">−{fmt.moeda(terceiros)}</span></div>
                  {proLabore > 0 && <>
                    <div className="flex justify-between text-ink-muted"><span>(−) Pró-labore dos sócios</span><span className="num">−{fmt.moeda(proLabore)}</span></div>
                    <div className="flex justify-between text-ink-muted"><span>(−) CPP pró-labore (20%)</span><span className="num">−{fmt.moeda(cppProLabore)}</span></div>
                  </>}
                  <div className="flex justify-between text-ink-muted"><span>(−) Despesas operacionais</span><span className="num">−{fmt.moeda(despOp)}</span></div>
                  <div className="flex justify-between text-ink-muted"><span>(−) ICMS {ins > 0 && aliqICMS > 0 ? '(vendas − compras)' : 'líquido'}</span><span className="num">−{fmt.moeda(icms)}</span></div>
                  <div className="flex justify-between text-ink-muted"><span>(−) ISS</span><span className="num">−{fmt.moeda(iss)}</span></div>
                  <div className="flex justify-between text-ink-muted"><span>(−) PIS/COFINS líquido (9,25%)</span><span className="num">−{fmt.moeda(pisCofins)}</span></div>
                  <div className="flex justify-between font-semibold text-ink border-t border-border pt-1.5"><span>Lucro Real</span><span className="num">{fmt.moeda(lucro)}</span></div>
                  <div className="flex justify-between text-ink-muted"><span>IRPJ (15% + adicional)</span><span className="num">{fmt.moeda(irpj)}</span></div>
                  <div className="flex justify-between text-ink-muted"><span>CSLL (9%)</span><span className="num">{fmt.moeda(csll)}</span></div>
                </>}
                {isLP && <>
                  <div className="flex justify-between text-ink-muted"><span>Folha (salários brutos)</span><span className="num">{fmt.moeda(folha)}</span></div>
                  <div className="flex justify-between text-warning font-medium"><span>CPP patronal (20% folha)</span><span className="num">{fmt.moeda(cppFolha)}</span></div>
                  <div className="flex justify-between text-warning font-medium"><span>Terceiros — Sistema S (5,8% folha)</span><span className="num">{fmt.moeda(terceiros)}</span></div>
                  {proLabore > 0 && (
                    <div className="flex justify-between text-warning font-medium"><span>CPP pró-labore (20% de {fmt.moeda(proLabore)})</span><span className="num">{fmt.moeda(cppProLabore)}</span></div>
                  )}
                  <p className="text-[10px] text-ink-muted leading-relaxed">No Simples Nacional a CPP já está dentro do DAS. No Lucro Presumido é paga separadamente.</p>
                </>}
                <div className="flex justify-between font-bold text-ink border-t border-border pt-1.5">
                  <span>{isLP ? 'Contribuição previdenciária total' : 'Total impostos'}</span>
                  <span className="num text-danger">{fmt.moeda(isLP ? contribPrev : irpj + csll + pisCofins + icms + iss + contribPrev)}</span>
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Créditos Presumidos — Arts. 168-169 LC 214/2025 ─────────────── */}
      {mostrarCreditoPresumido && (
        <div className="card p-5 space-y-4 border-l-4 border-l-success">
          <div>
            <h3 className="text-sm font-semibold text-ink">Créditos Presumidos — Fornecedores Não-Contribuintes</h3>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              LC 214/2025: quando você compra de <strong>produtor rural</strong> não-contribuinte (Art. 168) ou contrata <strong>transportador autônomo PF</strong> (Art. 169), tem direito a crédito presumido de IBS/CBS como se eles tivessem sido contribuintes.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                  % dos insumos adquiridos de produtor rural não-contribuinte
                </label>
                <span className="num text-sm font-bold text-ink w-10 text-right">{pctInsumosProdutorRural}%</span>
              </div>
              <input type="range" min={0} max={100} step={5}
                value={pctInsumosProdutorRural}
                onChange={e => setPctInsumosProdutorRural(Number(e.target.value))}
                className="w-full accent-[var(--color-ink)]"
              />
              {pctInsumosProdutorRural > 0 && insEfetivo > 0 && (
                <p className="text-xs text-success">
                  Crédito presumido estimado: <strong className="num">
                    {fmt.moeda(insEfetivo * pctInsumosProdutorRural / 100 * 0.265 * 0.40)}/mês
                  </strong> (alíquota efetiva insumos agropecuários: 10,6%)
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
                  % dos custos logísticos via transportador autônomo PF
                </label>
                <span className="num text-sm font-bold text-ink w-10 text-right">{pctFreteAutonomo}%</span>
              </div>
              <input type="range" min={0} max={100} step={5}
                value={pctFreteAutonomo}
                onChange={e => setPctFreteAutonomo(Number(e.target.value))}
                className="w-full accent-[var(--color-ink)]"
              />
              {pctFreteAutonomo > 0 && insEfetivo > 0 && (
                <p className="text-xs text-success">
                  Crédito presumido estimado: <strong className="num">
                    {fmt.moeda(insEfetivo * pctFreteAutonomo / 100 * 0.265 * 0.60)}/mês
                  </strong> (alíquota efetiva frete rodoviário: 15,9%)
                </p>
              )}
            </div>
          </div>
          <p className="text-[10px] text-ink-muted">* Taxas estimadas com base nos percentuais de redução legais (Arts. 128 e 286 LC 214/2025). Os percentuais exatos serão definidos anualmente por ato conjunto MF/CGIBS (Arts. 168-169 LC 214/2025).</p>
        </div>
      )}

      {/* ── Venda de Bens do Ativo Imobilizado — Arts. 406-407 LC 214/2025 ── */}
      {['lucro_presumido', 'lucro_real', 'produtor_rural'].includes(dados.regime) && fatEfetivo > 0 && (
        <div className="card p-5 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-ink">Venda de Bens do Ativo Imobilizado (opcional)</h3>
            <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
              Arts. 406-407 LC 214/2025: a venda de máquinas, equipamentos e outros bens do ativo imobilizado está sujeita a IBS/CBS pela <strong>alíquota plena</strong> do setor (não há redução específica na transição).
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Receita mensal estimada com venda de imobilizado</label>
            <div className="relative mt-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted text-sm font-medium select-none">R$</span>
              <input
                type="text"
                inputMode="numeric"
                value={vendaImobilizadoMensalStr}
                onChange={e => setVendaImobilizadoMensalStr(mascaraMoeda(e.target.value))}
                placeholder="0"
                className="input-field pl-10 num"
              />
            </div>
            {parseMoeda(vendaImobilizadoMensalStr) > 0 && setorSelecionado && (
              <p className="text-xs text-warning mt-1.5">
                IBS/CBS estimado na venda: <strong className="num">
                  {fmt.moeda(parseMoeda(vendaImobilizadoMensalStr) * 0.265 * (1 - setorSelecionado.reducao))}/mês
                </strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Art. 108 — Crédito Integral e Imediato em Bens de Capital ────── */}
      {mostrarCapital && (
        <div className="card p-5 space-y-3 border-l-4 border-l-[#6366F1]">
          <div>
            <h3 className="text-sm font-bold text-ink">Bens de Capital — Art. 108 LC 214/2025</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Crédito <strong>integral e imediato</strong> de IBS/CBS no mês da compra (vs. PIS/COFINS: 1/48 por mês).
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Investimento em bens de capital / mês</label>
            <input type="text" inputMode="numeric"
              value={investimentoCapitalStr}
              onChange={e => setInvestimentoCapitalStr(mascaraMoeda(e.target.value))}
              placeholder="0"
              className="input-field mt-1"
            />
            {parseMoeda(investimentoCapitalStr) > 0 && setorSelecionado && (
              <p className="text-xs text-[#4F46E5] mt-1.5">
                Crédito IBS/CBS no mês: <strong className="num">
                  {fmt.moeda(parseMoeda(investimentoCapitalStr) * 0.265 * (1 - setorSelecionado.reducao))}
                </strong> — vs. PIS/COFINS que creditaria <strong className="num">
                  {fmt.moeda(parseMoeda(investimentoCapitalStr) * 0.0925 / 48)}/mês
                </strong> por 48 meses.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Art. 110 — Alíquota Zero: Rural e Transportador Autônomo ───────── */}
      {(mostrarAliqZeroRural || mostrarAliqZeroTransp) && (
        <div className="card p-5 space-y-4 border-l-4 border-l-[#10B981]">
          <div>
            <h3 className="text-sm font-bold text-ink">Alíquota Zero — Art. 110 LC 214/2025</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Vendas de maquinário agrícola para produtor rural não-contribuinte e veículos para transportador autônomo PF têm IBS/CBS = 0.
            </p>
          </div>
          {mostrarAliqZeroRural && (
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">% das vendas para produtor rural (alíq. zero)</label>
                <span className="num text-sm font-bold text-ink w-10 text-right">{pctVendasAliqZeroRural}%</span>
              </div>
              <input type="range" min={0} max={100} step={5}
                value={pctVendasAliqZeroRural}
                onChange={e => setPctVendasAliqZeroRural(Number(e.target.value))}
                className="w-full accent-[var(--color-ink)]"
              />
            </div>
          )}
          {mostrarAliqZeroTransp && (
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">% das vendas para transportador autônomo PF (alíq. zero)</label>
                <span className="num text-sm font-bold text-ink w-10 text-right">{pctVendasAliqZeroTransp}%</span>
              </div>
              <input type="range" min={0} max={100} step={5}
                value={pctVendasAliqZeroTransp}
                onChange={e => setPctVendasAliqZeroTransp(Number(e.target.value))}
                className="w-full accent-[var(--color-ink)]"
              />
            </div>
          )}
        </div>
      )}

      {/* ── Não-cumulatividade Ampla — Despesas Creditáveis Adicionais ───── */}
      {mostrarDespesasCrediteis && (
        <div className="card p-5 space-y-3 border-l-4 border-l-[#0EA5E9]">
          <div>
            <h3 className="text-sm font-bold text-ink">Não-cumulatividade Ampla — IBS/CBS</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              IBS/CBS admite crédito sobre despesas que hoje <strong>não geram crédito</strong> de PIS/COFINS: aluguel, energia, seguros, marketing, serviços administrativos, TI, etc.
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Despesas creditáveis adicionais / mês (além dos insumos diretos)</label>
            <input type="text" inputMode="numeric"
              value={despesasCrediteisStr}
              onChange={e => setDespesasCrediteisStr(mascaraMoeda(e.target.value))}
              placeholder="0"
              className="input-field mt-1"
            />
            {parseMoeda(despesasCrediteisStr) > 0 && setorSelecionado && (
              <p className="text-xs text-[#0369A1] mt-1.5">
                Crédito adicional estimado: <strong className="num">
                  {fmt.moeda(parseMoeda(despesasCrediteisStr) * 0.265 * (1 - setorSelecionado.reducao))}/mês
                </strong>
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Regime Automotivo — crédito presumido CBS (Arts. 309-316) ─────── */}
      {mostrarRegimeAutomotivo && (
        <div className="card p-5 space-y-4 border-l-4 border-l-[#0EA5E9]">
          <div>
            <h3 className="text-sm font-bold text-ink">Regime Automotivo — Crédito Presumido CBS (Arts. 309-316 LC 214/2025)</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Exclusivo para <strong>projetos habilitados</strong> (Lei 9.440/1997) com ato concessório — montadoras de veículos elétricos/biocombustível em regiões incentivadas. Vigente até 2032 (redução de 20%/ano a partir de 2029).
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input type="checkbox"
              checked={regimeAutomotivoHabilitado}
              onChange={e => setRegimeAutomotivoHabilitado(e.target.checked)}
              className="accent-[var(--color-ink)] w-4 h-4"
            />
            Tenho projeto habilitado ao regime automotivo
          </label>
          {regimeAutomotivoHabilitado && (
            <div>
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Fase de fruição do benefício</label>
              <select
                value={faseRegimeAutomotivo}
                onChange={e => setFaseRegimeAutomotivo(Number(e.target.value) as 1 | 2 | 3)}
                className="input-field mt-1"
              >
                <option value={1}>Até o 12º mês — crédito 11,60%</option>
                <option value={2}>Do 13º ao 48º mês — crédito 10,00%</option>
                <option value={3}>Do 49º ao 60º mês — crédito 8,70%</option>
              </select>
            </div>
          )}
        </div>
      )}

      {/* ── Zona Franca de Manaus — tipo de bem (Art. 450 §1º) ────────────── */}
      {mostrarZFM && (
        <div className="card p-5 space-y-3 border-l-4 border-l-[#10B981]">
          <div>
            <h3 className="text-sm font-bold text-ink">Zona Franca de Manaus — Crédito Presumido (Art. 450 LC 214/2025)</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Indústria incentivada habilitada na Suframa: crédito presumido de IBS (varia por tipo de bem) + CBS (2% sobre a operação) ao destinar produção ao território nacional.
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">Tipo de bem produzido</label>
            <select
              value={tipoBemZFM}
              onChange={e => setTipoBemZFM(e.target.value as typeof tipoBemZFM)}
              className="input-field mt-1"
            >
              <option value="consumo_final">Bem de consumo final — crédito IBS 55%</option>
              <option value="capital">Bem de capital — crédito IBS 75%</option>
              <option value="intermediario">Bem intermediário — crédito IBS 90,25%</option>
              <option value="informatica">Bem de informática — crédito IBS 100%</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Farmácias — % da receita em medicamentos (Art. 133) ──────────── */}
      {mostrarMedicamentos && (
        <div className="card p-5 space-y-3 border-l-4 border-l-success">
          <div>
            <h3 className="text-sm font-bold text-ink">Composição da Receita — Medicamentos (Art. 133 LC 214/2025)</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Medicamentos registrados na Anvisa têm <strong>redução de 60%</strong>. Itens não-medicamento (perfumaria, cosméticos, conveniência) ficam na alíquota cheia. Informe o % da receita em medicamentos para a alíquota efetiva.
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">% do faturamento em medicamentos</label>
              <span className="num text-sm font-bold text-ink w-10 text-right">{pctMedicamentos}%</span>
            </div>
            <input type="range" min={0} max={100} step={5}
              value={pctMedicamentos}
              onChange={e => setPctMedicamentos(Number(e.target.value))}
              className="w-full accent-[var(--color-ink)]"
            />
            {pctMedicamentos > 0 && (
              <p className="text-xs text-success mt-1.5">
                Alíquota efetiva estimada: <strong className="num">
                  {(pctMedicamentos / 100 * 0.265 * 0.40 + (1 - pctMedicamentos / 100) * 0.265).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 2 })}
                </strong> (medicamentos a 10,6% · demais itens a 26,5%)
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Supermercados — composição da cesta (Arts. 125/148 + 128) ────── */}
      {mostrarCestaMista && (
        <div className="card p-5 space-y-3 border-l-4 border-l-success">
          <div>
            <h3 className="text-sm font-bold text-ink">Composição da Cesta — Supermercado (LC 214/2025)</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              A cesta de um mercado é mista. A alíquota efetiva é a média ponderada pela sua curva de vendas — ajuste pela curva ABC real do cliente.
            </p>
          </div>

          {/* Legenda das faixas */}
          <div className="bg-subtle rounded-lg p-3 space-y-1 text-xs text-ink-secondary">
            <p><strong className="text-success">Alíquota zero:</strong> cesta básica nacional, hortifruti, frutas e ovos (Arts. 125/148)</p>
            <p><strong className="text-success">Redução 60% (10,6%):</strong> demais alimentos (Anexo VII) e higiene/limpeza popular (Anexo VIII)</p>
            <p><strong className="text-ink">Cheia (26,5%):</strong> bebidas, limpeza premium, bazar, utilidades, eletro, pet, etc.</p>
          </div>

          {/* Botão de referência */}
          <button type="button"
            onClick={() => { setPctCestaZero(35); setPctCestaReduzida(25) }}
            className="text-xs font-medium text-success border border-success-border rounded-lg px-3 py-1.5 hover:bg-success-soft transition-colors"
          >
            Usar composição típica de referência (35% zero · 25% reduzido · 40% cheia)
          </button>

          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">% em itens de alíquota zero</label>
              <span className="num text-sm font-bold text-ink w-10 text-right">{pctCestaZero}%</span>
            </div>
            <input type="range" min={0} max={100} step={5}
              value={pctCestaZero}
              onChange={e => setPctCestaZero(Math.min(Number(e.target.value), 100 - pctCestaReduzida))}
              className="w-full accent-[var(--color-ink)]"
            />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-ink-muted uppercase tracking-wide">% em itens de redução 60%</label>
              <span className="num text-sm font-bold text-ink w-10 text-right">{pctCestaReduzida}%</span>
            </div>
            <input type="range" min={0} max={100} step={5}
              value={pctCestaReduzida}
              onChange={e => setPctCestaReduzida(Math.min(Number(e.target.value), 100 - pctCestaZero))}
              className="w-full accent-[var(--color-ink)]"
            />
          </div>
          {(pctCestaZero > 0 || pctCestaReduzida > 0) && (
            <p className="text-xs text-success">
              Restante na alíquota cheia: <strong className="num">{100 - pctCestaZero - pctCestaReduzida}%</strong> ·
              Alíquota efetiva estimada: <strong className="num">
                {((pctCestaReduzida / 100 * 0.265 * 0.40 + (100 - pctCestaZero - pctCestaReduzida) / 100 * 0.265)).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: 2 })}
              </strong>
            </p>
          )}

          {/* Alerta Imposto Seletivo sobre bebidas */}
          <div className="bg-[#FFF4DA] border border-[#F4C97A] rounded-lg px-3 py-2 text-xs text-[#92400E] leading-relaxed">
            <strong>Imposto Seletivo:</strong> bebidas alcoólicas e açucaradas (dentro da fração cheia) sofrerão IS além do IBS/CBS. A alíquota ainda <strong>não foi fixada</strong> por lei — não está incluída no cálculo.
          </div>

          {/* Dica ICMS alimentos / modo 12 meses */}
          {modoEntrada !== 'detalhado' && (
            <div className="bg-[#EAF1FA] border border-[#9BBCE0] rounded-lg px-3 py-2 text-xs text-[#315C8C] leading-relaxed">
              <strong>Dica:</strong> o ICMS atual sobre alimentos costuma ser reduzido em vários estados, então a estimativa de comércio pode superestimar a carga de hoje. Para mais precisão, use o modo <strong>Histórico real — 12 meses</strong> (informa os impostos efetivamente pagos).
            </div>
          )}

          {/* Crédito amplo */}
          <div className="bg-[#E7F4ED] border border-[#A8D5BC] rounded-lg px-3 py-2 text-xs text-[#166534] leading-relaxed">
            <strong>Crédito amplo:</strong> energia das lojas, aluguel, refrigeração, logística e serviços passam a gerar crédito de IBS/CBS. Para redes com várias lojas, informe esses valores em <strong>“despesas creditáveis adicionais”</strong> — o ganho costuma ser relevante.
          </div>
        </div>
      )}

      {/* ── Alerta Imposto Seletivo ───────────────────────────────────────── */}
      {setorSelecionado?.impostSeletivo && (
        <div className="insight-warning">
          <p className="text-xs leading-relaxed">
            <strong>Imposto Seletivo (IS) — Anexo XVII LC 214/2025:</strong> este setor é sujeito ao IS sobre bens/serviços prejudiciais à saúde ou ao meio ambiente. A alíquota ainda <strong>não foi fixada</strong> por lei ordinária. O simulador não inclui o IS no cálculo — consulte a evolução legislativa antes de precificar.
          </p>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CARD 3 — Grupo Societário (apenas Simples Nacional e MEI)
          ══════════════════════════════════════════════════════════════ */}
      <GrupoEmpresas
        faturamentoMensalPrincipal={fatEfetivo}
        nomePrincipal={nomePrincipal}
        regime={dados.regime}
        numeroCard={3}
        onChange={setEmpresasGrupo}
      />

      {/* ══════════════════════════════════════════════════════════════════
          CARD Pró-labore dos Sócios — LP e Lucro Real
          ══════════════════════════════════════════════════════════════ */}
      <SociosAdministradores
        regime={dados.regime}
        numeroCard={4}
        onChange={setSociosAdministradores}
      />

      {/* ══════════════════════════════════════════════════════════════════
          CARD Holding Patrimonial — disponível para todos os regimes
          ══════════════════════════════════════════════════════════════ */}
      <HoldingPatrimonial
        numeroCard={(dados.regime === 'lucro_presumido' || dados.regime === 'lucro_real') ? 5 : 4}
        onChange={setAnaliseHolding}
      />

      {/* ── Resumo antes de calcular ─────────────────────────────────────── */}
      {dados.regime && dados.setor && fatEfetivo > 0 && (
        <div className="card p-5 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2 text-sm text-ink-secondary">
            <span className="text-ink font-medium">Pronto para calcular:</span>
            <Chip label={REGIMES.find(r => r.value === dados.regime)?.label ?? dados.regime} />
            <Chip label={setorSelecionado?.label.split('(')[0].trim()} />
            <Chip label={`Fat. ${fmt.moeda(fatEfetivo)}/mês`} />
            {insEfetivo > 0 && <Chip label={`Insumos ${fmt.moeda(insEfetivo)}/mês`} />}
            {agregado12m?.aliquotaRealApurada && (
              <Chip label={`Alíq. real ${fmt.pct(agregado12m.aliquotaRealApurada)}`} color="amber" />
            )}
          </div>
          <span className="text-ink-muted text-xs">Ver cálculo abaixo</span>
        </div>
      )}

      {/* ── Submit ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-3 pb-4">
        <button type="submit" className="btn-primary text-base min-w-[260px] flex items-center gap-2">
          Calcular Impacto Tributário
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </button>
        <p className="text-ink-muted text-xs text-center max-w-sm">
          Simulação baseada na alíquota padrão de <span className="num">26,5%</span> (CBS + IBS) conforme LC 214/2025.
          Valores para fins educacionais — não constitui assessoria fiscal.
        </p>
      </div>

    </form>
  )
}

// ─── RegimeCombobox ───────────────────────────────────────────────────────────

interface RegimeComboboxProps {
  value: string
  onChange: (v: string) => void
  grupos: GrupoRegime[]
}

function RegimeCombobox({ value, onChange, grupos }: RegimeComboboxProps) {
  const todosRegimes = grupos.flatMap(g => g.regimes)
  const selecionado = todosRegimes.find(r => r.value === value) ?? null

  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [aberto])

  const selecionar = (v: string) => {
    onChange(v)
    setAberto(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setAberto(o => !o)}
        className={`w-full flex items-center justify-between gap-2 px-4 py-[11px] rounded-xl border-[1.5px] text-sm text-left transition-colors duration-150 bg-white
          ${aberto ? 'border-[#C49A4A] shadow-[0_0_0_3px_rgba(196,154,74,0.14)]' : 'border-[#E4DDD2] hover:border-[#9A9286]'}`}
      >
        <span className={selecionado ? 'text-[#171717] font-medium' : 'text-[#C4BDB4]'}>
          {selecionado ? selecionado.label : 'Selecione o regime tributário...'}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A9286" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {/* Dropdown */}
      {aberto && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#E4DDD2] rounded-xl shadow-lg overflow-hidden">
          {grupos.map(grupo => (
            <div key={grupo.label}>
              <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9A9286] bg-[#FBFAF7] border-b border-[#F0EBE3]">
                {grupo.label}
              </p>
              {grupo.regimes.map(r => {
                const sel = r.value === value
                return (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => selecionar(r.value)}
                    className={`w-full flex items-start justify-between gap-3 px-4 py-3 text-left transition-colors duration-100
                      ${sel ? 'bg-[#EFEAE1]' : 'hover:bg-[#FBFAF7]'}`}
                  >
                    <div className="min-w-0">
                      <p className={`text-sm font-semibold ${sel ? 'text-[#171717]' : 'text-[#5F5A52]'}`}>{r.label}</p>
                      <p className="text-xs text-[#9A9286] mt-0.5 leading-relaxed">{r.desc}</p>
                    </div>
                    {sel && (
                      <svg className="flex-shrink-0 mt-1 text-[#171717]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── SetorCombobox ────────────────────────────────────────────────────────────

interface SetorComboboxProps {
  value: string
  onChange: (v: string) => void
  setoresPorGrupo: Record<string, Setor[]>
}

function SetorCombobox({ value, onChange, setoresPorGrupo }: SetorComboboxProps) {
  const todosSetores = useMemo(() => Object.values(setoresPorGrupo).flat(), [setoresPorGrupo])
  const selecionado = todosSetores.find(s => s.value === value) ?? null

  const [aberto, setAberto] = useState(false)
  const [busca, setBusca] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const filtrado = useMemo(() => {
    if (!busca.trim()) return setoresPorGrupo
    const q = busca.toLowerCase()
    const resultado: Record<string, Setor[]> = {}
    for (const [grupo, lista] of Object.entries(setoresPorGrupo)) {
      const filtrados = lista.filter(s => s.label.toLowerCase().includes(q) || grupo.toLowerCase().includes(q))
      if (filtrados.length) resultado[grupo] = filtrados
    }
    return resultado
  }, [busca, setoresPorGrupo])

  const totalFiltrado = useMemo(() => Object.values(filtrado).flat().length, [filtrado])

  useEffect(() => {
    if (!aberto) return
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setAberto(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [aberto])

  const abrir = () => {
    setAberto(true)
    setBusca('')
    setTimeout(() => inputRef.current?.focus(), 10)
  }

  const selecionar = (v: string) => {
    onChange(v)
    setAberto(false)
    setBusca('')
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={abrir}
        className={`w-full flex items-center justify-between gap-2 px-4 py-[11px] rounded-xl border-[1.5px] text-sm text-left transition-colors duration-150
          ${aberto ? 'border-[#C49A4A] shadow-[0_0_0_3px_rgba(196,154,74,0.14)]' : 'border-[#E4DDD2] hover:border-[#9A9286]'}
          bg-white`}
      >
        <span className={selecionado ? 'text-[#171717]' : 'text-[#C4BDB4]'}>
          {selecionado ? selecionado.label : 'Selecione ou pesquise o setor...'}
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9A9286" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {/* Dropdown */}
      {aberto && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-[#E4DDD2] rounded-xl shadow-lg overflow-hidden">
          {/* Campo de busca */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-[#E4DDD2]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9A9286" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={busca}
              onChange={e => setBusca(e.target.value)}
              placeholder="Pesquisar setor..."
              className="flex-1 text-sm outline-none bg-transparent text-[#171717] placeholder:text-[#C4BDB4]"
            />
            {busca && (
              <button type="button" onClick={() => setBusca('')} className="text-[#9A9286] hover:text-[#171717]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-64 overflow-y-auto">
            {totalFiltrado === 0 ? (
              <p className="px-4 py-3 text-sm text-[#9A9286]">Nenhum setor encontrado.</p>
            ) : (
              Object.entries(filtrado).map(([grupo, lista]) => (
                <div key={grupo}>
                  <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9A9286] bg-[#FBFAF7] border-b border-[#F0EBE3]">
                    {grupo}
                  </p>
                  {lista.map(s => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => selecionar(s.value)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 text-sm text-left transition-colors duration-100
                        ${s.value === value
                          ? 'bg-[#EFEAE1] text-[#171717] font-medium'
                          : 'text-[#5F5A52] hover:bg-[#FBFAF7]'
                        }`}
                    >
                      <span>{s.label}</span>
                      {s.value === value && (
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

interface ChipProps {
  label?: string
  color?: 'amber' | 'default'
}

function Chip({ label, color }: ChipProps) {
  if (!label) return null
  const colors = color === 'amber'
    ? 'bg-warning-soft border-warning-border text-warning'
    : 'bg-subtle border-border text-ink-secondary'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 border rounded text-xs font-medium ${colors}`}>
      {label}
    </span>
  )
}
