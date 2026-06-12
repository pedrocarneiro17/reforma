# ReformaCalc — Documentação Técnica e de Negócio

> **Versão:** Beta — baseado no PLP 68/2024 e LC 214/2025
> **Data:** Abril de 2026
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
| **PLP 68/2024** | Lei complementar que regulamentou as alíquotas, setores e regras do IVA Dual |
| **LC 214/2025** | Complementação com regras de transição, créditos e setores específicos |

---

## 3. O Novo Sistema Tributário — IVA Dual

### O que muda?

O Brasil substituirá **9 tributos** por **2 tributos não-cumulativos**:

| Tributos extintos | Substituído por |
|---|---|
| PIS + COFINS (federais) | **CBS** — Contribuição sobre Bens e Serviços |
| ICMS (estadual) + ISS (municipal) | **IBS** — Imposto sobre Bens e Serviços |
| IPI, IOF parcial, CIDE | **IS** — Imposto Seletivo (sobre produtos nocivos) |

### Alíquota padrão estimada: **28%** (CBS + IBS + IS)

Esta é a alíquota de referência usada no simulador, baseada nas estimativas do PLP 68/2024. A alíquota exata será fixada por Resolução do Comitê Gestor do IBS após 2025.

### Não-cumulatividade total

A principal vantagem do IVA Dual é a **não-cumulatividade plena**: a empresa desconta do imposto a pagar todo o IVA que já pagou na compra de insumos.

```
Imposto a recolher = (Faturamento × alíquota) − (Insumos × alíquota)
```

---

## 4. Cronograma de Transição (2026–2033)

O sistema atual não acaba de uma vez. A transição é gradual, com o novo IVA substituindo progressivamente os tributos antigos:

| Ano | % do novo sistema (IVA Dual) | % do sistema antigo |
|---|---|---|
| 2026 | 0% | 100% |
| 2027 | 15% | 85% |
| 2028 | 30% | 70% |
| 2029 | 45% | 55% |
| 2030 | 55% | 45% |
| 2031 | 70% | 30% |
| 2032 | 85% | 15% |
| 2033 | 100% | 0% |

**Fórmula do imposto na transição:**
```
Imposto(ano) = Imposto_atual × (1 − %novo) + Imposto_IVA × %novo
```

Em 2026 a empresa ainda paga 100% do regime atual. Em 2033, paga 100% do IVA Dual.

---

## 5. Reduções de Alíquota por Setor

O PLP 68/2024 criou faixas de redução para setores considerados essenciais:

| Faixa | Redução | Alíquota efetiva | Setores |
|---|---|---|---|
| **Isenção total** | 100% | 0% | Cesta básica, medicamentos essenciais, educação infantil/fundamental/médio, dispositivos para PCD, transporte público |
| **Redução 60%** | 60% | 11,2% | Hospitais, planos de saúde, educação superior, produtor rural PF, saneamento básico, atividades artísticas, insumos agropecuários, dispositivos médicos |
| **Redução 30%** | 30% | 19,6% | Profissões regulamentadas (médicos, advogados, engenheiros, contadores, psicólogos, etc.), agências de viagem, serviços financeiros, aviação civil |
| **Alíquota cheia** | 0% | 28% | Comércio varejista e atacadista, indústria geral, TI/SaaS, construção civil, restaurantes, hotéis, logística, imobiliário e maioria dos serviços |

**Fórmula da alíquota efetiva do setor:**
```
Alíquota IVA bruta = 28% × (1 − redução_do_setor)
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
IVA_bruto_mensal     = Faturamento_mensal × alíquota_IVA_bruta
Crédito_insumos      = Insumos_mensais × alíquota_IVA_bruta
IVA_líquido_mensal   = max(0, IVA_bruto - Crédito_insumos)
Alíquota_efetiva_IVA = IVA_líquido / Faturamento_mensal
```

### 7.3 Variação e Alerta de Preço

```
Variação_mensal (R$) = IVA_líquido - Imposto_atual
Variação_mensal (%)  = Variação_R$ / Imposto_atual × 100
```

Se o IVA ficar **mais caro**, o sistema calcula o reajuste de preço necessário para manter a mesma receita líquida:

```
Reajuste_preço (%) = [(1 − aliq_atual) / (1 − aliq_IVA_efetiva) − 1] × 100
```

**Lógica:** a receita líquida (após impostos) só se mantém se o preço for ajustado proporcionalmente à diferença entre as alíquotas.

### 7.4 Projeção da Transição (2026–2033)

Para cada ano, o sistema calcula quanto a empresa vai pagar considerando que o IVA entra gradualmente:

```
Imposto(ano) = Imposto_atual × (1 − TRANSICAO[ano]) + IVA_líquido × TRANSICAO[ano]
```

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

## 9. Setores Cadastrados (57 ao total)

O sistema cobre os seguintes grupos:

- **Isenção total (5 setores):** Cesta básica, medicamentos essenciais, educação básica, dispositivos PCD, transporte público
- **Redução 60% (11 setores):** Saúde, educação superior, produtor rural, saneamento, cultura, insumos agropecuários
- **Redução 30% (13 setores):** Profissões regulamentadas (medicina, direito, engenharia, contabilidade, etc.), turismo, financeiro
- **Alíquota cheia 28% (28 setores):** Varejo, atacado, indústria, TI, construção civil, restaurantes, hotéis, logística, imobiliário, beleza, academias, entre outros

---

## 10. Tecnologias Utilizadas

| Camada | Tecnologia |
|---|---|
| Framework frontend | React 18 |
| Build tool | Vite 5 |
| Estilização | Tailwind CSS v3 |
| Gráficos | Recharts 2 |
| Linguagem | JavaScript (ES2022) |

---

## 11. Limitações e Avisos

1. **Alíquota padrão de 28%** é estimativa. A alíquota real do IVA Dual será definida pelo Comitê Gestor após calibragem do sistema.
2. **Alíquotas do regime atual** são médias setoriais. Empresas com margens, benefícios fiscais ou deduções específicas terão valores diferentes — por isso o modo detalhado com dados reais é mais preciso.
3. **O IS (Imposto Seletivo)** sobre produtos nocivos (cigarro, bebidas alcóolicas, etc.) não está modelado separadamente — está embutido na alíquota padrão de 28%.
4. **Exportações:** recebem imunidade total no IVA Dual (não há CBS/IBS sobre exportações). No modo detalhado, exportações informadas são excluídas da base de cálculo.
5. O sistema **não considera** folha de pagamento, benefícios fiscais regionais (Zona Franca de Manaus, etc.) nem regimes específicos de setores regulados.
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
