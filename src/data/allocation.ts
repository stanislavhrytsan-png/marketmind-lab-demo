/**
 * Resource allocation: what the allocation screen shows.
 *
 *   RA-01  the best split of the advertising budget across four regions
 *   RA-02  a larger budget that need not be spent in full
 *
 * Response curves, the best split and every other number are results of the
 * engine (engine_results.json). All amounts in the data are in thousand CHF
 * per year. The what-if view values a split of your own in the browser, with
 * the engine's curves (src/lib/allocation.ts).
 */
import { capital, inWords, listed, pct, thousands } from '../lib/format'
import type { ResponseCurve } from '../lib/allocation'
import type { FurtherRunId, Run } from './alpineOat'
import { engineModules, optionLabel } from './moduleKit'
import type { CoachScript, FurtherModule, SetupInfo } from './moduleKit'

// ---------------------------------------------------------------------------
// The engine's results
// ---------------------------------------------------------------------------

export interface UnitRow {
  name: string
  shape: string
  current_spending: number
  spending: number
  change: number
  change_share: number
  sales_at_current: number
  sales: number
  margin: number
  profit_at_current: number
  profit: number
  margin_of_one_more_unit_of_spending: number | null
  min_spending: number
  max_spending: number | null
  at_limit?: string | null
}

interface Totals {
  spending_at_current: number
  spending: number
  sales_at_current: number
  sales: number
  profit_at_current: number
  profit: number
  profit_gain: number
  profit_gain_share: number
}

interface AllocationRun {
  settings: { increase: number; budget_rule: string; steps: number }
  budget: number
  left_over: number
  money_moved_between_units: number
  units: UnitRow[]
  totals: Totals
  warnings: string[]
  how_to_read: string[]
}

export interface CurveResult extends ResponseCurve {
  name: string
  shape: string
  shape_meaning: string
  sales_at_zero: number
  sales_at_increase: number
  sales_at_saturation: number
  increase: number
  steepest_at_spending: number | null
  min_spending: number | null
  max_spending: number | null
  curve: { spending: number[]; sales: number[]; profit: number[] }
  how_to_read: string[]
}

interface BudgetStep {
  budget: number
  spend_all: { spending: number[]; spent: number; left_over: number; profit: number }
  up_to: { spending: number[]; spent: number; left_over: number; profit: number }
}

const results = engineModules.allocation as unknown as {
  data: {
    file: string
    what_is_split: string
    unit: string
    budget: number
    increase: number
    margin_meaning: string
    questions: Record<'sales_at_zero' | 'sales_at_current' | 'sales_at_increase' | 'sales_at_saturation', string>
    units: string[]
    judgments: Record<string, number | string | null>[]
  }
  runs: Record<'RA-01' | 'RA-02', AllocationRun>
  curves: CurveResult[]
  by_budget: BudgetStep[]
  changed_judgments: {
    change: number
    units: { unit: string; judgment: number; own_spending: number; variants: { change: number; judgment: number; own_spending: number }[] }[]
  }
}

const ENGINE = 'allocation'
const { data } = results
const best = results.runs['RA-01']
const larger = results.runs['RA-02']

/** 456.2 (thousand CHF) -> "CHF 456,000", for running text. */
const francs = (value: number) => `${value < 0 ? '−' : ''}CHF ${thousands(Math.round(Math.abs(value)) * 1000)}`
/** 4823.6 (thousand CHF) -> "CHF 4.82 million" */
const million = (value: number) => `CHF ${(value / 1000).toFixed(2)} million`

export const allocationModule: FurtherModule = {
  id: 'allocation',
  name: 'Resource allocation',
  short: 'Allocation',
  to: '/allocation',
  text: 'Response curves from the judgments of managers, the split of a budget with the highest profit',
}

export const allocationQuestion = 'How should a budget be split across regions, products or channels?'

// ---------------------------------------------------------------------------
// The screen (run RA-01, with RA-02 for the question of the budget itself)
// ---------------------------------------------------------------------------

const units = best.units
const zero = units.filter((unit) => unit.spending < 0.5)
const largestRise = [...units].sort((a, b) => b.change_share - a.change_share)[0]
/** One more franc earns this much margin in every region that still gets money and is not held at a limit. */
const oneMore = units.find((unit) => unit.spending >= 0.5 && !unit.at_limit)?.margin_of_one_more_unit_of_spending ?? 0
const changed = results.changed_judgments
/** How far the best budget of a region moves when one answer is a little off, as a share of that budget. */
const moves = changed.units
  .filter((unit) => unit.own_spending >= 0.5)
  .map((unit) => ({ unit, move: Math.max(...unit.variants.map((variant) => Math.abs(variant.own_spending / unit.own_spending - 1))) }))
  .sort((a, b) => b.move - a.move)
const mostSensitive = moves[0]
const whatPays = larger.totals.spending
const peakBudget = results.by_budget.reduce((bestStep, step) => (step.spend_all.profit > bestStep.spend_all.profit ? step : bestStep))

export const allocationScreen = {
  runId: 'RA-01' as FurtherRunId,
  otherRunId: 'RA-02' as FurtherRunId,
  unit: data.unit,
  unitNote: 'All amounts in thousand CHF per year.',
  budget: best.budget,
  summary: `Advertising budget of ${francs(best.budget)} across ${inWords(units.length)} regions, the whole budget is spent, curves from four judgments per region. Run on Thu 22 Oct at 15:10.`,
  headline: `Split differently, the same budget earns ${pct(best.totals.profit_gain_share, 1)} more profit. ${listed(zero.map((unit) => unit.name))} ${zero.length === 1 ? 'gets' : 'get'} nothing, and ${largestRise.name} gets ${(largestRise.spending / largestRise.current_spending).toFixed(1)} times its budget of today.`,
  stats: [
    {
      value: `+${pct(best.totals.profit_gain_share, 1)}`,
      label: 'profit with the best split',
      note: `${million(best.totals.profit)} against ${million(best.totals.profit_at_current)} today`,
    },
    { value: francs(best.totals.profit_gain), label: 'more profit per year', note: `From the same budget of ${francs(best.budget)}` },
    {
      value: francs(best.money_moved_between_units),
      label: 'of the budget changes region',
      note: `${pct(best.money_moved_between_units / best.budget)} of the money is spent somewhere else`,
    },
    {
      value: oneMore.toFixed(2),
      label: 'francs of margin from one more franc',
      note: 'The same in every region that still gets money',
    },
  ],
  units,
  totals: best.totals,
  curves: results.curves,
  splitCard: {
    title: "Today's split and the best split",
    note: `Advertising per region. ${data.unit.charAt(0).toUpperCase()}${data.unit.slice(1)}.`,
  },
  curvesCard: {
    title: 'The response curve of each region',
    note: 'Sales by advertising, drawn through the four answers of the regional manager (the points). The ring is today, the filled point the best split.',
  },
  howToRead: best.how_to_read,

  /** The teaching trap: the split is only as good as the judgments. */
  trap: {
    title: `An answer that is ${pct(changed.change)} off can move ${pct(mostSensitive.move)} of a region's budget`,
    text: `The split rests on four answers per region, and nobody can know them exactly. Take the third answer: sales with ${pct(data.increase)} more advertising. Had the manager of ${mostSensitive.unit.unit} said ${thousands(mostSensitive.unit.variants[0].judgment)} or ${thousands(mostSensitive.unit.variants[1].judgment)} instead of ${thousands(mostSensitive.unit.judgment)}, the best budget of ${mostSensitive.unit.unit} would be ${thousands(mostSensitive.unit.variants[0].own_spending)} or ${thousands(mostSensitive.unit.variants[1].own_spending)} instead of ${thousands(mostSensitive.unit.own_spending)}. ${zero.length ? `${listed(zero.map((unit) => unit.name))} ${zero.length === 1 ? 'is' : 'are'} a different case: with ${thousands(zero[0].current_spending)} of advertising the region leaves a profit of ${thousands(zero[0].profit_at_current)}, without any ${thousands(zero[0].profit)}. That is a result, not an error.` : ''}`,
    question: data.questions.sales_at_increase,
    change: changed.change,
    rows: changed.units,
    engineSays: [best.how_to_read[2]],
  },

  /** Is the budget itself right? The best split for other budgets. */
  budgetCard: {
    title: 'Is the budget itself right?',
    text: `The line is the profit of the best split for every budget from ${francs(results.by_budget[0].budget)} to ${francs(results.by_budget[results.by_budget.length - 1].budget)}. It is highest at about ${francs(whatPays)}: beyond that, every further franc earns less than it costs. Offered ${francs(larger.budget)} with the rule "${optionLabel(ENGINE, 'budget_rule', larger.settings.budget_rule).toLowerCase()}", the engine spends ${francs(whatPays)} and leaves ${francs(larger.left_over)}.`,
    steps: results.by_budget,
    whatPays,
    peak: peakBudget.budget,
    caseBudget: best.budget,
    largerRun: { budget: larger.budget, spent: larger.totals.spending, leftOver: larger.left_over, profit: larger.totals.profit, units: larger.units },
    engineSays: larger.warnings,
  },

  /** The what-if view: a split of your own, valued in the browser with the engine's curves. */
  whatIf: {
    title: 'Try a split of your own',
    text: `Move the advertising of each region. The browser reads sales and profit from the engine's curves. The budget is ${thousands(best.budget)}.`,
    slider: { min: 0, max: 800, step: 5 },
    presets: [
      { name: "Today's split", spending: units.map((unit) => unit.current_spending) },
      { name: 'Best split (RA-01)', spending: units.map((unit) => unit.spending) },
      { name: 'The same for every region', spending: units.map(() => best.budget / units.length) },
    ],
    limits: units.map((unit) => ({
      min: unit.min_spending,
      max: unit.max_spending,
      text: unit.min_spending > 0 ? `at least ${thousands(unit.min_spending)}` : unit.max_spending !== null ? `at most ${thousands(unit.max_spending)}` : '',
    })),
    profitToday: best.totals.profit_at_current,
    profitBest: best.totals.profit,
  },

  details: {
    judgments: {
      title: 'The four judgments of each regional manager',
      note: `${units.length * 4} answers: the whole analysis rests on them`,
      questions: data.questions,
      rows: data.judgments,
      margin: data.margin_meaning,
    },
    curves: { title: 'The curves in numbers', note: 'Shape, the four numbers of each curve, and where it is steepest' },
    split: { title: 'The best split in full', note: 'Advertising, sales, profit and the margin of one more franc, per region' },
  },

  coach: {
    note: zero.length
      ? `The best split takes all advertising out of ${zero[0].name}. That cannot be right: ${zero[0].name} sells ${thousands(zero[0].sales_at_current)} a year. I would keep at least today's ${thousands(zero[0].current_spending)} there.`
      : 'The best split moves a lot of money between the regions. I would keep the split of today, which follows the sales of each region.',
    opening: [
      {
        from: 'coach',
        text: zero.length
          ? `Before you overrule the result: what profit does ${zero[0].name} leave with today's advertising, and what would it leave with none? Both numbers are on this screen.`
          : 'Before you overrule the result: what does one more franc of advertising earn in each region today?',
      },
    ],
    turns: [
      {
        student: zero.length
          ? `With today's ${thousands(zero[0].current_spending)} it leaves a profit of ${thousands(zero[0].profit_at_current)}, with no advertising ${thousands(zero[0].profit)}. So in ${zero[0].name} the advertising costs more than the margin it brings in.`
          : 'It differs a lot between the regions.',
        coach: `Right, and that follows from the manager's own four answers. How sure can anyone be about such answers? Look at the card "Watch out": what happens to the budget of ${mostSensitive.unit.unit} when one answer is ${pct(changed.change)} lower?`,
      },
    ],
  } satisfies CoachScript,
}

// ---------------------------------------------------------------------------
// Runs and setup screens
// ---------------------------------------------------------------------------

const runSettings = (run: AllocationRun) => [
  { name: 'Units', value: `${run.units.length} regions` },
  { name: 'Budget', value: `${thousands(run.budget)} ${data.unit}` },
  { name: 'What happens to the budget', value: optionLabel(ENGINE, 'budget_rule', run.settings.budget_rule) },
  { name: 'Third judgment asks about', value: `${pct(run.settings.increase)} more spending` },
  { name: 'Fineness of the search', value: `${thousands(run.settings.steps)} steps` },
]

export const allocationRuns: Run[] = [
  {
    id: 'RA-01',
    module: 'allocation',
    label: 'Advertising by region, best split',
    summary: `Budget of ${thousands(best.budget)} across ${units.length} regions, the whole budget is spent`,
    when: 'Thu 22 Oct, 15:10',
    final: true,
    to: '/allocation',
    setupTo: '/allocation/setup/RA-01',
    settings: runSettings(best),
  },
  {
    id: 'RA-02',
    module: 'allocation',
    label: 'A larger budget, spent only if it pays',
    summary: `Budget of ${thousands(larger.budget)}, of which ${thousands(larger.left_over)} are left over`,
    when: 'Thu 22 Oct, 15:24',
    to: '/allocation',
    setupTo: '/allocation/setup/RA-02',
    settings: runSettings(larger),
  },
]

const steps = [
  "For every unit, enter today's spending and four judgments: sales without any spending, with today's spending, with 50% more, and with unlimited spending.",
  'Look at the response curve the engine draws through the four judgments. Is it S-shaped or does it flatten from the start?',
  'Enter the margin, the budget, and a lowest or highest spending where one applies.',
  "Find the best split, and compare it with today's split.",
  'Try a split of your own and see what it gives away.',
  'Ask whether the budget itself is right: with the rule "spend up to the budget" the engine only spends what pays.',
]

export const allocationSetups: SetupInfo[] = (['RA-01', 'RA-02'] as const).map((id): SetupInfo => {
  const run = results.runs[id]
  const limited = run.units.filter((unit) => unit.min_spending > 0 || unit.max_spending !== null)
  return {
    runId: id,
    module: 'allocation',
    engineModule: ENGINE,
    title: 'Set up the split of a budget',
    question: allocationQuestion,
    steps,
    inputs: [
      {
        input: 'Judgments',
        form: "One row per unit: today's spending, the four sales judgments, the margin, and optional limits.",
        here: `${data.file}: ${listed(data.units)}. ${capital(data.margin_meaning)}: ${pct(run.units[0].margin)}. Limits: ${limited
          .map((unit) => `${unit.name} ${unit.min_spending > 0 ? `at least ${thousands(unit.min_spending)}` : `at most ${thousands(unit.max_spending ?? 0)}`}`)
          .join(', ')}`,
      },
      { input: 'Budget', form: 'One number, in the unit of the spending.', here: `${thousands(run.budget)} ${data.unit}` },
      { input: 'Own split (optional)', form: 'A spending per unit.', here: 'Not part of this run. The results screen has it under "What if"' },
    ],
    settings: Object.entries(run.settings).map(([key, value]) => ({ key, value })),
    calls: 'allocate_budget',
    resultsTo: '/allocation',
  }
})

/** What the presenting script in README.md says out loud about this module. */
export const allocationReadme = [
  `${pct(best.totals.profit_gain_share, 1)} more profit`,
  `${pct(changed.change)} off`,
  `${francs(whatPays)}`,
]
