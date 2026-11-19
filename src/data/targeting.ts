/**
 * Predictive modeling (targeting): what the targeting screen shows.
 *
 *   TG-01  logistic regression on last year's subscription campaign
 *   TG-02  a decision tree on the same customers
 *
 * Both models were fitted and tested by the engine (engine_results.json).
 * The browser only repeats the arithmetic of the campaign: profit by the
 * share of the list that gets a letter (src/lib/targeting.ts).
 */
import { capital, chf, inWords, pct, thousands } from '../lib/format'
import type { FurtherRunId, Run } from './alpineOat'
import { engineModules, optionLabel } from './moduleKit'
import type { CoachScript, FurtherModule, SetupInfo } from './moduleKit'

// ---------------------------------------------------------------------------
// The engine's results
// ---------------------------------------------------------------------------

interface Performance {
  n: number
  n_responders: number
  response_rate: number
  confusion_matrix: Record<'predicted_yes_responded' | 'predicted_yes_did_not_respond' | 'predicted_no_responded' | 'predicted_no_did_not_respond', number>
  hit_rate: number
  hit_rate_by_guessing: number
  share_of_responders_found: number
  area_under_curve: number
}

export interface LiftGroups {
  group: number[]
  n: number[]
  lowest_probability: number[]
  highest_probability: number[]
  responders: number[]
  response_rate: number[]
  lift: number[]
  cumulative_n: number[]
  cumulative_share_of_customers: number[]
  cumulative_responders: number[]
  cumulative_share_of_responders: number[]
  cumulative_lift: number[]
}

interface CampaignDepth {
  groups_contacted: number
  share_of_customers: number
  customers_contacted: number
  responders: number
  cost: number
  margin: number
  profit: number
}

interface Campaign {
  cost_per_contact: number
  margin_per_response: number
  break_even_response_rate: number
  n_scored: number
  scaled_to: number
  depths: { groups_contacted: number[]; share_of_customers: number[]; customers_contacted: number[]; responders: number[]; profit: number[] }
  best_depth: CampaignDepth
  contact_everyone: CampaignDepth
  gain_over_contacting_everyone: number
  how_to_read: string[]
  warnings: string[]
}

export interface Coefficient {
  term: string
  variable: string | null
  category: string | null
  label: string | null
  coefficient: number
  standard_error: number
  p_value: number
  odds_ratio: number | null
}

interface TargetingRun {
  kind: 'logistic' | 'tree'
  kind_label: string
  settings: { model: string; test_share: number; seed: number; threshold: number; n_groups: number; max_depth: number; min_leaf: number; n_customers: number }
  n_customers: number
  n_training: number
  n_test: number
  importance: { rank: number; variable: string; label: string; importance: number }[]
  importance_method: string
  performance: { training: Performance; test: Performance }
  by_threshold: {
    threshold: number
    predicted_responders: number
    responders_found: number
    share_of_responders_found: number
    hit_rate: number
    hit_rate_by_guessing: number
  }[]
  lift: { n: number; n_responders: number; response_rate: number; n_groups: number; top_group_lift: number; groups: LiftGroups }
  campaign: Campaign
  coefficients?: Coefficient[]
  fit?: { pseudo_r_squared: number }
  tree?: { n_final_groups: number; depth: number }
  rules?: { rule: string; n: number; response_rate: number }[]
  how_to_read: string[]
  warnings: string[]
}

interface ModelRow {
  kind: string
  label: string
  area_under_curve: number
  area_under_curve_training: number
  hit_rate: number
  hit_rate_by_guessing: number
  top_group_lift: number
  share_of_responders_in_top_two_groups: number
  rank: number
}

const results = engineModules.targeting as unknown as {
  data: {
    file: string
    n_customers: number
    n_responders: number
    response_rate: number
    target_meaning: string
    predictors: { key: string; label: string; type: string }[]
    cost_per_contact: number
    margin_per_response: number
    list_size: number
  }
  runs: Record<'TG-01' | 'TG-02', TargetingRun>
  comparison: { ranked_by: string; models: ModelRow[]; best_model: string; warnings: string[] }
}

const ENGINE = 'targeting'
const { data } = results

export const targetingModule: FurtherModule = {
  id: 'targeting',
  name: 'Predictive modeling',
  short: 'Targeting',
  to: '/targeting',
  text: 'Who responds to a campaign: logistic regression, decision tree, lift and campaign profit',
}

export const targetingQuestion = 'Which customers are likely to respond to a campaign, and how many should be contacted?'

export const targetingRunIds = ['TG-01', 'TG-02'] as const
export type TargetingRunId = (typeof targetingRunIds)[number]

const runTimes: Record<TargetingRunId, string> = { 'TG-01': '09:20', 'TG-02': '09:34' }
/** A weight counts as "no clear effect" when chance alone would give one this large more often than this. */
const CLEAR = 0.05

export const targetingModels = targetingRunIds.map((id) => ({ value: id, label: results.runs[id].kind_label }))

/** The engine's variable names inside a rule of the tree, replaced by the labels of the case. */
function readable(rule: string): string {
  return data.predictors.reduce((text, predictor) => text.split(predictor.key).join(predictor.label.replace(/ \(CHF\)$/, '').toLowerCase()), rule)
}

/** What the screen shows for one of the two models. */
export function targetingScreen(id: TargetingRunId) {
  const run = results.runs[id]
  const { test } = run.performance
  const { lift, campaign } = run
  const groups = lift.groups
  const top = run.importance[0]
  const usual = run.by_threshold[0]
  const lowest = run.by_threshold[run.by_threshold.length - 1]
  const tenths = groups.group.length
  const bestShare = campaign.best_depth.share_of_customers
  const everyone = campaign.contact_everyone
  const predictorCount = data.predictors.length
  const other = results.runs[id === 'TG-01' ? 'TG-02' : 'TG-01']

  return {
    runId: id as FurtherRunId,
    kind: run.kind,
    kindLabel: run.kind_label,
    summary: `${run.kind_label}, ${predictorCount} predictors, ${thousands(run.n_training)} customers to learn from, ${thousands(run.n_test)} kept aside to test. Run on Wed 14 Oct at ${runTimes[id]}.`,
    headline: `The best-rated tenth of the customers responds ${lift.top_group_lift.toFixed(1)} times as often as the average. The strongest sign is "${top.label.toLowerCase()}".`,
    stats: [
      { value: pct(groups.response_rate[0]), label: 'respond in the best-rated tenth', note: `Average of the test customers: ${pct(lift.response_rate, 1)}` },
      {
        value: pct(groups.cumulative_share_of_responders[1]),
        label: 'of all responders are in the best two tenths',
        note: `A random fifth of the list would hold ${pct(groups.cumulative_share_of_customers[1])}`,
      },
      { value: test.area_under_curve.toFixed(2), label: 'area under the curve', note: '0.5 is guessing, 1 is perfect. Measured on customers the model never saw' },
      {
        value: pct(bestShare),
        label: 'of the list is worth a letter',
        note: `${chf(campaign.best_depth.profit, 0)} profit on a list of ${thousands(campaign.scaled_to)}`,
      },
    ],
    lift,
    groups,
    tenths,
    averageRate: lift.response_rate,
    gainsChart: {
      title: 'Responders reached, by share of the list contacted',
      note: 'Customers sorted from the highest to the lowest score. The straight line is a list in random order.',
      mark: `${pct(groups.cumulative_share_of_responders[1])} of the responders in the best ${pct(groups.cumulative_share_of_customers[1])}`,
    },
    liftChart: {
      title: 'Response rate in each tenth of the list',
      note: `From the best-rated tenth on the left to the lowest-rated on the right. The line is the average, ${pct(lift.response_rate, 1)}.`,
    },
    importance: {
      title: 'What the model looks at',
      note: run.importance_method,
      rows: run.importance,
    },
    howToRead: run.how_to_read,
    warnings: run.warnings,

    /** The teaching trap: the hit rate. */
    trap: {
      title: 'The hit rate looks good and tells you nothing',
      text: `The model is right about ${pct(test.hit_rate, 1)} of the customers it never saw. But only ${pct(test.response_rate, 1)} of them responded, so "nobody responds" is right about ${pct(test.hit_rate_by_guessing, 1)}. At the usual threshold of ${usual.threshold} the model marks ${usual.predicted_responders} of ${thousands(test.n)} customers and finds ${usual.responders_found} of the ${test.n_responders} responders. With a threshold of ${lowest.threshold} it finds ${pct(lowest.share_of_responders_found)} of them, and the hit rate falls to ${pct(lowest.hit_rate, 1)}, below guessing. Judge the model by lift and by profit.`,
      rows: run.by_threshold,
      guessing: test.hit_rate_by_guessing,
      responders: test.n_responders,
      engineSays: [run.how_to_read[1], ...run.warnings],
    },

    /** The what-if view: the arithmetic of the campaign for other numbers. Calculated in the browser. */
    whatIf: {
      title: 'How many customers should get the letter?',
      text: `Change what a letter costs, what a new subscriber earns, or the size of the list. The model stays as it is: only the arithmetic of the campaign changes. The grey line stays at the run ${id}.`,
      cost: { min: 0.5, max: 10, step: 0.25 },
      margin: { min: 5, max: 100, step: 1 },
      list: { min: 5000, max: 200000, step: 5000 },
      saved: { cost: campaign.cost_per_contact, margin: campaign.margin_per_response, list: campaign.scaled_to },
      nScored: campaign.n_scored,
      savedProfit: campaign.depths.profit,
      yLabel: 'Profit of the campaign, CHF',
      howToRead: campaign.how_to_read,
    },
    campaign,
    everyone,

    details: {
      groups: { title: 'The ten groups as a table', note: `${thousands(test.n)} test customers, sorted by score: response rate, lift and responders reached` },
      weights: run.coefficients
        ? {
            title: 'The weights of the model',
            note: `${capital(inWords(run.coefficients.filter((row) => row.variable && row.p_value >= CLEAR).length))} of ${run.coefficients.length - 1} weights show no clear effect`,
            rows: run.coefficients.filter((row) => row.variable),
            clear: CLEAR,
            text: 'A positive weight raises the chance of a response, a negative one lowers it. The odds ratio says by how much the odds change when the predictor rises by one unit. About one predictor in twenty looks clear by chance, even when nothing is behind it.',
          }
        : null,
      rules: run.rules
        ? {
            title: `The ${run.tree!.n_final_groups} final groups of the tree`,
            note: `The tree asks up to ${run.tree!.depth} questions in a row. Groups sorted by their response rate`,
            rows: run.rules.map((row) => ({ ...row, rule: readable(row.rule) })),
          }
        : null,
      models: {
        title: 'Logistic regression against the decision tree',
        note: `Ranked by the ${results.comparison.ranked_by}`,
        rows: results.comparison.models,
        otherRun: { id: (id === 'TG-01' ? 'TG-02' : 'TG-01') as TargetingRunId, label: other.kind_label },
      },
    },

    coach: {
      note: `The model is right in ${pct(test.hit_rate)} of the cases on customers it never saw, so it is a good model. I would send the letter to the customers it predicts as responders.`,
      opening: [
        {
          from: 'coach',
          text: `Two questions about the ${pct(test.hit_rate)}. How often would you be right if you said "no response" for every customer? And how many customers does the model predict as responders?`,
        },
      ],
      turns: [
        {
          student: `Saying "no" for everyone is right in ${pct(test.hit_rate_by_guessing, 1)} of the cases, almost the same. And the model marks only ${usual.predicted_responders} of ${thousands(test.n)} customers. That cannot be the campaign.`,
          coach: `Right. So which result tells you how many customers should get the letter? And what does it say when a letter costs ${chf(campaign.cost_per_contact)} and a new subscriber earns ${chf(campaign.margin_per_response, 0)}?`,
        },
      ],
    } satisfies CoachScript,
  }
}

// ---------------------------------------------------------------------------
// Runs and setup screens
// ---------------------------------------------------------------------------

export const targetingRuns: Run[] = targetingRunIds.map((id, index): Run => {
  const run = results.runs[id]
  const tree = run.kind === 'tree'
  return {
    id,
    module: 'targeting',
    label: `Subscription campaign, ${tree ? 'tree' : 'logistic'}`,
    summary: tree
      ? `Decision tree, depth ${run.tree!.depth}, ${run.tree!.n_final_groups} final groups, ${thousands(run.n_customers)} customers`
      : `Logistic regression, ${data.predictors.length} predictors, ${thousands(run.n_customers)} customers`,
    when: `Wed 14 Oct, ${runTimes[id]}`,
    final: index === 0,
    to: `/targeting?run=${id}`,
    setupTo: `/targeting/setup/${id}`,
    settings: [
      { name: 'Customers', value: `${thousands(run.n_customers)} of last year's campaign` },
      { name: 'Predictors', value: String(data.predictors.length) },
      { name: 'Model', value: optionLabel(ENGINE, 'model', run.settings.model) },
      { name: 'Kept aside for testing', value: `${pct(run.settings.test_share)} (${thousands(run.n_test)} customers)` },
      { name: 'Threshold', value: String(run.settings.threshold) },
      { name: 'Depth of the tree', value: tree ? String(run.settings.max_depth) : 'Not used' },
      { name: 'Smallest group of the tree', value: tree ? String(run.settings.min_leaf) : 'Not used' },
      { name: 'Cost per contact', value: chf(run.campaign.cost_per_contact) },
      { name: 'Margin per response', value: chf(run.campaign.margin_per_response) },
      { name: 'Size of the list', value: thousands(run.campaign.scaled_to) },
    ],
  }
})

const steps = [
  'Upload the customers of a past campaign with what is known about them and whether they responded.',
  'Choose the target (responded or not) and the predictors.',
  'Fit a model: logistic regression or a decision tree. Part of the customers is kept aside to test it.',
  'Read which predictors matter, and in which direction.',
  'Check the model on the customers kept aside: the gains and lift table, and the area under the curve.',
  'Enter the cost per contact and the margin per response, and read how deep into the list the campaign should go.',
  'Score new customers with the stored model, and export the list.',
]

export const targetingSetups: SetupInfo[] = targetingRunIds.map((id): SetupInfo => {
  const run = results.runs[id]
  const used = run.kind === 'tree' ? Object.keys(run.settings) : Object.keys(run.settings).filter((key) => key !== 'max_depth' && key !== 'min_leaf')
  return {
    runId: id,
    module: 'targeting',
    engineModule: ENGINE,
    title: 'Set up a response model for a campaign',
    question: targetingQuestion,
    steps,
    inputs: [
      {
        input: 'Customers of a past campaign',
        form: 'One row per customer: the predictors, and a column that says whether the customer responded.',
        here: `${data.file}: ${thousands(data.n_customers)} customers who got the letter last year, ${thousands(data.n_responders)} of them subscribed (${pct(data.response_rate, 1)})`,
      },
      {
        input: 'Predictors',
        form: 'The columns the model may use.',
        here: data.predictors.map((predictor) => predictor.label.replace(/ \(.*\)$/, '')).join(', '),
      },
      {
        input: 'Cost per contact, margin per response',
        form: 'Two numbers.',
        here: `${chf(data.cost_per_contact)} per letter, ${chf(data.margin_per_response)} per new subscriber`,
      },
      { input: 'New customers (for scoring)', form: 'The same predictor columns, without the response.', here: 'Not part of this run' },
    ],
    settings: used.map((key) => ({
      key,
      value: run.settings[key as keyof typeof run.settings],
      note: key === 'n_customers' ? 'The list the campaign of this exercise is planned for.' : undefined,
    })),
    calls: 'fit_response_model, campaign_profit',
    resultsTo: `/targeting?run=${id}`,
  }
})

/** What the presenting script in README.md says out loud about this module. */
const first = results.runs['TG-01']
export const targetingReadme = [
  `${first.lift.top_group_lift.toFixed(1)} times as often`,
  `${pct(first.performance.test.hit_rate, 1)}`,
  `${pct(first.performance.test.hit_rate_by_guessing, 1)}`,
  `${chf(first.campaign.best_depth.profit, 0)}`,
]
