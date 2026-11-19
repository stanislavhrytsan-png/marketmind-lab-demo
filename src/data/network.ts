/**
 * Network analysis: what the screen of the module shows.
 *
 *   NW-01  overview, the four measures of importance, and the communities
 *   NW-02  five seeds by degree, spread over the communities
 *   NW-03  five seeds by degree, the best ranked members
 *
 * Every measure, community, ranking and reach is a result of the engine
 * (engine_results.json). Nothing is calculated in the browser. The what-if
 * view shows runs the engine made before: every measure with one to eight
 * seeds, chosen both ways. Only the places of the members in the drawing are
 * no result: they come from a layout in the export and make the ties visible.
 */
import { capital, inWords, listed, pct, thousands } from '../lib/format'
import type { FurtherRunId, Run } from './alpineOat'
import { engineModules, optionLabel } from './moduleKit'
import type { CoachScript, FurtherModule, SetupInfo } from './moduleKit'

// ---------------------------------------------------------------------------
// The engine's results
// ---------------------------------------------------------------------------

export type Measure = 'degree' | 'betweenness' | 'closeness' | 'eigenvector'
export type RankingMeasure = Measure | 'combined'
export type Seeding = 'spread' | 'top'
export const SEEDINGS: Seeding[] = ['spread', 'top']

export interface Member {
  member: string
  degree: number
  betweenness: number
  closeness: number
  eigenvector: number
  /** The place of the member on each measure: 1 is the highest. */
  places: Record<Measure, number>
  community: number
  /** Where the member sits in the drawing, from 0 to 1. Not a result. */
  x: number
  y: number
}

export interface Reach {
  within_one_step: number
  within_two_steps: number
  n_communities_with_a_seed: number
}

export interface Seed {
  member: string
  community: number
}

interface Community {
  community: number
  n_members: number
  share_of_members: number
  n_ties_inside: number
  n_ties_to_other_communities: number
  share_of_ties_inside: number | null
  density_inside: number | null
  best_connected_members: { member: string; ties_inside: number }[]
}

interface Ranking {
  settings: { measure: RankingMeasure; seeding: Seeding; n_seeds: number; top_n: number; resolution: number; seed: number }
  seeds: (Seed & { degree: number; place: number })[]
  ranking: (Seed & { degree: number; betweenness: number; closeness: number; eigenvector: number; score: number; place: number; places: Record<Measure, number> })[]
  reach: Record<Seeding, Reach>
  how_to_read: string[]
  warnings: string[]
}

const results = engineModules.network as unknown as {
  data: { ties_file: string; members_file: string; tie_meaning: string; n_members: number; n_ties: number }
  runs: {
    'NW-01': {
      settings: { top_n: number; resolution: number; seed: number }
      overview: {
        n_members: number
        n_ties: number
        density: number
        ties_per_member: { mean: number; median: number; lowest: number; highest: number }
        n_members_without_ties: number
        n_parts: number
        largest_part: { n_members: number; share_of_members: number }
        mean_steps_between_members: number
        longest_shortest_way: number
        degree_distribution: { ties: number; n_members: number }[]
        how_to_read: string[]
        warnings: string[]
      }
      measures: { key: Measure; label: string; meaning: string }[]
      top: Record<Measure, { member: string; value: number; place: number }[]>
      agreement: { first: Measure; second: Measure; rank_correlation: number }[]
      centrality_how_to_read: string[]
      centrality_warnings: string[]
      communities: {
        n_communities: number
        n_communities_with_several_members: number
        modularity: number
        modularity_in_shuffled_networks: { mean: number; highest: number; n_networks: number }
        clearly_above_chance: boolean
        ties_between_communities: { first: number; second: number; n_ties: number }[]
        how_to_read: string[]
        warnings: string[]
        n_ties_inside: number
        share_of_ties_inside: number
        communities: Community[]
      }
    }
    'NW-02': Ranking
    'NW-03': Ranking
  }
  members: Member[]
  ties: [number, number][]
  by_measure: { measure: RankingMeasure; by_n_seeds: { n_seeds: number; seeds: Record<Seeding, Seed[]>; reach: Record<Seeding, Reach> }[] }[]
}

const ENGINE = 'network'
const { data, members } = results
const first = results.runs['NW-01']
const spread = results.runs['NW-02']
const top = results.runs['NW-03']
const { overview, communities: found } = first

export const networkModule: FurtherModule = {
  id: 'network',
  name: 'Network analysis',
  short: 'Network',
  to: '/network',
  text: 'Who is tied to whom in a customer community, which groups it falls into, and who should hear about a product first',
}

export const networkQuestion = 'Who is connected to whom, and who should hear about a product first?'

// ---------------------------------------------------------------------------
// The screen (run NW-02, with NW-01 for the network itself and NW-03 for the comparison)
// ---------------------------------------------------------------------------

/** The communities that are groups. A member without any tie is a community of its own for the engine. */
const groups = found.communities.filter((community) => community.n_members > 1)
const alone = found.communities.filter((community) => community.n_members === 1).length
const nSeeds = spread.settings.n_seeds
const reachSpread = spread.reach.spread
const reachTop = top.reach.top
const namesOf = (seeds: Seed[]) => listed(seeds.map((seed) => seed.member))
/** The communities the best ranked members sit in, and the ones they miss. */
const coveredByTop = [...new Set(top.seeds.map((seed) => seed.community))].sort((a, b) => a - b)
const missedByTop = groups.map((community) => community.community).filter((community) => !coveredByTop.includes(community))
/** By degree, the number of seeds with the widest gap between the two ways of choosing. */
const byDegree = (results.by_measure.find((item) => item.measure === spread.settings.measure) ?? results.by_measure[0]).by_n_seeds
const widest = [...byDegree].sort((a, b) => b.reach.spread.within_two_steps - b.reach.top.within_two_steps - (a.reach.spread.within_two_steps - a.reach.top.within_two_steps))[0]
/** Members with few ties who still lie on many shortest ways: the bridges between the groups. */
const bridges = members.filter((member) => member.places.betweenness <= 12 && member.places.degree > 15).sort((a, b) => a.places.betweenness - b.places.betweenness)
const hubs = members.filter((member) => member.places.degree <= 8).sort((a, b) => a.places.degree - b.places.degree)
const measureLabel = (measure: RankingMeasure) => optionLabel(ENGINE, 'measure', measure)
const seedsInCommunity = (seeds: Seed[], community: number) => seeds.filter((seed) => seed.community === community).map((seed) => seed.member)
const coach = {
  pairs: coveredByTop.map((community) => `${listed(seedsInCommunity(top.seeds, community))} ${seedsInCommunity(top.seeds, community).length === 1 ? 'is' : 'are'} in community ${community}`),
}

export const networkScreen = {
  runId: 'NW-02' as FurtherRunId,
  firstRunId: 'NW-01' as FurtherRunId,
  otherRunId: 'NW-03' as FurtherRunId,
  summary: `${overview.n_members} members of the customer community and ${overview.n_ties} ties between them. ${capital(inWords(nSeeds))} seeds, ranked by their number of ties and spread over the communities. Run on Thu 5 Nov at 11:35.`,
  headline: `The community falls into ${inWords(groups.length)} groups that keep to themselves: ${pct(found.share_of_ties_inside)} of all ties stay inside a group. ${capital(inWords(nSeeds))} seeds spread over the groups reach ${pct(reachSpread.within_two_steps)} of the members within two steps, the ${inWords(nSeeds)} best ranked members ${pct(reachTop.within_two_steps)}.`,
  stats: [
    {
      value: String(overview.n_members),
      label: `members with ${overview.n_ties} ties`,
      note: `${overview.ties_per_member.mean.toFixed(1)} ties per member on average, ${overview.ties_per_member.highest} at most`,
    },
    { value: String(groups.length), label: 'communities', note: `And ${inWords(alone)} members without any tie` },
    {
      value: pct(reachSpread.within_two_steps),
      label: `reached within two steps by ${inWords(nSeeds)} seeds spread over the communities`,
      note: `${pct(reachSpread.within_one_step)} within one step`,
    },
    {
      value: pct(reachTop.within_two_steps),
      label: `reached by the ${inWords(nSeeds)} best ranked members`,
      note: `They sit in ${inWords(coveredByTop.length)} of the ${inWords(groups.length)} communities`,
    },
  ],

  members,
  ties: results.ties,
  groups,
  alone,
  measures: first.measures,
  seeds: spread.seeds,
  topSeeds: top.seeds,
  nSeeds,

  /** The network itself (run NW-01). */
  networkCard: {
    title: 'The network',
    note: `Every point is a member and every line a tie: ${data.tie_meaning}. The colour is the community the engine found. The places in the drawing only make the ties visible.`,
    facts: [
      { name: 'Density', value: pct(overview.density, 1), note: 'of all possible ties exist' },
      { name: 'Largest connected part', value: `${overview.largest_part.n_members} members`, note: `${pct(overview.largest_part.share_of_members, 1)} of all` },
      { name: 'Steps between two members', value: overview.mean_steps_between_members.toFixed(1), note: `on average, ${overview.longest_shortest_way} at most` },
    ],
    warnings: overview.warnings,
    howToRead: [found.how_to_read[1]],
  },

  /** Are the communities more than chance? (run NW-01) */
  chanceCard: {
    title: 'Are the groups more than chance?',
    text: `A search for communities finds groups in any network, also in one where the ties are placed at random. So the engine rewired the ties at random ${inWords(found.modularity_in_shuffled_networks.n_networks)} times, with every member keeping its number of ties, and searched again. In these shuffled copies the split reaches a modularity of ${found.modularity_in_shuffled_networks.highest.toFixed(2)} at most. In the real network it reaches ${found.modularity.toFixed(2)}.`,
    verdict: found.clearly_above_chance ? 'The communities are clearly more than chance.' : 'The communities are not clearly more than chance.',
    bars: [
      { name: 'This network', value: found.modularity, strong: true },
      { name: `Shuffled copies, the highest of ${found.modularity_in_shuffled_networks.n_networks}`, value: found.modularity_in_shuffled_networks.highest, strong: false },
      { name: 'Shuffled copies, on average', value: found.modularity_in_shuffled_networks.mean, strong: false },
    ],
    note: 'Modularity runs from 0 (the groups hold no more ties than chance would put there) towards 1 (nearly all ties lie inside the groups).',
  },

  /** The teaching trap: the best ranked members sit in the same communities. */
  trap: {
    title: `The ${inWords(nSeeds)} best ranked members sit in ${inWords(coveredByTop.length)} of the ${inWords(groups.length)} communities`,
    text: `Ranked by the number of ties, the best ${inWords(nSeeds)} are ${namesOf(top.seeds)}. They share ${inWords(coveredByTop.length)} communities, so they partly reach the same people, and community ${missedByTop.join(' and ')} gets no seed. Within two steps they reach ${pct(reachTop.within_two_steps)} of the members. If every community gets its best ranked member first (${namesOf(spread.seeds)}), the same number of seeds reaches ${pct(reachSpread.within_two_steps)}. With ${inWords(widest.n_seeds)} seeds the gap is wider still: ${pct(widest.reach.spread.within_two_steps)} against ${pct(widest.reach.top.within_two_steps)}.`,
    sides: [
      { run: 'NW-02' as FurtherRunId, name: optionLabel(ENGINE, 'seeding', 'spread'), seeds: spread.seeds, reach: reachSpread },
      { run: 'NW-03' as FurtherRunId, name: optionLabel(ENGINE, 'seeding', 'top'), seeds: top.seeds, reach: reachTop },
    ],
    engineSays: [found.how_to_read[0], spread.how_to_read[2]],
  },

  /** The four measures of importance (run NW-01). */
  measuresCard: {
    title: 'Who is important? It depends on the measure',
    note: 'Each point is a member: the number of ties across, betweenness up. Most members with many ties also lie on many shortest ways. The named members on the left do not: few ties, but they connect groups.',
    bridges,
    hubs,
    howToRead: first.centrality_how_to_read,
    warnings: first.centrality_warnings,
  },

  /** The what-if view: runs the engine made before, for every measure and one to eight seeds. */
  whatIf: {
    title: 'Another measure, another number of seeds',
    text: `Every combination below is a real run of the engine: ${inWords(results.by_measure.length)} ways of ranking the members, one to ${inWords(byDegree.length)} seeds, each chosen both ways.`,
    measures: results.by_measure.map((item) => ({ value: item.measure, label: measureLabel(item.measure) })),
    byMeasure: results.by_measure,
    start: { measure: spread.settings.measure, nSeeds },
    seedings: { spread: optionLabel(ENGINE, 'seeding', 'spread'), top: optionLabel(ENGINE, 'seeding', 'top') } as Record<Seeding, string>,
    engineSays: first.centrality_warnings,
  },

  details: {
    degrees: {
      title: 'How many ties the members have',
      note: `From ${overview.ties_per_member.lowest} to ${overview.ties_per_member.highest}, ${overview.ties_per_member.median} for the member in the middle`,
      rows: overview.degree_distribution,
      howToRead: overview.how_to_read,
    },
    top: {
      title: 'The ten highest members on each measure',
      note: 'And how far the four orders agree',
      top: first.top,
      agreement: first.agreement,
    },
    between: {
      title: 'The communities in numbers',
      note: 'Size, ties inside and outside, and the ties between each pair',
      ties: found.ties_between_communities,
      warnings: found.warnings,
    },
  },

  coach: {
    note: `The ${inWords(nSeeds)} members with the most ties are the best seeds. So ${namesOf(top.seeds)} get the product samples.`,
    opening: [
      {
        from: 'coach',
        text: `Before the samples go out: to which communities do these ${inWords(nSeeds)} belong, and which community gets no seed?`,
      },
    ],
    turns: [
      {
        student: `${capital(coach.pairs.join(', '))}. Community ${missedByTop.join(' and ')} gets none.`,
        coach: `Right. Now compare the reach within two steps: ${pct(reachTop.within_two_steps)} for your ${inWords(nSeeds)}, ${pct(reachSpread.within_two_steps)} if every community gets a seed first. What explains the difference? And one more thing: what does the ranking not know about these members at all?`,
      },
    ],
  } satisfies CoachScript,
}

// ---------------------------------------------------------------------------
// Runs and setup screens
// ---------------------------------------------------------------------------

const shared = [
  { name: 'Network', value: `${overview.n_members} members, ${overview.n_ties} ties` },
  { name: 'Size of the communities', value: `${first.settings.resolution} (the standard)` },
  { name: 'Random seed', value: String(first.settings.seed) },
]
const rankingSettings = (run: Ranking) => [
  ...shared,
  { name: 'Ranked by', value: measureLabel(run.settings.measure) },
  { name: 'Seeds', value: `${run.settings.n_seeds}, ${optionLabel(ENGINE, 'seeding', run.settings.seeding).toLowerCase()}` },
]

export const networkRuns: Run[] = [
  {
    id: 'NW-01',
    module: 'network',
    label: 'The network and its communities',
    summary: `Overview, four measures of importance, and ${groups.length} communities`,
    when: 'Thu 5 Nov, 11:20',
    to: '/network',
    setupTo: '/network/setup/NW-01',
    settings: [...shared, { name: 'Members listed', value: `${first.settings.top_n} per measure` }],
  },
  {
    id: 'NW-02',
    module: 'network',
    label: 'Five seeds, spread out',
    summary: `${nSeeds} seeds by degree, every community first: ${pct(reachSpread.within_two_steps)} reached within two steps`,
    when: 'Thu 5 Nov, 11:35',
    final: true,
    to: '/network',
    setupTo: '/network/setup/NW-02',
    settings: rankingSettings(spread),
  },
  {
    id: 'NW-03',
    module: 'network',
    label: 'Five seeds, best ranked',
    summary: `${nSeeds} seeds by degree, wherever they sit: ${pct(reachTop.within_two_steps)} reached within two steps`,
    when: 'Thu 5 Nov, 11:41',
    to: '/network',
    setupTo: '/network/setup/NW-03',
    settings: rankingSettings(top),
  },
]

const steps = [
  'Upload the ties (who is connected to whom), and if there is one, the list of all members.',
  'Read the overview: how many members and ties, how dense, how many separate parts.',
  'Look at the four measures of importance, and at the members where they disagree.',
  'Find the communities, and check whether they are more than chance.',
  'Rank the potential influencers by a measure of your choice.',
  'Choose how many seeds you can afford, and compare two ways of choosing them: the best ranked members, or one per community.',
]

export const networkSetups: SetupInfo[] = (['NW-01', 'NW-02', 'NW-03'] as const).map((id): SetupInfo => {
  const run = results.runs[id]
  return {
    runId: id,
    module: 'network',
    engineModule: ENGINE,
    title: id === 'NW-01' ? 'Set up a network analysis' : 'Set up the choice of seeds',
    question: networkQuestion,
    steps,
    inputs: [
      {
        input: 'Ties',
        form: 'One row per tie, with the two members it connects. Ties have no direction.',
        here: `${data.ties_file}: ${thousands(data.n_ties)} ties. A tie means: ${data.tie_meaning}.`,
      },
      {
        input: 'Members (optional)',
        form: 'A list of all members. Needed only if some members have no tie.',
        here: `${data.members_file}: ${data.n_members} members, of whom ${inWords(overview.n_members_without_ties)} have no tie.`,
      },
    ],
    settings: Object.entries(run.settings).map(([key, value]) => ({ key, value })),
    calls: id === 'NW-01' ? 'network_overview, centrality, find_communities' : 'rank_influencers',
    resultsTo: '/network',
  }
})

/** What the presenting script in README.md says out loud about this module. */
export const networkReadme = [
  `${pct(found.share_of_ties_inside)} of all ties`,
  `${found.modularity.toFixed(2)} against ${found.modularity_in_shuffled_networks.highest.toFixed(2)}`,
  `reach ${pct(reachTop.within_two_steps)}`,
  `reaches ${pct(reachSpread.within_two_steps)}`,
]
