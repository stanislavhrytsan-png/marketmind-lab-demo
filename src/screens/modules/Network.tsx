/**
 * Network analysis (run NW-02, with NW-01 for the network itself and NW-03
 * for the comparison): a customer community of 200 members, its groups, and
 * who should hear about a product first.
 *
 * Every number is the engine's. Nothing is calculated in the browser: the
 * what-if view shows runs the engine made before.
 */
import { useMemo, useState } from 'react'
import { CardHead, CoachCard, EngineSays, EngineWarnings, Headline, HowToRead, Slider, Stats, Trap } from '../../components/module'
import { Column, Dot, HoverColumns, Legend, Line, Mark, Plot, VRule } from '../../components/plot'
import { Layer, RunHeader } from '../../components/results'
import { Page } from '../../components/Shell'
import { Accordion, Card, RunTag, SegmentedControl } from '../../components/ui'
import { caseBrief, course } from '../../data/alpineOat'
import { SEEDINGS, networkScreen } from '../../data/network'
import type { Measure, Member, RankingMeasure, Reach, Seed, Seeding } from '../../data/network'
import { cx } from '../../lib/demo'
import { capital, pct } from '../../lib/format'
import { INTERPRETATION, useInterpretation } from '../../lib/interpretation'
import { chart, niceDomain } from '../../lib/plot'

const s = networkScreen

/**
 * One colour per community, checked for readers with colour-blindness. The
 * amber is light on white, so every community is also named in the drawing
 * and listed in the table next to it. Members without a tie are grey.
 */
const communityFill = ['#6250D6', '#D18B00', '#D55181', '#008300']
const fillOf = (community: number) => communityFill[community - 1] ?? chart.slate3
const groupNumbers = s.groups.map((group) => group.community)
const isGroup = (community: number) => groupNumbers.includes(community)
const communityName = (community: number) => (isGroup(community) ? `Community ${community}` : 'No tie')
const byName = new Map(s.members.map((member) => [member.member, member]))
const valueText = (measure: Measure, value: number) => (measure === 'degree' ? `${value} ties` : value.toFixed(3))

function CommunityDot({ community }: { community: number }) {
  return <i className="inline-block h-2.5 w-2.5 flex-none rounded-full" style={{ background: fillOf(community) }} />
}

/** A member as a small chip: the colour of the community, and its name next to it. */
function SeedChip({ seed }: { seed: Seed }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded border border-line bg-white px-2 py-0.5 text-[13px]">
      <CommunityDot community={seed.community} />
      <b className="num font-semibold">{seed.member}</b>
      <span className="text-[12.5px] text-ink3">community {seed.community}</span>
    </span>
  )
}

// ---------------------------------------------------------------- the drawing

const WIDTH = 610
const HEIGHT = 470
const PAD = 24
const px = (member: Member) => PAD + member.x * (WIDTH - 2 * PAD)
const py = (member: Member) => PAD + 12 + member.y * (HEIGHT - 2 * PAD - 12)

/** The network as points and lines. The size of a point follows the chosen measure, and the seeds carry a ring and their name. */
function Drawing({ measure, seeds }: { measure: Measure; seeds: Seed[] }) {
  const largest = Math.max(...s.members.map((member) => member[measure]))
  const radius = (member: Member) => 2.5 + 9 * Math.sqrt(member[measure] / largest)
  const seedNames = new Set(seeds.map((seed) => seed.member))
  const labels = useMemo(
    () =>
      s.groups.map((group) => {
        const own = s.members.filter((member) => member.community === group.community)
        return { community: group.community, x: own.reduce((sum, member) => sum + px(member), 0) / own.length, y: Math.min(...own.map(py)) - 8 }
      }),
    [],
  )
  return (
    <svg width={WIDTH} height={HEIGHT} role="img" aria-label={`The network: ${s.members.length} members in ${s.groups.length} communities. The seeds are ${seeds.map((seed) => seed.member).join(', ')}.`} className="block flex-none overflow-visible">
      {s.ties.map(([a, b], k) => {
        const from = s.members[a]
        const to = s.members[b]
        const inside = from.community === to.community
        return <path key={k} d={`M${px(from).toFixed(1)} ${py(from).toFixed(1)}L${px(to).toFixed(1)} ${py(to).toFixed(1)}`} stroke={inside ? chart.axis : chart.ink3} strokeWidth={inside ? 0.7 : 1} opacity={inside ? 0.7 : 0.9} />
      })}
      {[...s.members]
        .sort((a, b) => b[measure] - a[measure])
        .map((member) => (
          <circle
            key={member.member}
            className="plot-dot"
            cx={px(member)}
            cy={py(member)}
            r={radius(member)}
            fill={fillOf(member.community)}
            stroke="#fff"
            strokeWidth={1}
            data-tip={`${member.member}, ${communityName(member.community).toLowerCase()}\n${member.degree} ties (place ${member.places.degree})\nBetweenness: place ${member.places.betweenness}\nCloseness: place ${member.places.closeness}\nEigenvector centrality: place ${member.places.eigenvector}`}
          />
        ))}
      {s.members
        .filter((member) => seedNames.has(member.member))
        .map((member) => (
          <g key={member.member} pointerEvents="none">
            <circle cx={px(member)} cy={py(member)} r={radius(member) + 4} fill="none" stroke={chart.ink} strokeWidth={2} />
            <text x={px(member) + radius(member) + 8} y={py(member) + 4} fontSize={12.5} fontWeight={700} fill={chart.ink} stroke="#fff" strokeWidth={3.5} paintOrder="stroke" strokeLinejoin="round">
              {member.member}
            </text>
          </g>
        ))}
      {labels.map((label) => (
        <text key={label.community} className="plot-mark" x={Math.min(Math.max(label.x, 52), WIDTH - 52)} y={Math.max(label.y, 12)} textAnchor="middle" fontSize={12.5} fontWeight={600} fill={chart.ink2} stroke="#fff" strokeWidth={3.5} paintOrder="stroke" strokeLinejoin="round">
          {communityName(label.community)}
        </text>
      ))}
      {s.alone > 0 && (
        <text x={PAD + 0.33 * (WIDTH - 2 * PAD)} y={HEIGHT - PAD + 4} fontSize={12.5} fill={chart.ink3}>
          {s.alone} members without any tie
        </text>
      )}
    </svg>
  )
}

// ---------------------------------------------------------------- key results

function NetworkCard() {
  const { networkCard } = s
  const [measure, setMeasure] = useState<Measure>('degree')
  const chosen = s.measures.find((item) => item.key === measure) ?? s.measures[0]
  return (
    <Card className="p-5">
      <CardHead
        title={
          <span className="flex items-center gap-2.5">
            {networkCard.title} <RunTag id={s.firstRunId} />
          </span>
        }
        note={networkCard.note}
        right={
          <span className="flex items-center gap-2.5">
            <span className="t-lbl">Size of a point</span>
            <SegmentedControl label="Size of a point" value={measure} onChange={setMeasure} options={s.measures.map((item) => ({ value: item.key, label: item.key === 'eigenvector' ? 'Eigenvector' : item.label }))} />
          </span>
        }
      />
      <div className="mt-3 flex items-start gap-6">
        <div className="flex-none">
          <Drawing measure={measure} seeds={s.seeds} />
        </div>
        <div className="min-w-0 flex-1 pt-3">
          <p className="text-[13px] text-ink2">
            <b className="font-semibold text-ink">{chosen.label}.</b> {chosen.meaning}
          </p>
          <div className="mt-4 flex flex-col gap-3 border-t border-line2 pt-3">
            {networkCard.facts.map((fact) => (
              <div key={fact.name} className="text-[13px]">
                <p className="text-ink2">{fact.name}</p>
                <p>
                  <b className="num text-[15px] font-bold">{fact.value}</b> <span className="text-ink3">{fact.note}</span>
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-line2 pt-3 text-[13px] text-ink2">
            <span className="mr-1.5 inline-block h-3.5 w-3.5 translate-y-[2px] rounded-full border-2 border-ink" /> The {s.seeds.length} seeds of this run carry a ring and their name.
          </p>
        </div>
      </div>
      <div className="-mx-3 mt-3">
        <table className="tbl tbl-tight">
          <thead>
            <tr>
              <th>Community</th>
              <th className="r">Members</th>
              <th className="r">Ties inside</th>
              <th className="r">Ties to other communities</th>
              <th className="r">Share of its ties inside</th>
              <th>Best connected members</th>
            </tr>
          </thead>
          <tbody>
            {s.groups.map((group) => (
              <tr key={group.community}>
                <td>
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <CommunityDot community={group.community} /> {communityName(group.community)}
                  </span>
                </td>
                <td className="r">{group.n_members}</td>
                <td className="r">{group.n_ties_inside}</td>
                <td className="r">{group.n_ties_to_other_communities}</td>
                <td className="r font-bold">{pct(group.share_of_ties_inside ?? 0)}</td>
                <td className="text-ink2">{group.best_connected_members.map((member) => `${member.member} (${member.ties_inside})`).join(', ')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EngineWarnings className="mt-3" warnings={networkCard.warnings} />
      <HowToRead className="mt-3 max-w-[94ch]" lines={networkCard.howToRead} />
    </Card>
  )
}

function ChanceCard() {
  const { chanceCard } = s
  return (
    <Card className="mt-4 p-5">
      <CardHead title={chanceCard.title} />
      <div className="mt-2 grid grid-cols-[minmax(0,6fr)_minmax(0,5fr)] gap-10">
        <div>
          <p className="text-[13.5px] text-ink2">{chanceCard.text}</p>
          <p className="mt-2 text-[14px] font-bold">{chanceCard.verdict}</p>
        </div>
        <div>
          <p className="t-lbl">Modularity of the best split</p>
          <div className="mt-2 flex flex-col gap-2">
            {chanceCard.bars.map((bar) => (
              <div key={bar.name} className="grid grid-cols-[minmax(0,1fr)_42px] items-center gap-x-3 gap-y-0.5 text-[13px]">
                <span className={cx('col-span-2', bar.strong && 'font-semibold')}>{bar.name}</span>
                <span className="h-3.5 rounded-[3px] bg-fill">
                  <i className="bar-grow block h-3.5 rounded-r" style={{ width: `${bar.value * 100}%`, background: bar.strong ? chart.primary : chart.slate2 }} />
                </span>
                <span className="num text-right font-bold">{bar.value.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-ink3">{chanceCard.note}</p>
        </div>
      </div>
    </Card>
  )
}

/** Two bars per row: the share of the members reached within one step and within two steps. */
function ReachBars({ reach, strong }: { reach: Reach; strong: boolean }) {
  const rows = [
    { name: 'within one step', value: reach.within_one_step },
    { name: 'within two steps', value: reach.within_two_steps },
  ]
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row) => (
        <div key={row.name} className="grid grid-cols-[112px_minmax(0,1fr)_42px] items-center gap-3 text-[13px]">
          <span className="text-ink2">{capital(row.name)}</span>
          <span className="h-3.5 rounded-[3px] bg-fill">
            <i className="bar-grow block h-3.5 rounded-r" style={{ width: `${row.value * 100}%`, background: strong ? chart.primary : chart.slate }} />
          </span>
          <span className="num text-right font-bold">{pct(row.value)}</span>
        </div>
      ))}
    </div>
  )
}

function SeedsTrap() {
  const { trap } = s
  return (
    <Trap title={trap.title} className="mt-4">
      <p className="max-w-[98ch]">{trap.text}</p>
      <div className="mt-4 grid grid-cols-2 gap-6">
        {trap.sides.map((side, k) => (
          <div key={side.run} className="rounded-lg border border-line p-3.5">
            <p className="flex items-center gap-2.5 text-[13.5px] font-bold text-ink">
              <RunTag id={side.run} /> {side.name}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {side.seeds.map((seed) => (
                <SeedChip key={seed.member} seed={seed} />
              ))}
            </div>
            <p className="mt-2 text-[12.5px] text-ink3">
              {side.reach.n_communities_with_a_seed} of {s.groups.length} communities {side.reach.n_communities_with_a_seed === 1 ? 'has' : 'have'} a seed. Share of all members reached:
            </p>
            <div className="mt-1.5">
              <ReachBars reach={side.reach} strong={k === 0} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {trap.engineSays.map((text) => (
          <EngineSays key={text}>{text}</EngineSays>
        ))}
      </div>
    </Trap>
  )
}

function MeasuresCard() {
  const { measuresCard } = s
  const x = niceDomain(s.members.map((member) => member.degree), 6)
  const y = niceDomain(s.members.map((member) => member.betweenness), 4)
  const leading = s.members.filter((member) => member.places.degree <= 4 || member.places.betweenness <= 3)
  const named = [...measuresCard.bridges.slice(0, 3).map((member, k) => ({ member, strong: true, left: k % 2 === 0 })), ...leading.map((member) => ({ member, strong: false, left: false }))]
  return (
    <Card className="mt-4 p-5">
      <CardHead
        title={
          <span className="flex items-center gap-2.5">
            {measuresCard.title} <RunTag id={s.firstRunId} />
          </span>
        }
        note={measuresCard.note}
      />
      <div className="mt-3 grid grid-cols-[minmax(0,7fr)_minmax(0,4fr)] gap-8">
        <div>
          <Plot
            height={300}
            x={x.domain}
            y={y.domain}
            xTicks={x.ticks.map((value) => ({ value, label: String(value) }))}
            yTicks={y.ticks}
            yFormat={(value) => value.toFixed(2)}
            yLabel="Betweenness"
            xLabel="Number of ties (degree)"
            label={`${measuresCard.title}. Members with few ties and a high betweenness: ${measuresCard.bridges.map((member) => member.member).join(', ')}.`}
            fallbackWidth={560}
          >
            {(frame) => (
              <>
                {s.members.map((member) => (
                  <Dot key={member.member} x={frame.sx(member.degree)} y={frame.sy(member.betweenness)} r={2.5} color={fillOf(member.community)} tip={`${member.member}, ${communityName(member.community).toLowerCase()}\n${member.degree} ties (place ${member.places.degree})\nBetweenness ${member.betweenness.toFixed(3)} (place ${member.places.betweenness})`} />
                ))}
                {named.map(({ member, strong, left }) => (
                  <Mark key={member.member} x={frame.sx(member.degree) + (left ? -8 : 8)} y={frame.sy(member.betweenness) + 4} anchor={left ? 'end' : 'start'} color={chart.ink} strong={strong}>
                    {member.member}
                  </Mark>
                ))}
              </>
            )}
          </Plot>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink2">
            {s.groups.map((group) => (
              <span key={group.community} className="inline-flex items-center gap-1.5">
                <CommunityDot community={group.community} /> {communityName(group.community)}
              </span>
            ))}
          </div>
        </div>
        <div>
          <p className="t-lbl">Few ties, but on many shortest ways</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {measuresCard.bridges.map((member) => (
              <div key={member.member} className="flex items-center gap-2 text-[13px]">
                <CommunityDot community={member.community} />
                <b className="num font-semibold">{member.member}</b>
                <span className="text-ink3">
                  {member.degree} ties (place {member.places.degree}), betweenness place {member.places.betweenness}
                </span>
              </div>
            ))}
          </div>
          <HowToRead className="mt-4" lines={measuresCard.howToRead} />
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- what if

function WhatIf() {
  const { whatIf } = s
  const [measure, setMeasure] = useState<RankingMeasure>(whatIf.start.measure)
  const [nSeeds, setNSeeds] = useState(whatIf.start.nSeeds)
  const rows = (whatIf.byMeasure.find((item) => item.measure === measure) ?? whatIf.byMeasure[0]).by_n_seeds
  const chosen = rows.find((row) => row.n_seeds === nSeeds) ?? rows[rows.length - 1]
  const color: Record<Seeding, string> = { spread: chart.primary, top: chart.slate }
  return (
    <Card>
      <div className="px-5 pt-4">
        <CardHead title={<span className="text-[16px]">{whatIf.title}</span>} note={whatIf.text} />
      </div>
      <div className="grid grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-8 px-5 pb-5 pt-4">
        <div>
          <p className="t-lbl">The members are ranked by</p>
          <SegmentedControl className="mt-1 flex-wrap" label="The members are ranked by" value={measure} onChange={setMeasure} options={whatIf.measures.map((item) => ({ value: item.value, label: item.value === 'eigenvector' ? 'Eigenvector' : item.value === 'combined' ? 'All four' : item.label }))} />
          <div className="mt-4 max-w-[320px]">
            <Slider label="Number of seeds" min={rows[0].n_seeds} max={rows[rows.length - 1].n_seeds} step={1} value={nSeeds} onChange={setNSeeds} format={(value) => String(value)} />
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {SEEDINGS.map((seeding) => (
              <div key={seeding} className="rounded-lg border border-line p-3">
                <p className="flex items-center gap-2 text-[13px] font-bold">
                  <i className="block h-0.5 w-5 rounded" style={{ background: color[seeding], height: 3 }} /> {whatIf.seedings[seeding]}
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {chosen.seeds[seeding].map((seed) => (
                    <SeedChip key={seed.member} seed={seed} />
                  ))}
                </div>
                <p className="mt-2 text-[13px] text-ink2">
                  Reaches <b className="font-bold text-ink">{pct(chosen.reach[seeding].within_two_steps)}</b> of the members within two steps ({pct(chosen.reach[seeding].within_one_step)} within one). {chosen.reach[seeding].n_communities_with_a_seed} of {s.groups.length} communities {chosen.reach[seeding].n_communities_with_a_seed === 1 ? 'has' : 'have'} a seed.
                </p>
              </div>
            ))}
          </div>
        </div>
        <div>
          <Plot
            height={320}
            x={[rows[0].n_seeds - 0.4, rows[rows.length - 1].n_seeds + 0.4]}
            y={[0, 1]}
            yTicks={[0, 0.25, 0.5, 0.75, 1]}
            xTicks={rows.map((row) => ({ value: row.n_seeds, label: String(row.n_seeds) }))}
            yFormat={(value) => pct(value)}
            yLabel="Members reached within two steps"
            xLabel="Number of seeds"
            label={`Reach within two steps by the number of seeds, for both ways of choosing them. With ${nSeeds} seeds: ${SEEDINGS.map((seeding) => `${whatIf.seedings[seeding]} ${pct(chosen.reach[seeding].within_two_steps)}`).join(', ')}.`}
            fallbackWidth={520}
          >
            {(frame) => (
              <>
                <VRule x={frame.sx(nSeeds)} top={frame.top} bottom={frame.bottom} />
                {[...SEEDINGS].reverse().map((seeding) => (
                  <Line key={seeding} points={rows.map((row) => [frame.sx(row.n_seeds), frame.sy(row.reach[seeding].within_two_steps)])} color={color[seeding]} width={seeding === 'spread' ? 2.5 : 2} />
                ))}
                {[...SEEDINGS].reverse().map((seeding) => (
                  <Dot key={seeding} x={frame.sx(nSeeds)} y={frame.sy(chosen.reach[seeding].within_two_steps)} color={color[seeding]} />
                ))}
                <HoverColumns
                  frame={frame}
                  focusable
                  items={rows.map((row) => ({
                    x: frame.sx(row.n_seeds),
                    tip: `${row.n_seeds} ${row.n_seeds === 1 ? 'seed' : 'seeds'}\n${SEEDINGS.map((seeding) => `${whatIf.seedings[seeding]}: ${pct(row.reach[seeding].within_two_steps)}`).join('\n')}`,
                  }))}
                />
              </>
            )}
          </Plot>
          <Legend className="mt-2" items={SEEDINGS.map((seeding) => ({ label: whatIf.seedings[seeding], color: color[seeding] }))} />
          <div className="mt-3 flex flex-col gap-2">
            {whatIf.engineSays.map((text) => (
              <EngineSays key={text}>{text}</EngineSays>
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- details

function DegreeChart() {
  const { degrees } = s.details
  const { domain, ticks } = niceDomain(degrees.rows.map((row) => row.n_members), 4)
  const last = degrees.rows[degrees.rows.length - 1].ties
  return (
    <>
      <Plot
        className="mt-3"
        height={240}
        x={[-0.7, last + 0.7]}
        y={domain}
        yTicks={ticks}
        xTicks={degrees.rows.filter((row) => row.ties % 4 === 0).map((row) => ({ value: row.ties, label: String(row.ties) }))}
        yLabel="Members"
        xLabel="Number of ties"
        label={`${degrees.title}: ${degrees.note}.`}
      >
        {(frame) => (
          <>
            {degrees.rows.map((row) => (
              <Column key={row.ties} x={frame.sx(row.ties)} y={frame.sy(row.n_members)} base={frame.sy(0)} width={(frame.right - frame.left) / (last + 1.4) - 3} color={chart.slate} tip={`${row.n_members} ${row.n_members === 1 ? 'member has' : 'members have'} ${row.ties} ${row.ties === 1 ? 'tie' : 'ties'}`} />
            ))}
          </>
        )}
      </Plot>
      <HowToRead className="mt-3 max-w-[94ch]" lines={degrees.howToRead} />
    </>
  )
}

function TopTables() {
  const { top } = s.details
  return (
    <>
      <div className="mt-3 grid grid-cols-4 gap-6">
        {s.measures.map((measure) => (
          <div key={measure.key}>
            <p className="text-[13px] font-bold">{measure.label}</p>
            <table className="tbl tbl-tight mt-1">
              <tbody>
                {top.top[measure.key].map((row) => (
                  <tr key={row.member}>
                    <td className="w-6 text-ink3">{row.place}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 font-semibold">
                        <CommunityDot community={byName.get(row.member)?.community ?? 0} /> {row.member}
                      </span>
                    </td>
                    <td className="r text-ink2">{valueText(measure.key, row.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[13px] font-bold">How far two orders agree</p>
      <p className="text-[12.5px] text-ink3">Rank correlation over all members: 1 is the same order, 0 no relation.</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {top.agreement.map((pair) => (
          <span key={`${pair.first} ${pair.second}`} className="rounded border border-line px-2.5 py-1 text-[13px]">
            {capital(pair.first)} and {pair.second}: <b className="num font-bold">{pair.rank_correlation.toFixed(2)}</b>
          </span>
        ))}
      </div>
    </>
  )
}

function BetweenTable() {
  const { between } = s.details
  const tiesOf = (a: number, b: number) => between.ties.find((pair) => (pair.first === a && pair.second === b) || (pair.first === b && pair.second === a))?.n_ties ?? 0
  return (
    <>
      <p className="mt-3 text-[13.5px] text-ink2">How many ties connect each pair of communities.</p>
      <table className="tbl tbl-tight mt-1 max-w-[620px]">
        <thead>
          <tr>
            <th />
            {s.groups.map((group) => (
              <th key={group.community} className="r">
                {communityName(group.community)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {s.groups.map((row) => (
            <tr key={row.community}>
              <td>
                <span className="inline-flex items-center gap-2 font-semibold">
                  <CommunityDot community={row.community} /> {communityName(row.community)}
                </span>
              </td>
              {s.groups.map((column) => (
                <td key={column.community} className={cx('r', row.community === column.community && 'text-ink3')}>
                  {row.community === column.community ? `${row.n_ties_inside} inside` : tiesOf(row.community, column.community)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <EngineWarnings className="mt-3" warnings={between.warnings} />
    </>
  )
}

// ---------------------------------------------------------------- screen

export default function Network() {
  const toInterpretation = useInterpretation()
  const { details } = s
  return (
    <Page crumbs={[course.name, caseBrief.name, 'Network analysis', s.runId]}>
      <RunHeader id={s.runId} summary={s.summary} setupTo={`/network/setup/${s.runId}`} compareTo={`/runs?a=${s.runId}&b=${s.otherRunId}`} onInterpret={toInterpretation} />

      <div className="mt-8">
        <Layer n={1} title="Headline" note="The one thing to take away">
          <Headline wide>{s.headline}</Headline>
          <Stats className="mt-6" items={s.stats} />
        </Layer>

        <Layer n={2} title="Key results" note="Enough for most decisions">
          <NetworkCard />
          <ChanceCard />
          <SeedsTrap />
          <MeasuresCard />
        </Layer>

        <Layer n={3} title="What if" note="Other seeds, chosen another way">
          <WhatIf />
        </Layer>

        <Layer n={4} title="Details" note="Open what you need">
          <Accordion title={details.degrees.title} note={details.degrees.note}>
            <DegreeChart />
          </Accordion>
          <Accordion title={details.top.title} note={details.top.note} icon="table">
            <TopTables />
          </Accordion>
          <Accordion title={details.between.title} note={details.between.note} icon="table">
            <BetweenTable />
          </Accordion>
        </Layer>

        <Layer n={5} title="Interpretation" note="Your reading first, then the coach" id={INTERPRETATION} last>
          <CoachCard script={s.coach} />
        </Layer>
      </div>
    </Page>
  )
}
