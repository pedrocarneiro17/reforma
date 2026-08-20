# Regras Tributárias — Regimes Atuais (sem Reforma)

Documentação técnica das regras de cálculo dos regimes tributários **vigentes hoje**, exatamente como implementadas neste sistema (`src/engine/calculadora.ts`). Serve como especificação para validar/portar as regras em outro sistema.

> **Escopo:** Simples Nacional, Lucro Presumido, Lucro Real, MEI e Profissional Liberal — carga atual. Não inclui IVA Dual / CBS / IBS / reforma.
> **Referências legais:** LC 123/2006 + LC 155/2016 (Simples), RIR/2018 (Decreto 9.580/2018), Lei 9.249/1995, Lei 9.718/1998, Leis 10.637/2002 e 10.833/2003 (PIS/COFINS não-cumulativo), Lei 8.212/1991 (INSS/CPP), MP 1.206/2024 + Lei 15.270/2025 (IRPF).
> **Base temporal dos valores:** 2026 (tetos, salário-mínimo, tabela IRPF).

---

## 0. Constantes e tabelas de referência

### 0.1 Limiares e alíquotas gerais

| Constante | Valor | Uso |
|---|---|---|
| Adicional de IRPJ — limiar | **R$ 20.000/mês** (R$ 60.000/trim.) | 10% sobre o lucro que exceder |
| CPP patronal | **20%** | sobre folha de empregados e sobre pró-labore |
| Terceiros (Sistema S) | **5,8%** | sobre folha de empregados (não incide sobre pró-labore) |
| INSS teto (2026) | **R$ 8.157,41** | base máxima do contribuinte individual |
| INSS autônomo/individual | **20%** | contribuinte individual (sócio/autônomo), até o teto → máx **R$ 1.631,48/mês** |
| Limite Simples Nacional | **R$ 4.800.000/ano** | receita bruta 12 meses (RBT12) |
| Limite MEI | **R$ 81.000/ano** (R$ 6.750/mês) | LC 155/2016 |

### 0.2 Presunções do Lucro Presumido (base IRPJ / CSLL)

| Tipo de atividade | Presunção IRPJ | Presunção CSLL |
|---|---|---|
| Comércio | 8% | 12% |
| Indústria | 8% | 12% |
| Serviços | 32% | 32% |
| Misto | 32% | 32% |

> Alguns setores têm presunção específica (ex.: hospitais 8% em serviço) — quando o setor define `presuncaoLPIRPJ` / `presuncaoLPCSLL`, esses valores substituem os padrões acima.

### 0.3 Margem estimada do Lucro Real (quando não há dados reais)

| Tipo | Margem líquida presumida |
|---|---|
| Serviços / Misto | 10% |
| Comércio / Indústria | 5% |

### 0.4 Terceiros (composição dos 5,8%)

`SESC/SENAC` (comércio/serviço) ou `SESI/SENAI` (indústria) 1,5% + 1,0%
`+ INCRA` 0,2% `+ Salário-Educação` 2,5% `+ SEBRAE` 0,6% = **5,8%**

> **Não modelado:** RAT/FAP (1% a 3% conforme risco da atividade). Se o outro sistema considera RAT, some 1–3% aos encargos de folha.

### 0.5 Tabela IRPF mensal (progressiva) — MP 1.206/2024

| Base de cálculo mensal | Alíquota | Parcela a deduzir |
|---|---|---|
| Até R$ 2.259,20 | isento | — |
| R$ 2.259,21 a 2.826,65 | 7,5% | R$ 169,44 |
| R$ 2.826,66 a 3.751,05 | 15% | R$ 381,44 |
| R$ 3.751,06 a 4.664,68 | 22,5% | R$ 662,77 |
| Acima de R$ 4.664,68 | 27,5% | R$ 896,00 |

**Desconto especial Lei 15.270/2025** (aplicado sobre o IRPF apurado):
- Rendimento ≤ R$ 5.000/mês → **isenção total** (IRPF = 0)
- R$ 5.000 a R$ 7.350 → isenção decrescente: `IRPF_final = IRPF_tabela × (1 − fator)`, onde `fator = (7.350 − rendimento) / (7.350 − 5.000)`
- Acima de R$ 7.350 → tabela progressiva plena, sem desconto

```
função calcularIRPF(rendimento):
    se rendimento ≤ 2259,20:  bruto = 0
    senão se ≤ 2826,65:       bruto = rendimento × 0,075 − 169,44
    senão se ≤ 3751,05:       bruto = rendimento × 0,15  − 381,44
    senão se ≤ 4664,68:       bruto = rendimento × 0,225 − 662,77
    senão:                    bruto = rendimento × 0,275 − 896,00
    se bruto ≤ 0: retorna 0
    se rendimento ≤ 5000: retorna 0
    se rendimento ≤ 7350:
        fator = (7350 − rendimento) / (7350 − 5000)
        retorna max(0, bruto × (1 − fator))
    retorna bruto
```

### 0.6 MEI — DAS fixo mensal (2026)

Salário-mínimo 2026 = R$ 1.621 → INSS MEI = 5% × 1.621 = R$ 81,05. ICMS = R$ 1,00. ISS = R$ 5,00.

| Atividade | DAS fixo | Composição |
|---|---|---|
| Comércio | R$ 82,05 | INSS 81,05 + ICMS 1,00 |
| Indústria | R$ 87,05 | INSS 81,05 + ICMS 1,00 + ISS 5,00 |
| Serviços | R$ 86,05 | INSS 81,05 + ISS 5,00 |
| Misto | R$ 87,05 | INSS 81,05 + ICMS 1,00 + ISS 5,00 |

---

## 1. Simples Nacional

### 1.1 Fórmula da alíquota efetiva do DAS

```
RBT12 = receita bruta dos últimos 12 meses  (no sistema: faturamentoMensal × 12)
faixa = primeira faixa cujo "limite" ≥ RBT12
aliquotaEfetiva = (RBT12 × aliquotaNominal − parcelaADeduzir) / RBT12
DAS mensal = faturamentoMensal × aliquotaEfetiva
```

A alíquota **nominal** e a **parcela a deduzir** vêm da tabela do anexo (abaixo). A faixa é definida pela RBT12.

### 1.2 Tabelas dos Anexos (LC 123/2006, vigência 01/01/2018)

Formato: `{ limite RBT12, alíquota nominal, parcela a deduzir }`.

**Anexo I — Comércio**
| Limite RBT12 | Nominal | Deduzir |
|---|---|---|
| 180.000 | 4,00% | 0 |
| 360.000 | 7,30% | 5.940 |
| 720.000 | 9,50% | 13.860 |
| 1.800.000 | 10,70% | 22.500 |
| 3.600.000 | 14,30% | 87.300 |
| 4.800.000 | 19,00% | 378.000 |

**Anexo II — Indústria**
| Limite RBT12 | Nominal | Deduzir |
|---|---|---|
| 180.000 | 4,50% | 0 |
| 360.000 | 7,80% | 5.940 |
| 720.000 | 10,00% | 13.860 |
| 1.800.000 | 11,20% | 22.500 |
| 3.600.000 | 14,70% | 85.500 |
| 4.800.000 | 30,00% | 720.000 |

**Anexo III — Serviços gerais** (locação de bens móveis e serviços não listados no §5º-C)
| Limite RBT12 | Nominal | Deduzir |
|---|---|---|
| 180.000 | 6,00% | 0 |
| 360.000 | 11,20% | 9.360 |
| 720.000 | 13,50% | 17.640 |
| 1.800.000 | 16,00% | 35.640 |
| 3.600.000 | 21,00% | 125.640 |
| 4.800.000 | 33,00% | 648.000 |

**Anexo IV — Serviços §5º-C** (construção, limpeza, vigilância, telemarketing)
| Limite RBT12 | Nominal | Deduzir |
|---|---|---|
| 180.000 | 4,50% | 0 |
| 360.000 | 9,00% | 8.100 |
| 720.000 | 10,20% | 12.420 |
| 1.800.000 | 14,00% | 39.780 |
| 3.600.000 | 22,00% | 183.780 |
| 4.800.000 | 33,00% | 828.000 |

> ⚠️ **Anexo IV — CPP fora do DAS:** neste anexo a Contribuição Previdenciária Patronal (20% sobre a folha) **não** está incluída no DAS — é recolhida separadamente. **Este sistema calcula o DAS do Simples apenas como `faturamento × alíquota efetiva` e NÃO adiciona a CPP separada do Anexo IV.** Se o outro sistema precisa da carga total do Anexo IV, deve somar 20% da folha por fora.

**Anexo V — Serviços §5º-I** (auditoria, consultoria, jornalismo, tecnologia, publicidade, engenharia, etc.)
| Limite RBT12 | Nominal | Deduzir |
|---|---|---|
| 180.000 | 15,50% | 0 |
| 360.000 | 18,00% | 4.500 |
| 720.000 | 19,50% | 9.900 |
| 1.800.000 | 20,50% | 17.100 |
| 3.600.000 | 23,00% | 62.100 |
| 4.800.000 | 30,50% | 540.000 |

### 1.3 Definição do anexo

O usuário informa o anexo. Quando não informa, o sistema infere pelo tipo de setor:
`comércio → Anexo I`, `indústria → Anexo II`, `serviços/misto → Anexo III`.

### 1.4 Fator R (serviços — Anexo III vs V)

```
fatorR = folhaMensal / faturamentoMensal
se fatorR ≥ 28%  → atividade tributada pelo Anexo III (mais barato)
se fatorR < 28%  → atividade tributada pelo Anexo V
folhaMínimaParaAnexoIII = faturamentoMensal × 28%
```

> ⚠️ **Comportamento do sistema:** o Fator R é calculado **apenas como análise informativa** (comparação Anexo III vs V). Ele **não** sobrepõe o anexo que o usuário informou — o cálculo do DAS usa sempre o anexo informado. Se o outro sistema deve migrar automaticamente III↔V pelo Fator R, isso é uma diferença de comportamento.

### 1.5 Empresa com dois anexos (receita mista)

LC 123/2006 Art. 18 §4º-A: cada parcela de receita é tributada pelo seu próprio anexo, mas a **faixa é a mesma** (definida pela RBT12 total).

```
aliquotaEfetivaMista = pct1 × aliquotaDAS(anexo1, RBT12) + (1 − pct1) × aliquotaDAS(anexo2, RBT12)
```
onde `pct1` = fração da receita no anexo 1 (0–1).

### 1.6 O que está dentro do DAS

O DAS unifica: **IRPJ, CSLL, PIS, COFINS, CPP** (exceto Anexo IV), e **ICMS** (comércio/indústria) ou **ISS** (serviços). Não há apuração separada de débito/crédito de ICMS no Simples — está tudo embutido na alíquota efetiva.

---

## 2. Lucro Presumido

Cálculo mensal, tributo a tributo (todos somados formam a carga total):

| Tributo | Fórmula |
|---|---|
| **Base presumida (IRPJ)** | `faturamento × presunçãoIRPJ` (8% com/ind, 32% serv) |
| **IRPJ** | `basePresumida × 15%` |
| **IRPJ adicional** | `max(0, basePresumida − 20.000) × 10%` |
| **CSLL** | `faturamento × presunçãoCSLL × 9%` (presunção 12% com/ind, 32% serv) |
| **PIS/COFINS cumulativo** | `faturamento × 3,65%` (PIS 0,65% + COFINS 3,00%) |
| **ICMS (não-cumulativo)** | `max(0, (faturamento − compras) × alíquotaICMS)` — ver 2.1 |
| **ISS** | `faturamento × alíquotaISS` — ver 2.1 |
| **IPI** | `faturamento × 5%` (só indústria, e só quando ICMS não foi informado) |
| **CPP patronal (folha)** | `folhaEmpregados × 20%` |
| **Terceiros** | `folhaEmpregados × 5,8%` |
| **CPP sobre pró-labore** | `totalPróLabore × 20%` |
| **CARGA TOTAL** | soma de todos acima |

### 2.1 ICMS e ISS no Lucro Presumido

- **ICMS** (comércio/indústria) — apuração **não-cumulativa** (débito − crédito):
  ```
  alíquota = alíquotaInformada  OU  12% (média, se não informada)
  débito   = faturamento × alíquota          (ICMS sobre as vendas)
  crédito  = compras     × alíquota          (crédito sobre as compras de mercadorias informadas)
  ICMS a recolher = max(0, débito − crédito) = max(0, (faturamento − compras) × alíquota)
  ```
  `compras` = valor informado em "Compras / Insumos". O crédito é calculado sobre esse valor.
- **ISS** (serviços/misto) — **cumulativo**, sem crédito:
  - Se informado: `faturamento × alíquotaInformada`.
  - Se não informado: média **3%**.

> ⚠️ **Crédito de ICMS sobre compras:** a apuração acima credita a alíquota informada sobre **todo** o valor de compras/insumos informado. Para máxima precisão, informe em "Compras / Insumos" apenas o valor de mercadorias/matérias-primas que geram crédito (aluguel e serviços de terceiros, por exemplo, não geram crédito de ICMS).

> No LP, o pró-labore **não é dedutível** — a base do IRPJ/CSLL é sempre `faturamento × presunção`, independentemente do pró-labore.

---

## 3. Lucro Real

Há dois caminhos: **efetivo** (quando o usuário informa folha, ICMS, ISS, despesas ou pró-labore) e **estimado** (por margem, quando nada é informado).

### 3.1 Lucro Real efetivo (com dados reais)

```
Lucro Real = max(0,
      Receita
    − CMV/Insumos
    − Folha de empregados
    − CPP patronal (folha × 20%)
    − Terceiros (folha × 5,8%)
    − Pró-labore dos sócios
    − CPP sobre pró-labore (pró-labore × 20%)
    − Despesas operacionais
    − ICMS
    − ISS
    − PIS/COFINS não-cumulativo líquido )
```

Componentes:

| Item | Fórmula |
|---|---|
| **PIS/COFINS não-cumulativo** | `max(0, (faturamento − insumos) × 9,25%)` (PIS 1,65% + COFINS 7,6%, crédito sobre insumos) |
| **ICMS (não-cumulativo)** | `max(0, faturamento × alíquotaICMS − compras × alíquotaICMS)` = `max(0, (faturamento − compras) × alíquotaICMS)`. Alíquota informada, ou média **12%** (comércio/indústria) se não informada. **Compras = insumos/compras de mercadorias informados.** |
| **ISS (cumulativo)** | `faturamento × alíquotaISS informada`; se não informada, **média 3%** (serviços/misto). Não há crédito sobre compras. |
| **IRPJ** | `LucroReal × 15%` |
| **IRPJ adicional** | `max(0, LucroReal − 20.000) × 10%` |
| **CSLL** | `LucroReal × 9%` |

> ⚠️ O código usa deliberadamente a mesma regra de fallback de ICMS/ISS para LP e LR ("comparação justa entre os dois regimes" — comentário no código-fonte). Não há mais diferenciação de "LR usa 0" — isso valia numa versão anterior do sistema.

**Carga total (hoje)** = `IRPJ + IRPJ adicional + CSLL + PIS/COFINS + ICMS + ISS + CPP folha + Terceiros + CPP pró-labore`.

### 3.2 Lucro Real estimado (sem dados de custo)

Quando não há folha/ICMS/ISS/despesas/pró-labore informados, usa alíquota efetiva estimada por setor:

| Setor | Alíquota efetiva | Composição |
|---|---|---|
| Serviços / Misto | **12,3375%** | PIS/COFINS 6,9375% (9,25% × 0,75) + ISS 3% + IRPJ 1,5% (15%×10%) + CSLL 0,9% (9%×10%) |
| Comércio | **15,10%** | PIS/COFINS 3,70% + ICMS 10,20% (17% × 0,60) + IRPJ 0,75% (15%×5%) + CSLL 0,45% |
| Indústria | **11,70%** | PIS/COFINS 3,70% + ICMS 4,80% + IPI 2,00% + IRPJ 0,75% + CSLL 0,45% |

```
imposto = faturamento × alíquotaEstimada
        + adicional  (max(0, faturamento × margem − 20.000) × 10%, margem = 10% serv / 5% com-ind)
        + CPP folha + Terceiros + CPP pró-labore
```

> **Limitações do modelo (LR):** não considera adições/exclusões do LALUR, compensação de prejuízos fiscais (trava de 30%), créditos de PIS/COFINS sobre outras despesas além de insumos, nem RAT/FAP. A apuração oficial é trimestral ou anual — os valores mensais são aproximação.

---

## 4. Encargos sobre folha e pró-labore (LP e LR)

Aplicam-se ao Lucro Presumido e ao Lucro Real (no Simples estão embutidos no DAS como CPP, exceto Anexo IV):

| Encargo | Base | Alíquota |
|---|---|---|
| CPP patronal | folha de **empregados** | 20% |
| Terceiros (Sistema S) | folha de **empregados** | 5,8% |
| CPP sobre pró-labore | **pró-labore** dos sócios | 20% (sem terceiros) |

> **Fallback de folha:** se a folha específica de LP/LR não foi informada mas a empresa preencheu a folha para o Fator R (Simples), o sistema usa essa folha como base dos encargos.

---

## 5. Sócios e Pró-labore

### 5.1 Registro de sócio (`SocioAdministrador`)

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | identificador |
| `nome` | string | nome do sócio (opcional) |
| `prolaboreMensal` | número | pró-labore mensal em R$ |

### 5.2 Cálculo por sócio

Para cada sócio com pró-labore:

| Item | Fórmula | Quem paga |
|---|---|---|
| **IRPF** | `calcularIRPF(prolabore)` (tabela progressiva, Seção 0.5) | sócio |
| **INSS (contribuinte individual)** | `min(prolabore, 8.157,41) × 20%` | sócio |
| **INSS patronal (CPP)** | `prolabore × 20%` | empresa |
| **Custo total do sócio** | `IRPF + INSS individual + INSS patronal` | — |

### 5.3 Benefício fiscal e custo líquido

```
totalPróLabore   = Σ prolabore de todos os sócios
totalIRPF        = Σ IRPF
totalINSSemp     = Σ INSS individual
totalINSSpatronal= Σ INSS patronal (= totalPróLabore × 20%)

benefícioFiscalEmpresa = (Lucro Real)  ? totalPróLabore × 24%  : 0
                          (Lucro Presumido → 0, pois pró-labore não é dedutível)
custoTotalBruto = totalIRPF + totalINSSemp + totalINSSpatronal
custoLíquido    = max(0, custoTotalBruto − benefícioFiscalEmpresa)
```

- No **Lucro Real** o pró-labore é dedutível → gera economia de **24%** (IRPJ 15% + CSLL 9%).
- No **Lucro Presumido** não há dedução (base é sempre `faturamento × presunção`).
- Distribuição de lucros é isenta de IRPF para o sócio (Lei 9.249/1995 Art. 10) — por isso o custo do pró-labore é comparado à alternativa de distribuir lucro.

---

## 6. Grupo Societário — limite do Simples

### 6.1 Registro de empresa do grupo (`EmpresaGrupo`)

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | string | identificador |
| `nome` | string | nome da empresa |
| `faturamentoMensal` | número | faturamento mensal em R$ |
| `participacao` | número | % de participação do sócio (0–100) |
| `administrador` | booleano | true = sócio é administrador desta PJ |

### 6.2 Regra de soma (LC 123/2006 Art. 3º §4º)

Uma empresa do grupo **soma** seu faturamento ao total quando:
`participacao > 10%` **OU** `administrador === true` (inciso V — administrador soma independentemente do %).

```
faturamentoAnualPrincipal = faturamentoMensalPrincipal × 12
faturamentoAnualGrupo     = Σ (empresas que contam) faturamentoMensal × 12
faturamentoAnualTotal     = principal + grupo
dentroDoLimite            = faturamentoAnualTotal ≤ 4.800.000
percentualUtilizado       = faturamentoAnualTotal / 4.800.000 × 100
```

Se o total ultrapassa R$ 4,8M/ano, **todas** as empresas do grupo são desenquadradas do Simples.

---

## 7. Outros regimes

### 7.1 MEI

`DAS = valor fixo por atividade` (Seção 0.6). Independe do faturamento. Alíquota efetiva = `DAS / faturamento`. Limite R$ 81.000/ano.

### 7.2 Profissional Liberal (Pessoa Física)

```
IRPF  = calcularIRPF(faturamento)              (tabela progressiva)
ISS   = faturamento × 3%                        (média municipal)
INSS  = min(faturamento, 8.157,41) × 20%        (contribuinte individual)
Carga = IRPF + ISS + INSS
```

### 7.3 Produtor Rural (PJ)

Tratado como **Lucro Presumido** para fins de IRPJ/CSLL/PIS-COFINS (presunção do setor). Alíquota efetiva = `getAliquotaLucroPresumido(setor)` + adicional.

---

## 8. ICMS por UF (alíquota interna geral — mercadorias)

> ⚠️ **Esta tabela não é usada na carga tributária atual de LP/LR** (ver aviso na Seção 2.1) — ela alimenta apenas a função `estimarICMSISS()`, usada na projeção de transição da reforma (2029–2033) para regimes fora de LP/LR. Documentada aqui porque está presente no código-fonte. Valores 2025/2026 (alguns incluem FCP):

| UF | Alíq. | UF | Alíq. | UF | Alíq. |
|---|---|---|---|---|---|
| AC | 17% | MA | 22% | RJ | 20% |
| AL | 19% | MG | 18% | RN | 18% |
| AM | 20% | MS | 17% | RO | 17,5% |
| AP | 18% | MT | 17% | RR | 20% |
| BA | 19% | PA | 17% | RS | 17% |
| CE | 20% | PB | 18% | SC | 17% |
| DF | 20% | PE | 20,5% | SE | 19% |
| ES | 17% | PI | 21% | SP | 18% |
| GO | 17% | PR | 19,5% | TO | 20% |

Apuração (apenas na projeção de transição, não na carga atual): `ICMS = max(0, faturamento × alíquotaUF − insumos × alíquotaUF)`.

---

## 9. Exemplos numéricos

Premissas comuns: faturamento **R$ 100.000/mês**, insumos **R$ 30.000/mês**, folha de empregados **R$ 20.000/mês**, pró-labore **R$ 15.000/mês**, ICMS efetivo **8%**, comércio.

> ICMS é apurado por débito − crédito: `débito = 100.000 × 8% = 8.000`, `crédito = 30.000 × 8% = 2.400`, **ICMS a recolher = 5.600**.

### 9.1 Lucro Presumido (comércio)
```
Base presumida IRPJ = 100.000 × 8%           = 8.000
IRPJ                = 8.000 × 15%            = 1.200
IRPJ adicional      = max(0, 8.000−20.000)×10% = 0
CSLL                = 100.000 × 12% × 9%      = 1.080
PIS/COFINS          = 100.000 × 3,65%         = 3.650
ICMS  (débito − crédito) = (100.000 − 30.000) × 8% = 5.600
ISS                 = 0 (comércio)
CPP folha           = 20.000 × 20%            = 4.000
Terceiros           = 20.000 × 5,8%           = 1.160
CPP pró-labore      = 15.000 × 20%            = 3.000
─────────────────────────────────────────────────────
CARGA TOTAL                                   = 19.690  (19,69% da receita)
```

### 9.2 Lucro Real efetivo (comércio, mesmos dados)
```
PIS/COFINS = max(0, (100.000−30.000)×9,25%)   = 6.475
ICMS       = (100.000 − 30.000) × 8%          = 5.600
CPP folha  = 4.000 ; Terceiros = 1.160 ; CPP pró-labore = 3.000
Lucro Real = max(0, 100.000 − 30.000 − 20.000 − 4.000 − 1.160
                    − 15.000 − 3.000 − 0(desp) − 5.600 − 0 − 6.475) = 14.765
IRPJ       = 14.765 × 15%                       = 2.215
IRPJ adic. = 0
CSLL       = 14.765 × 9%                        = 1.329
─────────────────────────────────────────────────────
CARGA TOTAL = 2.215 + 0 + 1.329 + 6.475 + 5.600 + 0 + 4.000 + 1.160 + 3.000 = 23.779
```

### 9.3 Simples Nacional (comércio, Anexo I)
```
RBT12           = 100.000 × 12 = 1.200.000  → faixa 4 (≤ 1.800.000): nominal 10,7%, deduzir 22.500
aliquotaEfetiva = (1.200.000 × 10,7% − 22.500) / 1.200.000 = (128.400 − 22.500)/1.200.000 = 8,825%
DAS mensal      = 100.000 × 8,825% ≈ 8.825
```

### 9.4 Profissional Liberal (rendimento R$ 25.000/mês)
```
IRPF = 25.000 × 27,5% − 896,00 = 5.979 (acima de 7.350 → sem desconto Lei 15.270)
ISS  = 25.000 × 3%             = 750
INSS = min(25.000; 8.157,41) × 20% = 1.631
─────────────────────────────────────────
Carga total = 8.360
```

---

## 10. Diferenças de comportamento a verificar no seu sistema

Pontos onde este sistema faz uma escolha específica — confira se o seu segue a mesma regra:

1. **Fator R não migra o anexo automaticamente** — é só análise (Seção 1.4).
2. **Anexo IV do Simples não soma CPP por fora** (Seção 1.2).
3. **ICMS não-cumulativo (LP e LR):** `ICMS = max(0, (faturamento − compras) × alíquota)` — débito sobre vendas menos crédito sobre as compras de mercadorias informadas. Alíquota informada ou média 12% se não informada. **O crédito incide sobre todo o valor de "Compras / Insumos" informado** (Seções 2.1 e 3.1). O ISS permanece cumulativo (sem crédito).
4. **RAT/FAP não é modelado** — só CPP 20% + terceiros 5,8% (Seção 0.4).
5. **Adicional de IRPJ é mensalizado** (limiar R$ 20.000/mês = R$ 60.000/trimestre).
6. **IRPF com desconto da Lei 15.270/2025** (isenção efetiva até R$ 5.000/mês) — se o seu sistema usa só a tabela clássica, os valores de pró-labore/PF divergem.
7. **Pró-labore dedutível só no LR** (24%); no LP não reduz a base.
8. **Tetos e salário-mínimo são de 2026** — atualize se comparar com outro ano.
