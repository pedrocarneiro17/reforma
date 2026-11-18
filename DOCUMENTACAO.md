# ReformaCalc — Documentação Técnica e de Negócio

> **Versão:** Beta — baseado na LC 214/2025 (com a redação da LC 227/2026) e no Decreto 12.955/2026
> **Data:** Novembro de 2026
> **Aviso:** Os valores são estimativas para fins educacionais. Não substituem assessoria fiscal.

---

## 1. O que é o ReformaCalc?

O **ReformaCalc** é um simulador web que permite a qualquer empresa brasileira entender, de forma visual e interativa, como a **Reforma Tributária** vai impactar sua carga tributária entre 2026 e 2033.

O sistema compara o imposto pago hoje (regime atual) com o que seria pago no novo sistema **IVA Dual (CBS + IBS)**, levando em conta o setor de atuação da empresa, seu regime tributário, faturamento, insumos e perfil de clientes.

---

## 2. Base Legal

| Legislação | O que define |
|---|---|
| **PEC 45/2019** | Emenda constitucional que criou o IVA Dual no Brasil |
| **LC 214/2025** | Lei complementar (originada do PLP 68/2024) que instituiu IBS, CBS e Imposto Seletivo: alíquotas, setores, créditos, regras de transição e os Anexos I–V do Simples Nacional na transição |
| **LC 227/2026** | Alterou a LC 214/2025 (ex.: teto do ISS na 5ª faixa do Simples, redutor de compras governamentais) |
| **Decreto 12.955/2026** | Regulamento do IBS/CBS |
| **LC 123/2006** | Estatuto do Simples Nacional (anexos, Fator R, vedações, exportação) |
| **Calculadora oficial da RFB** | Código aberto (MIT) em `github.com/ReceitaFederal`: catálogo de atividades do Simples (`cAtivSN`) e tipos de receita bruta (`tpRBSN`) da NT 2026.005 |

---

## 3. O Novo Sistema Tributário — IVA Dual

### O que muda?

O Brasil substituirá **9 tributos** por **2 tributos não-cumulativos**:

| Tributos extintos | Substituído por |
|---|---|
| PIS + COFINS (federais) | **CBS** — Contribuição sobre Bens e Serviços |
| ICMS (estadual) + ISS (municipal) | **IBS** — Imposto sobre Bens e Serviços |
| IPI, IOF parcial, CIDE | **IS** — Imposto Seletivo (sobre produtos nocivos) |

### Alíquota padrão estimada: **26,5%** (CBS + IBS)

Esta é a alíquota de referência usada no simulador, uma **estimativa de mercado** (a lei não a fixa). A CBS é estimada em 9,25% (substitui PIS/COFINS em 2027) e o IBS completa os 26,5%. As alíquotas de referência serão definidas por resolução do Senado — previsão de outubro/2026. O Imposto Seletivo não está incluído nesse percentual.

### Não-cumulatividade total

A principal vantagem do IVA Dual é a **não-cumulatividade plena**: a empresa desconta do imposto a pagar todo o IVA que já pagou na compra de insumos.

```
Imposto a recolher = (Faturamento × alíquota) − (Insumos × alíquota)
```

---

## 4. Cronograma de Transição (2026–2033)

O sistema atual não acaba de uma vez, e a transição **não segue um percentual único "novo × antigo"**: cada tributo muda em seu próprio ritmo (LC 214/2025, arts. 343 e seguintes, 501 e 508).

| Ano | O que muda |
|---|---|
| 2026 | Ano de teste: CBS a 0,9% e IBS a 0,1%, compensados com PIS/COFINS. Carga praticamente igual à de hoje |
| 2027–2028 | **A CBS substitui PIS/COFINS** (referência estimada em 9,25%, reduzida em 0,1 p.p. — art. 347). IBS de teste de 0,1%. ICMS e ISS continuam |
| 2029 | ICMS/ISS reduzem 10% e o IBS entra no lugar |
| 2030 | ICMS/ISS reduzem 20% |
| 2031 | ICMS/ISS reduzem 30% |
| 2032 | ICMS/ISS reduzem 40% |
| 2033 | ICMS e ISS extintos; **IVA Dual pleno** (CBS + IBS) |

**Como o simulador projeta cada regime:**
- **Lucro Presumido e Lucro Real:** PIS/COFINS viram CBS em 2027; ICMS/ISS caem 10% ao ano de 2029 a 2032 e o IBS cresce na mesma proporção. IRPJ, CSLL e contribuição previdenciária permanecem.
- **Simples Nacional e MEI:** o **DAS total não muda**. Só a partilha interna troca PIS/COFINS por CBS e ICMS/ISS por IBS (seção 6.4).

---

## 5. Reduções de Alíquota por Setor

A LC 214/2025 criou faixas de redução para setores considerados essenciais (percentuais sobre a alíquota de referência de 26,5%):

| Faixa | Redução | Alíquota efetiva | Setores |
|---|---|---|---|
| **Isenção total** | 100% | 0% | Cesta básica, medicamentos essenciais, educação infantil, dispositivos para PCD, transporte público |
| **Redução 60%** | 60% | 10,6% | Hospitais, planos de saúde, educação superior, produtor rural, atividades artísticas, insumos agropecuários, dispositivos médicos |
| **Redução 30%** | 30% | 18,55% | Profissões regulamentadas (advogados, engenheiros, contadores etc.) e outros serviços profissionais |
| **Alíquota cheia** | 0% | 26,5% | Comércio varejista e atacadista, indústria geral, TI/SaaS, logística e a maioria dos serviços |

Há também reduções intermediárias (50%, 40%), regimes específicos (imóveis, agências de turismo, combustíveis, Zona Franca de Manaus) e alíquota zero. A lista completa, com a base legal de cada setor, está em `src/data/setores.ts`.

**Fórmula da alíquota efetiva do setor:**
```
Alíquota IVA bruta = 26,5% × (1 − redução_do_setor)
```

---

## 6. Regimes Tributários — Carga Atual

O simulador conhece as alíquotas efetivas aproximadas dos 3 regimes vigentes.

### 6.1 Simples Nacional (até R$ 4,8M/ano)

Recolhimento unificado via DAS. Alíquota varia pelo **Anexo** (tipo de atividade) e pela **faixa de faturamento anual**:

| Faturamento Anual | Comércio (Anexo I) | Indústria (Anexo II) | Serviços (Anexo III) |
|---|---|---|---|
| Até R$ 180 mil | 4,0% | 4,5% | 6,0% |
| Até R$ 360 mil | 7,3% | 7,8% | 11,2% |
| Até R$ 720 mil | 9,5% | 10,0% | 13,5% |
| Até R$ 1,8 milhão | 10,7% | 11,2% | 16,0% |
| Até R$ 3,6 milhões | 14,3% | 14,7% | 21,0% |
| Acima do limite | ~19% | ~20% | ~33% |

### 6.2 Lucro Presumido

| Setor | Alíquota efetiva estimada | Composição principal |
|---|---|---|
| Serviços / Misto | 14,3% | IRPJ (presunção 32%) + CSLL + PIS + COFINS + ISS |
| Comércio | 17,8% | IRPJ (presunção 8%) + CSLL + PIS + COFINS + ICMS |
| Indústria | 23,0% | IRPJ + CSLL + PIS + COFINS + IPI + ICMS |

### 6.3 Lucro Real

| Setor | Alíquota efetiva estimada | Característica |
|---|---|---|
| Serviços / Misto | 13,0% | PIS/COFINS não-cumulativo com créditos |
| Comércio | 18,0% | Créditos de PIS/COFINS sobre compras |
| Indústria | 20,0% | Créditos de PIS/COFINS + IPI |

> **Fonte das alíquotas:** Tabelas do Simples Nacional vigentes, Decreto nº 9.580/2018 (RIR) e Instrução Normativa da Receita Federal. São **médias aproximadas** — a alíquota real varia conforme a margem de lucro, benefícios fiscais e deduções de cada empresa.

### 6.4 Simples Nacional na transição

- **DAS total constante.** Os Anexos I–V da LC 214/2025 mantêm as alíquotas nominais e as parcelas a deduzir de 2027 a 2033. Só a partilha interna muda: PIS/COFINS → CBS e ICMS/ISS → IBS.
- **Partilha oficial por ano e faixa.** As tabelas dos Anexos I–V (LC 214/2025, redação da LC 227/2026) estão em `src/data/partilhaSimples.ts`, **gerado** por `python -I scripts/gerar_partilha_simples.py` a partir do texto da lei. Não editar à mão.
- **6ª faixa em 2027–2028.** Alíquota nominal 0,1 p.p. menor (art. 347 da LC 214).
- **Teto do ISS na 5ª faixa (Anexos III e IV).** Acima de 14,925% (III) ou 12,5% (IV) de alíquota efetiva, o ISS fica limitado (5% em 2027–2028; 4,5%, 4%, 3,5% e 3% de 2029 a 2032) e o excedente vai para os demais tributos e para o IBS. Vale só a partir de 2027.
- **Anexo por atividade.** Pode ser fixado por lei (advocacia, limpeza e vigilância → IV), padrão do setor e editável (construção → IV; reformas podem ir ao III) ou depender do **Fator R** (folha ÷ faturamento ≥ 28% → Anexo III, senão V).
- **Anexo IV.** A CPP patronal (20%) é paga fora do DAS, sobre folha e pró-labore.
- **Catálogo de atividades (`cAtivSN`).** 15 códigos (01 a 14 e 90) da NT 2026.005 em `src/data/atividadesSimples.ts`. Cada setor mostra o código que irá na nota fiscal a partir de 2027.
- **Tipos de receita (`tpRBSN`)** em `src/data/tiposReceitaSimples.ts`. Exportação direta (tipo 3) não paga a parcela de tributos sobre consumo do DAS; exportação indireta (tipo 4) é calculada e suspensa; livros, jornais e periódicos (tipo 2) não pagam CBS/IBS. Na indústria (Anexo II), a exportação também não paga o IPI. IRPJ, CSLL e CPP continuam. Nada disso se aplica quando a alíquota vem do PGDAS-D, que já separa as receitas.
- **Vedações.** Atividades impedidas de optar pelo Simples (LC 123, art. 17 — por exemplo geração, distribuição e comercialização de energia elétrica, serviços financeiros) e o produtor rural pessoa física aparecem como inaplicáveis.

---

## 7. Cálculos Principais

### 7.1 Carga Atual

```
Imposto_atual_mensal = Faturamento_mensal × alíquota_atual
```

Se o usuário informar dados reais dos últimos 12 meses (com impostos pagos), o sistema calcula a **alíquota real apurada** e a usa no lugar da estimativa de tabela:

```
Alíquota_real = Total_impostos_12m / Total_faturamento_12m
```

### 7.2 Carga Nova — IVA Dual

```
Base                 = Faturamento_mensal − Exportações − redutores do setor
IVA_bruto_mensal     = Base × alíquota_IVA_bruta
Crédito_insumos      = Insumos_mensais × alíquota_IVA_bruta
IVA_líquido_mensal   = max(0, IVA_bruto − Crédito_insumos)
Alíquota_efetiva_IVA = IVA_líquido / Faturamento_mensal
```

As **exportações são imunes** (art. 79 da LC 214), mas os créditos das compras são mantidos; se o crédito superar o débito, há saldo credor para ressarcimento. No regime atual (Lucro Presumido e Real), as exportações também ficam fora de ICMS, ISS, PIS/COFINS e IPI — só IRPJ e CSLL incidem.

### 7.3 Variação e Alerta de Preço

```
Variação_mensal (R$) = Carga_pós_reforma − Imposto_atual
Variação_mensal (%)  = Variação_R$ / Imposto_atual × 100
```

A **carga pós-reforma** é: IVA líquido + IRPJ/CSLL + contribuição previdenciária (Lucro Presumido e Real); o **próprio DAS** (Simples Nacional e MEI, que não pagam o IVA por fora a menos que optem pelo regime híbrido); ou **os tributos que permanecem + o IVA líquido** (profissional liberal PF e produtor rural: IRPF, INSS e IRPJ/CSLL continuam, e o IVA entra no lugar do ISS/ICMS). Esse valor coincide com o último ponto (2033) da projeção.

Se o IVA ficar **mais caro**, o sistema calcula o reajuste de preço necessário para manter a mesma receita líquida:

```
Reajuste_preço (%) = [(1 − aliq_atual) / (1 − aliq_IVA_efetiva) − 1] × 100
```

**Lógica:** a receita líquida (após impostos) só se mantém se o preço for ajustado proporcionalmente à diferença entre as alíquotas.

### 7.4 Projeção da Transição (2026–2033)

Para cada ano, o sistema soma a parcela que ainda é do regime atual e a parcela que já é do IVA Dual, seguindo o cronograma da seção 4: PIS/COFINS viram CBS em 2027 e ICMS/ISS reduzem 10% ao ano de 2029 a 2032 (arts. 501 e 508). No Simples e no MEI o total é o DAS, constante, e a projeção mostra só quanto dele já é CBS/IBS.

---

## 8. Funcionalidades do Sistema

### 8.1 Formulário de Entrada

**Modo Simples:** o usuário informa médias mensais (faturamento e insumos).

**Modo Detalhado:** o usuário digita os dados mês a mês dos últimos 12 meses (faturamento, insumos, impostos pagos e exportações). O sistema usa esses dados para:
- Calcular a alíquota real apurada
- Gerar o histórico e gráficos mês a mês
- Tornar a simulação mais precisa

### 8.2 Dashboard de Resultados

Exibe, na seguinte ordem:

1. **Cards de resumo** — Carga atual vs. IVA Dual vs. variação
2. **Painel Histórico 12 meses** — Gráficos com dados reais (se modo detalhado)
3. **Tabela de apuração** — Breakdown linha a linha do cálculo
4. **Gráfico de transição** — Evolução do imposto mensal de 2026 a 2033
5. **Comparador de Regimes** — Os 3 regimes calculados com os mesmos dados financeiros, lado a lado
6. **Simulador de Crescimento** — Curva interativa mostrando como o imposto evolui com o crescimento do faturamento
7. **Alertas** — Reajuste de preço, Simples Nacional Híbrido
8. **Tabela de transição detalhada** — Ano a ano com parcela antiga e nova

### 8.3 Comparador de Regimes

Executa os 3 regimes (Simples, Presumido, Real) com os mesmos dados financeiros da empresa e identifica:

- **Melhor regime hoje** (menor imposto atual)
- **Melhor regime no IVA** (menor imposto no novo sistema)
- **Menor impacto da transição** (menor variação absoluta)
- Alerta automático se o Simples Nacional for inaplicável (faturamento anual > R$ 4,8M)

### 8.4 Simulador de Crescimento

Slider de −40% a +200% de variação de faturamento. Para cada ponto:
- Recalcula o imposto nos dois sistemas
- Exibe gráfico de curva comparativa
- Detecta onde as linhas se cruzam (ponto onde o IVA passa a ser mais caro)
- Alerta quando o faturamento ultrapassa o teto do Simples Nacional
- Gera insights automáticos em texto

### 8.5 Simples Nacional Híbrido

Para empresas no Simples com clientes B2B, o sistema avalia se vale optar pelo **Simples Híbrido** (pagar CBS+IBS fora do DAS), que permite ao cliente B2B se creditar do IVA:

```
IVA_híbrido_líquido           = max(0, Faturamento × alíq_IVA − Crédito_insumos)
Custo_adicional               = IVA_híbrido − Imposto_DAS
Crédito_disponibilizado_ao_cliente = Faturamento × alíq_IVA
```

Vale a pena quando o crédito gerado ao cliente ≥ custo adicional para a empresa.

---

## 9. Setores Cadastrados (85 ao total)

A lista completa está em `src/data/setores.ts`. Cada setor traz:

- a **redução** de IBS/CBS (isenção total, 60%, 50%, 40%, 30% ou alíquota cheia) e a base legal;
- o **tipo** (comércio, indústria, serviço ou misto), que define a carga atual no Simples, no Presumido e no Real;
- no Simples: **anexo fixo** ou **padrão**, sujeição ao **Fator R**, **vedação** e código de atividade `cAtivSN`;
- regimes específicos quando aplicáveis (imóveis, agências de turismo, gorjeta, Zona Franca, regime automotivo, produtor rural).

---

## 10. Tecnologias Utilizadas

| Camada | Tecnologia |
|---|---|
| Framework frontend | React 18 |
| Build tool | Vite 5 |
| Estilização | Tailwind CSS v3 |
| Gráficos | Recharts 2 |
| Linguagem | TypeScript 5 (frontend e motor de cálculo); JavaScript no servidor |
| Servidor | Node.js + Express 5, autenticação JWT, PostgreSQL (limite de simulações por usuário) |
| Testes | Runner nativo do Node (`node --test`) com o Vite carregando o TypeScript — ver seção 13 |

---

## 11. Limitações e Avisos

1. **Alíquota padrão de 26,5%** é estimativa de mercado. A alíquota real do IVA Dual será definida por resolução do Senado (previsão: outubro de 2026).
2. **Alíquotas do regime atual** são médias setoriais. Empresas com margens, benefícios fiscais ou deduções específicas terão valores diferentes — por isso o modo detalhado com dados reais é mais preciso.
3. **O IS (Imposto Seletivo)** sobre produtos nocivos (cigarro, bebidas alcoólicas etc.) não é calculado: as alíquotas serão fixadas por lei ordinária. O simulador apenas sinaliza os setores sujeitos a ele.
4. **Exportações:** são imunes de IBS/CBS (art. 79 da LC 214) com manutenção dos créditos. No Simples, a receita exportada não paga a parcela de tributos sobre consumo do DAS (seção 6.4). Quando a alíquota vem do PGDAS-D, o simulador assume que as receitas já foram separadas.
5. O simulador considera **folha de pagamento** (Fator R, CPP do Anexo IV, contribuição previdenciária no Presumido e no Real) e alguns regimes específicos (imóveis, Zona Franca, regime automotivo). Não cobre benefícios fiscais regionais, nem todos os regimes especiais de setores regulados.
6. **Transportador autônomo de carga (PF):** tratado como **não contribuinte** de IBS/CBS (LC 214, art. 26, VII, e art. 169; o cClassTrib oficial 410015 confirma): IVA zero, e os clientes contribuintes apropriam crédito presumido. A opção pelo regime regular (art. 26 §1º, V) não é modelada.
7. **Teto do ISS no Simples:** modelado só a partir de 2027; para o regime atual a partilha é a da tabela sem teto.
8. **Limite do Simples para exportadores:** o simulador usa um único limite de R$ 4,8 milhões, sem a regra de limite separado para a receita de exportação.
6. **Consulte sempre um contador** para decisões fiscais — este simulador é educacional.

---

## 12. Glossário

| Termo | Significado |
|---|---|
| **IVA Dual** | Imposto sobre Valor Agregado em dois níveis: federal (CBS) e subnacional (IBS) |
| **CBS** | Contribuição sobre Bens e Serviços — substitui PIS e COFINS |
| **IBS** | Imposto sobre Bens e Serviços — substitui ICMS e ISS |
| **IS** | Imposto Seletivo — incide sobre produtos nocivos à saúde/meio ambiente |
| **Não-cumulatividade** | O imposto incide só sobre o valor agregado em cada etapa — sem cascata |
| **Crédito de insumos** | Valor de IVA pago na compra de insumos que pode ser descontado do IVA a pagar |
| **Alíquota efetiva** | Percentual real de imposto sobre o faturamento, após descontos e créditos |
| **DAS** | Documento de Arrecadação do Simples — guia unificado do Simples Nacional |
| **Simples Híbrido** | Opção do Simples Nacional de recolher CBS/IBS fora do DAS para gerar crédito a clientes B2B |
| **Transição** | Período 2026–2033 de coexistência gradual entre o sistema atual e o IVA Dual |
| **Fator R** | Folha de pagamento ÷ faturamento (12 meses). Para atividades sujeitas, ≥ 28% → Anexo III; abaixo → Anexo V |
| **cAtivSN** | Código da atividade do Simples Nacional informado nas notas fiscais a partir de 2027 (catálogo da NT 2026.005, 01 a 14 e 90) |
| **tpRBSN** | Tipo de receita bruta do Simples (0 a 5 e 9): define se a receita entra no cálculo de CBS/IBS, em que fração e se fica suspensa |
| **PGDAS-D** | Programa que calcula o DAS e a alíquota efetiva do Simples; a calculadora oficial da RFB não o substitui |
| **Partilha do DAS** | Divisão percentual do DAS entre IRPJ, CSLL, CBS, CPP, IPI, ICMS/ISS e IBS, por anexo, faixa e ano |

---

## 13. Testes

```
npm test
```

Os testes (`tests/motor.test.mjs`, runner nativo do Node; o Vite, já instalado, carrega os módulos TypeScript do motor, sem dependência extra) cobrem o motor de cálculo: regressões dos casos conferidos à mão contra a lei (DAS com exportação, teto do ISS, 6ª faixa, livros, exportações no Lucro Presumido e Real) e invariantes dos dados (cada linha da partilha soma 100%; todo setor elegível ao Simples tem um `cAtivSN` coerente com o anexo do cálculo). Quando a lei mudar: regenerar a partilha (`python -I scripts/gerar_partilha_simples.py`) e rodar os testes.
