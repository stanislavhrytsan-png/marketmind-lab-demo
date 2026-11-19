/**
 * MarketMind Lab demo: the one data file.
 *
 * Everything the demo shows comes from here. The numbers are real results of
 * the MarketMind Lab calculation engine on the fictional case "Alpine Oat
 * Co.". They are read from engine_results.json, which the engine writes
 * (`python -m marketmind.export_demo` in the engine folder). Nothing is
 * estimated while the demo runs: the market simulator only adds up the
 * engine's part-worths (see src/lib/conjoint.ts).
 *
 * Sentences that quote a number are built from the engine's results in this
 * file, so a text cannot disagree with a chart. The AI tutor is still a
 * script: its lines are fixed, only their numbers come from the engine.
 *
 * Contents
 *   1. Course, people and AI tutor modes
 *   2. Course home
 *   3. Case brief and datasets
 *   4. Segments
 *   5. Conjoint analysis: attributes, part-worths, competitors, setup texts
 *   6. Runs and comparisons
 *   7. Interpretation and AI tutor scripts
 *   8. Professor: assignment setup
 *   9. Professor: submissions review
 *  10. Segmentation screens (Priority 2)
 *  11. Positioning screen (Priority 2)
 *
 * The further modules (forecasting, price optimization and so on) have one
 * data file each, next to this one. library.ts brings all modules and all
 * runs together.
 */

import engineResults from './engine_results.json'

// ---------------------------------------------------------------------------
// The engine's results, and small helpers to quote them
// ---------------------------------------------------------------------------

/** Written by the engine. Do not edit engine_results.json by hand: run the export again. */
export const engine = engineResults
const engineRuns = engine.runs

/** 0.449 -> 45 */
const whole = (fraction: number) => Math.round(fraction * 100)
/** 13.746 -> "13.7" */
const oneDecimal = (value: number) => value.toFixed(1)
/** 3000 -> "3,000" */
const thousands = (value: number) => value.toLocaleString('en-US')
/** 2 -> "two", for running text */
const inWords = (count: number) =>
  ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][count] ?? String(count)
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
/** "A", "A and B", "A, B and C" */
const listed = (names: string[]) =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

export const respondentCount = engine.case.n_respondents
const basisCount = engine.case.basis_variables.length
const descriptorCount = engine.case.descriptor_variables.length

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Mode = 'off' | 'coach' | 'explain'
/** The three modules of the survey, which this file describes. */
export type SurveyModuleId = 'segmentation' | 'positioning' | 'conjoint'
/** The modules that work with the records of the company. Each has its own data file. */
export type FurtherModuleId =
  | 'forecasting'
  | 'pricing'
  | 'targeting'
  | 'lifetimeValue'
  | 'allocation'
  | 'portfolio'
  | 'panel'
  | 'sentiment'
  | 'network'
export type ModuleId = SurveyModuleId | FurtherModuleId
export type SegmentId = 'health' | 'taste' | 'price'
/** A set of part-worths: the whole sample, or one segment. */
export type GroupId = 'all' | SegmentId
export type AttrId = 'flavor' | 'sugar' | 'protein' | 'pack' | 'price'
/** A product: for every attribute, the index of the chosen level. */
export type Design = Record<AttrId, number>
export type SurveyRunId = 'SEG-01' | 'SEG-02' | 'SEG-03' | 'SEG-04' | 'POS-01' | 'CJ-01' | 'CJ-02' | 'CJ-03'
/** Runs of the further modules: FC forecasting, PR pricing, TG targeting, LV lifetime value, RA allocation, GE matrix, PN panel, SE sentiment, NW network. */
export type FurtherRunId = `${'FC' | 'PR' | 'TG' | 'LV' | 'RA' | 'GE' | 'PN' | 'SE' | 'NW'}-0${1 | 2 | 3 | 4 | 5 | 6}`
export type RunId = SurveyRunId | FurtherRunId

export interface Segment {
  id: SegmentId
  name: string
  short: string
  color: string
  shape: 'circle' | 'square' | 'triangle'
  /** Share of all respondents, in percent. */
  share: number
  n: number
  /** Largest differences from the average respondent, in standard deviations. */
  profile: { variable: string; z: number }[]
  who: string[]
}

export interface Run {
  id: RunId
  module: ModuleId
  label: string
  summary: string
  when: string
  /** Marked by the student as the run used in the interpretation. */
  final?: boolean
  /** Screen that shows this run's results, if the demo has one. */
  to?: string
  /** Screen that shows this run's setup, if the demo has one. */
  setupTo?: string
  settings: { name: string; value: string }[]
}

export interface ChatMessage {
  from: 'coach' | 'student'
  text: string
  /** Set on coach messages that count as a hint. */
  hint?: number
}

// ---------------------------------------------------------------------------
// 1. Course, people and AI tutor modes
// ---------------------------------------------------------------------------

export const course = {
  name: 'Marketing Analytics',
  term: 'MSc, autumn 2026',
  intro: 'MSc in Management, autumn 2026. Taught by Prof. Elena Marti.',
  studentCount: 46,
}

export const student = { name: 'Lea Brunner', firstName: 'Lea', initials: 'LB', role: 'Student' }

export const professor = {
  name: 'Prof. Elena Marti',
  shortName: 'Prof. Marti',
  initials: 'EM',
  role: 'Professor',
}

export const modes: Record<
  Mode,
  {
    label: string
    /** One line for the legend on the course home. */
    legend: string
    /** Tooltip on the mode plate. */
    tip: string
    /** Short line under a mode chip. */
    short: string
    /** Option card in the professor's assignment setup. */
    setup: { summary: string; studentsGet: string; typicalUse: string }
    /** The professor's reason, shown to students on the mode plate. */
    reason: string
  }
> = {
  off: {
    label: 'Off',
    legend: 'No AI. Used for quizzes and exams.',
    tip: 'No AI in this assignment.',
    short: 'No AI in this assignment',
    setup: {
      summary: 'No AI at all.',
      studentsGet: 'No AI help at all. The interpretation box stays.',
      typicalUse: 'Exams, quizzes and pure practice.',
    },
    reason: 'This is exam practice. Show me what you can read from the results on your own.',
  },
  coach: {
    label: 'Coach',
    legend: 'Asks guiding questions and gives hints. Never gives the answer.',
    tip: 'Asks guiding questions and gives hints, never the answer.',
    short: 'Questions and hints, never the answer',
    setup: {
      summary: 'Asks guiding questions and gives hints, never the answer.',
      studentsGet: 'Questions and a limited number of hints, based on what they wrote.',
      typicalUse: 'Graded cases where the reasoning is what you assess.',
    },
    reason:
      'Reading conjoint results is the skill I grade here. The tutor will ask questions and give hints, but the conclusions must be yours.',
  },
  explain: {
    label: 'Explain',
    legend: 'Full explanation, but only after you submit your own interpretation.',
    tip: 'Full explanation, unlocked after you submit your own interpretation.',
    short: 'Full explanation, after you submit',
    setup: {
      summary: 'Full explanation, unlocked after students submit their own interpretation.',
      studentsGet: 'A full explanation of the results, after they submit their own.',
      typicalUse: 'Early exercises where students learn to read a new model.',
    },
    reason:
      'This is your first conjoint case. Write your own reading first, then compare it with the full explanation.',
  },
}

/** The three modules of the assignment. library.ts adds the further modules. */
export const surveyModules: { id: ModuleId; name: string; to: string; text: string }[] = [
  {
    id: 'segmentation',
    name: 'Segmentation',
    to: '/segmentation',
    text: 'Hierarchical and k-means clustering, segment profiles',
  },
  { id: 'positioning', name: 'Positioning', to: '/positioning', text: 'Perceptual map with segment preferences' },
  {
    id: 'conjoint',
    name: 'Conjoint analysis',
    to: '/conjoint',
    text: 'Part-worths, importance, market simulator, scenario batch',
  },
]

// ---------------------------------------------------------------------------
// 2. Course home
// ---------------------------------------------------------------------------

export const assignment = {
  title: 'Alpine Oat Co.: which product, for which segment?',
  kind: 'Individual assignment, 20% of the course grade',
  summary: `Segmentation, positioning and conjoint analysis on a survey of ${respondentCount} Swiss oat-drink buyers.`,
  due: 'Fri 27 Nov, 23:59',
  daysLeft: '12 days left',
  mode: 'coach' as Mode,
  steps: ['Read the case', 'Segmentation', 'Positioning', 'Conjoint analysis', 'Interpretation', 'Submit'],
  /** Index of the step the student is working on. */
  currentStep: 3,
}

export interface AssignmentRow {
  title: string
  sub: string
  modules: string
  due: string
  dueNote: string
  dueWarn?: boolean
  mode: Mode
  progress: { done: number; of: number; label: string } | { feedbackReady: true }
  action: { kind: 'button' | 'quiet' | 'locked'; label: string; to?: string }
}

export const assignmentRows: AssignmentRow[] = [
  {
    title: 'Quiz: reading a dendrogram',
    sub: 'Timed, 30 minutes, one attempt',
    modules: 'Segmentation',
    due: 'Fri 20 Nov, 18:00',
    dueNote: '5 days left',
    dueWarn: true,
    mode: 'off',
    progress: { done: 0, of: 3, label: 'Not started' },
    action: { kind: 'button', label: 'Start quiz' },
  },
  {
    title: 'Alpine Oat Co.: which product, for which segment?',
    sub: 'Individual, 20% of grade',
    modules: 'Segmentation, Positioning, Conjoint',
    due: 'Fri 27 Nov, 23:59',
    dueNote: '12 days left',
    mode: 'coach',
    progress: { done: 3, of: 6, label: '3 of 6 steps' },
    action: { kind: 'button', label: 'Continue', to: '/conjoint' },
  },
  {
    title: 'Group case: Lumen e-bikes',
    sub: 'Groups of 4, opens Mon 30 Nov',
    modules: 'Conjoint',
    due: 'Fri 11 Dec, 23:59',
    dueNote: 'Not open yet',
    mode: 'coach',
    progress: { done: 0, of: 5, label: 'Locked' },
    action: { kind: 'locked', label: 'Opens 30 Nov' },
  },
  {
    title: 'Warm-up: standardizing survey data',
    sub: 'Submitted Thu 5 Nov',
    modules: 'Segmentation',
    due: 'Fri 6 Nov, 23:59',
    dueNote: 'Closed',
    mode: 'explain',
    progress: { feedbackReady: true },
    action: { kind: 'quiet', label: 'Read feedback' },
  },
]

/**
 * The student story starts just before the conjoint run. "before" is what the
 * course home shows until the conjoint scenarios have been run, "after" what
 * it shows from then on.
 */
export const courseHome = {
  lastRun: {
    before: { id: 'POS-01' as RunId, when: 'Last run, Thu 12 Nov at 14:20' },
    after: { id: 'CJ-03' as RunId, when: 'Last run, today at 18:47' },
  },
  recentRuns: {
    before: [
      { id: 'POS-01' as RunId, when: 'Positioning, Thu 12 Nov 14:20' },
      { id: 'SEG-04' as RunId, when: 'Segmentation, Wed 11 Nov 09:05' },
      { id: 'SEG-03' as RunId, when: 'Segmentation, Tue 10 Nov 16:40' },
    ],
    after: [
      { id: 'CJ-03' as RunId, when: 'Conjoint, today 18:47' },
      { id: 'CJ-02' as RunId, when: 'Conjoint, today 18:31' },
      { id: 'POS-01' as RunId, when: 'Positioning, Thu 12 Nov 14:20' },
    ],
  },
  savedAt: { before: '18:24', after: '18:47' },
  legendNote:
    'You always write your own interpretation first. Your professor can read it, together with your AI conversation.',
}

// ---------------------------------------------------------------------------
// 3. Case brief and datasets
// ---------------------------------------------------------------------------

/** What each descriptor variable of the engine's case records, in the words of the case brief. */
const descriptorTexts: Record<string, { name: string; records: string }> = {
  age_group: { name: 'Age group', records: 'Age group, from 18 to 24 up to 65 and older' },
  income_group: { name: 'Household income', records: 'Household income: low, middle or high' },
  sport_frequency: { name: 'Sport per week', records: 'How often the respondent exercises' },
  weekly_consumption: { name: 'Weekly consumption', records: 'Litres of oat drink bought per week' },
}

export const caseBrief = {
  name: 'Alpine Oat Co.',
  question: 'Which new oat drink should Alpine Oat launch, and for which customer segment?',
  text: 'Alpine Oat is a Swiss oat-drink brand with one product, Original, sold in supermarkets. Growth has slowed as Valloat, Lumo and supermarket own brands widen their ranges. Management can fund one launch next year and wants to know which buyers to aim for and which product would win them.',
  /** Shown on the case brief. */
  fictionNote:
    'Alpine Oat Co. is a fictional teaching case. All companies and brands in the case are fictional, and all numbers are invented example data.',
  steps: [
    {
      label: 'Step 1, Segmentation',
      title: 'Who are the buyers?',
      text: 'Group respondents by what they look for in an oat drink.',
    },
    {
      label: 'Step 2, Positioning',
      title: 'How are the brands seen?',
      text: 'Map Alpine Oat against three competitors.',
    },
    {
      label: 'Step 3, Conjoint analysis',
      title: 'What should we launch?',
      text: 'Measure what each product feature is worth to buyers.',
    },
  ],
  nextStep: {
    before: {
      text: 'Segmentation and positioning are done. Next, measure what each product feature is worth to buyers.',
      button: 'Set up conjoint analysis',
      to: '/conjoint/setup',
    },
    after: {
      text: 'Your conjoint runs are ready. Read the results, then write your interpretation.',
      button: 'Open conjoint results',
      to: '/conjoint/results',
    },
  },
  datasets: [
    { name: 'Segmentation survey', detail: `${respondentCount} respondents, ${basisCount + descriptorCount} variables` },
    {
      name: 'Brand perceptions',
      detail: `${engine.case.brands.length} brands rated on ${engine.case.n_brand_attributes} attributes`,
    },
    { name: 'Conjoint choices', detail: `${engine.case.choice_tasks_per_respondent} choice tasks per respondent` },
  ],
  summary: [
    { value: String(respondentCount), label: 'respondents', note: 'Online panel, September 2026' },
    { value: String(basisCount), label: 'basis variables', note: 'Used to form the segments' },
    { value: String(descriptorCount), label: 'descriptor variables', note: 'Used to describe them afterwards' },
    {
      value: `${((engine.case.n_missing_answers / engine.case.n_basis_answers) * 100).toFixed(1)}%`,
      label: 'answers missing',
      note: `${engine.case.n_missing_answers} of ${thousands(engine.case.n_basis_answers)} basis answers`,
    },
  ],
  /** The answers run from scale.minimum to scale.maximum. */
  scale: engine.case.rating_scale,
  basisNote: `Importance ratings from ${engine.case.rating_scale.minimum} (not important at all) to ${engine.case.rating_scale.maximum} (extremely important)`,
  /** shape: relative frequency of each answer on the scale, the most frequent answer = 1. */
  basisVariables: engine.case.basis_variables.map((variable) => ({
    name: variable.label,
    asked: variable.question,
    shape: variable.shape,
    mean: variable.mean,
  })),
  descriptorNote: 'Not used to form segments. They tell you who is in each segment.',
  descriptorVariables: engine.case.descriptor_variables.map((variable) => ({
    name: descriptorTexts[variable.key]?.name ?? variable.label,
    records: descriptorTexts[variable.key]?.records ?? variable.label,
    type: variable.categories ? `${variable.categories.length} groups` : 'Number',
  })),
  rawTable: {
    summary: `${respondentCount} rows, ${engine.case.n_columns} columns. Open only if you need to check single answers.`,
    rows: engine.case.raw_rows as { id: number; answers: (number | null)[] }[],
    note: `Showing ${engine.case.raw_rows.length} of ${respondentCount} rows and the ${basisCount} basis variables. Choose columns or download the full table as CSV.`,
  },
  glossary: [
    { term: 'Basis variable', text: 'An answer the model uses to decide who is similar to whom.' },
    {
      term: 'Descriptor variable',
      text: 'A fact about the respondent that helps you recognise and reach a segment.',
    },
  ],
}

// ---------------------------------------------------------------------------
// 4. Segments (from run SEG-03). A segment keeps its colour and shape on
//    every screen.
// ---------------------------------------------------------------------------

/** How a segment looks on every screen. The numbers come from the engine. */
const segmentLook: Record<SegmentId, Pick<Segment, 'short' | 'color' | 'shape'>> = {
  health: { short: 'Health', color: '#15996B', shape: 'circle' },
  taste: { short: 'Taste', color: '#E2622F', shape: 'square' },
  price: { short: 'Price-sens.', color: '#2A78D6', shape: 'triangle' },
}

type EngineSegment = (typeof engine.segments)[number]

/**
 * Three lines on who is in a segment, from the descriptor tables of the engine:
 * the age, the answer on income or sport that sets the segment furthest apart
 * from all respondents, and how much oat drink it buys.
 */
function whoLines(segment: EngineSegment): string[] {
  const { age_group: age, income_group: income, sport_frequency: sport, weekly_consumption: litres } = segment.descriptors
  const young = age.shares['18-24'] + age.shares['25-34']
  const older = age.shares['45-54'] + age.shares['55-64'] + age.shares['65+']
  const ageLine =
    young >= 0.5
      ? `${whole(young)}% are younger than 35`
      : older >= 0.5
        ? `${whole(older)}% are 45 or older`
        : `${whole(age.shares['25-34'] + age.shares['35-44'])}% are between 25 and 44`
  const active = (shares: typeof sport.shares) => shares['3-4 times'] + shares['5+ times']
  const facts = [
    { gap: active(sport.shares) - active(sport.shares_all), text: `${whole(active(sport.shares))}% exercise 3 or more times a week` },
    { gap: sport.shares.never - sport.shares_all.never, text: `${whole(sport.shares.never)}% never exercise` },
    { gap: income.shares.high - income.shares_all.high, text: `${whole(income.shares.high)}% have a high household income` },
    { gap: income.shares.low - income.shares_all.low, text: `${whole(income.shares.low)}% have a low household income` },
  ].sort((a, b) => b.gap - a.gap)
  const amounts = engine.segments.map((other) => other.descriptors.weekly_consumption.mean)
  const amount = `${oneDecimal(litres.mean)} litres of oat drink a week`
  const litresLine =
    litres.mean === Math.max(...amounts)
      ? `Buy most: ${amount}`
      : litres.mean === Math.min(...amounts)
        ? `Buy least: ${amount}`
        : `Buy ${amount}, close to the average`
  return [ageLine, facts[0].gap >= 0.05 ? facts[0].text : 'Income and sport close to the average', litresLine]
}

export const segments: Segment[] = engine.segments.map((segment) => ({
  id: segment.id as SegmentId,
  name: segment.name,
  ...segmentLook[segment.id as SegmentId],
  share: whole(segment.share),
  n: segment.n,
  profile: segment.largest_differences.map((row) => ({ variable: row.label, z: Math.round(row.z * 10) / 10 })),
  who: whoLines(segment),
}))

const segmentOf = (id: SegmentId) => segments.find((segment) => segment.id === id)!
/** The largest segment, for headlines. */
const largestSegment = [...segments].sort((a, b) => b.n - a.n)[0]

/** Neutral colour for "all respondents". */
export const allColor = '#56607A'
/** "Your brand" and "your design" use the primary colour. */
export const ownColor = '#5B2B6E'

// ---------------------------------------------------------------------------
// 5. Conjoint analysis
// ---------------------------------------------------------------------------

const attrIdOf: Record<string, AttrId> = {
  Flavor: 'flavor',
  Sugar: 'sugar',
  Protein: 'protein',
  'Pack size': 'pack',
  Price: 'price',
}

export const attributes: { id: AttrId; name: string; levels: string[] }[] = engine.conjoint.attributes.map((attribute) => ({
  id: attrIdOf[attribute.name],
  name: attribute.name,
  levels: attribute.levels,
}))
const levelCount = attributes.reduce((sum, attribute) => sum + attribute.levels.length, 0)

/** A product as the engine names it ({ Flavor: 'Vanilla', ... }) -> the index of each level. */
const toDesign = (levels: Record<string, string>): Design =>
  Object.fromEntries(attributes.map((a) => [a.id, a.levels.indexOf(levels[a.name])])) as Design
const describeLevels = (levels: Record<string, string>) => attributes.map((a) => levels[a.name]).join(', ')

/** Price of each price level in CHF, used for "best product by revenue". */
export const priceValues = attributes
  .find((a) => a.id === 'price')!
  .levels.map((level) => (engine.conjoint.prices.amounts as Record<string, number>)[level])

/** The combination that cannot be produced (Chocolate with No added sugar). */
export const restriction = (() => {
  const [a, b] = Object.entries(engine.conjoint.restrictions[0]).map(([name, level]) => {
    const attribute = attributes.find((item) => item.name === name)!
    return { attr: attribute.id, level: attribute.levels.indexOf(level) }
  })
  return { a, b }
})()

/** The engine's part-worths of one group, one number per level, in the order of the levels above. */
const worths = (group: { part_worths: Record<string, number[]> }) =>
  Object.fromEntries(attributes.map((a) => [a.id, group.part_worths[a.name]])) as Record<AttrId, number[]>

/**
 * Part-worth utilities from run CJ-02: one set per segment, estimated by the
 * engine from the choice tasks. Within an attribute they add up to zero.
 * "all" is what the same run reports for all respondents together: the
 * average of the three segments, weighted by their size.
 */
export const partWorths: Record<GroupId, Record<AttrId, number[]>> = {
  all: worths(engineRuns['CJ-02'].all),
  health: worths(engineRuns['CJ-02'].health),
  taste: worths(engineRuns['CJ-02'].taste),
  price: worths(engineRuns['CJ-02'].price),
}

/** Run CJ-01: one set of part-worths, estimated on all respondents at once. */
export const partWorthsOneModel = worths(engineRuns['CJ-01'].all)

/** The share of each segment among the respondents, as the simulator weights them. */
export const segmentWeights = Object.fromEntries(
  engine.segments.map((segment) => [segment.id, segment.n / respondentCount]),
) as Record<SegmentId, number>

/** Competitor products in the market simulator. Set by the professor. */
export const competitors: { name: string; design: Design }[] = engine.conjoint.competitors.map((competitor) => ({
  name: competitor.name,
  design: toDesign(competitor.levels),
}))

/** The design the student saved as run CJ-03. */
export const savedDesign: Design = toDesign(engine.conjoint.saved_design)
const savedDesignText = describeLevels(engine.conjoint.saved_design)
const lowPrice = engineRuns['CJ-03'].low_price

export const conjointSetup = {
  lead: `An attribute is a product feature. A level is one of its options. In the survey, each respondent chose ${engine.case.choice_tasks_per_respondent} times between ${inWords(engine.case.alternatives_per_task)} products built from these levels.`,
  restrictions: {
    does: 'Removes product combinations that cannot exist from the simulator and from the best-product search.',
    when: 'A combination cannot be produced or sold. Keep the list short: every restriction makes it harder to separate the effect of the attributes involved.',
  },
  utilities: [
    {
      id: 'all',
      title: 'All respondents',
      does: 'One set of part-worths for the whole sample.',
      when: 'You want the overall picture first.',
      runLabel: 'All respondents',
    },
    {
      id: 'segment',
      title: 'Each segment',
      tag: 'Default',
      does: 'One set of part-worths per segment from SEG-03.',
      when: 'Segments may want different things. Needed to choose a target segment.',
      runLabel: 'By segment',
    },
    {
      id: 'respondent',
      title: 'Each respondent',
      does: 'A separate set of part-worths for every person.',
      when: 'You want to form new segments from the utilities themselves.',
      runLabel: 'By respondent',
    },
  ],
  rules: [
    {
      id: 'share',
      title: 'Share of preference',
      tag: 'Default',
      does: 'Each respondent is split across products in proportion to their utility.',
      when: 'Everyday products that people buy often and switch between, like oat drinks.',
    },
    {
      id: 'first',
      title: 'First choice',
      does: 'Each respondent counts fully for the one product with the highest utility.',
      when: 'Rare, considered purchases where people pick a single winner.',
    },
  ],
  batch: {
    text: 'Run several settings in one go instead of one after another. Each scenario becomes its own named run, and they open side by side in Compare.',
    scenarios: [
      { id: 'all', label: 'All respondents', runLabel: 'All respondents' },
      { id: 'segment', label: 'Each segment', runLabel: 'By segment' },
      { id: 'segmentFirst', label: 'Each segment, with the first choice rule', runLabel: 'By segment, first choice' },
    ],
    /** The scenarios the demo has pre-made results for. */
    premade: ['all', 'segment'],
  },
  runNote: 'Takes a few seconds. You can keep working while it runs.',
  demoOnlyNote: 'The demo holds pre-made results for the default settings only.',
}

export const conjointResults = {
  runId: 'CJ-02' as RunId,
  summary: `Each segment from SEG-03, ${attributes.length} attributes, ${engine.conjoint.restrictions.length} restriction. Run on Sun 15 Nov at 18:31.`,
  importanceNote:
    'Importance says how much an attribute matters, not which level people prefer. For that, read the part-worths.',
  simulatorNote:
    'Shares are shares of preference. Brand strength, shelf space and advertising are not in the model, so read them as preference, not as a sales forecast. Competitor products are set by your professor.',
  details: [
    {
      id: 'segmentPartWorths',
      title: 'Part-worths for each segment',
      note: `Table, ${levelCount} levels by ${segments.length} segments`,
    },
    {
      id: 'fit',
      title: 'How well the model fits',
      note: `Predicts ${whole(engineRuns['CJ-02'].hit_rate_held_out)}% of held-out choices correctly, against ${whole(engineRuns['CJ-02'].hit_rate_by_guessing)}% by chance`,
      body: `${capital(inWords(engineRuns['CJ-02'].n_tasks_held_out_per_respondent))} of the ${engine.case.choice_tasks_per_respondent} choice tasks per respondent were kept aside and not used for the estimate. The model then predicted which of the ${inWords(engine.case.alternatives_per_task)} products each respondent would pick in those tasks. It was right in ${whole(engineRuns['CJ-02'].hit_rate_held_out)}% of the cases. Picking at random would be right in ${whole(engineRuns['CJ-02'].hit_rate_by_guessing)}%.`,
    },
    {
      id: 'export',
      title: 'Export this analysis as Python or R',
      note: 'The same steps as a script you can run and change',
      body: 'In the full product this gives you the analysis as a script, so you can repeat and change it outside MarketMind Lab. The export is not part of this demo.',
    },
  ],
}

const groupIds: GroupId[] = ['all', 'health', 'taste', 'price']
/** The engine's importance of an attribute in a group of run CJ-02, in whole percent. */
const importanceOf = (group: GroupId, attribute: string) =>
  whole((engineRuns['CJ-02'][group].importance as Record<string, number>)[attribute])
/** The attribute that matters most in a group, in lower case: "price", "sugar", "flavor". */
const topAttributeOf = (group: GroupId) => engineRuns['CJ-02'][group].importance_ranking[0].toLowerCase()
const topImportanceOf = (group: GroupId) => importanceOf(group, engineRuns['CJ-02'][group].importance_ranking[0])

/**
 * Numbers quoted in running text further down (interpretation draft, tutor
 * scripts, the professor's review), in whole percent. They are the engine's
 * own results for the saved design (run CJ-03). src/lib/conjoint.ts compares
 * them with what the simulator in the browser calculates, and `npm run check`
 * fails if the two disagree.
 */
export const quotedNumbers = {
  /** Saved design: predicted share in percent. */
  design: Object.fromEntries(groupIds.map((g) => [g, whole(engineRuns['CJ-03'].shares[0][g])])) as Record<GroupId, number>,
  /** The same design at the lowest price. */
  designAtLowPrice: Object.fromEntries(
    groupIds.map((g) => [g, whole(engineRuns['CJ-03'].shares_at_low_price[0][g])]),
  ) as Record<GroupId, number>,
  importance: {
    all: { price: importanceOf('all', 'Price'), sugar: importanceOf('all', 'Sugar') },
    health: { sugar: importanceOf('health', 'Sugar'), price: importanceOf('health', 'Price') },
    taste: { flavor: importanceOf('taste', 'Flavor'), price: importanceOf('taste', 'Price') },
    price: { price: importanceOf('price', 'Price') },
  },
}
const quoted = quotedNumbers

/**
 * What the presenting script in README.md says out loud about the simulator.
 * `npm run check` fails if the README does not contain these phrases.
 */
export const readmeNumbers = [
  `from ${quoted.design.all}% to ${quoted.designAtLowPrice.all}%`,
  `from ${quoted.design.health}% to ${quoted.designAtLowPrice.health}%`,
  `from ${quoted.design.price}% to ${quoted.designAtLowPrice.price}%`,
  `(${segments.map((segment) => `${segment.share}%`).join(', ')})`,
  `all ${engine.conjoint.n_allowed} allowed products`,
  `${respondentCount} respondents`,
]

// ---------------------------------------------------------------------------
// 6. Runs and comparisons
// ---------------------------------------------------------------------------

type SegRunId = 'SEG-01' | 'SEG-02' | 'SEG-03' | 'SEG-04'

/** The settings of a segmentation run, as the engine recorded them. */
const segSettings = (id: SegRunId) => {
  const run = engineRuns[id]
  const kmeans = run.settings.method === 'kmeans'
  return [
    { name: 'Basis variables', value: `${run.n_basis_variables} variables` },
    { name: 'Standardize', value: run.settings.standardization === 'none' ? 'Off' : 'On' },
    { name: 'Method', value: kmeans ? 'K-means' : 'Hierarchical clustering' },
    { name: 'Number of segments', value: run.settings.n_segments === null ? 'Read from the tree' : String(run.settings.n_segments) },
    { name: 'Distance', value: 'Euclidean' },
    { name: 'Random starts', value: kmeans ? String(run.settings.n_starts) : 'Not used' },
  ]
}
/** "K-means, 3 segments, 10 variables, standardized" */
const segSummary = (id: SegRunId) => {
  const run = engineRuns[id]
  const standardized = run.settings.standardization === 'none' ? 'not standardized' : 'standardized'
  return run.settings.method === 'kmeans'
    ? `K-means, ${run.settings.n_segments} segments, ${run.n_basis_variables} variables, ${standardized}`
    : `Hierarchical, ${run.n_basis_variables} variables, ${standardized}`
}

const utilitiesLabel = (id: 'CJ-01' | 'CJ-02') =>
  engineRuns[id].settings.utilities_for === 'all' ? 'All respondents' : 'Each segment from SEG-03'

/** A setting that only one of two compared runs has is shown as "None" for the other. */
const cjSettings = (id: 'CJ-01' | 'CJ-02', design?: string) => [
  { name: 'Attributes and levels', value: `${attributes.length} attributes, ${levelCount} levels` },
  {
    name: 'Restrictions',
    value: `${engine.conjoint.restrictions.length}, leaving ${engine.conjoint.n_allowed} of ${engine.conjoint.n_combinations} products`,
  },
  { name: 'Estimate utilities for', value: utilitiesLabel(id) },
  { name: 'Choice rule', value: engineRuns['CJ-03'].settings.rule === 'logit' ? 'Share of preference' : 'First choice' },
  ...(design ? [{ name: 'Simulator design', value: design }] : []),
]
const cjSummary = `${attributes.length} attributes, ${engine.conjoint.restrictions.length} restriction`

/**
 * All runs of the assignment. Each one is a real run of the engine with the
 * settings shown here (see engine_results.json). The three conjoint runs are
 * the ones the demo story creates: they appear in the run history once the
 * student has pressed "Run 2 scenarios" on the conjoint setup screen.
 * The runs of the further modules are added in library.ts.
 */
export const surveyRuns: Run[] = [
  {
    id: 'SEG-01',
    module: 'segmentation',
    label: 'First look at the tree',
    summary: segSummary('SEG-01'),
    when: 'Tue 10 Nov, 16:12',
    settings: segSettings('SEG-01'),
  },
  {
    id: 'SEG-02',
    module: 'segmentation',
    label: `Try ${engineRuns['SEG-02'].settings.n_segments} segments`,
    summary: segSummary('SEG-02'),
    when: 'Tue 10 Nov, 16:31',
    settings: segSettings('SEG-02'),
  },
  {
    id: 'SEG-03',
    module: 'segmentation',
    label: `Final, ${engineRuns['SEG-03'].settings.n_segments} segments`,
    summary: segSummary('SEG-03'),
    when: 'Tue 10 Nov, 16:40',
    final: true,
    to: '/segmentation/results',
    settings: segSettings('SEG-03'),
  },
  {
    id: 'SEG-04',
    module: 'segmentation',
    label: 'Without standardizing',
    summary: segSummary('SEG-04'),
    when: 'Wed 11 Nov, 09:05',
    settings: segSettings('SEG-04'),
  },
  {
    id: 'POS-01',
    module: 'positioning',
    label: 'Map with segment arrows',
    summary: `${engineRuns['POS-01'].n_brands} brands, ${engineRuns['POS-01'].n_attributes} attributes, arrows from SEG-03`,
    when: 'Thu 12 Nov, 14:20',
    final: true,
    to: '/positioning',
    settings: [
      { name: 'Brands', value: String(engineRuns['POS-01'].n_brands) },
      { name: 'Attributes', value: String(engineRuns['POS-01'].n_attributes) },
      { name: 'Dimensions', value: String(engineRuns['POS-01'].settings.n_dimensions) },
      { name: 'Segment preferences', value: 'Arrows from SEG-03' },
    ],
  },
  {
    id: 'CJ-01',
    module: 'conjoint',
    label: 'All respondents',
    summary: `${cjSummary}, all respondents`,
    when: 'Sun 15 Nov, 18:31',
    settings: cjSettings('CJ-01'),
  },
  {
    id: 'CJ-02',
    module: 'conjoint',
    label: 'By segment',
    summary: `${cjSummary}, each segment from SEG-03`,
    when: 'Sun 15 Nov, 18:31',
    final: true,
    to: '/conjoint/results',
    settings: cjSettings('CJ-02'),
  },
  {
    id: 'CJ-03',
    module: 'conjoint',
    label: 'Vanilla protein design',
    summary: `Simulator on CJ-02, 1 design against ${competitors.length} competitors`,
    when: 'Sun 15 Nov, 18:47',
    to: '/conjoint/results',
    settings: cjSettings('CJ-02', savedDesignText),
  },
]

export const runHistory = {
  hint: 'Tick two runs of the same module to compare them.',
  finalTip: 'Marked as final for your interpretation',
  /** Pair shown when the screen opens, before and after the conjoint run. */
  defaultPair: {
    before: ['SEG-02', 'SEG-03'] as RunId[],
    after: ['CJ-01', 'CJ-02'] as RunId[],
  },
  noResultComparison: 'No result comparison is prepared for this pair in the demo.',
}

/** Run SEG-02 against the final run SEG-03: which segments keep their respondents, and which one is split. */
const fourSegments = engineRuns['SEG-02'].segments
const unchangedSegments = segments.filter((segment) =>
  fourSegments.some((part) => part.mostly === segment.id && part.same_respondents),
)
const splitSegment = segments.find((segment) => fourSegments.filter((part) => part.mostly === segment.id).length > 1)!
const splitParts = fourSegments.filter((part) => part.mostly === splitSegment.id).sort((a, b) => b.n - a.n)
const extraName = `Segment ${fourSegments.length}`
const onePercentOneModel = whole((engineRuns['CJ-01'].all.importance as Record<string, number>).Price)

/**
 * Comparisons, keyed by "A|B" in run-history order. The sentences are fixed,
 * their numbers come from the engine. The settings table is always worked
 * out from the runs themselves. A pair without an entry here gets the
 * settings table and a sentence built from it.
 */
export const comparisons: Record<
  string,
  {
    sentence: string
    /** Which result block the compare view shows for this pair. */
    result: 'importance' | 'design' | 'segments'
    whatChanged: string
  }
> = {
  'CJ-01|CJ-02': {
    sentence:
      'One setting differs: who the utilities are estimated for. The overall picture is almost the same in both runs.',
    result: 'importance',
    whatChanged: `A fits one model to everyone. B fits one per segment, and its column for all respondents is the average of the ${inWords(segments.length)} segments, so it differs a little from A (price: ${onePercentOneModel}% in A, ${quoted.importance.all.price}% in B). The segments disagree with the overall picture: price explains ${quoted.importance.price.price}% of the choice for Price-sensitive, but only ${quoted.importance.health.price}% for Health-focused, where sugar leads with ${quoted.importance.health.sugar}%.`,
  },
  'CJ-02|CJ-03': {
    sentence: 'The estimates are the same. B adds one product design in the simulator.',
    result: 'design',
    whatChanged: `Nothing in the estimates. B stores one design, Vanilla protein design, with its predicted shares against the ${inWords(competitors.length)} competitors.`,
  },
  'SEG-02|SEG-03': {
    sentence: `One setting differs: the number of segments. ${capital(inWords(unchangedSegments.length))} of the ${inWords(segments.length)} segments stay the same.`,
    result: 'segments',
    whatChanged: `${listed(unchangedSegments.map((segment) => segment.name))} hold the same respondents in both runs. The ${splitSegment.n} ${splitSegment.name} respondents in B are split in A into a group of ${splitParts[0].n} and a group of ${splitParts[1].n}.`,
  },
}

/** Standardized mean of a basis variable in a group of respondents, as "+1.1" or "−0.9". */
const signedMean = (value: number) => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(1)}`
/** The basis variables, by how much the two groups of the split segment differ on them. */
const splitDifferences = engineRuns['SEG-03'].basis_variables
  .map((variable) => {
    const means = (group: { mean_standardized: Record<string, number> }) => group.mean_standardized[variable.key]
    const values = [means(splitParts[0]), means(splitParts[1]), means(engine.segments.find((segment) => segment.id === splitSegment.id)!)]
    return { variable: variable.label, values, gap: Math.abs(values[0] - values[1]) }
  })
  .sort((a, b) => b.gap - a.gap)
const splitRowsShown = 3

/** Result block for SEG-02 against SEG-03 (segment sizes and the split groups). */
export const segmentComparison = {
  sizesNote: 'Unchanged segments are faded',
  a: segments.flatMap((segment) =>
    fourSegments
      .filter((part) => part.mostly === segment.id)
      .sort((x, y) => y.n - x.n)
      .map((part, index) =>
        index === 0
          ? { segment: segment.id, share: whole(part.share), n: part.n, same: part.same_respondents }
          : { segment: 'extra' as const, name: extraName, share: whole(part.share), n: part.n, same: false },
      ),
  ),
  b: segments.map((segment) => ({
    segment: segment.id,
    share: segment.share,
    n: segment.n,
    same: unchangedSegments.includes(segment),
  })),
  split: {
    title: 'How the split groups differ',
    note: `${capital(inWords(splitRowsShown))} largest differences, in standard deviations from the average`,
    columns: [
      `A, ${splitSegment.name} (${splitParts[0].n})`,
      `A, ${extraName} (${splitParts[1].n})`,
      `B, ${splitSegment.name} (${splitSegment.n})`,
    ],
    rows: splitDifferences.slice(0, splitRowsShown).map((row) => ({
      variable: row.variable,
      values: row.values.map(signedMean),
      /** The group of A that lies further from the average on this variable. */
      bold: Math.abs(row.values[0]) >= Math.abs(row.values[1]) ? 0 : 1,
    })),
    rest: `The other ${splitDifferences.length - splitRowsShown} basis variables differ less.`,
  },
}

// ---------------------------------------------------------------------------
// 7. Interpretation and AI tutor scripts
// ---------------------------------------------------------------------------

export const interpretation = {
  eyebrow: 'Interpretation, Alpine Oat Co.',
  question: 'Which product should Alpine Oat launch, and for which segment?',
  ask: 'Prof. Marti asks for a recommendation backed by at least two of your results, in 150 to 250 words.',
  wordRange: [150, 250],
  savedAt: '18:52',
  deadlineNote: 'You can keep editing until Fri 27 Nov, 23:59',
  /** The student's first draft. */
  draft: `I recommend that Alpine Oat launches the vanilla, high-protein drink without added sugar in the 1 L pack. In the simulator this design reaches ${quoted.design.all}% share against ${listed(competitors.map((c) => (c.name.startsWith('Supermarket') ? 'the supermarket own brand' : c.name)))}. Because price is the most important attribute (${quoted.importance.all.price}%), it should be sold at ${lowPrice} to win as many buyers as possible.`,
  pinned: [
    { run: 'CJ-02' as RunId, title: 'Attribute importance, all respondents and by segment' },
    { run: 'CJ-03' as RunId, title: 'Predicted share against three competitors' },
    { run: 'SEG-03' as RunId, title: 'Segment sizes' },
  ],
  checklistTitle: 'Check yourself before you submit',
  checklist: [
    { text: 'I name one target segment.', done: false },
    { text: 'I use at least two results and say which run they come from.', done: true },
    { text: 'I state one thing the model does not tell us.', done: false },
  ],
}

/** The price of the saved design, as the level is named: "CHF 2.50". */
const savedPrice = engine.conjoint.saved_design.Price
/** The segment whose share of the saved design rises most when the price drops to the lowest level. */
const largestJump = segments
  .map((segment) => segment.id)
  .sort((a, b) => quoted.designAtLowPrice[b] - quoted.design[b] - (quoted.designAtLowPrice[a] - quoted.design[a]))[0]
/** The student's answer to the coach's first question: what matters most in two of the segments. */
const studentSeesSegments = `No. For Health-focused it is ${topAttributeOf('health')} (${topImportanceOf('health')}%), and for Taste-driven it is ${topAttributeOf('taste')}.`

/**
 * Scripted AI tutor. No model is called: every message below is fixed text,
 * and only the numbers in it come from the engine's results.
 * The three modes behave differently, which is the point of the demo.
 */
export const tutor = {
  visibleTo: 'Visible to Prof. Marti',
  visibleNote: 'Prof. Marti can read your interpretation and this conversation.',

  off: {
    title: 'No AI tutor in this assignment',
    body: 'The interpretation box is still there, and Prof. Marti still reads what you write. You work from your own results.',
  },

  coach: {
    subtitle: 'Reacts to what you wrote above',
    hintLimit: 3,
    /** The conversation as it stands when the screen opens. */
    opening: [
      {
        from: 'coach',
        text: `You set the price at ${lowPrice} because price is the most important attribute overall. Look at your pinned importance chart. Is price the most important attribute in every segment?`,
      },
      {
        from: 'student',
        text: studentSeesSegments,
      },
      {
        from: 'coach',
        text: `Good. So who is your product for? And if that segment cares less about price, what does it mean for ${lowPrice}?`,
      },
    ] as ChatMessage[],
    /** What happens next. Each click on the reply field inserts the next student reply. */
    turns: [
      {
        student: `It is for Health-focused. They care most about ${topAttributeOf('health')}, and price counts for only ${quoted.importance.health.price}% of their choice, so I do not need the lowest price to win them.`,
        coach:
          'That is a clear target. Which of your results shows what happens to your share in that segment when the price goes up? Name the run.',
      },
      {
        student: `The simulator in CJ-03. At ${savedPrice} the design still reaches ${quoted.design.health}% in Health-focused.`,
        coach: `Good, that is evidence. One more question before you rewrite your text: is ${quoted.design.health}% a forecast of sales? What does the model leave out?`,
      },
    ],
    closing: 'This is the end of the scripted conversation in the demo.',
    hints: [
      'Compare the Price row across the four columns of your pinned importance table. The segments do not agree with each other.',
      'In the simulator, change only the price of your design. Watch the Health-focused column, not the overall share.',
      'A complete recommendation names the segment, gives two results with their run tags, and says one thing the model cannot tell you.',
    ],
    whyNoAnswer: 'The coach never writes your conclusion. Explain mode is not available in this assignment.',
    replyPlaceholder: 'Reply to the coach',
  },

  explain: {
    subtitle: 'Unlocks after you submit',
    lockedTitle: 'Locked until you submit your interpretation',
    lockedBody:
      'Write and submit your own reading first. After that, the tutor explains the results in full, and you can compare the two.',
    intro: 'You have submitted your interpretation. Here is how I read the same results.',
    points: [
      {
        title: 'What the importance table says',
        text: `Price explains ${quoted.importance.all.price}% of the choice overall, but that average hides the segments. It is ${quoted.importance.price.price}% for Price-sensitive, ${quoted.importance.taste.price}% for Taste-driven and only ${quoted.importance.health.price}% for Health-focused, where sugar leads with ${quoted.importance.health.sugar}%.`,
      },
      {
        title: 'What it means for your design',
        text: `A vanilla, high-protein drink without added sugar is what Health-focused buyers want. In the simulator (CJ-03) it reaches ${quoted.design.health}% in that segment at ${savedPrice}, and ${quoted.design.all}% overall. At ${lowPrice} the overall share rises to ${quoted.designAtLowPrice.all}%, and the largest jump is among ${segmentOf(largestJump).name} buyers (${quoted.design[largestJump]}% to ${quoted.designAtLowPrice[largestJump]}%). In Health-focused it only moves from ${quoted.design.health}% to ${quoted.designAtLowPrice.health}%.`,
      },
      {
        title: 'What the model does not tell you',
        text: `These are shares of preference among ${inWords(competitors.length + 1)} products. Brand strength, shelf space and advertising are not in the model, so ${quoted.design.all}% is not a sales forecast.`,
      },
      {
        title: 'Compared with what you wrote',
        text: `You chose ${lowPrice} because price matters most overall. That holds for the average respondent, but not for the segment your product fits best. Your text also does not name a target segment yet.`,
      },
    ],
    followUpPlaceholder: 'Ask a follow-up question',
  },
}

// ---------------------------------------------------------------------------
// 8. Professor: assignment setup
// ---------------------------------------------------------------------------

export const assignmentSetup = {
  lead: 'Four decisions: the case, the modules, the deadline, and how much help the AI tutor may give.',
  caseNote: 'Each case comes with data, a teaching note and exam questions',
  cases: [
    {
      id: 'alpine',
      name: 'Alpine Oat Co.',
      meta: `Oat drinks, Switzerland, ${respondentCount} respondents`,
      text: 'Which new product to launch and for which segment. Covers segmentation, positioning and conjoint.',
      previewTitle: 'Alpine Oat Co.: which product, for which segment?',
    },
    {
      id: 'lumen',
      name: 'Lumen e-bikes',
      meta: 'City e-bikes, 420 respondents',
      text: 'Pricing a new model against two rivals. Covers conjoint and the market simulator.',
      previewTitle: 'Lumen e-bikes: how to price the new model?',
    },
    {
      id: 'own',
      name: 'Use your own case',
      meta: 'Your exercises and data',
      text: 'Send us your current case and dataset. We move them onto the platform for you.',
      previewTitle: 'Your own case',
      dashed: true,
    },
  ],
  modulesNote: 'Students only see the modules you tick',
  /** The modules ticked when the screen opens: the three of this assignment. */
  modulesTicked: ['segmentation', 'positioning', 'conjoint'] as ModuleId[],
  opens: 'Mon 9 Nov 2026, 08:00',
  due: 'Fri 27 Nov 2026, 23:59',
  dueShort: 'Due Fri 27 Nov, 23:59',
  weight: '20%',
  modeNote: 'One mode for the whole assignment. Students cannot change it.',
  reasonLabel: 'Your reason, shown to students on the tutor panel',
  reasonNote: 'Students accept a limit more easily when they know why it is there.',
  hintsDefault: 3,
  toggles: {
    interpretationFirst: {
      title: 'Interpretation first.',
      text: 'The coach only reacts after the student has written something. Always on.',
    },
    canRead: { title: 'I can read AI conversations.', text: 'Students are told on every screen.' },
    explainLock: {
      title: 'Unlocks after submission.',
      text: 'Students get the explanation only after they submit their own interpretation. Always on.',
    },
    offNote: {
      title: 'The interpretation box stays.',
      text: 'You still read every student’s own reasoning. Always on.',
    },
  },
  publishNote:
    'You can change the deadline after publishing. The AI mode is locked once the first student starts, so that everyone works under the same rules.',
  published: 'Students now see this assignment on their course home.',
}

// ---------------------------------------------------------------------------
// 9. Professor: submissions review
// ---------------------------------------------------------------------------

/** Compared with the other brands, the attribute on which the own brand is rated lowest (from run POS-01). */
const ownBrandWeakest = engineRuns['POS-01'].brands.find((brand) => brand.own)!.weakest

export const submissions = {
  title: 'Alpine Oat Co.',
  line: 'Which product, for which segment? Closed on Fri 27 Nov, 23:59. AI tutor mode:',
  stats: { submitted: 42, of: 46, drafts: 31, sent: 11, hints: '1.8 of 3' },
  mistakesNote: 'Found in the students’ own interpretations, before feedback',
  mistakes: [
    {
      title: 'Treats overall attribute importance as true for every segment',
      example: 'Example: "Price is most important, so we should be the cheapest."',
      students: 17,
    },
    {
      title: 'Confuses importance with preference for a level',
      example: `Example: "Sugar has ${quoted.importance.all.sugar}% importance, so buyers want less sugar."`,
      students: 11,
    },
    {
      title: 'Reads predicted share as a sales forecast',
      example: 'Does not mention what the model leaves out, such as brand or distribution.',
      students: 9,
    },
  ],
  students: [
    { name: 'Aylin Demir', initials: 'AD', status: 'sent' },
    { name: 'Lea Brunner', initials: 'LB', status: 'draft' },
    { name: 'Jonas Keller', initials: 'JK', status: 'draft' },
    { name: 'Mateo Rossi', initials: 'MR', status: 'draft' },
    { name: 'Nora Frei', initials: 'NF', status: 'sent' },
    { name: 'Samir Haddad', initials: 'SH', status: 'draft' },
    { name: 'Tim Vogel', initials: 'TV', status: 'missing' },
    { name: 'Yuki Tanaka', initials: 'YT', status: 'draft' },
  ] as { name: string; initials: string; status: 'sent' | 'draft' | 'missing' }[],
  /** The one submission that is filled in for the demo. */
  lea: {
    submitted: 'Submitted Thu 26 Nov, 21:14, 99 words',
    paragraphs: [
      `I recommend launching a vanilla, high-protein oat drink without added sugar in a 1 L pack at ${savedPrice}, aimed at the Health-focused segment (${segmentOf('health').share}% of respondents, SEG-03).`,
      `For this segment sugar is the most important attribute (${quoted.importance.health.sugar}%) and price counts for only ${quoted.importance.health.price}% (CJ-02), so a low price is not needed. In the simulator the design reaches ${quoted.design.health}% share within Health-focused and ${quoted.design.all}% overall (CJ-03).`,
      `Price is the most important attribute overall (${quoted.importance.all.price}%), but this comes mainly from the Price-sensitive segment, where my design reaches only ${quoted.design.price}%. I would not try to win that segment with this product.`,
    ],
    cites: ['SEG-03', 'CJ-02', 'CJ-03'] as RunId[],
    conversationNote: '6 messages, 2 of 3 hints used',
    conversation: [
      { from: 'coach', text: 'Is price the most important attribute in every segment?' },
      { from: 'student', text: studentSeesSegments },
      { from: 'coach', text: `So who is your product for? And what does that mean for ${lowPrice}?` },
    ] as ChatMessage[],
    draftChange:
      `Between her first draft and the final text she changed the price from ${lowPrice} to ${savedPrice} and added a target segment.`,
    feedback: {
      scores: [
        { title: 'Decision and target segment', note: 'Names product, price and segment.', score: 5, of: 5 },
        {
          title: 'Use of evidence',
          note: 'Three runs cited. The positioning map is not used.',
          score: 4,
          of: 5,
        },
        { title: 'Limits of the model', note: `Treats ${quoted.design.health}% as an outcome, no caveat.`, score: 2, of: 5 },
      ],
      comment: `Clear recommendation with a named segment, and you support it with three runs. You noticed that the overall weight of price comes from the Price-sensitive segment, which many missed.\n\nTwo things to improve. You do not use the positioning map, where Alpine Oat is weakest on “${ownBrandWeakest}”. And ${quoted.design.health}% is a share of preference, not a sales forecast: say what the model leaves out.`,
      footnote: 'Nothing reaches the student until you approve. The grade is yours: the draft is a starting point.',
    },
  },
  emptyStudent: 'Only Lea Brunner’s submission is filled in for this demo.',
}

// ---------------------------------------------------------------------------
// 10. Segmentation screens (Priority 2, view-only)
// ---------------------------------------------------------------------------

export const segmentationSetup = {
  lead: 'Four short steps. Every step has a default that works for this case, so you can change one thing at a time.',
  doneSteps: [
    {
      title: 'Variables',
      text: `${basisCount} basis variables selected. The ${descriptorCount} descriptors are kept aside to describe the segments later.`,
    },
    {
      title: 'Standardize',
      text: 'On. Each variable is rescaled so that none counts more just because its answers are more spread out.',
    },
  ],
  method: {
    title: 'Method',
    question: 'How should respondents be grouped?',
    options: [
      {
        id: 'hierarchical',
        title: 'Hierarchical clustering',
        tag: 'Good first run',
        does: 'Starts with every respondent alone, then joins the two most similar groups, again and again. The result is a tree (dendrogram).',
        when: 'You do not yet know how many segments to expect. The tree helps you decide.',
        doneIn: 'SEG-01' as RunId,
      },
      {
        id: 'kmeans',
        title: 'K-means',
        tag: 'Default after a tree',
        selected: true,
        does: 'You fix the number of segments. The model then moves respondents between segments until each segment is as tight as possible.',
        when: 'You have a number of segments in mind, for example from the tree in SEG-01. Gives cleaner segments than cutting the tree.',
      },
    ],
    advanced: {
      note: 'Distance measure and random starts. The defaults are fine for this case.',
      rows: [
        {
          term: 'Distance',
          text: `Euclidean. Straight-line distance between two respondents across the ${basisCount} variables.`,
        },
        {
          term: 'Random starts',
          text: `${engineRuns['SEG-03'].n_starts}. K-means is repeated from ${engineRuns['SEG-03'].n_starts} starting points and the best result is kept, so that the answer does not depend on luck.`,
        },
      ],
    },
  },
  number: {
    title: 'Number of segments',
    text: 'How many groups K-means should form.',
    options: [2, 3, 4, 5, 6, 7, 8],
    suggested: engine.tree.suggested_n_segments,
    whyBefore: `Why ${engine.tree.suggested_n_segments}: in the tree from`,
    whyAfter: `the distance jumps from ${oneDecimal(engine.tree.distance_before_jump)} to ${oneDecimal(engine.tree.distance_after_jump)} when going from ${engine.tree.suggested_n_segments} groups to ${engine.tree.suggested_n_segments - 1}. A big jump means two quite different groups would be forced together.`,
  },
  thisRun: {
    id: 'SEG-03' as RunId,
    label: `Final, ${engineRuns['SEG-03'].settings.n_segments} segments`,
    lines: [
      { name: 'Variables', value: `${basisCount} basis variables` },
      { name: 'Standardize', value: 'On' },
      { name: 'Method', value: 'K-means' },
      { name: 'Number of segments', value: `${engineRuns['SEG-03'].settings.n_segments} (default, not yet confirmed)` },
    ],
    compareWith: 'SEG-02' as RunId,
    compareText: `: only the number of segments changes, from ${engineRuns['SEG-02'].settings.n_segments} to ${engineRuns['SEG-03'].settings.n_segments}.`,
    note: 'You can run now. Unconfirmed steps use their defaults.',
  },
}

/** A node of the dendrogram: either a leaf (a small group of n respondents) or a merge at a distance. */
export type TreeNode = { n: number } | { at: number; left: TreeNode; right: TreeNode }

/** Where the tree is cut: halfway between the last merge inside a segment and the first merge of two segments. */
const cutAt = Math.round(((engine.tree.cut_between.above + engine.tree.cut_between.below) / 2) * 10) / 10

export const segmentationResults = {
  runId: 'SEG-03' as RunId,
  summary: `${segSummary('SEG-03').replace('variables', 'basis variables')}. Run on Tue 10 Nov at 16:40.`,
  headline: `${capital(inWords(segments.length))} segments. The largest, ${largestSegment.name}, holds ${largestSegment.share}% of respondents.`,
  profileNote: `Bars show how far the segment is from the average respondent, in standard deviations. Only the four largest differences are shown. All ${basisCount} variables are in the details below.`,
  renameTip: 'Segment names are yours. Click to rename.',
  tree: {
    title: `Why ${inWords(engine.tree.suggested_n_segments)} segments? The tree from`,
    fromRun: 'SEG-01' as RunId,
    /** The tree is cut at this distance, which gives three segments. */
    cutAt,
    cutLabel: `Cut here: ${engine.tree.suggested_n_segments} segments`,
    axisLabel: 'Distance when groups merge',
    /**
     * One branch per segment. The first two branches merge first (at
     * mergeFirstTwo), then the third joins them (at mergeAll). The tree draws
     * them in the order of the segments where the two that merge stay neighbours.
     */
    branches: engine.tree.branches.map((branch) => ({
      segment: branch.segment as SegmentId,
      n: branch.n,
      tree: branch.tree as unknown as TreeNode,
    })),
    mergeFirstTwo: engine.tree.merge_first_two,
    mergeAll: engine.tree.merge_all,
    howToRead: [
      'Each line at the bottom is a small group of similar respondents (the number is its size). Groups join as you move up. The higher the join, the more different the two groups are.',
      `The cut line crosses ${inWords(engine.tree.suggested_n_segments)} branches, so ${inWords(engine.tree.suggested_n_segments)} segments.`,
      `The tree is a first look. K-means then moves some respondents to a better fitting segment: ${whole(engine.tree.share_in_final_segment)}% stay in the segment of their branch.`,
    ],
  },
  details: [
    {
      title: `Segment means on all ${basisCount} basis variables`,
      note: 'Table, original and standardized values',
    },
    { title: 'Descriptor variables by segment', note: `${descriptorCount} tables with significance tests` },
    {
      title: 'Model quality and settings',
      note: `Variance explained ${whole(engineRuns['SEG-03'].variance_explained)}%, ${engineRuns['SEG-03'].n_starts} random starts, converged in ${engineRuns['SEG-03'].n_iterations} steps`,
    },
  ],
  detailsEmpty: 'This table is not filled in for the demo.',
}

// ---------------------------------------------------------------------------
// 11. Positioning screen (Priority 2, view-only)
//     Coordinates are positions on the two map dimensions.
// ---------------------------------------------------------------------------

const brandMap = engineRuns['POS-01']
/**
 * The map is drawn 2.76 units wide and 2.5 units high on each side of the centre.
 * The engine's coordinates are multiplied by one factor so that they fit, which keeps
 * all distances and angles as they are. Of an attribute line and a preference arrow
 * only the direction is read, so each kind gets one factor for its length that reads well.
 */
const MAP_SCALE = 0.55
const ATTRIBUTE_LENGTH = 1.55
const PREFERENCE_LENGTH = 2.3
const twoDecimals = (value: number) => Math.round(value * 100) / 100
const percentOneDecimal = (fraction: number) => Math.round(fraction * 1000) / 10
const brandScaleMax = engine.case.brand_rating_scale.maximum

/** One sentence on what a brand is rated high and low on, compared with the other brands. */
function brandTip(brand: (typeof brandMap.brands)[number]): string {
  const means = brand.means as Record<string, number>
  const standardized = brand.standardized as Record<string, number>
  const mean = (key: string) => oneDecimal(means[key])
  if (Math.max(...Object.values(standardized).map(Math.abs)) < 0.5) {
    return `Close to the average on every attribute. Highest on ${brand.strongest[0]} (${mean(brand.strongest_keys[0])} of ${brandScaleMax}).`
  }
  // A second strength is only named when the brand is rated above the average brand on it.
  const second =
    standardized[brand.strongest_keys[1]] > 0 ? ` and ${brand.strongest[1]} (${mean(brand.strongest_keys[1])})` : ''
  return `Strongest on ${brand.strongest[0]} (${mean(brand.strongest_keys[0])} of ${brandScaleMax})${second}. Weakest on ${brand.weakest} (${mean(brand.weakest_key)}).`
}

/** Where a label sits so that it does not cover a neighbour. Checked by eye for the engine's map. */
type BrandLabel = 'left' | 'right' | 'belowLeft'
type AttributeLabel = 'right' | 'top' | 'below' | 'topLeft' | 'rightUp' | 'rightDown'
type PreferenceLabel = 'left' | 'right' | 'below' | 'above'
const brandLabelSide: Record<string, BrandLabel> = { 'Alpine Oat': 'belowLeft', 'Supermarket own brand': 'left' }
const attributeLabelSide: Record<string, AttributeLabel> = {
  good_value: 'below',
  tasty: 'top',
  sustainable: 'rightUp',
  natural: 'rightDown',
}
const preferenceLabelSide: Record<SegmentId, PreferenceLabel> = { health: 'right', taste: 'right', price: 'above' }
const mapShare = brandMap.variance_explained_by_map

export const positioning = {
  runId: 'POS-01' as RunId,
  summary: `${brandMap.n_brands} brands, ${brandMap.n_attributes} attributes, arrows from SEG-03. Run on Thu 12 Nov at 14:20.`,
  headline: `Two dimensions capture ${mapShare >= 0.995 ? percentOneDecimal(mapShare) : whole(mapShare)}% of how respondents see the ${inWords(brandMap.n_brands)} brands.`,
  axes: {
    x: `Dimension 1 (${whole(brandMap.variance_explained[0])}% of variance)`,
    y: `Dimension 2 (${whole(brandMap.variance_explained[1])}%)`,
  },
  brands: brandMap.brands.map((brand) => ({
    name: brand.name,
    x: twoDecimals(brand.coordinates[0] * MAP_SCALE),
    y: twoDecimals(brand.coordinates[1] * MAP_SCALE),
    own: brand.own,
    label: brandLabelSide[brand.name] ?? 'right',
    tip: brandTip(brand),
  })) as { name: string; x: number; y: number; own?: boolean; label: BrandLabel; tip: string }[],
  attributes: brandMap.attributes.map((attribute) => ({
    name: capital(attribute.label),
    x: twoDecimals(attribute.direction[0] * attribute.length * ATTRIBUTE_LENGTH),
    y: twoDecimals(attribute.direction[1] * attribute.length * ATTRIBUTE_LENGTH),
    label: attributeLabelSide[attribute.key] ?? 'right',
  })) as { name: string; x: number; y: number; label: AttributeLabel }[],
  /** Preference arrows: the further a brand lies along the arrow, the more the segment prefers it. */
  preferences: brandMap.preferences.map((preference) => ({
    segment: preference.segment as SegmentId,
    x: twoDecimals(preference.direction[0] * preference.length * PREFERENCE_LENGTH),
    y: twoDecimals(preference.direction[1] * preference.length * PREFERENCE_LENGTH),
    label: preferenceLabelSide[preference.segment as SegmentId],
  })) as { segment: SegmentId; x: number; y: number; label: PreferenceLabel }[],
  arrowTip: 'The further a brand lies along this arrow, the more this segment prefers it.',
  howToRead: [
    'Brands that sit close together are seen as similar.',
    'A brand far along an attribute line scores high on that attribute.',
    'A segment prefers brands that lie far along its arrow.',
  ],
  layersNote: 'From run SEG-03',
  arrowsNote: 'Arrows fit when more is always better. Ideal points fit when a segment has a sweet spot.',
  variance: [
    { name: 'Dimension 1', value: percentOneDecimal(brandMap.variance_explained[0]), color: '#56607A' },
    { name: 'Dimension 2', value: percentOneDecimal(brandMap.variance_explained[1]), color: '#8C95AB' },
    {
      name: 'Not shown',
      value: Math.round((100 - percentOneDecimal(brandMap.variance_explained[0]) - percentOneDecimal(brandMap.variance_explained[1])) * 10) / 10,
      color: '#B4BAC8',
    },
  ],
  varianceNote: 'How much of the brand ratings the flat map keeps.',
}
