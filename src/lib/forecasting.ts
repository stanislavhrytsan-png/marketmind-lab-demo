/**
 * The Bass curve of the demo: plain arithmetic in the browser, with the
 * engine's formula.
 *
 *   share of the market potential that has bought by time t:
 *     F(t) = (1 - e^-(p+q)t) / (1 + (q/p) e^-(p+q)t)
 *   sales of period t = m x (F(t) - F(t-1))
 *
 * p is the innovation coefficient, q the imitation coefficient, m the market
 * potential. Nothing is estimated here: the estimate comes from the engine
 * (run FC-01). The what-if view only draws the curve for other values.
 * `engineDisagreements` compares this file with the engine's own curves, and
 * `npm run check` fails if they differ.
 */
import { bassScreen } from '../data/forecasting'
import type { BassParameters } from '../data/forecasting'
import { engineModules } from '../data/moduleKit'
import { Problems, reportInConsole } from './check'

/** Share of the market potential that has bought by time t. */
export function bassShare(t: number, p: number, q: number): number {
  const decay = Math.exp(-(p + q) * t)
  return (1 - decay) / (1 + (q / p) * decay)
}

/** Sales in each of the periods 1 to n. */
export function bassCurve({ p, q, m }: BassParameters, n: number): number[] {
  return Array.from({ length: n }, (_, k) => m * (bassShare(k + 1, p, q) - bassShare(k, p, q)))
}

/** When sales are highest: the exact moment, the period it falls into, and the sales of that period. */
export function bassPeak({ p, q, m }: BassParameters): { time: number; period: number; sales: number } {
  const time = q > p ? Math.log(q / p) / (p + q) : 0
  const curve = bassCurve({ p, q, m }, Math.max(Math.ceil(time) + 2, 2))
  const best = curve.indexOf(Math.max(...curve))
  return { time, period: best + 1, sales: curve[best] }
}

/** Running total of a curve. */
export const runningTotal = (values: number[]) => {
  let sum = 0
  return values.map((value) => (sum += value))
}

// ---------------------------------------------------------------------------
// Check against the engine
// ---------------------------------------------------------------------------

/** Every place where the Bass curve in the browser and the engine disagree. Empty when all is well. */
export function engineDisagreements(): string[] {
  const problems = new Problems('Forecasting')
  const results = engineModules.forecasting
  const run = results.runs['FC-01']
  const curve = (what: string, parameters: BassParameters, engine: number[]) => {
    const here = bassCurve(parameters, engine.length)
    const largest = Math.max(...engine)
    engine.forEach((value, k) => problems.value(`${what}, period ${k + 1}`, here[k], value, largest))
  }

  // 1. The fitted curve and the forecast of run FC-01.
  curve('Bass curve of FC-01', run.parameters, run.periods.fitted)
  const totals = runningTotal(bassCurve(run.parameters, run.periods.fitted.length))
  run.periods.cumulative_fitted.forEach((value, k) => problems.value(`total of FC-01, period ${k + 1}`, totals[k], value))
  const peak = bassPeak(run.parameters)
  problems.same('peak period of FC-01', peak.period, run.peak.period)
  problems.value('peak sales of FC-01', peak.sales, run.peak.sales)

  // 2. The engine's what-if view: p, q and m changed one at a time.
  for (const scenario of run.sensitivity) {
    curve(`what-if "${scenario.scenario}"`, scenario, scenario.sales)
    const scenarioPeak = bassPeak(scenario)
    problems.same(`peak period, "${scenario.scenario}"`, scenarioPeak.period, scenario.peak_period)
    problems.value(`peak sales, "${scenario.scenario}"`, scenarioPeak.sales, scenario.peak_sales)
    const end = bassCurve(scenario, scenario.sales.length).reduce((sum, value) => sum + value, 0)
    problems.value(`total at the end, "${scenario.scenario}"`, end, scenario.cumulative_at_end)
  }

  // 3. The estimates from the first quarters only.
  for (const window of results.by_periods.windows) {
    curve(`curve from ${window.periods_used} quarters`, window.parameters, window.fitted)
  }

  // 4. The analogies: p and q of a similar product, per quarter.
  for (const example of results.analogies.examples) {
    curve(`analogy "${example.name}"`, example.per_period, example.sales)
    problems.same(`peak period, analogy "${example.name}"`, bassPeak(example.per_period).period, example.peak.period)
  }

  // 5. The presets of the what-if view are the engine's values.
  const [estimate] = bassScreen.whatIf.presets
  problems.value('preset p', estimate.p, run.parameters.p)
  problems.value('preset q', estimate.q, run.parameters.q)
  return problems.list
}

reportInConsole(engineDisagreements())
