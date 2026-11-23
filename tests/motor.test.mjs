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
    // RBT12 de R$ 4,2 mi (acima do sublimite): DAS de R$ 35.000 + ICMS por fora; a redução de 0,1% do faturamento
    // (R$ 350) só mexe no DAS em 2027–2028. Depois, o ICMS cai 10%/ano e o IBS regular entra no lugar.
    const r = calc('simples_nacional', 'comercio_varejo', 350000)
    const das = [35000, 34650, 34650, 35000, 35000, 35000, 35000, 35000]
    const red = [0, 0, 0, 0.1, 0.2, 0.3, 0.4, 1]
    const esperado = das.map((d, i) => d + r.icmsIssPorForaSimplesMensal * (1 - red[i]) + r.ibsRegularSublimiteMensal * red[i])
    assert.deepEqual(proj(r), esperado.map(R))
    assert.equal(R(r.projecaoAnos[0].impostoMensal - r.projecaoAnos[1].impostoMensal), 350)
  })

  it('MEI não muda com a reforma', () => {
    const r = calc('mei', 'comercio_varejo', 5000)
    assert.equal(R(r.cargaTotalReformaMensal), R(r.impostoAtualMensal))
    assert.equal(R(r.variacaoAbsolutaMensal), 0)
  })
})

describe('Sublimite de R$ 3,6 mi: ICMS/ISS por fora do DAS (LC 123 arts. 13-A e 20 §1º)', () => {
  const sub = (fat, extra = {}) => calc('simples_nacional', 'tecnologia_ti', fat, { insumosMensais: fat * 0.2, folhaMensal: fat * 0.3, ...extra })

  it('vale para RBT12 do mercado interno acima de R$ 3,6 mi (no limite exato ainda não)', () => {
    assert.equal(sub(300000).sublimiteExcedido, false)     // R$ 3,6 mi exatos
    assert.equal(sub(300001).sublimiteExcedido, true)
    assert.equal(sub(100000).icmsIssPorForaSimplesMensal, 0)
    // exportação não tem ICMS/ISS: o sublimite olha só o mercado interno (R$ 400 mil − 150 mil) × 12 = R$ 3 mi
    assert.equal(sub(400000, { exportacoesMensais: 150000 }).sublimiteExcedido, false)
    // MEI não tem sublimite
    assert.equal(calc('mei', 'comercio_varejo', 5000).sublimiteExcedido, false)
  })

  it('o ISS (3%) entra por fora do DAS e o IBS regular o substitui em 2033', () => {
    const r = sub(350000)
    assert.equal(r.sublimiteExcedido, true)
    perto(R(r.icmsIssPorForaSimplesMensal), 10500)                       // serviço: ISS médio de 3% × R$ 350 mil
    const das = r.impostoAtualMensal - r.icmsIssPorForaSimplesMensal    // DAS (6ª faixa, só tributos federais)
    // IBS regular = IVA líquido × (1 − 9,25/26,5): a CBS segue dentro do DAS
    perto(R(r.ibsRegularSublimiteMensal), R(r.impostoIVALiquidoMensal * (1 - 9.25 / 26.5)))
    perto(R(r.cargaTotalReformaMensal), R(das + r.ibsRegularSublimiteMensal))
  })

  it('a carga pós-reforma coincide com o ponto de 2033 da projeção', () => {
    for (const r of [sub(350000), calc('simples_nacional', 'comercio_varejo', 350000, { insumosMensais: 200000, uf: 'SP' })]) {
      assert.equal(R(r.cargaTotalReformaMensal), R(r.projecaoAnos.find(p => p.ano === 2033).impostoMensal))
    }
  })

  it('abaixo do sublimite nada muda: carga pós-reforma = DAS', () => {
    const r = sub(200000)
    assert.equal(r.sublimiteExcedido, false)
    assert.equal(R(r.cargaTotalReformaMensal), R(r.impostoAtualMensal))
    assert.equal(R(r.ibsRegularSublimiteMensal), 0)
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

  it('tabela de 2033 coincide com PIS/COFINS e ICMS/ISS de hoje (LC 123, redação da LC 155/2016)', () => {
    // Anexos I–V da LC 155/2016 (vigência 1º/1/2018), conferidos no Planalto: COFINS + PIS/Pasep e ICMS/ISS por faixa
    const LC155 = {
      I:   { cons: [15.5, 15.5, 15.5, 15.5, 15.5, 34.4],      iss: [34, 34, 33.5, 33.5, 33.5, 0] },
      II:  { cons: [14, 14, 14, 14, 14, 25.5],                iss: [32, 32, 32, 32, 32, 0] },
      III: { cons: [15.6, 17.1, 16.6, 16.6, 15.6, 19.5],      iss: [33.5, 32, 32.5, 32.5, 33.5, 0] },
      IV:  { cons: [21.5, 25, 24, 23, 22, 25],                iss: [44.5, 40, 40, 40, 40, 0] },
      V:   { cons: [17.15, 17.15, 18.15, 19.15, 17.15, 20],   iss: [14, 17, 19, 21, 23.5, 0] },
    }
    for (const [anexo, t] of Object.entries(LC155)) {
      assert.deepEqual(eng.PARTILHA_CBS_SIMPLES[anexo], t.cons.map(x => x / 100), `PIS/COFINS ${anexo}`)
      assert.deepEqual(eng.PARTILHA_IBS_SIMPLES[anexo], t.iss.map(x => x / 100), `ICMS/ISS ${anexo}`)
    }
    assert.deepEqual(partilha.PARTILHA_SIMPLES_LC214.II[2033].map(l => l.IPI ?? 0), [7.5, 7.5, 7.5, 7.5, 7.5, 35])
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

describe('Teto do ISS no regime atual (LC 123 art. 18 §1º-B, I)', () => {
  const perto2 = (a, b, tol, msg) => assert.ok(Math.abs(a - b) < tol, `${msg ?? ''} esperado ${b}, veio ${a}`)

  it('Anexo III, 5ª faixa acima de 14,925%: ISS fixo em 5%, o excedente vai a COFINS/PIS (23,46%)', () => {
    // RBT12 R$ 3 mi: alíquota efetiva = 21% − 125.640/3.000.000 = 16,812%
    const r = calc('simples_nacional', 'tecnologia_ti', 250000, { insumosMensais: 0, folhaMensal: 100000 })
    assert.equal(r.anexoSimples, 'III')
    const eff = 0.21 - 125640 / 3_000_000
    perto2(r.ibsSimplesEfetivo, 0.05, 1e-9, 'ISS')
    perto2(r.cbsSimplesEfetivo, (eff - 0.05) * 0.2346, 1e-9, 'PIS/COFINS')
    perto(R(r.impostoAtualMensal), R(250000 * eff), 'o DAS total não muda — só a repartição')
  })

  it('Anexo IV, 5ª faixa acima de 12,5%: ISS fixo em 5%, o excedente vai a COFINS/PIS (36,67%)', () => {
    const r = calc('simples_nacional', 'advocacia', 250000, { insumosMensais: 0, folhaMensal: 100000 })
    assert.equal(r.anexoSimples, 'IV')
    const eff = 0.22 - 183780 / 3_000_000
    perto2(r.ibsSimplesEfetivo, 0.05, 1e-9, 'ISS')
    perto2(r.cbsSimplesEfetivo, (eff - 0.05) * 0.3667, 1e-9, 'PIS/COFINS')
  })

  it('sem teto: abaixo do limiar e nos Anexos I, II e V', () => {
    // Anexo III com alíquota efetiva de 14,456% (< 14,925%): partilha normal da tabela
    const abaixo = calc('simples_nacional', 'tecnologia_ti', 160000, { insumosMensais: 0, folhaMensal: 60000 })
    const effA = 0.21 - 125640 / 1_920_000
    perto2(abaixo.ibsSimplesEfetivo, effA * 0.335, 1e-9, 'III abaixo do limiar')
    // Anexo V não tem a nota: o ISS de 23,5% nunca passa de 5% (0,2093 × 23,5% = 4,92%)
    const v = calc('simples_nacional', 'consultoria_empresarial', 250000, { insumosMensais: 0, folhaMensal: 10000 })
    assert.equal(v.anexoSimples, 'V')
    perto2(v.ibsSimplesEfetivo, (0.23 - 62100 / 3_000_000) * 0.235, 1e-9, 'V')
  })

  it('limiar e percentuais do teto são consequência da regra da lei + tabela (sem depender de nota de rodapé)', () => {
    // Regra (art. 18 §1º-B, I): o ISS não passa de 5% da receita e a diferença vai, "de forma proporcional",
    // aos tributos federais da mesma faixa. Logo, na 5ª faixa:
    //   limiar = 5% ÷ participação do ISS na faixa; multiplicador de cada federal = sua participação ÷ soma dos federais.
    // III: ISS 33,5% → limiar 14,92537%; federais 66,5% → PIS/COFINS 15,6 ÷ 66,5 = 23,46%
    // IV:  ISS 40%   → limiar 12,5%;     federais 60%   → PIS/COFINS 22 ÷ 60    = 36,67%
    for (const anexo of ['III', 'IV']) {
      const iss = eng.PARTILHA_IBS_SIMPLES[anexo][4] * 100
      const pisCofins = eng.PARTILHA_CBS_SIMPLES[anexo][4] * 100
      const teto = partilha.TETO_ISS_ATUAL[anexo]
      perto2(teto.limiar, 5 / (iss / 100), 1e-4, `limiar ${anexo}`)
      perto2(teto.pisCofins, (pisCofins / (100 - iss)) * 100, 0.01, `PIS/COFINS ${anexo}`)
      assert.equal(teto.issMax, 5)
    }
  })

  it('é contínuo no limiar (sem salto na troca de regra)', () => {
    // limiar do Anexo III: RBT12 ≈ R$ 2.068.280 (alíquota efetiva 14,92537%)
    const a = eng.getIBSSimples('III', 2_068_000), b = eng.getIBSSimples('III', 2_068_600)
    const c = eng.getCBSSimples('III', 2_068_000), d = eng.getCBSSimples('III', 2_068_600)
    perto2(a, b, 5e-5, 'ISS')
    perto2(c, d, 5e-5, 'PIS/COFINS')
  })

  it('a exportação usa a partilha com o teto (mesma faixa nos dois mercados: RBT12 de R$ 3 mi cada)', () => {
    const r = calc('simples_nacional', 'tecnologia_ti', 500000, { insumosMensais: 0, folhaMensal: 200000, exportacoesMensais: 250000 })
    assert.equal(r.anexoSimples, 'III')
    perto(R(r.exportacaoSimples.reducaoDASMensal), R(250000 * (r.cbsSimplesEfetivo + r.ibsSimplesEfetivo)))
  })
})

describe('Exportações no Simples (tpRBSN 3 e 4)', () => {
  // Indústria, Anexo II, 4ª faixa (RBT12 R$ 1,2 mi): alíquota efetiva 9,325%
  // CBS+IBS dentro do DAS = 4,29% da receita; IPI = 7,5% do DAS = 0,6994% da receita
  const base = () => calc('simples_nacional', 'industria_transformacao', 100000, { insumosMensais: 30000 })

  it('a exportação tem a própria faixa (RBT12 da exportação, art. 3º §15) e sai da parcela de consumo e do IPI', () => {
    perto(R(base().impostoAtualMensal), 9325)
    const r = calc('simples_nacional', 'industria_transformacao', 100000, { insumosMensais: 30000, exportacoesMensais: 40000 })
    const effMI = 0.10 - 13860 / 720_000   // RBT12 do mercado interno: R$ 60 mil × 12 = R$ 720 mil → 3ª faixa
    const effExp = 0.10 - 13860 / 480_000  // RBT12 da exportação: R$ 40 mil × 12 = R$ 480 mil → 3ª faixa
    // da exportação ficam só IRPJ (5,5%) + CSLL (3,5%) + CPP (37,5%) = 46,5% do DAS; saem PIS/COFINS (14%), ICMS (32%) e IPI (7,5%)
    perto(R(r.impostoAtualMensal), R(60000 * effMI + 40000 * effExp * 0.465), 'DAS com 40k exportados')
    assert.ok(r.impostoAtualMensal < 7329, 'menor que o DAS com tudo na faixa do faturamento total (R$ 7.329)')
    assert.equal(r.exportacaoSimples.tipoReceita, 3)
    perto(R(r.exportacaoSimples.reducaoIPIMensal), R(40000 * effExp * 0.075))
    assert.equal(r.exportacaoSimples.rbt12MercadoInterno, 720000)
    assert.equal(r.exportacaoSimples.rbt12Exportacao, 480000)
    assert.equal(R(r.exportacaoSimples.suspensoMensal), 0)
  })

  it('o DAS com os dois mercados é a soma de duas empresas independentes (só interna + só exportadora)', () => {
    const mi  = calc('simples_nacional', 'industria_transformacao', 60000, { insumosMensais: 18000 })
    const ext = calc('simples_nacional', 'industria_transformacao', 40000, { insumosMensais: 12000, exportacoesMensais: 40000 })
    const juntas = calc('simples_nacional', 'industria_transformacao', 100000, { insumosMensais: 30000, exportacoesMensais: 40000 })
    perto(R(juntas.impostoAtualMensal), R(mi.impostoAtualMensal + ext.impostoAtualMensal))
  })

  it('exportação indireta (tpRBSN 4): mesmo DAS, CBS/IBS ficam suspensos', () => {
    const dir = calc('simples_nacional', 'industria_transformacao', 100000, { insumosMensais: 30000, exportacoesMensais: 40000 })
    const ind = calc('simples_nacional', 'industria_transformacao', 100000, { insumosMensais: 30000, exportacoesMensais: 40000, tipoExportacao: 'indireta' })
    assert.equal(ind.exportacaoSimples.tipoReceita, 4)
    assert.equal(R(ind.impostoAtualMensal), R(dir.impostoAtualMensal))
    // suspenso = receita × alíquota da faixa da exportação × (PIS/COFINS 14% + ICMS 32% do DAS)
    perto(R(ind.exportacaoSimples.suspensoMensal), R(40000 * (0.10 - 13860 / 480_000) * 0.46))
  })

  it('tudo exportado: sobram só IRPJ, CSLL e CPP', () => {
    const r = calc('simples_nacional', 'industria_transformacao', 100000, { insumosMensais: 30000, exportacoesMensais: 150000 })
    assert.equal(r.exportacaoSimples.valorMensal, 100000) // limitado ao faturamento
    perto(R(r.impostoAtualMensal), 9325 - R(100000 * 0.049894))
    assert.equal(R(novaPorAno(r, 2033)), 0)
  })

  it('o limite de R$ 4,8 mi vale para cada mercado, não para a soma (art. 3º §14)', () => {
    const acima = (fat, exp) => eng.calcularTodosOsRegimes({
      regime: 'simples_nacional', setor: S('industria_transformacao'), faturamentoMensal: fat, insumosMensais: 0,
      perfilClientes: 'b2b', uf: 'SP', exportacoesMensais: exp,
    }).find(r => r.regime === 'simples_nacional').acimaDaFaixaSimples
    assert.equal(acima(500000, 0), true)         // R$ 6 mi só no mercado interno: acima
    assert.equal(acima(700000, 400000), false)   // interno R$ 3,6 mi + exportação R$ 4,8 mi: cada um dentro do limite
    assert.equal(acima(700000, 410000), true)    // exportação R$ 4,92 mi: acima
    assert.equal(acima(1000000, 400000), true)   // interno R$ 7,2 mi: acima
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

  it('despesas operacionais acompanham o faturamento (base do Lucro Real); folha segue fixa', () => {
    const extra = { insumosMensais: 20000, despesasOperacionaisMensais: 30000, folhaMensal: 15000 }
    const dados = calc('lucro_real', 'comercio_varejo', 100000, extra)
    const [dobro] = eng.calcularCurvaCrescimento(dados, [100])
    const escalado = calc('lucro_real', 'comercio_varejo', 200000,
      { insumosMensais: 40000, despesasOperacionaisMensais: 60000, folhaMensal: 15000 })
    const fixo = calc('lucro_real', 'comercio_varejo', 200000,
      { insumosMensais: 40000, despesasOperacionaisMensais: 30000, folhaMensal: 15000 })
    perto(R(dobro.impostoIVAMensal), R(escalado.cargaTotalReformaMensal), 'despesas escaladas')
    assert.notEqual(R(escalado.cargaTotalReformaMensal), R(fixo.cargaTotalReformaMensal), 'o teste precisa distinguir fixo de escalado')
  })
})

describe('Simples híbrido: crédito do cliente e custo', () => {
  const b2b = (extra = {}) => calc('simples_nacional', 'comercio_atacado', 200000, { insumosMensais: 120000, perfilClientes: 'b2b', ...extra })

  it('no Simples puro o cliente já credita o CBS+IBS embutido no DAS; o híbrido acrescenta a diferença até o crédito pleno', () => {
    const r = b2b()
    const h = r.analiseSimplesHibrido
    const embutido = (r.cbsSimplesEfetivo + r.ibsSimplesEfetivo) * r.faturamentoMensal
    assert.ok(embutido > 0)
    perto(R(h.creditoClienteSimplesPuro), R(embutido), 'crédito que o cliente já tem')
    perto(R(h.creditoDisponibilizadoAoCliente), R(r.faturamentoMensal * r.aliquotaIVABruta), 'crédito pleno do híbrido')
    perto(R(h.creditoIncrementalCliente), R(h.creditoDisponibilizadoAoCliente - h.creditoClienteSimplesPuro))
    assert.ok(h.creditoClienteSimplesPuro < h.creditoDisponibilizadoAoCliente)
  })

  it('o custo adicional é o do cenário híbrido completo (DAS que sobra + IVA líquido − DAS de hoje)', () => {
    const r = b2b()
    perto(R(r.analiseSimplesHibrido.custoAdicionalMensal), R(r.cenarioHibridoVerdadeiro.custoAdicionalVsSimples))
    // não pode ser o IVA líquido menos o DAS inteiro (versão antiga, que esquecia o DAS que sobra)
    const antigo = r.analiseSimplesHibrido.ivaHibridoLiquido - r.impostoAtualMensal
    assert.ok(Math.abs(r.analiseSimplesHibrido.custoAdicionalMensal - antigo) > 1, 'o DAS residual entra na conta')
  })

  it('a recomendação compara o crédito a MAIS com o custo adicional', () => {
    const h = b2b().analiseSimplesHibrido
    assert.equal(h.vale, h.creditoIncrementalCliente >= h.custoAdicionalMensal)
  })

  it('só vendas a empresas geram crédito: perfil misto reduz o crédito pela fração PJ; B2C não tem análise', () => {
    const cheio = b2b().analiseSimplesHibrido
    const metade = b2b({ perfilClientes: 'misto', pctClientesPJ: 50 }).analiseSimplesHibrido
    perto(R(metade.creditoDisponibilizadoAoCliente), R(cheio.creditoDisponibilizadoAoCliente / 2))
    perto(R(metade.creditoClienteSimplesPuro), R(cheio.creditoClienteSimplesPuro / 2))
    assert.equal(b2b({ perfilClientes: 'b2c' }).analiseSimplesHibrido, null)
  })

  it('MEI mantém a conta própria (sem partilha no DAS: nada embutido para o cliente)', () => {
    const r = calc('mei', 'comercio_varejo', 5000, { insumosMensais: 2000, perfilClientes: 'b2b' })
    const h = r.analiseSimplesHibrido
    assert.equal(h.creditoClienteSimplesPuro, 0)
    perto(R(h.custoAdicionalMensal), R(h.ivaHibridoLiquido - r.impostoAtualMensal))
  })
})

describe('Alíquota de referência (IBS+CBS) ajustável', () => {
  const ref = (aliq, extra = {}) => calc('lucro_presumido', 'comercio_varejo', 100000, { insumosMensais: 60000, aliquotaReferencia: aliq, ...extra })

  it('sem informar vale a estimativa padrão de 26,5%, e o resultado mostra a alíquota usada', () => {
    const r = calc('lucro_presumido', 'comercio_varejo', 100000, { insumosMensais: 60000 })
    assert.equal(r.aliquotaReferencia, 0.265)
    assert.equal(r.aliquotaCBSReferencia, 0.0925)
    perto(R(r.aliquotaIVABruta * 1e6), R(0.265 * 1e6))
    assert.equal(R(ref(0.265).cargaTotalReformaMensal), R(r.cargaTotalReformaMensal))
  })

  it('o IVA acompanha a alíquota: débito, crédito e líquido', () => {
    const r = ref(0.2791)
    perto(R(r.aliquotaIVABruta * 1e6), R(0.2791 * 1e6))
    perto(R(r.impostoIVABrutoMensal), R(100000 * 0.2791))
    perto(R(r.creditoInsumosMensal), R(60000 * 0.2791))
    perto(R(r.impostoIVALiquidoMensal), R(40000 * 0.2791))
  })

  it('as reduções por setor incidem sobre a alíquota informada', () => {
    const h = calc('simples_nacional', 'hoteis_pousadas', 100000, { insumosMensais: 20000, aliquotaReferencia: 0.30 })
    perto(R(h.aliquotaIVABruta * 1e6), R(0.30 * 0.6 * 1e6))
    perto(R(h.creditoInsumosMensal), R(20000 * 0.30), 'hotelaria compra a alíquota cheia')
    const f = calc('simples_nacional', 'farmacias_drogarias', 100000, { insumosMensais: 20000, aliquotaReferencia: 0.30, pctMedicamentos: 50 })
    perto(R(f.aliquotaIVABruta * 1e6), R((0.5 * 0.30 * 0.4 + 0.5 * 0.30) * 1e6), 'medicamentos com 60% de redução')
  })

  it('o ponto de 2033 é a carga total pós-reforma e sobe com a alíquota', () => {
    for (const regime of ['simples_nacional', 'lucro_presumido', 'lucro_real']) {
      const base = calc(regime, 'comercio_varejo', 100000, { insumosMensais: 60000, aliquotaReferencia: 0.25 })
      const alto = calc(regime, 'comercio_varejo', 100000, { insumosMensais: 60000, aliquotaReferencia: 0.30 })
      perto(R(base.projecaoAnos.at(-1).impostoMensal), R(base.cargaTotalReformaMensal), regime)
      perto(R(alto.projecaoAnos.at(-1).impostoMensal), R(alto.cargaTotalReformaMensal), regime)
      if (regime !== 'simples_nacional') assert.ok(alto.cargaTotalReformaMensal > base.cargaTotalReformaMensal, regime)
    }
  })

  it('a parte da CBS só muda a transição: 2033 igual, 2027 maior com CBS de 11,3%', () => {
    const a = ref(0.265, { aliquotaCBSReferencia: 0.0925 })
    const b = ref(0.265, { aliquotaCBSReferencia: 0.113 })
    perto(R(a.projecaoAnos.at(-1).impostoMensal), R(b.projecaoAnos.at(-1).impostoMensal), '2033')
    assert.equal(R(a.cargaTotalReformaMensal), R(b.cargaTotalReformaMensal))
    assert.ok(b.projecaoAnos[1].impostoMensal > a.projecaoAnos[1].impostoMensal, '2027')
    assert.equal(b.aliquotaCBSReferencia, 0.113)
  })

  it('valores inválidos voltam ao padrão e os extremos são limitados', () => {
    for (const v of [0, -0.1, NaN]) assert.equal(ref(v).aliquotaReferencia, 0.265, String(v))
    assert.equal(ref(0.99).aliquotaReferencia, 0.60)
    assert.equal(ref(0.265, { aliquotaCBSReferencia: 0.9 }).aliquotaCBSReferencia, 0.265)   // CBS nunca passa do total
  })

  it('reproduz a premissa de 9,25% da equipe no caso do hotel (9 meses) e mostra que a conclusão depende da alíquota', () => {
    const total = 1362225.61 + 174142.80 + 204141.00
    const caso = aliq => calc('simples_nacional', 'hoteis_pousadas', total / 9, {
      insumosMensais: 197286.73 / 9, perfilClientes: 'b2c', uf: 'MG', anexoSimples: 'III', anexoSimples2: 'I',
      pctAnexo1: 1362225.61 / total * 100, pctReceitaAliquotaCheia: 204141 / total * 100, aliquotaReferencia: aliq,
    })
    const equipe = caso(0.0925), padrao = caso(0.265)
    perto(R(equipe.cenarioHibridoVerdadeiro.totalMensal * 9), 216609, 'híbrido a 9,25%')
    perto(R(padrao.cenarioHibridoVerdadeiro.totalMensal * 9), 376805, 'híbrido a 26,5%')
    assert.ok(equipe.cenarioHibridoVerdadeiro.custoAdicionalVsSimples < 0, 'a 9,25% o híbrido sai mais barato')
    assert.ok(padrao.cenarioHibridoVerdadeiro.custoAdicionalVsSimples > 0, 'a 26,5% o híbrido sai mais caro')
    // o DAS de hoje não depende da alíquota da reforma
    assert.equal(R(equipe.impostoAtualMensal), R(padrao.impostoAtualMensal))
  })

  it('o simulador de crescimento e o comparador herdam a alíquota informada', () => {
    const dados = { regime: 'lucro_presumido', setor: S('comercio_varejo'), faturamentoMensal: 100000, insumosMensais: 60000, perfilClientes: 'b2c', aliquotaReferencia: 0.30 }
    const [p0] = eng.calcularCurvaCrescimento(dados, [0])
    perto(R(p0.impostoIVAMensal), R(eng.calcularTodosOsCenarios(dados).cargaTotalReformaMensal))
    const lp = eng.calcularTodosOsRegimes(dados).find(x => x.regime === 'lucro_presumido')
    assert.equal(lp.aliquotaReferencia, 0.30)
  })
})

describe('Projeção 2026–2033 coerente com a carga de hoje e a carga pós-reforma', () => {
  const REGIMES = ['simples_nacional', 'lucro_presumido', 'lucro_real', 'mei', 'profissional_liberal', 'produtor_rural']

  it('o ponto de 2026 é a carga de hoje e o de 2033 é a carga total pós-reforma — todos os setores e regimes', () => {
    const quebras = []
    for (const setor of setoresMod.SETORES) {
      for (const regime of REGIMES) {
        for (const fat of [5000, 100000, 400000]) {
          for (const extra of [{}, { folhaPagamentoLRMensal: fat * 0.2, despesasOperacionaisMensais: fat * 0.1 }]) {
            let r
            try {
              r = eng.calcularTodosOsCenarios({ regime, setor, faturamentoMensal: fat, insumosMensais: fat * 0.4, perfilClientes: 'b2c', uf: 'SP', ...extra })
            } catch { continue }
            const p = r.projecaoAnos
            const d26 = Math.abs(p[0].impostoMensal - r.impostoAtualMensal)
            const d33 = Math.abs(p[p.length - 1].impostoMensal - r.cargaTotalReformaMensal)
            if (d26 > 1 || d33 > 1) quebras.push(`${regime}/${setor.value}/${fat}${Object.keys(extra).length ? '/dados' : ''}: 2026 ${d26.toFixed(0)}, 2033 ${d33.toFixed(0)}`)
          }
        }
      }
    }
    assert.deepEqual(quebras.slice(0, 5), [], `${quebras.length} combinações divergem`)
  })

  it('Lucro Real sem dados efetivos: comércio de R$ 100 mil chega a 2033 na carga total, sem somar PIS/COFINS e ICMS duas vezes', () => {
    const r = calc('lucro_real', 'comercio_varejo', 100000, { insumosMensais: 60000 })
    perto(R(r.projecaoAnos.at(-1).impostoMensal), R(r.cargaTotalReformaMensal))
    perto(R(r.cargaTotalReformaMensal), 13204)   // IVA líquido 10.600 + IRPJ/CSLL 2.280 + CPP 324
    perto(R(r.projecaoAnos[0].impostoMensal), R(r.impostoAtualMensal))
    // nenhum ano passa da carga de hoje: a reforma nesse caso só reduz
    assert.ok(r.projecaoAnos.every(p => p.impostoMensal <= r.impostoAtualMensal + 1))
  })
})

describe('Setor de representação comercial', () => {
  const rep = (extra = {}) => calc('simples_nacional', 'representacao_comercial', 20000, { insumosMensais: 1000, perfilClientes: 'b2b', ...extra })

  it('paga a alíquota cheia (sem redução) e não é vedado ao Simples', () => {
    const s = S('representacao_comercial')
    assert.equal(s.reducao, 0)
    assert.equal(s.tipo, 'servico')
    assert.notEqual(s.vedadoSimples, true)
    const r = rep({ regime: 'lucro_presumido' })
    perto(R(r.aliquotaIVABruta * 1e6), R(0.265 * 1e6))
    perto(R(r.impostoIVABrutoMensal), R(20000 * 0.265))
  })

  it('Simples pelo Fator R: folha de 28% ou mais da receita vai ao Anexo III; abaixo, ao Anexo V', () => {
    assert.equal(rep({ folhaMensal: 20000 * 0.30 }).anexoSimples, 'III')
    assert.equal(rep({ folhaMensal: 20000 * 0.10 }).anexoSimples, 'V')
    assert.ok(S('representacao_comercial').fatorR)
  })

  it('o código de atividade do Simples é o dos serviços sujeitos ao Fator R (cAtivSN 09)', () => {
    const r = rep({ folhaMensal: 20000 * 0.30 })
    assert.equal(r.atividadeSimples?.codigo, '09')
  })

  it('não há outro setor com o mesmo código e o grupo é o de alíquota cheia', () => {
    const iguais = setoresMod.SETORES.filter(x => x.value === 'representacao_comercial')
    assert.equal(iguais.length, 1)
    assert.match(iguais[0].grupo, /Cheia/)
  })
})

describe('Crédito das compras em hotelaria, restaurantes e parques', () => {
  const ALIQ = 0.265, RED60 = 0.265 * 0.4
  const rest = (extra = {}) => calc('simples_nacional', 'restaurantes_bares', 100000, { insumosMensais: 30000, ...extra })

  it('parques compram a alíquota cheia, como a hotelaria (a redução de 40% é só das vendas)', () => {
    const r = calc('simples_nacional', 'parques_eventos', 100000, { insumosMensais: 30000 })
    perto(R(r.creditoInsumosMensal), R(30000 * ALIQ))
  })

  it('restaurantes sem composição informada mantêm o padrão: crédito na alíquota das próprias vendas', () => {
    const r = rest()
    perto(R(r.creditoInsumosMensal), R(30000 * r.aliquotaIVABruta))
  })

  it('composição: alimento da cesta básica não gera crédito, Anexo VII credita a 10,6% e o resto a 26,5%', () => {
    const r = rest({ pctInsumosAliquotaZero: 40, pctInsumosReduzidos: 20 })
    perto(R(r.creditoInsumosMensal), R(30000 * (0.2 * RED60 + 0.4 * ALIQ)), '40% zero, 20% reduzido, 40% cheio')
    perto(R(rest({ pctInsumosAliquotaZero: 100 }).creditoInsumosMensal), 0)
    perto(R(rest({ pctInsumosAliquotaZero: 0, pctInsumosReduzidos: 0 }).creditoInsumosMensal), R(30000 * ALIQ), 'tudo cheio quando informado 0 e 0')
  })

  it('composição vale também na hotelaria e nos parques; fora deles é ignorada', () => {
    const h = calc('simples_nacional', 'hoteis_pousadas', 100000, { insumosMensais: 30000, pctInsumosAliquotaZero: 50 })
    perto(R(h.creditoInsumosMensal), R(30000 * 0.5 * ALIQ))
    const p = calc('simples_nacional', 'parques_eventos', 100000, { insumosMensais: 30000, pctInsumosAliquotaZero: 50 })
    perto(R(p.creditoInsumosMensal), R(30000 * 0.5 * ALIQ))
    const com = calc('simples_nacional', 'comercio_varejo', 100000, { insumosMensais: 30000, pctInsumosAliquotaZero: 50 })
    const sem = calc('simples_nacional', 'comercio_varejo', 100000, { insumosMensais: 30000 })
    perto(R(com.creditoInsumosMensal), R(sem.creditoInsumosMensal))
  })

  it('os percentuais são limitados: zero + reduzido nunca passa de 100%', () => {
    const r = rest({ pctInsumosAliquotaZero: 70, pctInsumosReduzidos: 60 })
    perto(R(r.creditoInsumosMensal), R(30000 * 0.3 * RED60))
  })

  it('combina com fornecedores do Simples: essa fatia credita só a CBS do DAS do fornecedor', () => {
    const r = rest({ pctInsumosAliquotaZero: 40, pctInsumosReduzidos: 20, pctFornecedoresSimples: 50 })
    const regular = 0.2 * RED60 + 0.4 * ALIQ
    const cbsSN = eng.getCBSSimples('I', Math.min(r.faturamentoAnual, 720000))
    perto(R(r.creditoInsumosMensal), R(30000 * (0.5 * cbsSN + 0.5 * regular)))
  })

  it('a carga de 2033 acompanha o crédito: menos crédito, mais imposto no regime regular', () => {
    const sem = calc('lucro_presumido', 'restaurantes_bares', 100000, { insumosMensais: 30000 })
    const zero = calc('lucro_presumido', 'restaurantes_bares', 100000, { insumosMensais: 30000, pctInsumosAliquotaZero: 100 })
    assert.ok(zero.cargaTotalReformaMensal > sem.cargaTotalReformaMensal)
    perto(R(zero.projecaoAnos.at(-1).impostoMensal), R(zero.cargaTotalReformaMensal))
  })
})

describe('Hotelaria com receita mista (caso Hotel Solar das Lajes, jan–set/2026)', () => {
  // hospedagem R$ 1.362.225,61 (Anexo III, 40%) + alimentação preparada R$ 174.142,80 (Anexo I, 40%)
  // + bebidas R$ 204.141,00 (Anexo I, alíquota cheia, art. 273 §2º); compras R$ 197.286,73 em 9 meses
  const total = 1362225.61 + 174142.80 + 204141.00
  const fat = total / 9
  const hotel = (extra = {}) => calc('simples_nacional', 'hoteis_pousadas', fat, {
    insumosMensais: 197286.73 / 9, perfilClientes: 'b2c', uf: 'MG',
    anexoSimples: 'III', anexoSimples2: 'I', pctAnexo1: 1362225.61 / total * 100,
    pctReceitaAliquotaCheia: 204141 / total * 100, ...extra,
  })

  it('hospedagem usa o Anexo III sem Fator R e o DAS mistura III e I pelo mesmo RBT12', () => {
    const r = hotel()
    const p1 = 1362225.61 / total
    const rbt12 = fat * 12
    const esperado = p1 * eng.getAliquotaDAS('III', rbt12) + (1 - p1) * eng.getAliquotaDAS('I', rbt12)
    perto(R(r.aliquotaAtual * 1e6), R(esperado * 1e6), 'alíquota efetiva do DAS')
    assert.equal(r.analiseFatorR, null)
  })

  it('débito: 40% só no que está no regime específico; bebidas pagam a alíquota cheia', () => {
    const r = hotel()
    const f = 204141 / total
    perto(R(r.aliquotaIVABruta * 1e6), R((f * 0.265 + (1 - f) * 0.265 * 0.6) * 1e6), 'alíquota bruta ponderada')
    // sem informar o %, tudo fica com a redução (comportamento anterior)
    perto(R(hotel({ pctReceitaAliquotaCheia: 0 }).aliquotaIVABruta * 1e6), R(0.265 * 0.6 * 1e6))
  })

  it('crédito das compras usa a alíquota cheia (fornecedor não tem a redução do hotel)', () => {
    const r = hotel()
    perto(R(r.creditoInsumosMensal), R(197286.73 / 9 * 0.265), 'crédito a 26,5%')
    // restaurante mantém o comportamento anterior (crédito na alíquota do próprio setor)
    const rest = calc('simples_nacional', 'restaurantes_bares', 100000, { insumosMensais: 30000 })
    perto(R(rest.creditoInsumosMensal), R(30000 * rest.aliquotaIVABruta))
  })

  it('híbrido = DAS sem a parcela de consumo + IVA líquido (não só o IVA, como no relatório da IA)', () => {
    const r = hotel()
    const h = r.cenarioHibridoVerdadeiro
    const consumo = (r.cbsSimplesEfetivo + r.ibsSimplesEfetivo) * fat
    perto(R(h.dasReduzidoMensal), R(r.impostoAtualMensal - consumo), 'DAS reduzido')
    perto(R(h.totalMensal), R(h.dasReduzidoMensal + h.ibsCBSLiquidoMensal), 'total')
    assert.ok(h.dasReduzidoMensal > 10000, 'o resíduo do DAS (IRPJ/CSLL/CPP) não pode sumir do híbrido')
  })

  it('o campo só vale para setores que o habilitam', () => {
    const a = calc('simples_nacional', 'comercio_varejo', 100000, { pctReceitaAliquotaCheia: 50 })
    const b = calc('simples_nacional', 'comercio_varejo', 100000)
    assert.equal(a.aliquotaIVABruta, b.aliquotaIVABruta)
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

  it('nanoempreendedor (PF abaixo de 50% do limite do MEI = R$ 40,5 mil/ano) não é contribuinte (art. 26, IV)', () => {
    const nano = calc('profissional_liberal', 'consultoria_empresarial', 3000, { insumosMensais: 0 })  // R$ 36 mil/ano
    assert.equal(nano.nanoempreendedor, true)
    assert.equal(R(nano.impostoIVALiquidoMensal), 0)
    // no limite (R$ 3.375/mês = R$ 40,5 mil/ano) deixa de ser "inferior": é contribuinte (art. 21, I, c)
    const limite = calc('profissional_liberal', 'consultoria_empresarial', 3375, { insumosMensais: 0 })
    assert.equal(limite.nanoempreendedor, false)
    assert.equal(R(limite.impostoIVALiquidoMensal), R(3375 * 0.265))
    // só vale para pessoa física: empresa no Lucro Presumido com o mesmo faturamento paga IVA
    const lp = calc('lucro_presumido', 'consultoria_empresarial', 3000, { insumosMensais: 0 })
    assert.equal(lp.nanoempreendedor, false)
    assert.ok(lp.impostoIVALiquidoMensal > 0)
    // acima do porte, sem outro corte: R$ 20 mil/mês (R$ 240 mil/ano) segue contribuinte
    assert.equal(pl('consultoria_empresarial').nanoempreendedor, false)
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
