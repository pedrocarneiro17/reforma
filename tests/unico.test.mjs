/**
 * Testes do importador do CSV do Único. Usa um arquivo sintético pequeno (nenhum dado de cliente) com o
 * mesmo layout de colunas e a mesma codificação (Windows-1252, ponto e vírgula, vírgula decimal).
 */
import { after, before, describe, it } from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
let server, u, eng, setoresMod

before(async () => {
  server = await createServer({
    root: raiz, configFile: false, logLevel: 'silent', appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
    optimizeDeps: { noDiscovery: true, include: [] },
  })
  u = await server.ssrLoadModule('/src/utils/unico.ts')
  eng = await server.ssrLoadModule('/src/engine/calculadora.ts')
  setoresMod = await server.ssrLoadModule('/src/data/setores.ts')
})
after(async () => { await server?.close() })

const CAB = ['Tipo de lançamento', 'Data', 'CFOP', 'Descrição', 'NCM', 'Valor do produto', 'Desconto do produto',
  'Situação da nota', 'cClasstrib IBS/CBS', 'CST IBS/CBS', 'BC IBS/CBS', 'Valor CBS', 'Valor IBS UF', 'Valor IBS Mun']

const br = n => n.toFixed(2).replace('.', ',')
/** monta uma linha; campos fora do informado ficam vazios */
function linha(o) {
  const v = {
    tipo: 'Entrada         ', data: '15/03/2026', cfop: '1.102-000', desc: 'ITEM', ncm: '0', valor: 0, desconto: 0,
    sit: 'Documento regular', cls: '', cst: '', bc: 0, cbs: 0, ibs: 0, ...o,
  }
  return [v.tipo, v.data, v.cfop, v.desc, v.ncm, br(v.valor), br(v.desconto), v.sit, v.cls, v.cst ? `="${v.cst}"` : '', br(v.bc), br(v.cbs), br(v.ibs), '0,00'].join(';')
}
/** Windows-1252 com CRLF, como o arquivo real */
const arquivo = linhas => Buffer.from([CAB.join(';'), ...linhas].join('\r\n') + '\r\n', 'latin1')

const LINHAS = [
  // serviços emitidos: hospedagem
  linha({ tipo: 'Serviço emitido', cfop: '5.933-000', desc: 'Hospedagem de qualquer natureza em hotéis e pousadas', valor: 9000 }),
  linha({ tipo: 'Serviço emitido', data: '10/04/2026', cfop: '5.933-000', desc: 'Hospedagem de qualquer natureza em hotéis e pousadas', valor: 3000 }),
  // saídas: café da manhã (preparado), cerveja, água, suco
  linha({ tipo: 'Saída', cfop: '5.102-000', desc: 'CAFE DA MANHA', ncm: '21069090', valor: 600 }),
  linha({ tipo: 'Saída', cfop: '5.405-000', desc: 'CERVEJA LONG NECK', ncm: '22030000', valor: 300 }),
  linha({ tipo: 'Saída', cfop: '5.405-000', desc: 'AGUA MINERAL', ncm: '22011000', valor: 100 }),
  linha({ tipo: 'Saída', cfop: '5.102-000', desc: 'SUCO LATA', ncm: '20098919', valor: 100 }),
  // documento cancelado: não conta
  linha({ tipo: 'Serviço emitido', cfop: '5.933-000', desc: 'Hospedagem de qualquer natureza', valor: 99999, sit: 'Documento cancelado' }),
  // entradas
  linha({ cfop: '1.407-000', desc: 'TINTA', ncm: '32089029', valor: 1000, desconto: 200, cls: '000001', cst: '000', bc: 800, cbs: 7.2, ibs: 0.8 }),   // uso e consumo, com destaque, desconto
  linha({ cfop: '1.102-000', desc: 'REVENDA', ncm: '40510000', valor: 500 }),                                                                         // revenda, sem destaque
  linha({ cfop: '1.653-000', desc: 'GAS GLP', ncm: '27111910', valor: 400, cls: '620006', cst: '620' }),                                              // combustível, monofásico
  linha({ cfop: '2.551-000', desc: 'CALDEIRA', ncm: '84031010', valor: 2000, cls: '000001', cst: '000', bc: 2000, cbs: 18, ibs: 2 }),                  // ativo
  linha({ cfop: '1.102-000', desc: 'MANTEIGA', ncm: '4051000', valor: 100, cls: '200003', cst: '200', bc: 100 }),                                     // alíquota zero
  linha({ tipo: 'Serviço recebido', cfop: '1.933-000', desc: 'SERVICO TOMADO', valor: 50 }),
]

describe('Leitura do arquivo', () => {
  it('lê campos com aspas, ponto e vírgula e quebra de linha dentro do campo', () => {
    const t = lerTeste('a;"b;c";"d\ne"\r\n1;2;3\r\n')
    assert.deepEqual(t, [['a', 'b;c', 'd\ne'], ['1', '2', '3']])
  })

  it('aceita aspas escapadas e ignora linhas em branco', () => {
    assert.deepEqual(lerTeste('x;"diz ""oi""";y\r\n\r\n'), [['x', 'diz "oi"', 'y']])
  })

  it('converte números brasileiros e o formato do Excel (="00")', () => {
    assert.equal(u.numeroBR('1.144,96'), 1144.96)
    assert.equal(u.numeroBR('0,00'), 0)
    assert.equal(u.numeroBR(''), 0)
    assert.equal(u.numeroBR('="50"'), 50)
    assert.equal(u.numeroBR('abc'), 0)
  })

  it('decodifica Windows-1252 e UTF-8 (com BOM)', () => {
    assert.equal(u.decodificarArquivo(Buffer.from('Descrição de operação', 'latin1')), 'Descrição de operação')
    assert.equal(u.decodificarArquivo(Buffer.from('﻿Descrição', 'utf-8')), 'Descrição')
  })

  it('recusa arquivo que não é do Único e arquivo vazio', () => {
    assert.throws(() => u.analisarArquivoUnico(Buffer.from('a;b;c\r\n1;2;3\r\n')), u.ErroUnico)
    assert.throws(() => u.analisarArquivoUnico(Buffer.from('')), u.ErroUnico)
    assert.throws(() => u.analisarArquivoUnico(Buffer.from(CAB.join(';') + '\r\n')), u.ErroUnico)
  })
})

function lerTeste(t) { return u.lerCsv(t) }

describe('Classificação', () => {
  it('natureza da entrada pelo CFOP', () => {
    const n = (cfop, tipo = 'entrada') => u.naturezaDaEntrada({ tipo, cfop })
    assert.equal(n('1.407'), 'uso_consumo')
    assert.equal(n('1.556'), 'uso_consumo')
    assert.equal(n('2.551'), 'ativo_imobilizado')
    assert.equal(n('1.551'), 'ativo_imobilizado')
    assert.equal(n('1.102'), 'revenda_insumo')
    assert.equal(n('1.403'), 'revenda_insumo')
    assert.equal(n('1.653'), 'combustivel')
    assert.equal(n('2.923'), 'outras')
    assert.equal(n('1.933', 'servico_recebido'), 'servico_tomado')
    assert.equal(n('xyz'), 'outras')
  })

  it('situação do crédito pelos campos de IBS/CBS do próprio arquivo', () => {
    const s = (o) => u.situacaoDoCredito({ cst: '', cClassTrib: '', bcIbsCbs: 0, valorCbs: 0, valorIbs: 0, ...o })
    assert.equal(s({ cst: '000', bcIbsCbs: 100, valorCbs: 0.9, valorIbs: 0.1 }), 'com_destaque')
    assert.equal(s({ cst: '620', cClassTrib: '620006' }), 'monofasico')
    assert.equal(s({ cst: '200', cClassTrib: '200003', bcIbsCbs: 100 }), 'aliquota_zero')
    assert.equal(s({}), 'sem_destaque')
  })

  it('categoria da receita: hospedagem, alimentação preparada, bebidas alcoólica e de terceiros', () => {
    const c = (tipo, ncm, descricao) => u.categoriaDaReceita({ tipo, ncm, descricao })
    assert.equal(c('servico_emitido', '', 'Hospedagem de qualquer natureza em hotéis'), 'hospedagem')
    assert.equal(c('servico_emitido', '', 'Lavanderia'), 'outros_servicos')
    assert.equal(c('saida', '22030000', 'CERVEJA'), 'bebida_alcoolica')
    assert.equal(c('saida', '22042100', 'VINHO'), 'bebida_alcoolica')
    assert.equal(c('saida', '22082000', 'CACHACA'), 'bebida_alcoolica')
    assert.equal(c('saida', '22011000', 'AGUA'), 'bebida_terceiros')
    assert.equal(c('saida', '22021000', 'REFRIGERANTE'), 'bebida_terceiros')
    assert.equal(c('saida', '20098919', 'SUCO LATA'), 'bebida_terceiros')
    assert.equal(c('saida', '21069090', 'CAFE DA MANHA'), 'alimentacao_preparada')
    assert.equal(c('saida', '21069090', 'Almoço executivo'), 'alimentacao_preparada')
    assert.equal(c('saida', '33049990', 'SABONETE'), 'outras_mercadorias')
  })
})

describe('Resumo do arquivo sintético', () => {
  const r = () => u.analisarArquivoUnico(arquivo(LINHAS))

  it('período, meses e documentos cancelados', () => {
    const x = r()
    assert.deepEqual(x.periodo, { inicio: '2026-03', fim: '2026-04', meses: 2 })
    assert.equal(x.documentosCancelados, 1)
  })

  it('receita por categoria, sem o documento cancelado', () => {
    const c = r().receita
    assert.equal(c.total, 13100)
    assert.equal(c.porCategoria.hospedagem, 12000)
    assert.equal(c.porCategoria.alimentacao_preparada, 600)
    assert.equal(c.porCategoria.bebida_alcoolica, 300)
    assert.equal(c.porCategoria.bebida_terceiros, 200)
    assert.equal(c.mediaMensal, 6550)
    assert.equal(c.porMes['2026-04'], 3000)
  })

  it('entradas abatem o desconto e separam por natureza e por situação do crédito', () => {
    const e = r().entradas
    assert.equal(e.descontosAbatidos, 200)
    assert.equal(e.porNatureza.uso_consumo, 800)          // 1.000 − 200
    assert.equal(e.porNatureza.revenda_insumo, 600)       // 500 + 100
    assert.equal(e.porNatureza.combustivel, 400)
    assert.equal(e.porNatureza.ativo_imobilizado, 2000)
    assert.equal(e.porNatureza.servico_tomado, 50)
    assert.equal(e.total, 3850)
    assert.equal(e.porSituacao.com_destaque, 2800)        // tinta + caldeira
    assert.equal(e.porSituacao.sem_destaque, 550)         // revenda + serviço tomado
    assert.equal(e.porSituacao.monofasico, 400)
    assert.equal(e.porSituacao.aliquota_zero, 100)
    assert.equal(e.ibsCbsDestacado, 28)                   // 7,2 + 0,8 + 18 + 2
    // as duas formas de somar fecham no mesmo total
    const soma = o => Object.values(o).reduce((a, b) => a + b, 0)
    assert.equal(soma(e.porNatureza), soma(e.porSituacao))
  })

  it('avisa do que foi suposto', () => {
    const a = r().avisos.join(' | ')
    assert.match(a, /cancelados/)
    assert.match(a, /descontos/)
    assert.match(a, /2 meses/)
    assert.match(a, /Alimentação preparada/)
    assert.match(a, /monofásica/)
  })
})

describe('Sugestão para o formulário', () => {
  const resumo = () => u.analisarArquivoUnico(arquivo(LINHAS))

  it('hotel: setor, anexos III/I, % de serviço e % de alíquota cheia', () => {
    const s = u.sugerirFormulario(resumo())
    assert.equal(s.setorValue, 'hoteis_pousadas')
    assert.equal(s.anexo1, 'III')
    assert.equal(s.anexo2, 'I')
    assert.equal(s.pctAnexo1, Math.round(12000 / 13100 * 10000) / 100)        // 91,6
    assert.equal(s.pctReceitaAliquotaCheia, Math.round(500 / 13100 * 10000) / 100)  // bebidas 300 + 200
    assert.equal(s.faturamentoMensal, 6550)
  })

  it('a escolha de crédito muda a base e o % sem destaque; padrão exclui monofásico e alíquota zero', () => {
    const r = resumo()
    const padrao = u.sugerirFormulario(r)
    assert.equal(padrao.insumosMensais, (2800 + 550) / 2)
    assert.equal(padrao.pctFornecedoresSimples, Math.round(550 / 3350 * 100))
    const so = u.sugerirFormulario(r, { com_destaque: true, sem_destaque: false, monofasico: false, aliquota_zero: false })
    assert.equal(so.insumosMensais, 1400)
    assert.equal(so.pctFornecedoresSimples, 0)
    const tudo = u.sugerirFormulario(r, { com_destaque: true, sem_destaque: true, monofasico: true, aliquota_zero: true })
    assert.equal(tudo.insumosMensais, 3850 / 2)
  })

  it('sem hospedagem relevante não sugere setor nem alíquota cheia', () => {
    const l = [linha({ tipo: 'Saída', cfop: '5.102-000', desc: 'CAMISETA', ncm: '61091000', valor: 1000 })]
    const s = u.sugerirFormulario(u.analisarArquivoUnico(arquivo(l)))
    assert.equal(s.setorValue, null)
    assert.equal(s.pctReceitaAliquotaCheia, 0)
    assert.equal(s.anexo1, null)
    assert.equal(s.pctAnexo1, null)
  })

  it('a sugestão roda no motor e o híbrido mantém o DAS que sobra', () => {
    const s = u.sugerirFormulario(resumo())
    const dados = {
      regime: 'simples_nacional',
      setor: setoresMod.SETORES.find(x => x.value === s.setorValue),
      faturamentoMensal: s.faturamentoMensal * 20,   // escala p/ faixa realista do Simples
      insumosMensais: s.insumosMensais * 20,
      perfilClientes: 'b2c',
      anexoSimples: s.anexo1, anexoSimples2: s.anexo2, pctAnexo1: s.pctAnexo1,
      pctReceitaAliquotaCheia: s.pctReceitaAliquotaCheia, pctFornecedoresSimples: s.pctFornecedoresSimples,
    }
    const r = eng.calcularTodosOsCenarios(dados)
    const h = r.cenarioHibridoVerdadeiro
    assert.ok(h.dasReduzidoMensal > 0)
    assert.ok(Math.abs(h.totalMensal - (h.dasReduzidoMensal + h.ibsCBSLiquidoMensal)) < 0.01)
    assert.ok(r.pctFornecedoresSimples > 0)
  })
})
