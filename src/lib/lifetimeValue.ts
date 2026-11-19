/**
 * Customer lifetime value in the browser: the engine's formula for a
 * constant margin and a constant retention rate.
 *
 *   r = retention rate, d = discount rate, both per period
 *   at the start of each period              value = margin x (1 + d) / (1 + d - r)
 *   at the end of each period                value = margin / (1 + d - r)
 *   at the end, from customers who stayed    value = margin x r / (1 + d - r)
 *
 * The retention rates and margins of the segments are the engine's (run
 * LV-01, estimated from the cohort data). The what-if view only applies the
 * formula to other numbers. `engineDisagreements` compares this file with
 * the engine's own results.
 */
import { engineModules } from '../data/moduleKit'
import { Problems, reportInConsole } from './check'

/** When the margin of a period is earned (the engine's setting "first_margin"). */
export type Convention = 'start' | 'end' | 'end_if_retained'

const firstTerm = (retention: number, discount: number, convention: Convention) =>
  convention === 'start' ? 1 : convention === 'end' ? 1 / (1 + discount) : retention / (1 + discount)

/** Lifetime value per unit of margin. Without an end when no customer leaves and money keeps its worth. */
export function marginMultiple(retention: number, discount: number, convention: Convention): number {
  const ratio = retention / (1 + discount)
  return ratio >= 1 ? Infinity : firstTerm(retention, discount, convention) / (1 - ratio)
}

export const lifetimeValue = (margin: number, retention: number, discount: number, convention: Convention) =>
  margin * marginMultiple(retention, discount, convention)

/** Periods a customer stays on average, counting the first one. */
export const expectedLifetime = (retention: number) => (retention < 1 ? 1 / (1 - retention) : Infinity)

export interface PeriodValue {
  period: number
  /** The chance that the customer pays the margin of this period. */
  chance: number
  /** What the period adds to the value, in today's money. */
  presentValue: number
  cumulative: number
}

/** What each of the first periods adds to the lifetime value, and the running total. */
export function periodValues(margin: number, retention: number, discount: number, convention: Convention, count: number): PeriodValue[] {
  let cumulative = 0
  return Array.from({ length: count }, (_, k) => {
    const when = convention === 'start' ? k : k + 1
    const chance = retention ** (convention === 'end_if_retained' ? k + 1 : k)
    const presentValue = (margin * chance) / (1 + discount) ** when
    cumulative += presentValue
    return { period: k + 1, chance, presentValue, cumulative }
  })
}

/**
 * After how many periods the margins, in today's money, have covered the
 * acquisition cost. Nothing if they never do.
 */
export function paybackPeriods(margin: number, retention: number, discount: number, convention: Convention, cost: number): number | null {
  if (cost <= 0) return 0
  if (margin <= 0) return null
  const ratio = retention / (1 + discount)
  const first = margin * firstTerm(retention, discount, convention)
  let covered = 0
  let term = first
  for (let period = 1; period <= 5000; period++) {
    covered += term
    if (covered >= cost * (1 - 1e-12)) return period
    term *= ratio
    if (term < 1e-12 * cost) return null
  }
  return null
}

// ---------------------------------------------------------------------------
// Check against the engine
// ---------------------------------------------------------------------------

/** Every place where the lifetime value formula in the browser and the engine disagree. Empty when all is well. */
export function engineDisagreements(): string[] {
  const problems = new Problems('Customer lifetime value')
  const { formula } = engineModules.lifetime_value
  const cases = [
    ...formula.segments.flatMap((segment) => segment.by_convention.map((item) => ({ what: `${segment.segment}, ${item.first_margin}`, item }))),
    ...formula.other_customers.map((item) => ({ what: `margin ${item.margin}, retention ${item.retention_rate}, discount ${item.discount_rate}, ${item.first_margin}`, item })),
  ]
  for (const { what, item } of cases) {
    const convention = item.first_margin as Convention
    const { margin, retention_rate: retention, discount_rate: discount, acquisition_cost: cost } = item
    problems.value(`${what}: lifetime value`, lifetimeValue(margin, retention, discount, convention), item.lifetime_value)
    problems.value(`${what}: margin multiple`, marginMultiple(retention, discount, convention), item.margin_multiple)
    problems.value(`${what}: expected lifetime`, expectedLifetime(retention), item.expected_lifetime)
    problems.same(`${what}: periods until payback`, paybackPeriods(margin, retention, discount, convention, cost), item.payback_periods)
    problems.same(`${what}: worth acquiring`, lifetimeValue(margin, retention, discount, convention) > cost, item.worth_acquiring)
    const periods = periodValues(margin, retention, discount, convention, item.periods.period.length)
    periods.forEach((row, k) => {
      problems.value(`${what}: value of period ${row.period}`, row.presentValue, item.periods.present_value[k], item.lifetime_value)
      problems.value(`${what}: running total after period ${row.period}`, row.cumulative, item.periods.cumulative_present_value[k])
      problems.share(`${what}: chance that the customer pays in period ${row.period}`, row.chance, item.periods.chance_customer_pays[k])
    })
  }
  return problems.list
}

reportInConsole(engineDisagreements())
