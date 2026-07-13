/**
 * Tipos compartilhados — ReformaCalc
 */

export type TipoSetor = 'comercio' | 'industria' | 'servico' | 'misto'
export type TipoRegime = 'simples_nacional' | 'lucro_presumido' | 'lucro_real' | 'mei' | 'profissional_liberal' | 'produtor_rural'
export type AnexoSimples = 'I' | 'II' | 'III' | 'IV' | 'V'
export type PerfilClientes = 'b2c' | 'b2b' | 'misto'
export type FonteAliquota = 'estimada' | 'real'

// ─── Setor ───────────────────────────────────────────────────────────────────
export interface Setor {
  value: string
  label: string
  grupo: string
  reducao: number
  tipo: TipoSetor
  fatorR?: boolean              // true = sujeito ao Fator R no Simples Nacional (Anexo III ou V)
  baseReduzidaMargem?: boolean  // true = CBS incide só na margem (bens usados de PF — Cap. X Dec. 12.955/2026)
  presuncaoLPIRPJ?: number      // override da presunção IRPJ no LP (padrão: 8% comércio/indústria, 32% serviço)
  presuncaoLPCSLL?: number      // override da presunção CSLL no LP (padrão: 12% comércio/indústria, 32% serviço)
  monofasico?: boolean          // true = IVA recolhido upstream; posto varejista não cobra CBS/IBS na saída
  creditoVedadoComprador?: boolean  // Art. 401/407 Dec. 12.955: comprador B2B NÃO pode creditar CBS (restaurantes, hotelaria, parques)
  baseReduzidaRepasse?: boolean     // Art. 418 Dec. 12.955: CBS incide sobre margem (repasse deduzido) — agências de turismo
  regimeImobiliario?: boolean       // Arts. 369-376 Dec. 12.955: base reduzida por redutor de ajuste + redutor social
  impostSeletivo?: boolean          // Anexo XVII LC 214/2025: bem/serviço sujeito ao IS (alíquota a ser fixada por lei ordinária)
  produtorRural?: boolean           // Arts. 164-168: se true o setor segue regime do produtor rural (não-contribuinte abaixo de R$3,6M)
  transporteAutonomo?: boolean      // Art. 169: setor contrata transportadores autônomos PF (crédito presumido disponível)
  cashbackConsumidor?: boolean      // Art. 118 LC 214/2025: setor cujos consumidores PF de baixa renda (CadÚnico) recebem devolução elevada (energia, água, esgoto, gás, telecom)
  vendeMedicamentos?: boolean       // Art. 133 LC 214/2025: setor cuja receita inclui medicamentos (60% de redução) misturados a itens de alíquota cheia — ex: farmácias/drogarias
  cestaMista?: boolean              // setor de cesta mista (supermercados): parte alíquota zero (cesta básica/hortifruti), parte 60% (Anexo VII/VIII), parte cheia
  regimeAutomotivo?: boolean        // Arts. 309-316 LC 214/2025: setor pode ter projeto habilitado ao crédito presumido automotivo (Lei 9.440/1997)
  zfm?: boolean                     // Arts. 439-457 LC 214/2025: indústria incentivada na Zona Franca de Manaus (créditos presumidos IBS/CBS)
}

// Tipo de bem produzido pela indústria incentivada da ZFM — define o % do crédito presumido de IBS (Art. 450 §1º LC 214/2025)
export type TipoBemZFM = 'consumo_final' | 'capital' | 'intermediario' | 'informatica'

// ─── Dados de entrada ────────────────────────────────────────────────────────
export interface DadosMes {
  key: string
  label: string
  faturamento: number
  insumos: number
  impostos: number
  exportacoes: number
}

export interface DadosEntrada {
  regime: TipoRegime
  setor: Setor
  faturamentoMensal: number
  insumosMensais: number
  perfilClientes: PerfilClientes
  aliquotaAtualOverride?: number | null
  dadosMensais?: DadosMes[] | null
  exportacoesMensais?: number
  empresasGrupo?: EmpresaGrupo[]
  nomePrincipal?: string
  analiseHolding?: AnaliseHolding | null
  uf?: string
  anexoSimples?: AnexoSimples
  pctFornecedoresSimples?: number
  // Imóveis — redutor de ajuste + social (Arts. 369-376 Dec. 12.955/2026)
  pctCustoImovel?: number        // % do faturamento que representa custo/redutor de ajuste (ex: 70%)
  redutorSocialMensal?: number   // R$100k × unidades residenciais/mês ou R$30k × lotes/mês
  // Agências de turismo — base sobre margem (Art. 418 Dec. 12.955/2026)
  pctRepasseAgencia?: number     // % do faturamento repassado a fornecedores (deduzido da base CBS)
  // Vendas ao governo (Arts. 441-443 Dec. 12.955/2026)
  pctVendasGoverno?: number      // % da receita proveniente de compras governamentais
  sociosAdministradores?: SocioAdministrador[]
  folhaMensal?: number       // folha de pagamento mensal — usado no Fator R (Simples Nacional serviços §5-I)
  anexoSimples2?: AnexoSimples  // segundo anexo quando empresa tem atividades mistas (LC 123/2006 Art. 18 §4-A)
  pctAnexo1?: number            // % da receita no primeiro anexo (0–100); restante vai para anexoSimples2
  // Gorjeta — excluída da base IBS/CBS para bares/restaurantes (Art. 274 LC 214/2025)
  pctGorjeta?: number            // % do faturamento que representa gorjeta (0–15); apenas para setor restaurantes_bares
  // Crédito presumido — Art. 168 LC 214/2025 (produtor rural) e Art. 169 (transportador autônomo PF)
  pctInsumosProdutorRural?: number    // % dos insumos adquiridos de produtor rural não-contribuinte
  pctFreteAutonomo?: number           // % do custo logístico via transportador autônomo PF
  // Bens de capital usados — venda de ativo imobilizado (Arts. 406-407 LC 214/2025)
  vendaImobilizadoMensal?: number     // receita mensal prevista com venda de bens do ativo imobilizado
  // Art. 108 LC 214/2025 — crédito integral e imediato na aquisição de bens de capital
  // IMPORTANTE: não incluir estes valores em insumosMensais (seria dupla contagem)
  investimentoCapitalMensal?: number  // compras mensais de máquinas, equipamentos e instalações para o ativo imobilizado
  // Art. 110 LC 214/2025 — alíquota zero na venda de maquinário agrícola para produtor rural não-contribuinte
  // e veículos de carga para transportador autônomo PF não-contribuinte
  pctVendasAliqZeroRural?: number     // % do faturamento em vendas de maquinário agrícola para produtor rural não-contribuinte
  pctVendasAliqZeroTransp?: number    // % do faturamento em vendas de veículos de carga para transportador autônomo PF
  // Despesas operacionais que hoje não geram crédito de PIS/COFINS mas gerarão crédito de IBS/CBS
  // (não-cumulatividade ampla: aluguel, energia, seguros, marketing, serviços administrativos, TI, etc.)
  despesasCrediteisAdicionais?: number  // R$/mês em despesas que migram de sem-crédito para com-crédito
  // Regime Automotivo — crédito presumido CBS (Arts. 309-316 LC 214/2025)
  regimeAutomotivoHabilitado?: boolean  // projeto habilitado à fruição (Lei 9.440/1997) — só montadoras com ato concessório
  faseRegimeAutomotivo?: 1 | 2 | 3      // fase de fruição: 1=até 12º mês (11,6%), 2=13º-48º (10%), 3=49º-60º (8,7%)
  // Zona Franca de Manaus — indústria incentivada (Arts. 439-457 LC 214/2025)
  tipoBemZFM?: TipoBemZFM                // tipo de bem produzido — define o % do crédito presumido de IBS (Art. 450 §1º)
  // Farmácias/drogarias — cesta mista (Art. 133 LC 214/2025)
  pctMedicamentos?: number              // % do faturamento em medicamentos (60% de redução); o restante fica na alíquota cheia
  // Supermercados — composição da cesta (Arts. 125/148 + Art. 128 LC 214/2025)
  pctCestaZero?: number                 // % da receita em itens de alíquota zero (cesta básica, hortifruti, frutas, ovos)
  pctCestaReduzida?: number             // % da receita em itens de redução 60% (demais alimentos Anexo VII, higiene/limpeza Anexo VIII)
  // Lucro Real — apuração efetiva de IRPJ/CSLL
  folhaPagamentoLRMensal?: number       // folha total (salários + encargos) — dedutível da base IRPJ/CSLL
  aliquotaICMSEfetiva?: number          // alíquota efetiva líquida de créditos (ex: 0.08 para 8%)
  aliquotaISSEfetiva?: number           // alíquota efetiva do ISSQN (ex: 0.03 para 3%)
  despesasOperacionaisMensais?: number  // aluguel, energia, marketing, adm, depreciação etc. — dedutíveis da base IRPJ/CSLL
}

// ─── Pró-labore — LP e Lucro Real ────────────────────────────────────────────
export interface SocioAdministrador {
  id: string
  nome: string
  prolaboreMensal: number
}

export interface DetalheSocio {
  socio: SocioAdministrador
  irpfMensal: number
  inssEmpregado: number   // 20% × min(prolabore, teto) — contribuinte individual
  inssPatronal: number    // 20% × prolabore — custo da empresa
  custoTotal: number      // irpf + inssEmpregado + inssPatronal
}

export interface AnaliseProlabore {
  socios: SocioAdministrador[]
  detalhes: DetalheSocio[]
  totalProlabore: number
  totalIrpf: number
  totalInssEmpregado: number
  totalInssPatronal: number
  beneficioFiscalEmpresa: number  // 0 para LP; totalProlabore × 24% para LR
  custoTotalBruto: number
  custoLiquido: number
  regime: 'lucro_presumido' | 'lucro_real'
}

// ─── Fator R — Simples Nacional (serviços) ────────────────────────────────────
export interface AnaliseFatorR {
  aplicavel: boolean
  folhaMensal: number
  faturamentoMensal: number
  fatorR: number
  anexo: 'III' | 'V'
  aliquotaAnexoIII: number
  aliquotaAnexoV: number
  diferencaMensal: number       // imposto Anexo V − Anexo III (positivo = III vantajoso)
  folhaMinimaPara28pct: number  // pró-labore mínimo para cruzar o limiar
  jaEstaNoIII: boolean
}

// ─── Resultado das projeções ─────────────────────────────────────────────────
export interface ProjecaoAno {
  ano: number
  impostoMensal: number
  impostoAnual: number
  parcelaAtual: number
  parcelaAtualAnual: number
  parcelaNovaAnual: number
  aliquotaEfetiva: number
}

export interface AnaliseSimplesHibrido {
  vale: boolean
  ivaHibridoLiquido: number
  custoAdicionalMensal: number
  creditoDisponibilizadoAoCliente: number
  aliquotaIVABruta: number
}

export interface AlertaMEI {
  acimaDaFaixa: boolean
  faturamentoAnualProjetado: number
  dasFixoMensal: number
  limiteAnual: number
  limitePercentual: number
}

export interface ProjecaoMes {
  label: string
  faturamento: number
  insumos: number
  impostosReais: number
  exportacoes: number
  ivaDebito: number
  ivaCredito: number
  ivaLiquido: number
  aliquotaEfetivaReal: number | null
  aliquotaIVAEfetiva: number
}

// ─── Resultado completo do cálculo ───────────────────────────────────────────
export interface ResultadoCalculo {
  regime: TipoRegime
  setor: Setor
  faturamentoMensal: number
  faturamentoAnual: number
  insumosMensais: number
  exportacoesMensais: number
  perfilClientes: PerfilClientes
  dadosMensais: DadosMes[] | null

  // Ecos dos dados de entrada — usados pelo comparador de regimes para recalcular LP/LR
  // com o conjunto completo de tributos (folha, ICMS/ISS, despesas, pró-labore)
  folhaPagamentoLRMensal?: number
  folhaMensal?: number                  // folha do Fator R (Simples) — fallback de folha p/ LP/LR no comparador
  aliquotaICMSEfetiva?: number
  aliquotaISSEfetiva?: number
  despesasOperacionaisMensais?: number
  sociosAdministradores?: SocioAdministrador[]

  aliquotaAtual: number
  aliquotaAtualEstimada: number
  fonteAliquota: FonteAliquota
  impostoAtualMensal: number
  impostoAtualAnual: number
  irpjAdicionalMensal: number
  inssAutonomoMensal: number
  anexoSimples: AnexoSimples | undefined
  anexoSimples2: AnexoSimples | undefined
  pctAnexo1: number | undefined
  cbsSimplesEfetivo: number | null
  ibsSimplesEfetivo: number | null  // IBS (ICMS/ISS) como alíquota embutida no DAS (LC 123 partilha)
  cenarioHibridoVerdadeiro: {       // Simples fica só IRPJ+CSLL+CPP; CBS/IBS pagos ao IVA pleno
    aliquotaDasReduzido: number
    dasReduzidoMensal: number
    ibsCBSBrutoMensal: number
    creditoMensal: number
    ibsCBSLiquidoMensal: number
    totalMensal: number
    aliquotaEfetiva: number
    custoAdicionalVsSimples: number
  } | null
  baseCalculoEfetiva: number       // base de cálculo real após redutores (imóveis/agências/etc.)
  pctFornecedoresSimples: number
  creditoPerdidoFornecedorSimples: number
  analiseProlabore: AnaliseProlabore | null

  aliquotaIVABruta: number
  aliquotaIVAEfetiva: number
  impostoIVABrutoMensal: number
  creditoInsumosMensal: number
  impostoIVALiquidoMensal: number
  impostoIVALiquidoAnual: number

  variacaoAbsolutaMensal: number
  variacaoPercentual: number
  reajustePrecoNecessario: number

  projecaoAnos: ProjecaoAno[]
  analiseSimplesHibrido: AnaliseSimplesHibrido | null
  alertaMEI: AlertaMEI | null
  projecaoMesAMes: ProjecaoMes[] | null
  analiseGrupoSimples: AnaliseGrupoSimples | null
  analiseHolding: AnaliseHolding | null
  analiseFatorR: AnaliseFatorR | null
  nomePrincipal: string
  analiseICMS: AnaliseICMS | null
  // Gorjeta (Art. 274 LC 214/2025)
  gorjetaMensal: number             // R$ excluídos da base (faturamento × pctGorjeta)
  // Crédito presumido (Arts. 168-169 LC 214/2025)
  creditoProdutorRural: number      // crédito presumido mensal — compras de produtor rural não-contribuinte
  creditoTranspAutonomo: number     // crédito presumido mensal — frete de transportador autônomo PF
  // Imposto Seletivo (Anexo XVII + Arts. 419-423 LC 214/2025)
  alertaImpostoSeletivo: boolean    // true quando setor é sujeito ao IS (alíquota ainda a ser definida por lei ordinária)
  // Produtor rural regime especial (Arts. 164-168 LC 214/2025)
  produtorRuralNaoContribuinte: boolean  // true = não contribuinte (faturamento < R$3,6M ou regime produtor_rural)
  // Bens de capital usados (Arts. 406-407 LC 214/2025)
  ivaVendaImobilizado: number       // IBS/CBS estimado na venda de bens do ativo imobilizado (alíquota cheia — sem redução no período de transição)
  // Art. 108 — crédito integral e imediato de bens de capital
  creditoCapitalImediato: number    // crédito IBS/CBS na compra de capital = investimento × alíquota efetiva
  creditoCapitalPISCOFINS: number   // comparação: crédito que seria gerado no mês pelo PIS/COFINS (1/48 × 9,25%)
  ganhoFluxoCaixaCapital: number    // creditoCapitalImediato − creditoCapitalPISCOFINS (benefício mensal)
  // Art. 110 — alíquota zero vendas a não-contribuintes
  ivaZeradoVendasRural: number      // IBS/CBS que NÃO será cobrado nas vendas para produtor rural não-contribuinte
  ivaZeradoVendasTransp: number     // IBS/CBS que NÃO será cobrado nas vendas para transportador autônomo PF
  // Não-cumulatividade ampla — despesas adicionais que passam a gerar crédito
  creditoDespesasAdicionais: number // crédito mensal de IBS/CBS sobre despesas que hoje não geram crédito de PIS/COFINS
  // Comparativo PIS/COFINS (dentro do DAS) vs CBS (IVA Dual) — apenas Simples Nacional
  pisCofinsNoDAsMensal: number   // PIS/COFINS embutido no DAS atual (cbsSimplesEfetivo × faturamento)
  cbsIVADualMensal: number       // CBS estimada no IVA Dual (proporção CBS dentro do IVA líquido)
  // IRPJ + CSLL (Lucro Presumido referência) — para Simples Nacional comparar carga total no IVA Dual
  irpjCsllLPMensal: number       // IRPJ + CSLL + adicional que a empresa pagaria se migrasse para LP
  // Alertas informativos
  alertaExportadorHabilitavel: boolean  // true quando exportações > 50% da receita (Art. 82 LC 214/2025)
  alertaContratoAdministrativo: boolean // true quando há vendas ao governo (direito de reequilíbrio Arts. 373-377)
  // Cashback ao consumidor (Art. 118 LC 214/2025)
  alertaCashback: boolean               // true quando o setor tem devolução elevada a consumidores de baixa renda (energia, água, esgoto, gás, telecom)
  // Regime Automotivo — crédito presumido CBS (Arts. 309-316 LC 214/2025)
  creditoRegimeAutomotivo: number       // crédito presumido CBS mensal (% da fase × vendas no mercado interno)
  // Zona Franca de Manaus — créditos presumidos (Art. 450 LC 214/2025)
  creditoZFMIbs: number                 // crédito presumido IBS (% por tipo de bem × IBS devido estimado)
  creditoZFMCbs: number                 // crédito presumido CBS (2% × valor da operação — Art. 450 §2º II)
  // INSS patronal sobre folha (LP e LR) — 20% × folha, custo que não existe no Simples (CPP embutido no DAS)
  inssPatronalFolhaMensal: number
  // IRPJ + CSLL que persistem após a reforma (não são substituídos por CBS/IBS) — LP e LR
  irpjCsllPersistenteMensal: number
  // Carga tributária total pós-reforma: CBS/IBS líquido + IRPJ/CSLL persistente + INSS patronal
  // (substitui impostoIVALiquidoMensal como "carga real" para LP/LR, que não some, só substitui ICMS/ISS/PIS-COFINS)
  cargaTotalReformaMensal: number
  // Contribuição previdenciária patronal (LP e LR) — detalhamento
  terceirosFolhaMensal: number   // terceiros (Sistema S) sobre folha de empregados, conforme atividade
  cppProLaboreMensal: number     // 20% × pró-labore dos sócios (sem terceiros)
  contribPrevidenciariaMensal: number  // CPP folha + terceiros + CPP pró-labore
  // ICMS/ISS apurados na carga atual (LP/LR) — alíquotas informadas ou médias
  icmsAtualMensal: number
  issAtualMensal: number
  // Lucro Presumido — detalhamento da carga atual por tributo
  apuracaoLucroPresumido: {
    lucroPresumidoBase: number   // faturamento × presunção IRPJ
    irpj: number                 // 15% × lucro presumido
    irpjAdicional: number        // 10% sobre o que exceder R$ 20 mil/mês
    csll: number                 // 9% × (faturamento × presunção CSLL)
    pisCofins: number            // cumulativo 3,65%
    icms: number                 // alíquota informada no formulário ou média 12%
    iss: number                  // alíquota informada no formulário ou média 3%
    ipi: number                  // 5% médio (indústria, apenas quando não informado)
    inssPatronal: number         // 20% × folha de empregados (CPP)
    terceiros: number            // terceiros (Sistema S) × folha de empregados
    cppProLabore: number         // 20% × pró-labore dos sócios
    icmsIssInformado: boolean    // true = usa alíquotas do formulário; false = médias
    totalImpostos: number
  } | null
  // Lucro Real — detalhamento efetivo quando dados reais são fornecidos
  apuracaoLucroReal: {
    pisCofinsLiquido: number
    icmsLiquido: number
    issLiquido: number
    inssPatronal: number         // 20% × folha de empregados (CPP)
    terceiros: number            // terceiros (Sistema S) × folha de empregados
    cppProLabore: number         // 20% × pró-labore dos sócios
    proLabore: number            // total de pró-labore dos sócios
    folhaPagamento: number
    despesasOperacionais: number
    lucroRealBase: number
    irpj: number
    irpjAdicional: number
    csll: number
    totalImpostos: number
  } | null
}

// ─── Resultado com dados comparativos ────────────────────────────────────────
export interface ResultadoComparativo extends ResultadoCalculo {
  melhorAtual: boolean
  melhorIVA: boolean
  menorImpacto: boolean
  inaplicavel: boolean
  acimaDaFaixaSimples: boolean
  acimaDaFaixaMEI: boolean
}

// ─── Ponto na curva de crescimento ───────────────────────────────────────────
export interface PontoCrescimento {
  pct: number
  faturamentoMensal: number
  faturamentoAnual: number
  impostoAtualMensal: number
  impostoIVAMensal: number
  aliquotaAtual: number
  aliquotaIVA: number
  acimaDaFaixaSimples: boolean
}

// ─── ICMS por UF ──────────────────────────────────────────────────────────────

export interface AnaliseICMS {
  uf: string
  aliquotaInterna: number       // alíquota geral do estado
  icmsDebito: number            // faturamento × alíquota
  icmsCredito: number           // insumos × alíquota (crédito nas entradas)
  icmsLiquido: number           // débito − crédito
  aliquotaEfetivaICMS: number   // icmsLiquido / faturamento
  aplicavel: boolean            // false para PF/MEI/Simples (ICMS embutido)
  nota: string                  // observações específicas do estado ou regime
}

// ─── Holding Patrimonial (LC 214/2025 Art. 261 + LC 227/2026 Art. 5º) ────────

export type DestinatarioAluguel =
  | 'empresa_grupo'       // empresa operacional do mesmo grupo
  | 'terceiro_pj'         // terceiro pessoa jurídica
  | 'terceiro_pf'         // terceiro pessoa física
  | 'uso_gratuito_socio'  // imóvel cedido gratuitamente ao sócio/familiar

export type RegimeHolding = 'lucro_presumido' | 'lucro_real'

export interface ImovelHolding {
  id: string
  nome: string
  receitaMensalAluguel: number
  destinatario: DestinatarioAluguel
  creditosIBSCBSNaAquisicao: boolean  // LC 227/2026: sem crédito → uso gratuito não é tributado
  residencial?: boolean               // Art. 260 LC 214/2025: locação residencial deduz redutor social de R$ 600/mês da base
}

export interface AnaliseHolding {
  ativo: boolean
  regime: RegimeHolding
  imoveis: ImovelHolding[]
  // Receitas por tipo
  receitaOnerosaTotal: number          // aluguéis onerosos
  receitaGratuitaTributada: number     // uso gratuito COM créditos (base = valor de mercado)
  receitaGratuitaNaoTributada: number  // uso gratuito SEM créditos — não incide IBS/CBS (LC 227/2026)
  receitaTotalMensal: number           // receita tributável (onerosa + gratuita com crédito)
  // Redutor social da locação residencial (Art. 260 LC 214/2025): R$ 600/mês por imóvel residencial
  redutorSocialMensal: number          // total deduzido da base de IBS/CBS
  baseIBSCBSMensal: number             // receitaTotalMensal − redutorSocialMensal
  // IBS/CBS — redução 70% (Art. 261 §único LC 214/2025)
  aliquotaIBSCBS: number               // 26,5% × 30% = 7,95% exato
  ibsCBSMensal: number
  // IRPJ/CSLL/PIS/COFINS (LP ou LR)
  aliquotaTributosCorrentes: number
  tributosCorrMensal: number
  // Carga total na holding
  cargaTotalMensal: number
  cargaTotalPercentual: number
  // Comparação com tributação PF (IRPF carnê-leão)
  cargaPFMensal: number
  cargaPFPercentual: number
  pfEhContribuinteImovel: boolean      // Art. 251 §1º I: PF > 3 imóveis E > R$ 240k/ano → também paga IBS/CBS
  pfIbsCBSMensal: number               // IBS/CBS da PF quando contribuinte (0 quando abaixo do limiar)
  vantagemHolding: boolean
  economiaMensalHolding: number        // positivo = holding vantajosa
  // Alertas LC 227/2026
  imoveisGratuitosSemCredito: ImovelHolding[]
  imoveisGratuitosComCredito: ImovelHolding[]
}

// ─── Grupo societário (Simples Nacional — LC 123/2006 Art. 3º §4º) ───────────

export interface EmpresaGrupo {
  id: string
  nome: string
  faturamentoMensal: number
  participacao: number   // 0–100 (%)
  administrador?: boolean  // LC 123/2006 Art. 3º §4º V: sócio administrador de outra PJ — soma a receita global independente do %
}

export interface AnaliseGrupoSimples {
  ativo: boolean
  empresasGrupo: EmpresaGrupo[]
  faturamentoAnualPrincipal: number
  faturamentoAnualGrupo: number     // soma das que têm participação > 10%
  faturamentoAnualTotal: number     // principal + grupo
  dentroDoLimite: boolean
  limiteAnual: number               // 4_800_000
  percentualUtilizado: number       // 0–100+
  empresasQueContam: EmpresaGrupo[] // participação > 10%
  empresasQueNaoContam: EmpresaGrupo[]
}

// ─── Agregado dos 12 meses (DadosMensais → FormularioEntrada) ────────────────
export interface AggregateMes extends DadosMes {
  // DadosMes já tem todos os campos necessários
}

export interface AggregateMeses {
  meses: AggregateMes[]
  totais: { faturamento: number; insumos: number; impostos: number; exportacoes: number; folha: number }
  medias: { faturamento: number; insumos: number; impostos: number; exportacoes: number; folha: number }
  aliquotaRealApurada: number | null
  temImpostos: boolean
  temExportacoes: boolean
  temFolha: boolean
}
