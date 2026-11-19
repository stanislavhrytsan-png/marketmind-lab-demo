/**
 * The GE McKinsey matrix in the browser: where the business units land when
 * the weights of the factors change.
 *
 * The engine averages the ratings of the managers: one mean rating per unit
 * and factor (run GE-01). Every factor belongs to one of the two axes. The
 * score of a unit on an axis is the weighted average of its ratings there:
 *
 *   score = sum(weight x rating) / sum(weight)     over the factors of the axis
 *
 * Two cuts divide each axis into low, medium and high. A score exactly on a
 * cut counts as the higher level. The two levels name the cell, and the
 * engine's table says to which zone a cell belongs.
 *
 * The ratings, the cuts and the table of zones are the engine's. The browser
 * only repeats the weighted average, with weights the student chooses.
 * `engineDisagreements` compares that arithmetic with the engine's numbers.
 */
import { engineModules } from '../data/moduleKit'
import { Problems, reportInConsole } from './check'

export type Dimension = 'attractiveness' | 'strength'
export type Level = 'low' | 'medium' | 'high'
export type Zone = 'invest' | 'hold' | 'harvest'

export interface Factor {
  key: string
  label: string
  dimension: Dimension
  /** The weight as a share of its axis: the weights of an axis add up to 1. */
  weight: number
}

export interface Cuts {
  low_to_medium: number
  medium_to_high: number
}

export interface Place {
  attractiveness: number
  strength: number
  attractiveness_level: Level
  strength_level: Level
  cell: string
  zone: Zone
}

export const DIMENSIONS: Dimension[] = ['attractiveness', 'strength']

/** Where the grid is cut: the two numbers of the run, or three equal parts of the scale when none were given. */
export function gridCuts(scale: { lowest: number; highest: number }, cutPoints: [number, number] | null): Cuts {
  if (cutPoints) return { low_to_medium: cutPoints[0], medium_to_high: cutPoints[1] }
  const third = (scale.highest - scale.lowest) / 3
  return { low_to_medium: scale.lowest + third, medium_to_high: scale.lowest + 2 * third }
}

/** What every factor counts on its axis: the weights of an axis are scaled so that they add up to 1. */
export function sharesOfAxis(factors: Factor[], weights: number[]): number[] {
  const total = (dimension: Dimension) => factors.reduce((sum, factor, k) => (factor.dimension === dimension ? sum + weights[k] : sum), 0)
  const totals: Record<Dimension, number> = { attractiveness: total('attractiveness'), strength: total('strength') }
  return factors.map((factor, k) => weights[k] / totals[factor.dimension])
}

/** A set of weights as whole points out of 100 per axis, for the sliders: a factor that counts 25% gets 25 points. */
export const weightPoints = (factors: Factor[], weights: number[] = factors.map((factor) => factor.weight)) =>
  sharesOfAxis(factors, weights).map((share) => Math.round(share * 100))

/** What each factor adds to the score of its axis: what it counts, times the rating. The parts of an axis add up to the score. */
export function contributions(ratings: number[], factors: Factor[], weights: number[]): number[] {
  const shares = sharesOfAxis(factors, weights)
  return ratings.map((rating, k) => shares[k] * rating)
}

/** A score exactly on a cut counts as the higher level, as in the engine. */
export const levelOf = (score: number, cuts: Cuts): Level =>
  score >= cuts.medium_to_high - 1e-12 ? 'high' : score >= cuts.low_to_medium - 1e-12 ? 'medium' : 'low'

/** The two scores, the cell and the zone of one unit, from its mean ratings and a set of weights. */
export function placeOf(ratings: number[], factors: Factor[], weights: number[], cuts: Cuts, zoneOfCell: Record<string, Zone>): Place {
  const parts = contributions(ratings, factors, weights)
  const score = (dimension: Dimension) => parts.reduce((sum, part, k) => (factors[k].dimension === dimension ? sum + part : sum), 0)
  const attractiveness = score('attractiveness')
  const strength = score('strength')
  const attractiveness_level = levelOf(attractiveness, cuts)
  const strength_level = levelOf(strength, cuts)
  const cell = `${attractiveness_level} attractiveness, ${strength_level} strength`
  return { attractiveness, strength, attractiveness_level, strength_level, cell, zone: zoneOfCell[cell] }
}

/** How far a unit lies from the nearest cut of the grid, on either axis. */
export function distanceToNearestCut(place: Pick<Place, Dimension>, cuts: Cuts): number {
  return Math.min(...DIMENSIONS.flatMap((dimension) => [Math.abs(place[dimension] - cuts.low_to_medium), Math.abs(place[dimension] - cuts.medium_to_high)]))
}

// ---------------------------------------------------------------------------
// Check against the engine
// ---------------------------------------------------------------------------

interface PlacedUnit extends Place {
  unit: string
}

interface EngineResults {
  runs: { 'GE-01': { settings: { cut_points: [number, number] | null } }; 'GE-02': { settings: { change: number } } }
  scale: { lowest: number; highest: number }
  cuts: Cuts
  factors: Factor[]
  zone_of_cell: Record<string, Zone>
  units: (PlacedUnit & {
    ratings: number[]
    contributions: number[]
    distance_to_nearest_cut: number
    smallest_switch: { factor: string; label: string; dimension: Dimension; multiply_weight_by: number } | null
  })[]
  one_at_a_time: {
    factor: string
    label: string
    direction: 'up' | 'down'
    weight_after: number
    units_that_change_cell: { unit: string; to_cell: string; to_zone: Zone }[]
  }[]
  other_weights: { name: string; weights: number[]; units: PlacedUnit[] }[]
}

/** Every place where the matrix in the browser and the engine disagree. Empty when all is well. */
export function engineDisagreements(): string[] {
  const problems = new Problems('GE McKinsey matrix')
  const results = engineModules.portfolio as unknown as EngineResults
  const { factors, units } = results
  const zones = results.zone_of_cell
  const cuts = gridCuts(results.scale, results.runs['GE-01'].settings.cut_points)
  const given = factors.map((factor) => factor.weight)
  const placed = (unit: (typeof units)[number], weights: number[]) => placeOf(unit.ratings, factors, weights, cuts, zones)
  const compare = (what: string, here: Place, engine: PlacedUnit) => {
    problems.value(`${what}: market attractiveness of ${engine.unit}`, here.attractiveness, engine.attractiveness)
    problems.value(`${what}: business strength of ${engine.unit}`, here.strength, engine.strength)
    problems.same(`${what}: cell of ${engine.unit}`, here.cell, engine.cell)
    problems.same(`${what}: zone of ${engine.unit}`, here.zone, engine.zone)
  }

  // 1. Where the grid is cut.
  problems.value('cut between low and medium', cuts.low_to_medium, results.cuts.low_to_medium)
  problems.value('cut between medium and high', cuts.medium_to_high, results.cuts.medium_to_high)

  // 2. The matrix with the weights of the case: as the engine has them, and as the whole points of the sliders.
  for (const unit of units) {
    compare('weights of the case', placed(unit, given), unit)
    compare('weights of the case in points', placed(unit, weightPoints(factors)), unit)
    contributions(unit.ratings, factors, given).forEach((part, k) => {
      problems.value(`${unit.unit}: what ${factors[k].label} adds`, part, unit.contributions[k], 1)
    })
    problems.value(`${unit.unit}: distance to the nearest cut`, distanceToNearestCut(placed(unit, given), cuts), unit.distance_to_nearest_cut, 1)
  }

  // 3. One weight raised or lowered, as in the sensitivity analysis: the new weight, and the units that change their cell.
  const change = results.runs['GE-02'].settings.change
  for (const step of results.one_at_a_time) {
    const k = factors.findIndex((factor) => factor.key === step.factor)
    const weights = given.map((weight, i) => (i === k ? weight * (step.direction === 'up' ? 1 + change : 1 - change) : weight))
    const what = `weight of ${step.label} ${step.direction}`
    problems.share(`${what}: the weight afterwards`, sharesOfAxis(factors, weights)[k], step.weight_after)
    const moved = units
      .map((unit) => ({ unit: unit.unit, from: unit.cell, to: placed(unit, weights) }))
      .filter((row) => row.to.cell !== row.from)
      .map((row) => `${row.unit} to ${row.to.cell} (${row.to.zone})`)
    problems.same(`${what}: units that change their cell`, moved.join('; '), step.units_that_change_cell.map((row) => `${row.unit} to ${row.to_cell} (${row.to_zone})`).join('; '))
  }

  // 4. Whole other sets of weights, placed by the engine: as given, and as the whole points of the sliders.
  for (const set of results.other_weights) {
    units.forEach((unit, u) => {
      compare(`weights "${set.name}"`, placed(unit, set.weights), set.units[u])
      compare(`weights "${set.name}" in points`, placed(unit, weightPoints(factors, set.weights)), set.units[u])
    })
  }

  // 5. The smallest change of one weight that moves a unit: with it, the score lies exactly on a cut.
  for (const unit of units) {
    const change = unit.smallest_switch
    if (!change) continue
    const k = factors.findIndex((factor) => factor.key === change.factor)
    const weights = given.map((weight, i) => (i === k ? weight * change.multiply_weight_by : weight))
    const score = placed(unit, weights)[change.dimension]
    const toCut = Math.min(Math.abs(score - cuts.low_to_medium), Math.abs(score - cuts.medium_to_high))
    problems.value(`${unit.unit}: distance to a cut after the smallest change of ${change.label}`, toCut, 0, 1)
  }
  return problems.list
}

reportInConsole(engineDisagreements())
