/**
 * Forecasting, existing product: four methods compared on the last 12 months
 * of a sales series, and the forecast of the method that did best
 * (runs FC-02 to FC-04, one per series). Everything on this screen was
 * calculated by the engine. The switch at the top changes the series.
 */
import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TrackBarChart } from '../../components/charts'
import { CardHead, EngineSays, EngineWarnings, Headline, HowToRead, ModuleTabs, Stat, Trap } from '../../components/module'
import { Column, Dot, HoverColumns, Legend, Line, Mark, Plot, VRule } from '../../components/plot'
import { Layer, RunHeader } from '../../components/results'
import { Page } from '../../components/Shell'
import { Accordion, Card, RunTag, SegmentedControl, Tag } from '../../components/ui'
import { caseBrief, course } from '../../data/alpineOat'
import { forecastingTabs, narrowWins, seriesRunIds, seriesScreen } from '../../data/forecasting'
import type { SeriesRunId } from '../../data/forecasting'
import { cx } from '../../lib/demo'
import { fixed, monthName, pct, signedPct, thousands } from '../../lib/format'
import { chart, niceDomain, spread } from '../../lib/plot'

type Screen = ReturnType<typeof seriesScreen>

const seriesOptions = seriesRunIds.map((id) => ({ value: id, label: seriesScreen(id).series }))
const one = (value: number) => thousands(value, 1)

// ---------------------------------------------------------------- the test on the months kept aside

function TestChart({ s }: { s: Screen }) {
  const { test } = s
  const months = test.labels.length
  // The months just before the test give the eye something to hold on to.
  const before = s.forecast.observed.slice(s.nTraining - test.context, s.nTraining) as number[]
  const beforeLabels = s.forecast.labels.slice(s.nTraining - test.context, s.nTraining)
  const observed = [...before, ...test.observed]
  const labels = [...beforeLabels, ...test.labels]
  const all = [...observed, ...s.methods.flatMap((method) => method.forecast_of_holdout)]
  const { domain, ticks } = niceDomain(all, 5, Math.min(...all))
  const first = test.context + 1

  return (
    <Card className="p-5">
      <CardHead title={test.title} note={test.note} />
      <Plot
        className="mt-3"
        height={300}
        x={[0.5, observed.length + 0.5]}
        y={domain}
        yTicks={ticks}
        xTicks={labels.map((label, i) => ({ value: i + 1, label: monthName(label) })).filter((_, i) => i % 6 === 0)}
        yFormat={(value) => thousands(value)}
        yLabel={`Sales, ${s.unit}`}
        label={`${test.title}: sales and the forecast of each method. ${s.best.label} was closest.`}
        margin={{ right: 150 }}
      >
        {(frame) => {
          const ends = spread(s.methods.map((method) => frame.sy(method.forecast_of_holdout[months - 1])))
          return (
            <>
              <VRule x={frame.sx(first - 0.5)} top={frame.top} bottom={frame.bottom} />
              <Mark x={frame.sx(first - 0.5) + 6} y={frame.top + 10}>
                kept aside
              </Mark>
              {s.methods.map((method) => {
                const best = method.method === s.best.method
                return (
                  <Line
                    key={method.method}
                    points={method.forecast_of_holdout.map((value, i) => [frame.sx(first + i), frame.sy(value)])}
                    color={best ? chart.primary : chart.slate2}
                    width={best ? 2.5 : 1.5}
                  />
                )
              })}
              <Line points={observed.map((value, i) => [frame.sx(i + 1), frame.sy(value)])} color={chart.ink} width={1.5} />
              {observed.map((value, i) => (
                <Dot key={i} x={frame.sx(i + 1)} y={frame.sy(value)} r={2.5} color={chart.ink} />
              ))}
              {s.methods.map((method, i) => {
                const best = method.method === s.best.method
                return (
                  <g key={method.method}>
                    <path
                      d={`M${frame.right + 3} ${frame.sy(method.forecast_of_holdout[months - 1])}L${frame.right + 9} ${ends[i]}`}
                      stroke={best ? chart.primary : chart.slate2}
                      fill="none"
                    />
                    <Mark x={frame.right + 12} y={ends[i] + 4} strong={best} color={best ? chart.ink : chart.ink2}>
                      {method.short}
                    </Mark>
                  </g>
                )
              })}
              <HoverColumns
                frame={frame}
                items={observed.map((value, i) => ({
                  x: frame.sx(i + 1),
                  tip:
                    i < test.context
                      ? `${monthName(labels[i])}\nSales: ${one(value)}`
                      : `${monthName(labels[i])}\nSales: ${one(value)}\n${s.methods
                          .map((method) => `${method.short}: ${one(method.forecast_of_holdout[i - test.context])}`)
                          .join('\n')}`,
                }))}
              />
            </>
          )
        }}
      </Plot>
      <Legend
        className="mt-2"
        items={[
          { label: 'Sales', color: chart.ink, mark: 'dot' },
          { label: `Best method: ${s.best.label.toLowerCase()}`, color: chart.primary },
          { label: 'The other methods', color: chart.slate2 },
        ]}
      />
    </Card>
  )
}

function ErrorBars({ s }: { s: Screen }) {
  const largest = Math.max(...s.methods.map((method) => method.holdout.mae))
  return (
    <Card className="p-5">
      <CardHead title={s.errors.title} note={s.errors.note} />
      <div className="mt-3">
        <TrackBarChart
          max={largest * 1.05}
          labelWidth={150}
          valueWidth={36}
          rows={s.order.map((method) => ({
            label: s.methods.find((item) => item.method === method.method)!.short,
            value: method.holdout.mae,
            color: method.rank === 1 ? chart.primary : chart.slate,
            text: one(method.holdout.mae),
            tip: `${method.label}: off by ${one(method.holdout.mae)} ${s.unit} a month, or ${pct(method.holdout.mape, 1)} of sales`,
          }))}
        />
      </div>
      <HowToRead className="mt-4" lines={s.howToRead.slice(0, 1)} />
    </Card>
  )
}

// ---------------------------------------------------------------- the forecast

const monthLetters = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']

function SeasonChart({ values, unit }: { values: number[]; unit: string }) {
  const { domain, ticks } = niceDomain(values, 4)
  return (
    <Plot
      height={150}
      x={[0.3, values.length + 0.7]}
      y={domain}
      yTicks={ticks}
      xTicks={values.map((_, i) => ({ value: i + 1, label: monthLetters[i] ?? String(i + 1) }))}
      yFormat={(value) => fixed(value, 0)}
      label="The seasonal pattern: what each calendar month adds to or takes from the level."
      margin={{ left: 34, right: 4 }}
    >
      {(frame) => (
        <>
          {values.map((value, i) => (
            <Column
              key={i}
              x={frame.sx(i + 1)}
              y={frame.sy(value)}
              base={frame.sy(0)}
              width={(frame.right - frame.left) / values.length - 4}
              color={chart.slate}
              tip={`${monthName(`2026-${String(i + 1).padStart(2, '0')}`).slice(0, 3)}: ${value < 0 ? '−' : '+'}${one(Math.abs(value))} ${unit}`}
            />
          ))}
        </>
      )}
    </Plot>
  )
}

function ForecastCard({ s }: { s: Screen }) {
  const { forecast } = s
  const total = forecast.labels.length
  const values = forecast.labels.map((_, i) => forecast.observed[i] ?? forecast.fitted[i] ?? 0)
  const { domain, ticks } = niceDomain(values, 5, Math.min(...values))
  const firstForecast = forecast.firstForecast
  return (
    <Card className="mt-4">
      <div className="grid grid-cols-[minmax(0,1fr)_288px]">
        <div className="min-w-0 p-5">
          <CardHead title={forecast.title} note={forecast.note} />
          <Plot
            className="mt-3"
            height={280}
            x={[0.5, total + 0.5]}
            y={domain}
            yTicks={ticks}
            xTicks={forecast.labels.map((label, i) => ({ value: i + 1, label: label.slice(0, 4) })).filter((_, i) => forecast.labels[i].endsWith('-01'))}
            yFormat={(value) => thousands(value)}
            yLabel={`Sales, ${s.unit}`}
            label={`${forecast.title}: ${s.series}, sales so far and the forecast from ${forecast.from} to ${forecast.to}.`}
          >
            {(frame) => (
              <>
                <Line points={forecast.observed.slice(0, firstForecast).map((value, i) => [frame.sx(i + 1), frame.sy(value as number)])} color={chart.ink} width={1.5} />
                <Line
                  points={[
                    [frame.sx(firstForecast), frame.sy(forecast.observed[firstForecast - 1] as number)],
                    ...forecast.fitted.slice(firstForecast).map((value, i): [number, number] => [frame.sx(firstForecast + i + 1), frame.sy(value as number)]),
                  ]}
                  color={chart.primary}
                  dashed
                />
                <Mark x={frame.sx(firstForecast + 1)} y={frame.top + 10} color={chart.ink}>
                  Forecast
                </Mark>
                <VRule x={frame.sx(firstForecast + 0.5)} top={frame.top} bottom={frame.bottom} />
                <HoverColumns
                  frame={frame}
                  items={forecast.labels.map((label, i) => ({
                    x: frame.sx(i + 1),
                    tip: i < firstForecast ? `${monthName(label)}\nSales: ${one(forecast.observed[i] as number)}` : `${monthName(label)}\nForecast: ${one(forecast.fitted[i] as number)}`,
                  }))}
                />
              </>
            )}
          </Plot>
          <Legend
            className="mt-2"
            items={[
              { label: 'Sales so far', color: chart.ink },
              { label: 'Forecast', color: chart.primary, mark: 'dash' },
            ]}
          />
        </div>
        <div className="border-l border-line2 p-5">
          <Stat
            value={thousands(forecast.total)}
            label={`${s.unit}, ${forecast.from} to ${forecast.to}`}
            note={`${signedPct(forecast.change)} against the 12 months before (${thousands(forecast.before)})`}
          />
          {s.seasonal && (
            <>
              <p className="t-lbl mt-5">Seasonal pattern, {s.unit}</p>
              <SeasonChart values={s.seasonal} unit={s.unit} />
            </>
          )}
          <p className="t-lbl mt-4">Smoothing weights</p>
          <p className="mt-1 text-[13px] text-ink2">{s.weightsNote}</p>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- the trap, across the three series

function NarrowWins({ current }: { current: SeriesRunId }) {
  return (
    <Trap title={narrowWins.title} className="mt-4">
      <p className="max-w-[92ch]">{narrowWins.text}</p>
      <div className="-mx-3 mt-2">
        <table className="tbl tbl-tight text-[13px]">
          <thead>
            <tr>
              <th>Series</th>
              <th>Best method</th>
              <th className="r">Off by</th>
              <th>Next best</th>
              <th className="r">Off by</th>
              <th className="r">Lead</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {narrowWins.rows.map((row) => (
              <tr key={row.runId} className={row.runId === current ? 'bg-primary-t' : undefined}>
                <td className="whitespace-nowrap">
                  <Link to={`/forecasting/existing-product?run=${row.runId}`} className="rounded hover:underline">
                    <RunTag id={row.runId} label={row.series} />
                  </Link>
                </td>
                <td>{row.best}</td>
                <td className="r">{thousands(row.bestError, 2)}</td>
                <td className="text-ink2">{row.second}</td>
                <td className="r text-ink2">{thousands(row.secondError, 2)}</td>
                <td className={cx('r', !row.narrow && 'font-bold')}>{pct(row.lead)}</td>
                <td className="w-[92px]">{row.narrow ? <Tag tone="warn">Narrow</Tag> : <Tag tone="ok">Clear</Tag>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-[12.5px] text-ink3">
        Off by: mean absolute error on the months kept aside, in {narrowWins.unit} a month. Lead: how much smaller the error of the best method is.
      </p>
      <EngineSays className="mt-3">{narrowWins.engineSays}</EngineSays>
    </Trap>
  )
}

// ---------------------------------------------------------------- details

function TestTable({ s }: { s: Screen }) {
  return (
    <table className="tbl tbl-tight mt-2">
      <thead>
        <tr>
          <th>Month kept aside</th>
          <th className="r">Sales</th>
          {s.methods.map((method) => (
            <th key={method.method} className="r">
              {method.short}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {s.test.labels.map((label, i) => (
          <tr key={label}>
            <td className="font-semibold">{monthName(label)}</td>
            <td className="r">{one(s.test.observed[i])}</td>
            {s.methods.map((method) => (
              <td key={method.method} className={cx('r', method.method === s.best.method ? 'font-bold' : 'text-ink2')}>
                {one(method.forecast_of_holdout[i])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const weightLabels: Record<string, string> = { window: 'months averaged', alpha: 'alpha', beta: 'beta', gamma: 'gamma' }

function MethodTable({ s }: { s: Screen }) {
  return (
    <table className="tbl tbl-tight mt-2">
      <thead>
        <tr>
          <th>Method</th>
          <th>Weights found on the first {s.nTraining} months</th>
          <th className="r">Off by, months kept aside</th>
          <th className="r">In percent</th>
          <th className="r">Off by, months it saw</th>
        </tr>
      </thead>
      <tbody>
        {s.order.map((method) => (
          <tr key={method.method}>
            <td className={cx('font-semibold', method.rank === 1 && 'text-ink')}>
              {method.rank}. {method.label}
            </td>
            <td className="num text-ink2">
              {Object.entries(method.parameters)
                .map(([name, value]) => `${weightLabels[name] ?? name} ${name === 'window' ? value : value.toFixed(2)}`)
                .join(', ')}
            </td>
            <td className="r">{thousands(method.holdout.mae, 2)}</td>
            <td className="r">{pct(method.holdout.mape, 1)}</td>
            <td className="r text-ink2">{thousands(method.in_sample.mae, 2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ---------------------------------------------------------------- screen

export default function ForecastingExisting() {
  const [params, setParams] = useSearchParams()
  const id: SeriesRunId = seriesRunIds.find((run) => run === params.get('run')) ?? seriesRunIds[0]
  const s = useMemo(() => seriesScreen(id), [id])

  return (
    <Page crumbs={[course.name, caseBrief.name, 'Forecasting', s.runId]}>
      <div className="flex items-start gap-4">
        <ModuleTabs tabs={forecastingTabs} label="Forecasting screens" />
        <span className="flex-1" />
        <span className="mt-[5px] text-[13px] text-ink2">Sales series</span>
        <SegmentedControl label="Sales series" value={id} onChange={(run) => setParams({ run }, { replace: true })} options={seriesOptions} />
      </div>
      <RunHeader key={id} id={s.runId} summary={s.summary} setupTo={`/forecasting/setup/${s.runId}`} compareTo={`/runs?a=${seriesRunIds[0]}&b=${id === seriesRunIds[0] ? seriesRunIds[1] : id}`} />

      <div className="mt-8">
        <Layer n={1} title="Headline" note="The one thing to take away">
          <Headline wide>{s.headline}</Headline>
          <EngineWarnings className="mt-4" warnings={s.warnings} />
        </Layer>

        <Layer n={2} title="Key results" note="Enough for most decisions">
          <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] items-start gap-4">
            <TestChart s={s} />
            <ErrorBars s={s} />
          </div>
          <ForecastCard s={s} />
          <NarrowWins current={id} />
        </Layer>

        <Layer n={3} title="Details" note="Open what you need" last>
          <Accordion title="The months kept aside as a table" note={`${s.test.labels.length} months, sales and the forecast of each method, in ${s.unit}`} icon="table">
            <TestTable s={s} />
          </Accordion>
          <Accordion title="Every method with its weights and errors" note="Ranked by the error on the months kept aside">
            <MethodTable s={s} />
            <HowToRead className="mt-4 max-w-[86ch]" lines={s.howToRead} />
          </Accordion>
        </Layer>
      </div>
    </Page>
  )
}
