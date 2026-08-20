/**
 * Lista de setores mapeados conforme a Reforma Tributária (LC 214/2025).
 *
 * reducao: percentual de redução aplicado sobre a alíquota padrão de 26,5%
 *   1.00 = isenção total  (alíquota efetiva: 0%)
 *   0.70 = redução de 70% (alíquota efetiva: 26,5% × 30% ≈ 7,9%)
 *   0.60 = redução de 60% (alíquota efetiva: 26,5% × 40% ≈ 10,6%)
 *   0.50 = redução de 50% (alíquota efetiva: 26,5% × 50% ≈ 13,3%)
 *   0.40 = redução de 40% (alíquota efetiva: 26,5% × 60% ≈ 15,9%)
 *   0.30 = redução de 30% (alíquota efetiva: 26,5% × 70% ≈ 18,6%)
 *   0.00 = alíquota cheia (26,5%)
 *
 * tipo: 'comercio' | 'industria' | 'servico' | 'misto'
 *   Usado para calcular a carga atual via Simples Nacional / Lucro Presumido / Lucro Real.
 */

import type { Setor } from '../types'

export const SETORES: Setor[] = [
  // ─── ISENÇÃO TOTAL ────────────────────────────────────────────────────────
  {
    value: 'cesta_basica_alimentos',
    label: 'Cesta Básica — Alimentos Essenciais',
    grupo: 'Isenção Total — Alíquota 0%',
    reducao: 1.00,
    tipo: 'comercio',
  },
  {
    value: 'medicamentos_basicos',
    label: 'Medicamentos de Alíquota Zero (doenças graves / Farmácia Popular)',
    grupo: 'Isenção Total — Alíquota 0%',
    reducao: 1.00,  // Art. 146 LC 214/2025 (red. LC 227/2026): zero p/ medicamentos de doenças raras, negligenciadas, oncologia, diabetes, HIV/IST, cardiovasculares, Farmácia Popular e soros/vacinas
    tipo: 'comercio',
  },
  {
    value: 'hortifruti_ovos',
    label: 'Hortifruti — Verduras, Frutas e Ovos',
    grupo: 'Isenção Total — Alíquota 0%',
    reducao: 1.00,  // Art. 148 LC 214/2025 (Anexo XV): produtos hortícolas, frutas e ovos têm alíquota ZERO (distinto do in natura amplo do Art. 137, que é 60%)
    tipo: 'comercio',
  },
  {
    value: 'educacao_infantil',
    label: 'Educação Infantil, Fundamental e Médio',
    grupo: 'Redução 60%',
    reducao: 0.60,  // Art. 129 + Anexo II LC 214/2025 — todos os níveis de educação: 60%
    tipo: 'servico',
  },
  {
    value: 'dispositivos_deficiencia',
    label: 'Dispositivos de Acessibilidade para Pessoas com Deficiência',
    grupo: 'Redução 60%',
    reducao: 0.60,  // Art. 132 LC 214/2025 — "reduzidas em 60%", não isentos
    tipo: 'comercio',
  },
  {
    value: 'transporte_metro_vlt',
    label: 'Metrô, VLT, Trem e Barcas (Transporte Urbano)',
    grupo: 'Isenção Total — Alíquota 0%',
    reducao: 1.00,  // Art. 285 LC 214/2025 — ferroviário/hidroviário urbano: 100% redução
    tipo: 'servico',
  },
  {
    value: 'transporte_rodoviario_intermunicipal',
    label: 'Ônibus Intermunicipal e Interestadual',
    grupo: 'Redução 40% — Transporte',
    reducao: 0.40,  // Art. 286 LC 214/2025 — rodoviário intermunicipais/interestaduais: 40%
    tipo: 'servico',
  },

  // ─── REDUÇÃO 70% — Locação e Arrendamento de Imóveis ─────────────────────
  {
    value: 'locacao_imoveis',
    label: 'Locação, Arrendamento e Cessão de Imóveis',
    grupo: 'Redução 70% — Locação de Imóveis',
    reducao: 0.70,
    tipo: 'servico',
  },

  // ─── REDUÇÃO 60% ──────────────────────────────────────────────────────────
  {
    value: 'agropecuario_in_natura',
    label: 'Produtos Agropecuários, Pesqueiros e Florestais In Natura',
    grupo: 'Redução 60%',
    reducao: 0.60,  // Art. 203 VIII + Art. 213 Dec. 12.955/2026 — produtos in natura (frutas, verduras, carnes, pescados, etc.)
    tipo: 'comercio',
  },
  {
    value: 'higiene_baixa_renda',
    label: 'Higiene Pessoal e Limpeza — Cesta Popular (Anexo XVI LC 214/2025)',
    grupo: 'Redução 60%',
    reducao: 0.60,  // Art. 203 VII + Art. 212 Dec. 12.955/2026 — lista NCM: sabonetes, absorventes, fraldas, etc.
    tipo: 'comercio',
  },
  {
    value: 'hospitais_clinicas',
    label: 'Hospitais, Clínicas e Laboratórios',
    grupo: 'Redução 60%',
    reducao: 0.60,
    tipo: 'servico',
    presuncaoLPIRPJ: 0.08,  // Lei 9.249/95 Art. 15 I d: "serviços hospitalares" → presunção 8% (não 32%)
    presuncaoLPCSLL: 0.12,  // CSLL: presunção 12% para serviços hospitalares
  },
  {
    value: 'planos_saude',
    label: 'Planos de Assistência à Saúde (Operadoras)',
    grupo: 'Regime Específico — Planos de Saúde',
    reducao: 0.60,  // Regime específico Cap. III Título VI Dec. 12.955: base = prêmios − sinistros − comissões; alíquota em Livro II (não publicada). Usando 60% como aproximação do regime diferenciado saúde (Art. 203 II).
    tipo: 'servico',
    creditoVedadoComprador: true,  // Art. 337 Dec. 12.955: adquirente NÃO pode creditar CBS (exceto empresa p/ empregados, proporcional)
  },
  {
    value: 'educacao_superior',
    label: 'Educação Superior, Técnica e Profissional',
    grupo: 'Redução 60%',
    reducao: 0.60,
    tipo: 'servico',
  },
  {
    value: 'cursos_livres',
    label: 'Cursos Livres e EAD (acreditados)',
    grupo: 'Redução 60%',
    reducao: 0.60,
    tipo: 'servico',
  },
  {
    value: 'produtor_rural_pf',
    label: 'Produtor Rural (Pessoa Física / Não-Contribuinte)',
    grupo: 'Redução 60% — Produtor Rural',
    reducao: 0.60,    // Art. 164 §2º LC 214/2025: contribuinte opcional quando acima de R$3,6M/ano; abaixo = não-contribuinte (IBS/CBS = 0)
    tipo: 'misto',
    produtorRural: true,  // Arts. 164-168 LC 214/2025: tratamento especial de não-contribuinte
  },
  {
    value: 'produtor_rural_pj',
    label: 'Produtor Rural (Pessoa Jurídica / Agroindústria Familiar)',
    grupo: 'Redução 60% — Produtor Rural',
    reducao: 0.60,    // Art. 164 §3º LC 214/2025: PJ de produtor rural integrado — mesma redução 60%
    tipo: 'misto',
    produtorRural: true,
  },
  {
    value: 'saneamento_basico',
    label: 'Saneamento Básico e Fornecimento de Água',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,  // LC 214/2025 — sem redução de alíquota; proteção via cashback CadÚnico (Art. 118)
    tipo: 'servico',
    cashbackConsumidor: true,  // Art. 118 I: água e esgoto têm devolução 20% IBS + 20% CBS a famílias de baixa renda
  },
  {
    value: 'atividades_artisticas',
    label: 'Atividades Artísticas, Culturais e Criativas',
    grupo: 'Redução 60%',
    reducao: 0.60,
    tipo: 'servico',
  },
  {
    value: 'jornalismo_midia',
    label: 'Jornalismo, Mídia Impressa e Comunicação Institucional',
    grupo: 'Redução 60%',
    reducao: 0.60,  // Art. 203 X/XI — produções jornalísticas e comunicação institucional: 60%
    tipo: 'servico',
  },
  {
    value: 'radiodifusao_aberta',
    label: 'Radiodifusão Sonora e TV Aberta (recepção gratuita)',
    grupo: 'Isenção Total — Alíquota 0%',
    reducao: 1.00,  // Art. 10 VI Dec. 12.955: IMUNE — radiodifusão nas modalidades de recepção livre e gratuita
    tipo: 'servico',
  },
  {
    value: 'livros_periodicos',
    label: 'Livros, Jornais e Periódicos (papel de impressão incluso)',
    grupo: 'Isenção Total — Alíquota 0%',
    reducao: 1.00,  // Art. 10 IV Dec. 12.955: IMUNE — livros, jornais, periódicos e papel destinado à impressão
    tipo: 'comercio',
  },
  {
    value: 'dispositivos_medicos',
    label: 'Dispositivos Médicos e Equipamentos Hospitalares',
    grupo: 'Redução 60%',
    reducao: 0.60,
    tipo: 'comercio',
  },
  {
    value: 'insumos_agropecuarios',
    label: 'Insumos Agropecuários (Fertilizantes, Sementes)',
    grupo: 'Redução 60%',
    reducao: 0.60,
    tipo: 'comercio',
  },
  {
    value: 'energia_residencial',
    label: 'Distribuição de Energia Elétrica',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,  // LC 214/2025 — sem redução; IS não incide (Art. 413 II); cashback CadÚnico (Art. 118)
    tipo: 'servico',
    cashbackConsumidor: true,  // Art. 118 I: energia elétrica domiciliar tem devolução 100% CBS + 20% IBS a famílias de baixa renda
  },

  // ─── REDUÇÃO 50% — Construção e Incorporação Imobiliária ─────────────────
  {
    value: 'construcao_civil',
    label: 'Construção Civil e Incorporação Imobiliária',
    grupo: 'Redução 50% — Construção e Imóveis',
    reducao: 0.50,
    tipo: 'servico',
    presuncaoLPIRPJ: 0.08,
    presuncaoLPCSLL: 0.12,
    regimeImobiliario: true,  // Arts. 369-376 Dec. 12.955: CBS sobre base reduzida (custo + redutor social)
  },

  // ─── REDUÇÃO 40% — Hospitalidade e Alimentação ───────────────────────────
  {
    value: 'hoteis_pousadas',
    label: 'Hotéis, Pousadas, Flats e Temporada (Airbnb)',
    grupo: 'Redução 40% — Hospitalidade',
    reducao: 0.40,
    tipo: 'servico',
    creditoVedadoComprador: true,  // Art. 407 Dec. 12.955: adquirente B2B não pode creditar CBS
  },
  {
    value: 'restaurantes_bares',
    label: 'Restaurantes, Bares e Lanchonetes',
    grupo: 'Redução 40% — Hospitalidade',
    reducao: 0.40,
    tipo: 'servico',
    creditoVedadoComprador: true,  // Art. 401 Dec. 12.955: adquirente B2B não pode creditar CBS
  },
  {
    value: 'parques_eventos',
    label: 'Parques de Diversão, Temáticos e Eventos',
    grupo: 'Redução 40% — Hospitalidade',
    reducao: 0.40,
    tipo: 'servico',
    creditoVedadoComprador: true,  // Art. 407 Dec. 12.955: adquirente B2B não pode creditar CBS
  },

  // ─── REDUÇÃO 30% — Profissões Regulamentadas ─────────────────────────────
  {
    value: 'advocacia',
    label: 'Advocacia e Serviços Jurídicos',
    grupo: 'Redução 30% — Profissões Regulamentadas',
    reducao: 0.30,
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'contabilidade_auditoria',
    label: 'Contabilidade, Auditoria e Perícia Contábil',
    grupo: 'Redução 30% — Profissões Regulamentadas',
    reducao: 0.30,
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'engenharia_arquitetura',
    label: 'Engenharia, Arquitetura e Urbanismo',
    grupo: 'Redução 30% — Profissões Regulamentadas',
    reducao: 0.30,
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'medicina_consultorio',
    label: 'Medicina (Consultório Particular)',
    grupo: 'Redução 60%',
    reducao: 0.60,
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'sociedade_medica',
    label: 'Sociedade Médica (S/S e Clínica Ambulatorial)',
    grupo: 'Redução 60%',
    reducao: 0.60,
    tipo: 'servico',
    fatorR: true,
    presuncaoLPIRPJ: 0.32,  // S/S médica não é "serviço hospitalar" → presunção 32% (RFB/STJ)
    presuncaoLPCSLL: 0.32,
  },
  {
    value: 'odontologia',
    label: 'Odontologia e Prótese Dentária',
    grupo: 'Redução 60%',
    reducao: 0.60,
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'psicologia_fonoaudiologia',
    label: 'Psicologia, Fonoaudiologia e Terapia Ocupacional',
    grupo: 'Redução 60%',
    reducao: 0.60,
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'medicina_veterinaria',
    label: 'Medicina Veterinária',
    grupo: 'Redução 30% — Profissões Regulamentadas',
    reducao: 0.30,
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'fisioterapia',
    label: 'Fisioterapia e Reabilitação',
    grupo: 'Redução 60%',
    reducao: 0.60,
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'nutricionista',
    label: 'Nutrição e Dietética',
    grupo: 'Redução 60%',
    reducao: 0.60,
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'agencias_viagem',
    label: 'Agências de Viagem e Turismo',
    grupo: 'Redução 40% — Hospitalidade',
    reducao: 0.40,  // Art. 289 II LC 214/2025: alíquota = mesma da hotelaria (redução 40%) — Art. 281. Base = valor − repasses a fornecedores (Art. 289 I + Art. 418 Dec. 12.955)
    tipo: 'servico',
    baseReduzidaRepasse: true,
  },
  {
    value: 'aviacao_civil',
    label: 'Aviação Civil Regional — Transporte de Passageiros',
    grupo: 'Redução 40% — Transporte',
    reducao: 0.40,  // Art. 287 LC 214/2025 — transporte aéreo regional: 40% redução
    tipo: 'servico',
  },
  {
    value: 'agroindustria_cooperativas',
    label: 'Agroindústria e Cooperativas Agropecuárias',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,  // Art. 127 reduz 30% apenas para profissionais pessoa física com conselho (ex: técnicos agrícolas individualmente); cooperativas como entidade não têm redução própria na LC 214/2025
    tipo: 'misto',
  },

  // ─── REGIMES MUITO ESPECÍFICOS ────────────────────────────────────────
  {
    value: 'saf_futebol',
    label: 'Sociedade Anônima do Futebol — SAF (Regime TEF)',
    grupo: 'Regime Específico — SAF',
    reducao: 0.962,  // Arts. 424 Dec. 12.955: CBS = 1% sobre receita total → reducao = 1 − (1/26,5) ≈ 0,9623
    tipo: 'servico',
  },
  {
    value: 'programas_fidelidade',
    label: 'Programas de Fidelidade / Pontos (emissores)',
    grupo: 'Regime Específico — Fidelidade',
    reducao: 0.00,  // Art. 315 Dec. 12.955: base = pontos emitidos − resgates; alíquota cheia sobre essa base. Sistema usa receita bruta como proxy — usuário deve informar margem real.
    tipo: 'servico',
    baseReduzidaRepasse: true,  // Base = pontos emitidos - resgates ≈ margem. Usar campo de repasse para informar % de resgates.
  },

  // ─── REGIME DIFERENCIADO — BASE REDUZIDA À MARGEM ────────────────────────
  {
    value: 'bens_usados_revenda',
    label: 'Revenda de Bens Usados adquiridos de Pessoa Física',
    grupo: 'Regime Diferenciado — Base Reduzida à Margem',
    reducao: 0.70,  // CBS incide sobre a margem (preço_venda − preço_compra_PF). Assumindo margem típica 30%: alíquota efetiva ≈ 26,5% × 30% = 7,95% sobre receita → reducao ≈ 0,70. Cap. X Dec. 12.955/2026.
    tipo: 'comercio',
    baseReduzidaMargem: true,
  },

  // ─── ALÍQUOTA CHEIA (26,5%) ───────────────────────────────────────────────
  {
    value: 'comercio_varejo',
    label: 'Comércio Varejista em Geral',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'comercio',
  },
  {
    value: 'comercio_atacado',
    label: 'Comércio Atacadista',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'comercio',
  },
  {
    value: 'supermercados',
    label: 'Supermercados e Mercearias',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,  // base: itens sem redução (bebidas, limpeza, utilidades); informe a composição da cesta para a alíquota efetiva
    tipo: 'comercio',
    cestaMista: true,  // Arts. 125/148 (zero) + Art. 128/Anexo VII-VIII (60%): cesta mista — composição informada pelo usuário
  },
  {
    value: 'e_commerce',
    label: 'E-commerce e Marketplace',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'comercio',
  },
  {
    value: 'material_construcao',
    label: 'Comércio Varejista Especializado em Material para Construção',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'comercio',
  },
  {
    value: 'concessionarias_veiculos',
    label: 'Concessionárias de Veículos (Revenda)',
    grupo: 'Alíquota Cheia (26,5%) + Imposto Seletivo',
    reducao: 0.00,
    tipo: 'comercio',
    impostSeletivo: true,  // Anexo XVII I LC 214/2025: veículos automotores sujeitos ao IS (pago pelo fabricante/importador — repercute no custo)
  },
  {
    value: 'fabricante_veiculos',
    label: 'Fabricante/Importador de Veículos Automotores',
    grupo: 'Alíquota Cheia (26,5%) + Imposto Seletivo',
    reducao: 0.00,
    tipo: 'industria',
    impostSeletivo: true,  // Anexo XVII I + Art. 424 LC 214/2025: contribuinte do IS — alíquota a ser fixada por lei ordinária
    regimeAutomotivo: true,  // Arts. 309-316 LC 214/2025: projetos habilitados (Lei 9.440/1997) têm crédito presumido CBS até 2032
  },
  {
    value: 'farmacias_drogarias',
    label: 'Farmácias e Drogarias',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,  // base: itens não-medicamento (perfumaria, cosméticos, conveniência) na alíquota cheia
    tipo: 'comercio',
    vendeMedicamentos: true,  // Art. 133 LC 214/2025: medicamentos têm 60% de redução — informe o % da receita em medicamentos para a alíquota efetiva
  },
  {
    value: 'postos_combustivel',
    label: 'Postos de Combustível (Varejista)',
    grupo: 'Regime Monofásico — CBS recolhida Upstream',
    reducao: 1.00,  // Combustíveis: regime monofásico (Art. 259 Dec. 12.955/2026) — CBS/IBS recolhida pelo produtor/distribuidor; o posto não cobra CBS/IBS na saída
    tipo: 'comercio',
    monofasico: true,
  },
  {
    value: 'industria_transformacao',
    label: 'Indústria de Transformação (Geral)',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'industria',
  },
  {
    value: 'industria_alimenticia',
    label: 'Indústria Alimentícia (produtos não isentos)',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'industria',
  },
  {
    value: 'industria_textil',
    label: 'Indústria Têxtil e Vestuário',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'industria',
  },
  {
    value: 'industria_metalurgica',
    label: 'Indústria Metalúrgica e Siderúrgica',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'industria',
  },
  {
    value: 'industria_moveis',
    label: 'Indústria de Móveis e Madeira',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'industria',
  },
  {
    value: 'industria_quimica',
    label: 'Indústria Química e Petroquímica',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'industria',
  },
  {
    value: 'grafica_editorial',
    label: 'Gráfica e Editorial (não isenta)',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'industria',
  },
  {
    value: 'tecnologia_ti',
    label: 'Tecnologia da Informação (Software / SaaS)',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'consultoria_empresarial',
    label: 'Consultoria Empresarial e Gestão',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'marketing_publicidade',
    label: 'Marketing, Publicidade e Design',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'logistica_transporte',
    label: 'Logística e Transporte de Cargas',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'servico',
    presuncaoLPIRPJ: 0.08,  // Art. 15 §1º II Lei 9.249/1995 — transporte de cargas: presunção 8% (não 32%)
    presuncaoLPCSLL: 0.12,  // CSLL: presunção 12% para transporte de cargas
    transporteAutonomo: true,  // Art. 169 LC 214/2025: setor costuma contratar transportadores autônomos PF (crédito presumido disponível)
  },
  {
    value: 'transportador_autonomo_pf',
    label: 'Transportador Autônomo de Cargas (Pessoa Física)',
    grupo: 'Regime Especial — Não-Contribuinte PF',
    reducao: 0.40,    // Art. 169 LC 214/2025: transportador autônomo PF é não-contribuinte; clientes têm direito a crédito presumido. Redução 40% para transporte rodoviário (Art. 286).
    tipo: 'servico',
    presuncaoLPIRPJ: 0.08,
    presuncaoLPCSLL: 0.12,
  },
  {
    value: 'imobiliario',
    label: 'Imobiliário — Corretagem e Administração de Imóveis',
    grupo: 'Redução 50% — Construção e Imóveis',
    reducao: 0.50,  // Art. 360 IV + Art. 379 Dec. 12.955: "serviços de administração e intermediação" estão no Cap. Bens Imóveis → redução 50%
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'academias_esporte',
    label: 'Academias e Esportes',
    grupo: 'Redução 60%',
    reducao: 0.60,  // Art. 141 I LC 214/2025: serviço de educação desportiva (NBS 1.2205.12.00) tem redução 60% — seção específica de atividades desportivas, prevalece sobre o Art. 127 X (30% dos profissionais de educação física)
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'beleza_estetica',
    label: 'Beleza, Estética e Bem-estar',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'servico',
  },
  {
    value: 'energia_renovavel',
    label: 'Energia Solar e Fontes Renováveis',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'servico',
  },
  {
    value: 'seguranca_privada',
    label: 'Segurança Privada e Vigilância',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'servico',
  },
  {
    value: 'limpeza_conservacao',
    label: 'Limpeza, Conservação e Facilities',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'servico',
  },
  {
    value: 'rh_recrutamento',
    label: 'Recursos Humanos e Recrutamento',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'servico',
    fatorR: true,
  },
  {
    value: 'petshop',
    label: 'Pet Shop e Produtos para Animais',
    grupo: 'Alíquota Cheia (26,5%)',
    reducao: 0.00,
    tipo: 'comercio',
  },
  {
    value: 'apostas_esportivas',
    label: 'Apostas Esportivas e Loterias (Bets)',
    grupo: 'Regime Específico — Concursos de Prognósticos',
    reducao: 0.00,  // Regime específico (Cap. IV Dec. 12.955/2026) — base de cálculo diferente (GGR: receita líquida após prêmios); alíquota cheia sobre base reduzida; mapeado como alíquota cheia sobre receita bruta como conservador
    tipo: 'servico',
  },

  // ─── IMPOSTO SELETIVO — Bens e Serviços Prejudiciais à Saúde/Meio Ambiente ────
  // Anexo XVII LC 214/2025 + Arts. 419-423 — alíquota a ser definida por lei ordinária (não publicada)
  {
    value: 'industria_tabaco',
    label: 'Indústria de Tabaco e Derivados (Cigarros)',
    grupo: 'Alíquota Cheia (26,5%) + Imposto Seletivo',
    reducao: 0.00,
    tipo: 'industria',
    impostSeletivo: true,  // Anexo XVII III LC 214/2025: tabaco e derivados — IS a ser fixado por lei ordinária
  },
  {
    value: 'bebidas_alcoolicas',
    label: 'Fabricação e Importação de Bebidas Alcoólicas',
    grupo: 'Alíquota Cheia (26,5%) + Imposto Seletivo',
    reducao: 0.00,
    tipo: 'industria',
    impostSeletivo: true,  // Anexo XVII II LC 214/2025: bebidas alcoólicas — IS a ser fixado por lei ordinária
  },
  {
    value: 'bebidas_acucaradas',
    label: 'Fabricação de Bebidas Açucaradas e Energéticos',
    grupo: 'Alíquota Cheia (26,5%) + Imposto Seletivo',
    reducao: 0.00,
    tipo: 'industria',
    impostSeletivo: true,  // Anexo XVII IV LC 214/2025: bebidas açucaradas com alto teor de açúcar
  },
  {
    value: 'mineracao_extrativismo',
    label: 'Mineração e Extrativismo Mineral',
    grupo: 'Alíquota Cheia (26,5%) + Imposto Seletivo',
    reducao: 0.00,
    tipo: 'industria',
    impostSeletivo: true,  // Anexo XVII V LC 214/2025: extração de recursos naturais não renováveis
  },

  // ─── ZONA FRANCA DE MANAUS — indústria incentivada ───────────────────────────
  {
    value: 'zfm_industria_incentivada',
    label: 'Indústria Incentivada — Zona Franca de Manaus (ZFM)',
    grupo: 'Regime Específico — Zona Franca de Manaus',
    reducao: 0.00,  // Art. 450 LC 214/2025: alíquota cheia, mas crédito presumido IBS (55-100% conforme tipo de bem) + CBS (2%) reduz drasticamente a carga
    tipo: 'industria',
    zfm: true,
  },

  // ─── COOPERATIVAS — alíquota zero nas operações com associados ───────────────
  {
    value: 'cooperativa',
    label: 'Sociedade Cooperativa (operações com associados)',
    grupo: 'Regime Específico — Cooperativas',
    reducao: 1.00,  // Art. 391 Dec. 12.955/2026: CBS = 0% nas operações cooperativa↔associado (nos dois sentidos)
    tipo: 'servico',
  },

  // Serviços financeiros: regime especial com alíquota fixada — Art. 233 LC 214/2025 (redação LC 227/2026)
  // IBS+CBS: 10,85% em 2027-2028 → 11,00% em 2029 → 11,15% em 2030 → crescente até 2033
  // Reducao ≈ 0.59 = aproximação para período 2027-2028 (10,85% ÷ 26,5% ≈ 41% → redução de ~59%)
  {
    value: 'servicos_financeiros',
    label: 'Serviços Financeiros (Bancos e Financeiras)',
    grupo: 'Regime Especial — Serviços Financeiros',
    reducao: 0.590566,  // Art. 233 LC 214/2025 (LC 227/2026): alíquota IBS+CBS = 10,85% em 2027-2028; reducao = 1 − (10,85 ÷ 26,5) = 0,590566...
    tipo: 'servico',
  },
  {
    value: 'seguros_resseguros',
    label: 'Seguros e Resseguros',
    grupo: 'Regime Especial — Serviços Financeiros',
    reducao: 0.590566,  // Art. 233 LC 214/2025 (LC 227/2026): seguros integram os serviços financeiros do Art. 189 — mesma alíquota especial de 10,85% em 2027-2028; reducao = 1 − (10,85 ÷ 26,5) = 0,590566...
    tipo: 'servico',
  },
]
