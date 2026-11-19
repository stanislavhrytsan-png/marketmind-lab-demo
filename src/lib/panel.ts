/**
 * Panel regression in the browser: what a fitted model says about a change,
 * and how the effect of advertising fades.
 *
 * The three models are estimated by the engine (runs PN-01 and PN-02). The
 * browser never estimates anything. With the log-log form, reading a model
 * is a short sum:
 *
 *   change of log sales = sum over the predictors of
 *       coefficient x ln(1 + change)     for a predictor in logarithms (price, advertising)
 *       coefficient                      for a yes/no predictor that is switched on (promotion)
 *   sales change   = exp(sum) - 1
 *   revenue change = (1 + price change) x (1 + sales change) - 1
 *
 * The carry-over of advertising: with a rate r, the effect of one period is
 * first, first x r, first x r^2 and so on. All periods together give
 * first / (1 - r), the effect in the long run.
 *
 * `engineDisagreements` compares this arithmetic with the engine's numbers.
 */
import { engineModules } from '../data/moduleKit'
import { Problems, reportInConsole } from './check'

export interface Coefficient {
  variable: string
  /** In logarithms: the coefficient is an elasticity. */
  logged: boolean
  yes_no: boolean
  coefficient: number
}

/** What a model says about sales and revenue when predictors change. `changes` holds a share per predictor in logarithms, and 1 or 0 for a yes/no predictor. */
export function changeBy(coefficients: Coefficient[], changes: Record<string, number>, pricePredictor: string): { sales: number; revenue: number } {
  const sum = coefficients.reduce((total, row) => {
    const change = changes[row.variable] ?? 0
    return total + row.coefficient * (row.logged ? Math.log(1 + change) : change)
  }, 0)
  const sales = Math.exp(sum) - 1
  return { sales, revenue: (1 + (changes[pricePredictor] ?? 0)) * (1 + sales) - 1 }
}

/** The effect of switching a yes/no predictor on, as a share of sales: exp(coefficient) - 1. Also turns the level of a store into "sells so much more than the average store". */
export const shareFromLog = (logDifference: number) => Math.exp(logDifference) - 1

/** The effect of one period of advertising in that period and the following ones. */
export const fading = (first: number, rate: number, periods: number) => Array.from({ length: periods }, (_, k) => first * rate ** k)

/** All periods together. */
export const longRun = (first: number, rate: number) => first / (1 - rate)

/** After how many periods half of the effect has arrived. */
export const halfLife = (rate: number) => Math.log(0.5) / Math.log(rate)

// ---------------------------------------------------------------------------
// Check against the engine
// ---------------------------------------------------------------------------

type ModelKind = 'pooled' | 'fixed_effects' | 'random_effects'

interface EngineResults {
  data: { price_predictor: string }
  runs: {
    'PN-01': { models: Record<ModelKind, { coefficients: (Coefficient & { effect_of_yes: number | null })[] }> }
    'PN-02': {
      coefficients: (Coefficient & { effect_of_yes: number | null })[]
      carryover: { rate: number; effect_in_the_first_period: number; effect_in_the_long_run: number; half_life_periods: number; fading: number[] }
      unit_effects: { unit: string; difference_from_average: number; sales_against_average: number }[]
    }
  }
  changes: { changes: Record<string, number>; by_model: Record<ModelKind, { sales_change: number; revenue_change: number }> }[]
}

/** Every place where the panel arithmetic in the browser and the engine disagree. Empty when all is well. */
export function engineDisagreements(): string[] {
  const problems = new Problems('Panel regression')
  const results = engineModules.panel as unknown as EngineResults
  const { models } = results.runs['PN-01']
  const final = results.runs['PN-02']

  // 1. What each of the three models says about a few changes.
  results.changes.forEach((item, number) => {
    for (const kind of Object.keys(models) as ModelKind[]) {
      const here = changeBy(models[kind].coefficients, item.changes, results.data.price_predictor)
      const what = `change ${number + 1} (${Object.entries(item.changes).map(([name, value]) => `${name} ${value}`).join(', ')}), ${kind}`
      problems.share(`${what}: sales`, here.sales, item.by_model[kind].sales_change)
      problems.share(`${what}: revenue`, here.revenue, item.by_model[kind].revenue_change)
    }
  })

  // 2. A yes/no predictor as a share of sales, for every model and for the final run.
  for (const [name, coefficients] of [...Object.entries(models).map(([kind, model]) => [kind, model.coefficients] as const), ['PN-02', final.coefficients] as const]) {
    for (const row of coefficients) {
      if (row.effect_of_yes !== null) problems.share(`${name}: effect of ${row.variable}`, shareFromLog(row.coefficient), row.effect_of_yes)
    }
  }

  // 3. The carry-over of advertising: the fading, the long run and the half-life.
  const carry = final.carryover
  fading(carry.effect_in_the_first_period, carry.rate, carry.fading.length).forEach((effect, k) => {
    problems.value(`advertising effect ${k} periods later`, effect, carry.fading[k], carry.effect_in_the_first_period)
  })
  problems.value('advertising effect in the long run', longRun(carry.effect_in_the_first_period, carry.rate), carry.effect_in_the_long_run)
  problems.value('half-life of the advertising effect', halfLife(carry.rate), carry.half_life_periods)

  // 4. The level of every store as "sells so much more than the average store".
  for (const store of final.unit_effects) {
    problems.share(`level of ${store.unit}`, shareFromLog(store.difference_from_average), store.sales_against_average)
  }
  return problems.list
}

reportInConsole(engineDisagreements())
