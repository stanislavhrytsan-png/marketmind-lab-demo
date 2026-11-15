/**
 * The only "model" in the demo: plain front-end arithmetic on the hard-coded
 * part-worths from the data file.
 *
 *   utility of a product   = sum of the part-worths of its levels
 *   share inside a segment = e^utility / sum of e^utility over all products (logit rule)
 *   share, all respondents = the segment shares, weighted by segment size
 *
 * Nothing here is estimated. The real product would estimate the part-worths
 * from the respondents' choices.
 */
import {
  attributes,
  competitors,
  partWorths,
  priceValues,
  quotedNumbers,
  restriction,
  savedDesign,
  segments,
} from '../data/alpineOat'
import type { AttrId, Design, GroupId, SegmentId } from '../data/alpineOat'

export const attrIds = attributes.map((a) => a.id)

/** Total utility of a product for one group: the sum of its levels' part-worths. */
export function utility(design: Design, group: GroupId): number {
  return attrIds.reduce((sum, id) => sum + partWorths[group][id][design[id]], 0)
}

/** Logit rule inside one segment: share = e^utility / sum of e^utility. */
export function segmentShares(products: Design[], segment: SegmentId): number[] {
  const weights = products.map((p) => Math.exp(utility(p, segment)))
  const total = weights.reduce((a, b) => a + b, 0)
  return weights.map((w) => w / total)
}

export type Shares = Record<GroupId, number>

/**
 * Predicted shares of every product in a market, as fractions between 0 and 1.
 * "all" is the size-weighted average of the three segment shares.
 */
export function marketShares(products: Design[]): Shares[] {
  const bySegment = segments.map((s) => segmentShares(products, s.id))
  return products.map((_, i) => {
    const row: Shares = { all: 0, health: 0, taste: 0, price: 0 }
    segments.forEach((s, k) => {
      row[s.id] = bySegment[k][i]
      row.all += (s.share / 100) * bySegment[k][i]
    })
    return row
  })
}

/** A design against the three competitor products. Index 0 is the design. */
export function sharesAgainstCompetitors(design: Design): Shares[] {
  return marketShares([design, ...competitors.map((c) => c.design)])
}

/** Attribute importance: the range of an attribute's part-worths, as a share of all ranges. */
export function importance(group: GroupId): Record<AttrId, number> {
  const ranges = attrIds.map((id) => {
    const values = partWorths[group][id]
    return Math.max(...values) - Math.min(...values)
  })
  const total = ranges.reduce((a, b) => a + b, 0)
  return Object.fromEntries(attrIds.map((id, i) => [id, ranges[i] / total])) as Record<AttrId, number>
}

/** Index of the level with the highest part-worth. */
export function preferredLevel(group: GroupId, attr: AttrId): number {
  const values = partWorths[group][attr]
  return values.indexOf(Math.max(...values))
}

/** The attribute that explains most of the choice in a group. */
export function topAttribute(group: GroupId): { id: AttrId; name: string; value: number } {
  const imp = importance(group)
  const id = attrIds.reduce((best, a) => (imp[a] > imp[best] ? a : best), attrIds[0])
  return { id, name: attributes.find((a) => a.id === id)!.name, value: imp[id] }
}

/** False for a combination the restriction excludes (Chocolate with No added sugar). */
export function isAllowed(design: Design): boolean {
  return !(
    design[restriction.a.attr] === restriction.a.level && design[restriction.b.attr] === restriction.b.level
  )
}

/** Would choosing this level break the restriction, given the rest of the design? */
export function levelBlocked(design: Design, attr: AttrId, level: number): boolean {
  return !isAllowed({ ...design, [attr]: level })
}

/** Every possible product: 3 x 3 x 2 x 2 x 3 = 108. */
export function allDesigns(): Design[] {
  let list: Partial<Design>[] = [{}]
  for (const attr of attributes) {
    list = list.flatMap((d) => attr.levels.map((_, level) => ({ ...d, [attr.id]: level })))
  }
  return list as Design[]
}

export const productCount = allDesigns().length
export const allowedCount = allDesigns().filter(isAllowed).length

export interface Candidate {
  design: Design
  /** Predicted share among all respondents, against the three competitors. */
  share: number
  /** share x price: CHF earned per 100 choices in this market. */
  revenue: number
}

/** Best-product search: every allowed product is tested against the three competitors. */
export function bestProducts(by: 'share' | 'revenue', count = 3): Candidate[] {
  return allDesigns()
    .filter(isAllowed)
    .map((design) => {
      const share = sharesAgainstCompetitors(design)[0].all
      return { design, share, revenue: share * 100 * priceValues[design.price] }
    })
    .sort((a, b) => b[by] - a[by])
    .slice(0, count)
}

/** "Vanilla, No added sugar, High, 1 L, CHF 2.50" */
export function describe(design: Design): string {
  return attributes.map((a) => a.levels[design[a.id]]).join(', ')
}

export function sameDesign(a: Design, b: Design): boolean {
  return attrIds.every((id) => a[id] === b[id])
}

/** 0.433 -> "43%" */
export const pct = (fraction: number) => `${Math.round(fraction * 100)}%`
/** 0.433 -> "43.3%" */
export const pct1 = (fraction: number) => `${(fraction * 100).toFixed(1)}%`
/** 0.26 -> "+0.26", -0.2 -> "−0.20" (with a real minus sign) */
export const signed = (value: number, digits = 2) =>
  `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(digits)}`

// ---------------------------------------------------------------------------
// Development check: the numbers quoted in running text (tutor scripts, the
// interpretation, the professor's review) must match what the simulator
// calculates. A mismatch is reported in the browser console.
// ---------------------------------------------------------------------------
if (import.meta.env.DEV) {
  const problems: string[] = []
  const check = (what: string, calculated: number, quoted: number) => {
    if (Math.round(calculated * 100) !== quoted) {
      problems.push(`${what}: text says ${quoted}%, calculated ${(calculated * 100).toFixed(1)}%`)
    }
  }
  const groups: GroupId[] = ['all', 'health', 'taste', 'price']
  const saved = sharesAgainstCompetitors(savedDesign)[0]
  const cheap = sharesAgainstCompetitors({ ...savedDesign, price: 0 })[0]
  groups.forEach((g) => {
    check(`saved design, ${g}`, saved[g], quotedNumbers.design[g])
    check(`design at CHF 1.90, ${g}`, cheap[g], quotedNumbers.designAtLowPrice[g])
    Object.entries(quotedNumbers.importance[g]).forEach(([attr, value]) =>
      check(`importance of ${attr}, ${g}`, importance(g)[attr as AttrId], value),
    )
  })
  const averageHolds = attrIds.every((id) =>
    partWorths.all[id].every((value, level) => {
      const weighted = segments.reduce((sum, s) => sum + (s.share / 100) * partWorths[s.id][id][level], 0)
      return Math.abs(weighted - value) < 0.005
    }),
  )
  if (!averageHolds) problems.push('part-worths "all" are not the weighted segment average')
  if (problems.length) console.warn('[MarketMind demo data] ' + problems.join('\n'))
}
