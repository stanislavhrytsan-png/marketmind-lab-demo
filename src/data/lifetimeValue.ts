/**
 * Customer lifetime value: what the lifetime value screen shows.
 *
 *   LV-01  retention per segment from the cohort data, and the value of the
 *          current subscribers per segment
 *   LV-02  the same subscribers with one retention rate for everyone
 *
 * Every number is a result of the engine (engine_results.json). The what-if
 * view applies the engine's formula to other numbers in the browser
 * (src/lib/lifetimeValue.ts), and `npm run check` compares the two.
 */
import { capital, chf, inWords, listed, pct, signedPct, thousands } from '../lib/format'
import type { Convention } from '../lib/lifetimeValue'
import type { FurtherRunId, Run } from './alpineOat'
import { engineModules, optionLabel, settingHelp } from './moduleKit'
import type { CoachScript, FurtherModule, SetupInfo } from './moduleKit'

// ---------------------------------------------------------------------------
// The engine's results
// ---------------------------------------------------------------------------

export interface SegmentValue {
  segment: string
  n_customers: number
  mean_margin: number
  retention_rate: number
  expected_lifetime: number
  margin_multiple: number
  lifetime_value: number
  customer_equity: number
  share_of_customers: number
  share_of_equity: number
  acquisition_cost: number
  net_value_of_a_new_customer: number
  value_to_cost_ratio: number
  payback_periods: number | null
  worth_acquiring: boolean
}

interface ValueRun {
  retention_from: string
  settings: { first_margin: Convention; horizon: number | null }
  discount_rate: number
  n_customers: number
  customer_equity: number
  mean_lifetime_value: number
  segments: SegmentValue[]
  how_to_read: string[]
  warnings: string[]
  equity_against_by_segment?: number
}

export interface RetentionGroup {
  segment: string | null
  retention_rate: number
  standard_error: number
  n_at_risk: number
  n_retained: number
  expected_lifetime: number
  same_rate_at_every_age: { p_value: number; constant: boolean }
  by_age: { from_period: number[]; at_risk: number[]; retained: number[]; retention_rate: number[] }
}

interface FormulaCase {
  first_margin: Convention
  margin: number
  retention_rate: number
  discount_rate: number
  acquisition_cost: number
  lifetime_value: number
  formula: string
  payback_periods: number | null
  worth_acquiring: boolean
}

const results = engineModules.lifetime_value as unknown as {
  data: {
    cohorts_file: string
    subscribers_file: string
    period: string
    n_subscribers: number
    n_cohorts: number
    first_cohort: string
    last_cohort: string
    discount_rate: number
    segments: string[]
    cohort_table: { cohort: string; started: number; still_active: (number | null)[]; share_still_active: (number | null)[] }[]
  }
  runs: Record<'LV-01' | 'LV-02', ValueRun>
  retention: { overall: RetentionGroup; segments: RetentionGroup[]; how_to_read: string[]; warnings: string[] }
  formula: { conventions: Convention[]; segments: { segment: string; by_convention: FormulaCase[] }[]; how_to_read: string[] }
}

const ENGINE = 'lifetime_value'
const { data, retention } = results
const bySegment = results.runs['LV-01']
const oneRate = results.runs['LV-02']
const perYear = 'per year'

export const lifetimeValueModule: FurtherModule = {
  id: 'lifetimeValue',
  name: 'Customer lifetime value',
  short: 'Lifetime value',
  to: '/lifetime-value',
  text: 'What a customer is worth over the whole relationship, retention from cohorts, customer equity',
}

export const lifetimeValueQuestion =
  'What is a customer worth over the whole relationship, and is a new customer worth the cost of winning one?'

// ---------------------------------------------------------------------------
// The screen (run LV-01, with LV-02 next to it)
// ---------------------------------------------------------------------------

const segments = bySegment.segments
/** The segments by the value of a new subscriber, highest first. */
const byValue = [...segments].sort((a, b) => b.lifetime_value - a.lifetime_value)
const best = byValue[0]
/** A segment where a new subscriber costs more than they are worth, if there is one. */
const trapSegment = segments.find((segment) => !segment.worth_acquiring)
const trapWithOneRate = trapSegment ? oneRate.segments.find((segment) => segment.segment === trapSegment.segment)! : undefined
const overallAges = retention.overall.by_age.retention_rate
const largestShare = [...segments].sort((a, b) => b.share_of_equity - a.share_of_equity)[0]
const conventions = settingHelp(ENGINE, 'first_margin').options ?? []

export const lifetimeValueScreen = {
  runId: 'LV-01' as FurtherRunId,
  otherRunId: 'LV-02' as FurtherRunId,
  summary: `Retention from ${data.n_cohorts} yearly cohorts, ${thousands(bySegment.n_customers)} current subscribers in ${inWords(segments.length)} segments, discount rate ${pct(bySegment.discount_rate)}. Run on Mon 19 Oct at 11:02.`,
  headline: trapSegment
    ? `A new ${best.segment} subscriber is worth ${chf(best.lifetime_value, 0)}. A new ${trapSegment.segment} subscriber is worth ${chf(trapSegment.lifetime_value, 0)} and costs ${chf(trapSegment.acquisition_cost, 0)} to win.`
    : `A new ${best.segment} subscriber is worth ${chf(best.lifetime_value, 0)}, more than in any other segment.`,
  stats: [
    {
      value: chf(bySegment.customer_equity, 0),
      label: 'customer equity',
      note: `What the ${thousands(bySegment.n_customers)} current subscribers are worth from now on`,
    },
    {
      value: pct(largestShare.share_of_equity),
      label: `of that value is ${largestShare.segment}`,
      note: `They are ${pct(largestShare.share_of_customers)} of the subscribers`,
    },
    {
      value: `${pct(Math.min(...segments.map((segment) => segment.retention_rate)))} to ${pct(Math.max(...segments.map((segment) => segment.retention_rate)))}`,
      label: 'stay from one year to the next',
      note: segments.map((segment) => `${segment.segment} ${pct(segment.retention_rate)}`).join(', '),
    },
    {
      value: chf(bySegment.mean_lifetime_value, 0),
      label: 'value of an average subscriber',
      note: `Margins of all later years in today's money, at ${pct(bySegment.discount_rate)} ${perYear}`,
    },
  ],
  segments,
  discountRate: bySegment.discount_rate,
  convention: bySegment.settings.first_margin,
  valueChart: {
    title: 'A new subscriber: worth against cost',
    note: `Lifetime value of an average new subscriber of each segment, next to what it costs to win one. Margin earned ${optionLabel(ENGINE, 'first_margin', bySegment.settings.first_margin).toLowerCase()}.`,
  },
  equityChart: {
    title: 'Who holds the value',
    note: 'The share of each segment among the subscribers, and in the customer equity.',
  },
  retentionChart: {
    title: 'Retention by age of the subscription',
    note: 'The share of subscribers who are still there one year later, by how long they have been subscribers.',
    yLabel: 'Share that stays for another year',
    xLabel: 'Years as a subscriber',
    all: 'All subscribers',
  },
  retention,
  howToRead: [...retention.how_to_read, ...bySegment.how_to_read],

  /** The teaching trap: the segment that costs more than it is worth, and how one retention rate hides it. */
  trap: trapSegment
    ? {
        title: `One retention rate for everyone would hide that ${trapSegment.segment} does not pay`,
        text: `A new ${trapSegment.segment} subscriber is worth ${chf(trapSegment.lifetime_value, 0)} and costs ${chf(trapSegment.acquisition_cost, 0)} to win, because only ${pct(trapSegment.retention_rate)} stay from one year to the next. With the one retention rate of all subscribers (${pct(retention.overall.retention_rate)}), the same subscriber seems worth ${chf(trapWithOneRate!.lifetime_value, 0)}, and the customer equity comes out ${signedPct(oneRate.equity_against_by_segment ?? 0)} off. The rate of all subscribers even seems to rise with age, from ${pct(overallAges[0])} in the first year to ${pct(overallAges[overallAges.length - 1])} in the last, although no segment becomes more loyal: the disloyal leave first, and the loyal remain.`,
        segment: trapSegment.segment,
        rows: segments.map((segment) => {
          const other = oneRate.segments.find((item) => item.segment === segment.segment)!
          return { segment: segment.segment, own: segment, oneRate: other, flips: segment.worth_acquiring !== other.worth_acquiring }
        }),
        equity: { own: bySegment.customer_equity, oneRate: oneRate.customer_equity },
        overallRate: retention.overall.retention_rate,
        engineSays: [...bySegment.warnings, ...retention.warnings],
      }
    : null,

  /** The what-if view: the formula for other numbers. Calculated in the browser. */
  whatIf: {
    title: 'The formula: move one number and watch the value',
    text: 'The value of one customer from a margin, a retention rate and a discount rate. Start from the average new subscriber of a segment.',
    presets: segments.map((segment) => ({
      name: segment.segment,
      margin: segment.mean_margin,
      retention: segment.retention_rate,
      cost: segment.acquisition_cost,
    })),
    discount: bySegment.discount_rate,
    ranges: {
      margin: { min: 10, max: 300, step: 5 },
      retention: { min: 0.2, max: 0.95, step: 0.01 },
      discount: { min: 0, max: 0.25, step: 0.01 },
      cost: { min: 0, max: 400, step: 5 },
    },
    conventions: conventions.map((option) => ({
      value: option.value as Convention,
      label: option.label,
      short: { start: 'Start of the year', end: 'End of the year', end_if_retained: 'End, if they stayed' }[option.value as Convention],
      text: `${option.what_it_does} ${option.when_to_choose}`,
    })),
    years: 10,
    howToRead: results.formula.how_to_read,
  },

  details: {
    cohorts: {
      title: 'The cohort table',
      note: `${data.n_cohorts} yearly intakes from ${data.first_cohort} to ${data.last_cohort}: the share that is still subscribed at each age`,
      rows: data.cohort_table,
      text: 'Each row is the intake of one year. Read across: how many of them are still subscribers one, two, three years later.',
    },
    retention: {
      title: 'Retention rate per segment',
      note: `With the test of whether the rate is the same at every age`,
      rows: [...retention.segments, retention.overall],
    },
    values: { title: 'The value of every segment', note: 'Subscribers, margin, retention, lifetime value, cost and customer equity' },
    conventions: {
      title: 'Three conventions, three values',
      note: 'When the margin is earned changes the lifetime value of the same customer',
      rows: results.formula.segments.map((segment) => ({
        segment: segment.segment,
        cost: segment.by_convention[0].acquisition_cost,
        values: segment.by_convention.map((item) => ({ convention: item.first_margin, value: item.lifetime_value, worth: item.worth_acquiring })),
      })),
      labels: conventions.map((option) => option.label),
      formulas: results.formula.segments[0].by_convention.map((item) => item.formula),
      text: 'Textbooks use different conventions. Say which one you use whenever you report a lifetime value.',
    },
  },

  coach: {
    note: `Customer equity is ${chf(bySegment.customer_equity, 0)}. ${trapSegment ? `${trapSegment.segment} subscribers are ${pct(trapSegment.share_of_customers)} of our subscribers and each one brings a margin of ${chf(trapSegment.mean_margin, 0)} a year, so the company should win more of them to grow.` : 'The company should win more subscribers in every segment.'}`,
    opening: [
      {
        from: 'coach',
        text: trapSegment
          ? `You count the margin of one year. What is a new ${trapSegment.segment} subscriber worth over the whole relationship, and what does it cost to win one?`
          : 'You count the margin of one year. What is a new subscriber worth over the whole relationship in each segment?',
      },
    ],
    turns: [
      {
        student: trapSegment
          ? `Worth ${chf(trapSegment.lifetime_value, 0)}, because only ${pct(trapSegment.retention_rate)} stay from year to year. Winning one costs ${chf(trapSegment.acquisition_cost, 0)}, so every new one loses about ${chf(-trapSegment.net_value_of_a_new_customer, 0)}.`
          : `Between ${chf(byValue[byValue.length - 1].lifetime_value, 0)} and ${chf(best.lifetime_value, 0)}.`,
        coach:
          'Right. Now use the sliders under "What if". Which single change would make this segment worth winning: a lower acquisition cost or a higher retention rate? And which of the two can the company really move?',
      },
    ],
  } satisfies CoachScript,
}

// ---------------------------------------------------------------------------
// Runs and setup screens
// ---------------------------------------------------------------------------

const valueSettings = (run: ValueRun) => [
  { name: 'Subscribers', value: thousands(run.n_customers) },
  { name: 'Retention rate from', value: run.retention_from === 'each segment' ? 'The cohorts of each segment' : `All cohorts together (${pct(run.segments[0].retention_rate)})` },
  { name: 'Discount rate', value: `${pct(run.discount_rate)} ${perYear}` },
  { name: 'Acquisition cost', value: listed(run.segments.map((segment) => chf(segment.acquisition_cost, 0))) },
  { name: 'When the margin is earned', value: optionLabel(ENGINE, 'first_margin', run.settings.first_margin) },
  { name: 'Years counted', value: run.settings.horizon === null ? 'The whole relationship' : String(run.settings.horizon) },
]

export const lifetimeValueRuns: Run[] = [
  {
    id: 'LV-01',
    module: 'lifetimeValue',
    label: 'Subscribers, value by segment',
    summary: `Retention per segment from ${data.n_cohorts} cohorts, ${thousands(bySegment.n_customers)} subscribers, discount rate ${pct(bySegment.discount_rate)}`,
    when: 'Mon 19 Oct, 11:02',
    final: true,
    to: '/lifetime-value',
    setupTo: '/lifetime-value/setup/LV-01',
    settings: valueSettings(bySegment),
  },
  {
    id: 'LV-02',
    module: 'lifetimeValue',
    label: 'One retention rate for all',
    summary: `The same subscribers with the retention rate of all cohorts together (${pct(retention.overall.retention_rate)})`,
    when: 'Mon 19 Oct, 11:15',
    to: '/lifetime-value',
    setupTo: '/lifetime-value/setup/LV-02',
    settings: valueSettings(oneRate),
  },
]

const steps = [
  'Start with the formula: enter a margin per period, a retention rate and a discount rate, and read the lifetime value.',
  'Move each of the three numbers and watch the value. The retention rate matters most.',
  'Add the acquisition cost: is a new customer worth it, and after how many periods is the cost paid back?',
  'Estimate the retention rate from cohort data, for all customers and per segment.',
  'Check whether the retention rate is the same at every age. The formula assumes it.',
  'Value all current customers per segment, and read the customer equity.',
]

export const lifetimeValueSetups: SetupInfo[] = (['LV-01', 'LV-02'] as const).map((id): SetupInfo => {
  const run = results.runs[id]
  return {
    runId: id,
    module: 'lifetimeValue',
    engineModule: ENGINE,
    title: 'Set up the value of the current customers',
    question: lifetimeValueQuestion,
    steps,
    inputs: [
      {
        input: 'Cohort table',
        form: 'One row per cohort and period, with the number of customers still active. A segment column if wanted.',
        here: `${data.cohorts_file}: ${data.n_cohorts} yearly intakes from ${data.first_cohort} to ${data.last_cohort}, per segment. ${capital(run.retention_from === 'each segment' ? 'one retention rate per segment' : 'used as one group: one retention rate for everyone')}`,
      },
      {
        input: 'Current customers',
        form: 'One row per customer with the margin per period and the segment.',
        here: `${data.subscribers_file}: ${thousands(run.n_customers)} subscribers with their margin ${perYear}`,
      },
      { input: 'Discount rate', form: 'One number per period.', here: `${pct(run.discount_rate)} ${perYear}` },
      {
        input: 'Acquisition cost (optional)',
        form: 'One number, or one per segment.',
        here: run.segments.map((segment) => `${segment.segment} ${chf(segment.acquisition_cost, 0)}`).join(', '),
      },
    ],
    settings: Object.entries(run.settings).map(([key, value]) => ({ key, value })),
    calls: 'estimate_retention, lifetime_value_by_segment',
    resultsTo: '/lifetime-value',
  }
})

/** What the presenting script in README.md says out loud about this module. */
export const lifetimeValueReadme = trapSegment
  ? [
      `${chf(trapSegment.lifetime_value, 0)} and costs ${chf(trapSegment.acquisition_cost, 0)}`,
      `${chf(trapWithOneRate!.lifetime_value, 0)}`,
      `${chf(bySegment.customer_equity, 0)}`,
    ]
  : []
