/**
 * Testes do motor de cálculo — rodar com `npm test` (node --test, sem dependências extras).
 *
 * O Node não resolve as importações sem extensão do motor (TypeScript), então o Vite — já
 * instalado no projeto — carrega os módulos via ssrLoadModule.
 *
 * Os valores esperados foram conferidos à mão contra a LC 214/2025, a LC 123/2006 e a
 * calculadora oficial da RFB. Se um teste quebrar depois de mudar uma regra de propósito,
 * confira a conta de novo antes de atualizar o número.
 */
import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let server, eng, setoresMod, catalogo, partilha, tipos

before(async () => {
  server = await createServer({
    root: raiz,
    configFile: false,
    logLevel: 'silent',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  eng = await server.ssrLoadModule('/src/engine/calculadora.ts')
  setoresMod = await server.ssrLoadModule('/src/data/setores.ts')
  catalogo = await server.ssrLoadModule('/src/data/atividadesSimples.ts')
  partilha = await server.ssrLoadModule('/src/data/partilhaSimples.ts')
  tipos = await server.ssrLoadModule('/src/data/tiposReceitaSimples.ts')
})
after(async () => { await server?.close() })

const R = Math.round
const S = v => {
  const s = setoresMod.SETORES.find(x => x.value === v)
  assert.ok(s, `setor não encontrado: ${v}`)
  return s
}
const calc = (regime, setor, fat, extra = {}) =>
  eng.calcularTodosOsCenarios({
    regime, setor: S(setor), faturamentoMensal: fat, insumosMensais: fat * 0.2,
    perfilClientes: 'b2b', uf: 'SP', ...extra,
  })
const proj = r => r.projecaoAnos.map(p => R(p.impostoMensal))
const novaPorAno = (r, ano) => r.projecaoAnos.find(p => p.ano === ano).parcelaNovaAnual / 12
/** igual a menos 1 real (arredondamento) */
const perto = (a, b, msg) => assert.ok(Math.abs(a - b) <= 1, `${msg ?? ''} esperado ${b}, veio ${a}`)

describe('Vendas ao governo', () => {
  it('não reduzem a carga projetada em nenhum regime (art. 441 §2: é divisão entre entes)', () => {
    for (const regime of ['simples_nacional', 'lucro_presumido', 'lucro_real']) {
      const a = calc(regime, 'saneamento_basico', 100000, { pctVendasGoverno: 0 })
      const b = calc(regime, 'saneamento_basico', 100000, { pctVendasGoverno: 100 })
      assert.deepEqual(a.projecaoAnos, b.projecaoAnos, regime)
      assert.equal(b.alertaContratoAdministrativo, true)
    }
  })
})

describe('Simples Nacional — DAS e projeção', () => {
  it('DAS fica constante de 2026 a 2033 (Anexos I–V da LC 214 mantêm alíquotas)', () => {
    const r = calc('simples_nacional', 'comercio_varejo', 100000)
    assert.deepEqual(proj(r), Array(8).fill(8825))
    assert.equal(R(r.cargaTotalReformaMensal), R(r.impostoAtualMensal))
  })

  it('6ª faixa em 2027–2028: nominal 0,1 p.p. menor (art. 347 LC 214)', () => {
    const r = calc('simples_nacional', 'comercio_varejo', 350000)
    assert.deepEqual(proj(r), [35000, 34650, 34650, 35000, 35000, 35000, 35000, 35000])
  })

  it('MEI não muda com a reforma', () => {
    const r = calc('mei', 'comercio_varejo', 5000)
    assert.equal(R(r.cargaTotalReformaMensal), R(r.impostoAtualMensal))
    assert.equal(R(r.variacaoAbsolutaMensal), 0)
  })
})

describe('Partilha oficial do DAS (LC 214, Anexos I–V)', () => {
  it('cada uma das 210 linhas soma 100%', () => {
    let linhas = 0
    for (const anexo of ['I', 'II', 'III', 'IV', 'V']) {
      for (const ano of partilha.ANOS_PARTILHA_LC214) {
        const faixas = partilha.PARTILHA_SIMPLES_LC214[anexo][ano]
        assert.equal(faixas.length, 6, `${anexo} ${ano}`)
        for (const [i, linha] of faixas.entries()) {
          const soma = Object.values(linha).reduce((a, b) => a + b, 0)
          assert.ok(Math.abs(soma - 100) < 0.06, `${anexo} ${ano} faixa ${i + 1} soma ${soma}`)
          linhas++
        }
      }
    }
    assert.equal(linhas, 210)
  })

  it('tabela de 2033 coincide com PIS/COFINS e ICMS/ISS de hoje (LC 123)', () => {
    assert.deepEqual(eng.PARTILHA_CBS_SIMPLES.III, [0.156, 0.171, 0.166, 0.166, 0.156, 0.195])
    assert.deepEqual(eng.PARTILHA_IBS_SIMPLES.V, [0.14, 0.17, 0.19, 0.21, 0.235, 0])
  })

  it('transição: IBS cresce 10%/ano do ICMS/ISS e CBS+IBS dentro do DAS acompanha', () => {
    // Anexo V, 4ª faixa (RBT12 R$ 1,2 mi), R$ 100 mil/mês, folha 5% → Anexo V; alíquota efetiva 19,075%
    const r = calc('simples_nacional', 'tecnologia_ti', 100000, { folhaMensal: 5000 })
    assert.equal(r.anexoSimples, 'V')
    perto(R(r.impostoAtualMensal), 19075)
    perto(R(novaPorAno(r, 2031)), 4855)  // 19.075 × (19,15% CBS + 6,3% IBS)
    perto(R(novaPorAno(r, 2033)), 7659)  // 19.075 × (19,15% + 21%)
    assert.equal(R(novaPorAno(r, 2026)), 0)
  })

  it('teto do ISS na 5ª faixa do Anexo III (acima de 14,925% de alíquota efetiva)', () => {
    // RBT12 R$ 3 mi: alíquota efetiva = 21% − 125.640/3.000.000 = 16,812%
    const r = calc('simples_nacional', 'tecnologia_ti', 250000, { insumosMensais: 0, folhaMensal: 100000 })
    assert.equal(r.anexoSimples, 'III')
    perto(R(r.impostoAtualMensal), 42030)
    perto(R(novaPorAno(r, 2027)), 6928)   // com teto; sem teto seria 6.557
    perto(R(novaPorAno(r, 2029)), 8351)
    perto(R(novaPorAno(r, 2033)), 20637)  // 2033: sem nota de teto
  })

  it('abaixo do limiar o teto não se aplica', () => {
    const r = calc('simples_nacional', 'tecnologia_ti', 160000, { insumosMensais: 0, folhaMensal: 60000 })
    perto(R(novaPorAno(r, 2027)), 3608)
  })
})

describe('Exportações no Simples (tpRBSN 3 e 4)', () => {
  // Indústria, Anexo II, 4ª faixa (RBT12 R$ 1,2 mi): alíquota efetiva 9,325%
  // CBS+IBS dentro do DAS = 4,29% da receita; IPI = 7,5% do DAS = 0,6994% da receita
  const base = () => calc('simples_nacional', 'industria_transformacao', 100000, { insumosMensais: 30000 })

  it('receita exportada sai da parcela de consumo e do IPI do DAS', () => {
    perto(R(base().impostoAtualMensal), 9325)
    const r = calc('simples_nacional', 'industria_transformacao', 100000, { insumosMensais: 30000, exportacoesMensais: 40000 })
    perto(R(r.impostoAtualMensal), 9325 - R(40000 * 0.049894), 'DAS com 40k exportados')
    assert.equal(r.exportacaoSimples.tipoReceita, 3)
    perto(R(r.exportacaoSimples.reducaoIPIMensal), 280)
    assert.equal(R(r.exportacaoSimples.suspensoMensal), 0)
  })

  it('exportação indireta (tpRBSN 4): mesmo DAS, CBS/IBS ficam suspensos', () => {
    const dir = calc('simples_nacional', 'industria_transformacao', 100000, { insumosMensais: 30000, exportacoesMensais: 40000 })
    const ind = calc('simples_nacional', 'industria_transformacao', 100000, { insumosMensais: 30000, exportacoesMensais: 40000, tipoExportacao: 'indireta' })
    assert.equal(ind.exportacaoSimples.tipoReceita, 4)
    assert.equal(R(ind.impostoAtualMensal), R(dir.impostoAtualMensal))
    perto(R(ind.exportacaoSimples.suspensoMensal), R(40000 * 0.0429))
  })

  it('tudo exportado: sobram só IRPJ, CSLL e CPP', () => {
    const r = calc('simples_nacional', 'industria_transformacao', 100000, { insumosMensais: 30000, exportacoesMensais: 150000 })
    assert.equal(r.exportacaoSimples.valorMensal, 100000) // limitado ao faturamento
    perto(R(r.impostoAtualMensal), 9325 - R(100000 * 0.049894))
    assert.equal(R(novaPorAno(r, 2033)), 0)
  })

  it('com alíquota informada (PGDAS-D) não reaplica a exportação', () => {
    const r = calc('simples_nacional', 'industria_transformacao', 100000, { exportacoesMensais: 40000, aliquotaAtualOverride: 0.08 })
    assert.equal(r.exportacaoSimples, null)
    assert.equal(R(r.impostoAtualMensal), 8000)
  })

  it('efeitoTipoReceitaSimples: tabela da RFB (tipos 0–5 e 9)', () => {
    assert.deepEqual(tipos.TIPOS_RECEITA_SIMPLES.map(t => t.codigo), [0, 1, 2, 3, 4, 5, 9])
    assert.equal(tipos.getTipoReceitaSimples(5).fatorReceita, 0.5)
    assert.equal(tipos.getTipoReceitaSimples(4).pendenteSuspenso, true)
    const e = tipos.efeitoTipoReceitaSimples(tipos.getTipoReceitaSimples(5), 1000, 0.1)
    assert.equal(e.devido, 50)
  })
})

describe('Simulador de crescimento', () => {
  it('escala as exportações junto com o faturamento (mantém a participação na receita)', () => {
    const dados = calc('simples_nacional', 'industria_transformacao', 100000, { insumosMensais: 30000, exportacoesMensais: 40000 })
    const [dobro, menos40] = eng.calcularCurvaCrescimento(dados, [100, -40])
    const direto = (fat, ins, exp) =>
      calc('simples_nacional', 'industria_transformacao', fat, { insumosMensais: ins, exportacoesMensais: exp })
    perto(R(dobro.impostoAtualMensal), R(direto(200000, 60000, 80000).impostoAtualMensal), '+100%')
    perto(R(menos40.impostoAtualMensal), R(direto(60000, 18000, 24000).impostoAtualMensal), '−40%')
  })
})

describe('Receitas sem CBS/IBS no Simples (tpRBSN 2)', () => {
  it('livros, jornais e periódicos não pagam a parcela de tributos sobre consumo do DAS', () => {
    const r = calc('simples_nacional', 'livros_periodicos', 50000, { perfilClientes: 'b2c' })
    perto(R(r.impostoAtualMensal), 1833)
    perto(R(r.receitaSemIBSCBSSimples.reducaoDASMensal), 1762)
    assert.equal(r.receitaConsumoSimplesMensal, 0)
    assert.equal(R(novaPorAno(r, 2033)), 0)
  })

  it('radiodifusão aberta (410010) e combustíveis com monofasia anterior (620006) seguem a mesma regra', () => {
    for (const v of ['radiodifusao_aberta', 'postos_combustivel']) {
      const com = calc('simples_nacional', v, 80000, { perfilClientes: 'b2c' })
      const sem = eng.calcularTodosOsCenarios({
        regime: 'simples_nacional', setor: { ...S(v), tipoReceitaSimples: undefined }, faturamentoMensal: 80000,
        insumosMensais: 16000, perfilClientes: 'b2c', uf: 'SP',
      })
      const parcela = 80000 * (sem.cbsSimplesEfetivo + sem.ibsSimplesEfetivo)
      assert.ok(parcela > 0, v)
      perto(R(com.impostoAtualMensal), R(sem.impostoAtualMensal - parcela), `${v}: DAS`)
      assert.equal(com.receitaConsumoSimplesMensal, 0, v)
    }
  })

  it('só os setores da tabela oficial (tipo 2) carregam o tipo: livros, radiodifusão e combustíveis', () => {
    assert.deepEqual(
      setoresMod.SETORES.filter(s => s.tipoReceitaSimples === 2).map(s => s.value).sort(),
      ['livros_periodicos', 'postos_combustivel', 'radiodifusao_aberta'],
    )
  })
})

describe('Exportações no regime regular (art. 79 LC 214)', () => {
  const lp = exp => calc('lucro_presumido', 'industria_transformacao', 100000, { insumosMensais: 30000, exportacoesMensais: exp })

  it('saem da base do IVA e mantêm o crédito das compras', () => {
    assert.equal(R(lp(0).impostoIVABrutoMensal), 26500)
    assert.equal(R(lp(40000).impostoIVABrutoMensal), 15900)
    assert.equal(R(lp(40000).baseCalculoEfetiva), 60000)
    assert.equal(R(lp(40000).exportacoesImunesMensal), 40000)
    assert.equal(R(lp(40000).creditoInsumosMensal), R(lp(0).creditoInsumosMensal))
  })

  it('tudo exportado: hoje e 2033 iguais (sobra só IRPJ/CSLL)', () => {
    const r = lp(100000)
    assert.equal(R(r.impostoIVABrutoMensal), 0)
    assert.equal(R(r.impostoAtualMensal), 2604)
    assert.equal(R(r.cargaTotalReformaMensal), 2604)
  })

  it('o "hoje" também exclui ICMS, ISS, PIS/COFINS e IPI das exportações', () => {
    assert.ok(lp(40000).impostoAtualMensal < lp(0).impostoAtualMensal)
  })

  it('profissional liberal: ISS de hoje exclui o serviço exportado; IRPF e INSS não', () => {
    const pl = exp => eng.calcularTodosOsCenarios({
      regime: 'profissional_liberal', setor: S('consultoria_empresarial'), faturamentoMensal: 20000,
      insumosMensais: 0, perfilClientes: 'b2b', uf: 'SP', exportacoesMensais: exp,
    })
    assert.equal(R(pl(0).impostoAtualMensal - pl(10000).impostoAtualMensal), 300) // 3% × 10.000
  })
})

describe('Profissional liberal, produtor rural e não contribuintes', () => {
  const pl = setor => calc('profissional_liberal', setor, 20000, { insumosMensais: 0 })
  const ponto2033 = r => R(r.projecaoAnos.find(p => p.ano === 2033).impostoMensal)

  it('o destaque "carga pós-reforma" coincide com o ponto de 2033 da projeção (IRPF/INSS continuam)', () => {
    const r = pl('consultoria_empresarial')
    // hoje: IRPF + ISS 3% + INSS = 6.835; depois: IRPF + INSS + IVA (5.300) = 11.535 — antes mostrava só o IVA (5.300)
    assert.equal(R(r.impostoAtualMensal), 6835)
    assert.equal(R(r.cargaTotalReformaMensal), 11535)
    assert.equal(R(r.cargaTotalReformaMensal), ponto2033(r))
    assert.equal(R(r.variacaoAbsolutaMensal), 4700)
    const rural = calc('produtor_rural', 'produtor_rural_pj', 100000, { insumosMensais: 0 })
    assert.equal(R(rural.cargaTotalReformaMensal), ponto2033(rural))
    assert.ok(rural.cargaTotalReformaMensal > 0, 'produtor rural não-contribuinte ainda paga os tributos que não são ICMS/ISS')
  })

  it('transportador autônomo de carga PF não é contribuinte (LC 214 art. 26 VII; RFB cClassTrib 410015)', () => {
    const setor = S('transportador_autonomo_pf')
    assert.equal(setor.naoContribuinte, true)
    assert.equal(setor.reducao, 0)  // os 40% do art. 286 são do transporte coletivo de passageiros
    const r = pl('transportador_autonomo_pf')
    assert.equal(r.naoContribuinteSetor, true)
    assert.equal(R(r.impostoIVALiquidoMensal), 0)
    assert.equal(R(r.cargaTotalReformaMensal), 6235)  // 6.835 de hoje − ISS de 3% (R$ 600); IRPF e INSS ficam
    assert.equal(R(r.cargaTotalReformaMensal), ponto2033(r))
  })

  it('só o transportador é marcado como não contribuinte por natureza', () => {
    assert.deepEqual(setoresMod.SETORES.filter(s => s.naoContribuinte).map(s => s.value), ['transportador_autonomo_pf'])
  })
})

describe('Setores e enquadramento no Simples', () => {
  const todos = () => setoresMod.SETORES

  it('todo setor elegível tem cAtivSN coerente com o anexo do cálculo; vedados não têm', () => {
    let vedados = 0, elegiveis = 0
    for (const setor of todos()) {
      const r = eng.calcularTodosOsCenarios({
        regime: 'simples_nacional', setor, faturamentoMensal: 50000, insumosMensais: 10000, perfilClientes: 'b2c', uf: 'SP',
      })
      if (setor.vedadoSimples) { assert.equal(r.atividadeSimples, null, setor.value); vedados++; continue }
      const a = r.atividadeSimples
      assert.ok(a, `sem cAtivSN: ${setor.value}`)
      const ok = catalogo.anexosDaAtividade(a).includes(r.anexoSimples) || (a.codigo === '01' && r.anexoSimples === 'II')
      assert.ok(ok, `${setor.value}: anexo ${r.anexoSimples} x cAtivSN ${a.codigo}`)
      elegiveis++
    }
    assert.equal(vedados + elegiveis, todos().length)
  })

  it('catálogo oficial: 15 atividades (01–14 e 90), só a 09 sujeita ao Fator R', () => {
    assert.equal(catalogo.ATIVIDADES_SIMPLES.length, 15)
    assert.deepEqual(catalogo.ATIVIDADES_SIMPLES.filter(a => a.anexoComFatorR).map(a => a.codigo), ['09'])
    assert.equal(catalogo.getAtividadeSimples('90').naoTributavel, true)
  })

  it('rótulo do anexo explica quando o DAS é apurado por outro anexo (indústria: cAtivSN 01 diz "I", DAS pelo II)', () => {
    const a = catalogo.getAtividadeSimples('01')
    assert.equal(catalogo.rotuloAnexoAtividade(a, 'I'), 'Anexo I')
    assert.match(catalogo.rotuloAnexoAtividade(a, 'II'), /DAS apurado pelo Anexo II/)
    assert.equal(catalogo.rotuloAnexoAtividade(catalogo.getAtividadeSimples('09'), 'V'), 'Anexo III ou V')
  })

  it('vedações: energia (distribuição e geração), produtor rural PF; instalação solar é permitida', () => {
    for (const v of ['energia_residencial', 'geracao_energia', 'produtor_rural_pf']) assert.equal(S(v).vedadoSimples, true, v)
    assert.notEqual(S('energia_renovavel').vedadoSimples, true)
  })

  it('Anexo IV por lei: advocacia, limpeza e vigilância ignoram a escolha de outro anexo', () => {
    for (const v of ['advocacia', 'limpeza_conservacao', 'seguranca_privada']) {
      const r = calc('simples_nacional', v, 50000, { anexoSimples: 'III', folhaMensal: 15000 })
      assert.equal(r.anexoSimples, 'IV', v)
      assert.equal(r.atividadeSimples.codigo, '14', v)
    }
  })

  it('construção: Anexo IV por padrão (cAtivSN 13), reformas no III (cAtivSN 12) se escolhido', () => {
    const padrao = calc('simples_nacional', 'construcao_civil', 50000, { folhaMensal: 15000 })
    assert.equal(padrao.anexoSimples, 'IV')
    assert.equal(padrao.atividadeSimples.codigo, '13')
    const reforma = calc('simples_nacional', 'construcao_civil', 50000, { anexoSimples: 'III' })
    assert.equal(reforma.anexoSimples, 'III')
    assert.equal(reforma.atividadeSimples.codigo, '12')
  })

  it('anexo padrão do produtor rural PJ e da agroindústria; escolha manual vence', () => {
    assert.equal(calc('simples_nacional', 'produtor_rural_pj', 50000).anexoSimples, 'I')
    assert.equal(calc('simples_nacional', 'agroindustria_cooperativas', 50000).anexoSimples, 'II')
    assert.equal(calc('simples_nacional', 'agroindustria_cooperativas', 50000, { anexoSimples: 'I' }).anexoSimples, 'I')
  })

  it('Fator R do jornalismo: folha ≥ 28% → Anexo III; abaixo → Anexo V (cAtivSN 09)', () => {
    const iii = calc('simples_nacional', 'jornalismo_midia', 50000, { folhaMensal: 15000 })
    const v = calc('simples_nacional', 'jornalismo_midia', 50000, { folhaMensal: 5000 })
    assert.equal(iii.anexoSimples, 'III')
    assert.equal(v.anexoSimples, 'V')
    assert.equal(v.atividadeSimples.codigo, '09')
  })
})
