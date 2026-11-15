/**
 * MarketMind Lab demo: the one data file.
 *
 * Everything the demo shows comes from here. All of it is invented example
 * data for the fictional case "Alpine Oat Co.". Nothing is estimated while
 * the demo runs: the part-worths below are hard-coded, and the market
 * simulator only adds them up (see src/lib/conjoint.ts).
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
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Mode = 'off' | 'coach' | 'explain'
export type ModuleId = 'segmentation' | 'positioning' | 'conjoint'
export type SegmentId = 'health' | 'taste' | 'price'
/** A set of part-worths: the whole sample, or one segment. */
export type GroupId = 'all' | SegmentId
export type AttrId = 'flavor' | 'sugar' | 'protein' | 'pack' | 'price'
/** A product: for every attribute, the index of the chosen level. */
export type Design = Record<AttrId, number>
export type RunId = 'SEG-01' | 'SEG-02' | 'SEG-03' | 'SEG-04' | 'POS-01' | 'CJ-01' | 'CJ-02' | 'CJ-03'

export interface Segment {
  id: SegmentId
  name: string
  short: string
  color: string
  shape: 'circle' | 'square' | 'triangle'
  /** Share of the 300 respondents, in percent. */
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

export const modules = {
  active: [
    { id: 'segmentation' as ModuleId, name: 'Segmentation', to: '/segmentation' },
    { id: 'positioning' as ModuleId, name: 'Positioning', to: '/positioning' },
    { id: 'conjoint' as ModuleId, name: 'Conjoint analysis', to: '/conjoint' },
  ],
  comingSoon: [
    'Sentiment analysis',
    'Predictive modeling',
    'Price optimization',
    'GE McKinsey matrix',
    'Resource allocation',
    'Customer lifetime value',
    'Network analysis',
    'Bass forecasting',
    'Panel regression',
  ],
}

// ---------------------------------------------------------------------------
// 2. Course home
// ---------------------------------------------------------------------------

export const assignment = {
  title: 'Alpine Oat Co.: which product, for which segment?',
  kind: 'Individual assignment, 20% of the course grade',
  summary: 'Segmentation, positioning and conjoint analysis on a survey of 300 Swiss oat-drink buyers.',
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

export const caseBrief = {
  name: 'Alpine Oat Co.',
  question: 'Which new oat drink should Alpine Oat launch, and for which customer segment?',
  text: 'Alpine Oat is a Swiss oat-drink brand with one product, Original, sold in supermarkets. Growth has slowed as Valloat, Lumo and supermarket own brands widen their ranges. Management can fund one launch next year and wants to know which buyers to aim for and which product would win them.',
  /** Shown on the case brief, because the demo names two real brands next to invented numbers. */
  fictionNote:
    'Alpine Oat Co. is a fictional teaching case. All numbers are invented example data, also those shown for the brands Valloat and Lumo.',
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
    { name: 'Segmentation survey', detail: '300 respondents, 14 variables' },
    { name: 'Brand perceptions', detail: '4 brands rated on 6 attributes' },
    { name: 'Conjoint choices', detail: '12 choice tasks per respondent' },
  ],
  summary: [
    { value: '300', label: 'respondents', note: 'Online panel, September 2026' },
    { value: '8', label: 'basis variables', note: 'Used to form the segments' },
    { value: '6', label: 'descriptor variables', note: 'Used to describe them afterwards' },
    { value: '0.4%', label: 'answers missing', note: '10 of 2,400 basis answers' },
  ],
  basisNote: 'Importance ratings from 1 (not important) to 7 (very important)',
  /** shape: relative frequency of the answers 1 to 7, the most frequent answer = 1. */
  basisVariables: [
    {
      name: 'Low sugar',
      asked: 'How important is it that the drink has little or no added sugar?',
      shape: [0.33, 0.43, 0.47, 0.6, 0.79, 1, 0.93],
      mean: 4.9,
    },
    {
      name: 'High protein',
      asked: 'How important is a high protein content?',
      shape: [0.93, 1, 0.94, 0.88, 0.79, 0.69, 0.54],
      mean: 3.7,
    },
    {
      name: 'Natural ingredients',
      asked: 'How important is a short, natural ingredient list?',
      shape: [0.2, 0.31, 0.43, 0.63, 0.89, 1, 0.83],
      mean: 5.0,
    },
    {
      name: 'Taste',
      asked: 'How important is the taste on its own, without coffee or cereal?',
      shape: [0.1, 0.18, 0.33, 0.54, 0.82, 1, 0.87],
      mean: 5.3,
    },
    {
      name: 'Creaminess',
      asked: 'How important is a creamy texture, for example in coffee?',
      shape: [0.33, 0.5, 0.67, 0.87, 1, 0.93, 0.7],
      mean: 4.5,
    },
    {
      name: 'Low price',
      asked: 'How important is paying as little as possible?',
      shape: [0.5, 0.65, 0.81, 0.96, 1, 0.96, 0.88],
      mean: 4.4,
    },
    {
      name: 'Sustainability',
      asked: 'How important are sustainable sourcing and packaging?',
      shape: [0.29, 0.42, 0.58, 0.87, 1, 0.94, 0.74],
      mean: 4.6,
    },
    {
      name: 'Known brand',
      asked: 'How important is buying a brand you already know?',
      shape: [0.76, 0.93, 1, 0.9, 0.73, 0.52, 0.35],
      mean: 3.6,
    },
  ],
  descriptorNote: 'Not used to form segments. They tell you who is in each segment.',
  descriptorVariables: [
    { name: 'Age', records: 'Age group, from 18 to 24 up to 65 and older', type: '6 groups' },
    { name: 'Household size', records: 'Number of people living in the household', type: 'Number' },
    { name: 'Weekly consumption', records: 'Litres of oat drink bought per week', type: 'Number' },
    { name: 'Main shop', records: 'Supermarket, discounter, organic shop or online', type: '4 categories' },
    { name: 'Uses in coffee', records: 'Whether oat drink is mostly used in coffee', type: 'Yes or no' },
    { name: 'Sport per week', records: 'How often the respondent exercises', type: '4 groups' },
  ],
  rawTable: {
    summary: '300 rows, 15 columns. Open only if you need to check single answers.',
    rows: [
      { id: 1001, answers: [3, 2, 4, 6, 1, 1, 7, 5] },
      { id: 1002, answers: [1, 3, 5, 1, 5, 2, 1, 1] },
      { id: 1003, answers: [4, 4, 1, 2, 1, 5, 4, 1] },
      { id: 1004, answers: [7, 5, 1, 2, 6, 6, 5, 1] },
      { id: 1005, answers: [5, 5, 4, 1, 2, 1, 5, 7] },
      { id: 1006, answers: [2, 3, 4, 2, 5, 1, 5, 3] },
    ],
    note: 'Showing 6 of 300 rows and the 8 basis variables. Choose columns or download the full table as CSV.',
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

export const segments: Segment[] = [
  {
    id: 'health',
    name: 'Health-focused',
    short: 'Health',
    color: '#15996B',
    shape: 'circle',
    share: 38,
    n: 114,
    profile: [
      { variable: 'Low sugar', z: 1.1 },
      { variable: 'High protein', z: 0.8 },
      { variable: 'Natural ingredients', z: 0.7 },
      { variable: 'Low price', z: -0.5 },
    ],
    who: [
      'Median age 34',
      '62% exercise 3 or more times a week',
      'Shop mostly in supermarkets and organic shops',
    ],
  },
  {
    id: 'taste',
    name: 'Taste-driven',
    short: 'Taste',
    color: '#E2622F',
    shape: 'square',
    share: 34,
    n: 102,
    profile: [
      { variable: 'Taste', z: 1.0 },
      { variable: 'Creaminess', z: 0.9 },
      { variable: 'Known brand', z: 0.4 },
      { variable: 'Low sugar', z: -0.6 },
    ],
    who: [
      'Median age 29',
      '71% use oat drink mostly in coffee',
      'Smallest households, 1.8 people on average',
    ],
  },
  {
    id: 'price',
    name: 'Price-sensitive',
    short: 'Price-sens.',
    color: '#2A78D6',
    shape: 'triangle',
    share: 28,
    n: 84,
    profile: [
      { variable: 'Low price', z: 1.3 },
      { variable: 'Known brand', z: -0.4 },
      { variable: 'Sustainability', z: -0.5 },
      { variable: 'Natural ingredients', z: -0.6 },
    ],
    who: [
      'Median age 41',
      'Largest households, 3.1 people on average',
      '58% shop mainly at a discounter',
    ],
  },
]

/** Neutral colour for "all respondents". */
export const allColor = '#56607A'
/** "Your brand" and "your design" use the primary colour. */
export const ownColor = '#5B2B6E'

// ---------------------------------------------------------------------------
// 5. Conjoint analysis
// ---------------------------------------------------------------------------

export const attributes: { id: AttrId; name: string; levels: string[] }[] = [
  { id: 'flavor', name: 'Flavor', levels: ['Original', 'Vanilla', 'Chocolate'] },
  { id: 'sugar', name: 'Sugar', levels: ['No added sugar', 'Low', 'Regular'] },
  { id: 'protein', name: 'Protein', levels: ['Standard', 'High'] },
  { id: 'pack', name: 'Pack size', levels: ['250 ml', '1 L'] },
  { id: 'price', name: 'Price', levels: ['CHF 1.90', 'CHF 2.50', 'CHF 3.20'] },
]

/** Price of each price level in CHF, used for "best product by revenue". */
export const priceValues = [1.9, 2.5, 3.2]

/** Chocolate cannot be combined with No added sugar. */
export const restriction = {
  a: { attr: 'flavor' as AttrId, level: 2 },
  b: { attr: 'sugar' as AttrId, level: 0 },
}

/**
 * Hard-coded part-worth utilities, one number per level, in the order of the
 * levels above. Within an attribute they add up to zero.
 *
 * "all" is the average of the three segments, weighted by segment size
 * (38%, 34%, 28%) and rounded to two decimals.
 */
export const partWorths: Record<GroupId, Record<AttrId, number[]>> = {
  all: {
    flavor: [-0.06, 0.26, -0.2],
    sugar: [0.34, 0.18, -0.51],
    protein: [-0.14, 0.14],
    pack: [-0.23, 0.23],
    price: [0.7, 0.1, -0.8],
  },
  health: {
    flavor: [0.15, 0.12, -0.27],
    sugar: [0.95, 0.22, -1.17],
    protein: [-0.45, 0.45],
    pack: [-0.09, 0.09],
    price: [0.41, 0.11, -0.52],
  },
  taste: {
    flavor: [-0.51, 0.57, -0.06],
    sugar: [-0.14, 0.23, -0.09],
    protein: [0.05, -0.05],
    pack: [-0.19, 0.19],
    price: [0.44, 0.09, -0.53],
  },
  price: {
    flavor: [0.2, 0.06, -0.26],
    sugar: [0.08, 0.06, -0.14],
    protein: [0.05, -0.05],
    pack: [-0.46, 0.46],
    price: [1.4, 0.11, -1.51],
  },
}

/** Competitor products in the market simulator. Set by the professor. */
export const competitors: { name: string; design: Design }[] = [
  { name: 'Valloat', design: { flavor: 0, sugar: 1, protein: 0, pack: 1, price: 1 } },
  { name: 'Lumo', design: { flavor: 1, sugar: 2, protein: 0, pack: 1, price: 1 } },
  { name: 'Supermarket own brand', design: { flavor: 0, sugar: 2, protein: 0, pack: 1, price: 0 } },
]

/** The design the student saved as run CJ-03: Vanilla, No added sugar, High, 1 L, CHF 2.50. */
export const savedDesign: Design = { flavor: 1, sugar: 0, protein: 1, pack: 1, price: 1 }

export const conjointSetup = {
  lead: 'An attribute is a product feature. A level is one of its options. In the survey, each respondent chose 12 times between three products built from these levels.',
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
  summary: 'Each segment from SEG-03, 5 attributes, 1 restriction. Run on Sun 15 Nov at 18:31.',
  importanceNote:
    'Importance says how much an attribute matters, not which level people prefer. For that, read the part-worths.',
  simulatorNote:
    'Shares are shares of preference. Brand strength, shelf space and advertising are not in the model, so read them as preference, not as a sales forecast. Competitor products are set by your professor.',
  details: [
    {
      id: 'segmentPartWorths',
      title: 'Part-worths for each segment',
      note: 'Table, 13 levels by 3 segments',
    },
    {
      id: 'fit',
      title: 'How well the model fits',
      note: 'Predicts 71% of held-out choices correctly, against 33% by chance',
      body: 'Two of the 12 choice tasks per respondent were kept aside and not used for the estimate. The model then predicted which of the three products each respondent would pick in those tasks. It was right in 71% of the cases. Picking at random would be right in 33%.',
    },
    {
      id: 'export',
      title: 'Export this analysis as Python or R',
      note: 'The same steps as a script you can run and change',
      body: 'In the full product this gives you the analysis as a script, so you can repeat and change it outside MarketMind Lab. The export is not part of this demo.',
    },
  ],
}

/**
 * Numbers quoted in running text further down (interpretation draft, tutor
 * scripts, the professor's review). src/lib/conjoint.ts compares them with the
 * calculated values when the app starts in development mode and warns in the
 * browser console if one of them no longer matches the part-worths.
 */
export const quotedNumbers = {
  /** Saved design, CHF 2.50: predicted share in percent. */
  design: { all: 43, health: 76, taste: 31, price: 15 },
  /** The same design at CHF 1.90. */
  designAtLowPrice: { all: 55, health: 81, taste: 39, price: 38 },
  importance: {
    all: { price: 42, sugar: 24 },
    health: { sugar: 47, price: 20 },
    taste: { flavor: 37, price: 33 },
    price: { price: 63 },
  },
}

// ---------------------------------------------------------------------------
// 6. Runs and comparisons
// ---------------------------------------------------------------------------

const segSettings = (standardize: string, method: string, k: string, starts: string) => [
  { name: 'Basis variables', value: '8 variables' },
  { name: 'Standardize', value: standardize },
  { name: 'Method', value: method },
  { name: 'Number of segments', value: k },
  { name: 'Distance', value: 'Euclidean' },
  { name: 'Random starts', value: starts },
]

/** A setting that only one of two compared runs has is shown as "None" for the other. */
const cjSettings = (utilities: string, design?: string) => [
  { name: 'Attributes and levels', value: '5 attributes, 13 levels' },
  { name: 'Restrictions', value: '1, leaving 96 of 108 products' },
  { name: 'Estimate utilities for', value: utilities },
  { name: 'Choice rule', value: 'Share of preference' },
  ...(design ? [{ name: 'Simulator design', value: design }] : []),
]

/**
 * All runs of the assignment. The three conjoint runs are the ones the demo
 * story creates: they appear in the run history once the student has pressed
 * "Run 2 scenarios" on the conjoint setup screen.
 */
export const runs: Run[] = [
  {
    id: 'SEG-01',
    module: 'segmentation',
    label: 'First look at the tree',
    summary: 'Hierarchical, 8 variables, standardized',
    when: 'Tue 10 Nov, 16:12',
    settings: segSettings('On', 'Hierarchical clustering', 'Read from the tree', 'Not used'),
  },
  {
    id: 'SEG-02',
    module: 'segmentation',
    label: 'Try 4 segments',
    summary: 'K-means, 4 segments, 8 variables, standardized',
    when: 'Tue 10 Nov, 16:31',
    settings: segSettings('On', 'K-means', '4', '25'),
  },
  {
    id: 'SEG-03',
    module: 'segmentation',
    label: 'Final, 3 segments',
    summary: 'K-means, 3 segments, 8 variables, standardized',
    when: 'Tue 10 Nov, 16:40',
    final: true,
    to: '/segmentation/results',
    settings: segSettings('On', 'K-means', '3', '25'),
  },
  {
    id: 'SEG-04',
    module: 'segmentation',
    label: 'Without standardizing',
    summary: 'K-means, 3 segments, 8 variables, not standardized',
    when: 'Wed 11 Nov, 09:05',
    settings: segSettings('Off', 'K-means', '3', '25'),
  },
  {
    id: 'POS-01',
    module: 'positioning',
    label: 'Map with segment arrows',
    summary: '4 brands, 6 attributes, arrows from SEG-03',
    when: 'Thu 12 Nov, 14:20',
    final: true,
    to: '/positioning',
    settings: [
      { name: 'Brands', value: '4' },
      { name: 'Attributes', value: '6' },
      { name: 'Dimensions', value: '2' },
      { name: 'Segment preferences', value: 'Arrows from SEG-03' },
    ],
  },
  {
    id: 'CJ-01',
    module: 'conjoint',
    label: 'All respondents',
    summary: '5 attributes, 1 restriction, all respondents',
    when: 'Sun 15 Nov, 18:31',
    settings: cjSettings('All respondents'),
  },
  {
    id: 'CJ-02',
    module: 'conjoint',
    label: 'By segment',
    summary: '5 attributes, 1 restriction, each segment from SEG-03',
    when: 'Sun 15 Nov, 18:31',
    final: true,
    to: '/conjoint/results',
    settings: cjSettings('Each segment from SEG-03'),
  },
  {
    id: 'CJ-03',
    module: 'conjoint',
    label: 'Vanilla protein design',
    summary: 'Simulator on CJ-02, 1 design against 3 competitors',
    when: 'Sun 15 Nov, 18:47',
    to: '/conjoint/results',
    settings: cjSettings('Each segment from SEG-03', 'Vanilla, No added sugar, High, 1 L, CHF 2.50'),
  },
]

export const moduleNames: Record<ModuleId, string> = {
  segmentation: 'Segmentation',
  positioning: 'Positioning',
  conjoint: 'Conjoint analysis',
}

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

/**
 * Pre-written comparisons, keyed by "A|B" in run-history order. The settings
 * table is always worked out from the runs themselves. A pair without an entry
 * here gets the settings table and a sentence built from it.
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
      'One setting differs: who the utilities are estimated for. The overall result is the same in both runs.',
    result: 'importance',
    whatChanged:
      'The numbers for all respondents are identical. B adds one column per segment, and the segments disagree with the overall picture: price explains 63% of the choice for Price-sensitive, but only 20% for Health-focused, where sugar leads with 47%.',
  },
  'CJ-02|CJ-03': {
    sentence: 'The estimates are the same. B adds one product design in the simulator.',
    result: 'design',
    whatChanged:
      'Nothing in the estimates. B stores one design, Vanilla protein design, with its predicted shares against the three competitors.',
  },
  'SEG-02|SEG-03': {
    sentence: 'One setting differs: the number of segments. Two of the three segments stay the same.',
    result: 'segments',
    whatChanged:
      'Health-focused and Price-sensitive hold the same respondents in both runs. The 102 Taste-driven respondents in B are split in A into a group of 63 and a group of 39.',
  },
}

/** Result block for SEG-02 against SEG-03 (segment sizes and the split groups). */
export const segmentComparison = {
  sizesNote: 'Unchanged segments are faded',
  a: [
    { segment: 'health' as SegmentId, share: 38, n: 114, same: true },
    { segment: 'taste' as SegmentId, share: 21, n: 63, same: false },
    { segment: 'extra' as const, name: 'Segment 4', share: 13, n: 39, same: false },
    { segment: 'price' as SegmentId, share: 28, n: 84, same: true },
  ],
  b: [
    { segment: 'health' as SegmentId, share: 38, n: 114, same: true },
    { segment: 'taste' as SegmentId, share: 34, n: 102, same: false },
    { segment: 'price' as SegmentId, share: 28, n: 84, same: true },
  ],
  split: {
    title: 'How the split groups differ',
    note: 'Only variables that differ by more than 0.2',
    columns: ['A, Taste-driven (63)', 'A, Segment 4 (39)', 'B, Taste-driven (102)'],
    rows: [
      { variable: 'Creaminess', values: ['+0.5', '+1.6', '+0.9'], bold: 1 },
      { variable: 'Taste', values: ['+1.2', '+0.7', '+1.0'], bold: 0 },
      { variable: 'Uses oat drink mostly in coffee', values: ['58%', '92%', '71%'], bold: 1 },
    ],
    rest: '6 other basis variables are within 0.2 of each other.',
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
  /** The student's first draft, 56 words. */
  draft:
    'I recommend that Alpine Oat launches the vanilla, high-protein drink without added sugar in the 1 L pack. In the simulator this design reaches 43% share against Valloat, Lumo and the supermarket own brand. Because price is the most important attribute (42%), it should be sold at CHF 1.90 to win as many buyers as possible.',
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

/**
 * Scripted AI tutor. No model is called: every message below is fixed text.
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
        text: 'You set the price at CHF 1.90 because price is the most important attribute overall. Look at your pinned importance chart. Is price the most important attribute in every segment?',
      },
      {
        from: 'student',
        text: 'No. For Health-focused it is sugar (47%), and for Taste-driven it is flavor.',
      },
      {
        from: 'coach',
        text: 'Good. So who is your product for? And if that segment cares less about price, what does it mean for CHF 1.90?',
      },
    ] as ChatMessage[],
    /** What happens next. Each click on the reply field inserts the next student reply. */
    turns: [
      {
        student:
          'It is for Health-focused. They care most about sugar and protein, so I do not need the lowest price to win them.',
        coach:
          'That is a clear target. Which of your results shows what happens to your share in that segment when the price goes up? Name the run.',
      },
      {
        student: 'The simulator in CJ-03. At CHF 2.50 the design still reaches 76% in Health-focused.',
        coach:
          'Good, that is evidence. One more question before you rewrite your text: is 76% a forecast of sales? What does the model leave out?',
      },
    ],
    closing: 'This is the end of the scripted conversation in the demo.',
    hints: [
      'Compare the Price row across the four columns of your pinned importance table. One column is very different from the others.',
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
        text: 'Price explains 42% of the choice overall, but that average hides the segments. It is 63% for Price-sensitive, 33% for Taste-driven and only 20% for Health-focused, where sugar leads with 47%.',
      },
      {
        title: 'What it means for your design',
        text: 'A vanilla, high-protein drink without added sugar is what Health-focused buyers want. In the simulator (CJ-03) it reaches 76% in that segment at CHF 2.50, and 43% overall. At CHF 1.90 the overall share rises to 55%, but most of the gain comes from Price-sensitive buyers (15% to 38%). In Health-focused it only moves from 76% to 81%.',
      },
      {
        title: 'What the model does not tell you',
        text: 'These are shares of preference among four products. Brand strength, shelf space and advertising are not in the model, so 43% is not a sales forecast.',
      },
      {
        title: 'Compared with what you wrote',
        text: 'You chose CHF 1.90 because price matters most overall. That holds for the average respondent, but not for the segment your product fits best. Your text also does not name a target segment yet.',
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
      meta: 'Oat drinks, Switzerland, 300 respondents',
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
  modules: [
    {
      id: 'segmentation' as ModuleId,
      name: 'Segmentation',
      text: 'Hierarchical and k-means clustering, segment profiles',
    },
    { id: 'positioning' as ModuleId, name: 'Positioning', text: 'Perceptual map with segment preferences' },
    {
      id: 'conjoint' as ModuleId,
      name: 'Conjoint analysis',
      text: 'Part-worths, importance, market simulator, scenario batch',
    },
  ],
  modulesFootnote:
    '9 more modules are in development, from sentiment analysis to panel regression. They appear here as they are released.',
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
      example: 'Example: "Sugar has 24% importance, so buyers want less sugar."',
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
      'I recommend launching a vanilla, high-protein oat drink without added sugar in a 1 L pack at CHF 2.50, aimed at the Health-focused segment (38% of respondents, SEG-03).',
      'For this segment sugar is the most important attribute (47%) and price counts for only 20% (CJ-02), so a low price is not needed. In the simulator the design reaches 76% share within Health-focused and 43% overall (CJ-03).',
      'Price is the most important attribute overall (42%), but this comes mainly from the Price-sensitive segment, where my design reaches only 15%. I would not try to win that segment with this product.',
    ],
    cites: ['SEG-03', 'CJ-02', 'CJ-03'] as RunId[],
    conversationNote: '6 messages, 2 of 3 hints used',
    conversation: [
      { from: 'coach', text: 'Is price the most important attribute in every segment?' },
      { from: 'student', text: 'No. For Health-focused it is sugar (47%), and for Taste-driven it is flavor.' },
      { from: 'coach', text: 'So who is your product for? And what does that mean for CHF 1.90?' },
    ] as ChatMessage[],
    draftChange:
      'Between her first draft and the final text she changed the price from CHF 1.90 to CHF 2.50 and added a target segment.',
    feedback: {
      scores: [
        { title: 'Decision and target segment', note: 'Names product, price and segment.', score: 5, of: 5 },
        {
          title: 'Use of evidence',
          note: 'Three runs cited. The positioning map is not used.',
          score: 4,
          of: 5,
        },
        { title: 'Limits of the model', note: 'Treats 76% as an outcome, no caveat.', score: 2, of: 5 },
      ],
      comment:
        'Clear recommendation with a named segment, and you support it with three runs. You noticed that the overall weight of price comes from the Price-sensitive segment, which many missed.\n\nTwo things to improve. You do not use the positioning map, where Alpine Oat is weakest on tasty. And 76% is a share of preference, not a sales forecast: say what the model leaves out.',
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
      text: '8 basis variables selected. The 6 descriptors are kept aside to describe the segments later.',
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
          text: 'Euclidean. Straight-line distance between two respondents across the 8 variables.',
        },
        {
          term: 'Random starts',
          text: '25. K-means is repeated from 25 starting points and the best result is kept, so that the answer does not depend on luck.',
        },
      ],
    },
  },
  number: {
    title: 'Number of segments',
    text: 'How many groups K-means should form.',
    options: [2, 3, 4, 5, 6, 7, 8],
    suggested: 3,
    whyBefore: 'Why 3: in the tree from',
    whyAfter:
      'the distance jumps from 4.1 to 7.9 when going from 3 groups to 2. A big jump means two quite different groups would be forced together.',
  },
  thisRun: {
    id: 'SEG-03' as RunId,
    label: 'Final, 3 segments',
    lines: [
      { name: 'Variables', value: '8 basis variables' },
      { name: 'Standardize', value: 'On' },
      { name: 'Method', value: 'K-means' },
      { name: 'Number of segments', value: '3 (default, not yet confirmed)' },
    ],
    compareWith: 'SEG-02' as RunId,
    compareText: ': only the number of segments changes, from 4 to 3.',
    note: 'You can run now. Unconfirmed steps use their defaults.',
  },
}

/** A node of the dendrogram: either a leaf (a small group of n respondents) or a merge at a distance. */
export type TreeNode = { n: number } | { at: number; left: TreeNode; right: TreeNode }

export const segmentationResults = {
  runId: 'SEG-03' as RunId,
  summary: 'K-means, 3 segments, 8 basis variables, standardized. Run on Tue 10 Nov at 16:40.',
  headline: 'Three segments. The largest, Health-focused, holds 38% of respondents.',
  profileNote:
    'Bars show how far the segment is from the average respondent, in standard deviations. Only the four largest differences are shown. All 8 variables are in the details below.',
  renameTip: 'Segment names are yours. Click to rename.',
  tree: {
    title: 'Why three segments? The tree from',
    fromRun: 'SEG-01' as RunId,
    /** The tree is cut at this distance, which gives three segments. */
    cutAt: 5.6,
    cutLabel: 'Cut here: 3 segments',
    axisLabel: 'Distance when groups merge',
    /** One subtree per segment, in segment order, and the two merges above the cut. */
    health: {
      at: 2.6,
      left: { at: 1.1, left: { n: 31 }, right: { n: 28 } },
      right: { at: 1.4, left: { n: 30 }, right: { n: 25 } },
    } as TreeNode,
    taste: {
      at: 4.1,
      left: { at: 1.2, left: { n: 34 }, right: { n: 29 } },
      right: { at: 1.0, left: { n: 22 }, right: { n: 17 } },
    } as TreeNode,
    price: { at: 2.2, left: { at: 0.9, left: { n: 30 }, right: { n: 26 } }, right: { n: 28 } } as TreeNode,
    /** Health-focused and Taste-driven merge at 7.9, the result merges with Price-sensitive at 10.6. */
    mergeHealthTaste: 7.9,
    mergeAll: 10.6,
    howToRead: [
      'Each line at the bottom is a small group of similar respondents (the number is its size). Groups join as you move up. The higher the join, the more different the two groups are.',
      'The cut line crosses three branches, so three segments.',
    ],
  },
  details: [
    {
      title: 'Segment means on all 8 basis variables',
      note: 'Table, original and standardized values',
    },
    { title: 'Descriptor variables by segment', note: '6 tables with significance tests' },
    {
      title: 'Model quality and settings',
      note: 'Variance explained 58%, 25 random starts, converged in 9 steps',
    },
  ],
  detailsEmpty: 'This table is not filled in for the demo.',
}

// ---------------------------------------------------------------------------
// 11. Positioning screen (Priority 2, view-only)
//     Coordinates are positions on the two map dimensions.
// ---------------------------------------------------------------------------

export const positioning = {
  runId: 'POS-01' as RunId,
  summary: '4 brands, 6 attributes, arrows from SEG-03. Run on Thu 12 Nov at 14:20.',
  headline: 'Two dimensions capture 88% of how respondents see the four brands.',
  axes: { x: 'Dimension 1 (61% of variance)', y: 'Dimension 2 (27%)' },
  brands: [
    {
      name: 'Alpine Oat',
      x: 1.0,
      y: -0.84,
      own: true,
      label: 'right',
      tip: 'Strongest on healthy (5.9 of 7) and natural (5.7). Weakest on tasty (4.1).',
    },
    {
      name: 'Valloat',
      x: 1.0,
      y: 1.12,
      label: 'right',
      tip: 'Strongest on creamy (6.0) and tasty (5.8). Weakest on good value (3.4).',
    },
    {
      name: 'Lumo',
      x: 0.04,
      y: 0.44,
      label: 'left',
      tip: 'Close to the average on every attribute. Highest on tasty (4.9).',
    },
    {
      name: 'Supermarket own brand',
      x: -1.2,
      y: -1.28,
      label: 'right',
      tip: 'Strongest on good value (6.2). Weakest on natural (3.3) and sustainable (3.2).',
    },
  ] as { name: string; x: number; y: number; own?: boolean; label: 'left' | 'right'; tip: string }[],
  attributes: [
    { name: 'natural', x: 1.9, y: -0.08, label: 'right' },
    { name: 'healthy', x: 1.72, y: -0.68, label: 'right' },
    { name: 'sustainable', x: 1.68, y: 0.6, label: 'right' },
    { name: 'creamy', x: 1.28, y: 1.4, label: 'right' },
    { name: 'tasty', x: 0.16, y: 1.84, label: 'topLeft' },
    { name: 'good value', x: -1.8, y: -0.12, label: 'top' },
  ] as { name: string; x: number; y: number; label: 'right' | 'top' | 'topLeft' }[],
  /** Preference arrows: the further a brand lies along the arrow, the more the segment prefers it. */
  preferences: [
    { segment: 'health' as SegmentId, x: 1.1, y: -1.9, label: 'left' },
    { segment: 'taste' as SegmentId, x: 0.8, y: 2.08, label: 'right' },
    { segment: 'price' as SegmentId, x: -2.2, y: -0.6, label: 'below' },
  ] as { segment: SegmentId; x: number; y: number; label: 'left' | 'right' | 'below' }[],
  arrowTip: 'The further a brand lies along this arrow, the more this segment prefers it.',
  howToRead: [
    'Brands that sit close together are seen as similar.',
    'A brand far along an attribute line scores high on that attribute.',
    'A segment prefers brands that lie far along its arrow.',
  ],
  layersNote: 'From run SEG-03',
  arrowsNote: 'Arrows fit when more is always better. Ideal points fit when a segment has a sweet spot.',
  variance: [
    { name: 'Dimension 1', value: 61, color: '#56607A' },
    { name: 'Dimension 2', value: 27, color: '#8C95AB' },
    { name: 'Not shown', value: 12, color: '#B4BAC8' },
  ],
  varianceNote: 'How much of the brand ratings the flat map keeps.',
}
