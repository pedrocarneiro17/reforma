import { Router } from 'express'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { existsSync } from 'node:fs'
import { autenticar } from '../middleware/auth.js'
import { criarAssistente, Erro } from '../assistente/conversa.js'
import { criarBaseLei } from '../assistente/lei.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const RAIZ_LEI = join(__dirname, '..', '..', '.claude', 'skills', 'reforma-tributaria')
const PACOTE = join(__dirname, '..', 'gerado', 'ferramentas.mjs')

const MODELO = process.env.ASSISTENTE_MODELO || 'claude-sonnet-5-5'
const LIMITE_POR_HORA = Number(process.env.ASSISTENTE_LIMITE_HORA) || 30
const JANELA_MS = 60 * 60 * 1000

/** Limite simples por usuário, em memória (zera ao reiniciar o servidor). */
const usos = new Map()
export function dentroDoLimite(idUsuario, agora = Date.now(), limite = LIMITE_POR_HORA) {
  const recentes = (usos.get(idUsuario) ?? []).filter(t => agora - t < JANELA_MS)
  if (recentes.length >= limite) {
    usos.set(idUsuario, recentes)
    return false
  }
  recentes.push(agora)
  usos.set(idUsuario, recentes)
  return true
}

async function chamarApi(corpo) {
  const resp = await fetch(`${process.env.ANTHROPIC_API_URL || 'https://api.anthropic.com'}/v1/messages`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(corpo),
    signal: AbortSignal.timeout(60_000),
  })
  if (!resp.ok) {
    // Não loga o corpo: pode conter dados do cliente. Só o status ajuda a diagnosticar.
    throw new Error(`API do modelo respondeu ${resp.status}`)
  }
  return resp.json()
}

let assistente = null
async function obterAssistente() {
  if (assistente) return assistente
  if (!existsSync(PACOTE)) throw new Error('pacote do motor ausente — rode "npm run build:engine"')
  const motor = await import(pathToFileURL(PACOTE).href)
  assistente = criarAssistente({
    chamarApi,
    ferramentasMotor: motor.FERRAMENTAS_MOTOR,
    executarMotor: motor.executarFerramentaMotor,
    lei: criarBaseLei(RAIZ_LEI),
    montarDados: motor.montarDados,
    camposEmpresa: motor.CAMPOS_EMPRESA,
    modelo: MODELO,
  })
  return assistente
}

const router = Router()
router.use(autenticar)

router.get('/status', (_req, res) => {
  res.json({ disponivel: Boolean(process.env.ANTHROPIC_API_KEY) })
})

router.post('/', async (req, res) => {
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(503).json({ erro: 'O assistente ainda não foi configurado neste servidor.' })
  }
  if (!dentroDoLimite(req.usuario.id)) {
    return res.status(429).json({ erro: `Limite de ${LIMITE_POR_HORA} perguntas por hora atingido. Tente novamente mais tarde.` })
  }
  try {
    const a = await obterAssistente()
    const { resposta, passos } = await a.responder({
      mensagens: req.body?.mensagens,
      contexto: req.body?.contexto,
    })
    res.json({ resposta, passos })
  } catch (e) {
    if (e instanceof Erro) return res.status(400).json({ erro: e.message })
    console.error('Assistente:', e instanceof Error ? e.message : 'erro desconhecido')
    res.status(502).json({ erro: 'O assistente não conseguiu responder agora. Tente novamente em instantes.' })
  }
})

export default router
