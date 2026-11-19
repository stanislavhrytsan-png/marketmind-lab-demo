/**
 * Price optimization: what the two pricing screens show.
 *
 *   Price tests         runs PR-01 to PR-03: three forms of the demand curve
 *                       fitted to the price tests of one product, and the
 *                       price with the highest profit
 *   From the conjoint   run PR-04: the same question answered with the
 *   study               market simulator of the conjoint study (CJ-02)
 *
 * Every number is a result of the engine (engine_results.json). The what-if
 * view moves along the engine's curves in the browser (src/lib/pricing.ts),
 * and `npm run check` compares that arithmetic with the engine.
 */
import { capital, chf, fixed, inWords, pct, thousands } from '../lib/format'
import type { DemandForm } from '../lib/pricing'
import type { FurtherRunId, Run } from './alpineOat'
import { engineModules, optionLabel, settingHelp } from './moduleKit'
import type { CoachScript, FurtherModule, SetupInfo } from './moduleKit'

// ---------------------------------------------------------------------------
// The engine's results
// ---------------------------------------------------------------------------

interface Optimum {
  optimal_price: number
  quantity: number
  revenue: number
  profit: number
  margin_per_unit: number
  elasticity: number
  inside_observed_prices: boolean
}

interface Curve {
  price: number[]
  quantity: number[]
  revenue: number[]
  profit: number[]
  inside_observed_prices: boolean[]
}

/** One form of the demand curve, fitted to the price tests of one product. */
export interface FormResult {
  form: DemandForm
  label: string
  rank: number
  equation: string
  parameters: Record<string, number>
  fit: { r_squared: number; rmse: number }
  elasticity_at_mean_price: number
  optimum: Optimum
  optimum_warnings: string[]
  /** What the best price of this form earns if the best-fitting curve is the right one. */
  on_best_fitting_curve: { profit: number; quantity: number; profit_lost: number }
  curve: Curve
  warnings: string[]
}

interface AtPrice {
  price: number
  quantity: number
  revenue: number
  profit: number
  elasticity: number
  profit_gain_at_optimal_price: number
}

interface PriceTestRun {
  product: string
  unit_cost: number
  settings: { model: DemandForm; market_size: number | null; min_price: number | null; max_price: number | null }
  n_observations: number
  n_prices: number
  stores_per_price: number
  price_range: { lowest: number; highest: number; mean: number }
  observations: { price: number[]; quantity: number[] }
  by_price: { price: number; mean: number; lowest: number; highest: number }[]
  forms: FormResult[]
  best_form: DemandForm
  best_form_label: string
  at_mean_price: AtPrice
  near_the_best_price: { change: number; price: number; profit: number; profit_lost: number }[]
  how_to_read: string[]
  warnings: string[]
}

interface ConjointRun {
  product: string
  levels: Record<string, string>
  estimates_from_run: string
  n_competitors: number
  unit_cost: number
  market_size: number
  market_size_unit: string
  settings: { market_size: number; rule: string; scale: number; segment: string | null; min_price: number | null; max_price: number | null }
  price_range: { lowest: number; highest: number; mean: number }
  points: { level: string; price: number; share: number; quantity: number; elasticity_to_next_price: number | null }[]
  optimum: Optimum & { share: number }
  at_mean_price: AtPrice
  curve: Curve
  how_to_read: string[]
  warnings: string[]
}

const results = engineModules.pricing as unknown as {
  data: { file: string; quantity_unit: string; currency: string; products: string[]; price_step: number }
  runs: Record<'PR-01' | 'PR-02' | 'PR-03', PriceTestRun> & { 'PR-04': ConjointRun }
}

const ENGINE = 'pricing'

export const pricingModule: FurtherModule = {
  id: 'pricing',
  name: 'Price optimization',
  short: 'Pricing',
  to: '/pricing',
  text: 'Demand curves from price tests, the price with the highest profit',
}

export const pricingQuestion = 'How does demand react to the price, and which price earns most?'

export const pricingTabs = [
  { to: '/pricing/price-tests', label: 'Price tests' },
  { to: '/pricing/from-conjoint', label: 'From the conjoint study' },
]

// ---------------------------------------------------------------------------
// Price tests (runs PR-01 to PR-03, one per product)
// ---------------------------------------------------------------------------

export const priceTestRunIds = ['PR-01', 'PR-02', 'PR-03'] as const
export type PriceTestRunId = (typeof priceTestRunIds)[number]

const runTimes: Record<PriceTestRunId | 'PR-04', string> = { 'PR-01': '14:05', 'PR-02': '14:21', 'PR-03': '14:26', 'PR-04': '14:48' }
const perStoreWeek = 'per store and week'
/** Two forms count as fitting equally well when the share of the differences they explain is this close. */
const CLOSE_FIT = 0.02

/** The engine's own two sentences on a form of the demand curve: what it does, and when to choose it. */
const formOptions = settingHelp(ENGINE, 'model').options ?? []
function optionHelp(form: DemandForm): string {
  const option = formOptions.find((item) => item.value === form)
  return option ? `${option.what_it_does} ${option.when_to_choose}` : ''
}

/** What the screen shows for the price tests of one product. */
export function priceTestScreen(id: PriceTestRunId) {
  const run = results.runs[id]
  const byRank = [...run.forms].sort((a, b) => a.rank - b.rank)
  const [top, second, third] = byRank
  const best = top.optimum
  const [below, above] = run.near_the_best_price
  const tested = `${chf(run.price_range.lowest)} to ${chf(run.price_range.highest)}`
  const centimes = Math.round(Math.abs(top.optimum.optimal_price - second.optimum.optimal_price) * 100)
  const closeFit = top.fit.r_squared - second.fit.r_squared < CLOSE_FIT
  const lower = (label: string) => label.toLowerCase()

  return {
    runId: id as FurtherRunId,
    product: run.product,
    unitCost: run.unit_cost,
    summary: `Price tests, ${run.n_observations} store weeks, ${lower(top.label)} curve, unit cost ${chf(run.unit_cost)}. Run on Thu 8 Oct at ${runTimes[id]}.`,
    headline: `For ${run.product}, profit is highest at about ${chf(best.optimal_price)}: ${chf(best.profit, 0)} ${perStoreWeek}.`,
    stats: [
      { value: chf(best.optimal_price), label: 'price with the highest profit', note: `${top.label} curve, unit cost ${chf(run.unit_cost)}` },
      {
        value: chf(best.profit, 0),
        label: `profit ${perStoreWeek}`,
        note: `${chf(run.at_mean_price.profit_gain_at_optimal_price, 0)} more than at the mean tested price (${chf(run.at_mean_price.price)})`,
      },
      { value: thousands(best.quantity), label: `units sold ${perStoreWeek}`, note: `Margin of ${chf(best.margin_per_unit)} on each unit` },
      {
        value: fixed(best.elasticity, 1),
        label: 'price elasticity at this price',
        note: `A price 1% higher sells ${Math.abs(best.elasticity).toFixed(1)}% fewer units`,
      },
    ],
    forms: run.forms,
    byRank,
    chosen: top,
    priceRange: run.price_range,
    observations: run.observations,
    byPrice: run.by_price,
    demandChart: {
      title: 'Demand: what the price tests show',
      note: `${run.n_observations} store weeks at ${run.n_prices} prices from ${tested}. Each point is one store and one week.`,
      yLabel: `Units sold ${perStoreWeek}`,
    },
    profitChart: {
      title: 'Profit by price',
      note: `Price minus unit cost (${chf(run.unit_cost)}), times the units the ${lower(top.label)} curve expects. Revenue is shown next to it.`,
      yLabel: `CHF ${perStoreWeek}`,
      near: `${Math.round(Math.abs(below.change) * 100)} centimes less (${chf(below.price)}) gives away ${pct(below.profit_lost, 1)} of the profit, ${Math.round(above.change * 100)} centimes more (${chf(above.price)}) ${pct(above.profit_lost, 1)}.`,
    },
    untestedLabel: 'not tested',
    howToRead: run.how_to_read,

    /** The teaching trap: which form of the curve to trust, and where. */
    trap: {
      title: closeFit ? `Two curves fit these tests equally well. Outside the tested prices they part.` : 'A curve is only known inside the tested prices',
      text: `${top.label} and ${lower(second.label)} ${closeFit ? 'fit' : 'are the two forms that fit'} the ${run.n_observations} store weeks ${closeFit ? 'almost equally well' : 'best'}: ${pct(top.fit.r_squared, 1) === pct(second.fit.r_squared, 1) ? `both explain ${pct(top.fit.r_squared, 1)}` : `they explain ${pct(top.fit.r_squared, 1)} and ${pct(second.fit.r_squared, 1)}`} of the differences in sales. Their best prices are ${centimes} centimes apart, and taking the second one would give away ${pct(second.on_best_fitting_curve.profit_lost, 1)} of the profit. ${third.label} fits worse (${pct(third.fit.r_squared, 1)}). Its best price is ${chf(third.optimum.optimal_price)}. If the ${lower(top.label)} curve is right, that price gives away ${pct(third.on_best_fitting_curve.profit_lost)} of the profit${third.optimum.inside_observed_prices ? '' : ', and it lies outside the tested prices'}.`,
      engineSays: [...run.warnings, ...run.forms.flatMap((form) => form.optimum_warnings)],
      rightCurve: `Profit if the ${lower(top.label)} curve is right`,
    },

    /** The what-if view: another unit cost, another form, another price. Calculated in the browser. */
    whatIf: {
      title: 'What if the cost or the price were different?',
      text: `Move a slider and watch the profit. The grey line stays at the run ${id}.`,
      cost: { min: 0.5, max: Math.floor(run.price_range.lowest * 10) / 10, step: 0.05 },
      price: { min: Math.ceil(top.curve.price[0] * 20) / 20, max: Math.floor(top.curve.price[top.curve.price.length - 1] * 20) / 20, step: 0.05 },
      formHelp: Object.fromEntries(
        run.forms.map((form) => [form.form, { label: form.label, text: optionHelp(form.form) }]),
      ) as Record<DemandForm, { label: string; text: string }>,
      outside: `Outside the tested prices (${tested}). Demand was never measured there, so this price is a guess.`,
    },

    details: {
      tests: {
        title: 'The price tests as a table',
        note: `${run.n_prices} prices, ${run.stores_per_price} stores each: mean, lowest and highest units sold`,
      },
      forms: { title: 'The three forms of the demand curve', note: 'Equation, fit, elasticity and best price of each form' },
    },

    coach: {
      note: `The ${lower(top.label)} curve fits best and puts the best price at ${chf(best.optimal_price)}. The ${lower(third.label)} curve says ${chf(third.optimum.optimal_price)}${third.optimum.optimal_price < best.optimal_price ? ', where we would sell far more units. I would go for the lower price to win volume' : ', where the margin on each unit is higher. I would go for the higher price'}.`,
      opening: [
        {
          from: 'coach',
          text: `${third.optimum.optimal_price < best.optimal_price ? 'You argue with volume' : 'You argue with the margin'}. The question on this screen is profit. Look at the table in "Watch out": what does ${chf(third.optimum.optimal_price)} earn if the best-fitting curve is right? And how well does the curve that recommends it fit?`,
        },
      ],
      turns: [
        {
          student: `It would give away ${pct(third.on_best_fitting_curve.profit_lost)} of the profit. That curve explains only ${pct(third.fit.r_squared, 1)} of the differences in sales, against ${pct(top.fit.r_squared, 1)} for the ${lower(top.label)} curve.`,
          coach: `Good. Now the two curves that fit almost equally well: their best prices are ${centimes} centimes apart. How much profit is at stake between them, and which prices would you test in the stores next?`,
        },
      ],
    } satisfies CoachScript,
  }
}

export const priceTestProducts = priceTestRunIds.map((id) => ({ value: id, label: results.runs[id].product }))

// ---------------------------------------------------------------------------
// From the conjoint study (run PR-04)
// ---------------------------------------------------------------------------

const conjoint = results.runs['PR-04']
const storeTests = results.runs['PR-01']
const storeBest = [...storeTests.forms].sort((a, b) => a.rank - b.rank)[0]
const perWeek = 'per week'
const elasticities = conjoint.points.map((point) => point.elasticity_to_next_price).filter((value): value is number => value !== null)
const designText = Object.entries(conjoint.levels)
  .filter(([attribute]) => attribute !== 'Price')
  .map(([, level]) => level)
  .join(', ')

export const conjointPricing = {
  runId: 'PR-04' as FurtherRunId,
  fromRun: conjoint.estimates_from_run,
  product: conjoint.product,
  designText,
  unitCost: conjoint.unit_cost,
  summary: `Demand curve from ${conjoint.estimates_from_run}, ${conjoint.points.length} tested prices, unit cost ${chf(conjoint.unit_cost)}, market of ${thousands(conjoint.market_size)} ${conjoint.market_size_unit}. Run on Thu 8 Oct at ${runTimes['PR-04']}.`,
  headline: `In the conjoint study, profit is highest at about ${chf(conjoint.optimum.optimal_price)}, close to the highest price that was asked.`,
  stats: [
    { value: chf(conjoint.optimum.optimal_price), label: 'price with the highest profit', note: `Tested prices: ${conjoint.points.map((point) => point.level).join(', ')}` },
    {
      value: chf(conjoint.optimum.profit, 0),
      label: `profit ${perWeek}`,
      note: `Unit cost ${chf(conjoint.unit_cost)}, market of ${thousands(conjoint.market_size)} ${conjoint.market_size_unit}`,
    },
    { value: pct(conjoint.optimum.share), label: 'predicted share at this price', note: `${thousands(conjoint.optimum.quantity)} litres ${perWeek}` },
    {
      value: fixed(conjoint.optimum.elasticity, 1),
      label: 'price elasticity at this price',
      note: `A price 1% higher loses ${Math.abs(conjoint.optimum.elasticity).toFixed(1)}% of the litres`,
    },
  ],
  points: conjoint.points,
  curve: conjoint.curve,
  optimum: conjoint.optimum,
  priceRange: conjoint.price_range,
  marketSize: conjoint.market_size,
  shareChart: {
    title: 'Predicted share by price',
    note: `The design saved in CJ-03 (${designText}) at each of the ${inWords(conjoint.points.length)} tested prices, against the ${inWords(conjoint.n_competitors)} competitors.`,
    yLabel: 'Share of preference, all respondents',
  },
  profitChart: {
    title: 'Profit by price',
    note: `Price minus unit cost (${chf(conjoint.unit_cost)}), times the share, times the market of ${thousands(conjoint.market_size)} ${conjoint.market_size_unit}.`,
    yLabel: `CHF ${perWeek}`,
  },
  untestedLabel: 'not asked',
  howToRead: conjoint.how_to_read,
  trap: {
    title: `Only ${inWords(conjoint.points.length)} prices were asked, and the two sources disagree`,
    text: `This curve is known at ${conjoint.points.map((point) => point.level).join(', ').replace(/, ([^,]*)$/, ' and $1')} only. Between them the engine draws straight lines, and the best price depends on those lines. The store tests of ${storeTests.product} (PR-01) put the best price at ${chf(storeBest.optimum.optimal_price)}, the conjoint study at ${chf(conjoint.optimum.optimal_price)}. The two measure different things: units sold in stores at ${inWords(storeTests.n_prices)} prices, and shares of preference among ${inWords(conjoint.n_competitors + 1)} products in a survey. In the survey buyers react less to the price: the elasticity is between ${fixed(Math.max(...elasticities), 1)} and ${fixed(Math.min(...elasticities), 1)}, against ${fixed(storeBest.elasticity_at_mean_price, 1)} in the stores.`,
    engineSays: conjoint.warnings,
  },
  storeTests: { runId: 'PR-01' as FurtherRunId, product: storeTests.product, price: storeBest.optimum.optimal_price },
}

// ---------------------------------------------------------------------------
// Runs and setup screens
// ---------------------------------------------------------------------------

const none = (value: number | null) => (value === null ? 'None' : chf(value))

export const pricingRuns: Run[] = [
  ...priceTestRunIds.map((id, index): Run => {
    const run = results.runs[id]
    return {
      id,
      module: 'pricing',
      label: `${run.product}, best price`,
      summary: `Price tests, ${run.n_observations} store weeks, ${run.best_form_label.toLowerCase()} curve, unit cost ${chf(run.unit_cost)}`,
      when: `Thu 8 Oct, ${runTimes[id]}`,
      final: index === 0,
      to: `/pricing/price-tests?run=${id}`,
      setupTo: `/pricing/setup/${id}`,
      settings: [
        { name: 'Product', value: run.product },
        { name: 'Demand from', value: `${run.n_observations} store weeks at ${run.n_prices} prices` },
        { name: 'Form of the demand curve', value: `${optionLabel(ENGINE, 'model', run.settings.model)} (best fit of three)` },
        { name: 'Unit cost', value: chf(run.unit_cost) },
        { name: 'Lowest allowed price', value: none(run.settings.min_price) },
        { name: 'Highest allowed price', value: none(run.settings.max_price) },
      ],
    }
  }),
  {
    id: 'PR-04',
    module: 'pricing',
    label: 'Vanilla protein design, from conjoint',
    summary: `Demand curve from ${conjoint.estimates_from_run}, ${conjoint.points.length} tested prices, unit cost ${chf(conjoint.unit_cost)}`,
    when: `Thu 8 Oct, ${runTimes['PR-04']}`,
    to: '/pricing/from-conjoint',
    setupTo: '/pricing/setup/PR-04',
    settings: [
      { name: 'Product', value: designText },
      { name: 'Demand from', value: `Market simulator on ${conjoint.estimates_from_run}, ${conjoint.points.length} tested prices` },
      { name: 'Form of the demand curve', value: 'Straight lines between the tested prices' },
      { name: 'Unit cost', value: chf(conjoint.unit_cost) },
      { name: 'Lowest allowed price', value: none(conjoint.settings.min_price) },
      { name: 'Highest allowed price', value: none(conjoint.settings.max_price) },
      { name: 'Choice rule', value: optionLabel(ENGINE, 'rule', conjoint.settings.rule) },
      { name: 'Market size', value: `${thousands(conjoint.market_size)} ${conjoint.market_size_unit}` },
    ],
  },
]

const steps = [
  'Upload prices and quantities of one product, or use the example data.',
  'Compare the three forms of the demand curve and pick one. The straight line is the safe start.',
  'Read the price elasticity: by how many percent the quantity falls when the price rises by 1%.',
  'Enter the unit cost, and if needed a lowest and a highest price.',
  'Find the price with the highest profit, and read what a little more or less would cost.',
  'Alternative without price tests: build a demand curve from the conjoint study, and optimize the price on it.',
]

export const pricingSetups: SetupInfo[] = [
  ...priceTestRunIds.map((id): SetupInfo => {
    const run = results.runs[id]
    return {
      runId: id,
      module: 'pricing',
      engineModule: ENGINE,
      title: 'Set up a price optimization from price tests',
      question: pricingQuestion,
      steps: steps.slice(0, 5),
      inputs: [
        {
          input: 'Price tests',
          form: 'One row per observation, with the price and the quantity sold.',
          here: `${results.data.file}: ${run.product}, ${run.n_observations} store weeks at ${run.n_prices} prices from ${chf(run.price_range.lowest)} to ${chf(run.price_range.highest)}`,
        },
        { input: 'Unit cost', form: 'What one unit costs to make and deliver.', here: chf(run.unit_cost) },
        {
          input: 'Market size (logit form)',
          form: 'How many units the whole market buys.',
          here: 'Not entered: the logit curve estimates its own ceiling',
        },
      ],
      settings: Object.entries(run.settings).map(([key, value]) => ({
        key,
        value,
        note: key === 'model' ? `All three forms were fitted. ${capital(run.best_form_label.toLowerCase())} fits these tests best, so the best price is read from it.` : undefined,
      })),
      calls: 'compare_demand_curves, optimize_price',
      resultsTo: `/pricing/price-tests?run=${id}`,
    }
  }),
  {
    runId: 'PR-04',
    module: 'pricing',
    engineModule: ENGINE,
    title: 'Set up a price optimization from the conjoint study',
    question: pricingQuestion,
    steps: steps.slice(5).concat(steps.slice(3, 5)),
    inputs: [
      {
        input: 'Conjoint estimates',
        form: 'The result of the conjoint module, the own product, the competitors, and the prices to try.',
        here: `Part-worths of ${conjoint.estimates_from_run}, the design saved in CJ-03 (${designText}), ${conjoint.n_competitors} competitors, prices ${conjoint.points.map((point) => point.level).join(', ')}`,
      },
      { input: 'Unit cost', form: 'What one unit costs to make and deliver.', here: chf(conjoint.unit_cost) },
      {
        input: 'Market size',
        form: 'How many units the whole market buys.',
        here: `${thousands(conjoint.market_size)} ${conjoint.market_size_unit}`,
      },
    ],
    settings: Object.entries(conjoint.settings).map(([key, value]) => ({ key, value })),
    calls: 'demand_from_conjoint, optimize_price',
    resultsTo: '/pricing/from-conjoint',
  },
]

/** What the presenting script in README.md says out loud about this module. */
const firstScreen = priceTestScreen('PR-01')
export const pricingReadme = [
  `at about ${chf(firstScreen.chosen.optimum.optimal_price)}`,
  `${pct(firstScreen.byRank[2].on_best_fitting_curve.profit_lost)} of the profit`,
  `${chf(conjoint.optimum.optimal_price)}`,
]
