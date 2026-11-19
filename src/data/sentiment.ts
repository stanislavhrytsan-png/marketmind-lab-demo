/**
 * Sentiment analysis: what the screen of the module shows.
 *
 *   SE-01  the reviews scored with the built-in word list
 *   SE-02  scored again with seven own words, which the star ratings revealed
 *   SE-03  the same as SE-02 with negations ignored
 *
 * Every count, score and test is a result of the engine
 * (engine_results.json). Nothing is calculated in the browser: the screen
 * only shows the three runs.
 */
import { capital, fixed, inWords, listed, pct, signed, thousands } from '../lib/format'
import type { FurtherRunId, Run } from './alpineOat'
import { engineModules, optionLabel } from './moduleKit'
import type { CoachScript, FurtherModule, SetupInfo } from './moduleKit'

// ---------------------------------------------------------------------------
// The engine's results
// ---------------------------------------------------------------------------

export type Label = 'negative' | 'neutral' | 'positive'
export const LABELS: Label[] = ['negative', 'neutral', 'positive']
export type SentimentRunId = 'SE-01' | 'SE-02' | 'SE-03'

export interface GroupLevel {
  group: string
  n_reviews: number
  mean_score: number
  standard_error: number
  lower_95: number
  upper_95: number
  share_positive: number
  share_neutral: number
  share_negative: number
  net_sentiment: number
  difference_from_all: number
}

export interface Driver {
  word: string
  n_reviews: number
  n_positive_reviews: number
  n_negative_reviews: number
  share_of_positive_reviews: number
  share_of_negative_reviews: number
  share_positive_when_used: number
  z: number
  p_value: number
  clear: boolean
  in_word_list: boolean
  own_word: boolean
}

export interface Found {
  score: number
  label: Label
  n_positive: number
  n_negative: number
  positive_words: string[]
  negative_words: string[]
}

interface GroupTable {
  levels: GroupLevel[]
  from_most_positive: string[]
  test: { f: number; df1: number; df2: number; p_value: number; groups_differ: boolean }
}

interface SentimentRun {
  settings: Record<string, string | number>
  own_words: { positive: string[]; negative: string[] }
  scoring: {
    n_reviews: number
    mean_score: number
    shares: Record<Label, number>
    net_sentiment: number
    n_without_sentiment_words: number
    n_with_a_negated_word: number
    most_used_sentiment_words: Record<'positive' | 'negative', { word: string; count: number }[]>
    how_to_read: string[]
    warnings: string[]
  }
  by_group: Record<'brand' | 'segment', GroupTable>
  cross: { brand: string; segment: string; n_reviews: number; mean_score: number; share_positive: number; share_negative: number }[]
  by_group_how_to_read: string[]
  stars_by_label: ({ stars: number } & Record<Label, number>)[]
  neutral_with_clear_stars: number
  drivers: {
    by: 'stars' | 'word_list'
    positive_and_negative_by: string
    n_positive_reviews: number
    n_negative_reviews: number
    n_reviews_left_out: number
    share_positive: number
    n_words_examined: number
    n_clear: number
    n_clear_by_chance_expected: number
    positive_drivers: Driver[]
    negative_drivers: Driver[]
    how_to_read: string[]
    warnings: string[]
  }
  unknown_clear_drivers?: (Driver & { side: 'positive' | 'negative'; added: boolean })[]
  labels_changed?: { n_changed: number; from_to: Record<string, number> }
}

export interface Review {
  id: string
  brand: string
  segment: string
  stars: number
  text: string
}

export interface Example extends Review {
  kind: 'unknown_word' | 'distant_negation' | 'nothing_found' | 'negation_read'
  by_run: Record<SentimentRunId, Found>
}

interface WordCount {
  word: string
  count: number
  n_reviews: number
  share_of_reviews: number
}

const results = engineModules.sentiment as unknown as {
  data: {
    file: string
    n_reviews: number
    text_column: string
    group_columns: string[]
    rating_column: string
    rating_scale: { minimum: number; maximum: number }
    language: string
    brands: string[]
    segments: string[]
    reviews_by_stars: Record<string, number>
  }
  word_list: { n_positive: number; n_negative: number; n_negations: number; negation_reach: number; language: string; note: string }
  runs: Record<SentimentRunId, SentimentRun>
  words: {
    settings: Record<string, string | number>
    n_words: number
    n_different_words: number
    most_frequent: WordCount[]
    groups: {
      group: string
      n_reviews: number
      most_frequent: WordCount[]
      typical_words: (WordCount & { share_of_other_reviews: number; times_as_often: number | null; z: number; clear: boolean })[]
    }[]
    how_to_read: string[]
  }
  examples: Example[]
  sample: (Review & Found)[]
}

const ENGINE = 'sentiment'
const { data, word_list: wordList } = results
const first = results.runs['SE-01']
const final = results.runs['SE-02']
const noNegation = results.runs['SE-03']

export const sentimentModule: FurtherModule = {
  id: 'sentiment',
  name: 'Sentiment analysis',
  short: 'Sentiment',
  to: '/sentiment',
  text: 'What customers write in their reviews: the words, the mood per brand and segment, and what goes with a good or a bad review',
}

export const sentimentQuestion = 'What do customers write, and how do they feel about it?'

// ---------------------------------------------------------------------------
// The screen (run SE-02, with SE-01 for the gaps of the word list and SE-03 for the negations)
// ---------------------------------------------------------------------------

const brands = final.by_group.brand.levels
const segments = final.by_group.segment.levels
const brandOf = (name: string) => brands.find((level) => level.group === name) as GroupLevel
const best = brandOf(final.by_group.brand.from_most_positive[0])
const worst = brandOf(final.by_group.brand.from_most_positive[brands.length - 1])
/** The brand whose mean score is closest to zero: two camps, not indifference. */
const balanced = [...brands].sort((a, b) => Math.abs(a.mean_score) - Math.abs(b.mean_score))[0]
/** The two clearest topics on each side: what satisfied and what dissatisfied customers write about. */
const topics = { positive: final.drivers.positive_drivers.slice(0, 2).map((row) => row.word), negative: final.drivers.negative_drivers.slice(0, 2).map((row) => row.word) }
const ownWords = [...final.own_words.positive, ...final.own_words.negative]
const unknown = first.unknown_clear_drivers ?? []
const neutralFirst = Math.round(first.scoring.shares.neutral * first.scoring.n_reviews)
const all = (run: SentimentRun): GroupLevel => ({
  group: 'All reviews',
  n_reviews: run.scoring.n_reviews,
  mean_score: run.scoring.mean_score,
  standard_error: 0,
  lower_95: run.scoring.mean_score,
  upper_95: run.scoring.mean_score,
  share_positive: run.scoring.shares.positive,
  share_neutral: run.scoring.shares.neutral,
  share_negative: run.scoring.shares.negative,
  net_sentiment: run.scoring.net_sentiment,
  difference_from_all: 0,
})
const exampleOf = (kind: Example['kind']) => results.examples.find((example) => example.kind === kind)
const theBrand = (name: string) => (/own brand/i.test(name) ? `the ${name.toLowerCase()}` : name)

export const sentimentScreen = {
  runId: 'SE-02' as FurtherRunId,
  firstRunId: 'SE-01' as FurtherRunId,
  otherRunId: 'SE-03' as FurtherRunId,
  summary: `${thousands(data.n_reviews)} reviews of ${inWords(data.brands.length)} brands, scored with the built-in word list and ${inWords(ownWords.length)} own words. A "not" in front of a word turns its meaning around. Run on Tue 3 Nov at 16:40.`,
  headline: `Reviews of ${theBrand(best.group)} are the most positive of the ${inWords(brands.length)} brands, and those of ${theBrand(worst.group)} the most negative. Satisfied customers write about ${listed(topics.positive)}, dissatisfied ones about ${listed(topics.negative)}.`,
  stats: [
    {
      value: pct(final.scoring.shares.positive),
      label: 'of the reviews are positive',
      note: `${pct(final.scoring.shares.negative)} are negative, ${pct(final.scoring.shares.neutral)} neutral`,
    },
    { value: signed(best.mean_score), label: `mean score of ${theBrand(best.group)}`, note: `The highest. 95% range: ${signed(best.lower_95)} to ${signed(best.upper_95)}` },
    { value: signed(worst.mean_score), label: `mean score of ${theBrand(worst.group)}`, note: `The lowest. 95% range: ${signed(worst.lower_95)} to ${signed(worst.upper_95)}` },
    {
      value: thousands(final.scoring.n_without_sentiment_words),
      label: 'reviews hold no word of the list',
      note: 'They count as neutral, whatever the customer meant',
    },
  ],

  /** Brands and segments side by side (run SE-02). */
  groupsCard: {
    title: 'The mood per brand and per customer segment',
    note: 'The score of a review runs from −1 (only negative words) to +1 (only positive words). The mean score of a group is the average of its reviews.',
    all: all(final),
    blocks: [
      { name: 'Brand', levels: brands, test: final.by_group.brand.test },
      { name: 'Customer segment', levels: segments, test: final.by_group.segment.test },
    ],
    howToRead: final.by_group_how_to_read,
  },

  /** What goes with a positive and with a negative review (run SE-02). */
  driversCard: {
    title: 'What satisfied and dissatisfied customers write about',
    note: `Words that appear clearly more often in the positive or in the negative reviews. The words of the word list itself are left out: they made the labels.`,
    positive: final.drivers.positive_drivers.slice(0, 6),
    negative: final.drivers.negative_drivers.slice(0, 6),
    chance: `${final.drivers.n_words_examined} words were examined and ${final.drivers.n_clear} look clear. About ${Math.round(final.drivers.n_clear_by_chance_expected)} would look clear by chance alone, so the weakest of them deserve doubt.`,
    sharePositive: final.drivers.share_positive,
    howToRead: [final.drivers.how_to_read[0], final.drivers.how_to_read[2]],
  },

  /** The words themselves. */
  wordsCard: {
    title: 'The words customers use',
    note: `${thousands(results.words.n_words)} words in all, ${results.words.n_different_words} different ones. Very common words such as "the" or "and" are left out.`,
    words: results.words.most_frequent.slice(0, 12),
    groups: results.words.groups.map((group) => ({ group: group.group, typical: group.typical_words.filter((word) => word.clear).slice(0, 2) })),
    typicalTitle: 'Typical for each brand',
    typicalNote: 'Words a brand\'s reviews use clearly more often than the reviews of the other brands',
  },

  /** The teaching trap: a word count reads only what its list knows. */
  trap: {
    title: `${first.neutral_with_clear_stars} reviews were called neutral although the customer gave 1, 2, 4 or 5 stars`,
    text: `The built-in word list is small, English and made for teaching. With it, ${neutralFirst} of the ${thousands(data.n_reviews)} reviews came out as neutral (run SE-01), and ${first.scoring.n_without_sentiment_words} held no word of the list at all. For ${first.neutral_with_clear_stars} of the neutral reviews the stars tell another story. The stars also show what the list is missing: ${inWords(unknown.length)} words that it does not know go clearly with high or low ratings. ${capital(inWords(unknown.filter((row) => row.added).length))} of them express a feeling and were added for run SE-02 (${ownWords.join(', ')}). The others are topics, such as "${unknown.filter((row) => !row.added)[0]?.word}" or "${unknown.filter((row) => !row.added && row.side === 'negative')[0]?.word}". After that, ${final.neutral_with_clear_stars} such reviews remain.`,
    before: { run: 'SE-01' as SentimentRunId, shares: first.scoring.shares, without: first.scoring.n_without_sentiment_words, unclear: first.neutral_with_clear_stars },
    after: { run: 'SE-02' as SentimentRunId, shares: final.scoring.shares, without: final.scoring.n_without_sentiment_words, unclear: final.neutral_with_clear_stars },
    unknown,
    examplesTitle: 'Three reviews, and how they were read',
    examples: [
      { example: exampleOf('unknown_word'), title: 'A word the list does not know', text: 'Nothing was found at first. With the own words, the review is read as the customer meant it.' },
      { example: exampleOf('distant_negation'), title: 'A "not" too far from its word', text: `The engine looks for a negation up to ${inWords(wordList.negation_reach)} words in front of a sentiment word. This one stands further away, so the review is read the wrong way round.` },
      { example: exampleOf('nothing_found'), title: 'Still no word of the list', text: 'The word that carries the feeling is in no list. The review stays neutral in every run.' },
    ].filter((item): item is { example: Example; title: string; text: string } => item.example !== undefined),
    engineSays: [wordList.note, final.scoring.how_to_read[1]],
    irony: 'A word count also does not understand irony: "great, another leaking carton" counts as positive.',
  },

  /** The what-if view: the same reviews with negations ignored (run SE-03). */
  whatIf: {
    title: 'What if a "not" is ignored?',
    text: `${final.scoring.n_with_a_negated_word} reviews hold a sentiment word with a negation in front of it, such as "not good" or "never mediocre". The engine can turn the meaning of such a word around, or ignore the negation. Both are real runs.`,
    options: [
      { value: 'SE-02' as SentimentRunId, label: optionLabel(ENGINE, 'negation', final.settings.negation) },
      { value: 'SE-03' as SentimentRunId, label: optionLabel(ENGINE, 'negation', noNegation.settings.negation) },
    ],
    runs: {
      'SE-02': { all: all(final), brands, unclear: final.neutral_with_clear_stars },
      'SE-03': { all: all(noNegation), brands: noNegation.by_group.brand.levels, unclear: noNegation.neutral_with_clear_stars },
    } as Record<string, { all: GroupLevel; brands: GroupLevel[]; unclear: number }>,
    changed: noNegation.labels_changed ?? { n_changed: 0, from_to: {} },
    example: exampleOf('negation_read'),
    negated: final.scoring.n_with_a_negated_word,
  },

  details: {
    sample: {
      title: 'Reviews with the words that were found',
      note: `The first ${results.sample.length} reviews of the file, as run SE-02 read them`,
      rows: results.sample,
    },
    cross: {
      title: 'Every brand within every segment',
      note: 'Mean score of each combination',
      brands: data.brands,
      segments: data.segments,
      cells: final.cross,
    },
    stars: {
      title: 'The drivers from the star ratings',
      note: `Run SE-01: reviews with ${first.settings.positive_from} stars or more against reviews with ${first.settings.negative_up_to} or fewer`,
      text: `With star ratings, every word can be examined, also the words of the word list. That is how the missing words were found. ${first.drivers.n_words_examined} words were examined and ${first.drivers.n_clear} look clear. About ${Math.round(first.drivers.n_clear_by_chance_expected)} would look clear by chance alone.`,
      positive: first.drivers.positive_drivers.slice(0, 10),
      negative: first.drivers.negative_drivers.slice(0, 10),
    },
    labels: {
      title: 'The labels against the stars',
      note: 'How many reviews of each star rating were labelled negative, neutral and positive',
      before: first.stars_by_label,
      after: final.stars_by_label,
    },
  },

  coach: {
    note: `${balanced.group} has a mean score of ${fixed(balanced.mean_score)}, almost exactly zero. So its customers are indifferent: they neither like nor dislike the product.`,
    opening: [
      {
        from: 'coach',
        text: `Before you call them indifferent: look at the bar of ${balanced.group}. What share of its reviews is positive, and what share is negative?`,
      },
    ],
    turns: [
      {
        student: `${pct(balanced.share_positive)} are positive and ${pct(balanced.share_negative)} are negative. Only ${pct(balanced.share_neutral)} are neutral.`,
        coach: `Right. So does a mean near zero stand for indifferent customers, or for two camps that cancel each other out? And about the neutral reviews: ${thousands(final.scoring.n_without_sentiment_words)} of all reviews hold no word of the list. What does the engine say such a review means?`,
      },
    ],
  } satisfies CoachScript,
}

// ---------------------------------------------------------------------------
// Runs and setup screens
// ---------------------------------------------------------------------------

const runSettings = (run: SentimentRun) => [
  { name: 'Reviews', value: `${thousands(data.n_reviews)}, with brand, segment and stars` },
  { name: 'Own words', value: run.own_words.positive.length + run.own_words.negative.length === 0 ? 'None' : `${run.own_words.positive.length} positive, ${run.own_words.negative.length} negative` },
  { name: 'Negations', value: optionLabel(ENGINE, 'negation', run.settings.negation) },
  { name: 'Width of "neutral"', value: String(run.settings.neutral_band) },
  { name: 'Drivers by', value: run.drivers.by === 'stars' ? 'The star ratings' : 'The labels of the word list' },
  { name: 'A driver needs', value: `at least ${run.settings.min_reviews} reviews` },
]

export const sentimentRuns: Run[] = [
  {
    id: 'SE-01',
    module: 'sentiment',
    label: 'Built-in word list',
    summary: `${thousands(data.n_reviews)} reviews with the built-in list, drivers from the star ratings`,
    when: 'Tue 3 Nov, 16:12',
    to: '/sentiment',
    setupTo: '/sentiment/setup/SE-01',
    settings: runSettings(first),
  },
  {
    id: 'SE-02',
    module: 'sentiment',
    label: 'With seven own words',
    summary: `The same reviews, with ${ownWords.length} words added that the star ratings revealed`,
    when: 'Tue 3 Nov, 16:40',
    final: true,
    to: '/sentiment',
    setupTo: '/sentiment/setup/SE-02',
    settings: runSettings(final),
  },
  {
    id: 'SE-03',
    module: 'sentiment',
    label: 'Negations ignored',
    summary: `As SE-02, but a "not" in front of a word is ignored: ${noNegation.labels_changed?.n_changed ?? 0} reviews change their label`,
    when: 'Tue 3 Nov, 16:47',
    to: '/sentiment',
    setupTo: '/sentiment/setup/SE-03',
    settings: runSettings(noNegation),
  },
]

const steps = [
  'Upload the reviews, or use the example data.',
  'Count the words: which are used most, overall and for each brand?',
  'Score the reviews: positive, neutral or negative.',
  'Read a sample of reviews with the words that were found. Add words the list does not know, and score again.',
  'Compare the sentiment of brands and of customer segments.',
  'Find the drivers: which topics go with positive and which with negative reviews?',
  'If the reviews have star ratings, use them for the drivers. This also finds sentiment words that the list is missing.',
]

export const sentimentSetups: SetupInfo[] = (['SE-01', 'SE-02', 'SE-03'] as const).map((id): SetupInfo => {
  const run = results.runs[id]
  const own = [...run.own_words.positive, ...run.own_words.negative]
  return {
    runId: id,
    module: 'sentiment',
    engineModule: ENGINE,
    title: 'Set up a sentiment analysis',
    question: sentimentQuestion,
    steps,
    inputs: [
      {
        input: 'Reviews',
        form: 'One row per review with the text. Optional columns: an ID, groups such as brand or segment, and a rating.',
        here: `${data.file}: ${thousands(data.n_reviews)} reviews in ${data.language}, with brand (${data.brands.length} brands), segment (${data.segments.length} segments) and stars from ${data.rating_scale.minimum} to ${data.rating_scale.maximum}. ${run.drivers.by === 'stars' ? 'The stars are used to find the drivers.' : 'The drivers go by the labels of the word list, not by the stars.'}`,
      },
      {
        input: 'Own words (optional)',
        form: 'Two lists: words that count as positive, and words that count as negative.',
        here: own.length === 0 ? `None. The built-in list has ${wordList.n_positive} positive and ${wordList.n_negative} negative words.` : `Positive: ${run.own_words.positive.join(', ')}. Negative: ${run.own_words.negative.join(', ')}.`,
      },
    ],
    settings: Object.entries(run.settings).map(([key, value]) => ({ key, value })),
    calls: 'word_frequencies, score_sentiment, sentiment_by_group, sentiment_drivers',
    resultsTo: '/sentiment',
  }
})

/** What the presenting script in README.md says out loud about this module. */
export const sentimentReadme = [
  `${first.neutral_with_clear_stars} reviews`,
  `${inWords(ownWords.length)} words`,
  `${pct(balanced.share_positive)} of its reviews are positive and ${pct(balanced.share_negative)} are negative`,
  `${noNegation.labels_changed?.n_changed ?? 0} reviews change`,
]
