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

### Alíquota de referência: **fixa ou variável?** Variável — o padrão de 26,5% é estimativa

A lei **não fixa** a alíquota (LC 214, arts. 14 e 18). O que existe:

- **A alíquota de referência é definida por resolução do Senado, ano a ano:** a CBS de 2027 a 2033 e o IBS (parte estadual e parte municipal) de 2029 a 2033, com base em cálculo do TCU (art. 349). Depois de 2035 valem as do ano anterior.
- **Cada ente pode legislar a sua:** a União fixa a CBS; cada estado e cada município fixa a sua parte do IBS, vinculando-a à de referência (mais ou menos pontos percentuais) ou não. Quem não legisla fica com a de referência. A alíquota do IBS de uma operação é a soma da do estado e a do município de destino (arts. 14 a 16).
- **Há reajustes:** mudança na legislação que reduza ou aumente a arrecadação obriga o Senado a recalcular as de referência (art. 19), e há limites ("teto de referência") que reduzem a CBS em 2030 e as de CBS e IBS em 2035 se a receita passar do teto (arts. 367 a 369).
- **2027 e 2028:** a CBS cobrada é a de referência menos 0,1 ponto percentual (art. 347), e o IBS é de teste (0,05% estadual + 0,05% municipal, art. 344).

**Situação em nov/2026 (reportagens; o texto oficial da resolução ainda não foi publicado):** o TCU aprovou em 28/10/2026 a CBS de referência de 2027 em **11,3%** (cálculo exato 11,3468%, processo TC 006.529/2026-7), que o Senado confirma por resolução até 15/12/2026; se não agir no prazo, vale o cálculo do TCU (art. 349 §2º). O IBS só será fixado até o fim de 2028. O Comitê Gestor estima, sem caráter oficial, CBS 9,21% + IBS 18,7% = 27,91%. Fontes: [ConJur, 28/10/2026](https://conjur.com.br/2026-out-28/tcu-propoe-aliquota-de-referencia-da-cbs-em-113-para-2027/), [Brasil 61](https://brasil61.com/n/reforma-tributaria-aliquota-da-cbs-deve-ser-definida-pelo-senado-ate-15-de-dezembro-bras2617397) e [Rádio Senado](https://www12.senado.leg.br/radio/1/noticia/2026/04/30/aliquotas-de-bens-e-servicos-e-do-imposto-seletivo-devem-ser-fixadas-este-ano). A Brasil 61 também cita um teto de 26,5% para 2033, sem dizer se é só da CBS ou da soma; não achei esse número no texto da LC 214.

**No simulador:** o padrão continua **26,5% no total e 9,25% de CBS** (estimativas), mas o campo "Alíquota de referência de IBS + CBS" (formulário, seção avançada) permite trocar os dois valores, com atalhos para a estimativa do Comitê Gestor (27,91%) e a CBS de 11,3% do TCU.
- **Total** define débito, crédito, reduções por setor (40% de redução = 60% da alíquota informada), a carga de 2033, o híbrido e a comparação entre regimes.
- **Parte da CBS** só muda como o IVA se divide na transição de 2027 a 2032 (a CBS entra em 2027 e o IBS só em 2029); a carga de 2033 depende apenas do total.
- O resultado, a memória de cálculo, o comparador, o simulador de crescimento e o assistente usam o valor informado e dizem de onde ele veio.
- **Por que o padrão não virou 11,3% de CBS:** o número do TCU é de 2027, ainda depende da resolução do Senado (até 15/12/2026) e o IBS não foi fixado. Depois da resolução, vale trocar o padrão.
- 9,25% de total não representa a reforma (é a soma de PIS e COFINS de hoje): o atalho existe só para reproduzir cenários de terceiros, e a tela avisa.
- A análise da Holding Patrimonial ainda usa 26,5% fixo.

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
| Serviços / Misto | 12,34% | PIS/COFINS 6,94% (créditos de 25% da receita) + ISS 3% + IRPJ/CSLL 2,4% (margem de 10%) |
| Comércio | 15,10% | PIS/COFINS 3,7% + ICMS 10,2% + IRPJ/CSLL 1,2% (margem de 5%) |
| Indústria | 11,70% | PIS/COFINS 3,7% + ICMS 4,8% + IPI 2% + IRPJ/CSLL 1,2% (margem de 5%) |

Quando o usuário informa folha, despesas, ICMS ou ISS, o motor apura o Lucro Real efetivo e a tabela deixa de valer. Em qualquer dos dois casos a projeção 2026–2033 parte da carga de hoje e termina na carga total pós-reforma (IVA líquido + IRPJ/CSLL + contribuição previdenciária): PIS/COFINS e ICMS/ISS saem da conta no fim da transição. Um teste confere isso em todos os setores e regimes.

> **Fonte das alíquotas:** Tabelas do Simples Nacional vigentes, Decreto nº 9.580/2018 (RIR) e Instrução Normativa da Receita Federal. São **médias aproximadas** — a alíquota real varia conforme a margem de lucro, benefícios fiscais e deduções de cada empresa.

### 6.4 Simples Nacional na transição

- **DAS total constante.** Os Anexos I–V da LC 214/2025 mantêm as alíquotas nominais e as parcelas a deduzir de 2027 a 2033. Só a partilha interna muda: PIS/COFINS → CBS e ICMS/ISS → IBS.
- **Partilha oficial por ano e faixa.** As tabelas dos Anexos I–V (LC 214/2025, redação da LC 227/2026) estão em `src/data/partilhaSimples.ts`, **gerado** por `python -I scripts/gerar_partilha_simples.py` a partir do texto da lei. Não editar à mão.
- **6ª faixa em 2027–2028.** Alíquota nominal 0,1 p.p. menor (art. 347 da LC 214).
- **Teto do ISS na 5ª faixa (Anexos III e IV).** Acima de 14,925% (III) ou 12,5% (IV) de alíquota efetiva, o ISS fica limitado e o excedente vai para os demais tributos. No **regime atual** (até 2026) o teto é de 5% e o excedente vai só para os federais (LC 123, art. 18 §1º-B, I; Anexos na redação da LC 155/2016). Na **transição** o teto é de 5% em 2027–2028 e de 4,5%, 4%, 3,5% e 3% de 2029 a 2032, com parte do excedente indo para o IBS (LC 214). Em 2033 não há nota. Os Anexos I, II e V não têm essa regra.
- **Anexo por atividade.** Pode ser fixado por lei (advocacia, limpeza e vigilância → IV), padrão do setor e editável (construção → IV; reformas podem ir ao III) ou depender do **Fator R** (folha ÷ faturamento ≥ 28% → Anexo III, senão V).
- **Anexo IV.** A CPP patronal (20%) é paga fora do DAS, sobre folha e pró-labore.
- **Catálogo de atividades (`cAtivSN`).** 15 códigos (01 a 14 e 90) da NT 2026.005 em `src/data/atividadesSimples.ts`. Cada setor mostra o código que irá na nota fiscal a partir de 2027.
- **Tipos de receita (`tpRBSN`)** em `src/data/tiposReceitaSimples.ts`. Exportação direta (tipo 3) não paga a parcela de tributos sobre consumo do DAS; exportação indireta (tipo 4) é calculada e suspensa; livros, jornais e periódicos, radiodifusão aberta e combustíveis já tributados na etapa monofásica (tipo 2) não pagam CBS/IBS. Na indústria (Anexo II), a exportação também não paga o IPI. IRPJ, CSLL e CPP continuam. Nada disso se aplica quando a alíquota vem do PGDAS-D, que já separa as receitas.
- **Exportação tem faixa própria.** Pelo art. 3º §15 da LC 123, as receitas do mercado interno e da exportação são consideradas **separadamente** para determinar a alíquota: cada uma usa o seu RBT12. A receita interna paga a alíquota da faixa do RBT12 do mercado interno; a exportada paga só IRPJ, CSLL e CPP (o art. 18 §14 reduz PIS/COFINS, IPI, ICMS e ISS) pela alíquota do RBT12 da exportação. O limite de R$ 4,8 milhões também vale para cada mercado (art. 3º §14). O DAS com os dois mercados é a soma do DAS de duas empresas independentes, uma só interna e outra só exportadora (verificado em teste).
- **Sublimite de R$ 3,6 milhões.** Com RBT12 do mercado interno acima disso, a empresa fica impedida de recolher ICMS e ISS no Simples (LC 123, art. 20 §1º) e os paga por fora, pelas regras normais; a 6ª faixa das tabelas já não tem essas parcelas. O simulador soma esse valor à carga de hoje (ICMS por débito/crédito, com a UF informada ou uma média; ISS médio de 3%). Com a reforma, o ICMS/ISS por fora caem 10% ao ano (2029–2032) e o **IBS regular** entra no lugar, integral em 2033; a CBS continua dentro do DAS, como no tratamento da Receita para o "excesso de sublimite".
- **Vedações.** Atividades impedidas de optar pelo Simples (LC 123, art. 17 — por exemplo geração, distribuição e comercialização de energia elétrica, serviços financeiros) e o produtor rural pessoa física aparecem como inaplicáveis.

### 6.5 Hotelaria e receita mista (hotel com restaurante e bar)

- **Anexo da hospedagem.** O setor "Hotéis, Pousadas, Flats e Temporada" usa o **Anexo III** por padrão, sem Fator R. O art. 18 da LC 123 não lista a hospedagem entre as atividades do Fator R nem do Anexo IV/V, e o §5º-F manda o resto dos serviços para o Anexo III. Não achei item expresso para hospedagem no texto da lei; confirme no PGDAS-D. A seleção manual do anexo continua valendo.
- **Receita mista.** Hospedagem (Anexo III) e a venda de mercadoria (Anexo I) usam o par `anexoSimples`/`anexoSimples2` com `pctAnexo1`. Os dois anexos usam o mesmo RBT12.
- **Redução de 40% só no que é regime específico.** Hospedagem e alimentação preparada no estabelecimento têm 40% de redução (arts. 275, 280 p.u. e 281 da LC 214). **Bebidas alcoólicas** e bebidas ou alimentos comprados de terceiros e vendidos sem preparo (água, refrigerante, suco de lata) ficam fora (art. 273 §2º) e pagam a alíquota cheia. O campo `pctReceitaAliquotaCheia` (hotelaria e restaurantes) informa essa fatia; a alíquota do débito é a média ponderada.
- **Crédito das compras.** O crédito é o imposto que o fornecedor cobrou, não a alíquota das vendas do próprio setor. Hotelaria e parques compram manutenção, energia e serviços com alíquota cheia: o crédito usa 26,5% (a redução de 40% é só das vendas, art. 281). Restaurantes mantêm o padrão antigo, a alíquota das próprias vendas (15,9%), como média, porque compram muito alimento básico.
- **Composição das compras (hotelaria, restaurantes e parques).** Campo opcional "Informar a composição das minhas compras": % em alimentos da cesta básica (alíquota zero, sem imposto e sem crédito), % em alimentos com 60% de redução do Anexo VII (crédito de 10,6%) e o restante a 26,5%. Sem informar, vale o padrão do setor. Com a composição, o crédito médio é `reduzidos × 10,6% + cheio × 26,5%`; zero + reduzido nunca passa de 100%. Combina com o campo de compras de fornecedores do Simples (essa fatia credita só a CBS do DAS do fornecedor). Um hotel ou restaurante que compra metade das compras em carnes e hortifrúti tem crédito bem menor que os 26,5% cheios.
- **Híbrido = DAS sem a parcela de consumo + IVA líquido.** O DAS que sobra paga IRPJ, CSLL e CPP. Comparar o DAS inteiro com só o IVA líquido do híbrido, como fez o relatório da IA do caso do hotel, subestima o custo do Simples e inverte a conclusão.
- **Compradores não creditam** hospedagem nem alimentação de restaurante (arts. 276 e 283): o ganho comercial do híbrido (cliente creditar o IVA cheio) não existe aqui.
- **O que ainda não está:** a alíquota de referência é fixa em 26,5% (estimativa); não há campo para simular outra (por exemplo 9,25%, que é a soma de PIS e COFINS, não de CBS e IBS).

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

**O que cresce junto com o faturamento:** insumos, exportações e despesas operacionais (base do Lucro Real). **O que fica fixo:** folha (por isso o Fator R cai ao crescer, podendo levar do Anexo III ao V), venda de imobilizado e créditos adicionais informados. É uma premissa de modelagem, não regra legal.

### 8.5 Simples Nacional Híbrido

Para empresas no Simples com clientes B2B, o sistema avalia se vale optar pelo **Simples Híbrido** (pagar CBS+IBS fora do DAS), que permite ao cliente B2B se creditar do IVA:

```
IVA_híbrido_líquido           = max(0, Faturamento × alíq_IVA − Crédito_insumos)
Custo_adicional               = IVA_híbrido − Imposto_DAS
Crédito_disponibilizado_ao_cliente = Faturamento × alíq_IVA
```

Vale a pena quando o crédito gerado ao cliente ≥ custo adicional para a empresa.

### 8.6 Assistente de perguntas

Botão "Assistente" no canto da tela. O usuário pergunta em português ("quanto pago em 2033?", "e se meu faturamento dobrar?", "o que diz o art. 283?") e o assistente responde com base na simulação aberta.

**Regra de ouro: a IA não calcula imposto.** Ela só entende a pergunta, chama o motor e explica o resultado. Todo número vem de `calcularTodosOsCenarios`, `calcularTodosOsRegimes` ou `calcularCurvaCrescimento`, as mesmas funções (e os mesmos testes) do simulador.

**Como funciona**
- O navegador manda só texto (a conversa e os dados da simulação aberta) para `POST /api/assistente`, que exige login (JWT).
- O servidor monta o pedido à API de mensagens da Anthropic e roda o laço de ferramentas. O navegador nunca manda instruções de sistema nem resultados de ferramenta: o servidor ignora tudo que não seja texto de usuário/assistente.
- Ferramentas do motor (`src/assistente/ferramentas.ts`): `listar_setores`, `calcular_cenarios`, `comparar_regimes`, `simular_crescimento`. A entrada é validada (setor existente, números dentro de faixas); erro volta à IA como dado, para ela corrigir a chamada.
- Ferramentas de lei (`server/assistente/lei.js`): `buscar_na_lei` e `consultar_artigo`, sobre os textos da LC 214/2025 e do Decreto 12.955/2026 em `.claude/skills/reforma-tributaria`. A IA é instruída a só citar artigo que a consulta devolveu. Esses textos têm acentos gravados com a codificação errada; a leitura corrige.
- O pacote do motor para o servidor é gerado por `npm run build:engine` (saída em `server/gerado/`, fora do git). `npm run build` e `npm run dev:all` já fazem isso.

**Configuração (variáveis de ambiente)**
- `ANTHROPIC_API_KEY`: obrigatória. Sem ela o botão não aparece. Na Railway, cadastre em Variables; nunca coloque a chave no código nem no navegador.
- `ASSISTENTE_MODELO`: opcional (padrão `claude-sonnet-5-5`).
- `ASSISTENTE_LIMITE_HORA`: opcional, perguntas por usuário por hora (padrão 30; contado em memória, zera ao reiniciar o servidor).

**Limites de segurança:** até 20 mensagens de histórico, 4.000 caracteres por mensagem, 6 idas e vindas de ferramentas por pergunta, 60 s de espera pela API. O servidor não registra o conteúdo das conversas, só o status de erro.

**Privacidade:** a pergunta e os dados da simulação (faturamento, regime, setor etc.) vão para a API da Anthropic. Confirme com o escritório se isso é aceitável antes de ativar em produção. O assistente não lê notas fiscais nem CNPJs.

**O que o assistente ainda não faz:** ler arquivos (PDF, CSV), mudar os dados do formulário, simular alíquota de referência diferente de 26,5%, nem calcular o adiamento de 20% do sublimite. Quando a pergunta cai nesses casos, ele é instruído a dizer isso em vez de adivinhar.

**Rede de segurança:** se um dia a projeção ano a ano e a carga total de 2033 divergirem (o motor garante que não, em teste), o assistente recebe um alerta e deve citar a carga total de 2033.

### 8.7 Importar CSV do Único

Caixa "Importar CSV do Único" no formulário, ao lado da importação do PGDAS-D. Aceita a exportação de **Produtos** do Único (entradas, saídas, serviços prestados e serviços tomados). O arquivo é lido no navegador e descartado: nada é enviado nem salvo.

**O que faz.** Soma e classifica; **não calcula imposto** (quem calcula é o motor). Mostra um resumo para conferir e, ao clicar em "Aplicar ao formulário", preenche faturamento médio mensal, compras consideradas para crédito, setor (hotelaria, quando a hospedagem é metade ou mais da receita), anexos III/I, % da receita por anexo, % de itens de alíquota cheia e % de compras sem destaque. Regime atual e perfil de clientes não estão no arquivo: o usuário escolhe.

**Leitura.** Detecta UTF-8 ou Windows-1252; separador `;`; números brasileiros (`1.144,96`) e o formato do Excel (`="00"`). Reconhece as colunas pelo nome. Documentos cancelados são ignorados. Descontos das entradas são abatidos: o crédito vale sobre o valor efetivamente pago.

**Receita** (por NCM e descrição): hospedagem (serviço emitido com "hospedagem" na descrição); bebidas alcoólicas (NCM 2203 a 2208); bebidas e alimentos de terceiros sem preparo (2201, 2202, 2009); alimentação preparada (descrição como "café da manhã", "refeição", "almoço"); o resto é "outras mercadorias" e entra como alíquota cheia, por prudência.

**Entradas.** Natureza pelo CFOP (uso e consumo 1.407/1.556, ativo 1.551/2.551, revenda 1.102/1.403, combustíveis 1.653, serviços tomados, outras). Situação do crédito pelos campos de IBS/CBS que o próprio arquivo traz:
- *com destaque*: há base e valor de IBS/CBS na nota;
- *sem destaque*: o fornecedor não destacou (Simples, MEI ou sem informação). O motor trata como fornecedor do Simples, com crédito parcial;
- *monofásico*: gás e combustíveis, com regra própria de crédito; ficam fora por padrão;
- *alíquota zero*: base sem imposto; fora por padrão.

O usuário marca quais situações contam como base de crédito antes de aplicar. O IBS/CBS destacado de 2026 é do ano-teste (0,9% + 0,1%): serve para saber quem destaca, não é o crédito de 2033.

**Suposições que o resumo avisa:** o período do arquivo (menos de 12 meses não dá o RBT12 exato), a alimentação preparada reconhecida pela descrição, o Anexo I para as mercadorias e o Anexo III para a hospedagem (confirme no PGDAS-D).

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

1. **Alíquota padrão de 26,5%** é estimativa de mercado e pode ser alterada no formulário. A real será definida por resolução do Senado, ano a ano, e cada ente pode legislar a sua (seção 3). O simulador usa uma alíquota única para todo o país, sem a diferença entre estados e municípios.
2. **Alíquotas do regime atual** são médias setoriais. Empresas com margens, benefícios fiscais ou deduções específicas terão valores diferentes — por isso o modo detalhado com dados reais é mais preciso.
3. **O IS (Imposto Seletivo)** sobre produtos nocivos (cigarro, bebidas alcoólicas etc.) não é calculado: as alíquotas serão fixadas por lei ordinária. O simulador apenas sinaliza os setores sujeitos a ele.
4. **Exportações:** são imunes de IBS/CBS (art. 79 da LC 214) com manutenção dos créditos. No Simples, a receita exportada não paga a parcela de tributos sobre consumo do DAS (seção 6.4). Quando a alíquota vem do PGDAS-D, o simulador assume que as receitas já foram separadas.
5. O simulador considera **folha de pagamento** (Fator R, CPP do Anexo IV, contribuição previdenciária no Presumido e no Real) e alguns regimes específicos (imóveis, Zona Franca, regime automotivo). Não cobre benefícios fiscais regionais, nem todos os regimes especiais de setores regulados.
6. **Transportador autônomo de carga (PF):** tratado como **não contribuinte** de IBS/CBS (LC 214, art. 26, VII, e art. 169; o cClassTrib oficial 410015 confirma): IVA zero, e os clientes contribuintes apropriam crédito presumido. A opção pelo regime regular (art. 26 §1º, V) não é modelada. **Nanoempreendedor** (pessoa física com receita anual abaixo de 50% do limite do MEI, hoje R$ 40.500, que não aderiu ao MEI) também não é contribuinte (art. 26, IV). Acima desse porte, o profissional liberal PF **é** contribuinte (art. 21, I, c), sem outro corte de faturamento: os R$ 240 mil valem só para operações com imóveis (art. 251).
7. **Teto do ISS no Simples:** modelado no regime atual e na transição. Os percentuais do teto do regime atual são consequência aritmética da regra do art. 18 §1º-B, I, e da tabela de partilha (verificado em teste). A tabela de partilha e as alíquotas nominais vêm da redação da LC 155/2016 (texto do Planalto, que não é o publicado no Diário Oficial) e coincidem com a tabela de 2033 da LC 214. Não foram comparadas com um texto consolidado de 2026 que considere alterações posteriores: veja a seção 14 para conferir.
8. **Sublimite de R$ 3,6 milhões (estimativas):** o ICMS/ISS por fora do DAS é uma **estimativa** (a apuração real depende das operações, de substituição tributária, benefícios e créditos), e o IBS regular é o IVA líquido × (1 − fatia da CBS). Não é modelado o adiamento ao ano seguinte quando o excesso é de até 20% (art. 20 §1º-A). A regra de faixa separada por mercado e o limite por mercado vêm do texto das LC 147/2014 e 155/2016 no Planalto (não consolidado); o regulamento do Comitê Gestor (Resolução CGSN 140/2018) e o manual do PGDAS-D não foram lidos, então vale conferir com um extrato real (seção 14).
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

`tests/unico.test.mjs` cobre o importador do CSV do Único com um arquivo sintético (sem dados de cliente): leitura e codificação, classificação por CFOP/NCM/campos de IBS/CBS, totais, desconto e cancelados, a sugestão para o formulário e a execução dela no motor.

`tests/assistente.test.mjs` cobre o assistente sem rede e sem chave: as ferramentas devolvem exatamente o que o motor calcula, recusam entrada inválida, a consulta à lei traz o texto certo (art. 273, 283) e o laço da conversa roda contra uma API simulada (execução de ferramenta, limite de voltas, regras de sistema que o cliente não consegue trocar, limite por usuário).

---

## 14. Como conferir os números sem um contador

1. **Compare com um PGDAS-D real (a conferência mais forte).** Pegue o extrato do PGDAS-D de uma empresa do Simples e compare: o DAS do extrato deve bater com o do simulador (o app importa o PDF do extrato). Na 5ª faixa dos Anexos III e IV, com alíquota efetiva acima de 14,925% (III) ou 12,5% (IV), o ISS do extrato deve ser **5% da receita**, e o restante vai para os tributos federais.
2. **Leia o texto da lei.** A LC 123/2006 está consolidada em `planalto.gov.br/ccivil_03/leis/lcp/lcp123.htm` (art. 18 §1º-B; os Anexos I a V ficam no fim da página) e a LC 155/2016, que reescreveu os anexos, em `planalto.gov.br/ccivil_03/leis/lcp/Lcp155.htm`. O Portal do Simples Nacional da Receita (`www8.receita.fazenda.gov.br/simplesnacional`) traz a legislação e a Resolução CGSN 140/2018, que é o regulamento do regime.
3. **A aritmética já está nos testes.** O teto do ISS e seus percentuais saem da regra da lei e da tabela de partilha, e `npm test` confere isso, além de cada linha das tabelas dos cinco anexos contra a LC 155 e a LC 214.
4. **A LC 214 está no projeto.** O texto dela e do Decreto 12.955 fica em `.claude/skills/reforma-tributaria/`, e a tabela de partilha de 2033 da LC 214 é idêntica à de hoje (LC 123).
