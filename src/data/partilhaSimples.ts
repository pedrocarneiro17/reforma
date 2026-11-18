/**
 * Partilha oficial do DAS do Simples Nacional na transição da Reforma Tributária —
 * Anexos I a V da LC 214/2025 (redação da LC 227/2026), por ano-calendário e faixa.
 *
 * Valores em % do DAS (cada linha soma 100). GERADO por scripts/gerar_partilha_simples.py
 * a partir de .claude/skills/reforma-tributaria/lcp214/088–092. Não editar à mão.
 *
 * • 2027–2028: CBS substitui PIS/COFINS; IBS de teste (~0,17%); ICMS/ISS seguem no DAS
 * • 2029–2032: ICMS/ISS migram para o IBS (10%/ano do total de ICMS/ISS)
 * • 2033+:     só CBS e IBS — idênticos à partilha de PIS/COFINS e ICMS/ISS da LC 123/2006
 * • 6ª faixa: ICMS/ISS/IBS recolhidos fora do DAS (0 aqui)
 * Não modela as notas de teto do ISS na 5ª faixa (alíquota efetiva acima de 14,92537%).
 */

import type { AnexoSimples } from '../types'

export type TributoPartilhaSN = 'IRPJ' | 'CSLL' | 'CBS' | 'CPP' | 'IPI' | 'ICMS' | 'ISS' | 'IBS'
/** Partilha de uma faixa: % do DAS por tributo */
export type LinhaPartilhaSN = Partial<Record<TributoPartilhaSN, number>>

/** Anos com tabela própria; anos anteriores a 2027 usam a LC 123 (ver partilhaConsumoSimples) */
export const ANOS_PARTILHA_LC214 = [2027, 2028, 2029, 2030, 2031, 2032, 2033] as const

export const PARTILHA_SIMPLES_LC214: Record<AnexoSimples, Record<number, LinhaPartilhaSN[]>> = {
  I: {
    2027: [
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 41.5, ICMS: 34, IBS: 0.17 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 41.5, ICMS: 34, IBS: 0.17 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 42, ICMS: 33.5, IBS: 0.17 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 42, ICMS: 33.5, IBS: 0.17 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 42, ICMS: 33.5, IBS: 0.17 },
      { IRPJ: 13.58, CSLL: 10.06, CBS: 34.02, CPP: 42.34 },
    ],
    2028: [
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 41.5, ICMS: 34, IBS: 0.17 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 41.5, ICMS: 34, IBS: 0.17 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 42, ICMS: 33.5, IBS: 0.17 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 42, ICMS: 33.5, IBS: 0.17 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.33, CPP: 42, ICMS: 33.5, IBS: 0.17 },
      { IRPJ: 13.58, CSLL: 10.06, CBS: 34.02, CPP: 42.34 },
    ],
    2029: [
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 41.5, ICMS: 30.6, IBS: 3.4 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 41.5, ICMS: 30.6, IBS: 3.4 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, ICMS: 30.15, IBS: 3.35 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, ICMS: 30.15, IBS: 3.35 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, ICMS: 30.15, IBS: 3.35 },
      { IRPJ: 13.5, CSLL: 10, CBS: 34.4, CPP: 42.1 },
    ],
    2030: [
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 41.5, ICMS: 27.2, IBS: 6.8 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 41.5, ICMS: 27.2, IBS: 6.8 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, ICMS: 26.8, IBS: 6.7 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, ICMS: 26.8, IBS: 6.7 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, ICMS: 26.8, IBS: 6.7 },
      { IRPJ: 13.5, CSLL: 10, CBS: 34.4, CPP: 42.1 },
    ],
    2031: [
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 41.5, ICMS: 23.8, IBS: 10.2 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 41.5, ICMS: 23.8, IBS: 10.2 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, ICMS: 23.45, IBS: 10.05 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, ICMS: 23.45, IBS: 10.05 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, ICMS: 23.45, IBS: 10.05 },
      { IRPJ: 13.5, CSLL: 10, CBS: 34.4, CPP: 42.1 },
    ],
    2032: [
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 41.5, ICMS: 20.4, IBS: 13.6 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 41.5, ICMS: 20.4, IBS: 13.6 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, ICMS: 20.1, IBS: 13.4 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, ICMS: 20.1, IBS: 13.4 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, ICMS: 20.1, IBS: 13.4 },
      { IRPJ: 13.5, CSLL: 10, CBS: 34.4, CPP: 42.1 },
    ],
    2033: [
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 41.5, IBS: 34 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 41.5, IBS: 34 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, IBS: 33.5 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, IBS: 33.5 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 15.5, CPP: 42, IBS: 33.5 },
      { IRPJ: 13.5, CSLL: 10, CBS: 34.4, CPP: 42.1 },
    ],
  },
  II: {
    2027: [
      { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32, IBS: 0.15 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32, IBS: 0.15 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32, IBS: 0.15 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32, IBS: 0.15 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32, IBS: 0.15 },
      { IRPJ: 8.53, CSLL: 7.53, CBS: 25.22, CPP: 23.59, IPI: 35.13 },
    ],
    2028: [
      { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32, IBS: 0.15 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32, IBS: 0.15 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32, IBS: 0.15 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32, IBS: 0.15 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 13.85, CPP: 37.5, IPI: 7.5, ICMS: 32, IBS: 0.15 },
      { IRPJ: 8.53, CSLL: 7.53, CBS: 25.22, CPP: 23.59, IPI: 35.13 },
    ],
    2029: [
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 28.8, IBS: 3.2 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 28.8, IBS: 3.2 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 28.8, IBS: 3.2 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 28.8, IBS: 3.2 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 28.8, IBS: 3.2 },
      { IRPJ: 8.5, CSLL: 7.5, CBS: 25.5, CPP: 23.5, IPI: 35 },
    ],
    2030: [
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 25.6, IBS: 6.4 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 25.6, IBS: 6.4 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 25.6, IBS: 6.4 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 25.6, IBS: 6.4 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 25.6, IBS: 6.4 },
      { IRPJ: 8.5, CSLL: 7.5, CBS: 25.5, CPP: 23.5, IPI: 35 },
    ],
    2031: [
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 22.4, IBS: 9.6 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 22.4, IBS: 9.6 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 22.4, IBS: 9.6 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 22.4, IBS: 9.6 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 22.4, IBS: 9.6 },
      { IRPJ: 8.5, CSLL: 7.5, CBS: 25.5, CPP: 23.5, IPI: 35 },
    ],
    2032: [
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 19.2, IBS: 12.8 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 19.2, IBS: 12.8 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 19.2, IBS: 12.8 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 19.2, IBS: 12.8 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, ICMS: 19.2, IBS: 12.8 },
      { IRPJ: 8.5, CSLL: 7.5, CBS: 25.5, CPP: 23.5, IPI: 35 },
    ],
    2033: [
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, IBS: 32 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, IBS: 32 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, IBS: 32 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, IBS: 32 },
      { IRPJ: 5.5, CSLL: 3.5, CBS: 14, CPP: 37.5, IPI: 7.5, IBS: 32 },
      { IRPJ: 8.5, CSLL: 7.5, CBS: 25.5, CPP: 23.5, IPI: 35 },
    ],
  },
  III: {
    2027: [
      { IRPJ: 4, CSLL: 3.5, CBS: 15.43, CPP: 43.4, ISS: 33.5, IBS: 0.17 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.91, CPP: 43.4, ISS: 32, IBS: 0.19 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.41, CPP: 43.4, ISS: 32.5, IBS: 0.19 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.41, CPP: 43.4, ISS: 32.5, IBS: 0.19 },
      { IRPJ: 4, CSLL: 3.5, CBS: 15.43, CPP: 43.4, ISS: 33.5, IBS: 0.17 },
      { IRPJ: 35.09, CSLL: 15.04, CBS: 19.29, CPP: 30.58 },
    ],
    2028: [
      { IRPJ: 4, CSLL: 3.5, CBS: 15.43, CPP: 43.4, ISS: 33.5, IBS: 0.17 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.91, CPP: 43.4, ISS: 32, IBS: 0.19 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.41, CPP: 43.4, ISS: 32.5, IBS: 0.19 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.41, CPP: 43.4, ISS: 32.5, IBS: 0.19 },
      { IRPJ: 4, CSLL: 3.5, CBS: 15.43, CPP: 43.4, ISS: 33.5, IBS: 0.17 },
      { IRPJ: 35.09, CSLL: 15.04, CBS: 19.29, CPP: 30.58 },
    ],
    2029: [
      { IRPJ: 4, CSLL: 3.5, CBS: 15.6, CPP: 43.4, ISS: 30.15, IBS: 3.35 },
      { IRPJ: 4, CSLL: 3.5, CBS: 17.1, CPP: 43.4, ISS: 28.8, IBS: 3.2 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.6, CPP: 43.4, ISS: 29.25, IBS: 3.25 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.6, CPP: 43.4, ISS: 29.25, IBS: 3.25 },
      { IRPJ: 4, CSLL: 3.5, CBS: 15.6, CPP: 43.4, ISS: 30.15, IBS: 3.35 },
      { IRPJ: 35, CSLL: 15, CBS: 19.5, CPP: 30.5 },
    ],
    2030: [
      { IRPJ: 4, CSLL: 3.5, CBS: 15.6, CPP: 43.4, ISS: 26.8, IBS: 6.7 },
      { IRPJ: 4, CSLL: 3.5, CBS: 17.1, CPP: 43.4, ISS: 25.6, IBS: 6.4 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.6, CPP: 43.4, ISS: 26, IBS: 6.5 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.6, CPP: 43.4, ISS: 26, IBS: 6.5 },
      { IRPJ: 4, CSLL: 3.5, CBS: 15.6, CPP: 43.4, ISS: 26.8, IBS: 6.7 },
      { IRPJ: 35, CSLL: 15, CBS: 19.5, CPP: 30.5 },
    ],
    2031: [
      { IRPJ: 4, CSLL: 3.5, CBS: 15.6, CPP: 43.4, ISS: 23.45, IBS: 10.05 },
      { IRPJ: 4, CSLL: 3.5, CBS: 17.1, CPP: 43.4, ISS: 22.4, IBS: 9.6 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.6, CPP: 43.4, ISS: 22.75, IBS: 9.75 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.6, CPP: 43.4, ISS: 22.75, IBS: 9.75 },
      { IRPJ: 4, CSLL: 3.5, CBS: 15.6, CPP: 43.4, ISS: 23.45, IBS: 10.05 },
      { IRPJ: 35, CSLL: 15, CBS: 19.5, CPP: 30.5 },
    ],
    2032: [
      { IRPJ: 4, CSLL: 3.5, CBS: 15.6, CPP: 43.4, ISS: 20.1, IBS: 13.4 },
      { IRPJ: 4, CSLL: 3.5, CBS: 17.1, CPP: 43.4, ISS: 19.2, IBS: 12.8 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.6, CPP: 43.4, ISS: 19.5, IBS: 13 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.6, CPP: 43.4, ISS: 19.5, IBS: 13 },
      { IRPJ: 4, CSLL: 3.5, CBS: 15.6, CPP: 43.4, ISS: 20.1, IBS: 13.4 },
      { IRPJ: 35, CSLL: 15, CBS: 19.5, CPP: 30.5 },
    ],
    2033: [
      { IRPJ: 4, CSLL: 3.5, CBS: 15.6, CPP: 43.4, IBS: 33.5 },
      { IRPJ: 4, CSLL: 3.5, CBS: 17.1, CPP: 43.4, IBS: 32 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.6, CPP: 43.4, IBS: 32.5 },
      { IRPJ: 4, CSLL: 3.5, CBS: 16.6, CPP: 43.4, IBS: 32.5 },
      { IRPJ: 4, CSLL: 3.5, CBS: 15.6, CPP: 43.4, IBS: 33.5 },
      { IRPJ: 35, CSLL: 15, CBS: 19.5, CPP: 30.5 },
    ],
  },
  IV: {
    2027: [
      { IRPJ: 18.8, CSLL: 15.2, CBS: 21.26, ISS: 44.5, IBS: 0.24 },
      { IRPJ: 19.8, CSLL: 15.2, CBS: 24.73, ISS: 40, IBS: 0.27 },
      { IRPJ: 20.8, CSLL: 15.2, CBS: 23.74, ISS: 40, IBS: 0.26 },
      { IRPJ: 17.8, CSLL: 19.2, CBS: 22.75, ISS: 40, IBS: 0.25 },
      { IRPJ: 18.8, CSLL: 19.2, CBS: 21.76, ISS: 40, IBS: 0.24 },
      { IRPJ: 53.71, CSLL: 21.59, CBS: 24.7 },
    ],
    2028: [
      { IRPJ: 18.8, CSLL: 15.2, CBS: 21.26, ISS: 44.5, IBS: 0.24 },
      { IRPJ: 19.8, CSLL: 15.2, CBS: 24.73, ISS: 40, IBS: 0.27 },
      { IRPJ: 20.8, CSLL: 15.2, CBS: 23.74, ISS: 40, IBS: 0.26 },
      { IRPJ: 17.8, CSLL: 19.2, CBS: 22.75, ISS: 40, IBS: 0.25 },
      { IRPJ: 18.8, CSLL: 19.2, CBS: 21.76, ISS: 40, IBS: 0.24 },
      { IRPJ: 53.71, CSLL: 21.59, CBS: 24.7 },
    ],
    2029: [
      { IRPJ: 18.8, CSLL: 15.2, CBS: 21.5, ISS: 40.05, IBS: 4.45 },
      { IRPJ: 19.8, CSLL: 15.2, CBS: 25, ISS: 36, IBS: 4 },
      { IRPJ: 20.8, CSLL: 15.2, CBS: 24, ISS: 36, IBS: 4 },
      { IRPJ: 17.8, CSLL: 19.2, CBS: 23, ISS: 36, IBS: 4 },
      { IRPJ: 18.8, CSLL: 19.2, CBS: 22, ISS: 36, IBS: 4 },
      { IRPJ: 53.5, CSLL: 21.5, CBS: 25 },
    ],
    2030: [
      { IRPJ: 18.8, CSLL: 15.2, CBS: 21.5, ISS: 35.6, IBS: 8.9 },
      { IRPJ: 19.8, CSLL: 15.2, CBS: 25, ISS: 32, IBS: 8 },
      { IRPJ: 20.8, CSLL: 15.2, CBS: 24, ISS: 32, IBS: 8 },
      { IRPJ: 17.8, CSLL: 19.2, CBS: 23, ISS: 32, IBS: 8 },
      { IRPJ: 18.8, CSLL: 19.2, CBS: 22, ISS: 32, IBS: 8 },
      { IRPJ: 53.5, CSLL: 21.5, CBS: 25 },
    ],
    2031: [
      { IRPJ: 18.8, CSLL: 15.2, CBS: 21.5, ISS: 31.15, IBS: 13.35 },
      { IRPJ: 19.8, CSLL: 15.2, CBS: 25, ISS: 28, IBS: 12 },
      { IRPJ: 20.8, CSLL: 15.2, CBS: 24, ISS: 28, IBS: 12 },
      { IRPJ: 17.8, CSLL: 19.2, CBS: 23, ISS: 28, IBS: 12 },
      { IRPJ: 18.8, CSLL: 19.2, CBS: 22, ISS: 28, IBS: 12 },
      { IRPJ: 53.5, CSLL: 21.5, CBS: 25 },
    ],
    2032: [
      { IRPJ: 18.8, CSLL: 15.2, CBS: 21.5, ISS: 26.7, IBS: 17.8 },
      { IRPJ: 19.8, CSLL: 15.2, CBS: 25, ISS: 24, IBS: 16 },
      { IRPJ: 20.8, CSLL: 15.2, CBS: 24, ISS: 24, IBS: 16 },
      { IRPJ: 17.8, CSLL: 19.2, CBS: 23, ISS: 24, IBS: 16 },
      { IRPJ: 18.8, CSLL: 19.2, CBS: 22, ISS: 24, IBS: 16 },
      { IRPJ: 53.5, CSLL: 21.5, CBS: 25 },
    ],
    2033: [
      { IRPJ: 18.8, CSLL: 15.2, CBS: 21.5, IBS: 44.5 },
      { IRPJ: 19.8, CSLL: 15.2, CBS: 25, IBS: 40 },
      { IRPJ: 20.8, CSLL: 15.2, CBS: 24, IBS: 40 },
      { IRPJ: 17.8, CSLL: 19.2, CBS: 23, IBS: 40 },
      { IRPJ: 18.8, CSLL: 19.2, CBS: 22, IBS: 40 },
      { IRPJ: 53.5, CSLL: 21.5, CBS: 25 },
    ],
  },
  V: {
    2027: [
      { IRPJ: 25, CSLL: 15, CBS: 16.96, CPP: 28.85, ISS: 14, IBS: 0.19 },
      { IRPJ: 23, CSLL: 15, CBS: 16.96, CPP: 27.85, ISS: 17, IBS: 0.19 },
      { IRPJ: 24, CSLL: 15, CBS: 17.95, CPP: 23.85, ISS: 19, IBS: 0.2 },
      { IRPJ: 21, CSLL: 15, CBS: 18.94, CPP: 23.85, ISS: 21, IBS: 0.21 },
      { IRPJ: 23, CSLL: 12.5, CBS: 16.96, CPP: 23.85, ISS: 23.5, IBS: 0.19 },
      { IRPJ: 35.1, CSLL: 15.54, CBS: 19.78, CPP: 29.58 },
    ],
    2028: [
      { IRPJ: 25, CSLL: 15, CBS: 16.96, CPP: 28.85, ISS: 14, IBS: 0.19 },
      { IRPJ: 23, CSLL: 15, CBS: 16.96, CPP: 27.85, ISS: 17, IBS: 0.19 },
      { IRPJ: 24, CSLL: 15, CBS: 17.95, CPP: 23.85, ISS: 19, IBS: 0.2 },
      { IRPJ: 21, CSLL: 15, CBS: 18.94, CPP: 23.85, ISS: 21, IBS: 0.21 },
      { IRPJ: 23, CSLL: 12.5, CBS: 16.96, CPP: 23.85, ISS: 23.5, IBS: 0.19 },
      { IRPJ: 35.1, CSLL: 15.54, CBS: 19.78, CPP: 29.58 },
    ],
    2029: [
      { IRPJ: 25, CSLL: 15, CBS: 17.15, CPP: 28.85, ISS: 12.6, IBS: 1.4 },
      { IRPJ: 23, CSLL: 15, CBS: 17.15, CPP: 27.85, ISS: 15.3, IBS: 1.7 },
      { IRPJ: 24, CSLL: 15, CBS: 18.15, CPP: 23.85, ISS: 17.1, IBS: 1.9 },
      { IRPJ: 21, CSLL: 15, CBS: 19.15, CPP: 23.85, ISS: 18.9, IBS: 2.1 },
      { IRPJ: 23, CSLL: 12.5, CBS: 17.15, CPP: 23.85, ISS: 21.15, IBS: 2.35 },
      { IRPJ: 35, CSLL: 15.5, CBS: 20, CPP: 29.5 },
    ],
    2030: [
      { IRPJ: 25, CSLL: 15, CBS: 17.15, CPP: 28.85, ISS: 11.2, IBS: 2.8 },
      { IRPJ: 23, CSLL: 15, CBS: 17.15, CPP: 27.85, ISS: 13.6, IBS: 3.4 },
      { IRPJ: 24, CSLL: 15, CBS: 18.15, CPP: 23.85, ISS: 15.2, IBS: 3.8 },
      { IRPJ: 21, CSLL: 15, CBS: 19.15, CPP: 23.85, ISS: 16.8, IBS: 4.2 },
      { IRPJ: 23, CSLL: 12.5, CBS: 17.15, CPP: 23.85, ISS: 18.8, IBS: 4.7 },
      { IRPJ: 35, CSLL: 15.5, CBS: 20, CPP: 29.5 },
    ],
    2031: [
      { IRPJ: 25, CSLL: 15, CBS: 17.15, CPP: 28.85, ISS: 9.8, IBS: 4.2 },
      { IRPJ: 23, CSLL: 15, CBS: 17.15, CPP: 27.85, ISS: 11.9, IBS: 5.1 },
      { IRPJ: 24, CSLL: 15, CBS: 18.15, CPP: 23.85, ISS: 13.3, IBS: 5.7 },
      { IRPJ: 21, CSLL: 15, CBS: 19.15, CPP: 23.85, ISS: 14.7, IBS: 6.3 },
      { IRPJ: 23, CSLL: 12.5, CBS: 17.15, CPP: 23.85, ISS: 16.45, IBS: 7.05 },
      { IRPJ: 35, CSLL: 15.5, CBS: 20, CPP: 29.5 },
    ],
    2032: [
      { IRPJ: 25, CSLL: 15, CBS: 17.15, CPP: 28.85, ISS: 8.4, IBS: 5.6 },
      { IRPJ: 23, CSLL: 15, CBS: 17.15, CPP: 27.85, ISS: 10.2, IBS: 6.8 },
      { IRPJ: 24, CSLL: 15, CBS: 18.15, CPP: 23.85, ISS: 11.4, IBS: 7.6 },
      { IRPJ: 21, CSLL: 15, CBS: 19.15, CPP: 23.85, ISS: 12.6, IBS: 8.4 },
      { IRPJ: 23, CSLL: 12.5, CBS: 17.15, CPP: 23.85, ISS: 14.1, IBS: 9.4 },
      { IRPJ: 35, CSLL: 15.5, CBS: 20, CPP: 29.5 },
    ],
    2033: [
      { IRPJ: 25, CSLL: 15, CBS: 17.15, CPP: 28.85, IBS: 14 },
      { IRPJ: 23, CSLL: 15, CBS: 17.15, CPP: 27.85, IBS: 17 },
      { IRPJ: 24, CSLL: 15, CBS: 18.15, CPP: 23.85, IBS: 19 },
      { IRPJ: 21, CSLL: 15, CBS: 19.15, CPP: 23.85, IBS: 21 },
      { IRPJ: 23, CSLL: 12.5, CBS: 17.15, CPP: 23.85, IBS: 23.5 },
      { IRPJ: 35, CSLL: 15.5, CBS: 20, CPP: 29.5 },
    ],
  },
}

/**
 * Teto do ISS na 5ª faixa (Anexos III e IV): quando a alíquota efetiva do DAS passa do limiar, o ISS
 * fica limitado a `issMax` (% da receita) e o excedente (alíquota efetiva − issMax) é repartido entre
 * os demais tributos na proporção `mult` (% do excedente). Valores em pontos percentuais.
 * Só 2027–2032: em 2033 o ISS é extinto e a lei não traz a nota.
 */
export interface LimiteIssSN {
  limiar: number
  issMax: number
  mult: Partial<Record<TributoPartilhaSN, number>>
}

export const LIMITE_ISS_5A_FAIXA: Partial<Record<AnexoSimples, Record<number, LimiteIssSN>>> = {
  III: {
    2027: { limiar: 14.92537, issMax: 5, mult: { IRPJ: 6.02, CSLL: 5.26, CBS: 23.2, CPP: 65.26, IBS: 0.26 } },
    2028: { limiar: 14.92537, issMax: 5, mult: { IRPJ: 6.02, CSLL: 5.26, CBS: 23.2, CPP: 65.26, IBS: 0.26 } },
    2029: { limiar: 14.92537, issMax: 4.5, mult: { IRPJ: 5.73, CSLL: 5.01, CBS: 22.33, CPP: 62.13, IBS: 4.8 } },
    2030: { limiar: 14.92537, issMax: 4, mult: { IRPJ: 5.46, CSLL: 4.78, CBS: 21.31, CPP: 59.29, IBS: 9.15 } },
    2031: { limiar: 14.92537, issMax: 3.5, mult: { IRPJ: 5.23, CSLL: 4.57, CBS: 20.38, CPP: 56.69, IBS: 13.13 } },
    2032: { limiar: 14.92537, issMax: 3, mult: { IRPJ: 5.01, CSLL: 4.38, CBS: 19.52, CPP: 54.32, IBS: 16.77 } },
  },
  IV: {
    2027: { limiar: 12.5, issMax: 5, mult: { IRPJ: 31.33, CSLL: 32, CBS: 36.27, IBS: 0.4 } },
    2028: { limiar: 12.5, issMax: 5, mult: { IRPJ: 31.33, CSLL: 32, CBS: 36.27, IBS: 0.4 } },
    2029: { limiar: 12.5, issMax: 4.5, mult: { IRPJ: 29.38, CSLL: 30, CBS: 34.38, IBS: 6.25 } },
    2030: { limiar: 12.5, issMax: 4, mult: { IRPJ: 27.65, CSLL: 28.24, CBS: 32.35, IBS: 11.76 } },
    2031: { limiar: 12.5, issMax: 3.5, mult: { IRPJ: 26.11, CSLL: 26.67, CBS: 30.56, IBS: 16.67 } },
    2032: { limiar: 12.5, issMax: 3, mult: { IRPJ: 24.74, CSLL: 25.26, CBS: 28.95, IBS: 21.05 } },
  },
}

/**
 * Teto do ISS no regime ATUAL (até 2026): LC 123/2006 art. 18 §1º-B, I, e notas da 5ª faixa dos Anexos III
 * e IV na redação da LC 155/2016 (vigência 1º/1/2018). Acima do limiar de alíquota efetiva, o ISS fica em
 * `issMax` (% da receita) e o excedente (alíquota efetiva − issMax) vai para os tributos federais;
 * `pisCofins` é a soma dos multiplicadores de COFINS e PIS/Pasep (III: 19,28 + 4,18; IV: 30,13 + 6,54).
 * Conferência: coincide com CBS + IBS dos multiplicadores de 2027–2028 da LC 214 (III: 23,20 + 0,26;
 * IV: 36,27 + 0,40). Não vem do texto da LC 214 (que só traz as notas a partir de 2027): é mantido aqui,
 * no gerador, e não deve ser editado à mão no arquivo gerado. Anexos I, II e V não têm essa nota.
 */
export const TETO_ISS_ATUAL: Partial<Record<AnexoSimples, { limiar: number; issMax: number; pisCofins: number }>> = {
  III: { limiar: 14.92537, issMax: 5, pisCofins: 23.46 },
  IV: { limiar: 12.5, issMax: 5, pisCofins: 36.67 },
}

/** Parcelas de tributos sobre consumo dentro do DAS (frações do DAS, 0–1) num ano */
export interface PartilhaConsumoSN {
  pisCofins: number  // até 2026 (LC 123)
  cbs: number        // a partir de 2027
  icmsIss: number    // até 2032 (decrescente a partir de 2029)
  ibs: number        // a partir de 2027 (teste em 2027–2028; cresce até 2033)
}

/**
 * Partilha de tributos sobre consumo do DAS para anexo/faixa/ano.
 * Antes de 2027 vale a LC 123/2006 — cujos PIS/COFINS e ICMS/ISS coincidem, linha a linha,
 * com a CBS e o IBS da tabela de 2033 da LC 214.
 */
export function partilhaConsumoSimples(
  anexo: AnexoSimples, faixaIdx: number, ano: number,
  /** alíquota efetiva do DAS (fração) — necessária para o teto do ISS na 5ª faixa */
  aliquotaEfetiva?: number,
): PartilhaConsumoSN {
  const tabela = PARTILHA_SIMPLES_LC214[anexo]
  const f = Math.min(5, Math.max(0, faixaIdx))
  if (ano < 2027) {
    // Regime atual: teto do ISS na 5ª faixa dos Anexos III e IV (LC 123 art. 18 §1º-B, I)
    const teto = f === 4 && aliquotaEfetiva ? TETO_ISS_ATUAL[anexo] : undefined
    if (teto && aliquotaEfetiva! * 100 > teto.limiar) {
      const excesso = aliquotaEfetiva! - teto.issMax / 100
      return {
        pisCofins: (excesso * teto.pisCofins) / 100 / aliquotaEfetiva!,
        cbs: 0,
        icmsIss: teto.issMax / 100 / aliquotaEfetiva!,
        ibs: 0,
      }
    }
    const pleno = tabela[2033][f]
    return { pisCofins: (pleno.CBS ?? 0) / 100, cbs: 0, icmsIss: (pleno.IBS ?? 0) / 100, ibs: 0 }
  }
  const lim = f === 4 && aliquotaEfetiva ? LIMITE_ISS_5A_FAIXA[anexo]?.[ano] : undefined
  if (lim && aliquotaEfetiva! * 100 > lim.limiar) {
    const excesso = aliquotaEfetiva! - lim.issMax / 100
    return {
      pisCofins: 0,
      cbs: (excesso * (lim.mult.CBS ?? 0)) / 100 / aliquotaEfetiva!,
      icmsIss: lim.issMax / 100 / aliquotaEfetiva!,
      ibs: (excesso * (lim.mult.IBS ?? 0)) / 100 / aliquotaEfetiva!,
    }
  }
  const linha = tabela[Math.min(2033, ano)][f]
  return {
    pisCofins: 0,
    cbs: (linha.CBS ?? 0) / 100,
    icmsIss: ((linha.ICMS ?? 0) + (linha.ISS ?? 0)) / 100,
    ibs: (linha.IBS ?? 0) / 100,
  }
}
