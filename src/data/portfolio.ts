/**
 * GE McKinsey matrix: what the screen of the module shows.
 *
 *   GE-01  the six business units in the matrix
 *   GE-02  how firmly the units sit in their cells (sensitivity analysis)
 *
 * Scores, cells, zones and the whole sensitivity analysis are results of the
 * engine (engine_results.json). The what-if view places the units again in
 * the browser, with weights the student chooses (src/lib/portfolio.ts).
 */
import { capital, inWords, listed, pct, thousands } from '../lib/format'
import { gridCuts, weightPoints } from '../lib/portfolio'
import type { Cuts, Dimension, Factor, Place, Zone } from '../lib/portfolio'
import type { FurtherRunId, Run } from './alpineOat'
import { engineModules } from './moduleKit'
import type { CoachScript, FurtherModule, SetupInfo } from './moduleKit'

// ---------------------------------------------------------------------------
// The engine's results
// ---------------------------------------------------------------------------

export interface PlacedUnit extends Place {
  unit: string
  zone_label: string
}

interface SmallestSwitch {
  factor: string
  label: string
  dimension: Dimension
  multiply_weight_by: number
  /** The change as a share of the weight: -0.06 is a weight 6% lower. */
  change_of_weight: number
  to_cell: string
  to_zone: Zone
  zone_changes: boolean
}

export interface UnitResult extends PlacedUnit {
  zone_meaning: string
  /** Revenue, for the size of the bubble. */
  size: number
  n_ratings: number
  distance_to_nearest_cut: number
  nearest_cut: { dimension: Dimension; cut: number }
  /** The mean rating of every factor, in the order of the factors. */
  ratings: number[]
  spread_between_raters: number[]
  contributions: number[]
  share_of_draws_in_same_cell: number
  share_of_draws_in_same_zone: number
  share_of_draws_by_zone: Record<Zone, number>
  attractiveness_range: [number, number]
  strength_range: [number, number]
  moves_when_one_weight_changes: string[]
  smallest_switch: SmallestSwitch | null
  stable: boolean
  same_zone_without_one_manager: number
}

interface OneWeightChanged {
  factor: string
  label: string
  dimension: Dimension
  direction: 'up' | 'down'
  weight_before: number
  weight_after: number
  units_that_change_cell: { unit: string; from_cell: string; to_cell: string; from_zone: Zone; to_zone: Zone }[]
}

interface ScaleSettings {
  scale_min: number
  scale_max: number
  cut_points: [number, number] | null
}

const results = engineModules.portfolio as unknown as {
  data: {
    file: string
    n_raters: number
    raters: string[]
    rating_scale: { minimum: number; maximum: number }
    revenue_unit: string
    units: string[]
  }
  runs: {
    'GE-01': { settings: ScaleSettings; n_units: number; ratings_were_averaged: boolean; zones: Record<Zone, string[]>; how_to_read: string[]; warnings: string[] }
    'GE-02': {
      settings: ScaleSettings & { change: number; n_draws: number; seed: number }
      from_least_to_most_stable: string[]
      how_to_read: string[]
      warnings: string[]
    }
  }
  scale: { lowest: number; highest: number }
  cuts: Cuts
  factors: (Factor & { weight_given: number })[]
  dimension_labels: Record<Dimension, string>
  zone_of_cell: Record<string, Zone>
  zone_labels: Record<Zone, string>
  zone_meanings: Record<Zone, string>
  units: UnitResult[]
  one_at_a_time: OneWeightChanged[]
  without_one_manager: { manager: string; units: PlacedUnit[] }[]
  other_weights: { name: string; weights: number[]; units: PlacedUnit[] }[]
}

const ENGINE = 'portfolio'
const { data, units, factors } = results
const matrix = results.runs['GE-01']
const sensitivity = results.runs['GE-02']
const cuts = gridCuts(results.scale, matrix.settings.cut_points)
const ZONES: Zone[] = ['invest', 'hold', 'harvest']

/**
 * 3.6767 -> "3.68": a score on the rating scale. A score that ends on a 5 is always rounded up (2.755 -> "2.76"),
 * so that the engine's number and the same number added up in the browser are written the same way.
 */
export const score = (value: number) => (Math.round(value * 100 + 1e-6) / 100).toFixed(2)
/** -0.0606 -> "6% lower", 1.36 -> "136% higher": a change of one weight. */
export const weightChange = (change: number) => `${thousands(Math.abs(change) * 100)}% ${change < 0 ? 'lower' : 'higher'}`
const quoted = (zone: Zone) => `“${results.zone_labels[zone]}”`
const axisOf = (dimension: Dimension) => results.dimension_labels[dimension].toLowerCase()
const factorsOf = (dimension: Dimension) => factors.filter((factor) => factor.dimension === dimension)
const weightsListed = (dimension: Dimension) => factorsOf(dimension).map((factor) => `${factor.label} ${pct(factor.weight)}`).join(', ')

export const portfolioModule: FurtherModule = {
  id: 'portfolio',
  name: 'GE McKinsey matrix',
  short: 'GE matrix',
  to: '/ge-matrix',
  text: 'The business units in a grid of market attractiveness and business strength, and how firmly each sits in its cell',
}

export const portfolioQuestion = 'Which business units deserve investment?'

// ---------------------------------------------------------------------------
// The screen (run GE-01, with GE-02 for how firmly the units sit)
// ---------------------------------------------------------------------------

const inZone = (zone: Zone) => units.filter((unit) => unit.zone === zone)
const revenue = (list: UnitResult[]) => list.reduce((sum, unit) => sum + unit.size, 0)
/** The unit that keeps its cell in the fewest sets of weights. */
const fragile = [...units].sort((a, b) => a.share_of_draws_in_same_cell - b.share_of_draws_in_same_cell)[0]
const unstable = units.filter((unit) => !unit.stable)
const alsoNear = unstable.filter((unit) => unit !== fragile)
/** A unit of the same zone that keeps its cell in every set, to compare the fragile one with. */
const firm = inZone(fragile.zone).find((unit) => unit.stable && unit.share_of_draws_in_same_cell === 1) ?? units.find((unit) => unit.stable) ?? units[0]
/** The zone the fragile unit lands in when it leaves its cell. */
const otherZone = ZONES.filter((zone) => zone !== fragile.zone).sort((a, b) => fragile.share_of_draws_by_zone[b] - fragile.share_of_draws_by_zone[a])[0]
const fragileCut = fragile.nearest_cut
const [levelBelow, levelAbove] = Math.abs(fragileCut.cut - cuts.medium_to_high) < 1e-6 ? ['medium', 'high'] : ['low', 'medium']
/** The matrix again without one manager: who moves which unit. */
const withoutOne = results.without_one_manager.map((run) => ({
  manager: run.manager,
  moved: run.units.filter((unit, u) => unit.cell !== units[u].cell),
}))
const movesFragile = withoutOne.filter((run) => run.moved.some((unit) => unit.unit === fragile.unit)).map((run) => run.manager)
/** "four land in “Invest and grow”", "two in “Harvest or divest”": the zones that hold at least one unit. */
const zonesInWords = ZONES.filter((zone) => inZone(zone).length > 0).map((zone, k) => `${inWords(inZone(zone).length)} ${k === 0 ? 'land ' : ''}in ${quoted(zone)}`)
const settings = sensitivity.settings
const fragileSwitch = fragile.smallest_switch
/** One weight raised and lowered, the others unchanged: one row per factor. */
const oneAtATime = factors.map((factor) => ({
  factor,
  up: results.one_at_a_time.find((step) => step.factor === factor.key && step.direction === 'up') as OneWeightChanged,
  down: results.one_at_a_time.find((step) => step.factor === factor.key && step.direction === 'down') as OneWeightChanged,
}))

export const portfolioScreen = {
  runId: 'GE-01' as FurtherRunId,
  otherRunId: 'GE-02' as FurtherRunId,
  summary: `${capital(inWords(units.length))} business units on ${inWords(factors.length)} factors, rated by ${inWords(data.n_raters)} managers on a scale from ${data.rating_scale.minimum} to ${data.rating_scale.maximum}. The grid is cut into three equal parts. Run on Tue 27 Oct at 10:20.`,
  headline: `Of the ${inWords(units.length)} business units, ${listed(zonesInWords)}. ${fragile.unit} lies on a border: with weights up to ${pct(settings.change)} different, it keeps its cell in only ${pct(fragile.share_of_draws_in_same_cell)} of ${thousands(settings.n_draws)} sets.`,
  stats: [
    {
      value: `${inZone('invest').length} of ${units.length}`,
      label: `units in ${quoted('invest')}`,
      note: `They bring ${pct(revenue(inZone('invest')) / revenue(units))} of the revenue of CHF ${thousands(revenue(units), 1)} million`,
    },
    { value: String(inZone('harvest').length), label: `units in ${quoted('harvest')}`, note: listed(inZone('harvest').map((unit) => unit.unit)) },
    {
      value: score(fragile.distance_to_nearest_cut),
      label: `points between ${fragile.unit} and the next border`,
      note: `${capital(axisOf(fragileCut.dimension))} of ${score(fragile[fragileCut.dimension])}, border at ${score(fragileCut.cut)}`,
    },
    {
      value: pct(fragile.share_of_draws_in_same_cell),
      label: `of ${thousands(settings.n_draws)} sets of weights keep ${fragile.unit} in its cell`,
      note: `In the other ${pct(1 - fragile.share_of_draws_in_same_cell)} it lies in ${quoted(otherZone)}`,
    },
  ],

  grid: {
    scale: results.scale,
    cuts,
    zoneOfCell: results.zone_of_cell,
    zoneLabels: results.zone_labels,
    zoneMeanings: results.zone_meanings,
    axes: results.dimension_labels,
  },
  units,
  factors: factors as Factor[],
  revenueUnit: data.revenue_unit,
  draws: settings.n_draws,
  change: settings.change,

  matrixCard: {
    title: 'The matrix',
    note: `Business strength across, market attractiveness up, both on the scale from ${data.rating_scale.minimum} to ${data.rating_scale.maximum}. The area of a bubble is the revenue of the unit.`,
    crossNote: `The cross through a bubble shows how far its two scores move over the ${thousands(settings.n_draws)} sets of weights of run GE-02.`,
    howToRead: [...matrix.how_to_read.slice(0, 1), 'The matrix sorts the units. It does not say how much to invest in each.'],
  },

  /** The teaching trap: near a border, the cell depends on the weights and on who rated. */
  trap: {
    title: `${fragile.unit} sits ${score(fragile.distance_to_nearest_cut)} points from a border: its cell depends on the weights and on who rated`,
    text: `The matrix puts ${fragile.unit} in ${quoted(fragile.zone)}: its ${axisOf(fragileCut.dimension)} is ${score(fragile[fragileCut.dimension])}, and the border between ${levelBelow} and ${levelAbove} is at ${score(fragileCut.cut)}. Ratings and weights are judgments, and nobody knows them to two decimals. So the engine drew ${thousands(settings.n_draws)} sets of weights, each weight up to ${pct(settings.change)} higher or lower. ${fragile.unit} keeps its cell in ${pct(fragile.share_of_draws_in_same_cell)} of them, and lies in ${quoted(otherZone)} in the other ${pct(1 - fragile.share_of_draws_in_same_cell)}.${
      fragileSwitch ? ` One weight is enough: with ${fragileSwitch.label} ${weightChange(fragileSwitch.change_of_weight)}, it moves.` : ''
    }${
      movesFragile.length
        ? ` Who rated matters as well: without the ratings of ${movesFragile.length === 1 ? `manager ${movesFragile[0]}` : `manager ${movesFragile.join(' or ')}`}, it would lie in ${quoted(otherZone)} too.`
        : ''
    }${
      alsoNear.length
        ? ` ${listed(alsoNear.map((unit) => unit.unit))} ${alsoNear.length === 1 ? 'is' : 'are'} near a border as well, ${alsoNear.map((unit) => score(unit.distance_to_nearest_cut)).join(' and ')} points from it.`
        : ''
    } The other ${inWords(units.length - unstable.length)} units keep their cell in every set.`,
    /** From the least to the most firmly placed unit, as the engine orders them. */
    rows: sensitivity.from_least_to_most_stable.map((name) => units.find((unit) => unit.unit === name) as UnitResult),
    raters: data.n_raters,
    howToRead: sensitivity.how_to_read,
    engineSays: [...sensitivity.warnings, matrix.how_to_read[2]],
  },

  /** The what-if view: weights of your own, the units placed again in the browser. */
  whatIf: {
    title: 'Try weights of your own',
    text: 'Each slider sets how much a factor counts. The weights of an axis always add up to 100%: raise one, and the others count a little less. The ratings stay as the managers gave them.',
    slider: { min: 0, max: 100, step: 1 },
    presets: [
      { name: 'Weights of the case', points: weightPoints(factors) },
      // The other sets are placed by the engine as well (other_weights in the export). Those in which every factor counts are offered.
      ...results.other_weights.map((set) => ({ name: set.name, points: weightPoints(factors, set.weights) })).filter((set) => set.points.every((points) => points > 0)),
    ],
  },

  details: {
    contributions: {
      title: 'What each factor adds to the two scores',
      note: 'Weight times mean rating, per unit and axis',
      text: 'The length of a bar is the score. Each part is one factor: what it counts, times the mean rating of the unit on it. The two lines are the borders of the grid.',
    },
    ratings: {
      title: `The mean ratings of the ${inWords(data.n_raters)} managers`,
      note: `${units.length * factors.length} mean ratings from ${thousands(units.reduce((sum, unit) => sum + unit.n_ratings, 0) * factors.length)} single ratings`,
      text: `Every manager rated every unit on every factor, from ${data.rating_scale.minimum} (weak) to ${data.rating_scale.maximum} (strong). The engine averages them. Hover a rating to see how far the managers were apart.`,
    },
    oneAtATime: {
      title: 'One weight at a time',
      note: `Each weight ${pct(settings.change)} higher and ${pct(settings.change)} lower: which units change their cell`,
      rows: oneAtATime,
      text: `In every row one weight is ${pct(settings.change)} higher or lower, and the others stay as they are. The weights of the axis are then scaled to add up to 100% again: that is why ${pct(oneAtATime[0].factor.weight)} becomes ${pct(oneAtATime[0].up.weight_after, 1)} and not ${pct(oneAtATime[0].factor.weight * (1 + settings.change))}.`,
    },
    raters: {
      title: 'Without one manager',
      note: `The matrix ${inWords(data.n_raters)} more times, each time without the ratings of one manager`,
      rows: withoutOne,
      text: `${capital(inWords(withoutOne.filter((run) => run.moved.length === 0).length))} of the ${inWords(data.n_raters)} managers can be left out without any unit changing its cell.`,
    },
  },

  coach: {
    note: `${fragile.unit} is in ${quoted(fragile.zone)}, like ${firm.unit}. So I would treat the ${inWords(inZone(fragile.zone).length)} units of this zone alike and put money into each of them.`,
    opening: [
      {
        from: 'coach',
        text: `Before you treat them alike: how far is ${fragile.unit} from the nearest border of the grid, and in how many of the ${thousands(settings.n_draws)} sets of weights does it keep its cell? Both numbers are on this screen.`,
      },
    ],
    turns: [
      {
        student: `It is ${score(fragile.distance_to_nearest_cut)} points above the border, and it keeps its cell in ${pct(fragile.share_of_draws_in_same_cell)} of the sets. In the other ${pct(1 - fragile.share_of_draws_in_same_cell)} it lies in ${quoted(otherZone)}.`,
        coach: `Right. ${firm.unit} keeps its cell in ${pct(firm.share_of_draws_in_same_cell)} of the sets. What does that difference mean for how firmly you can state each of the two results? And one thing the matrix does not say for any unit: how much to invest. What else would you need to know for that?`,
      },
    ],
  } satisfies CoachScript,
}

// ---------------------------------------------------------------------------
// Runs and setup screens
// ---------------------------------------------------------------------------

const sharedSettings = [
  { name: 'Units', value: `${units.length} business units` },
  { name: 'Factors', value: `${factorsOf('attractiveness').length} of market attractiveness, ${factorsOf('strength').length} of business strength` },
  { name: 'Raters', value: `${data.n_raters} managers, ratings averaged` },
  { name: 'Rating scale', value: `${matrix.settings.scale_min} to ${matrix.settings.scale_max}` },
  { name: 'Grid cut at', value: `${score(cuts.low_to_medium)} and ${score(cuts.medium_to_high)}` },
]

export const portfolioRuns: Run[] = [
  {
    id: 'GE-01',
    module: 'portfolio',
    label: 'The six units in the matrix',
    summary: `${units.length} business units on ${factors.length} factors, rated by ${data.n_raters} managers`,
    when: 'Tue 27 Oct, 10:20',
    final: true,
    to: '/ge-matrix',
    setupTo: '/ge-matrix/setup/GE-01',
    settings: sharedSettings,
  },
  {
    id: 'GE-02',
    module: 'portfolio',
    label: 'The cells with other weights',
    summary: `${thousands(settings.n_draws)} sets of weights, each weight up to ${pct(settings.change)} higher or lower`,
    when: 'Tue 27 Oct, 10:34',
    to: '/ge-matrix',
    setupTo: '/ge-matrix/setup/GE-02',
    settings: [
      ...sharedSettings,
      { name: 'Change in the weights', value: `up to ${pct(settings.change)}` },
      { name: 'Sets of weights', value: thousands(settings.n_draws) },
      { name: 'Seed', value: String(settings.seed) },
    ],
  },
]

const steps = [
  'List the business units.',
  'Choose the factors of market attractiveness and of business strength, and give each a weight.',
  'Rate every unit on every factor. Several raters can rate: their ratings are averaged.',
  'Read the matrix: the cell and the zone of every unit (invest, hold, harvest).',
  'Read what each factor adds to the two scores of a unit.',
  'Run the sensitivity analysis: which units stay in their cell when the weights are a little different?',
]

const smallest = [...units].sort((a, b) => a.size - b.size)[0]
const largest = [...units].sort((a, b) => b.size - a.size)[0]

export const portfolioSetups: SetupInfo[] = (['GE-01', 'GE-02'] as const).map((id): SetupInfo => {
  const run = results.runs[id]
  return {
    runId: id,
    module: 'portfolio',
    engineModule: ENGINE,
    title: id === 'GE-01' ? 'Set up a GE McKinsey matrix' : 'Set up the sensitivity analysis of a matrix',
    question: portfolioQuestion,
    steps,
    inputs: [
      {
        input: 'Ratings',
        form: 'One row per unit (and rater), one column per factor.',
        here: `${data.file}: ${inWords(data.n_raters)} managers rate ${inWords(units.length)} business units (${listed(data.units)}) on ${inWords(factors.length)} factors, from ${data.rating_scale.minimum} to ${data.rating_scale.maximum}.`,
      },
      {
        input: 'Factors',
        form: 'For each factor: its column, its axis (attractiveness or strength) and its weight.',
        here: `Market attractiveness: ${weightsListed('attractiveness')}. Business strength: ${weightsListed('strength')}.`,
      },
      {
        input: 'Sizes (optional)',
        form: 'A number per unit, for example revenue, for the size of its bubble.',
        here:
          id === 'GE-01'
            ? `Revenue in ${data.revenue_unit}, from ${smallest.size} (${smallest.unit}) to ${largest.size} (${largest.unit}).`
            : 'Not needed for the sensitivity analysis.',
      },
    ],
    settings: Object.entries(run.settings).map(([key, value]) => ({
      key,
      value,
      note: key === 'cut_points' && value === null ? `Left empty. The engine cut the scale into three equal parts, at ${score(cuts.low_to_medium)} and ${score(cuts.medium_to_high)}.` : undefined,
    })),
    calls: id === 'GE-01' ? 'ge_matrix' : 'ge_sensitivity',
    resultsTo: '/ge-matrix',
  }
})

/** What the presenting script in README.md says out loud about this module. */
export const portfolioReadme = [
  `${score(fragile.distance_to_nearest_cut)} points`,
  `${pct(fragile.share_of_draws_in_same_cell)} of the ${thousands(settings.n_draws)} sets`,
  ...(fragileSwitch ? [`${weightChange(fragileSwitch.change_of_weight)}`] : []),
]
