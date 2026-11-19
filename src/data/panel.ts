/**
 * Panel regression: what the screen of the module shows.
 *
 *   PN-01  the three models side by side (pooled, fixed effects, random effects)
 *   PN-02  the recommended model, fixed effects, in full
 *
 * Both runs name advertising as the variable whose effect carries over, so
 * they describe the same equation and their fixed effects numbers agree.
 * Everything is estimated by the engine (engine_results.json). The what-if
 * view only reads the three fitted models in the browser (src/lib/panel.ts).
 */
import { capital, fixed, pct, signed, signedPct, thousands } from '../lib/format'
import type { Coefficient } from '../lib/panel'
import type { FurtherRunId, Run } from './alpineOat'
import { engineModules, optionLabel } from './moduleKit'
import type { CoachScript, FurtherModule, SetupInfo } from './moduleKit'

// ---------------------------------------------------------------------------
// The engine's results
// ---------------------------------------------------------------------------

export type ModelKind = 'pooled' | 'fixed_effects' | 'random_effects'
export const MODEL_KINDS: ModelKind[] = ['pooled', 'fixed_effects', 'random_effects']

interface Estimate {
  coefficient: number
  standard_error: number
  p_value: number
  lower_95: number
  upper_95: number
}

export interface CoefficientRow extends Coefficient, Estimate {
  term: string
  t: number
  elasticity: number | null
  effect_of_yes: number | null
  meaning: string
}

interface Fit {
  r_squared: number
  r_squared_within: number | null
  residual_sd: number
  degrees_of_freedom: number
}

interface ModelResult {
  kind: ModelKind
  label: string
  settings: { model: string; specification: string; carryover_rate: number | null }
  coefficients: CoefficientRow[]
  elasticities: Record<string, number>
  constant: number
  fit: Fit
  variance_components: { spread_between_units: number; spread_within_units: number; share_of_spread_between_units: number } | null
  warnings: string[]
}

export interface Store {
  unit: string
  mean_sales: number
  mean_price: number
  mean_advertising: number
  lowest_price: number
  highest_price: number
  /** The models work with logarithms, so the place of a store in a chart is the mean of its logarithms. */
  mean_log_sales: number
  mean_log_price: number
  mean_log_advertising: number
  level: number
}

export interface StoreLevel {
  unit: string
  effect: number
  difference_from_average: number
  n_periods: number
  sales_against_average: number
}

const results = engineModules.panel as unknown as {
  data: {
    file: string
    unit_column: string
    period_column: string
    outcome: string
    outcome_meaning: string
    predictors: { key: string; label: string; type: string }[]
    carryover_variable: string
    price_predictor: string
    n_units: number
    n_periods: number
    n_observations: number
    lowest_price: number
    highest_price: number
    mean_log_sales: number
    mean_log_price: number
    share_of_weeks_on_promotion: number
    stores: Store[]
    level_goes_with: { price: number; advertising: number }
  }
  runs: {
    'PN-01': {
      settings: { specification: string; carryover_rate: number | null }
      carryover_variable: string
      carryover_rate_used: number
      coefficients: ({ variable: string; term: string; fixed_minus_random: number } & Record<ModelKind, Estimate>)[]
      units_differ: { f: number; df1: number; df2: number; p_value: number; units_differ: boolean }
      hausman: { statistic: number; degrees_of_freedom: number; p_value: number; random_effects_rejected: boolean }
      recommended_model: ModelKind
      recommended_model_label: string
      reason: string
      models: Record<ModelKind, ModelResult>
      how_to_read: string[]
      warnings: string[]
    }
    'PN-02': ModelResult & {
      carryover_variable: string
      carryover: {
        variable: string
        rate: number
        estimated: boolean
        rate_standard_error: number
        rate_lower_95: number
        rate_upper_95: number
        effect_in_the_long_run: number
        effect_in_the_first_period: number
        half_life_periods: number
        rates_tried: { rate: number[]; squared_error: number[] }
        fading: number[]
      }
      unit_effects: StoreLevel[]
      periods_per_unit: { lowest: number; highest: number; balanced: boolean }
      how_to_read: string[]
    }
  }
  changes: { changes: Record<string, number>; by_model: Record<ModelKind, { sales_change: number; revenue_change: number }> }[]
}

const ENGINE = 'panel'
const { data } = results
const compared = results.runs['PN-01']
const final = results.runs['PN-02']
const carry = final.carryover
const PRICE = data.price_predictor
const ADVERTISING = data.carryover_variable

/** Short names of the predictors for charts and tables. The engine only knows the column names. */
const shortNames: Record<string, string> = { price: 'Price', advertising: 'Advertising', promotion: 'Promotion display' }
export const predictorName = (key: string) => shortNames[key] ?? capital(key)
/** 0.0004 -> "below 0.001", 0.0052 -> "0.005" */
export const pValue = (p: number) => (p < 0.001 ? 'below 0.001' : p.toFixed(3))

export const panelModule: FurtherModule = {
  id: 'panel',
  name: 'Panel regression',
  short: 'Panel',
  to: '/panel',
  text: 'What price, advertising and promotion do to sales, when the same stores are followed over time',
}

export const panelQuestion = 'What do price, advertising and promotions do to sales, when the same stores are followed over time?'

// ---------------------------------------------------------------------------
// The screen (run PN-02, with PN-01 for the comparison of the three models)
// ---------------------------------------------------------------------------

const finalOf = (variable: string) => final.coefficients.find((row) => row.variable === variable) as CoefficientRow
const modelOf = (kind: ModelKind, variable: string) => compared.models[kind].coefficients.find((row) => row.variable === variable) as CoefficientRow
const price = finalOf(PRICE)
const advertising = finalOf(ADVERTISING)
const yesNo = final.coefficients.find((row) => row.yes_no) as CoefficientRow
const pooledPrice = modelOf('pooled', PRICE)
const fixedPrice = modelOf('fixed_effects', PRICE)
const randomPrice = modelOf('random_effects', PRICE)
/** The first change the engine worked out for all three models: a higher price and nothing else. */
const example = results.changes.find((item) => item.changes[PRICE] > 0 && Object.entries(item.changes).every(([name, value]) => name === PRICE || value === 0)) ?? results.changes[0]
const top = final.unit_effects[0]
const bottom = final.unit_effects[final.unit_effects.length - 1]

/** In plain words what one coefficient of the final model says. */
function inPlainWords(row: CoefficientRow): string {
  if (row.yes_no) return `A week on a promotion display: ${pct(row.effect_of_yes ?? 0, 1)} more units sold`
  const size = Math.abs(row.coefficient).toFixed(2)
  if (row.variable === ADVERTISING) {
    return `1% more advertising: ${size}% more units sold in the long run, ${carry.effect_in_the_first_period.toFixed(2)}% in the first week`
  }
  return `A ${predictorName(row.variable).toLowerCase()} 1% higher: ${size}% ${row.coefficient < 0 ? 'fewer' : 'more'} units sold`
}

export const panelScreen = {
  runId: 'PN-02' as FurtherRunId,
  otherRunId: 'PN-01' as FurtherRunId,
  summary: `${data.n_units} stores over ${data.n_periods} weeks (${thousands(data.n_observations)} store weeks). Units sold explained by price, advertising and promotion, in the log-log form, with fixed effects and the carry-over of advertising. Run on Fri 30 Oct at 14:22.`,
  headline: `Within a store, a price 1% higher goes with ${Math.abs(price.coefficient).toFixed(1)}% fewer units sold. Across all store weeks at once it looks like only ${Math.abs(pooledPrice.coefficient).toFixed(1)}%, because the stores that sell more also charge more.`,
  stats: [
    { value: fixed(price.coefficient), label: 'price elasticity', note: `95% range: ${fixed(price.lower_95)} to ${fixed(price.upper_95)}` },
    { value: signed(advertising.coefficient), label: 'advertising elasticity in the long run', note: `${signed(carry.effect_in_the_first_period)} in the first week` },
    { value: signedPct(yesNo.effect_of_yes ?? 0), label: 'units sold in a week on a promotion display', note: 'At the same price and advertising' },
    {
      value: pct(carry.rate),
      label: 'of an advertising effect is still there a week later',
      note: `95% range: ${pct(carry.rate_lower_95)} to ${pct(carry.rate_upper_95)}`,
    },
  ],

  pricePredictor: PRICE,
  stores: data.stores,
  overall: { meanLogPrice: data.mean_log_price, meanLogSales: data.mean_log_sales, lowestPrice: data.lowest_price, highestPrice: data.highest_price },
  models: compared.models,
  recommended: compared.recommended_model,

  /** The recommended model in full (run PN-02). */
  finalCard: {
    title: `The recommended model: ${final.label.toLowerCase()}`,
    note: `Every store gets its own level, and only the changes within a store from week to week are used. The model explains ${pct(final.fit.r_squared_within ?? 0)} of the ups and downs of sales within a store.`,
    rows: final.coefficients.map((row) => ({ ...row, name: predictorName(row.variable), plain: inPlainWords(row) })),
    limits: [
      'Fixed effects only take out what is constant for a store, such as its location. They do not prove cause and effect.',
      'The ranges assume that the noise has no pattern over time. If one good week tends to follow another, they are too narrow.',
    ],
    howToRead: final.how_to_read,
  },

  /** The teaching trap: the pooled model mistakes differences between stores for a price effect. */
  trap: {
    title: `The pooled model sees a price elasticity of ${fixed(pooledPrice.coefficient)}. Within a store it is ${fixed(fixedPrice.coefficient)}.`,
    text: `The pooled model treats the ${thousands(data.n_observations)} store weeks as if they all came from one store. But the stores differ: some sell far more than others at the same price, and these stores also charge more (the level of a store and its average price go together, correlation ${data.level_goes_with.price.toFixed(2)}). The pooled model takes this for customers who hardly react to the price. Fixed effects give every store its own level and use only what changes within a store. It matters for the decision. For a price ${pct(example.changes[PRICE])} higher, the pooled model expects ${signedPct(example.by_model.pooled.revenue_change, 1)} revenue and fixed effects ${signedPct(example.by_model.fixed_effects.revenue_change, 1)}. Advertising is overstated in the same way: ${signed(modelOf('pooled', ADVERTISING).coefficient)} instead of ${signed(modelOf('fixed_effects', ADVERTISING).coefficient)}.`,
    chartTitle: 'The three models side by side',
    chartNote: 'Coefficient of each predictor with its 95% range. The line is zero: no effect.',
    whyTitle: `Why: the ${data.n_units} stores`,
    whyNote: 'Each point is one store at its average price and its average sales. The short line through it shows how its own sales follow its own price. The long line is what the pooled model sees.',
    tests: [
      {
        question: 'Do the stores differ in their level?',
        answer: compared.units_differ.units_differ ? 'Yes' : 'No',
        detail: `F test: ${thousands(compared.units_differ.f)}, p ${pValue(compared.units_differ.p_value)}`,
        meaning: 'If they did not, the pooled model would be enough.',
      },
      {
        question: 'May random effects be used?',
        answer: compared.hausman.random_effects_rejected ? 'No' : 'Yes',
        detail: `Hausman test: ${compared.hausman.statistic.toFixed(1)} with ${compared.hausman.degrees_of_freedom} degrees of freedom, p ${pValue(compared.hausman.p_value)}`,
        meaning: 'Random effects need levels that have nothing to do with price, advertising and promotion.',
      },
    ],
    recommended: compared.recommended_model_label,
    reason: compared.reason,
    engineSays: compared.how_to_read,
  },

  /** The carry-over of advertising (run PN-02). */
  carryCard: {
    title: 'Advertising keeps working after its week',
    note: `The engine tried ${carry.rates_tried.rate.length} carry-over rates and kept the one with the smallest error: ${carry.rate.toFixed(2)}. Half of the effect of a week of advertising has then arrived after ${carry.half_life_periods.toFixed(1)} weeks.`,
    rate: carry.rate,
    range: [carry.rate_lower_95, carry.rate_upper_95] as [number, number],
    tried: carry.rates_tried,
    first: carry.effect_in_the_first_period,
    longRun: carry.effect_in_the_long_run,
    periods: carry.fading.length,
    searchTitle: 'The error of the model for every carry-over rate',
    fadingTitle: 'What 1% more advertising in one week adds to sales',
    fadingNote: `In its own week ${carry.effect_in_the_first_period.toFixed(3)}%, a week later ${carry.fading[1].toFixed(3)}%. All weeks together: ${carry.effect_in_the_long_run.toFixed(3)}%, the elasticity in the long run.`,
  },

  /** The what-if view: the same change, asked of each of the three models (run PN-01). */
  whatIf: {
    title: 'Ask each model about a change',
    text: 'The three models answer the same question. A change of the price or of advertising is meant to last, and the answer is the change of sales in the long run. Promotion is one week on a display.',
    price: { min: -20, max: 20, step: 1 },
    advertising: { min: -50, max: 100, step: 5 },
    start: { price: Math.round(example.changes[PRICE] * 100), advertising: 0, promotion: false },
    promotionKey: yesNo.variable,
    advertisingKey: ADVERTISING,
  },

  details: {
    stores: {
      title: 'The level of every store',
      note: 'What a store sells more or less than the average store, at the same price, advertising and promotion',
      text: `${top.unit} sells ${pct(top.sales_against_average)} more than the average store, and ${bottom.unit} ${pct(Math.abs(bottom.sales_against_average))} less. Price, advertising and promotion explain none of this. It is what fixed effects take out before they estimate the effects.`,
      rows: final.unit_effects,
    },
    models: {
      title: 'The three models in numbers',
      note: 'Coefficients with standard errors, and how well each model fits',
      between: compared.models.random_effects.variance_components?.share_of_spread_between_units ?? null,
      fitNote: 'Fixed effects explain the most of all differences in sales, because the level of each store counts as explained. The other two models count only what price, advertising and promotion explain.',
    },
    rates: {
      title: 'The search for the carry-over rate',
      note: `${carry.rates_tried.rate.length} rates, with the squared error of the model for each`,
    },
  },

  coach: {
    note: `The pooled regression gives a price elasticity of ${fixed(pooledPrice.coefficient)}. Customers hardly react to the price. So I would raise the price: revenue stays about the same, and the margin grows.`,
    opening: [
      {
        from: 'coach',
        text: 'Before you raise the price: the comparison holds two more estimates of the same elasticity. What are they, and which of the three models does the engine recommend?',
      },
    ],
    turns: [
      {
        student: `Fixed effects give ${fixed(fixedPrice.coefficient)} and random effects ${fixed(randomPrice.coefficient)}. The engine recommends ${compared.recommended_model_label.toLowerCase()}, because the stores differ and their levels are related to the predictors.`,
        coach: `Right. So what did the pooled model take for customers who do not react to the price? Look at the chart of the ${data.n_units} stores. Then ask each model under "What if" what a price ${pct(example.changes[PRICE])} higher does to revenue.`,
      },
    ],
  } satisfies CoachScript,
}

// ---------------------------------------------------------------------------
// Runs and setup screens
// ---------------------------------------------------------------------------

const predictorsListed = data.predictors.map((predictor) => predictor.key).join(', ')
const sharedSettings = [
  { name: 'Panel', value: `${data.n_units} stores over ${data.n_periods} weeks` },
  { name: 'Outcome', value: `${capital(data.outcome)} (units sold)` },
  { name: 'Predictors', value: predictorsListed },
  { name: 'Form of the equation', value: optionLabel(ENGINE, 'specification', compared.settings.specification) },
  { name: 'Carry-over', value: `${ADVERTISING}, rate estimated: ${carry.rate.toFixed(2)}` },
]

export const panelRuns: Run[] = [
  {
    id: 'PN-01',
    module: 'panel',
    label: 'Three models side by side',
    summary: `Pooled, fixed effects and random effects on ${thousands(data.n_observations)} store weeks`,
    when: 'Fri 30 Oct, 14:05',
    to: '/panel',
    setupTo: '/panel/setup/PN-01',
    settings: [{ name: 'Model', value: 'All three, compared' }, ...sharedSettings],
  },
  {
    id: 'PN-02',
    module: 'panel',
    label: 'Fixed effects in full',
    summary: `The recommended model: every store with its own level, and the carry-over of advertising`,
    when: 'Fri 30 Oct, 14:22',
    final: true,
    to: '/panel',
    setupTo: '/panel/setup/PN-02',
    settings: [{ name: 'Model', value: optionLabel(ENGINE, 'model', final.settings.model) }, ...sharedSettings],
  },
]

const steps = [
  'Upload the panel: one row per unit and period, for example store and week.',
  'Choose the outcome (sales) and the predictors (price, advertising, promotion).',
  'Keep the log-log form to read the coefficients as elasticities.',
  'Compare the three models. Read the two tests and the recommendation.',
  'Read the coefficients of the recommended model with their ranges.',
  'For advertising, switch on the carry-over and read the rate, the effect in the first period and in the long run.',
  'With fixed effects, look at the level of every unit: which stores sell more than their price and advertising explain?',
]

export const panelSetups: SetupInfo[] = (['PN-01', 'PN-02'] as const).map((id): SetupInfo => {
  const run = results.runs[id]
  return {
    runId: id,
    module: 'panel',
    engineModule: ENGINE,
    title: id === 'PN-01' ? 'Set up a comparison of panel models' : 'Set up a panel regression',
    question: panelQuestion,
    steps,
    inputs: [
      {
        input: 'Panel table',
        form: 'One row per unit and period, with the outcome and the predictors.',
        here: `${data.file}: ${thousands(data.n_observations)} rows, ${data.outcome_meaning}. Predictors: ${data.predictors.map((predictor) => predictor.label).join('; ')}.`,
      },
      {
        input: 'Unit column, period column',
        form: 'Which column names the unit and which the period.',
        here: `${capital(data.unit_column)} (${data.n_units} stores) and ${data.period_column} (${data.n_periods} weeks). Every store has all ${data.n_periods} weeks.`,
      },
      {
        input: 'Carry-over variable (optional)',
        form: 'One predictor whose effect lasts into later periods, usually advertising.',
        here: `${capital(ADVERTISING)}.${id === 'PN-01' ? ' The rate is estimated once, with fixed effects, and then used for all three models.' : ''}`,
      },
    ],
    settings: Object.entries(run.settings).map(([key, value]) => ({
      key,
      value,
      note: key === 'carryover_rate' && value === null ? `Left empty. The engine estimated ${carry.rate.toFixed(2)} from the data.` : undefined,
    })),
    calls: id === 'PN-01' ? 'compare_panel_models' : 'fit_panel',
    resultsTo: '/panel',
  }
})

/** What the presenting script in README.md says out loud about this module. */
export const panelReadme = [
  `a price elasticity of ${fixed(pooledPrice.coefficient)}`,
  `it is ${fixed(fixedPrice.coefficient)}`,
  `${signedPct(example.by_model.pooled.revenue_change, 1)} revenue`,
  `${signedPct(example.by_model.fixed_effects.revenue_change, 1)}`,
  `${pct(carry.rate)} of it`,
]
