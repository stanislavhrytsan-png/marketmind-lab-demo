/**
 * Forecasting: what the two forecasting screens show.
 *
 *   New product       run FC-01: the Bass model on the first subscribers of
 *                     the Alpine Oat Home subscription
 *   Existing product  runs FC-02 to FC-04: four methods compared on the last
 *                     12 months of each sales series
 *
 * Every number is a result of the engine (engine_results.json, written by
 * `python -m marketmind.export_demo`). Sentences that quote a number are
 * built here from those results. The Bass curve for other values of p, q and
 * m is calculated in the browser (src/lib/forecasting.ts) and checked against
 * the engine by `npm run check`.
 */
import { capital, fixed, inWords, listed, monthName, pct, roughly, signedPct, thousands } from '../lib/format'
import type { FurtherRunId, Run } from './alpineOat'
import { engineModules, optionLabel } from './moduleKit'
import type { CoachScript, FurtherModule, SetupInfo } from './moduleKit'

// ---------------------------------------------------------------------------
// The engine's results
// ---------------------------------------------------------------------------

export interface BassParameters {
  p: number
  q: number
  m: number
}

/** The Bass forecast again with one of p, q and m changed (the engine's what-if view). */
export interface BassScenario extends BassParameters {
  scenario: string
  changed: 'p' | 'q' | 'm' | null
  change: number
  peak_time: number
  peak_period: number
  peak_sales: number
  cumulative_at_end: number
  sales: number[]
}

type Ranges = Record<'p' | 'q' | 'm', [number, number] | null>

interface BassRun {
  series: string
  settings: { estimation: string; market_potential: number | null; horizon: number; sensitivity: number }
  n_periods: number
  parameters: BassParameters
  standard_errors: Record<'p' | 'q' | 'm', number | null>
  ranges_95: Ranges
  buyers_so_far: number
  share_of_potential_reached: number
  peak: { time: number; period: number; sales: number; reached_in_data: boolean; label: string }
  fit: { r_squared: number; rmse: number; mae: number; mape: number }
  periods: {
    label: string[]
    observed: (number | null)[]
    fitted: number[]
    cumulative_observed: (number | null)[]
    cumulative_fitted: number[]
    is_forecast: boolean[]
  }
  sensitivity: BassScenario[]
  how_to_read: string[]
  warnings: string[]
}

/** The Bass model estimated from the first periods only. */
interface BassWindow {
  periods_used: number
  parameters: BassParameters
  ranges_95: Ranges
  market_potential_found: boolean
  peak: { time: number; period: number; sales: number }
  peak_reached_in_these_periods: boolean
  forecast_of_later_periods: null | {
    n_periods: number
    mape: number
    cumulative_forecast: number
    cumulative_observed: number
    cumulative_error: number
  }
  fitted: number[]
  warnings: string[]
}

interface Errors {
  mae: number
  rmse: number
  mape: number
  n: number
}

export interface MethodResult {
  method: string
  label: string
  parameters: Record<string, number>
  forecast_of_holdout: number[]
  holdout: Errors
  in_sample: Errors
  rank: number
}

interface ComparisonRun {
  series: string
  settings: { holdout: number; horizon: number; window: number; season_length: number; error_measure: string }
  n_periods: number
  n_training: number
  n_holdout: number
  holdout_periods: { label: string[]; observed: number[] }
  methods: MethodResult[]
  best_method: string
  best_method_label: string
  totals: { forecast: number; periods_before: number }
  forecast: {
    method: string
    method_label: string
    parameters: Record<string, number>
    estimated_parameters: string[]
    components: { level: number; trend: number | null; seasonal: number[] | null }
    in_sample: Errors
    periods: { label: string[]; observed: (number | null)[]; fitted: (number | null)[]; is_forecast: boolean[] }
    how_to_read: string[]
  }
  how_to_read: string[]
  warnings: string[]
}

interface Analogy extends BassParameters {
  name: string
  description: string
  per_period: BassParameters
  peak: { time: number; period: number; sales: number }
  sales: number[]
  cumulative_at_end: number
}

const results = engineModules.forecasting as unknown as {
  data: {
    new_product: { name: string; what_is_counted: string; period: string; n_periods: number; first_label: string; last_label: string; file: string }
    existing_products: { products: string[]; unit: string; n_periods: number; season_length: number; first_label: string; last_label: string; file: string }
  }
  runs: { 'FC-01': BassRun } & Record<'FC-02' | 'FC-03' | 'FC-04', ComparisonRun>
  by_periods: { settings: { periods_used: number[] }; windows: BassWindow[]; how_to_read: string[] }
  regression_method: { parameters: BassParameters; fit: { r_squared: number; mape: number }; peak: { period: number } }
  analogies: { note: string; period: string; market_potential: number; n_periods: number; examples: Analogy[] }
}

const ENGINE = 'forecasting'
const { new_product: newProduct, existing_products: existingProducts } = results.data

export const forecastingModule: FurtherModule = {
  id: 'forecasting',
  name: 'Forecasting',
  short: 'Forecasting',
  to: '/forecasting',
  text: 'Bass model for new products, smoothing for existing products',
}

export const forecastingQuestion = 'How much will we sell? For a new product and for an existing one.'

/** The two screens of the module. */
export const forecastingTabs = [
  { to: '/forecasting/new-product', label: 'New product' },
  { to: '/forecasting/existing-product', label: 'Existing product' },
]

// ---------------------------------------------------------------------------
// New product: the Bass model (run FC-01)
// ---------------------------------------------------------------------------

const bass = results.runs['FC-01']
const { p, q, m } = bass.parameters
const quarterLabels = bass.periods.label
const lastQuarter = quarterLabels[bass.n_periods - 1]
const horizonEnd = quarterLabels[quarterLabels.length - 1]

/** "2023 Q1" for period 1, and on past the end of the engine's forecast. */
export function quarterLabel(period: number): string {
  const [year, quarter] = newProduct.first_label.split(' Q').map(Number)
  const index = quarter - 1 + (period - 1)
  return `${year + Math.floor(index / 4)} Q${(index % 4) + 1}`
}

const windows = results.by_periods.windows
const firstWindow = windows[0]
const usable = windows.filter((window) => window.forecast_of_later_periods && window.market_potential_found)

export const bassScreen = {
  runId: 'FC-01' as FurtherRunId,
  product: newProduct.name,
  counted: newProduct.what_is_counted,
  summary: `Bass model, ${optionLabel(ENGINE, 'estimation', bass.settings.estimation).toLowerCase()}, ${bass.n_periods} quarters of sales, forecast ${bass.settings.horizon} quarters ahead. Run on Mon 5 Oct at 10:12.`,
  headline: `The subscription is heading for about ${roughly(m)} households. ${
    bass.peak.reached_in_data ? `New sign-ups peaked in ${bass.peak.label}.` : `The model expects the peak in ${bass.peak.label}.`
  }`,
  stats: [
    {
      value: thousands(m),
      label: 'households: market potential (m)',
      note: bass.ranges_95.m ? `Likely between ${roughly(bass.ranges_95.m[0])} and ${roughly(bass.ranges_95.m[1])}` : 'No range can be given',
    },
    {
      value: p.toFixed(3),
      label: 'innovation (p)',
      note: `Each quarter, ${pct(p, 1)} of the households still to come sign up on their own`,
    },
    { value: q.toFixed(2), label: 'imitation (q)', note: 'The pull of earlier subscribers: word of mouth' },
    {
      value: pct(bass.share_of_potential_reached),
      label: 'of the potential reached',
      note: `${thousands(bass.buyers_so_far)} households by ${lastQuarter}`,
    },
  ],
  parameters: bass.parameters,
  nObserved: bass.n_periods,
  labels: quarterLabels,
  observed: bass.periods.observed,
  fitted: bass.periods.fitted,
  cumulativeObserved: bass.periods.cumulative_observed,
  cumulativeFitted: bass.periods.cumulative_fitted,
  peak: bass.peak,
  buyersSoFar: bass.buyers_so_far,
  salesChart: {
    title: 'New subscribers per quarter',
    note: `Points are the sales so far. The line is the Bass curve, dashed where it is a forecast (${quarterLabels[bass.n_periods]} to ${horizonEnd}).`,
    yLabel: 'Households that subscribe for the first time',
  },
  totalChart: {
    title: 'Subscribers in total',
    note: 'The S-curve: slow start, fast middle, then the market fills up.',
    yLabel: 'Households, total so far',
    potentialLabel: `Market potential ${thousands(m)}`,
  },
  howToRead: bass.how_to_read,
  warnings: bass.warnings,

  /** The teaching trap: the same estimate from the first quarters only. */
  early: {
    title: 'From the first quarters, the market potential cannot be estimated',
    text: `After ${firstWindow.periods_used} quarters the sales were still rising, and curves with very different limits fit them equally well. The forecast made then said ${thousands(firstWindow.forecast_of_later_periods!.cumulative_forecast)} subscribers by ${lastQuarter}. In reality there were ${thousands(firstWindow.forecast_of_later_periods!.cumulative_observed)}. ${capital(
      listed(usable.map((window) => `after ${window.periods_used} quarters the forecast was ${signedPct(window.forecast_of_later_periods!.cumulative_error)} off`)),
    )}. The estimate only settles once the peak (${bass.peak.label}) is in the data.`,
    engineSays: firstWindow.warnings[0] ?? '',
    chartNote: `Each line is the forecast a manager would have made at that point: solid over the quarters used, dashed after. The forecast from ${firstWindow.periods_used} quarters leaves the chart.`,
    actualTotal: bass.buyers_so_far,
    rows: windows.map((window) => ({
      quarters: window.periods_used,
      until: quarterLabels[window.periods_used - 1],
      found: window.market_potential_found,
      m: window.parameters.m,
      range: window.ranges_95.m,
      forecast: window.forecast_of_later_periods?.cumulative_forecast ?? null,
      error: window.forecast_of_later_periods?.cumulative_error ?? null,
      fitted: window.fitted,
      parameters: window.parameters,
    })),
    howToRead: results.by_periods.how_to_read,
  },

  /** The what-if view: the curve for other values, calculated in the browser. */
  whatIf: {
    title: 'What if the numbers were different?',
    text: 'Move one number and watch the curve. The grey line stays at the estimate of FC-01.',
    nPeriods: quarterLabels.length,
    ranges: {
      m: { min: 10000, max: 150000, step: 500 },
      p: { min: 0.001, max: 0.1, step: 0.001 },
      q: { min: 0.02, max: 1, step: 0.01 },
    },
    presetLabel: 'Start from',
    presets: [
      { name: 'The estimate of FC-01', p, q, description: 'The values the engine estimated from the 12 quarters of sales.' },
      ...results.analogies.examples.map((example) => ({
        name: example.name,
        p: example.per_period.p,
        q: example.per_period.q,
        description: `${example.description} Per year: p ${example.p}, q ${example.q}.`,
      })),
    ],
    analogyNote: `${results.analogies.note} The demo turns them into values per quarter, as the engine does.`,
    sensitivity: bass.sensitivity,
    sensitivityShare: bass.settings.sensitivity,
  },

  details: {
    table: { title: 'All quarters as a table', note: `${quarterLabels.length} quarters: sales so far, the Bass curve and the totals` },
    scenarios: {
      title: `What if p, q or m were ${pct(bass.settings.sensitivity)} higher or lower?`,
      note: 'The what-if view of the engine, one number changed at a time',
      endLabel: `Subscribers by ${horizonEnd}`,
    },
    methods: {
      title: 'Two ways to estimate the model',
      note: 'Nonlinear least squares against the classic regression',
      rows: [
        {
          name: optionLabel(ENGINE, 'estimation', 'nonlinear'),
          run: 'FC-01',
          p: p.toFixed(3),
          q: q.toFixed(2),
          m: thousands(m),
          fit: pct(bass.fit.r_squared),
        },
        {
          name: optionLabel(ENGINE, 'estimation', 'regression'),
          run: '',
          p: results.regression_method.parameters.p.toFixed(3),
          q: results.regression_method.parameters.q.toFixed(2),
          m: thousands(results.regression_method.parameters.m),
          fit: pct(results.regression_method.fit.r_squared),
        },
      ],
      text: `The regression is the method of the original Bass article, and a spreadsheet can repeat it. On these sales it puts p at ${results.regression_method.parameters.p.toFixed(3)}, which is ${pct(results.regression_method.parameters.p / p - 1)} above the estimate of FC-01, and its curve explains ${pct(results.regression_method.fit.r_squared)} of the ups and downs in the sales, against ${pct(bass.fit.r_squared)}. This is a known weakness of the method, not a wrong calculation.`,
    },
    fit: {
      title: 'How well the curve fits',
      note: `Explains ${pct(bass.fit.r_squared)} of the ups and downs, off by ${pct(bass.fit.mape, 1)} per quarter on average`,
      body: `The Bass curve explains ${pct(bass.fit.r_squared)} of the differences between the ${bass.n_periods} quarters. In a typical quarter it is off by ${thousands(bass.fit.mae)} households, or ${pct(bass.fit.mape, 1)} of that quarter's sales. A close fit to the past is no proof of the forecast: every forecast assumes that the future behaves like the past.`,
    },
  },

  coach: {
    note: `The Bass model puts the market potential at about ${roughly(m)} households. ${thousands(bass.buyers_so_far)} have subscribed, which is ${pct(bass.share_of_potential_reached)} of it, so the subscription is close to its limit. I would plan capacity for ${roughly(m)} subscribers.`,
    opening: [
      {
        from: 'coach',
        text: `You treat ${roughly(m)} as a fixed number. Look at the card "Watch out". What would the same model have told management after the first ${usable[0].periods_used} quarters?`,
      },
    ],
    turns: [
      {
        student: `After ${usable[0].periods_used} quarters it said ${roughly(usable[0].parameters.m)} households, and its forecast for ${lastQuarter} was ${signedPct(usable[0].forecast_of_later_periods!.cumulative_error)} off. After ${firstWindow.periods_used} quarters it found no limit at all.`,
        coach: `Right. So what makes the estimate from ${bass.n_periods} quarters more trustworthy than the one from ${usable[0].periods_used}? Name the result that shows it, and say one thing the model still cannot know.`,
      },
    ],
  } satisfies CoachScript,
}

// ---------------------------------------------------------------------------
// Existing product: four methods compared (runs FC-02 to FC-04)
// ---------------------------------------------------------------------------

export const seriesRunIds = ['FC-02', 'FC-03', 'FC-04'] as const
export type SeriesRunId = (typeof seriesRunIds)[number]

/** Short names of the methods, for labels inside a chart. */
const methodShort: Record<string, string> = {
  moving_average: 'Moving average',
  simple_smoothing: 'Simple smoothing',
  trend_smoothing: 'With trend',
  seasonal_smoothing: 'With trend and season',
}
const weightNames: Record<string, string> = {
  alpha: 'the weight of the newest month (alpha)',
  beta: 'the weight for the trend (beta)',
  gamma: 'the weight for the season (gamma)',
}
const unit = existingProducts.unit
/** A win counts as narrow when the best method is less than this share ahead of the next one. */
const NARROW = 0.1

const ranked = (run: ComparisonRun) => [...run.methods].sort((a, b) => a.rank - b.rank)
/** How far the best method is ahead of the next one, as a share of the next one's error. */
const lead = (run: ComparisonRun) => 1 - ranked(run)[0].holdout.mae / ranked(run)[1].holdout.mae

/** One sentence on the smoothing weights the engine found for the final forecast. */
function weightsNote(run: ComparisonRun): string {
  const { parameters, components, method } = run.forecast
  const names = Object.keys(parameters).filter((name) => name in weightNames)
  if (method === 'moving_average') {
    return `The forecast is the average of the last ${parameters.window} months, the same for every month ahead.`
  }
  if (names.length > 0 && names.every((name) => parameters[name] === 0)) {
    const line =
      components.trend === null
        ? 'The forecast is one level.'
        : `The forecast is a straight line (${fixed(components.trend, 2)} ${unit} more each month)${components.seasonal ? ' plus the same seasonal pattern every year' : ''}.`
    return `The weights that fit this series best are all 0. That is a result, not an error: the level${components.trend === null ? '' : ', the trend'}${components.seasonal ? ' and the seasonal pattern' : ''} found at the start never needed a correction. ${line}`
  }
  const listedWeights = names.map((name) => `${weightNames[name]} is ${parameters[name].toFixed(2)}`).join(', ')
  return `${capital(listedWeights)}. A weight close to 0 means that the forecast changes slowly, a weight close to 1 that it jumps to the latest sales.`
}

/** What the screen shows for one sales series. */
export function seriesScreen(id: SeriesRunId) {
  const run = results.runs[id]
  const order = ranked(run)
  const [best, second] = order
  const narrow = lead(run) < NARROW
  const months = run.n_holdout
  const all = run.forecast.periods
  const firstForecast = all.is_forecast.indexOf(true)
  return {
    runId: id as FurtherRunId,
    series: run.series,
    unit,
    summary: `${capital(inWords(run.methods.length))} methods compared on the last ${months} months of ${run.series}, forecast ${run.settings.horizon} months ahead. Run on Mon 5 Oct at ${runTimes[id]}.`,
    headline: narrow
      ? `For ${run.series}, two methods are almost level: ${best.label.toLowerCase()} missed the ${months} months kept aside by ${pct(best.holdout.mape, 1)} on average, ${second.label.toLowerCase()} by ${pct(second.holdout.mape, 1)}.`
      : `For ${run.series}, ${best.label.toLowerCase()} forecasts best: it missed the ${months} months kept aside by ${pct(best.holdout.mape, 1)} on average, the next best method by ${pct(second.holdout.mape, 1)}.`,
    narrow,
    best,
    methods: run.methods.map((method) => ({ ...method, short: methodShort[method.method] ?? method.label })),
    order,
    test: {
      title: `The test: the last ${months} months, kept aside`,
      note: `Every method saw the first ${run.n_training} months only and then forecast the next ${months} in one go.`,
      /** Months of history shown before the months kept aside. */
      context: 12,
      labels: run.holdout_periods.label,
      observed: run.holdout_periods.observed,
    },
    errors: {
      title: 'How far each method was off',
      note: `Mean absolute error on the ${months} months kept aside, in ${unit} per month. Smaller is better.`,
    },
    forecast: {
      title: `Forecast for the next ${run.settings.horizon} months`,
      note: `${run.forecast.method_label}, fitted to all ${run.n_periods} months.`,
      labels: all.label,
      observed: all.observed,
      fitted: all.fitted,
      firstForecast,
      from: monthName(all.label[firstForecast]),
      to: monthName(all.label[all.label.length - 1]),
      total: run.totals.forecast,
      before: run.totals.periods_before,
      change: run.totals.forecast / run.totals.periods_before - 1,
    },
    seasonal: run.forecast.components.seasonal,
    components: run.forecast.components,
    parameters: run.forecast.parameters,
    weightsNote: weightsNote(run),
    howToRead: [...run.how_to_read, ...run.forecast.how_to_read.slice(1, 2)],
    warnings: run.warnings,
    settings: run.settings,
    nTraining: run.n_training,
  }
}

const runTimes: Record<SeriesRunId, string> = { 'FC-02': '10:40', 'FC-03': '10:44', 'FC-04': '10:47' }

/** The teaching trap of the existing products: the three comparisons side by side. */
const narrowRuns = seriesRunIds.filter((id) => lead(results.runs[id]) < NARROW)
export const narrowWins = {
  title: 'A narrow win proves little',
  text:
    narrowRuns.length > 0
      ? `On ${inWords(narrowRuns.length)} of the ${inWords(seriesRunIds.length)} series the best method is ahead by less than ${Math.ceil(Math.max(...narrowRuns.map((id) => lead(results.runs[id]))) * 100)}%. With another ${results.runs['FC-02'].n_holdout} months the order could turn around, so do not read a rule into it.`
      : 'On every series the best method is clearly ahead.',
  engineSays: results.runs['FC-02'].how_to_read[1],
  rows: seriesRunIds.map((id) => {
    const run = results.runs[id]
    const [best, second] = ranked(run)
    return {
      runId: id as FurtherRunId,
      series: run.series,
      best: best.label,
      bestError: best.holdout.mae,
      second: second.label,
      secondError: second.holdout.mae,
      lead: lead(run),
      narrow: lead(run) < NARROW,
    }
  }),
  unit,
}

// ---------------------------------------------------------------------------
// Runs and setup screens
// ---------------------------------------------------------------------------

const comparisonSettings = (run: ComparisonRun) => [
  { name: 'Series', value: run.series },
  { name: 'Months of sales', value: String(run.n_periods) },
  { name: 'Months kept aside', value: String(run.settings.holdout) },
  { name: 'Methods ranked by', value: optionLabel(ENGINE, 'error_measure', run.settings.error_measure) },
  { name: 'Months to forecast', value: String(run.settings.horizon) },
  { name: 'Moving average', value: `${run.settings.window} months` },
  { name: 'Months per season', value: String(run.settings.season_length) },
]

export const forecastingRuns: Run[] = [
  {
    id: 'FC-01',
    module: 'forecasting',
    label: `Home subscription, ${bass.n_periods} quarters`,
    summary: `Bass model, ${bass.n_periods} quarters of sales, ${optionLabel(ENGINE, 'estimation', bass.settings.estimation).toLowerCase()}`,
    when: 'Mon 5 Oct, 10:12',
    final: true,
    to: '/forecasting/new-product',
    setupTo: '/forecasting/setup/FC-01',
    settings: [
      { name: 'Series', value: newProduct.name },
      { name: 'Quarters of sales', value: String(bass.n_periods) },
      { name: 'Estimation', value: optionLabel(ENGINE, 'estimation', bass.settings.estimation) },
      { name: 'Market potential', value: bass.settings.market_potential === null ? 'Estimated from the sales' : thousands(bass.settings.market_potential) },
      { name: 'Quarters to forecast', value: String(bass.settings.horizon) },
      { name: 'What-if change', value: pct(bass.settings.sensitivity) },
    ],
  },
  ...seriesRunIds.map((id): Run => {
    const run = results.runs[id]
    return {
      id,
      module: 'forecasting',
      label: `${run.series}, methods compared`,
      summary: `${run.methods.length} methods on the last ${run.n_holdout} months, best: ${methodShort[run.best_method].toLowerCase()}`,
      when: `Mon 5 Oct, ${runTimes[id]}`,
      to: `/forecasting/existing-product?run=${id}`,
      setupTo: `/forecasting/setup/${id}`,
      settings: comparisonSettings(run),
    }
  }),
]

const steps = [
  'New product with some sales: enter the sales of the first periods and fit the Bass model.',
  'Read the three numbers: the market potential, the innovation coefficient (buyers who start on their own) and the imitation coefficient (buyers who follow others).',
  'Read the forecast: sales per period, total buyers so far, and the period with the highest sales.',
  'Ask how sure the market potential is: the estimate changes with the number of periods used.',
  'New product without sales: pick a similar product from the list of analogies, enter your own market potential, and draw the curve.',
  'Try the what-if view: what if the coefficients were 20% higher or lower?',
  'Existing product: choose one sales series.',
  'Compare the methods on the last periods, which are kept aside.',
  'Forecast with the method that did best.',
]

export const forecastingSetups: SetupInfo[] = [
  {
    runId: 'FC-01',
    module: 'forecasting',
    engineModule: ENGINE,
    title: 'Set up a forecast for a new product',
    question: forecastingQuestion,
    steps: steps.slice(0, 6),
    inputs: [
      {
        input: 'Sales of a new product',
        form: 'One number per period, in order, from the launch.',
        here: `${newProduct.file}: ${capital(newProduct.what_is_counted)}, ${newProduct.n_periods} quarters from ${newProduct.first_label} to ${newProduct.last_label}`,
      },
      {
        input: 'Market potential (optional)',
        form: 'If you know it from market research. The fit is then much safer.',
        here: 'Not entered: the engine estimates it from the sales',
      },
    ],
    settings: Object.entries(bass.settings).map(([key, value]) => ({ key, value })),
    calls: 'fit_bass',
    resultsTo: '/forecasting/new-product',
  },
  ...seriesRunIds.map((id): SetupInfo => {
    const run = results.runs[id]
    return {
      runId: id,
      module: 'forecasting',
      engineModule: ENGINE,
      title: 'Set up a forecast for an existing product',
      question: forecastingQuestion,
      steps: steps.slice(6),
      inputs: [
        {
          input: 'Sales series of an existing product',
          form: 'One number per period. One product at a time.',
          here: `${existingProducts.file}: ${run.series}, ${run.n_periods} months from ${monthName(existingProducts.first_label)} to ${monthName(existingProducts.last_label)}, in ${unit}`,
        },
      ],
      settings: Object.entries(run.settings).map(([key, value]) => ({
        key,
        value,
        note: key === 'holdout' ? `Left empty. The engine chose ${value}: one full season.` : undefined,
      })),
      calls: 'compare_forecast_methods',
      resultsTo: `/forecasting/existing-product?run=${id}`,
    }
  }),
]

/**
 * What the presenting script in README.md says out loud about this module.
 * `npm run check` fails if the README does not contain these phrases.
 */
export const forecastingReadme = [
  `about ${roughly(m)} households`,
  `${thousands(firstWindow.forecast_of_later_periods!.cumulative_forecast)} subscribers`,
  `${thousands(bass.buyers_so_far)}`,
]
