/**
 * The market simulator of the demo: plain front-end arithmetic on the
 * part-worths the engine estimated (run CJ-02, read from the data file).
 *
 *   utility of a product   = sum of the part-worths of its levels
 *   share inside a segment = e^utility / sum of e^utility over all products (logit rule)
 *   share, all respondents = the segment shares, weighted by segment size
 *
 * This is the engine's own rule (share of preference with the part-worths of
 * each segment), so the same product gets the same share here and in the
 * engine. Nothing is estimated in the browser. `engineDisagreements` below
 * compares the two, and `npm run check` fails if they differ.
 */
import {
  attributes,
  competitors,
  engine,
  partWorths,
  partWorthsOneModel,
  priceValues,
  quotedNumbers,
  restriction,
  savedDesign,
  segmentWeights,
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
      row.all += segmentWeights[s.id] * bySegment[k][i]
    })
    return row
  })
}

/** A design against the three competitor products. Index 0 is the design. */
export function sharesAgainstCompetitors(design: Design): Shares[] {
  return marketShares([design, ...competitors.map((c) => c.design)])
}

/** Attribute importance: the range of an attribute's part-worths, as a share of all ranges. */
function importanceFrom(worths: Record<AttrId, number[]>): Record<AttrId, number> {
  const ranges = attrIds.map((id) => Math.max(...worths[id]) - Math.min(...worths[id]))
  const total = ranges.reduce((a, b) => a + b, 0)
  return Object.fromEntries(attrIds.map((id, i) => [id, ranges[i] / total])) as Record<AttrId, number>
}

/** Attribute importance of a group in run CJ-02. */
export function importance(group: GroupId): Record<AttrId, number> {
  return importanceFrom(partWorths[group])
}

/** Attribute importance in run CJ-01: one model for all respondents. */
export const importanceOneModel = importanceFrom(partWorthsOneModel)

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
// Check against the engine. The engine wrote its own shares for a list of
// products into engine_results.json. The simulator above must give the same
// shares (within 0.1 percentage points), the same best products, and the
// numbers quoted in running text. Used by `npm run check` and, while
// developing, reported in the browser console.
// ---------------------------------------------------------------------------

/** Largest allowed difference between a share here and in the engine: 0.1 percentage points. */
const TOLERANCE = 0.001

/** Every place where the simulator in the browser and the engine disagree. Empty when all is well. */
export function engineDisagreements(): string[] {
  const problems: string[] = []
  const groups: GroupId[] = ['all', 'health', 'taste', 'price']
  const design = (levels: Record<string, string>) =>
    Object.fromEntries(attributes.map((a) => [a.id, a.levels.indexOf(levels[a.name])])) as Design
  const close = (what: string, here: number, there: number) => {
    if (!(Math.abs(here - there) < TOLERANCE)) {
      problems.push(`${what}: ${(here * 100).toFixed(2)}% here, ${(there * 100).toFixed(2)}% in the engine`)
    }
  }

  // 1. Shares of single products against the competitors.
  for (const product of engine.conjoint.simulator_checks) {
    const here = sharesAgainstCompetitors(design(product.levels))[0]
    groups.forEach((g) => close(`share of ${describe(design(product.levels))}, ${g}`, here[g], product[g]))
  }

  // 2. The whole market of run CJ-03: the saved design and every competitor.
  const market = engine.runs['CJ-03'].shares
  const here = marketShares(market.map((product) => design(product.levels)))
  market.forEach((product, i) => groups.forEach((g) => close(`${product.name}, ${g}`, here[i][g], product[g])))

  // 3. The best-product search.
  for (const by of ['share', 'revenue'] as const) {
    const wanted = engine.conjoint.best_products[by]
    bestProducts(by, wanted.length).forEach((candidate, i) => {
      if (!sameDesign(candidate.design, design(wanted[i].levels))) {
        problems.push(`best product by ${by}, place ${i + 1}: ${describe(candidate.design)} here, ${describe(design(wanted[i].levels))} in the engine`)
      }
      close(`best product by ${by}, place ${i + 1}`, candidate.share, wanted[i].share)
    })
  }

  // 4. The number of products.
  if (productCount !== engine.conjoint.n_combinations || allowedCount !== engine.conjoint.n_allowed) {
    problems.push(`products: ${allowedCount} of ${productCount} here, ${engine.conjoint.n_allowed} of ${engine.conjoint.n_combinations} in the engine`)
  }

  // 5. Importance, and the numbers quoted in running text (whole percent).
  const quotedAs = (what: string, calculated: number, quoted: number) => {
    if (Math.round(calculated * 100) !== quoted) {
      problems.push(`${what}: text says ${quoted}%, calculated ${(calculated * 100).toFixed(1)}%`)
    }
  }
  const saved = sharesAgainstCompetitors(savedDesign)[0]
  const cheap = sharesAgainstCompetitors({ ...savedDesign, price: 0 })[0]
  groups.forEach((g) => {
    const engineImportance = engine.runs['CJ-02'][g].importance as Record<string, number>
    attributes.forEach((a) => close(`importance of ${a.name}, ${g}`, importance(g)[a.id], engineImportance[a.name]))
    quotedAs(`saved design, ${g}`, saved[g], quotedNumbers.design[g])
    quotedAs(`design at the lowest price, ${g}`, cheap[g], quotedNumbers.designAtLowPrice[g])
    Object.entries(quotedNumbers.importance[g]).forEach(([attr, value]) =>
      quotedAs(`importance of ${attr}, ${g}`, importance(g)[attr as AttrId], value),
    )
  })
  const engineOneModel = engine.runs['CJ-01'].all.importance as Record<string, number>
  attributes.forEach((a) => close(`importance of ${a.name}, one model`, importanceOneModel[a.id], engineOneModel[a.name]))

  // 6. "All respondents" is the average of the segments, weighted by their size.
  const averageHolds = attrIds.every((id) =>
    partWorths.all[id].every((value, level) => {
      const weighted = segments.reduce((sum, s) => sum + segmentWeights[s.id] * partWorths[s.id][id][level], 0)
      return Math.abs(weighted - value) < 0.00001
    }),
  )
  if (!averageHolds) problems.push('part-worths "all" are not the weighted segment average')
  return problems
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  const problems = engineDisagreements()
  if (problems.length) console.warn('[MarketMind demo data] ' + problems.join('\n'))
}
