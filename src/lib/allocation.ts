/**
 * Response curves and the value of a budget split in the browser.
 *
 * The engine draws one response curve per region through the four judgments
 * of its manager (run RA-01). With s = spending as a multiple of today's
 * spending, the curve is
 *
 *   sales = sales today x (low + (high - low) x s^c / (d + s^c))
 *   profit = margin x sales - spending
 *
 * The four numbers low, high, c and d are the engine's. The search for the
 * best split is the engine's too. The browser only values a split the
 * student chooses, with the same curves. `engineDisagreements` compares
 * that arithmetic with the engine's own numbers.
 */
import { engineModules } from '../data/moduleKit'
import { Problems, reportInConsole } from './check'

export interface ResponseCurve {
  current_spending: number
  sales_at_current: number
  margin: number
  parameters: { low: number; high: number; c: number; d: number }
}

/** How far sales have come from their lowest to their highest level at a spending (0 to 1). */
function shareOfTheWay(curve: ResponseCurve, spending: number): { share: number; index: number } {
  const index = Math.max(0, spending / curve.current_spending)
  const { c, d } = curve.parameters
  const share = index === 0 ? 0 : 1 / (1 + Math.exp(-(c * Math.log(index) - Math.log(d))))
  return { share, index }
}

export function salesAt(curve: ResponseCurve, spending: number): number {
  const { low, high } = curve.parameters
  return curve.sales_at_current * (low + (high - low) * shareOfTheWay(curve, spending).share)
}

export const profitAt = (curve: ResponseCurve, spending: number) => curve.margin * salesAt(curve, spending) - spending

/** What one more unit of spending would earn in margin. Above 1, more spending still pays. Nothing where the curve starts infinitely steep. */
export function marginOfOneMore(curve: ResponseCurve, spending: number): number | null {
  const { low, high, c, d } = curve.parameters
  const { share, index } = shareOfTheWay(curve, spending)
  const perIndex = index > 0 ? ((high - low) * c * share * (1 - share)) / index : c > 1 ? 0 : c === 1 ? (high - low) / d : Infinity
  const value = (curve.margin * curve.sales_at_current * perIndex) / curve.current_spending
  return Number.isFinite(value) ? value : null
}

export interface SplitValue {
  units: { spending: number; sales: number; profit: number; oneMore: number | null }[]
  spending: number
  sales: number
  profit: number
}

/** Sales and profit of a split: one spending per region, in the order of the curves. */
export function valueOfSplit(curves: ResponseCurve[], spending: number[]): SplitValue {
  const units = curves.map((curve, k) => ({
    spending: spending[k],
    sales: salesAt(curve, spending[k]),
    profit: profitAt(curve, spending[k]),
    oneMore: marginOfOneMore(curve, spending[k]),
  }))
  const sum = (pick: (unit: (typeof units)[number]) => number) => units.reduce((total, unit) => total + pick(unit), 0)
  return { units, spending: sum((unit) => unit.spending), sales: sum((unit) => unit.sales), profit: sum((unit) => unit.profit) }
}

// ---------------------------------------------------------------------------
// Check against the engine
// ---------------------------------------------------------------------------

/** Every place where the allocation arithmetic in the browser and the engine disagree. Empty when all is well. */
export function engineDisagreements(): string[] {
  const problems = new Problems('Resource allocation')
  const results = engineModules.allocation
  const curves = results.curves as unknown as (ResponseCurve & { name: string; curve: { spending: number[]; sales: number[]; profit: number[] } })[]

  // 1. Every response curve, at the 41 spendings the engine wrote down.
  for (const curve of curves) {
    curve.curve.spending.forEach((spending, k) => {
      problems.value(`${curve.name}: sales at a spending of ${spending}`, salesAt(curve, spending), curve.curve.sales[k])
      problems.value(`${curve.name}: profit at a spending of ${spending}`, profitAt(curve, spending), curve.curve.profit[k], curve.curve.profit[0])
    })
  }

  // 2. Whole splits: today's, the best one, a few others, and the two runs.
  const splits = [...results.own_splits, results.runs['RA-01'], results.runs['RA-02']]
  splits.forEach((split, number) => {
    const here = valueOfSplit(curves, split.units.map((unit) => unit.spending))
    const what = `split ${number + 1} (${split.units.map((unit) => Math.round(unit.spending)).join(', ')})`
    split.units.forEach((unit, k) => {
      problems.value(`${what}: sales of ${unit.name}`, here.units[k].sales, unit.sales)
      problems.value(`${what}: profit of ${unit.name}`, here.units[k].profit, unit.profit)
      if (unit.margin_of_one_more_unit_of_spending !== null) {
        problems.value(`${what}: margin of one more franc in ${unit.name}`, here.units[k].oneMore ?? NaN, unit.margin_of_one_more_unit_of_spending, 1)
      }
    })
    problems.value(`${what}: total spending`, here.spending, split.totals.spending)
    problems.value(`${what}: total sales`, here.sales, split.totals.sales)
    problems.value(`${what}: total profit`, here.profit, split.totals.profit)
  })
  return problems.list
}

reportInConsole(engineDisagreements())
