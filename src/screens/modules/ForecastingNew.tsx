/**
 * Forecasting, new product: the Bass model on the first subscribers of the
 * Alpine Oat Home subscription (run FC-01).
 *
 * The estimate is the engine's. The what-if view draws the curve for other
 * values of p, q and m in the browser, with the engine's formula
 * (src/lib/forecasting.ts).
 */
import { useMemo, useState } from 'react'
import { CardHead, CoachCard, EngineSays, EngineWarnings, Headline, HowToRead, ModuleTabs, Slider, Stat, Stats, Trap } from '../../components/module'
import { Dot, HoverColumns, HRule, Legend, Line, Mark, Plot, VRule } from '../../components/plot'
import type { Frame, Tick } from '../../components/plot'
import { Layer, RunHeader } from '../../components/results'
import { Page } from '../../components/Shell'
import { Accordion, Button, Card, RunTag, Select, Tag } from '../../components/ui'
import { caseBrief, course } from '../../data/alpineOat'
import { bassScreen, forecastingTabs, quarterLabel } from '../../data/forecasting'
import type { BassParameters } from '../../data/forecasting'
import { cx } from '../../lib/demo'
import { bassCurve, bassPeak, runningTotal } from '../../lib/forecasting'
import { pct, roughly, signedPct, thousands } from '../../lib/format'
import { INTERPRETATION, useInterpretation } from '../../lib/interpretation'
import { chart, niceDomain, spread } from '../../lib/plot'

const s = bassScreen
const n = s.labels.length
/** Period numbers 1 to n, and a tick on the first quarter of every year. */
const periods = s.labels.map((_, i) => i + 1)
const yearTicks: Tick[] = periods.filter((period) => s.labels[period - 1].endsWith('Q1')).map((period) => ({ value: period, label: s.labels[period - 1] }))
const X: [number, number] = [0.4, n + 0.6]

/** The pixels of a series over the given periods (1-based, inclusive). */
const trace = (frame: Frame, values: (number | null)[], from = 1, to = values.length): ([number, number] | null)[] =>
  values.slice(from - 1, to).map((value, i) => (value === null ? null : [frame.sx(from + i), frame.sy(value)]))

// ---------------------------------------------------------------- key results

function SalesChart() {
  const { domain, ticks } = niceDomain([...s.fitted, ...s.observed.map((value) => value ?? 0)])
  return (
    <Card className="p-5">
      <CardHead title={s.salesChart.title} note={s.salesChart.note} />
      <Plot
        className="mt-3"
        height={290}
        x={X}
        y={domain}
        yTicks={ticks}
        xTicks={yearTicks}
        yFormat={(value) => thousands(value)}
        yLabel={s.salesChart.yLabel}
        label={`${s.salesChart.title}. The Bass curve peaks in ${s.peak.label}.`}
        margin={{ top: 50 }}
      >
        {(frame) => (
          <>
            <VRule x={frame.sx(s.peak.period)} top={frame.sy(s.fitted[s.peak.period - 1]) - 20} bottom={frame.bottom} />
            <Line points={trace(frame, s.fitted, 1, s.nObserved)} color={chart.slate} />
            <Line points={trace(frame, s.fitted, s.nObserved, n)} color={chart.slate} dashed />
            {s.observed.map((value, i) => value !== null && <Dot key={i} x={frame.sx(i + 1)} y={frame.sy(value)} color={chart.ink} />)}
            <Mark x={frame.sx(s.peak.period)} y={frame.sy(s.fitted[s.peak.period - 1]) - 26} anchor="middle" strong color={chart.ink}>
              Peak: {s.peak.label}
            </Mark>
            <HoverColumns
              frame={frame}
              items={periods.map((period) => {
                const observed = s.observed[period - 1]
                return {
                  x: frame.sx(period),
                  tip:
                    observed === null
                      ? `${s.labels[period - 1]}\nForecast: ${thousands(s.fitted[period - 1])} households`
                      : `${s.labels[period - 1]}\nSales: ${thousands(observed)} households\nBass curve: ${thousands(s.fitted[period - 1])}`,
                }
              })}
            />
          </>
        )}
      </Plot>
      <Legend
        className="mt-2"
        items={[
          { label: 'Sales so far', color: chart.ink, mark: 'dot' },
          { label: 'Bass curve', color: chart.slate },
          { label: 'Forecast', color: chart.slate, mark: 'dash' },
        ]}
      />
    </Card>
  )
}

function TotalChart() {
  const { domain, ticks } = niceDomain([s.parameters.m, ...s.cumulativeFitted], 4)
  return (
    <Card className="p-5">
      <CardHead title={s.totalChart.title} note={s.totalChart.note} />
      <Plot
        className="mt-3"
        height={290}
        x={X}
        y={domain}
        yTicks={ticks}
        xTicks={yearTicks.filter((_, i) => i % 2 === 0)}
        yFormat={(value) => thousands(value)}
        yLabel={s.totalChart.yLabel}
        label={`${s.totalChart.title}. ${s.totalChart.potentialLabel}.`}
        margin={{ left: 54, top: 50 }}
      >
        {(frame) => (
          <>
            <HRule y={frame.sy(s.parameters.m)} left={frame.left} right={frame.right} />
            <Mark x={frame.right} y={frame.sy(s.parameters.m) - 8} anchor="end" color={chart.ink}>
              {s.totalChart.potentialLabel}
            </Mark>
            <Line points={trace(frame, s.cumulativeFitted, 1, s.nObserved)} color={chart.slate} />
            <Line points={trace(frame, s.cumulativeFitted, s.nObserved, n)} color={chart.slate} dashed />
            {s.cumulativeObserved.map((value, i) => value !== null && <Dot key={i} x={frame.sx(i + 1)} y={frame.sy(value)} r={3} color={chart.ink} />)}
            <HoverColumns
              frame={frame}
              items={periods.map((period) => {
                const observed = s.cumulativeObserved[period - 1]
                return {
                  x: frame.sx(period),
                  tip:
                    observed === null
                      ? `${s.labels[period - 1]}\nForecast: ${thousands(s.cumulativeFitted[period - 1])} households in total`
                      : `${s.labels[period - 1]}\nSubscribers so far: ${thousands(observed)}\nBass curve: ${thousands(s.cumulativeFitted[period - 1])}`,
                }
              })}
            />
          </>
        )}
      </Plot>
    </Card>
  )
}

/** The teaching trap: the forecast a manager would have made from the first quarters only. */
function EarlyForecasts() {
  const { early } = s
  const known = s.nObserved
  const observed = s.observed.slice(0, known) as number[]
  const { domain, ticks } = niceDomain(observed, 4)
  // One style per estimate. The one that found no market potential is marked as a problem.
  const styles = [chart.bad, chart.slate3, chart.slate2, chart.slate]
  const usable = early.rows.filter((row) => row.found)
  return (
    <Trap title={early.title}>
      <p className="max-w-[92ch]">{early.text}</p>
      <div className="mt-4 grid grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)] items-start gap-6">
        <div>
          <Plot
            height={250}
            x={[0.4, known + 0.6]}
            y={domain}
            yTicks={ticks}
            xTicks={yearTicks.filter((tick) => tick.value <= known)}
            yFormat={(value) => thousands(value)}
            yLabel={s.salesChart.yLabel}
            label="The Bass curve estimated from the first 4, 6, 8 and 12 quarters, against the sales that followed."
            margin={{ right: 78, top: 46 }}
          >
            {(frame) => {
              const ends = spread(usable.map((row) => frame.sy(row.fitted[known - 1])))
              return (
                <>
                  <defs>
                    <clipPath id="early-plot">
                      <rect x={frame.left} y={frame.top - 6} width={frame.right - frame.left + 4} height={frame.bottom - frame.top + 6} />
                    </clipPath>
                  </defs>
                  <g clipPath="url(#early-plot)">
                    {early.rows.map((row, i) => (
                      <g key={row.quarters}>
                        <Line points={trace(frame, row.fitted, 1, row.quarters)} color={styles[i]} />
                        <Line points={trace(frame, row.fitted, row.quarters, known)} color={styles[i]} dashed />
                      </g>
                    ))}
                  </g>
                  {observed.map((value, i) => (
                    <Dot key={i} x={frame.sx(i + 1)} y={frame.sy(value)} r={3} color={chart.ink} />
                  ))}
                  {usable.map((row, i) => (
                    <Mark key={row.quarters} x={frame.right + 8} y={ends[i] + 4} color={chart.ink2}>
                      {row.quarters} quarters
                    </Mark>
                  ))}
                  <Mark x={frame.sx(early.rows[0].quarters + 0.9)} y={frame.top - 8} color={chart.ink} strong>
                    {early.rows[0].quarters} quarters: leaves the chart
                  </Mark>
                  <HoverColumns
                    frame={frame}
                    items={observed.map((value, i) => ({
                      x: frame.sx(i + 1),
                      tip: `${s.labels[i]}\nSales: ${thousands(value)}\n${early.rows
                        .map((row) => `From ${row.quarters} quarters: ${thousands(row.fitted[i])}`)
                        .join('\n')}`,
                    }))}
                  />
                </>
              )
            }}
          </Plot>
          <p className="mt-1 text-[12.5px] text-ink3">{early.chartNote}</p>
        </div>

        <div className="-mx-3">
          <table className="tbl tbl-tight text-[13px] [&_td]:px-2.5 [&_th]:px-2.5">
            <thead>
              <tr>
                <th>Quarters used</th>
                <th className="r">Market potential</th>
                <th className="r whitespace-normal">Subscribers by {s.labels[known - 1]}</th>
                <th className="r">Off by</th>
              </tr>
            </thead>
            <tbody>
              {early.rows.map((row) => (
                <tr key={row.quarters}>
                  <td className="whitespace-nowrap">
                    <b className="font-semibold">{row.quarters}</b> <span className="text-ink3">to {row.until}</span>
                  </td>
                  <td className="r">
                    {row.found ? (
                      <span tabIndex={0} data-tip={row.range ? `Likely between ${roughly(row.range[0])} and ${roughly(row.range[1])}` : undefined}>
                        {thousands(row.m)}
                      </span>
                    ) : (
                      <Tag tone="warn">No limit found</Tag>
                    )}
                  </td>
                  <td className="r">{row.forecast === null ? `${thousands(early.actualTotal)}, as it was` : thousands(row.forecast)}</td>
                  <td className={cx('r', row.error !== null && Math.abs(row.error) > 0.5 && 'font-bold')}>{row.error === null ? '' : signedPct(row.error)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {early.engineSays && <EngineSays className="mx-3 mt-3">{early.engineSays}</EngineSays>}
        </div>
      </div>
    </Trap>
  )
}

// ---------------------------------------------------------------- what if

function WhatIf() {
  const { whatIf } = s
  const estimate = s.parameters
  const [values, setValues] = useState<BassParameters>(estimate)
  const [preset, setPreset] = useState(0)
  const changed = values.p !== estimate.p || values.q !== estimate.q || values.m !== estimate.m

  const own = useMemo(() => bassCurve(values, whatIf.nPeriods), [values, whatIf.nPeriods])
  const peak = bassPeak(values)
  const estimatePeak = bassPeak(estimate)
  const total = runningTotal(own)[own.length - 1]
  const { domain, ticks } = niceDomain([...s.fitted, ...own, ...s.observed.map((value) => value ?? 0)])
  const set = (part: Partial<BassParameters>) => {
    setValues((old) => ({ ...old, ...part }))
  }

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
                  setValues(estimate)
                  setPreset(0)
                }}
              >
                Reset to the estimate
              </Button>
            )
          }
        />
      </div>
      <div className="grid grid-cols-[292px_minmax(0,1fr)] items-start gap-6 px-5 pb-5 pt-3">
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="t-lbl">{whatIf.presetLabel}</span>
            <Select
              className="mt-1"
              label={whatIf.presetLabel}
              value={preset}
              onChange={(value) => {
                const index = Number(value)
                setPreset(index)
                set({ p: whatIf.presets[index].p, q: whatIf.presets[index].q })
              }}
              options={whatIf.presets.map((item, index) => ({ value: index, label: item.name }))}
            />
            <span className="mt-1 block text-[12.5px] text-ink3">{whatIf.presets[preset].description}</span>
          </label>
          <Slider
            label="Market potential (m)"
            {...whatIf.ranges.m}
            value={values.m}
            onChange={(m) => set({ m })}
            format={(value) => `${thousands(value)} households`}
          />
          <Slider label="Innovation (p), per quarter" {...whatIf.ranges.p} value={values.p} onChange={(p) => set({ p })} format={(value) => value.toFixed(3)} />
          <Slider label="Imitation (q), per quarter" {...whatIf.ranges.q} value={values.q} onChange={(q) => set({ q })} format={(value) => value.toFixed(2)} />
        </div>

        <div className="min-w-0">
          <Plot
            height={300}
            x={X}
            y={domain}
            yTicks={ticks}
            xTicks={yearTicks}
            yFormat={(value) => thousands(value)}
            yLabel={s.salesChart.yLabel}
            label="The Bass curve for the values on the left, next to the estimate of FC-01."
          >
            {(frame) => (
              <>
                <Line points={trace(frame, s.fitted)} color={chart.slate3} />
                <Line points={trace(frame, own)} color={chart.primary} />
                {s.observed.map((value, i) => value !== null && <Dot key={i} x={frame.sx(i + 1)} y={frame.sy(value)} r={3} color={chart.ink} />)}
                <HoverColumns
                  frame={frame}
                  items={periods.map((period) => ({
                    x: frame.sx(period),
                    tip: `${s.labels[period - 1]}\nYour values: ${thousands(own[period - 1])}\nEstimate of FC-01: ${thousands(s.fitted[period - 1])}`,
                  }))}
                />
              </>
            )}
          </Plot>
          <Legend
            className="mt-2"
            items={[
              { label: 'Your values', color: chart.primary },
              { label: 'Estimate of FC-01', color: chart.slate3 },
              { label: 'Sales so far', color: chart.ink, mark: 'dot' },
            ]}
          />
          <div className="mt-4 flex items-start gap-6 border-t border-line2 pt-4">
            <Stat
              className="flex-1"
              value={quarterLabel(peak.period)}
              label="quarter with the most new subscribers"
              note={peak.period > whatIf.nPeriods ? 'After the end of the chart' : `FC-01: ${quarterLabel(estimatePeak.period)}`}
            />
            <Stat className="flex-1" value={thousands(peak.sales)} label="new subscribers in that quarter" note={`FC-01: ${thousands(estimatePeak.sales)}`} />
            <Stat
              className="flex-1"
              value={thousands(total)}
              label={`subscribers by ${s.labels[n - 1]}`}
              note={`${pct(total / values.m)} of a potential of ${thousands(values.m)}`}
            />
          </div>
        </div>
      </div>
      <p className="border-t border-line2 px-5 py-3 text-[12.5px] text-ink3">{whatIf.analogyNote}</p>
    </Card>
  )
}

// ---------------------------------------------------------------- details

function QuarterTable() {
  return (
    <table className="tbl tbl-tight mt-2">
      <thead>
        <tr>
          <th>Quarter</th>
          <th className="r">Sales</th>
          <th className="r">Bass curve</th>
          <th className="r">Subscribers so far</th>
          <th className="r">Bass curve, total</th>
        </tr>
      </thead>
      <tbody>
        {s.labels.map((label, i) => (
          <tr key={label} className={s.observed[i] === null ? 'text-ink2' : undefined}>
            <td className="font-semibold">
              {label}
              {i === s.nObserved && <span className="ml-2 font-normal text-ink3">forecast from here</span>}
            </td>
            <td className="r">{s.observed[i] === null ? '' : thousands(s.observed[i] as number)}</td>
            <td className="r">{thousands(s.fitted[i])}</td>
            <td className="r">{s.cumulativeObserved[i] === null ? '' : thousands(s.cumulativeObserved[i] as number)}</td>
            <td className="r">{thousands(s.cumulativeFitted[i])}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ScenarioTable() {
  return (
    <table className="tbl tbl-tight mt-2">
      <thead>
        <tr>
          <th>Scenario</th>
          <th className="r">p</th>
          <th className="r">q</th>
          <th className="r">m</th>
          <th>Quarter of the peak</th>
          <th className="r">Sales at the peak</th>
          <th className="r">{s.details.scenarios.endLabel}</th>
        </tr>
      </thead>
      <tbody>
        {s.whatIf.sensitivity.map((row) => (
          <tr key={row.scenario}>
            <td className="font-semibold">{row.scenario}</td>
            <td className={cx('r', row.changed === 'p' && 'font-bold')}>{row.p.toFixed(4)}</td>
            <td className={cx('r', row.changed === 'q' && 'font-bold')}>{row.q.toFixed(3)}</td>
            <td className={cx('r', row.changed === 'm' && 'font-bold')}>{thousands(row.m)}</td>
            <td>{quarterLabel(row.peak_period)}</td>
            <td className="r">{thousands(row.peak_sales)}</td>
            <td className="r">{thousands(row.cumulative_at_end)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ---------------------------------------------------------------- screen

export default function ForecastingNew() {
  const { details } = s
  const toInterpretation = useInterpretation()
  return (
    <Page crumbs={[course.name, caseBrief.name, 'Forecasting', s.runId]}>
      <ModuleTabs tabs={forecastingTabs} label="Forecasting screens" />
      <RunHeader
        id={s.runId}
        summary={s.summary}
        setupTo={`/forecasting/setup/${s.runId}`}
        compareTo={`/runs?a=${s.runId}`}
        onInterpret={toInterpretation}
      />

      <div className="mt-8">
        <Layer n={1} title="Headline" note="The one thing to take away">
          <Headline>{s.headline}</Headline>
          <Stats className="mt-6" items={s.stats} />
          <EngineWarnings className="mt-4" warnings={s.warnings} />
        </Layer>

        <Layer n={2} title="Key results" note="Enough for most decisions">
          <div className="grid grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] items-start gap-4">
            <SalesChart />
            <TotalChart />
          </div>
          <div className="mt-4">
            <EarlyForecasts />
          </div>
        </Layer>

        <Layer n={3} title="What if" note="Change a number and watch the curve">
          <WhatIf />
        </Layer>

        <Layer n={4} title="Details" note="Open what you need">
          <Accordion title={details.table.title} note={details.table.note} icon="table">
            <QuarterTable />
          </Accordion>
          <Accordion title={details.scenarios.title} note={details.scenarios.note}>
            <ScenarioTable />
          </Accordion>
          <Accordion title={details.methods.title} note={details.methods.note}>
            <table className="tbl tbl-tight mt-2">
              <thead>
                <tr>
                  <th>Method</th>
                  <th className="r">p</th>
                  <th className="r">q</th>
                  <th className="r">m</th>
                  <th className="r">Ups and downs explained</th>
                </tr>
              </thead>
              <tbody>
                {details.methods.rows.map((row) => (
                  <tr key={row.name}>
                    <td className="font-semibold">
                      {row.name}
                      {row.run && <RunTag id={row.run} className="ml-2.5" />}
                    </td>
                    <td className="r">{row.p}</td>
                    <td className="r">{row.q}</td>
                    <td className="r">{row.m}</td>
                    <td className="r">{row.fit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 max-w-[86ch] text-[13.5px] text-ink2">{details.methods.text}</p>
          </Accordion>
          <Accordion title={details.fit.title} note={details.fit.note}>
            <p className="mt-3 max-w-[86ch] text-[13.5px] text-ink2">{details.fit.body}</p>
            <HowToRead className="mt-4 max-w-[86ch]" lines={[...s.howToRead, ...s.early.howToRead]} />
          </Accordion>
        </Layer>

        <Layer n={5} title="Interpretation" note="Your reading first, then the coach" id={INTERPRETATION} last>
          <CoachCard script={s.coach} />
        </Layer>
      </div>
    </Page>
  )
}
