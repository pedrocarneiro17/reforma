---
name: reforma-tributaria
description: >
  Base de consulta da Reforma Tributária do consumo (IBS/CBS/IS).
  Contém a LC 214/2025 e o Decreto 12.955/2026 divididos por capítulo.
  Use sempre que precisar de regras de incidência, alíquotas, créditos,
  split payment, cashback, regimes específicos, Simples Nacional,
  cesta básica, Imposto Seletivo ou regras de transição 2026-2033.
---

# Skill: Reforma Tributária (IBS / CBS / IS)

## Como usar esta base

1. NUNCA leia uma norma inteira. Comece pelo índice da norma
   (`lcp214/00-indice.md` ou `decreto-12955/00-indice.md`).
2. Localize o capítulo pelo tema/keywords e abra SOMENTE aquele arquivo.
3. A LC 214 define as regras materiais; o Decreto 12.955 regulamenta a
   operacionalização. Para dúvida de cálculo/procedimento, confira os dois.
4. Cite sempre o artigo exato (ex.: 'Art. 9º, §1º, LC 214/2025') na resposta.
5. Anexos contêm listas de NCM/NBS (cesta básica, reduções) — são a fonte
   para classificar produtos no simulador.

## Mapa rápido de temas

### LC 214/2025 (IBS, CBS e Imposto Seletivo) — pasta `lcp214/`

- `001-preambulo-e-ementa.md` — Preambulo e ementa (—)
- `002-capitulo-i-disposicoes-preliminares-art1-a3.md` — CAPÍTULO I — DISPOSIÇŐES PRELIMINARES (Arts. 1 a 3)
- `003-capitulo-ii-do-ibs-e-da-cbs-sobre-operacoes-com-bens-e-servicos-art4-a57.md` — CAPÍTULO II — DO IBS E DA CBS SOBRE OPERAÇŐES com bens e serviços (Arts. 4 a 57)
- `004-capitulo-iii-da-operacionalizacao-do-ibs-e-da-cbs-art58-a62.md` — CAPÍTULO III — DA OPERACIONALIZAÇĂO DO IBS E DA CBS (Arts. 58 a 62)
- `005-capitulo-iv-do-ibs-e-da-cbs-sobre-importacoes-art63-a78.md` — CAPÍTULO IV — DO IBS E DA CBS SOBRE IMPORTAÇŐES (Arts. 63 a 78)
- `006-capitulo-v-do-ibs-e-da-cbs-sobre-exportacoes-art79-a83.md` — CAPÍTULO V — DO IBS E DA CBS SOBRE EXPORTAÇŐES (Arts. 79 a 83)
- `007-capitulo-i-dos-regimes-aduaneiros-especiais-art84-a98.md` — CAPÍTULO I — DOS REGIMES ADUANEIROS ESPECIAIS (Arts. 84 a 98)
- `008-capitulo-ii-das-zonas-de-processamento-de-exportacao-art99-a104.md` — CAPÍTULO II — DAS ZONAS DE PROCESSAMENTO DE EXPORTAÇĂO (Arts. 99 a 104)
- `009-capitulo-iii-dos-regimes-dos-bens-de-capital-art105-a111.md` — CAPÍTULO III — DOS REGIMES DOS BENS DE CAPITAL (Arts. 105 a 111)
- `010-capitulo-i-da-devolucao-personalizada-do-ibs-e-da-cbs-cashback-art112-a124.md` — CAPÍTULO I — DA DEVOLUÇĂO PERSONALIZADA DO IBS E DA CBS ( CASHBACK ) (Arts. 112 a 124) — _devolucao personalizada, baixa renda, CadUnico_
- `011-capitulo-ii-da-cesta-basica-nacional-de-alimentos-art125.md` — CAPÍTULO II — DA CESTA BÁSICA NACIONAL DE ALIMENTOS (Art. 125) — _cesta basica nacional, aliquota zero, NCM, alimentos_
- `012-capitulo-i-disposicoes-gerais-art126.md` — CAPÍTULO I — DISPOSIÇŐES GERAIS (Art. 126)
- `013-capitulo-ii-da-reducao-em-trinta-por-cento-das-aliquotas-do-ibs-e-da-c-art127.md` — CAPÍTULO II — DA REDUÇĂO EM TRINTA POR CENTO DAS ALÍQUOTAS DO IBS E DA CBS (Art. 127) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `014-capitulo-iii-da-reducao-em-sessenta-por-cento-das-aliquotas-do-ibs-e-d-art128-a142.md` — CAPÍTULO III — DA REDUÇĂO EM SESSENTA POR CENTO DAS ALÍQUOTAS DO IBS E DA CBS (Arts. 128 a 142) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `015-capitulo-iv-da-reducao-a-zero-das-aliquotas-do-ibs-e-da-cbs-art143-a156.md` — CAPÍTULO IV — DA REDUÇĂO A ZERO DAS ALÍQUOTAS DO IBS E DA CBS (Arts. 143 a 156) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `016-capitulo-v-do-transporte-publico-coletivo-de-passageiros-rodoviario-e-art157.md` — CAPÍTULO V — DO TRANSPORTE PÚBLICO COLETIVO DE PASSAGEIROS RODOVIÁRIO E METROVIÁRIO DE CARÁTER URBANO, SEMIURBANO E METROPOLITANO (Art. 157)
- `017-capitulo-vi-da-reabilitacao-urbana-de-zonas-historicas-e-de-areas-crit-art158-a163.md` — CAPÍTULO VI — DA REABILITAÇĂO URBANA DE ZONAS HISTÓRICAS E DE ÁREAS CRÍTICAS DE RECUPERAÇĂO E RECONVERSĂO URBANÍSTICA (Arts. 158 a 163)
- `018-capitulo-vii-do-produtor-rural-e-do-produtor-rural-integrado-nao-contr-art164-a168.md` — CAPÍTULO VII — DO PRODUTOR RURAL E DO PRODUTOR RURAL INTEGRADO NĂO CONTRIBUINTE (Arts. 164 a 168)
- `019-capitulo-viii-do-transportador-autonomo-de-carga-pessoa-fisica-nao-con-art169.md` — CAPÍTULO VIII — DO TRANSPORTADOR AUTÔNOMO DE CARGA PESSOA FÍSICA NĂO CONTRIBUINTE (Art. 169)
- `020-capitulo-ix-dos-residuos-e-demais-materiais-destinados-r-reciclagem-re-art170.md` — CAPÍTULO IX — DOS RESÍDUOS E DEMAIS MATERIAIS DESTINADOS Ŕ RECICLAGEM, REUTILIZAÇĂO OU LOGÍSTICA REVERSA ADQUIRIDOS DE PESSOA FÍSICA, COOPERATIVA OU OUTRA FORMA DE ORGANIZAÇĂO POPULAR (Art. 170)
- `021-capitulo-x-dos-bens-moveis-usados-adquiridos-de-pessoa-fisica-nao-cont-art171.md` — CAPÍTULO X — DOS BENS MÓVEIS USADOS ADQUIRIDOS DE PESSOA FÍSICA NĂO CONTRIBUINTE PARA REVENDA (Art. 171)
- `022-capitulo-i-dos-combustiveis-art172-a180.md` — CAPÍTULO I — DOS COMBUSTÍVEIS (Arts. 172 a 180) — _regime especifico, monofasia, aliquota ad rem_
- `023-capitulo-ii-dos-servicos-financeiros-art181-a233.md` — CAPÍTULO II — DOS SERVIÇOS FINANCEIROS (Arts. 181 a 233) — _servicos financeiros, regime especifico, spread_
- `024-capitulo-iii-dos-planos-de-assistencia-r-saude-art234-a243.md` — CAPÍTULO III — DOS PLANOS DE ASSISTĘNCIA Ŕ SAÚDE (Arts. 234 a 243)
- `025-capitulo-iv-dos-concursos-de-prognosticos-art244-a250.md` — CAPÍTULO IV — DOS CONCURSOS DE PROGNÓSTICOS (Arts. 244 a 250)
- `026-capitulo-v-dos-bens-imoveis-art251-a270.md` — CAPÍTULO V — DOS BENS IMÓVEIS (Arts. 251 a 270)
- `027-capitulo-vi-das-sociedades-cooperativas-art271-a272.md` — CAPÍTULO VI — DAS SOCIEDADES COOPERATIVAS (Arts. 271 a 272)
- `028-capitulo-vii-dos-bares-restaurantes-hotelaria-parques-de-diversao-e-pa-art273-a291.md` — CAPÍTULO VII — DOS BARES, RESTAURANTES, HOTELARIA, PARQUES DE DIVERSĂO E PARQUES TEMÁTICOS, TRANSPORTE COLETIVO DE PASSAGEIROS E AGĘNCIAS DE TURISMO (Arts. 273 a 291)
- `029-capitulo-viii-da-sociedade-anonima-do-futebol-saf-art292-a296.md` — CAPÍTULO VIII — DA SOCIEDADE ANÔNIMA DO FUTEBOL - SAF (Arts. 292 a 296)
- `030-capitulo-ix-das-missoes-diplomaticas-reparticoes-consulares-e-operacoe-art297-a299.md` — CAPÍTULO IX — DAS MISSŐES DIPLOMÁTICAS, REPARTIÇŐES CONSULARES E OPERAÇŐES ALCANÇADAS POR TRATADO INTERNACIONAL (Arts. 297 a 299)
- `031-capitulo-x-disposicoes-comuns-aos-regimes-especificos-art300-a307.md` — CAPÍTULO X — DISPOSIÇŐES COMUNS AOS REGIMES ESPECÍFICOS (Arts. 300 a 307)
- `032-capitulo-i-do-programa-universidade-para-todos-prouni-art308.md` — CAPÍTULO I — DO PROGRAMA UNIVERSIDADE PARA TODOS - PROUNI (Art. 308)
- `033-capitulo-ii-do-regime-automotivo-art309-a316.md` — CAPÍTULO II — DO REGIME AUTOMOTIVO (Arts. 309 a 316)
- `034-capitulo-i-do-regulamento-do-ibs-e-da-cbs-art317.md` — CAPÍTULO I — DO REGULAMENTO DO IBS E DA CBS (Art. 317)
- `035-capitulo-ii-da-harmonizacao-do-ibs-e-da-cbs-art318-a323.md` — CAPÍTULO II — DA HARMONIZAÇĂO DO IBS E DA CBS (Arts. 318 a 323)
- `036-capitulo-ii-a-incluido-pela-lei-complementar-ns-227-de-2026-da-integra-art323.md` — CAPÍTULO II-A (Incluído pela Lei Complementar nş 227, de 2026) — DA INTEGRAÇĂO DO CONTENCIOSO DE IBS E CBS (Art. 323)
- `037-capitulo-iii-da-fiscalizacao-e-do-lancamento-de-oficio-art324-a341.md` — CAPÍTULO III — DA FISCALIZAÇĂO E DO LANÇAMENTO DE OFÍCIO (Arts. 324 a 341)
- `038-capitulo-iv-incluido-pela-lei-complementar-ns-227-de-2026-das-infracoe-art341.md` — CAPÍTULO IV (Incluído pela Lei Complementar nş 227, de 2026) — DAS INFRAÇŐES E PENALIDADES RELATIVAS AO IBS E Ŕ CBS (Art. 341)
- `039-capitulo-i-da-fixacao-das-aliquotas-durante-a-transicao-art342-a370.md` — CAPÍTULO I — DA FIXAÇĂO DAS ALÍQUOTAS DURANTE A TRANSIÇĂO (Arts. 342 a 370) — _aliquota padrao, reducao 60%, reducao 30%, teto; transicao 2026-2033, extincao PIS COFINS ICMS ISS, aliquota de teste_
- `040-capitulo-ii-do-limite-para-reducao-das-aliquotas-do-ibs-de-2029-a-2077-art371.md` — CAPÍTULO II — DO LIMITE PARA REDUÇĂO DAS ALÍQUOTAS DO IBS DE 2029 A 2077 (Art. 371) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `041-capitulo-iii-da-transicao-aplicavel-ao-regime-de-compras-governamentai-art372.md` — CAPÍTULO III — DA TRANSIÇĂO APLICÁVEL AO REGIME DE COMPRAS GOVERNAMENTAIS (Art. 372) — _transicao 2026-2033, extincao PIS COFINS ICMS ISS, aliquota de teste_
- `042-capitulo-iv-do-reequilibrio-de-contratos-administrativos-art373-a377.md` — CAPÍTULO IV — DO REEQUILÍBRIO DE CONTRATOS ADMINISTRATIVOS (Arts. 373 a 377)
- `043-capitulo-v-da-utilizacao-do-saldo-credor-do-pis-e-da-cofins-art378-a383.md` — CAPÍTULO V — DA UTILIZAÇĂO DO SALDO CREDOR DO PIS E DA COFINS (Arts. 378 a 383)
- `044-capitulo-vi-dos-criterios-limites-e-procedimentos-relativos-r-compensa-art384-a405.md` — CAPÍTULO VI — DOS CRITÉRIOS, LIMITES E PROCEDIMENTOS RELATIVOS Ŕ COMPENSAÇĂO DE BENEFÍCIOS FISCAIS OU FINANCEIRO-FISCAIS DO ICMS (Arts. 384 a 405) — _servicos financeiros, regime especifico, spread_
- `045-capitulo-vii-da-transicao-aplicavel-aos-bens-de-capital-art406-a407.md` — CAPÍTULO VII — DA TRANSIÇĂO APLICÁVEL AOS BENS DE CAPITAL (Arts. 406 a 407) — _transicao 2026-2033, extincao PIS COFINS ICMS ISS, aliquota de teste_
- `046-capitulo-viii-disposicoes-finais-art408.md` — CAPÍTULO VIII — disposiçőes finais (Art. 408)
- `047-titulo-i-art409-a411.md` — TÍTULO I (Arts. 409 a 411)
- `048-capitulo-i-do-momento-de-ocorrencia-do-fato-gerador-art412.md` — CAPÍTULO I — DO MOMENTO DE OCORRĘNCIA DO FATO GERADOR (Art. 412)
- `049-capitulo-ii-da-nao-incidencia-art413.md` — CAPÍTULO II — DA NĂO INCIDĘNCIA (Art. 413) — _fato gerador, hipotese de incidencia, operacoes onerosas_
- `050-capitulo-iii-da-base-de-calculo-art414-a418.md` — CAPÍTULO III — DA BASE DE CÁLCULO (Arts. 414 a 418)
- `051-capitulo-iv-das-aliquotas-art419-a423.md` — CAPÍTULO IV — DAS ALÍQUOTAS (Arts. 419 a 423) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `052-capitulo-v-da-sujeicao-passiva-art424-a425.md` — CAPÍTULO V — DA SUJEIÇĂO PASSIVA (Arts. 424 a 425)
- `053-capitulo-vi-da-empresa-comercial-exportadora-art426-a427.md` — CAPÍTULO VI — DA EMPRESA COMERCIAL EXPORTADORA (Arts. 426 a 427)
- `054-capitulo-vii-da-pena-de-perdimento-art428-a429.md` — CAPÍTULO VII — DA PENA DE PERDIMENTO (Arts. 428 a 429)
- `055-capitulo-viii-da-apuracao-art430-a431.md` — CAPÍTULO VIII — DA APURAÇĂO (Arts. 430 a 431)
- `056-capitulo-ix-do-pagamento-art432-a433.md` — CAPÍTULO IX — DO PAGAMENTO (Arts. 432 a 433)
- `057-titulo-iii-art434-a435.md` — TÍTULO III (Arts. 434 a 435)
- `058-titulo-iv-art436-a438.md` — TÍTULO IV (Arts. 436 a 438)
- `059-capitulo-i-da-zona-franca-de-manaus-art439-a457.md` — CAPÍTULO I — DA ZONA FRANCA DE MANAUS (Arts. 439 a 457) — _Zona Franca de Manaus, areas de livre comercio, incentivos_
- `060-capitulo-ii-das-areas-de-livre-comercio-art458-a470.md` — CAPÍTULO II — DAS ÁREAS DE LIVRE COMÉRCIO (Arts. 458 a 470)
- `061-capitulo-iii-da-devolucao-do-ibs-e-da-cbs-ao-turista-estrangeiro.md` — CAPÍTULO III — DA DEVOLUÇĂO DO IBS E DA CBS AO TURISTA ESTRANGEIRO (—)
- `062-titulo-i-art471.md` — TÍTULO I (Art. 471)
- `063-capitulo-iv-incluido-pela-lei-complementar-ns-227-de-2026-art471.md` — CAPÍTULO IV — (Incluído pela Lei Complementar nş 227, de 2026) (Art. 471)
- `064-capitulo-v-incluido-pela-lei-complementar-ns-227-de-2026-art471.md` — CAPÍTULO V — (Incluído pela Lei Complementar nş 227, de 2026) (Art. 471)
- `065-titulo-ii-art472-a473.md` — TÍTULO II (Arts. 472 a 473)
- `066-titulo-iii-art474.md` — TÍTULO III (Art. 474)
- `067-capitulo-i-da-avaliacao-quinquenal-art475-a476.md` — CAPÍTULO I — DA AVALIAÇĂO QUINQUENAL (Arts. 475 a 476)
- `068-capitulo-ii-da-compensacao-de-eventual-reducao-do-montante-entregue-no-art477-a479.md` — CAPÍTULO II — DA COMPENSAÇĂO DE EVENTUAL REDUÇĂO DO MONTANTE ENTREGUE NOS TERMOS DO ART. 159, INCISOS I E II, DA CONSTITUIÇĂO FEDERAL EM RAZĂO DA SUBSTITUIÇĂO DO IPI PELO IMPOSTO SELETIVO (Arts. 477 a 479) — _imposto seletivo, IS, bens prejudiciais a saude e ao meio ambiente_
- `069-capitulo-iii-do-comite-gestor-do-ibs-art480-a484.md` — CAPÍTULO III — DO COMITĘ gESTOR DO ibs (Arts. 480 a 484) — _Comite Gestor do IBS, CG-IBS, governanca_
- `070-capitulo-iv-do-periodo-de-transicao-das-operacoes-com-bens-imoveis-art485-a490.md` — CAPÍTULO IV — DO PERÍODO DE TRANSIÇĂO DAS OPERAÇŐES COM BENS IMÓVEiS (Arts. 485 a 490) — _transicao 2026-2033, extincao PIS COFINS ICMS ISS, aliquota de teste_
- `071-titulo-iv-art491-a544.md` — TÍTULO IV (Arts. 491 a 544)
- `072-anexo-i-produtos-destinados-r-alimentacao-humana-submetidos-r-reducao.md` — ANEXO I — PRODUTOS DESTINADOS Ŕ ALIMENTAÇĂO HUMANA SUBMETIDOS Ŕ REDUÇĂO A ZERO DAS ALÍQUOTAS DO IBS E DA CBS (—) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `073-anexo-ii-servicos-de-educacao-submetidos-r-reducao-de-60-sessenta-por.md` — ANEXO II — SERVIÇOS DE EDUCAÇĂO SUBMETIDOS Ŕ REDUÇĂO DE 60% (SESSENTA POR CENTO) DAS ALÍQUOTAS DO IBS E DA CBS (—) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `074-anexo-iii-servicos-de-saude-submetidos-r-reducao-de-60-sessenta-por-ce.md` — ANEXO III — SERVIÇOS DE SAÚDE SUBMETIDOS Ŕ REDUÇĂO DE 60% (SESSENTA POR CENTO) DAS ALÍQUOTAS DO IBS E DA CBS (—) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `075-anexo-iv-dispositivos-medicos-submetidos-r-reducao-de-60-sessenta-por.md` — ANEXO IV — DISPOSITIVOS MÉDICOS SUBMETIDOS Ŕ REDUÇĂO DE 60% (SESSENTA POR CENTO) DAS ALÍQUOTAS DO IBS E DA CBS (—) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `076-anexo-v-dispositivos-de-acessibilidade-proprios-para-pessoas-com-defic.md` — ANEXO V — DISPOSITIVOS DE ACESSIBILIDADE PRÓPRIOS PARA PESSOAS COM DEFICIĘNCIA SUBMETIDOS Ŕ REDUÇĂO DE 60% (SESSENTA POR CENTO) DAS ALÍQUOTAS DO IBS E DA CBS (—) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `077-anexo-vi.md` — ANEXO VI (—)
- `078-anexo-vii-alimentos-destinados-ao-consumo-humano-submetidos-r-reducao.md` — ANEXO VII — ALIMENTOS DESTINADOS AO CONSUMO HUMANO SUBMETIDOS Ŕ REDUÇĂO DE 60% (SESSENTA POR CENTO) DAS ALÍQUOTAS DO IBS E DA CBS (—) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `079-anexo-viii-produtos-de-higiene-pessoal-e-limpeza-majoritariamente-cons.md` — ANEXO VIII — PRODUTOS DE HIGIENE PESSOAL E LIMPEZA MAJORITARIAMENTE CONSUMIDOS POR FAMÍLIAS DE BAIXA RENDA SUBMETIDOS Ŕ REDUÇĂO DE 60% (SESSENTA POR CENTO) DAS ALÍQUOTAS DO IBS E DA CBS (—) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `080-anexo-ix-insumos-agropecuarios-e-aquicolas-submetidos-r-reducao-de-60.md` — ANEXO IX — INSUMOS AGROPECUÁRIOS E AQUÍCOLAS SUBMETIDOS Ŕ REDUÇĂO DE 60% (SESSENTA POR CENTO) DAS ALÍQUOTAS DO IBS E DA CBS (—) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `081-anexo-x-producoes-nacionais-artisticas-culturais-de-eventos-jornalisti.md` — ANEXO X — PRODUÇŐES NACIONAIS ARTÍSTICAS, CULTURAIS, DE EVENTOS, JORNALÍSTICAS E AUDIOVISUAIS SUBMETIDAS Ŕ REDUÇĂO DE 60% (SESSENTA POR CENTO) DAS ALÍQUOTAS DO IBS E DA CBS (—) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `082-anexo-xi-bens-e-servicos-relacionados-r-soberania-e-r-seguranca-nacion.md` — ANEXO XI — BENS E SERVIÇOS RELACIONADOS Ŕ SOBERANIA E Ŕ SEGURANÇA NACIONAL, Ŕ SEGURANÇA DA INFORMAÇĂO E Ŕ SEGURANÇA CIBERNÉTICA SUBMETIDOS Ŕ REDUÇĂO DE 60% (SESSENTA POR CENTO) DAS ALÍQUOTAS DO IBS E DA CBS (—) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `083-anexo-xii-dispositivos-medicos-submetidos-r-reducao-a-zero-das-aliquot.md` — ANEXO XII — DISPOSITIVOS MÉDICOS SUBMETIDOS Ŕ REDUÇĂO A ZERO DAS ALÍQUOTAS DO IBS E DA CBS (—) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `084-anexo-xiii-dispositivos-de-acessibilidade-proprios-para-pessoas-com-de.md` — ANEXO XIII — DISPOSITIVOS DE ACESSIBILIDADE PRÓPRIOS PARA PESSOAS COM DEFICIĘNCIA SUBMETIDOS Ŕ REDUÇĂO A ZERO DAS ALÍQUOTAS DO IBS E DA CBS (—) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `085-anexo-xv-produtos-horticolas-frutas-e-ovos-submetidos-r-reducao-de-100.md` — ANEXO XV — PRODUTOS HORTÍCOLAS, FRUTAS E OVOS SUBMETIDOS Ŕ REDUÇĂO DE 100% (CEM POR CENTO) DAS ALÍQUOTAS DO IBS E DA CBS (—) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `086-anexo-xvi-limite-inferior-para-fixacao-da-aliquota-propria-em-proporca.md` — ANEXO XVI — LIMITE INFERIOR PARA FIXAÇĂO DA ALÍQUOTA PRÓPRIA EM PROPORÇĂO DA ALÍQUOTA DE REFERĘNCIA (—) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `087-anexo-xvii-bens-e-servicos-sujeitos-ao-imposto-seletivo.md` — ANEXO XVII — BENS E SERVIÇOS SUJEITOS AO IMPOSTO SELETIVO (—) — _imposto seletivo, IS, bens prejudiciais a saude e ao meio ambiente_
- `088-anexo-i-aliquotas-e-partilha-do-simples-nacional-comercio.md` — ANEXO I — Alíquotas e Partilha do Simples Nacional - Comércio (—) — _aliquota padrao, reducao 60%, reducao 30%, teto; Simples Nacional, MEI, regime unico_
- `089-anexo-ii-aliquotas-e-partilha-do-simples-nacional-industria.md` — ANEXO II — Alíquotas e Partilha do Simples Nacional - Indústria (—) — _aliquota padrao, reducao 60%, reducao 30%, teto; Simples Nacional, MEI, regime unico_
- `090-anexo-iii-aliquotas-e-partilha-do-simples-nacional-receitas-de-locacao.md` — ANEXO III — Alíquotas e Partilha do Simples Nacional - Receitas de locaçăo de bens móveis e de prestaçăo de serviços năo relacionados no § 5ş-C do art. 18 desta Lei Complementar (—) — _aliquota padrao, reducao 60%, reducao 30%, teto; Simples Nacional, MEI, regime unico_
- `091-anexo-iv-aliquotas-e-partilha-do-simples-nacional-receitas-decorrentes.md` — ANEXO IV — Alíquotas e Partilha do Simples Nacional - Receitas decorrentes da prestaçăo de serviços relacionados no § 5ş-C do art. 18 desta Lei Complementar (—) — _aliquota padrao, reducao 60%, reducao 30%, teto; Simples Nacional, MEI, regime unico_
- `092-anexo-v-aliquotas-e-partilha-do-simples-nacional-receitas-decorrentes.md` — ANEXO V — Alíquotas e Partilha do Simples Nacional - Receitas decorrentes da prestaçăo de serviços relacionados no § 5ş-I do art. 18 desta Lei Complementar (—) — _aliquota padrao, reducao 60%, reducao 30%, teto; Simples Nacional, MEI, regime unico_
- `093-anexo-vii-valores-fixos-do-microempreendedor-individual-mei.md` — ANEXO VII — Valores fixos do Microempreendedor Individual (MEI) (—)

### Decreto 12.955/2026 (Regulamento do IBS/CBS) — pasta `decreto-12955/`

- `001-preambulo-e-ementa-art1.md` — Preambulo e ementa (Art. 1)
- `002-capitulo-i-disposicoes-preliminares-art2-a3.md` — CAPÍTULO I — DISPOSIÇŐES PRELIMINARES (Arts. 2 a 3)
- `003-capitulo-ii-da-contribuicao-social-sobre-bens-e-servicos-sobre-operaco-art4-a64.md` — CAPÍTULO II — DA CONTRIBUIÇĂO SOCIAL SOBRE BENS E SERVIÇOS SOBRE OPERAÇŐES COM BENS E SERVIÇOS (Arts. 4 a 64)
- `004-capitulo-iii-da-contribuicao-social-sobre-bens-e-servicos-sobre-import-art65-a89.md` — CAPÍTULO III — DA CONTRIBUIÇĂO SOCIAL SOBRE BENS E SERVIÇOS SOBRE IMPORTAÇŐES (Arts. 65 a 89)
- `005-capitulo-iv-da-contribuicao-social-sobre-bens-e-servicos-sobre-exporta-art90-a103.md` — CAPÍTULO IV — DA CONTRIBUIÇĂO SOCIAL SOBRE BENS E SERVIÇOS SOBRE EXPORTAÇŐES (Arts. 90 a 103)
- `006-capitulo-i-producao-de-efeitos-do-cadastro-com-identificacao-unica-rel-art104-a111.md` — CAPÍTULO I (Produçăo de efeitos) — DO CADASTRO COM IDENTIFICAÇĂO ÚNICA RELATIVO Ŕ CBS E AO IBS (Arts. 104 a 111)
- `007-capitulo-ii-do-documento-fiscal-eletronico-art112-a151.md` — CAPÍTULO II — DO DOCUMENTO FISCAL ELETRÔNICO (Arts. 112 a 151)
- `008-capitulo-i-dos-regimes-aduaneiros-especiais-art152-a170.md` — CAPÍTULO I — DOS REGIMES ADUANEIROS ESPECIAIS (Arts. 152 a 170)
- `009-capitulo-ii-dos-regimes-de-bagagem-e-de-remessas-internacionais-art171-a178.md` — CAPÍTULO II — DOS REGIMES DE BAGAGEM E DE REMESSAS INTERNACIONAIS (Arts. 171 a 178)
- `010-capitulo-iii-das-zonas-de-processamento-de-exportacao-art179-a184.md` — CAPÍTULO III — DAS ZONAS DE PROCESSAMENTO DE EXPORTAÇĂO (Arts. 179 a 184)
- `011-capitulo-iv-do-compartilhamento-de-informacoes-relativas-ao-comercio-e-art185.md` — CAPÍTULO IV — DO COMPARTILHAMENTO DE INFORMAÇŐES RELATIVAS AO COMÉRCIO EXTERIOR (Art. 185)
- `012-capitulo-v-dos-regimes-dos-bens-de-capital-art186-a198.md` — CAPÍTULO V — DOS REGIMES DOS BENS DE CAPITAL (Arts. 186 a 198)
- `013-titulo-iv-art199.md` — TÍTULO IV (Art. 199)
- `014-capitulo-i-disposicoes-gerais-art200-a201.md` — CAPÍTULO I — DISPOSIÇŐES GERAIS (Arts. 200 a 201)
- `015-capitulo-ii-da-reducao-em-trinta-por-cento-das-aliquotas-da-cbs-art202.md` — CAPÍTULO II — DA REDUÇĂO EM TRINTA POR CENTO DAS ALÍQUOTAS DA CBS (Art. 202) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `016-capitulo-iii-da-reducao-em-sessenta-por-cento-das-aliquotas-da-cbs-art203-a218.md` — CAPÍTULO III — DA REDUÇĂO EM SESSENTA POR CENTO DAS ALÍQUOTAS DA CBS (Arts. 203 a 218) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `017-capitulo-iv-da-reducao-a-zero-das-aliquotas-da-cbs-art219-a232.md` — CAPÍTULO IV — DA REDUÇĂO A ZERO DAS ALÍQUOTAS DA CBS (Arts. 219 a 232) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `018-capitulo-v-do-transporte-publico-coletivo-de-passageiros-rodoviario-e-art233.md` — CAPÍTULO V — DO TRANSPORTE PÚBLICO COLETIVO DE PASSAGEIROS RODOVIÁRIO E METROVIÁRIO DE CARÁTER URBANO, SEMIURBANO E METROPOLITANO (Art. 233)
- `019-capitulo-vi-da-reabilitacao-urbana-de-zonas-historicas-e-de-areas-crit-art234-a237.md` — CAPÍTULO VI — DA REABILITAÇĂO URBANA DE ZONAS HISTÓRICAS E DE ÁREAS CRÍTICAS DE RECUPERAÇĂO E RECONVERSĂO URBANÍSTICA (Arts. 234 a 237)
- `020-capitulo-vii-do-produtor-rural-e-do-produtor-rural-integrado-nao-contr-art238-a249.md` — CAPÍTULO VII — DO PRODUTOR RURAL E DO PRODUTOR RURAL INTEGRADO NĂO CONTRIBUINTE (Arts. 238 a 249)
- `021-capitulo-viii-do-transportador-autonomo-de-carga-pessoa-fisica-nao-con-art250-a255.md` — CAPÍTULO VIII — DO TRANSPORTADOR AUTÔNOMO DE CARGA PESSOA FÍSICA NĂO CONTRIBUINTE (Arts. 250 a 255)
- `022-capitulo-ix-dos-residuos-e-demais-materiais-destinados-r-reciclagem-re-art256-a257.md` — CAPÍTULO IX — DOS RESÍDUOS E DEMAIS MATERIAIS DESTINADOS Ŕ RECICLAGEM, REUTILIZAÇĂO OU LOGÍSTICA REVERSA ADQUIRIDOS DE PESSOA FÍSICA, COOPERATIVA OU OUTRA FORMA DE ORGANIZAÇĂO POPULAR (Arts. 256 a 257)
- `023-capitulo-x-dos-bens-moveis-usados-adquiridos-de-pessoa-fisica-nao-cont-art258.md` — CAPÍTULO X — DOS BENS MÓVEIS USADOS ADQUIRIDOS DE PESSOA FÍSICA NĂO CONTRIBUINTE PARA REVENDA (Art. 258)
- `024-capitulo-i-dos-combustiveis-art259-a268.md` — CAPÍTULO I — DOS COMBUSTÍVEIS (Arts. 259 a 268) — _regime especifico, monofasia, aliquota ad rem_
- `025-capitulo-ii-dos-servicos-financeiros-art269-a329.md` — CAPÍTULO II — DOS SERVIÇOS FINANCEIROS (Arts. 269 a 329) — _servicos financeiros, regime especifico, spread_
- `026-capitulo-iii-dos-planos-de-assistencia-r-saude-art330-a346.md` — CAPÍTULO III — DOS PLANOS DE ASSISTĘNCIA Ŕ SAÚDE (Arts. 330 a 346)
- `027-capitulo-iv-dos-concursos-de-prognosticos-art347-a358.md` — CAPÍTULO IV — DOS CONCURSOS DE PROGNÓSTICOS (Arts. 347 a 358)
- `028-capitulo-v-dos-bens-imoveis-art359-a390.md` — CAPÍTULO V — DOS BENS IMÓVEIS (Arts. 359 a 390)
- `029-capitulo-vi-das-sociedades-cooperativas-art391-a395.md` — CAPÍTULO VI — DAS SOCIEDADES COOPERATIVAS (Arts. 391 a 395)
- `030-capitulo-vii-dos-bares-restaurantes-hotelaria-parques-de-diversao-e-pa-art396-a420.md` — CAPÍTULO VII — DOS BARES, RESTAURANTES, HOTELARIA, PARQUES DE DIVERSĂO E PARQUES TEMÁTICOS, TRANSPORTE COLETIVO DE PASSAGEIROS E AGĘNCIAS DE TURISMO (Arts. 396 a 420)
- `031-capitulo-viii-da-sociedade-anonima-do-futebol-saf-art421-a429.md` — CAPÍTULO VIII — DA SOCIEDADE ANÔNIMA DO FUTEBOL – SAF (Arts. 421 a 429)
- `032-capitulo-ix-das-missoes-diplomaticas-reparticoes-consulares-e-operacoe-art430-a431.md` — CAPÍTULO IX — DAS MISSŐES DIPLOMÁTICAS, REPARTIÇŐES CONSULARES E OPERAÇŐES ALCANÇADAS POR TRATADO INTERNACIONAL (Arts. 430 a 431)
- `033-capitulo-i-da-zona-franca-de-manaus-art432-a435.md` — CAPÍTULO I — DA ZONA FRANCA DE MANAUS (Arts. 432 a 435) — _Zona Franca de Manaus, areas de livre comercio, incentivos_
- `034-capitulo-ii-das-areas-de-livre-comercio-art436-a438.md` — CAPÍTULO II — DAS ÁREAS DE LIVRE COMÉRCIO (Arts. 436 a 438)
- `035-titulo-viii-art439-a443.md` — TÍTULO VIII (Arts. 439 a 443)
- `036-titulo-ix-art444-a450.md` — TÍTULO IX (Arts. 444 a 450)
- `037-capitulo-i-disposicoes-gerais-art451-a454.md` — CAPÍTULO I — DISPOSIÇŐES GERAIS (Arts. 451 a 454)
- `038-capitulo-ii-do-comite-de-harmonizacao-das-administracoes-tributarias-art455-a456.md` — CAPÍTULO II — DO COMITĘ DE HARMONIZAÇĂO DAS ADMINISTRAÇŐES TRIBUTÁRIAS (Arts. 455 a 456)
- `039-capitulo-iii-do-forum-de-harmonizacao-juridica-das-procuradorias-art457-a458.md` — CAPÍTULO III — DO FÓRUM DE HARMONIZAÇĂO JURÍDICA DAS PROCURADORIAS (Arts. 457 a 458)
- `040-capitulo-iv-do-ato-conjunto-do-comite-de-harmonizacao-das-administraco-art459.md` — CAPÍTULO IV — DO ATO CONJUNTO DO COMITĘ DE HARMONIZAÇĂO DAS ADMINISTRAÇŐES TRIBUTÁRIAS E DO FÓRUM DE HARMONIZAÇĂO JURÍDICA DAS PROCURADORIAS (Art. 459)
- `041-titulo-xi-art460.md` — TÍTULO XI (Art. 460)
- `042-capitulo-i-da-incorporacao-art461.md` — CAPÍTULO I — DA INCORPORAÇĂO (Art. 461)
- `043-capitulo-ii-do-parcelamento-do-solo-art462.md` — CAPÍTULO II — DO PARCELAMENTO DO SOLO (Art. 462)
- `044-capitulo-iii-da-locacao-da-cessao-onerosa-e-do-arrendamento-do-bem-imo-art463.md` — CAPÍTULO III — DA LOCAÇĂO, DA CESSĂO ONEROSA E DO ARRENDAMENTO DO BEM IMÓVEL (Art. 463)
- `045-titulo-xiii-art464-a465.md` — TÍTULO XIII (Arts. 464 a 465)
- `046-capitulo-i-da-aliquota-padrao-da-cbs-art466-a467.md` — CAPÍTULO I — DA ALÍQUOTA-PADRĂO DA CBS (Arts. 466 a 467) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `047-capitulo-ii-da-aliquota-de-referencia-da-cbs-art468.md` — CAPÍTULO II — DA ALÍQUOTA DE REFERĘNCIA DA CBS (Art. 468) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `048-capitulo-iii-das-aliquotas-da-cbs-incidente-sobre-importacoes-de-bens-art469.md` — CAPÍTULO III — DAS ALÍQUOTAS DA CBS INCIDENTE SOBRE IMPORTAÇŐES DE BENS MATERIAIS (Art. 469) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `049-capitulo-iv-das-aliquotas-da-cbs-incidente-sobre-importacoes-de-bens-i-art470.md` — CAPÍTULO IV — DAS ALÍQUOTAS DA CBS INCIDENTE SOBRE IMPORTAÇŐES DE BENS IMATERIAIS E SERVIÇOS (Art. 470) — _aliquota padrao, reducao 60%, reducao 30%, teto_
- `050-capitulo-v-das-aliquotas-da-cbs-incidente-sobre-combustiveis-art471-a479.md` — CAPÍTULO V — DAS ALÍQUOTAS DA CBS INCIDENTE SOBRE COMBUSTÍVEIS (Arts. 471 a 479) — _aliquota padrao, reducao 60%, reducao 30%, teto; regime especifico, monofasia, aliquota ad rem_
- `051-capitulo-vi-das-aliquotas-da-cbs-incidente-sobre-servicos-financeiros-art480-a484.md` — CAPÍTULO VI — DAS ALÍQUOTAS DA CBS INCIDENTE SOBRE SERVIÇOS FINANCEIROS (Arts. 480 a 484) — _aliquota padrao, reducao 60%, reducao 30%, teto; servicos financeiros, regime especifico, spread_
- `052-capitulo-i-art485.md` — CAPÍTULO I (Art. 485)
- `053-capitulo-ii-dos-percentuais-de-creditamento-presumido-em-relacao-a-ben-art486.md` — CAPÍTULO II — DOS PERCENTUAIS DE CREDITAMENTO PRESUMIDO EM RELAÇĂO A BENS MÓVEIS USADOS ADQUIRIDOS DE PESSOA FÍSICA NĂO CONTRIBUINTE PARA REVENDA (Art. 486)
- `054-titulo-iii-art487.md` — TÍTULO III (Art. 487)
- `055-titulo-iv-art488.md` — TÍTULO IV (Art. 488)
- `056-titulo-v-art489-a490.md` — TÍTULO V (Arts. 489 a 490)
- `057-titulo-vi-art491.md` — TÍTULO VI (Art. 491)
- `058-titulo-vii-art492-a514.md` — TÍTULO VII (Arts. 492 a 514)
- `059-titulo-viii-art515.md` — TÍTULO VIII (Art. 515)
- `060-titulo-ix-art516.md` — TÍTULO IX (Art. 516)
- `061-capitulo-i-do-programa-universidade-para-todos-prouni-art517.md` — CAPÍTULO I — DO PROGRAMA UNIVERSIDADE PARA TODOS – PROUNI (Art. 517)
- `062-capitulo-ii-do-regime-automotivo-art518-a527.md` — CAPÍTULO II — DO REGIME AUTOMOTIVO (Arts. 518 a 527)
- `063-capitulo-i-das-disposicoes-especificas-da-cbs-relativas-r-zona-franca-art528-a535.md` — CAPÍTULO I — DAS DISPOSIÇŐES ESPECÍFICAS DA CBS RELATIVAS Ŕ ZONA FRANCA DE MANAUS (Arts. 528 a 535) — _Zona Franca de Manaus, areas de livre comercio, incentivos_
- `064-capitulo-ii-das-disposicoes-especificas-da-cbs-relativas-rs-areas-de-l-art536-a542.md` — CAPÍTULO II — DAS DISPOSIÇŐES ESPECÍFICAS DA CBS RELATIVAS ŔS ÁREAS DE LIVRE COMÉRCIO (Arts. 536 a 542)
- `065-capitulo-iii-do-ingresso-de-bens-de-origem-nacional-na-zona-franca-de-art543-a548.md` — CAPÍTULO III — DO INGRESSO DE BENS DE ORIGEM NACIONAL NA ZONA FRANCA DE MANAUS E NAS ÁREAS DE LIVRE COMÉRCIO (Arts. 543 a 548) — _Zona Franca de Manaus, areas de livre comercio, incentivos_
- `066-capitulo-iv-do-ingresso-de-bens-de-procedencia-estrangeira-na-zona-fra-art549-a550.md` — CAPÍTULO IV — DO INGRESSO DE BENS DE PROCEDĘNCIA ESTRANGEIRA NA ZONA FRANCA DE MANAUS E NAS ÁREAS DE LIVRE COMÉRCIO (Arts. 549 a 550) — _Zona Franca de Manaus, areas de livre comercio, incentivos_
- `067-capitulo-i-do-programa-nacional-de-conformidade-tributaria-art551.md` — CAPÍTULO I — DO PROGRAMA NACIONAL DE CONFORMIDADE TRIBUTÁRIA (Art. 551)
- `068-capitulo-ii-da-fiscalizacao-e-do-lancamento-de-oficio-art552-a570.md` — CAPÍTULO II — DA FISCALIZAÇĂO E DO LANÇAMENTO DE OFÍCIO (Arts. 552 a 570)
- `069-capitulo-iii-das-infracoes-e-das-penalidades-relativas-r-cbs-art571-a578.md` — CAPÍTULO III — DAS INFRAÇŐES E DAS PENALIDADES RELATIVAS Ŕ CBS (Arts. 571 a 578)
- `070-capitulo-iv-das-penalidades-administrativas-nao-tributarias-relativas-art579-a581.md` — CAPÍTULO IV — DAS PENALIDADES ADMINISTRATIVAS NĂO TRIBUTÁRIAS RELATIVAS AO RECOLHIMENTO DOS TRIBUTOS NA LIQUIDAÇĂO FINANCEIRA – SPLIT PAYMENT (Arts. 579 a 581) — _split payment, recolhimento na liquidacao financeira; servicos financeiros, regime especifico, spread_
- `071-capitulo-i-da-fixacao-das-aliquotas-durante-a-transicao-art582-a601.md` — CAPÍTULO I — DA FIXAÇĂO DAS ALÍQUOTAS DURANTE A TRANSIÇĂO (Arts. 582 a 601) — _aliquota padrao, reducao 60%, reducao 30%, teto; transicao 2026-2033, extincao PIS COFINS ICMS ISS, aliquota de teste_
- `072-capitulo-ii-da-utilizacao-do-saldo-credor-da-contribuicao-para-o-pis-p-art602-a613.md` — CAPÍTULO II — DA UTILIZAÇĂO DO SALDO CREDOR DA CONTRIBUIÇĂO PARA O PIS/PASEP E DA COFINS E DOS CRÉDITOS INICIAIS DA CBS (Arts. 602 a 613) — _nao cumulatividade, apropriacao de credito, estorno_
- `073-capitulo-iii-da-transicao-aplicavel-aos-bens-de-capital-art614-a615.md` — CAPÍTULO III — DA TRANSIÇĂO APLICÁVEL AOS BENS DE CAPITAL (Arts. 614 a 615) — _transicao 2026-2033, extincao PIS COFINS ICMS ISS, aliquota de teste_
- `074-capitulo-iv-outras-disposicoes-transitorias-art616-a620.md` — CAPÍTULO IV — OUTRAS DISPOSIÇŐES TRANSITÓRIAS (Arts. 616 a 620)
- `075-anexo-i-taxas-anuais-de-depreciacao-art-48-1s.md` — ANEXO I — TAXAS ANUAIS DE DEPRECIAÇĂO (ART. 48, § 1ş) (—)
- `076-anexo-ii-repetro-art-164.md` — ANEXO II — REPETRO (ART. 164) (—)
- `077-anexo-iii-lista-de-bens-com-suspensao-do-pagamento-da-cbs-no-regime-di.md` — ANEXO III — LISTA DE BENS COM SUSPENSĂO DO PAGAMENTO DA CBS NO REGIME DIFERENCIADO DO REPORTO (Art. 186, § 5ş) (—)
- `078-anexo-iv-lista-de-bens-de-capital-sujeitos-a-suspensao-do-pagamento-da.md` — ANEXO IV — LISTA DE BENS DE CAPITAL SUJEITOS A SUSPENSĂO DO PAGAMENTO DA CBS NAS OPERAÇŐES DESTINADAS A CONTRIBUINTE NO REGIME REGULAR (ART. 196) (—)
- `079-anexo-v-lista-de-bens-de-capital-desonerados-nas-operacoes-destinadas.md` — ANEXO V — LISTA DE BENS DE CAPITAL DESONERADOS NAS OPERAÇŐES DESTINADAS A NĂO CONTRIBUINTES (Art. 197) (—)

