/**
 * The arithmetic of a campaign in the browser. The model that scores the
 * customers is the engine's (runs TG-01 and TG-02): it was fitted and tested
 * by the engine, and the browser changes nothing about it.
 *
 * The engine sorted the test customers by their score and cut them into ten
 * groups. Contacting the best k groups earns
 *
 *   responders in these groups x margin per response
 *   - customers in these groups x cost per contact
 *
 * scaled from the test customers to the size of the list. The what-if view
 * repeats this for other costs, margins and list sizes. `engineDisagreements`
 * compares it with the engine's own numbers.
 */
import { engineModules } from '../data/moduleKit'
import { Problems, reportInConsole } from './check'

export interface Depth {
  /** How many of the groups are contacted, best group first. */
  groups: number
  share: number
  contacted: number
  responders: number
  profit: number
}

/** Profit of contacting no group, the best group, the best two groups and so on. */
export function campaignDepths(
  groups: { cumulative_n: number[]; cumulative_responders: number[] },
  nScored: number,
  cost: number,
  margin: number,
  listSize: number,
): Depth[] {
  const factor = listSize / nScored
  const depths: Depth[] = [{ groups: 0, share: 0, contacted: 0, responders: 0, profit: 0 }]
  groups.cumulative_n.forEach((n, k) => {
    const contacted = n * factor
    const responders = groups.cumulative_responders[k] * factor
    depths.push({ groups: k + 1, share: n / nScored, contacted, responders, profit: responders * margin - contacted * cost })
  })
  return depths
}

/** The depth with the highest profit. With equal profit, the one with fewer contacts. */
export const bestDepth = (depths: Depth[]) => depths.reduce((best, depth) => (depth.profit > best.profit ? depth : best), depths[0])

/** The response rate at which a contact pays for itself. */
export const breakEven = (cost: number, margin: number) => (margin > 0 ? cost / margin : null)

// ---------------------------------------------------------------------------
// Check against the engine
// ---------------------------------------------------------------------------

/** Every place where the campaign arithmetic in the browser and the engine disagree. Empty when all is well. */
export function engineDisagreements(): string[] {
  const problems = new Problems('Predictive modeling')
  for (const id of ['TG-01', 'TG-02'] as const) {
    const run = engineModules.targeting.runs[id]
    for (const campaign of [run.campaign, ...run.other_campaigns]) {
      const what = `${id}, cost ${campaign.cost_per_contact}, margin ${campaign.margin_per_response}, list of ${campaign.scaled_to}`
      const depths = campaignDepths(run.lift.groups, campaign.n_scored, campaign.cost_per_contact, campaign.margin_per_response, campaign.scaled_to)
      const largest = Math.max(...campaign.depths.profit.map(Math.abs))
      depths.forEach((depth, k) => {
        problems.value(`${what}: customers contacted with ${k} groups`, depth.contacted, campaign.depths.customers_contacted[k])
        problems.value(`${what}: responders with ${k} groups`, depth.responders, campaign.depths.responders[k])
        problems.value(`${what}: profit with ${k} groups`, depth.profit, campaign.depths.profit[k], largest)
      })
      const best = bestDepth(depths)
      problems.same(`${what}: best depth`, best.groups, campaign.best_depth.groups_contacted)
      problems.value(`${what}: profit at the best depth`, best.profit, campaign.best_depth.profit, largest)
      problems.share(`${what}: break-even response rate`, breakEven(campaign.cost_per_contact, campaign.margin_per_response) ?? NaN, campaign.break_even_response_rate)
    }
  }
  return problems.list
}

reportInConsole(engineDisagreements())
