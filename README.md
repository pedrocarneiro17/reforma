# ReformaCalc — Simulador da Reforma Tributária

Simulador web que compara a carga tributária de hoje com a do novo sistema **IVA Dual (CBS + IBS)** entre 2026 e 2033, por setor e regime (Simples Nacional, MEI, Lucro Presumido, Lucro Real, profissional liberal e produtor rural).

Base legal: LC 214/2025 (redação da LC 227/2026), Decreto 12.955/2026 e LC 123/2006. Os valores são **estimativas educacionais** e não substituem assessoria fiscal.

Para o detalhe de negócio e das regras de cálculo, veja [DOCUMENTACAO.md](DOCUMENTACAO.md).

## Como rodar

Requisitos: Node.js 18 ou superior.

```bash
npm install
cp .env.example .env     # preencha as variáveis (veja abaixo)
npm run dev:all          # front-end (porta 3000) + API (porta 3001)
```

- `npm run dev` sobe só o front-end (Vite, porta 3000); as chamadas a `/api` são encaminhadas para a porta 3001.
- `npm run build` gera o `dist/` e o pacote do motor para o servidor (`server/gerado/`); `npm start` sobe a API e serve o `dist/`.
- `npm run build:engine` gera só o pacote do motor usado pelo assistente de perguntas (já roda em `dev:all` e `dev:server`).

Variáveis do `.env` (o arquivo **não** é versionado): `DATABASE_URL` (PostgreSQL), `JWT_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `NODE_ENV` e `PORT`. A API também aceita `API_PORT`, que tem prioridade sobre `PORT`. O `.env.example` mostra o formato.

Assistente de perguntas: defina `ANTHROPIC_API_KEY` para ligá-lo (sem a chave o botão não aparece). Opcionais: `ASSISTENTE_MODELO` e `ASSISTENTE_LIMITE_HORA`. Detalhes na seção 8.6 de [DOCUMENTACAO.md](DOCUMENTACAO.md).

## Testes

```bash
npm test
```

Os testes do assistente (sem rede e sem chave) ficam em [tests/assistente.test.mjs](tests/assistente.test.mjs) e os do importador do Único (arquivo sintético) em [tests/unico.test.mjs](tests/unico.test.mjs). Os do motor ficam em [tests/motor.test.mjs](tests/motor.test.mjs) e cobrem o motor de cálculo: valores conferidos à mão contra a lei (DAS do Simples, 6ª faixa, teto do ISS, exportações, livros, vendas ao governo), as tabelas de partilha e o enquadramento dos setores. Usam o runner nativo do Node e o Vite já instalado, sem dependências extras.

## Estrutura

| Pasta/arquivo | O que tem |
|---|---|
| `src/engine/calculadora.ts` | Motor de cálculo (carga atual, IVA Dual, projeção 2026–2033, comparador de regimes) |
| `src/data/setores.ts` | Setores com redução de IBS/CBS, tipo, anexo do Simples, vedações |
| `src/data/atividadesSimples.ts` | Catálogo oficial de atividades do Simples (`cAtivSN`, NT 2026.005) |
| `src/data/tiposReceitaSimples.ts` | Tipos de receita bruta do Simples (`tpRBSN`) |
| `src/data/partilhaSimples.ts` | Partilha do DAS por anexo, faixa e ano (**gerado**, não editar à mão) |
| `src/components/` | Formulário, dashboard, comparador, memória de cálculo |
| `server/` | API Express: autenticação, administração, limite de simulações e assistente de perguntas |
| `src/utils/unico.ts` | Importador do CSV de Produtos do Único (soma e classifica; não calcula imposto) |
| `src/assistente/` | Ferramentas que o assistente usa para chamar o motor (a IA não calcula) |
| `tests/` | Testes do motor e do assistente |
| `.claude/skills/reforma-tributaria/` | Texto da LC 214/2025 e do Decreto 12.955/2026 por capítulo |

## Atualizar quando a lei mudar

- **Partilha do Simples:** se o texto da lei em `.claude/skills/reforma-tributaria/lcp214/` mudar, regenere os dados:

  ```bash
  python -I scripts/gerar_partilha_simples.py
  ```

  O script falha se alguma linha não somar 100%. Depois rode `npm test`.
- **Texto da legislação:** `divide_normas.py` baixa a LC 214 e o Decreto do Planalto e os divide por capítulo (requer `pip install requests beautifulsoup4`).
- **Guia em PDF:** `docs/gerar_guia.py` gera o guia técnico para contadores.

## Deploy

Railway (`railway.toml`): build com `npm install && npm run build`, start com `npm start`, verificação de saúde em `/api/health`.

## Fontes das regras do Simples

O catálogo de atividades e os tipos de receita seguem a calculadora oficial da Receita Federal (código aberto, licença MIT): [calculadora-rtc-regime-regular](https://github.com/ReceitaFederal/calculadora-rtc-regime-regular) e [calculadora-rtc-simples-nacional](https://github.com/ReceitaFederal/calculadora-rtc-simples-nacional). A alíquota efetiva do Simples continua sendo calculada pelo PGDAS-D.
