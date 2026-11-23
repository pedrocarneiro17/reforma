/**
 * Testes da análise por ano da transição (2026–2033) — rodar com `npm test`.
 *
 * O motor aceita `anoAnalise`: as alíquotas de IBS e CBS, os créditos, o Simples híbrido, o comparador de regimes e
 * o reajuste de preço passam a descrever aquele ano. Sem informar vale 2033 (regime pleno), que é o resultado de
 * sempre. Calendário (LC 214/2025): CBS plena já em 2027 (art. 347 reduz 0,1 p.p. em 2027–2028, compensado pelo IBS
 * de 0,05% + 0,05% do art. 344); IBS só em 2029, a 10%, 20%, 30% e 40% da alíquota plena até 2032; ICMS e ISS caem
 * na mesma proporção (arts. 501 e 508) e somem em 2033.
 */
import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let server, eng, setoresMod

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
})
after(async () => { await server?.close() })

const ANOS = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033]
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
const perto = (a, b, msg, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${msg ?? ''} esperado ${b}, veio ${a}`)

describe('Calendário da transição', () => {
  it('fases: CBS plena em 2027, IBS só em 2029 (10/20/30/40%), ICMS/ISS somem em 2033', () => {
    assert.deepEqual(ANOS.map(a => eng.fasesDoAno(a).cbs), [0, 1, 1, 1, 1, 1, 1, 1])
    assert.deepEqual(ANOS.map(a => eng.fasesDoAno(a).ibs), [0, 0, 0, 0.1, 0.2, 0.3, 0.4, 1])
    assert.deepEqual(ANOS.map(a => eng.fasesDoAno(a).legado), [1, 1, 1, 0.9, 0.8, 0.7, 0.6, 0])
  })

  it('ano inválido ou ausente cai em 2033', () => {
    for (const a of [undefined, null, 2025, 2034, 2029.5, NaN]) assert.equal(eng.normalizarAnoAnalise(a), 2033, String(a))
    for (const a of ANOS) assert.equal(eng.normalizarAnoAnalise(a), a)
  })
})

describe('Alíquotas em vigor em cada ano', () => {
  it('padrão (CBS 9,25% e IBS 17,25%): 2027 só CBS; 2029 IBS a 10%; 2033 as duas cheias', () => {
    const r = a => calc('lucro_presumido', 'comercio_varejo', 100000, { anoAnalise: a })
    const f = (x, y) => perto(x, y, '', 1e-9)
    f(r(2026).aliquotaIVABruta, 0)
    f(r(2027).aliquotaCBSAno, 0.0925); f(r(2027).aliquotaIBSAno, 0); f(r(2027).aliquotaIVABruta, 0.0925)
    f(r(2028).aliquotaIVABruta, 0.0925)
    f(r(2029).aliquotaIBSAno, 0.01725); f(r(2029).aliquotaIVABruta, 0.0925 + 0.01725)
    f(r(2032).aliquotaIBSAno, 0.069); f(r(2032).aliquotaIVABruta, 0.0925 + 0.069)
    f(r(2033).aliquotaIVABruta, 0.265)
    assert.equal(r(2029).fracaoLegadoIcmsIssAno, 0.9)
    assert.equal(r(2033).fracaoLegadoIcmsIssAno, 0)
  })

  it('com a alíquota de referência informada (28% e CBS 11,3%) cada ano segue a nova divisão', () => {
    const dados = { aliquotaReferencia: 0.28, aliquotaCBSReferencia: 0.113 }
    const r = a => calc('lucro_presumido', 'comercio_varejo', 100000, { ...dados, anoAnalise: a })
    perto(r(2027).aliquotaIVABruta, 0.113, '2027', 1e-9)
    perto(r(2030).aliquotaIVABruta, 0.113 + 0.2 * 0.167, '2030', 1e-9)
    perto(r(2033).aliquotaIVABruta, 0.28, '2033', 1e-9)
    // a referência informada continua sendo a PLENA, em qualquer ano analisado
    assert.equal(r(2027).aliquotaReferencia, 0.28)
    assert.equal(r(2027).aliquotaCBSReferencia, 0.113)
  })

  it('setor com redução: a alíquota do ano é a cheia do ano × (1 − redução)', () => {
    const r = a => calc('lucro_real', 'dispositivos_medicos', 100000, { anoAnalise: a })
    const red = S('dispositivos_medicos').reducao
    perto(r(2027).aliquotaIVABruta, 0.0925 * (1 - red), '2027', 1e-9)
    perto(r(2033).aliquotaIVABruta, 0.265 * (1 - red), '2033', 1e-9)
  })
})

describe('Carga do ano = ponto da projeção; sem ano = 2033', () => {
  it('sem anoAnalise o resultado é idêntico ao de 2033', () => {
    for (const regime of ['simples_nacional', 'lucro_presumido', 'lucro_real']) {
      const a = calc(regime, 'comercio_varejo', 100000)
      const b = calc(regime, 'comercio_varejo', 100000, { anoAnalise: 2033 })
      assert.deepEqual(a, b, regime)
      assert.equal(a.anoAnalise, 2033)
    }
  })

  it('em todos os setores, regimes e anos: carga, variação e preço do ano batem com a projeção, que não depende do ano', () => {
    const regimes = ['simples_nacional', 'lucro_presumido', 'lucro_real', 'mei', 'profissional_liberal', 'produtor_rural']
    let combinacoes = 0
    for (const setor of setoresMod.SETORES) {
      for (const regime of regimes) {
        for (const fat of [30000, 400000]) {
          const dados = { regime, setor, faturamentoMensal: fat, insumosMensais: fat * 0.4, perfilClientes: 'misto', uf: 'SP' }
          const pleno = eng.calcularTodosOsCenarios(dados)
          for (const ano of ANOS) {
            const r = eng.calcularTodosOsCenarios({ ...dados, anoAnalise: ano })
            const p = pleno.projecaoAnos.find(x => x.ano === ano)
            const msg = `${setor.value}/${regime}/${fat}/${ano}`
            assert.deepEqual(r.projecaoAnos, pleno.projecaoAnos, `projeção ${msg}`)
            perto(r.cargaTotalReformaMensal, p.impostoMensal, `carga ${msg}`)
            perto(r.variacaoAbsolutaMensal, p.variacaoMensal, `variação ${msg}`)
            perto(r.reajustePrecoNecessario, p.reajustePrecoNecessario, `preço ${msg}`, 1e-6)
            combinacoes++
          }
        }
      }
    }
    assert.ok(combinacoes > 6000, `combinações testadas: ${combinacoes}`)
  })

  it('2026 é a carga de hoje: nada de IBS/CBS a pagar e sem híbrido', () => {
    for (const regime of ['simples_nacional', 'lucro_presumido', 'lucro_real']) {
      const r = calc(regime, 'tecnologia_ti', 100000, { anoAnalise: 2026 })
      perto(r.cargaTotalReformaMensal, r.impostoAtualMensal, regime)
      assert.equal(r.impostoIVALiquidoMensal, 0, regime)
      assert.equal(r.analiseSimplesHibrido, null, regime)
    }
  })
})

describe('IBS/CBS do regime regular cresce com a transição', () => {
  it('o IVA líquido de cada ano é o do ano pleno × a fração das alíquotas em vigor', () => {
    const pleno = calc('lucro_presumido', 'comercio_varejo', 200000)
    const cbs = 0.0925, ibs = 0.1725, total = 0.265
    for (const ano of ANOS) {
      const f = eng.fasesDoAno(ano)
      const esperado = pleno.impostoIVALiquidoMensal * (cbs * f.cbs + ibs * f.ibs) / total
      const r = calc('lucro_presumido', 'comercio_varejo', 200000, { anoAnalise: ano })
      perto(r.impostoIVALiquidoMensal, esperado, `IVA ${ano}`)
      perto(pleno.projecaoAnos.find(p => p.ano === ano).ivaLiquidoMensal, esperado, `IVA na projeção ${ano}`)
      // CBS + IBS do ano = IVA líquido do ano
      perto(r.cbsIVADualMensal + r.impostoIVALiquidoMensal * (r.aliquotaIBSAno / Math.max(1e-12, r.aliquotaIBSAno + r.aliquotaCBSAno)) * (r.aliquotaIBSAno > 0 ? 1 : 0),
        r.aliquotaIBSAno > 0 ? r.impostoIVALiquidoMensal : r.cbsIVADualMensal, `CBS+IBS ${ano}`)
    }
  })

  it('a carga total do Lucro Presumido no meio da transição fica entre a de hoje e a de 2033 (monotônica no IBS)', () => {
    const r = calc('lucro_presumido', 'comercio_varejo', 200000)
    const iva = r.projecaoAnos.map(p => p.ivaLiquidoMensal)
    for (let i = 1; i < iva.length; i++) assert.ok(iva[i] >= iva[i - 1] - 1e-6, `IVA não pode cair de ${ANOS[i - 1]} para ${ANOS[i]}`)
    assert.equal(iva[0], 0)
  })

  it('crédito presumido do regime automotivo e da ZFM acompanham o ano (não ficam fixos num ano de alíquota menor)', () => {
    const dados = { regimeAutomotivoHabilitado: true, faseRegimeAutomotivo: 1 }
    const setorAuto = setoresMod.SETORES.find(s => s.regimeAutomotivo)
    if (!setorAuto) return
    const a2027 = calc('lucro_real', setorAuto.value, 100000, { ...dados, anoAnalise: 2027 })
    const a2033 = calc('lucro_real', setorAuto.value, 100000, { ...dados, anoAnalise: 2033 })
    assert.ok(a2027.creditoRegimeAutomotivo < a2033.creditoRegimeAutomotivo)
    assert.ok(a2027.impostoIVALiquidoMensal >= 0)
  })
})

describe('Simples Nacional híbrido ano a ano', () => {
  const dados = { anexoSimples: 'III' }
  const sn = (ano, extra = {}) => calc('simples_nacional', 'tecnologia_ti', 80000, { ...dados, anoAnalise: ano, ...extra })

  it('o crédito pleno que o cliente teria cresce com a alíquota do ano; em 2027 é só a CBS', () => {
    const cred = ANOS.slice(1).map(a => sn(a).analiseSimplesHibrido.creditoDisponibilizadoAoCliente)
    for (let i = 1; i < cred.length; i++) assert.ok(cred[i] >= cred[i - 1] - 1e-6, `crédito cai em ${ANOS[i + 1]}`)
    // 2027: faturamento × CBS (9,25%) × redução do setor (cheio aqui)
    const red = S('tecnologia_ti').reducao
    perto(sn(2027).analiseSimplesHibrido.creditoDisponibilizadoAoCliente, 80000 * 0.0925 * (1 - red), '2027', 1)
  })

  it('o ponto do ano na projeção é o mesmo cálculo da análise feita para aquele ano', () => {
    const pleno = sn(2033)
    for (const ano of ANOS.slice(1)) {
      const h = sn(ano).analiseSimplesHibrido
      const p = pleno.projecaoAnos.find(x => x.ano === ano).hibrido
      assert.ok(p, `híbrido na projeção ${ano}`)
      perto(p.custoAdicionalMensal, h.custoAdicionalMensal, `custo ${ano}`)
      perto(p.creditoPlenoCliente, h.creditoDisponibilizadoAoCliente, `crédito pleno ${ano}`)
      perto(p.creditoClienteSimplesPuro, h.creditoClienteSimplesPuro, `crédito puro ${ano}`)
      assert.equal(p.vale, h.vale, `vale ${ano}`)
    }
    assert.equal(pleno.projecaoAnos[0].hibrido, null, '2026: ainda não existe o regime regular de IBS/CBS para optar')
  })

  it('o híbrido de 2033 é o de sempre (resultado pleno intacto)', () => {
    const a = sn(undefined), b = sn(2033)
    assert.deepEqual(a.analiseSimplesHibrido, b.analiseSimplesHibrido)
    assert.deepEqual(a.cenarioHibridoVerdadeiro, b.cenarioHibridoVerdadeiro)
  })

  it('a alíquota que o cliente credita no Simples puro é a embutida no DAS do ano (não a de 2033)', () => {
    const a27 = sn(2027).analiseSimplesHibrido, a29 = sn(2029).analiseSimplesHibrido, a33 = sn(2033).analiseSimplesHibrido
    // sem exportação: crédito do Simples puro = faturamento × alíquota embutida × fração B2B (100%)
    for (const a of [a27, a29, a33]) perto(a.creditoClienteSimplesPuro, 80000 * a.aliquotaEmbutidaNoDAS, '', 1)
    assert.ok(a27.aliquotaEmbutidaNoDAS < a29.aliquotaEmbutidaNoDAS && a29.aliquotaEmbutidaNoDAS < a33.aliquotaEmbutidaNoDAS)
    // no ano pleno é a partilha de hoje (CBS + IBS dentro do DAS)
    const r = sn(2033)
    perto(a33.aliquotaEmbutidaNoDAS, r.cbsSimplesEfetivo + r.ibsSimplesEfetivo, '', 1e-9)
  })

  it('o híbrido não deixa de existir quando a empresa excede o sublimite: o ICMS/ISS por fora cai até 2033', () => {
    const grande = ano => calc('simples_nacional', 'comercio_varejo', 350000, { anoAnalise: ano })
    const c = a => grande(a).cenarioHibridoVerdadeiro
    // o ICMS/ISS por fora entra no total do híbrido enquanto não acaba (2033 = 0, igual ao de sempre)
    assert.ok(c(2029).totalMensal - c(2029).dasReduzidoMensal - c(2029).ibsCBSLiquidoMensal > 0)
    perto(c(2033).totalMensal, c(2033).dasReduzidoMensal + c(2033).ibsCBSLiquidoMensal, '', 1e-6)
  })

  it('sem clientes B2B não há análise de híbrido em ano nenhum', () => {
    for (const ano of ANOS) {
      const r = calc('simples_nacional', 'tecnologia_ti', 80000, { ...dados, perfilClientes: 'b2c', anoAnalise: ano })
      assert.equal(r.analiseSimplesHibrido, null, String(ano))
      assert.equal(r.projecaoAnos.every(p => p.hibrido === null), true)
    }
  })

  it('o DAS puro não muda no meio da transição (só a partilha interna): a carga do Simples puro continua a de hoje', () => {
    for (const ano of ANOS) perto(sn(ano).cargaTotalReformaMensal, sn(2026).impostoAtualMensal, String(ano), 0.5)
  })
})

describe('Comparador, simulador de crescimento e reajuste de preço herdam o ano', () => {
  const base = { regime: 'lucro_presumido', setor: undefined, faturamentoMensal: 150000, insumosMensais: 60000, perfilClientes: 'b2b', uf: 'SP', anexoSimples: 'III' }
  const dados = () => ({ ...base, setor: S('comercio_varejo') })

  it('cada regime do comparador mostra a carga do próprio ano', () => {
    for (const ano of [2027, 2029, 2033]) {
      const lista = eng.calcularTodosOsRegimes({ ...dados(), anoAnalise: ano })
      const pleno = eng.calcularTodosOsRegimes({ ...dados(), anoAnalise: 2033 })
      for (const r of lista) {
        assert.equal(r.anoAnalise, ano)
        const p = pleno.find(x => x.regime === r.regime).projecaoAnos.find(x => x.ano === ano)
        perto(r.cargaTotalReformaMensal, p.impostoMensal, `${r.regime} ${ano}`)
      }
    }
  })

  it('o simulador de crescimento com 0% de crescimento reproduz a carga do ano', () => {
    for (const ano of [2027, 2030, 2033]) {
      const [p0] = eng.calcularCurvaCrescimento({ ...dados(), anoAnalise: ano }, [0])
      perto(p0.impostoIVAMensal, eng.calcularTodosOsCenarios({ ...dados(), anoAnalise: ano }).cargaTotalReformaMensal, String(ano))
    }
  })

  it('o reajuste de preço necessário é por ano e parte do zero em 2026', () => {
    const r = eng.calcularTodosOsCenarios({ ...dados(), regime: 'lucro_presumido', anoAnalise: 2033 })
    assert.equal(r.projecaoAnos[0].reajustePrecoNecessario, 0)
    for (const p of r.projecaoAnos) {
      const esperado = p.aliquotaEfetiva > r.aliquotaAtual && p.aliquotaEfetiva < 1
        ? ((1 - r.aliquotaAtual) / (1 - p.aliquotaEfetiva) - 1) * 100 : 0
      perto(p.reajustePrecoNecessario, esperado, String(p.ano), 1e-9)
    }
  })
})
