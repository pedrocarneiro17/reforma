# Documentação Compacta — Reforma Tributária Brasileira (LC 214/2025)
> Base legal: LC 214/2025 · LC 227/2026 · Decreto 12.955/2026 · EC 132/2023
> Alíquota padrão IVA Dual: **26,5%** (CBS federal + IBS subnacional)

---

## 1. CRONOGRAMA DE TRANSIÇÃO

| Ano  | Status CBS |
|------|-----------|
| 2026 | Apuração informativa (dispensa de recolhimento — Art. 464 Dec. 12.955) |
| 2027 | CBS entra em vigor (substitui PIS/COFINS integralmente) |
| 2027–2032 | Período de transição gradual CBS+IBS vs tributos antigos |
| 2033 | IVA Dual 100% vigente |

**Motor do sistema** usa constante `TRANSICAO` com percentual IVA por ano:
```
2026: 0%  2027: 10%  2028: 25%  2029: 40%  2030: 60%  2031: 75%  2032: 90%  2033: 100%
```
Imposto anual = (impostoAtual × (1-pct)) + (impostoIVA × pct)

---

## 2. ALÍQUOTAS CBS+IBS POR CATEGORIA

### 2.1 Alíquota Zero (reducao: 1.00)
- **Cesta Básica Nacional de Alimentos** — Anexo I LC 214/2025 (frutas, hortaliças, carnes, ovos, etc.)
- **Medicamentos** — lista específica Anexo XIV LC 214/2025
- **Dispositivos médicos e de acessibilidade** — Seção II/III Dec. 12.955
- **Produtos cuidados saúde menstrual**
- **Automóveis para PcD e taxistas**
- **ICT sem fins lucrativos**
- **Transporte público urbano** (metrô, VLT, trem, barcas — Art. 285 LC 214)
- **Exportações** — imunes

### 2.2 Redução 70% (reducao: 0.70) — alíquota efetiva ≈ 7,95%
- **Locação, arrendamento e cessão de imóveis** — Art. 261 LC 214/2025 (inclui holding patrimonial)

### 2.3 Redução 60% (reducao: 0.60) — alíquota efetiva ≈ 10,6%
Prevista no Art. 203 LC 214/2025 para:
- Serviços de **educação** (todos os níveis — Anexo II)
- Serviços de **saúde** (hospitais, clínicas, consultórios, laboratórios)
- **Dispositivos médicos** e de acessibilidade para PcD
- **Medicamentos** (lista geral — distintos dos de alíquota zero do Anexo XIV)
- **Alimentos** destinados ao consumo humano (fora da Cesta Básica)
- **Higiene pessoal e limpeza** majoritariamente consumidos por baixa renda (Anexo XVI)
- **Produtos agropecuários, pesqueiros, florestais in natura**
- **Insumos agropecuários e aquícolas**
- **Produções artísticas, culturais, jornalísticas e audiovisuais** nacionais
- **Comunicação institucional**
- **Atividades desportivas** (educação desportiva NBS 1.2205.12.00 e clubes/associações — Art. 217; NÃO academias comerciais)
- **Soberania e segurança nacional/cibernética**
- **Fisioterapia, psicologia, odontologia, medicina** (profissões de saúde com redução 60% — distinto das 30%)
- **Produtor rural PF**

### 2.4 Redução 50% (reducao: 0.50) — alíquota efetiva ≈ 13,25%
- **Construção civil com material / incorporação imobiliária** — Art. 203 LC 214
  - Patrimônio de afetação (RET): alíquota específica 2,08% sobre receita (Art. 461 Dec.)

### 2.5 Redução 40% (reducao: 0.40) — alíquota efetiva ≈ 15,9%
- **Hotéis, pousadas e hospedagem**
- **Restaurantes, bares e alimentação**
- **Parques de diversão e eventos** (Art. 413: alimentação/serviços avulsos dentro do parque = alíquota cheia)
- **Aviação civil regional** (Art. 287 LC 214)
- **Transporte rodoviário intermunicipal/interestadual** (Art. 286 LC 214)

### 2.6 Redução 30% (reducao: 0.30) — alíquota efetiva ≈ 18,55%
**Art. 202 Dec. 12.955** — profissionais intelectuais com fiscalização por conselho, prestando serviço como PF ou empresa uniprofissional:
administradores, advogados, arquitetos, assistentes sociais, bibliotecários, biólogos, contabilistas, economistas, ed. física, engenheiros/agrônomos, estatísticos, médicos veterinários/zootecnistas, museólogos, químicos, relações públicas, técnicos industriais, técnicos agrícolas.

### 2.7 Regimes Específicos
- **Combustíveis** (Cap. I): **monofásico** — CBS recolhida pelo produtor/distribuidor; posto varejista não recolhe CBS/IBS na saída. Alíquota por unidade de medida fixada em ato específico.
- **Serviços financeiros** (Cap. II): alíquota especial 10,85% (IBS+CBS) em 2027-2028 → crescente até 2033. Base de cálculo diferente (receitas brutas específicas). Inclui bancos, financeiras, seguros, câmbio, títulos, consórcios, previdência privada.
- **Planos de assistência à saúde** (Cap. III): regime específico com alíquota diferenciada sobre prêmios.
- **Concursos de prognósticos/Bets** (Cap. IV): base = GGR (receita bruta após dedução de prêmios pagos).

### 2.8 Regimes Diferenciados Especiais
- **Bens usados adquiridos de PF para revenda** (Cap. X): CBS incide só sobre a **margem** (preço_venda − preço_compra_PF). Alíquota efetiva ≈ 26,5% × margem.
- **Reciclagem/logística reversa de PF/cooperativas** (Cap. IX): crédito presumido.
- **Transportador autônomo de carga PF** (Cap. VIII): crédito presumido.
- **Produtor rural PF não contribuinte** (Cap. VII): crédito presumido ao comprador.

### 2.9 Alíquota Cheia (reducao: 0.00) — 26,5%
Todos os setores não listados acima: comércio varejista, atacado, e-commerce, indústria geral, TI/SaaS, consultoria, marketing, beleza, segurança, limpeza, RH, logística, imobiliário (corretagem), agências de viagem, etc.

---

## 3. ALÍQUOTAS DETALHADAS POR REGIME

### 3.A MEI — DAS Fixo Mensal (2026)
| Tipo | INSS | ICMS | ISS | Total |
|------|------|------|-----|-------|
| Comércio | R$81,05 | R$1,00 | — | **R$82,05** |
| Indústria | R$81,05 | R$1,00 | R$5,00 | **R$87,05** |
| Serviço | R$81,05 | — | R$5,00 | **R$86,05** |

Limite: R$81.000/ano. Alíquota efetiva depende do faturamento (DAS fixo ÷ receita).

---

### 3.B Simples Nacional — Alíquota Efetiva por Faixa
Fórmula: `alíquota_efetiva = (RBT12 × nominal − dedução) / RBT12`

**Anexo I — Comércio:**
| Faixa RBT12 (R$) | Nominal | Dedução | Efetiva aprox. |
|---|---|---|---|
| Até 180.000 | 4,00% | 0 | 4,00% |
| 180.001 – 360.000 | 7,30% | 5.940,00 | 5,65%–7,13% |
| 360.001 – 720.000 | 9,50% | 13.860,00 | 7,57%–9,12% |
| 720.001 – 1.800.000 | 10,70% | 22.500,00 | 9,45%–10,45% |
| 1.800.001 – 3.600.000 | 14,30% | 87.300,00 | 11,87%–13,87% |
| 3.600.001 – 4.800.000 | 19,00% | 378.000,00 | 14,10%–18,21% |

**Anexo II — Indústria:**
| Faixa RBT12 (R$) | Nominal | Dedução |
|---|---|---|
| Até 180.000 | 4,50% | 0 |
| 180.001 – 360.000 | 7,80% | 5.940,00 |
| 360.001 – 720.000 | 10,00% | 13.860,00 |
| 720.001 – 1.800.000 | 11,20% | 22.500,00 |
| 1.800.001 – 3.600.000 | 14,70% | 85.500,00 |
| 3.600.001 – 4.800.000 | 30,00% | 720.000,00 |

**Anexo III — Serviços (padrão; usado quando Fator R ≥ 28%):**
| Faixa RBT12 (R$) | Nominal | Dedução |
|---|---|---|
| Até 180.000 | 6,00% | 0 |
| 180.001 – 360.000 | 11,20% | 9.360,00 |
| 360.001 – 720.000 | 13,20% | 17.640,00 |
| 720.001 – 1.800.000 | 16,00% | 35.640,00 |
| 1.800.001 – 3.600.000 | 21,00% | 125.640,00 |
| 3.600.001 – 4.800.000 | 33,00% | 648.000,00 |

**Anexo V — Serviços específicos (usado quando Fator R < 28%):**
| Faixa RBT12 (R$) | Nominal | Dedução |
|---|---|---|
| Até 180.000 | 15,50% | 0 |
| 180.001 – 360.000 | 18,00% | 4.500,00 |
| 360.001 – 720.000 | 19,50% | 9.900,00 |
| 720.001 – 1.800.000 | 20,50% | 17.100,00 |
| 1.800.001 – 3.600.000 | 23,00% | 62.100,00 |
| 3.600.001 – 4.800.000 | 30,50% | 540.000,00 |

**Fator R** = folha_mensal / faturamento_mensal. Limiar: 28%. Abaixo → Anexo V; acima → Anexo III.
Setores com `fatorR: true` no sistema: advocacia, contabilidade, engenharia/arquitetura, TI, consultoria, RH, marketing, medicina, odontologia, psicologia, fisioterapia, nutrição, veterinária, imobiliário, academias.

---

### 3.C Lucro Presumido — Alíquotas Efetivas

**Fórmula base:** `IRPJ = 15% × presunção_IRPJ` | `CSLL = 9% × presunção_CSLL` | PIS 0,65% + COFINS 3,00% (cumulativo)

| Tipo de setor | Presunção IRPJ | Presunção CSLL | IRPJ | CSLL | PIS+COFINS | Outros | **Total** |
|---|---|---|---|---|---|---|---|
| Serviço geral | 32% | 32% | 4,80% | 2,88% | 3,65% | ISS 3% | **≈14,33%** |
| Construção c/ material | 8% | 12% | 1,20% | 1,08% | 3,65% | ISS 2% | **≈7,93%** |
| Transporte de cargas | 8% | 12% | 1,20% | 1,08% | 3,65% | ICMS-T var. | **≈5,93%+** |
| Comércio | 8% | 12% | 1,20% | 1,08% | 3,65% | ICMS 12% | **≈17,93%** |
| Indústria | 8% | 12% | 1,20% | 1,08% | 3,65% | ICMS 12%+IPI 5% | **≈22,93%** |

**IRPJ Adicional (10%)**: incide sobre a parcela do lucro presumido que excede R$20.000/mês.
- Serviço: lucro presumido = faturamento × 32% → adicional quando faturamento > R$62.500/mês
- Comércio/indústria: lucro presumido = faturamento × 8% → adicional quando faturamento > R$250.000/mês

**Exceções com `presuncaoLPIRPJ` / `presuncaoLPCSLL` override no setor:**
- `construcao_civil`: IRPJ 8%, CSLL 12%
- `logistica_transporte`: IRPJ 8%, CSLL 12%

---

### 3.D Lucro Real — Alíquotas Efetivas Estimadas

| Tipo | PIS+COFINS líquido | ISS/ICMS líquido | IRPJ | CSLL | **Total estimado** |
|---|---|---|---|---|---|
| Serviço | 6,94% (9,25% − créditos 25%) | ISS 3,00% | 1,50% | 0,90% | **≈12,34%** |
| Comércio | 3,70% (9,25% − créditos 60%) | ICMS 10,20% (17%−créditos 40%) | 0,75% | 0,45% | **≈15,10%** |
| Indústria | 3,70% | ICMS 4,80%+IPI 2,00% | 0,75% | 0,45% | **≈11,70%** |

Premissas: margem líquida 10% serviços / 5% comércio-indústria; créditos PIS/COFINS sobre 25–60% da receita.
**IRPJ Adicional (10%)**: sobre lucro real > R$20.000/mês (margem estimada aplicada).
**JCP**: deduz da base de IRPJ+CSLL. PL × TJLP/12 por mês. Economia ≈ 24% do JCP.

---

### 3.E Profissional Liberal (PF) — IRPF 2026

**Tabela progressiva mensal (base Lei 15.270/2025):**
| Faixa de rendimento (R$/mês) | Alíquota | Dedução (R$) |
|---|---|---|
| Até 3.036,00 | — | — |
| 3.036,01 – 3.761,26 | 7,5% | 228,19 |
| 3.761,27 – 5.316,46 | 15% | 686,78 |
| 5.316,47 – 7.087,22 | 22,5% | 1.303,82 |
| Acima de 7.087,22 | 27,5% | 1.830,29 |

**Desconto especial Lei 15.270/2025:**
- Até R$5.000/mês → **isenção total**
- R$5.001 – R$7.350 → desconto proporcional decrescente
- Acima R$7.350 → tabela plena sem desconto

**Carga total PF:** IRPF + INSS (20%, teto R$8.157,41 → máx R$1.631/mês) + ISS 3%

---

### 3.F INSS — Resumo por Modalidade (2026)

| Modalidade | Alíquota | Teto base | Máximo mensal |
|---|---|---|---|
| Contribuinte individual (autônomo/PF) | 20% | R$8.157,41 | R$1.631,48 |
| Sócio-administrador (empregado da empresa) | 20% | R$8.157,41 | R$1.631,48 |
| INSS Patronal (empresa sobre pró-labore) | 20% | sem teto | ilimitado |
| MEI | 5% s/ salário mínimo | R$1.621,00 | R$81,05 |

---

## 4. REGIMES TRIBUTÁRIOS ATUAIS

### 4.1 MEI (visão geral)
- DAS fixo mensal: Comércio R$82,05 | Indústria R$87,05 | Serviço R$86,05 (valores 2026)
- Limite: R$81.000/ano (R$6.750/mês)
- Não gera crédito de IVA para clientes

### 4.2 Simples Nacional
- Limite: R$4.800.000/ano
- **Regra do grupo societário** (LC 123 Art. 3º §4º): sócio com ≥10% em outra empresa → faturamentos somam. Se soma > R$4,8M → todas desenquadradas.
- Alíquotas por anexo (faturamento acumulado 12 meses):
  - Anexo I (Comércio): 4,0% → 19,0%
  - Anexo II (Indústria): 4,5% → 30,0%
  - Anexo III (Serviços geral): 6,0% → 33,0%
  - Anexo V (Serviços específicos): 15,5% → 30,5%
- **Fator R**: folha/faturamento ≥ 28% → Anexo III; < 28% → Anexo V
- **Simples Híbrido**: empresa opta por recolher CBS/IBS por fora do DAS para gerar crédito integral a clientes B2B (regulamentação prevista para 2027)
- Crédito gerado para compradores: ~5,88% (CBS proporcional média Anexos I-V)

### 4.3 Lucro Presumido (LP)
Presunções IRPJ/CSLL por tipo (Art. 15 §1º Lei 9.249/1995):

| Tipo | IRPJ presunção | CSLL presunção | IRPJ% | CSLL% | PIS | COFINS | Total base |
|------|---------------|----------------|--------|--------|-----|--------|-----------|
| Serviço geral | 32% | 32% | 4,80% | 2,88% | 0,65% | 3,00% | +ISS 3% ≈ 14,33% |
| Construção com material | 8% | 12% | 1,20% | 1,08% | 0,65% | 3,00% | +ISS 2% ≈ 7,93% |
| Transporte de cargas | 8% | 12% | 1,20% | 1,08% | 0,65% | 3,00% | ≈ 5,93%+ICMS-T |
| Comércio | 8% | 12% | 1,20% | 1,08% | 0,65% | 3,00% | +ICMS 12% ≈ 17,93% |
| Indústria | 8% | 12% | 1,20% | 1,08% | 0,65% | 3,00% | +ICMS 12%+IPI 5% ≈ 22,93% |

**IRPJ Adicional**: 10% sobre lucro presumido que exceder R$20.000/mês.
Pró-labore **não deduz** base de IRPJ/CSLL no LP.
PIS/COFINS: regime **cumulativo** (0,65% + 3,00% = 3,65%).

### 4.4 Lucro Real (LR)
- PIS/COFINS: regime **não-cumulativo** (1,65% + 7,60% = 9,25% com créditos sobre insumos)
- IRPJ 15% + Adicional 10% sobre lucro real > R$20k/mês + CSLL 9%
- Pró-labore **deduz** base → economia ≈ 24% (IRPJ+CSLL) sobre o valor
- **JCP**: PL × TJLP/12 dedutível de IRPJ/CSLL. Economia ≈ 24% × JCP. Sócio paga 15% IR na fonte.
- Créditos de ICMS acumulados podem compensar CBS/IBS durante transição 2026-2032

### 4.5 Profissional Liberal (PF)
- IRPF tabela progressiva (2026): isento até R$5.000 (Lei 15.270/2025) → 7,5% → 15% → 22,5% → 27,5%
- INSS contribuinte individual: 20% × min(renda, teto R$8.157,41) ≈ max R$1.631/mês
- ISS: ~3% municipal
- Distribuição de lucros: isenta de IRPF (Lei 9.249/1995 Art. 10) — **em risco**: PL 1087/2025 propõe tributação de 10-20%

---

## 5. PRÓ-LABORE — REGRAS

Aplicável em LP e LR para sócios-administradores:
- **INSS empregado** (sócio): 20% × min(pró-labore, R$8.157,41) — contribuinte individual
- **INSS patronal** (empresa): 20% × pró-labore (sem teto)
- **IRPF** (sócio): tabela progressiva sobre pró-labore líquido
- **LP**: pró-labore não reduz IRPJ/CSLL
- **LR**: pró-labore reduz lucro real → economia ≈ 24%
- INSS máximo do sócio: R$8.157,41 × 20% ≈ R$1.631/mês

**Tabela IRPF 2026** (Lei 15.270/2025):
- Até R$5.000: isento
- R$5.000,01 – R$7.000: 7,5%
- R$7.000,01 – R$10.500: 15%
- R$10.500,01 – R$14.500: 22,5%
- Acima R$14.500: 27,5%

---

## 6. HOLDING PATRIMONIAL

- **CBS/IBS sobre aluguéis**: 26,5% × 30% = **7,95%** (redução 70% — Art. 261 LC 214/2025)
- **LC 227/2026**: imóvel cedido gratuitamente ao sócio **SEM** créditos na aquisição → não incide CBS/IBS
- **LC 227/2026**: imóvel cedido gratuitamente ao sócio **COM** créditos → incide sobre valor de mercado
- Tributação LP holding: IRPJ (15%) + CSLL (9%) sobre presunção 32% = 7,68% + PIS/COFINS 3,65% ≈ 11,33%
- Tributação LR holding: ~9,5% estimado
- Comparação: carga holding vs IRPF carnê-leão (progressivo até 27,5%)

---

## 7. SPLIT PAYMENT

- **O que é**: CBS/IBS retidos na liquidação financeira (PIX, cartão) pelo prestador de serviço de pagamento, antes de entrar na conta da empresa.
- **Quando entra**: gradualmente a partir de 2026, conforme adesão dos meios de pagamento
- **Impacto**: empresa perde o "float" de 30 dias sobre o imposto (hoje paga DAS/DARF mensal)
- **Custo do float** = imposto_mensal × pct_eletronico × CDI_anual
- Penalidades (Art. 579): multa 0,1 UPF/transação por não segregar; 3%/mês por não recolher; 0,001 UPF/transação/dia por comunicar em atraso

---

## 8. CASHBACK

- **Art. 492 Dec. 12.955**: CBS devolvida às famílias de baixa renda (CadÚnico) pela União
- Regulamentado por ato da RFB
- Impacto para empresas: informativo para B2C — clientes de baixa renda têm parte do CBS devolvido

---

## 9. CRÉDITO DE IVA

- Crédito = alíquota_IVA_setor × valor_insumos
- **Fornecedor Simples Nacional**: gera apenas ~5,88% de crédito (vs 26,5% de um fornecedor pleno)
- **Exportações**: imunes de CBS/IBS; créditos acumulados podem ser ressarcidos
- **Fornecedor monofásico** (combustíveis): comprador não toma crédito normalmente (CBS já recolhida upstream)

---

## 10. ICMS (SISTEMA ATUAL — EM EXTINÇÃO)

O ICMS é gradualmente substituído pelo IBS durante 2027-2032. Alíquotas internas variam por UF:
- SP: 18% | RJ: 20% | MG: 18% | RS: 17% | PR: 19,5% | SC: 17% | BA: 19%
- MA: 22% (maior) | ES: 17% | GO: 17% | DF: 20%
- FCP incluído em AL(+2%), PE(+2,5%), PR(+0,5%)

**ICMS-ST** (Substituição Tributária): fabricante recolhe antecipado por toda a cadeia em setores específicos (bebidas, eletros, automóveis, cosméticos). Varejista não recolhe ICMS mas absorve no preço de compra.

**Créditos de ICMS acumulados**: LP/LR podem usar saldos credores para compensar CBS/IBS durante 2026-2032 (regulamentação estadual pendente).

---

## 11. ZONA FRANCA DE MANAUS

Art. 531 Dec. 12.955: incentivos específicos de CBS para a ZFM. Empresas que operam na ZFM ou vendem para ela têm tratamento tributário diferenciado (percentuais de redução aplicados no split payment). Não modelado em detalhe no sistema atual.

---

## 12. SIMPLES NACIONAL — REGIME TRANSITÓRIO CBS

- 2026: apuração informativa (sem recolhimento)
- 2027: Simples passa a recolher CBS proporcional dentro do DAS
- CBS real dentro do DAS = DAS_efetivo × (COFINS% + PIS%) do anexo/faixa (ver seção 3.B)
- ⚠️ O valor exato de CBS que o comprador pode creditar depende do anexo e faixa do fornecedor Simples
- Simples Híbrido: ✅ Art. 41 §3 Dec. 12.955 — optante pode apurar CBS pelo regime regular, gerando crédito cheio ao cliente

---

## 13. IMUNIDADES — ALÍQUOTA ZERO POR IMUNIDADE CONSTITUCIONAL

✅ Art. 10 Dec. 12.955 — imunes à CBS:
- **Exportações** de bens e serviços (Art. 9)
- **União, Estados, DF, Municípios** (operações)
- **Entidades religiosas** e suas organizações assistenciais
- **Partidos políticos, sindicatos, entidades de educação e assistência social** sem fins lucrativos
- **Livros, jornais, periódicos** e papel destinado à impressão
- **Fonogramas e videofonogramas** musicais nacionais (artistas brasileiros)
- **Radiodifusão sonora e TV aberta** de recepção livre e gratuita
- **Entidades de educação sem fins lucrativos** (cumprem CTN Art. 14)

> ⚠️ As imunidades das entidades (incisos I-III) **não se aplicam às suas compras** — elas pagam CBS ao comprar (Art. 10 §4º)

---

## 14. REGIMES ESPECÍFICOS — DETALHES COMPLETOS

### 14.1 Imóveis — Regime Específico (Arts. 359-390 Dec. 12.955)

**Operações cobertas (Art. 360):**
1. Alienação (incluindo incorporação imobiliária e parcelamento de solo)
2. Cessão e atos translativos/constitutivos onerosos de direitos reais
3. Locação, cessão onerosa e arrendamento
4. **Serviços de administração e intermediação** (corretagem)
5. Serviços de construção civil

**Alíquotas (Art. 379):**
- Operações gerais (alienação, construção, corretagem): **50% de redução** → 13,25%
- Locação, cessão onerosa, arrendamento: **70% de redução** → 7,95%

**Redutor de ajuste (Arts. 369-375):**
- Vinculado a cada imóvel a partir de 01/01/2027
- Valor inicial = custo de aquisição corrigido pelo IPCA
- Deduzido da base de cálculo na alienação → CBS incide sobre o **ganho**, não sobre a receita bruta
- Transfere-se ao novo proprietário se ele for contribuinte do regime regular; extingue-se nos demais casos

**Redutor social (Art. 376):**
- Imóvel residencial novo: **R$100.000** deduzidos da base
- Lote residencial: **R$30.000** deduzidos da base

**Regime RET — Patrimônio de Afetação (Art. 461):**
- Opção irretratável para incorporações com patrimônio de afetação registradas antes de 01/01/2029
- CBS = **2,08%** sobre receita mensal (vs 13,25% do regime geral)
- Restrição: comprador **não pode tomar crédito** de CBS (Art. 461 §§3-5)
- Restrição: não é possível deduzir redutor de ajuste ou redutor social

**Apuração por empreendimento (Art. 390):**
- Cada incorporação/obra = centro de custo distinto com CNPJ/CPF específico

**Sociedades em conta de participação (Art. 384):**
- Sócio ostensivo recolhe CBS por toda operação; sócio participante não pode ser excluído

---

### 14.2 Bares, Restaurantes e Alimentação (Arts. 396-401 Dec. 12.955)

**Quem se enquadra (Art. 396):**
Bares, restaurantes, lanchonetes, pastelarias, padarias, casas de chá/sucos/doces, cafeterias, sorveterias e similares — quando preparam e manipulam alimentação no próprio local.

**Não se enquadra (Art. 397):** bebidas alcoólicas; bebidas industrializadas não manipuladas

**Segregação obrigatória (Art. 398):** NF deve discriminar o que é regime específico vs. regime geral. Sem segregação → valor total ao regime geral.

**Gorjeta (Art. 399 §1º):** excluída da base se repassada integralmente ao empregado e ≤15% do valor da conta.

**Alíquota (Art. 400):** 40% de redução → CBS = **10,6%**

**⚠️ Crédito vedado ao comprador (Art. 401):** adquirente B2B **não pode creditar CBS** sobre alimentação/bebidas desse regime.

---

### 14.3 Hotelaria, Parques de Diversão e Parques Temáticos (Arts. 402-411 Dec. 12.955)

**Alíquota (Art. 405):** 40% de redução → CBS = **10,6%**

**Crédito ao fornecedor (Art. 406):** hotel/parque **pode** apropriar crédito de CBS nas suas compras de bens e serviços.

**⚠️ Crédito vedado ao comprador (Art. 407):** adquirente B2B **não pode creditar CBS** sobre serviços de hotelaria e parques.

**Parques — o que inclui e exclui (Arts. 412-413):**
- Inclui: ingresso + atrações incluídas no ingresso
- **Exclui** (alíquota cheia sobre esses): alimentação/bebidas, guia, fotografia/vídeo, treinamento, acompanhamento de crianças, guarda-volumes

---

### 14.4 Agências de Turismo (Arts. 417-420 Dec. 12.955)

**Base de cálculo (Art. 418):**
- Intermediação: valor cobrado do cliente **menos repasses** a fornecedores intermediados
- Serviço direto: valor total da operação

**Crédito ao comprador (Art. 419):** comprador **pode creditar** CBS sobre o serviço de intermediação.

**Crédito ao fornecedor (Art. 420):** agência pode apropriar créditos sobre suas compras, **vedado** sobre valores deduzidos da base.

---

### 14.5 Planos de Assistência à Saúde (Arts. 332-341 Dec. 12.955)

**Base de cálculo (Art. 332):**
- (+) Prêmios e contraprestações recebidos (regime de caixa)
- (+) Receitas financeiras dos ativos garantidores das reservas técnicas
- (−) Indenizações/sinistros efetivamente pagos
- (−) Cancelamentos e restituições
- (−) Comissões pagas a intermediários
- (−) Repasses a prestadores de serviços de saúde da rede credenciada

**Base negativa (Art. 333):** se a base for negativa, pode ser deduzida de períodos futuros (prazo máximo 5 anos).

**Crédito ao fornecedor (Art. 334):** operadora pode apropriar crédito de CBS nas suas compras, exceto quando houver dedução da base para o mesmo item.

**⚠️ Crédito vedado ao comprador (Art. 337):** adquirentes de planos de saúde **não podem creditar CBS**, EXCETO empresas que compram para empregados — crédito proporcional à parcela arcada pela empresa.

**Alíquota:** definida no Livro II (não publicada no texto lido). Sistema usa aproximação de 60% de redução (regime diferenciado saúde Art. 203).

---

### 14.6 Cooperativas (Arts. 391-395 Dec. 12.955)

**Alíquota zero (Art. 391):**
- Associado → cooperativa: CBS = 0%
- Cooperativa → associado: CBS = 0%
- Aplica-se também a: operações entre cooperativas entre si; serviços financeiros da cooperativa a associados; fornecimento de bens agropecuários pela cooperativa ao associado

**Comprador externo (não associado):** CBS normal pelas regras gerais.

**Cooperativas financeiras (Art. 283):** serviços financeiros a associados têm alíquota zero; não deduzem da base as receitas dessas operações.

---

### 14.7 SAF — Sociedade Anônima do Futebol (Arts. 421-430 Dec. 12.955)

**Regime TEF (Art. 422):** pagamento mensal unificado de IRPJ, CSLL, INSS patronal, CBS e IBS.

**Base de cálculo (Art. 423):** totalidade das receitas — bilheteria, sócio-torcedor, cessão de direitos, transferência de atletas, imagem, licenciamento, publicidade, patrocínio, etc.

**Alíquotas (Art. 424):**
- IRPJ + CSLL + INSS: 4%
- **CBS: 1%**
- IBS: 1%
- Total TEF: **6%** sobre receita total

**Transição (Art. 425):**
- 2027-2028: CBS = 0,9% (transitório)
- 2033+: CBS = 1%

---

### 14.8 Programas de Fidelidade (Art. 315 Dec. 12.955)

**Base de cálculo (Art. 315 I):**
- Pontos **emitidos** no período
- (−) Valores pagos no **resgate** de pontos
- (−) Ressarcidos por pontos não utilizados computados como receita

**⚠️ Crédito vedado ao comprador (Art. 315 II):** adquirente de pontos **não pode creditar CBS**.

**Pontos usados como contraprestação:** deduzidos da base pelo valor considerado na fixação da base de CBS da operação original.

---

### 14.9 Compras Governamentais (Arts. 439-443 Dec. 12.955)

**Redutor progressivo sobre CBS (Art. 441):**
- 2029: CBS = **10%** da alíquota normal
- 2030: CBS = **20%**
- 2031: CBS = **30%**
- 2032: CBS = **40%**
- 2033+: fixado pelo Senado Federal (Art. 443)

**Aplica-se a:** fornecimentos à administração pública direta, autarquias e fundações públicas.

**Exceções (Art. 441 §1º):** não se aplica a compras presenciais dispensadas de licitação; nem a regimes monofásicos/específicos com alíquota uniforme nacional; nem a Simples/MEI.

---

### 14.10 Serviços Financeiros — Resumo Completo (Arts. 269-332 Dec. 12.955)

**Serviços incluídos (Art. 269):**
Operações de crédito, câmbio, títulos e valores mobiliários, seguros, resseguros, previdência privada, capitalização, consórcios, arranjos de pagamento, ativos virtuais, entidades administradoras de mercados organizados, securitização, faturização.

**Base de cálculo:** receitas brutas das operações menos custos específicos (juros passivos, sinistros, etc.) — varia por tipo.

**Alíquota:** disciplinada no Livro II (publicação específica). Sistema usa ~10,85% (IBS+CBS 2027-2028) como aproximação.

**Resseguro e retrocessão (Art. 322):** alíquota **zero**.

**Crédito:** comprador pode apropriar crédito CBS sobre serviços financeiros, proporcional ao que o fornecedor extinguiu.

---

## 15. TRATAMENTOS ESPECIAIS POR SITUAÇÃO

### 15.1 Crédito vedado ao comprador — quando ocorre
✅ **Confirmado no decreto:**
| Setor fornecedor | Base legal | Exceção |
|---|---|---|
| Restaurantes/bares/alimentação | Art. 401 | Nenhuma |
| Hotelaria e parques | Art. 407 | Nenhuma |
| Planos de assistência à saúde | Art. 337 | Empresa comprando para empregados (proporcional) |
| Programas de fidelidade | Art. 315 II | Nenhuma |
| RET patrimônio de afetação (imóvel) | Art. 461 §3 | Nenhuma |
| Parcelamento de solo (opção 3,65%) | Dec. 12.955 §3 | Nenhuma |

### 15.2 Bases de cálculo especiais — quando CBS não incide sobre receita bruta
| Setor | Base real | Base legal |
|---|---|---|
| Imóveis — venda | Preço − redutor de ajuste − redutor social | Arts. 369-376 |
| Agências de turismo | Valor cobrado − repasses a fornecedores | Art. 418 |
| Planos de saúde | Prêmios − sinistros − comissões | Art. 332 |
| Bens usados de PF | Fórmula CP = [VO × C] / [1+C] | Art. 258 |
| Produtor rural PF (crédito comprador) | Fórmula CP = [VO × C] / [1+C] | Art. 247 |
| Programas de fidelidade | Pontos emitidos − resgates | Art. 315 |
| SAF | Receita bruta total (mas alíquota 1%) | Arts. 423-424 |

### 15.3 Regimes monofásicos — CBS recolhida upstream, varejista não recolhe
| Setor | Contribuintes (Art. 263) |
|---|---|
| Combustíveis (gasolina, etanol, diesel, GNV) | Produtores, refinarias, distribuidores |

### 15.4 Crédito presumido — quando comprador recebe crédito mesmo sem CBS destacada
| Situação | Fórmula | Base legal |
|---|---|---|
| Compra de PF não contribuinte (bens usados) | CP = [VO × C] / [1+C] | Art. 258 |
| Compra de produtor rural PF | CP = [VO × C] / [1+C] | Art. 247 |
| Cooperativa comprando de associado | Regime zero — não há CBS | Art. 391 |

### 15.5 Simples Nacional — crédito CBS por anexo/faixa
CBS gerada para compradores = DAS_efetivo × partilha_CBS(anexo, faixa)

| Anexo | Tipo | Partilha CBS faixas 1-5 | Faixa 6 |
|---|---|---|---|
| I | Comércio | 15,50% | 34,40% |
| II | Indústria | 14,00% | 25,50% |
| III | Serviços gerais | 15,60%–17,10% | 19,50% |
| IV | Serviços §5-C | 21,50%–25,00% | 25,00% |
| V | Serviços §5-I | 17,15%–19,15% | 20,00% |

Fórmula: `CBS_por_real_comprado = DAS_efetivo × partilha_CBS`  
Ex: Anexo I Faixa 1 (DAS 4,0%): CBS = 4,0% × 15,5% = **0,62%** por real comprado

---

## 16. REFERÊNCIAS LEGAIS RÁPIDAS (ATUALIZADO)

| Tema | Base Legal |
|------|-----------|
| Alíquota padrão 26,5% | EC 132/2023 + LC 214/2025 Art. 18 |
| Cesta básica alíquota zero | Art. 199 Dec. 12.955 (Anexo I LC 214) |
| Redução 30% profissões | Art. 202 Dec. 12.955 (Art. 127 LC 214) |
| Redução 60% saúde/educação | Art. 203 Dec. 12.955 (Art. 128 LC 214) |
| Locação imóveis 70% | Art. 261 LC 214/2025 |
| Construção 50% | Art. 203 LC 214/2025 |
| Combustíveis monofásico | Art. 259 Dec. 12.955 (Cap. I Título VI) |
| Serviços financeiros | Art. 269 Dec. 12.955 (Cap. II Título VI) |
| Planos de saúde | Art. 303+ Dec. 12.955 (Cap. III Título VI) |
| Bets/prognósticos | Cap. IV Título VI Dec. 12.955 |
| Bens usados de PF | Cap. X Título V Dec. 12.955 |
| Split payment | Arts. 28-35 e Art. 579 Dec. 12.955 |
| Cashback | Art. 492 Dec. 12.955 (Art. 112 LC 214) |
| Transição 2026 informativa | Art. 464 Dec. 12.955 |
| Grupo societário Simples | LC 123/2006 Art. 3º §4º |
| MEI limite R$81k | LC 155/2016 |
| Pró-labore INSS | Lei 8.212/1991 Art. 21 |
| JCP | Lei 9.249/1995 Art. 9º |
| Dividendos (atual isenção) | Lei 9.249/1995 Art. 10 |
| Dividendos (risco tributação) | PL 1087/2025 — em tramitação |
| IRPF isenção R$5k | Lei 15.270/2025 |
| Holding LC 227/2026 | LC 227/2026 Art. 5º |
| Corretagem imobiliária 50% | Art. 360 IV + Art. 379 Dec. 12.955 |
| Livros/jornais imunes | Art. 10 IV Dec. 12.955 |
| Radiodifusão gratuita imune | Art. 10 VI Dec. 12.955 |
| Bares — crédito vedado comprador | Art. 401 Dec. 12.955 |
| Hotelaria — crédito vedado comprador | Art. 407 Dec. 12.955 |
| Planos saúde — crédito vedado comprador | Art. 337 Dec. 12.955 |
| Planos saúde — base (prêmios − sinistros) | Art. 332 Dec. 12.955 |
| Agências turismo — base sobre margem | Art. 418 Dec. 12.955 |
| SAF regime TEF (CBS 1%) | Arts. 421-424 Dec. 12.955 |
| Programas fidelidade (pontos − resgates) | Art. 315 Dec. 12.955 |
| Cooperativas — alíquota zero inter-associados | Art. 391 Dec. 12.955 |
| Compras governamentais — redutor 10-40% | Arts. 441-443 Dec. 12.955 |
| Imóveis — redutor ajuste (custo corrigido) | Arts. 369-375 Dec. 12.955 |
| Imóveis — redutor social R$100k/R$30k | Art. 376 Dec. 12.955 |
| Imóveis — RET 2,08% | Art. 461 Dec. 12.955 |
| Reabilitação urbana histórica 80% | Art. 234 §3º Dec. 12.955 |
| Simples opção regime regular CBS | Art. 41 §3 Dec. 12.955 |
| Resseguro/retrocessão alíquota zero | Art. 322 Dec. 12.955 |
| Partilha CBS Simples por anexo/faixa | LC 123/2006 Anexos I-V (vigência 2018) |
| Construção LP presunção 8% | Art. 15 §1º III b Lei 9.249/1995 |
| Transporte cargas LP presunção 8% | Art. 15 §1º II Lei 9.249/1995 |

---

## 17. CENÁRIOS PRÁTICOS

> **Legenda de fonte:**
> - ✅ Texto literal confirmado no Decreto 12.955/2026 ou LC 214/2025
> - 📘 Baseado em lei vigente anterior (LC 123/2006, Lei 9.249/1995, etc.)
> - ⚠️ Estimativa do sistema — valor não encontrado literalmente no decreto

---

### CENÁRIO 1 — Simples Nacional com sócio em outra empresa

**Situação:** Empresa A no Simples (faturamento R$300k/ano). O sócio tem 15% de participação na Empresa B (faturamento R$3.900k/ano).

**Regra aplicável:** 📘 LC 123/2006, Art. 3º §4º — se o sócio possui participação **igual ou superior a 10%** do capital em outra empresa, os faturamentos de **todas** as empresas somam para verificação do limite do Simples Nacional.

**Cálculo:**
- Faturamento Empresa A: R$300.000/ano
- Faturamento Empresa B (sócio ≥ 10%): R$3.900.000/ano
- **Total do grupo: R$4.200.000/ano**
- Limite Simples: R$4.800.000/ano
- Resultado: dentro do limite (mas em alerta — 87,5% utilizado)

**Se B tivesse R$4.600k/ano:** total = R$4.900k → **ambas desenquadradas do Simples**.

**Impacto no IVA Dual:**
- Dentro do Simples: crédito gerado para compradores ≈ ⚠️ ~5,88% (estimativa do sistema — percentual exato depende do anexo e faixa)
- Fora do Simples (após desenquadramento): crédito cheio de 26,5% × (1 − reducao_setor)

---

### CENÁRIO 2 — Incorporadora com Patrimônio de Afetação (RET)

**Situação:** Incorporadora faz lançamento residencial com patrimônio de afetação (regime especial da Lei 10.931/2004), com pedido de opção efetivado antes de 1º/1/2029.

**Regra aplicável:** ✅ Art. 461 Dec. 12.955 (Art. 485 LC 214/2025)

**CBS/IBS:**
- Regime geral construção: 26,5% × 50% = **13,25%** sobre receita
- Com opção RET: **2,08%** sobre receita mensal recebida (regime irretratável)
- Habitação de interesse social (Art. 461 §1º, se houver previsão específica): verificar regulamentação

**Restrições confirmadas (Art. 461 §§3-5):**
- ✅ Não é possível apropriar créditos de CBS quem opta pelo RET
- ✅ A opção afasta qualquer outra forma de incidência de CBS sobre a incorporação
- ✅ O comprador do imóvel também **não pode tomar crédito de CBS** na aquisição

**Comparação:**
| | Alíquota CBS/IBS | Crédito para comprador |
|---|---|---|
| Regime geral | 13,25% (50% redução) | ✅ Sim |
| RET patrimônio afetação | 2,08% | ❌ Não |

---

### CENÁRIO 3 — Construção Civil: venda de imóvel vs. locação

**Situação:** Construtora que tanto vende unidades prontas quanto aluga parte do estoque.

**Regras aplicáveis:** ✅ Art. 379 Dec. 12.955 (Art. 261 LC 214/2025)

- **Construção / venda de imóvel:** redução de **50%** → alíquota CBS = 26,5% × 50% = **13,25%**
- **Locação / cessão onerosa / arrendamento de imóvel:** redução de **70%** → alíquota CBS = 26,5% × 30% = **7,95%**

Texto literal confirmado: *"A alíquota da CBS relativa às operações de que trata este Capítulo fica reduzida em 50%. Parágrafo único: A alíquota da CBS relativa às operações de locação, cessão onerosa e arrendamento de bens imóveis fica reduzida em 70%."* — Art. 379 Dec. 12.955

**Caso especial — Reabilitação urbana de zonas históricas:**
- ✅ Art. 234 §3º (Art. 158 parágrafo único LC 214): locação de imóvel nessas zonas tem redução de **80%** → alíquota = 26,5% × 20% = **5,30%**

---

### CENÁRIO 4 — Médico: consultório próprio vs. hospital

**Situação:** Médico prestando serviços em duas modalidades.

**Regras aplicáveis:**
- ✅ Art. 202 Dec. 12.955 → profissionais com fiscalização por conselho: redução **30%** — lista inclui administradores, advogados, engenheiros, contabilistas, economistas, veterinários, etc. **Médicos NÃO estão na lista do Art. 202**
- ✅ Art. 205 Dec. 12.955 (Art. 130 LC 214) → serviços de saúde (Anexo III LC 214): redução **60%**

**Conclusão:**
| Modalidade | Base legal | Redução | Alíquota CBS |
|---|---|---|---|
| Consultório / clínica médica | Art. 205 — serviços de saúde | 60% | 10,60% |
| Hospital / procedimentos hospitalares | Art. 205 — serviços de saúde | 60% | 10,60% |
| Médico veterinário (serviço profissional) | Art. 202 — profissão regulamentada | 30% | 18,55% |

**Nota:** Os valores glosados pela auditoria médica dos planos de saúde **não integram a base de cálculo** da CBS (✅ Art. 205 parágrafo único Dec. 12.955).

---

### CENÁRIO 5 — Profissional regulamentado: PF vs. empresa uniprofissional

**Situação:** Advogado avaliando prestar serviços como PF ou abrir escritório individual.

**Regra aplicável:** ✅ Art. 202 §1º Dec. 12.955 — a redução de 30% aplica-se à prestação de serviços realizada por:
- I — **pessoa física**
- II — **pessoa jurídica uniprofissional** (todos os sócios são do mesmo conselho profissional e prestam serviço pessoalmente)

**Profissões com redução 30% (lista completa Art. 202):**
administradores, advogados, arquitetos e urbanistas, assistentes sociais, bibliotecários, biólogos, contabilistas, economistas, economistas domésticos, profissionais de educação física, engenheiros e agrônomos, estatísticos, médicos veterinários e zootecnistas, museólogos, químicos, profissionais de relações públicas, técnicos industriais, técnicos agrícolas.

**Alíquota CBS para esses profissionais:** 26,5% × 70% = **18,55%**

**Profissões com redução 60% (serviços de saúde):** médicos, dentistas, fisioterapeutas, psicólogos, fonoaudiólogos, nutricionistas → alíquota CBS = **10,60%**

---

### CENÁRIO 6 — Exportador: acumulação de crédito CBS

**Situação:** Empresa exporta 40% da produção e acumula crédito de CBS nas entradas.

**Regra aplicável:** ✅ Art. 9º Dec. 12.955 (Art. 8º LC 214) — exportações de bens e serviços são **imunes** à CBS.

**Consequência:**
- CBS cobrada nas compras/insumos → **crédito** apropriado normalmente
- CBS nas saídas de exportação → **zero** (imunidade)
- Resultado: acumulação de saldo credor de CBS

**Ressarcimento:** ✅ Dec. 12.955 prevê ressarcimento de créditos acumulados — procedimento específico regulamentado pela RFB. Prazo e percentual de ressarcimento não encontrados no texto do decreto lido.

---

### CENÁRIO 7 — Posto de combustível (varejista)

**Situação:** Posto revendedor de gasolina e etanol.

**Regra aplicável:** ✅ Art. 259 e Art. 263 Dec. 12.955 (Art. 176 LC 214)

**Contribuintes do regime monofásico (quem recolhe CBS):**
- Produtor nacional de biocombustíveis
- Refinaria de petróleo e suas bases
- Central de matéria-prima petroquímica (CPQ)
- Unidade de processamento de gás natural

**Posto varejista:** ✅ **NÃO é contribuinte** do regime monofásico de CBS. O imposto já vem embutido no preço de aquisição cobrado pelo distribuidor.

**Alíquotas específicas por combustível:** ✅ Art. 262 → disciplinadas no Capítulo V do Título I do Livro II do decreto. Valores por litro/m³ fixados em ato separado — **não disponíveis no texto lido**.

**Impacto no IVA Dual para o posto:** CBS/IBS nas saídas = **zero** (não é contribuinte na venda ao consumidor). A carga tributária do posto é basicamente IRPJ/CSLL sobre margem + tributos trabalhistas.

---

### CENÁRIO 8 — Revenda de bens usados adquiridos de pessoa física

**Situação:** Revendedora de veículos usados compra carros de pessoas físicas e revende.

**Regra aplicável:** ✅ Art. 258 Dec. 12.955 (Art. 171 LC 214)

**Mecanismo:** O comprador (revendedor) pode apropriar **créditos presumidos** de CBS calculados pela fórmula:

```
CP = [VO × C] / [1 + C]
```
- CP = crédito presumido
- VO = valor pago à pessoa física (valor de aquisição)
- C = alíquota CBS aplicável à operação (definida no Livro II)

**Obrigações (Art. 258 §2º):** emitir documento fiscal na aquisição com: identificação do alienante, valor pago, descrição do bem, declaração de que o alienante não é contribuinte.

**Efeito prático:** a CBS efetiva incide apenas sobre a margem bruta (venda − compra), pois o crédito presumido sobre a compra cancela o débito proporcional.

**Nota:** os percentuais exatos de C (alíquota aplicável) para cada tipo de bem estão no Livro II do decreto — **não disponíveis no texto lido**. O sistema usa 26,5% como estimativa (reducao: 0.70 assumindo margem típica 30%).

---

### CENÁRIO 9 — CBS em 2026: o que muda na prática

**Situação:** Empresa LP que quer saber se precisa pagar CBS em 2026.

**Regra aplicável:** ✅ Art. 464 Dec. 12.955 (Art. 348 §1º LC 214)

- 2026: CBS **dispensada de recolhimento** — apuração apenas informativa
- Obrigações acessórias (emissão de NF com CBS destacada) devem ser cumpridas
- Infrações a obrigações acessórias ainda geram multa mesmo sem recolhimento
- **A partir de 1º/1/2027:** CBS exigida integralmente (substitui PIS/COFINS)

**Transição PIS/COFINS → CBS:**
- Até 31/12/2026: PIS/COFINS vigentes normalmente
- A partir de 01/01/2027: CBS substitui PIS/COFINS nas mesmas situações (✅ Art. 430 §1º Dec. 12.955)

---

### CENÁRIO 10 — Parque temático / eventos: o que é tributado e o que não é

**Situação:** Parque de diversões cobra ingresso e vende alimentação, fotografia e serviços avulsos dentro do parque.

**Regras aplicáveis:** ✅ Arts. 412–413 Dec. 12.955

**Regime diferenciado 40% (hospitalidade):**
- ✅ Art. 412: inclui o valor do ingresso + quaisquer valores de atrações incluídas no ingresso

**Alíquota cheia (26,5%) — fora do regime:**
- ✅ Art. 413: **não** se aplica o regime às demais operações fora do ingresso:
  - Fornecimento de alimentação e bebidas
  - Serviços de guia
  - Serviços de fotografia e vídeo
  - Treinamento
  - Acompanhamento de crianças
  - Serviços de guarda-volumes

**Resumo:** ingresso = 40% redução. Tudo que o cliente paga separado = alíquota cheia.

---

### CENÁRIO 11 — Produtor rural pessoa física vendendo para empresa

**Situação:** Produtor rural PF (não contribuinte da CBS) vende para agroindústria.

**Regra aplicável:** ✅ Arts. 245–247 Dec. 12.955 (Art. 168 LC 214)

**Mecanismo de crédito presumido para o comprador:**
- O produtor rural PF **não emite CBS** (não é contribuinte)
- A **empresa compradora** pode apropriar crédito presumido de CBS
- Fórmula confirmada: `CP = [VO × C] / [1 + C]` (Art. 247)
  - CP = crédito presumido; VO = valor pago ao produtor; C = alíquota CBS do setor
- O comprador deve emitir documento fiscal de aquisição com identificação do produtor e valor pago

**Percentual C** (alíquota CBS sobre produtos agropecuários in natura): 26,5% × 40% = **10,60%** (redução 60% — Art. 203 VIII Dec. 12.955). Portanto: `C = 0,106`

---

### CENÁRIO 12 — Empresa de serviços B2B no Simples: opção pelo regime regular CBS

**Situação:** Escritório de TI no Simples (Anexo III, R$500k/ano) com clientes 100% B2B.

**Regra aplicável:** ✅ Art. 41 §§3–4 Dec. 12.955 (Art. 41 LC 214/2025)

Texto literal confirmado: *"Os optantes pelo Simples Nacional poderão exercer a opção de apurar e recolher a CBS pelo regime regular, hipótese na qual a CBS será apurada e recolhida conforme o disposto neste Regulamento."*

**Regras confirmadas:**
- ✅ A opção existe e está regulamentada — não é "futura"
- ✅ A opção é exercida nos termos da LC 123/2006 (Art. 41 §4)
- ✅ Quem recebeu ressarcimento de créditos de CBS no ano corrente ou anterior **não pode** sair do regime regular (Art. 41 §5)
- ✅ No regime regular: CBS apurada e recolhida pelas regras normais do decreto (não dentro do DAS)

**O que isso significa na prática:**
- **Simples normal**: CBS recolhida proporcionalmente dentro do DAS → crédito gerado ao comprador é menor
- **Opção pelo regime regular**: CBS apurada integralmente pelo decreto → crédito cheio para o cliente B2B

**O que NÃO está no decreto (estimativa do sistema):**
- ⚠️ O percentual exato de CBS embutido no DAS do Simples (~5,88% médio) — o decreto não especifica esse valor. O sistema usa essa estimativa para calcular o crédito gerado aos compradores no Simples clássico.

**Quando vale a opção:** quando o crédito cheio gerado ao cliente B2B (26,5% × (1 − reducao_setor)) compensar o custo adicional de pagar CBS integral por fora do DAS. Para B2B puro com clientes no regime pleno, geralmente é vantajoso.
