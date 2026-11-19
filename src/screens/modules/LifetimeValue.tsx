/**
 * Customer lifetime value (run LV-01, with LV-02 next to it): what a
 * subscriber is worth over the whole relationship, per segment, and whether
 * a new one is worth the cost of winning them.
 *
 * Retention rates, margins and values are the engine's. The what-if view
 * applies the engine's formula to other numbers in the browser
 * (src/lib/lifetimeValue.ts). The three segments are the ones of the survey,
 * so they keep their colours and shapes.
 */
import { useMemo, useState } from 'react'
import { CardHead, CoachCard, EngineSays, Headline, HowToRead, Slider, Stat, Stats, Trap } from '../../components/module'
import { Column, HoverColumns, HRule, Legend, Line, Mark, Plot } from '../../components/plot'
import { Layer, RunHeader } from '../../components/results'
import { Page } from '../../components/Shell'
import { Accordion, Button, Card, Marker, RunTag, Select, Tag } from '../../components/ui'
import { caseBrief, course, segments as surveySegments } from '../../data/alpineOat'
import type { SegmentId } from '../../data/alpineOat'
import { lifetimeValueScreen } from '../../data/lifetimeValue'
import type { RetentionGroup, SegmentValue } from '../../data/lifetimeValue'
import { cx } from '../../lib/demo'
import { chf, pct, signedPct, thousands } from '../../lib/format'
import { INTERPRETATION, useInterpretation } from '../../lib/interpretation'
import { expectedLifetime, lifetimeValue, paybackPeriods, periodValues } from '../../lib/lifetimeValue'
import type { Convention } from '../../lib/lifetimeValue'
import { chart, niceDomain, spread } from '../../lib/plot'

const s = lifetimeValueScreen

/** How a segment looks: the colour and shape it has on every screen. */
const look = (name: string) => surveySegments.find((segment) => segment.name === name)
const colorOf = (name: string) => look(name)?.color ?? chart.slate

function SegmentName({ name, className }: { name: string; className?: string }) {
  const segment = look(name)
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap font-semibold', className)}>
      {segment && <Marker segment={segment.id as SegmentId} />}
      {name}
    </span>
  )
}

/** A bar on a light track with its value in ink, inside a table cell. */
function ValueBar({ fraction, color, text }: { fraction: number; color: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-4 flex-1 rounded-[3px] bg-fill">
        <i className="bar-grow block h-4 rounded-r" style={{ width: `${Math.max(0, Math.min(1, fraction)) * 100}%`, background: color }} />
      </span>
      <span className="num w-[62px] whitespace-nowrap text-right font-bold">{text}</span>
    </div>
  )
}

// ---------------------------------------------------------------- key results

function ValueCard() {
  const largest = Math.max(...s.segments.flatMap((segment) => [segment.lifetime_value, segment.acquisition_cost]))
  return (
    <Card className="p-5">
      <CardHead title={s.valueChart.title} note={s.valueChart.note} />
      <div className="-mx-3 mt-2">
        <table className="tbl">
          <thead>
            <tr>
              <th>Segment</th>
              <th className="w-[204px]">A new subscriber is worth</th>
              <th className="w-[204px]">Costs to win</th>
              <th className="r">Net</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {s.segments.map((segment) => (
              <tr key={segment.segment}>
                <td>
                  <SegmentName name={segment.segment} />
                  <div className="text-[13px] text-ink3">
                    {pct(segment.retention_rate)} stay each year, margin {chf(segment.mean_margin, 0)} per year
                  </div>
                </td>
                <td tabIndex={0} data-tip={`${segment.segment}: an average new subscriber is worth ${chf(segment.lifetime_value)} in today's money, ${segment.margin_multiple.toFixed(1)} times the margin of one year`}>
                  <ValueBar fraction={segment.lifetime_value / largest} color={colorOf(segment.segment)} text={chf(segment.lifetime_value, 0)} />
                </td>
                <td tabIndex={0} data-tip={`${segment.segment}: winning one new subscriber costs ${chf(segment.acquisition_cost)}`}>
                  <ValueBar fraction={segment.acquisition_cost / largest} color={chart.slate3} text={chf(segment.acquisition_cost, 0)} />
                </td>
                <td className={cx('r whitespace-nowrap font-bold', !segment.worth_acquiring && 'text-danger')}>
                  {segment.net_value_of_a_new_customer < 0 ? '−' : '+'}
                  {chf(Math.abs(segment.net_value_of_a_new_customer), 0)}
                </td>
                <td className="w-[216px]">
                  {segment.worth_acquiring ? (
                    <Tag tone="ok" icon="check">
                      Paid back in year {segment.payback_periods}
                    </Tag>
                  ) : (
                    <Tag tone="warn" icon="alert">
                      Costs more than it is worth
                    </Tag>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/** One bar split by segment, with the shares printed inside. */
function ShareBar({ label, share }: { label: string; share: (segment: SegmentValue) => number }) {
  return (
    <div className="grid grid-cols-[132px_minmax(0,1fr)] items-center gap-3">
      <span className="text-[13px] font-semibold">{label}</span>
      <div className="flex h-7 gap-0.5">
        {s.segments.map((segment) => (
          <div
            key={segment.segment}
            tabIndex={0}
            data-tip={`${segment.segment}: ${pct(share(segment), 1)} ${label === 'Subscribers' ? 'of the subscribers' : 'of the customer equity'}`}
            className="bar-grow flex min-w-0 items-center rounded px-2 text-[12.5px] font-semibold text-white"
            style={{ flex: share(segment), background: colorOf(segment.segment) }}
          >
            {share(segment) >= 0.1 && pct(share(segment))}
          </div>
        ))}
      </div>
    </div>
  )
}

function EquityCard() {
  return (
    <Card className="p-5">
      <CardHead title={s.equityChart.title} note={s.equityChart.note} />
      <div className="mt-4 flex flex-col gap-2.5">
        <ShareBar label="Subscribers" share={(segment) => segment.share_of_customers} />
        <ShareBar label="Customer equity" share={(segment) => segment.share_of_equity} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 pl-[144px] text-[13px]">
        {s.segments.map((segment) => (
          <span key={segment.segment} className="inline-flex items-center gap-1.5">
            <SegmentName name={segment.segment} className="font-normal text-ink2" />
            <span className="num text-ink3">{chf(segment.customer_equity, 0)}</span>
          </span>
        ))}
      </div>
    </Card>
  )
}

function RetentionChart() {
  const { retentionChart, retention } = s
  const ages = retention.overall.by_age.from_period
  const groups: (RetentionGroup & { name: string; color: string; dashed: boolean })[] = [
    ...retention.segments.map((group) => ({ ...group, name: group.segment ?? '', color: colorOf(group.segment ?? ''), dashed: false })),
    { ...retention.overall, name: retentionChart.all, color: chart.slate, dashed: true },
  ]
  const all = groups.flatMap((group) => group.by_age.retention_rate)
  const { domain, ticks } = niceDomain(all, 5, Math.min(...all))
  return (
    <Card className="p-5">
      <CardHead title={retentionChart.title} note={retentionChart.note} />
      <Plot
        className="mt-3"
        height={300}
        x={[ages[0] + 0.6, ages[ages.length - 1] + 1.4]}
        y={domain}
        yTicks={ticks}
        xTicks={ages.map((age) => ({ value: age + 1, label: String(age + 1) }))}
        yFormat={(value) => pct(value)}
        yLabel={retentionChart.yLabel}
        xLabel={retentionChart.xLabel}
        label={`${retentionChart.title}: one line per segment, and one for all subscribers together.`}
        margin={{ right: 122 }}
      >
        {(frame) => {
          const last = ages.length - 1
          const ends = spread(groups.map((group) => frame.sy(group.by_age.retention_rate[last])))
          return (
            <>
              {groups.map((group) => (
                <Line
                  key={group.name}
                  points={group.by_age.retention_rate.map((rate, k) => [frame.sx(ages[k] + 1), frame.sy(rate)])}
                  color={group.color}
                  dashed={group.dashed}
                  width={group.dashed ? 2 : 2.5}
                />
              ))}
              {groups.map((group, i) => (
                <Mark key={group.name} x={frame.right + 10} y={ends[i] + 4} color={chart.ink} strong={!group.dashed}>
                  {group.name}
                </Mark>
              ))}
              <HoverColumns
                frame={frame}
                focusable
                items={ages.map((age, k) => ({
                  x: frame.sx(age + 1),
                  tip: `Year ${age + 1} as a subscriber\n${groups.map((group) => `${group.name}: ${pct(group.by_age.retention_rate[k], 1)} stay`).join('\n')}`,
                }))}
              />
            </>
          )
        }}
      </Plot>
      <Legend
        className="mt-2"
        items={[
          ...retention.segments.map((group) => ({ label: `${group.segment}, ${pct(group.retention_rate)} on average`, color: colorOf(group.segment ?? '') })),
          { label: `${retentionChart.all}, ${pct(retention.overall.retention_rate)}`, color: chart.slate, mark: 'dash' as const },
        ]}
      />
    </Card>
  )
}

function OneRateTrap() {
  const { trap } = s
  if (!trap) return null
  return (
    <Trap title={trap.title} className="mt-4">
      <p className="max-w-[94ch]">{trap.text}</p>
      <div className="-mx-3 mt-2">
        <table className="tbl tbl-tight text-[13px]">
          <thead>
            <tr>
              <th />
              <th colSpan={2} className="border-l border-line2">
                <span className="flex items-center gap-2">
                  One rate per segment <RunTag id={s.runId} />
                </span>
              </th>
              <th colSpan={2} className="border-l border-line2">
                <span className="flex items-center gap-2">
                  One rate for everyone <RunTag id={s.otherRunId} />
                </span>
              </th>
              <th className="r border-l border-line2">Cost to win</th>
              <th />
            </tr>
            <tr>
              <th>Segment</th>
              <th className="r border-l border-line2">Stay each year</th>
              <th className="r">New subscriber worth</th>
              <th className="r border-l border-line2">Stay each year</th>
              <th className="r">New subscriber worth</th>
              <th className="r border-l border-line2" />
              <th />
            </tr>
          </thead>
          <tbody>
            {trap.rows.map((row) => (
              <tr key={row.segment} className={row.flips ? 'bg-warn-t/60' : undefined}>
                <td>
                  <SegmentName name={row.segment} />
                </td>
                <td className="r border-l border-line2">{pct(row.own.retention_rate)}</td>
                <td className="r font-bold">{chf(row.own.lifetime_value, 0)}</td>
                <td className="r border-l border-line2 text-ink2">{pct(row.oneRate.retention_rate)}</td>
                <td className="r text-ink2">{chf(row.oneRate.lifetime_value, 0)}</td>
                <td className="r border-l border-line2">{chf(row.own.acquisition_cost, 0)}</td>
                <td className="w-[150px]">{row.flips && <Tag tone="warn">Looks worth winning</Tag>}</td>
              </tr>
            ))}
            <tr>
              <td className="font-semibold">Customer equity</td>
              <td className="border-l border-line2" />
              <td className="r font-bold">{chf(trap.equity.own, 0)}</td>
              <td className="border-l border-line2" />
              <td className="r text-ink2">{chf(trap.equity.oneRate, 0)}</td>
              <td className="border-l border-line2" />
              <td className="text-ink3">{signedPct(trap.equity.oneRate / trap.equity.own - 1)}</td>
            </tr>
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

function WhatIf() {
  const { whatIf } = s
  const first = whatIf.presets[whatIf.presets.length - 1]
  const [preset, setPreset] = useState(whatIf.presets.length - 1)
  const [margin, setMargin] = useState(first.margin)
  const [retention, setRetention] = useState(first.retention)
  const [discount, setDiscount] = useState(whatIf.discount)
  const [cost, setCost] = useState(first.cost)
  const [convention, setConvention] = useState<Convention>(s.convention)
  const start = whatIf.presets[preset]
  const changed = margin !== start.margin || retention !== start.retention || cost !== start.cost || discount !== whatIf.discount || convention !== s.convention

  const load = (index: number) => {
    const item = whatIf.presets[index]
    setPreset(index)
    setMargin(item.margin)
    setRetention(item.retention)
    setCost(item.cost)
    setDiscount(whatIf.discount)
    setConvention(s.convention)
  }

  const value = lifetimeValue(margin, retention, discount, convention)
  const years = useMemo(() => periodValues(margin, retention, discount, convention, whatIf.years), [margin, retention, discount, convention, whatIf.years])
  const payback = paybackPeriods(margin, retention, discount, convention, cost)
  const net = value - cost
  const { domain, ticks } = niceDomain([value, cost, ...years.map((year) => year.cumulative)], 5)
  const help = whatIf.conventions.find((item) => item.value === convention)!

  return (
    <Card>
      <div className="px-5 pt-4">
        <CardHead
          title={<span className="text-[16px]">{whatIf.title}</span>}
          note={whatIf.text}
          right={
            changed && (
              <Button variant="quiet" size="sm" onClick={() => load(preset)}>
                Reset to {start.name}
              </Button>
            )
          }
        />
      </div>
      <div className="grid grid-cols-[292px_minmax(0,1fr)] items-start gap-6 px-5 pb-5 pt-3">
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="t-lbl">Start from an average new subscriber</span>
            <Select className="mt-1" label="Start from an average new subscriber" value={preset} onChange={(v) => load(Number(v))} options={whatIf.presets.map((item, index) => ({ value: index, label: item.name }))} />
          </label>
          <Slider label="Margin per year" {...whatIf.ranges.margin} value={margin} onChange={setMargin} format={(v) => chf(v, 0)} />
          <Slider label="Retention rate per year" {...whatIf.ranges.retention} value={retention} onChange={setRetention} format={(v) => pct(v)} />
          <Slider label="Discount rate per year" {...whatIf.ranges.discount} value={discount} onChange={setDiscount} format={(v) => pct(v)} />
          <Slider label="Acquisition cost" {...whatIf.ranges.cost} value={cost} onChange={setCost} format={(v) => chf(v, 0)} />
          <div>
            <span className="t-lbl">When the margin is earned</span>
            <Select
              className="mt-1"
              label="When the margin is earned"
              value={convention}
              onChange={(v) => setConvention(v as Convention)}
              options={whatIf.conventions.map((item) => ({ value: item.value, label: item.label }))}
            />
            <span className="mt-1.5 block text-[12.5px] text-ink3">{help.text}</span>
          </div>
        </div>

        <div className="min-w-0">
          <Plot
            height={320}
            x={[0.4, whatIf.years + 0.6]}
            y={domain}
            yTicks={ticks}
            xTicks={years.map((year) => ({ value: year.period, label: String(year.period) }))}
            yFormat={(v) => thousands(v)}
            yLabel="CHF, in today's money"
            xLabel="Year of the subscription"
            label="What each year adds to the lifetime value, the running total, and the acquisition cost."
            margin={{ right: 16 }}
          >
            {(frame) => (
              <>
                {years.map((year) => (
                  <Column key={year.period} x={frame.sx(year.period)} y={frame.sy(year.presentValue)} base={frame.sy(0)} width={(frame.right - frame.left) / whatIf.years - 14} color={chart.slate3} />
                ))}
                <HRule y={frame.sy(cost)} left={frame.left} right={frame.right} color={chart.ink2} />
                <Mark x={frame.right} y={frame.sy(cost) + (cost > value ? -7 : 15)} anchor="end" color={chart.ink}>
                  Acquisition cost {chf(cost, 0)}
                </Mark>
                <Line points={years.map((year) => [frame.sx(year.period), frame.sy(year.cumulative)])} color={chart.primary} width={2.5} />
                {Number.isFinite(value) && (
                  <Mark x={frame.left + 8} y={frame.sy(value) + (cost > value ? 15 : -7)} color={chart.ink} strong>
                    Lifetime value {chf(value, 0)}
                  </Mark>
                )}
                {Number.isFinite(value) && <HRule y={frame.sy(value)} left={frame.left} right={frame.right} color={chart.primary} />}
                <HoverColumns
                  frame={frame}
                  focusable
                  items={years.map((year) => ({
                    x: frame.sx(year.period),
                    tip: `Year ${year.period}\n${pct(year.chance)} of the customers still pay\nThis year adds ${chf(year.presentValue, 0)}\nTotal so far: ${chf(year.cumulative, 0)}`,
                  }))}
                />
              </>
            )}
          </Plot>
          <Legend
            className="mt-2"
            items={[
              { label: 'Total so far', color: chart.primary },
              { label: 'What each year adds', color: chart.slate3, mark: 'bar' },
            ]}
          />
          <div className="mt-4 flex items-start gap-6 border-t border-line2 pt-4">
            <Stat className="flex-1" value={Number.isFinite(value) ? chf(value, 0) : 'No end'} label="lifetime value" note={`${(value / margin).toFixed(1)} times the margin of one year`} />
            <Stat
              className="flex-1"
              value={`${net < 0 ? '−' : '+'}${chf(Math.abs(net), 0)}`}
              label="value after the acquisition cost"
              note={net > 0 ? 'A new customer is worth winning' : 'A new customer costs more than they are worth'}
            />
            <Stat
              className="flex-1"
              value={payback === null ? 'Never' : payback === 0 ? 'At once' : `Year ${payback}`}
              label="the cost is paid back"
              note={`A customer stays ${expectedLifetime(retention).toFixed(1)} years on average`}
            />
          </div>
          <HowToRead className="mt-4" lines={whatIf.howToRead} />
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- details

function CohortTable() {
  const { cohorts } = s.details
  const ages = cohorts.rows[0].share_still_active.map((_, age) => age)
  return (
    <>
      <p className="mt-3 max-w-[86ch] text-[13.5px] text-ink2">{cohorts.text}</p>
      <table className="tbl tbl-tight mt-2">
        <thead>
          <tr>
            <th>Joined in</th>
            <th className="r">Subscribers at the start</th>
            {ages.slice(1).map((age) => (
              <th key={age} className="r">
                After {age} {age === 1 ? 'year' : 'years'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.rows.map((row) => (
            <tr key={row.cohort}>
              <td className="font-semibold">{row.cohort}</td>
              <td className="r">{thousands(row.started)}</td>
              {row.share_still_active.slice(1).map((share, k) =>
                share === null ? (
                  <td key={k} />
                ) : (
                  <td key={k} className="r p-1" tabIndex={0} data-tip={`Intake of ${row.cohort}: ${thousands(row.still_active[k + 1] ?? 0)} of ${thousands(row.started)} are still subscribers after ${k + 1} ${k === 0 ? 'year' : 'years'}`}>
                    <span
                      className="block rounded px-2 py-1"
                      style={{ background: `color-mix(in srgb, ${chart.slate} ${Math.round(share * 62)}%, white)`, color: share > 0.45 ? '#fff' : chart.ink }}
                    >
                      {pct(share)}
                    </span>
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function RetentionTable() {
  return (
    <table className="tbl tbl-tight mt-2">
      <thead>
        <tr>
          <th>Group</th>
          <th className="r">Stay each year</th>
          <th className="r">Likely range</th>
          <th className="r">Years a subscriber stays</th>
          <th>The same rate at every age?</th>
        </tr>
      </thead>
      <tbody>
        {s.details.retention.rows.map((group) => (
          <tr key={group.segment ?? 'all'}>
            <td>{group.segment ? <SegmentName name={group.segment} /> : <span className="font-semibold">All subscribers</span>}</td>
            <td className="r font-bold">{pct(group.retention_rate, 1)}</td>
            <td className="r text-ink2">
              {pct(group.retention_rate - 1.96 * group.standard_error, 1)} to {pct(group.retention_rate + 1.96 * group.standard_error, 1)}
            </td>
            <td className="r">{group.expected_lifetime.toFixed(1)}</td>
            <td>{group.same_rate_at_every_age.constant ? <Tag tone="ok">Yes</Tag> : <Tag tone="warn">No: it changes with age</Tag>}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ValuesTable() {
  return (
    <table className="tbl tbl-tight mt-2">
      <thead>
        <tr>
          <th>Segment</th>
          <th className="r">Subscribers</th>
          <th className="r">Margin per year</th>
          <th className="r">Stay each year</th>
          <th className="r">Times the margin</th>
          <th className="r">Lifetime value</th>
          <th className="r">Cost to win</th>
          <th className="r">Worth per franc of cost</th>
          <th className="r">Customer equity</th>
        </tr>
      </thead>
      <tbody>
        {s.segments.map((segment) => (
          <tr key={segment.segment}>
            <td>
              <SegmentName name={segment.segment} />
            </td>
            <td className="r">{thousands(segment.n_customers)}</td>
            <td className="r">{chf(segment.mean_margin, 0)}</td>
            <td className="r">{pct(segment.retention_rate, 1)}</td>
            <td className="r">{segment.margin_multiple.toFixed(2)}</td>
            <td className="r font-bold">{chf(segment.lifetime_value, 0)}</td>
            <td className="r">{chf(segment.acquisition_cost, 0)}</td>
            <td className={cx('r', segment.value_to_cost_ratio < 1 && 'font-bold text-danger')}>{segment.value_to_cost_ratio.toFixed(2)}</td>
            <td className="r">{chf(segment.customer_equity, 0)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ConventionsTable() {
  const { conventions } = s.details
  return (
    <>
      <table className="tbl tbl-tight mt-2">
        <thead>
          <tr>
            <th>Lifetime value of a new subscriber, margin earned</th>
            {conventions.labels.map((label, i) => (
              <th key={label} className="r whitespace-normal">
                {label.toLowerCase()}
                <span className="num block font-normal">{conventions.formulas[i]}</span>
              </th>
            ))}
            <th className="r">Cost to win</th>
          </tr>
        </thead>
        <tbody>
          {conventions.rows.map((row) => (
            <tr key={row.segment}>
              <td>
                <SegmentName name={row.segment} />
              </td>
              {row.values.map((item) => (
                <td key={item.convention} className={cx('r', item.convention === s.convention && 'font-bold', !item.worth && 'text-danger')}>
                  {chf(item.value, 0)}
                </td>
              ))}
              <td className="r text-ink2">{chf(row.cost, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 max-w-[86ch] text-[13.5px] text-ink2">
        {conventions.text} In the formulas, r is the retention rate and d the discount rate. A value in red is below the cost to win.
      </p>
    </>
  )
}

// ---------------------------------------------------------------- screen

export default function LifetimeValue() {
  const toInterpretation = useInterpretation()
  const { details } = s
  return (
    <Page crumbs={[course.name, caseBrief.name, 'Customer lifetime value', s.runId]}>
      <RunHeader id={s.runId} summary={s.summary} setupTo={`/lifetime-value/setup/${s.runId}`} compareTo={`/runs?a=${s.runId}&b=${s.otherRunId}`} onInterpret={toInterpretation} />

      <div className="mt-8">
        <Layer n={1} title="Headline" note="The one thing to take away">
          <Headline>{s.headline}</Headline>
          <Stats className="mt-6" items={s.stats} />
        </Layer>

        <Layer n={2} title="Key results" note="Enough for most decisions">
          <ValueCard />
          <div className="mt-4 grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-start gap-4">
            <RetentionChart />
            <EquityCard />
          </div>
          <OneRateTrap />
        </Layer>

        <Layer n={3} title="What if" note="The formula, one number at a time">
          <WhatIf />
        </Layer>

        <Layer n={4} title="Details" note="Open what you need">
          <Accordion title={details.cohorts.title} note={details.cohorts.note} icon="table">
            <CohortTable />
          </Accordion>
          <Accordion title={details.retention.title} note={details.retention.note}>
            <RetentionTable />
            <HowToRead className="mt-4 max-w-[86ch]" lines={s.howToRead.slice(0, 2)} />
          </Accordion>
          <Accordion title={details.values.title} note={details.values.note}>
            <ValuesTable />
            <HowToRead className="mt-4 max-w-[86ch]" lines={s.howToRead.slice(2)} />
          </Accordion>
          <Accordion title={details.conventions.title} note={details.conventions.note}>
            <ConventionsTable />
          </Accordion>
        </Layer>

        <Layer n={5} title="Interpretation" note="Your reading first, then the coach" id={INTERPRETATION} last>
          <CoachCard script={s.coach} />
        </Layer>
      </div>
    </Page>
  )
}
