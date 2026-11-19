/**
 * Demand curves and the best price in the browser: plain arithmetic with the
 * parameters the engine fitted (runs PR-01 to PR-04).
 *
 *   straight line         quantity = intercept + slope x price (never below zero)
 *   constant elasticity   quantity = scale x price ^ elasticity
 *   logit                 quantity = market size / (1 + e^-(intercept - coefficient x price))
 *   profit                (price - unit cost) x quantity
 *
 * Nothing is fitted here. The what-if view only moves along the engine's
 * curve: another unit cost, another price. `engineDisagreements` compares
 * this file with the engine's own numbers, and `npm run check` fails if they
 * differ.
 */
import { engineModules } from '../data/moduleKit'
import { Problems, reportInConsole } from './check'
import { sharesAgainstCompetitors } from './conjoint'
import { savedDesign } from '../data/alpineOat'

export type DemandForm = 'linear' | 'constant_elasticity' | 'logit'
export type DemandParameters = Record<string, number>

/** Units sold at a price. Never below zero. */
export function quantityAt(form: DemandForm, parameters: DemandParameters, price: number): number {
  if (form === 'linear') return Math.max(0, parameters.intercept + parameters.slope * price)
  if (form === 'constant_elasticity') return parameters.scale * price ** parameters.elasticity
  return parameters.market_size / (1 + Math.exp(-(parameters.intercept - parameters.price_coefficient * price)))
}

export const profitAt = (form: DemandForm, parameters: DemandParameters, price: number, unitCost: number) =>
  (price - unitCost) * quantityAt(form, parameters, price)

/** Price elasticity at a price: the change of the quantity in percent when the price rises by 1%. */
export function elasticityAt(form: DemandForm, parameters: DemandParameters, price: number): number {
  const quantity = quantityAt(form, parameters, price)
  if (form === 'linear') return (parameters.slope * price) / quantity
  if (form === 'constant_elasticity') return parameters.elasticity
  return -parameters.price_coefficient * price * (1 - quantity / parameters.market_size)
}

/**
 * The price with the highest profit, or nothing if the curve has none (profit
 * then rises with ever higher prices).
 */
export function bestPrice(form: DemandForm, parameters: DemandParameters, unitCost: number): number | null {
  if (form === 'linear') {
    if (parameters.slope >= 0) return null
    // Profit is highest halfway between the unit cost and the price where demand ends.
    const endOfDemand = -parameters.intercept / parameters.slope
    return endOfDemand > 0 ? (endOfDemand + unitCost) / 2 : null
  }
  if (form === 'constant_elasticity') {
    const { elasticity } = parameters
    if (elasticity >= -1 || unitCost <= 0) return null
    return (unitCost * elasticity) / (elasticity + 1)
  }
  // Logit: the best price solves (price - cost) x b x (1 - share) = 1. The left side rises with the price.
  const { price_coefficient: b, intercept: a, market_size: size } = parameters
  if (b < 1e-12 || size <= 0) return null
  const condition = (price: number) => (price - unitCost) * b * (1 - 1 / (1 + Math.exp(-(a - b * price)))) - 1
  let low = unitCost
  let high = Math.max(unitCost, a / b) + 50 / b
  for (let step = 0; step < 200; step++) {
    const middle = (low + high) / 2
    if (condition(middle) > 0) high = middle
    else low = middle
  }
  return (low + high) / 2
}

/** A curve made of straight lines between tested prices (the demand curve from the conjoint study). */
export function quantityOnLines(points: { price: number; quantity: number }[], price: number): number {
  let k = 0
  while (k < points.length - 2 && price >= points[k + 1].price) k++
  const slope = (points[k + 1].quantity - points[k].quantity) / (points[k + 1].price - points[k].price)
  return Math.max(0, points[k].quantity + slope * (price - points[k].price))
}

// ---------------------------------------------------------------------------
// Check against the engine
// ---------------------------------------------------------------------------

/** Every place where the pricing arithmetic in the browser and the engine disagree. Empty when all is well. */
export function engineDisagreements(): string[] {
  const problems = new Problems('Price optimization')
  const { runs } = engineModules.pricing

  for (const id of ['PR-01', 'PR-02', 'PR-03'] as const) {
    const run = runs[id]
    for (const item of run.forms) {
      const form = item.form as DemandForm
      const parameters = item.parameters as unknown as DemandParameters
      const what = `${id}, ${item.label}`
      // 1. The curve: quantity, revenue and profit at every price the engine wrote down.
      const largest = Math.max(...item.curve.profit.map(Math.abs))
      item.curve.price.forEach((price, k) => {
        problems.value(`${what}, quantity at ${price}`, quantityAt(form, parameters, price), item.curve.quantity[k])
        problems.value(`${what}, profit at ${price}`, profitAt(form, parameters, price, run.unit_cost), item.curve.profit[k], largest)
      })
      // 2. The best price at the unit cost of the case, and at two other unit costs.
      const best = bestPrice(form, parameters, run.unit_cost)
      problems.value(`${what}, best price`, best ?? NaN, item.optimum.optimal_price)
      problems.value(`${what}, profit at the best price`, profitAt(form, parameters, best ?? NaN, run.unit_cost), item.optimum.profit)
      problems.value(`${what}, elasticity at the best price`, elasticityAt(form, parameters, best ?? NaN), item.optimum.elasticity)
      problems.value(`${what}, elasticity at the mean price`, elasticityAt(form, parameters, run.price_range.mean), item.elasticity_at_mean_price)
      for (const other of item.at_other_unit_costs) {
        const price = bestPrice(form, parameters, other.unit_cost)
        problems.value(`${what}, best price at a unit cost of ${other.unit_cost}`, price ?? NaN, other.optimal_price)
        problems.value(`${what}, profit at a unit cost of ${other.unit_cost}`, profitAt(form, parameters, price ?? NaN, other.unit_cost), other.profit)
      }
    }
  }

  // 3. The curve from the conjoint study: its points are the shares of the market simulator, and its profit follows from them.
  const conjoint = runs['PR-04']
  const priceLevels = engineModules.pricing.runs['PR-04'].points
  priceLevels.forEach((point, level) => {
    const share = sharesAgainstCompetitors({ ...savedDesign, price: level })[0].all
    problems.share(`PR-04, share at ${point.level}`, share, point.share)
    problems.value(`PR-04, quantity at ${point.level}`, share * conjoint.market_size, point.quantity)
  })
  const largest = Math.max(...conjoint.curve.profit.map(Math.abs))
  conjoint.curve.price.forEach((price, k) => {
    const quantity = quantityOnLines(conjoint.points, price)
    problems.value(`PR-04, quantity at ${price}`, quantity, conjoint.curve.quantity[k])
    problems.value(`PR-04, profit at ${price}`, (price - conjoint.unit_cost) * quantity, conjoint.curve.profit[k], largest)
  })
  return problems.list
}

reportInConsole(engineDisagreements())
