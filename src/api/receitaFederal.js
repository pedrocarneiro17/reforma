/**
 * Módulo de integração com a Calculadora de Tributos da Receita Federal
 *
 * A Receita Federal disponibilizará (a partir de 2025-2026) uma engine open-source
 * para cálculo oficial do IVA Dual via API REST.
 *
 * Referência: https://www.gov.br/receitafederal/reforma-tributaria
 *
 * Por enquanto esta rota está preparada para quando o endpoint for publicado.
 * O mock abaixo simula a resposta esperada para fins de desenvolvimento.
 */

/** URL base da API governamental — substituir quando disponibilizada oficialmente */
const RF_API_BASE_URL = import.meta.env.VITE_RF_API_URL ?? 'https://api.receitafederal.gov.br/v1/iva-dual'

/**
 * Envia os dados da simulação para a Calculadora Oficial da Receita Federal.
 *
 * @param {Object} resultados — objeto retornado por calcularTodosOsCenarios()
 * @returns {{ ok: boolean, mensagem: string, dados?: object }}
 */
export async function enviarParaReceitaFederal(resultados) {
  const payload = buildPayload(resultados)

  // Em desenvolvimento/staging: retorna mock enquanto a API não está disponível
  if (import.meta.env.DEV || !import.meta.env.VITE_RF_API_URL) {
    return await mockRFResponse(payload)
  }

  try {
    const response = await fetch(`${RF_API_BASE_URL}/calcular`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Client-App': 'ReformaCalc/1.0',
        // Quando a RF exigir autenticação:
        // 'Authorization': `Bearer ${import.meta.env.VITE_RF_API_KEY}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10_000),
    })

    if (!response.ok) {
      const erro = await response.json().catch(() => ({}))
      return {
        ok: false,
        mensagem: `Erro ${response.status} na API da Receita Federal: ${erro.message ?? 'sem detalhes'}`,
      }
    }

    const dados = await response.json()
    return {
      ok: true,
      mensagem: 'Dados enviados com sucesso à Calculadora Oficial da Receita Federal.',
      dados,
    }
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return { ok: false, mensagem: 'Timeout: a API da Receita Federal demorou mais de 10s para responder.' }
    }
    return { ok: false, mensagem: `Erro de rede: ${err.message}` }
  }
}

// ─── Montagem do payload no formato esperado pela RF ────────────────────────

function buildPayload(resultados) {
  const {
    regime, setor, faturamentoMensal, insumosMensais, perfilClientes,
    aliquotaAtual, aliquotaIVABruta, aliquotaIVAEfetiva,
    impostoAtualMensal, impostoIVALiquidoMensal, creditoInsumosMensal,
  } = resultados

  return {
    versao_api: '1.0',
    timestamp: new Date().toISOString(),
    contribuinte: {
      regime_tributario: regime,
      setor_cnae: setor.value,
      perfil_clientes: perfilClientes,
    },
    financeiro: {
      faturamento_mensal: faturamentoMensal,
      insumos_mensais: insumosMensais,
      faturamento_anual: faturamentoMensal * 12,
    },
    simulacao: {
      carga_atual: {
        aliquota_efetiva: aliquotaAtual,
        imposto_mensal: impostoAtualMensal,
      },
      iva_dual: {
        aliquota_bruta: aliquotaIVABruta,
        aliquota_efetiva_liquida: aliquotaIVAEfetiva,
        credito_insumos_mensal: creditoInsumosMensal,
        imposto_liquido_mensal: impostoIVALiquidoMensal,
        reducao_setorial: setor.reducao,
      },
    },
  }
}

// ─── Mock para desenvolvimento ──────────────────────────────────────────────

async function mockRFResponse(payload) {
  // Simula latência de rede
  await new Promise(r => setTimeout(r, 1200))

  return {
    ok: false,
    mensagem: '⚠ API oficial ainda não disponível. O endpoint será publicado pela Receita Federal a partir de 2026. Payload preparado e logado no console.',
    dados: {
      _mock: true,
      payload_enviado: payload,
      nota: 'Substitua VITE_RF_API_URL no arquivo .env quando a API for publicada.',
    },
  }
}
