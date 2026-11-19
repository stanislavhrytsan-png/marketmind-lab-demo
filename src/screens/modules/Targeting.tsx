/**
 * Predictive modeling (targeting): who responds to a campaign, and how many
 * customers should be contacted (runs TG-01 and TG-02).
 *
 * Both models were fitted and tested by the engine. The what-if view repeats
 * only the arithmetic of the campaign in the browser: profit by the share of
 * the list that gets a letter (src/lib/targeting.ts).
 */
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TrackBarChart } from '../../components/charts'
import { CardHead, CoachCard, EngineSays, Headline, HowToRead, Slider, Stat, Stats, Trap } from '../../components/module'
import { Column, Dot, HoverColumns, HRule, Legend, Line, Mark, Plot, VRule } from '../../components/plot'
import { Layer, RunHeader } from '../../components/results'
import { Page } from '../../components/Shell'
import { Accordion, Button, Card, RunTag, SegmentedControl, Tag } from '../../components/ui'
import { caseBrief, course } from '../../data/alpineOat'
import { targetingModels, targetingRunIds, targetingScreen } from '../../data/targeting'
import type { TargetingRunId } from '../../data/targeting'
import { cx } from '../../lib/demo'
import { chf, fixed, pct, thousands } from '../../lib/format'
import { INTERPRETATION, useInterpretation } from '../../lib/interpretation'
import { chart, niceDomain } from '../../lib/plot'
import { bestDepth, breakEven, campaignDepths } from '../../lib/targeting'

type Screen = ReturnType<typeof targetingScreen>

const shareTicks = [0, 0.2, 0.4, 0.6, 0.8, 1].map((value) => ({ value, label: pct(value) }))

// ---------------------------------------------------------------- key results

function GainsChart({ s }: { s: Screen }) {
  const g = s.groups
  const points: [number, number][] = [[0, 0], ...g.group.map((_, k): [number, number] => [g.cumulative_share_of_customers[k], g.cumulative_share_of_responders[k]])]
  return (
    <Card className="p-5">
      <CardHead title={s.gainsChart.title} note={s.gainsChart.note} />
      <Plot
        className="mt-3"
        height={424}
        x={[0, 1]}
        y={[0, 1]}
        yTicks={[0, 0.2, 0.4, 0.6, 0.8, 1]}
        xTicks={shareTicks}
        yFormat={(value) => pct(value)}
        yLabel="Share of all responders reached"
        xLabel="Share of the list contacted, best-rated customers first"
        label={`${s.gainsChart.title}. ${s.gainsChart.mark}.`}
        margin={{ right: 16 }}
      >
        {(frame) => (
          <>
            <Line points={[[frame.sx(0), frame.sy(0)], [frame.sx(1), frame.sy(1)]]} color={chart.slate3} dashed />
            <Line points={points.map(([x, y]) => [frame.sx(x), frame.sy(y)])} color={chart.slate} width={2.5} />
            {points.slice(1).map(([x, y], k) => (
              <Dot
                key={k}
                x={frame.sx(x)}
                y={frame.sy(y)}
                r={k === 1 ? 4 : 3}
                color={chart.slate}
                tip={`Best ${pct(x)} of the list: ${pct(y)} of the responders\nA list in random order: ${pct(x)}`}
              />
            ))}
            <Mark x={frame.sx(points[2][0]) + 12} y={frame.sy(points[2][1]) + 14} color={chart.ink} strong>
              {s.gainsChart.mark}
            </Mark>
          </>
        )}
      </Plot>
      <Legend
        className="mt-2"
        items={[
          { label: `List sorted by the ${s.kindLabel.toLowerCase()}`, color: chart.slate },
          { label: 'List in random order', color: chart.slate3, mark: 'dash' },
        ]}
      />
      <HowToRead className="mt-4" lines={s.howToRead.slice(0, 1).concat(s.howToRead.slice(2))} />
    </Card>
  )
}

function LiftChart({ s }: { s: Screen }) {
  const g = s.groups
  const { domain, ticks } = niceDomain(g.response_rate, 5)
  return (
    <Card className="p-5">
      <CardHead title={s.liftChart.title} note={s.liftChart.note} />
      <Plot
        className="mt-3"
        height={236}
        x={[0.4, s.tenths + 0.6]}
        y={domain}
        yTicks={ticks}
        xTicks={g.group.map((group) => ({ value: group, label: String(group) }))}
        yFormat={(value) => pct(value)}
        yLabel="Share that responded"
        xLabel="Tenth of the list, best-rated first"
        label={`${s.liftChart.title}: from ${pct(g.response_rate[0])} in the best tenth to ${pct(g.response_rate[s.tenths - 1])} in the last.`}
      >
        {(frame) => (
          <>
            {g.group.map((group, k) => (
              <Column
                key={group}
                x={frame.sx(group)}
                y={frame.sy(g.response_rate[k])}
                base={frame.sy(0)}
                width={(frame.right - frame.left) / s.tenths - 8}
                color={chart.slate}
                tip={`Tenth ${group}: ${pct(g.response_rate[k], 1)} responded, ${g.lift[k].toFixed(1)} times the average\nScores from ${pct(g.lowest_probability[k])} to ${pct(g.highest_probability[k])}`}
              />
            ))}
            <HRule y={frame.sy(s.averageRate)} left={frame.left} right={frame.right} />
            <Mark x={frame.right} y={frame.sy(s.averageRate) - 7} anchor="end" color={chart.ink}>
              Average {pct(s.averageRate, 1)}
            </Mark>
          </>
        )}
      </Plot>
    </Card>
  )
}

function ImportanceCard({ s }: { s: Screen }) {
  const largest = Math.max(...s.importance.rows.map((row) => row.importance))
  return (
    <Card className="p-5">
      <CardHead title={s.importance.title} note={s.importance.note} />
      <div className="mt-3">
        <TrackBarChart
          max={Math.ceil(largest * 10) / 10}
          labelWidth={258}
          valueWidth={36}
          rows={s.importance.rows.map((row) => ({
            label: row.label,
            value: row.importance,
            color: chart.slate,
            text: pct(row.importance),
            tip: `${row.label}: ${pct(row.importance, 1)} of the differences between the scores`,
          }))}
        />
      </div>
    </Card>
  )
}

function HitRateTrap({ s }: { s: Screen }) {
  const { trap } = s
  return (
    <Trap title={trap.title} className="mt-4">
      <p className="max-w-[94ch]">{trap.text}</p>
      <div className="-mx-3 mt-2">
        <table className="tbl tbl-tight text-[13px]">
          <thead>
            <tr>
              <th>A customer counts as a responder from a score of</th>
              <th className="r">Customers marked</th>
              <th className="r">Responders found, of {trap.responders}</th>
              <th className="r">Hit rate</th>
              <th className="r">Against guessing ({pct(trap.guessing, 1)})</th>
            </tr>
          </thead>
          <tbody>
            {trap.rows.map((row, i) => (
              <tr key={row.threshold} className={i === 0 ? 'bg-primary-t' : undefined}>
                <td className="font-semibold">
                  {row.threshold}
                  {i === 0 && <span className="ml-2 font-normal text-ink3">the usual threshold</span>}
                </td>
                <td className="r">{thousands(row.predicted_responders)}</td>
                <td className="r">
                  {thousands(row.responders_found)} <span className="text-ink3">({pct(row.share_of_responders_found)})</span>
                </td>
                <td className="r font-bold">{pct(row.hit_rate, 1)}</td>
                <td className="r">
                  {Math.abs(row.hit_rate - row.hit_rate_by_guessing) < 0.0005 ? 'the same' : `${fixed((row.hit_rate - row.hit_rate_by_guessing) * 100, 1)} points`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {trap.engineSays.map((text) => (
          <EngineSays key={text}>{text}</EngineSays>
        ))}
      </div>
    </Trap>
  )
}

// ---------------------------------------------------------------- what if

function WhatIf({ s }: { s: Screen }) {
  const { whatIf } = s
  const [cost, setCost] = useState(whatIf.saved.cost)
  const [margin, setMargin] = useState(whatIf.saved.margin)
  const [list, setList] = useState(whatIf.saved.list)
  const changed = cost !== whatIf.saved.cost || margin !== whatIf.saved.margin || list !== whatIf.saved.list

  const depths = useMemo(() => campaignDepths(s.groups, whatIf.nScored, cost, margin, list), [s.groups, whatIf.nScored, cost, margin, list])
  const best = bestDepth(depths)
  const everyone = depths[depths.length - 1]
  const rate = breakEven(cost, margin)
  const { domain, ticks } = niceDomain([...depths.map((depth) => depth.profit), ...(changed ? whatIf.savedProfit : [])], 5)

  return (
    <Card>
      <div className="px-5 pt-4">
        <CardHead
          title={<span className="text-[16px]">{whatIf.title}</span>}
          note={whatIf.text}
          right={
            changed && (
              <Button
                variant="quiet"
                size="sm"
                onClick={() => {
                  setCost(whatIf.saved.cost)
                  setMargin(whatIf.saved.margin)
                  setList(whatIf.saved.list)
                }}
              >
                Reset to {s.runId}
              </Button>
            )
          }
        />
      </div>
      <div className="grid grid-cols-[292px_minmax(0,1fr)] items-start gap-6 px-5 pb-5 pt-3">
        <div className="flex flex-col gap-4">
          <Slider label="Cost per contact" {...whatIf.cost} value={cost} onChange={setCost} format={(value) => chf(value)} />
          <Slider label="Margin per response" {...whatIf.margin} value={margin} onChange={setMargin} format={(value) => chf(value, 0)} />
          <Slider label="Size of the list" {...whatIf.list} value={list} onChange={setList} format={(value) => `${thousands(value)} customers`} />
          <HowToRead lines={whatIf.howToRead} />
        </div>

        <div className="min-w-0">
          <Plot
            height={300}
            x={[0, 1]}
            y={domain}
            yTicks={ticks}
            xTicks={shareTicks}
            yFormat={(value) => thousands(value)}
            yLabel={whatIf.yLabel}
            xLabel="Share of the list contacted, best-rated customers first"
            label="Profit of the campaign by the share of the list that is contacted, for the numbers on the left."
            margin={{ top: 44, left: 62, right: 16 }}
          >
            {(frame) => (
              <>
                {changed && <Line points={whatIf.savedProfit.map((profit, k) => [frame.sx(k / (whatIf.savedProfit.length - 1)), frame.sy(profit)])} color={chart.slate3} />}
                <Line points={depths.map((depth) => [frame.sx(depth.share), frame.sy(depth.profit)])} color={chart.primary} width={2.5} />
                {depths.map((depth) => (
                  <Dot key={depth.groups} x={frame.sx(depth.share)} y={frame.sy(depth.profit)} r={depth.groups === best.groups ? 4 : 2.5} color={chart.primary} />
                ))}
                <VRule x={frame.sx(best.share)} top={frame.top - 6} bottom={frame.bottom} />
                <Mark x={frame.sx(best.share)} y={frame.top - 12} anchor={best.share > 0.8 ? 'end' : best.share < 0.2 ? 'start' : 'middle'} strong color={chart.ink}>
                  {best.groups === 0 ? 'Best: no campaign' : `Best: the top ${pct(best.share)}`}
                </Mark>
                <HoverColumns
                  frame={frame}
                  focusable
                  items={depths.map((depth) => ({
                    x: frame.sx(depth.share),
                    tip: `Best ${pct(depth.share)} of the list\n${thousands(depth.contacted)} letters, ${thousands(depth.responders)} responders\nProfit: ${chf(depth.profit, 0)}`,
                  }))}
                />
              </>
            )}
          </Plot>
          <Legend
            className="mt-2"
            items={[{ label: 'Profit with your numbers', color: chart.primary }, ...(changed ? [{ label: `Run ${s.runId}`, color: chart.slate3 }] : [])]}
          />
          <div className="mt-4 flex items-start gap-6 border-t border-line2 pt-4">
            <Stat
              className="flex-1"
              value={pct(best.share)}
              label="of the list should get a letter"
              note={best.groups === 0 ? 'No tenth of the list earns back its letters' : `${thousands(best.contacted)} letters, ${thousands(best.responders)} expected responders`}
            />
            <Stat
              className="flex-1"
              value={chf(best.profit, 0)}
              label="profit of that campaign"
              note={`${chf(best.profit - everyone.profit, 0)} more than a letter to everyone (${chf(everyone.profit, 0)})`}
            />
            <Stat
              className="flex-1"
              value={rate === null ? '' : pct(rate, 1)}
              label="response rate at which a letter pays"
              note="Cost per contact divided by margin per response"
            />
          </div>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- details

function GroupsTable({ s }: { s: Screen }) {
  const g = s.groups
  return (
    <table className="tbl tbl-tight mt-2">
      <thead>
        <tr>
          <th>Tenth of the list</th>
          <th className="r">Scores</th>
          <th className="r">Customers</th>
          <th className="r">Responded</th>
          <th className="r">Response rate</th>
          <th className="r">Lift</th>
          <th className="r">Responders reached so far</th>
        </tr>
      </thead>
      <tbody>
        {g.group.map((group, k) => (
          <tr key={group}>
            <td className="font-semibold">{group}</td>
            <td className="r text-ink2">
              {pct(g.lowest_probability[k])} to {pct(g.highest_probability[k])}
            </td>
            <td className="r">{g.n[k]}</td>
            <td className="r">{thousands(g.responders[k])}</td>
            <td className="r">{pct(g.response_rate[k], 1)}</td>
            <td className={cx('r', g.lift[k] >= 1 && 'font-bold')}>{g.lift[k].toFixed(2)}</td>
            <td className="r">{pct(g.cumulative_share_of_responders[k])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function WeightsTable({ weights }: { weights: NonNullable<Screen['details']['weights']> }) {
  return (
    <>
      <table className="tbl tbl-tight mt-2">
        <thead>
          <tr>
            <th>Predictor</th>
            <th className="r">Weight</th>
            <th className="r">Odds ratio</th>
            <th className="r">Chance of a weight this large by luck</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {weights.rows.map((row) => {
            const clear = row.p_value < weights.clear
            return (
              <tr key={row.term} className={clear ? undefined : 'text-ink3'}>
                <td className={clear ? 'font-semibold' : undefined}>
                  {row.label}
                  {row.category && <span className="font-normal text-ink3">: {row.category}</span>}
                </td>
                <td className="r">{fixed(row.coefficient, 3)}</td>
                <td className="r">{row.odds_ratio === null ? '' : row.odds_ratio.toFixed(2)}</td>
                <td className="r">{row.p_value < 0.001 ? 'under 0.1%' : pct(row.p_value, row.p_value < 0.1 ? 1 : 0)}</td>
                <td className="w-[132px]">{clear ? <Tag tone="ok">Clear effect</Tag> : <Tag>No clear effect</Tag>}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
      <p className="mt-3 max-w-[86ch] text-[13.5px] text-ink2">{weights.text}</p>
    </>
  )
}

function RulesTable({ rules }: { rules: NonNullable<Screen['details']['rules']> }) {
  return (
    <table className="tbl tbl-tight mt-2">
      <thead>
        <tr>
          <th>Final group: customers with</th>
          <th className="r">Customers</th>
          <th className="r">Response rate</th>
        </tr>
      </thead>
      <tbody>
        {rules.rows.map((row) => (
          <tr key={row.rule}>
            <td className="text-ink2">{row.rule}</td>
            <td className="r">{thousands(row.n)}</td>
            <td className="r font-bold">{pct(row.response_rate, 1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ModelsTable({ s }: { s: Screen }) {
  const { models } = s.details
  return (
    <>
      <table className="tbl tbl-tight mt-2">
        <thead>
          <tr>
            <th>Model</th>
            <th className="r">Area under the curve, test customers</th>
            <th className="r">On the customers it learned from</th>
            <th className="r">Lift of the best tenth</th>
            <th className="r">Responders in the best two tenths</th>
            <th className="r">Hit rate</th>
          </tr>
        </thead>
        <tbody>
          {models.rows.map((row) => (
            <tr key={row.kind} className={row.kind === s.kind ? 'bg-primary-t' : undefined}>
              <td className="font-semibold">
                {row.rank}. {row.label}
              </td>
              <td className="r font-bold">{row.area_under_curve.toFixed(3)}</td>
              <td className="r text-ink2">{row.area_under_curve_training.toFixed(3)}</td>
              <td className="r">{row.top_group_lift.toFixed(2)}</td>
              <td className="r">{pct(row.share_of_responders_in_top_two_groups)}</td>
              <td className="r text-ink2">{pct(row.hit_rate, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-[13.5px] text-ink2">
        <Link to={`/targeting?run=${models.otherRun.id}`} className="rounded font-semibold text-primary hover:underline">
          Open the {models.otherRun.label.toLowerCase()}
        </Link>{' '}
        <RunTag id={models.otherRun.id} className="ml-1" />
      </p>
    </>
  )
}

// ---------------------------------------------------------------- screen

export default function Targeting() {
  const [params, setParams] = useSearchParams()
  const id: TargetingRunId = targetingRunIds.find((run) => run === params.get('run')) ?? targetingRunIds[0]
  const s = useMemo(() => targetingScreen(id), [id])
  const toInterpretation = useInterpretation()
  const { details } = s

  return (
    <Page crumbs={[course.name, caseBrief.name, 'Predictive modeling', s.runId]}>
      <div className="mb-5 flex items-center gap-3">
        <SegmentedControl label="Model" value={id} onChange={(run) => setParams({ run }, { replace: true })} options={targetingModels} />
        <span className="text-[13px] text-ink3">Two models on the same customers. Each one is a run of its own.</span>
      </div>
      <RunHeader
        key={id}
        id={s.runId}
        summary={s.summary}
        setupTo={`/targeting/setup/${s.runId}`}
        compareTo={`/runs?a=${targetingRunIds[0]}&b=${targetingRunIds[1]}`}
        onInterpret={toInterpretation}
      />

      <div className="mt-8">
        <Layer n={1} title="Headline" note="The one thing to take away">
          <Headline>{s.headline}</Headline>
          <Stats className="mt-6" items={s.stats} />
        </Layer>

        <Layer n={2} title="Key results" note="Enough for most decisions">
          <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-4">
            <GainsChart s={s} />
            <div className="flex flex-col gap-4">
              <LiftChart s={s} />
              <ImportanceCard s={s} />
            </div>
          </div>
          <HitRateTrap s={s} />
        </Layer>

        <Layer n={3} title="What if" note="Change the numbers of the campaign">
          <WhatIf key={id} s={s} />
        </Layer>

        <Layer n={4} title="Details" note="Open what you need">
          <Accordion title={details.groups.title} note={details.groups.note} icon="table">
            <GroupsTable s={s} />
          </Accordion>
          {details.weights && (
            <Accordion title={details.weights.title} note={details.weights.note}>
              <WeightsTable weights={details.weights} />
            </Accordion>
          )}
          {details.rules && (
            <Accordion title={details.rules.title} note={details.rules.note}>
              <RulesTable rules={details.rules} />
            </Accordion>
          )}
          <Accordion title={details.models.title} note={details.models.note}>
            <ModelsTable s={s} />
            <HowToRead className="mt-4 max-w-[86ch]" lines={s.howToRead} />
          </Accordion>
        </Layer>

        <Layer n={5} title="Interpretation" note="Your reading first, then the coach" id={INTERPRETATION} last>
          <CoachCard key={id} script={s.coach} />
        </Layer>
      </div>
    </Page>
  )
}
