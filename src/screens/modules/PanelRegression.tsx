/**
 * Panel regression (run PN-02, with PN-01 for the comparison of the three
 * models): what price, advertising and promotion do to sales in 40 stores
 * over two years.
 *
 * All three models are estimated by the engine. The what-if view only reads
 * the fitted models in the browser (src/lib/panel.ts).
 */
import { useState } from 'react'
import { CardHead, CoachCard, EngineSays, Headline, HowToRead, Slider, Stats, Trap } from '../../components/module'
import { Column, Dot, HoverColumns, Legend, Line, Mark, Plot, Shade, VRule } from '../../components/plot'
import { Layer, RunHeader } from '../../components/results'
import { Page } from '../../components/Shell'
import { Accordion, Card, Note, RunTag, Switch, Tag } from '../../components/ui'
import { caseBrief, course } from '../../data/alpineOat'
import { MODEL_KINDS, pValue, panelScreen, predictorName } from '../../data/panel'
import type { CoefficientRow, ModelKind } from '../../data/panel'
import { cx } from '../../lib/demo'
import { fixed, pct, signedPct, thousands } from '../../lib/format'
import { INTERPRETATION, useInterpretation } from '../../lib/interpretation'
import { changeBy, fading } from '../../lib/panel'
import { chart, linear, niceDomain, useWidth } from '../../lib/plot'

const s = panelScreen
const rowOf = (kind: ModelKind, variable: string) => s.models[kind].coefficients.find((row) => row.variable === variable) as CoefficientRow
const variables = s.models[s.recommended].coefficients.map((row) => row.variable)

// ---------------------------------------------------------------- key results: the recommended model

function FinalCard() {
  const { finalCard } = s
  return (
    <Card className="p-5">
      <CardHead title={finalCard.title} note={finalCard.note} />
      <div className="-mx-3 mt-2">
        <table className="tbl">
          <thead>
            <tr>
              <th>Predictor</th>
              <th className="r">Coefficient</th>
              <th className="r">95% range</th>
              <th>In plain words</th>
              <th className="r">p value</th>
            </tr>
          </thead>
          <tbody>
            {finalCard.rows.map((row) => (
              <tr key={row.variable}>
                <td>
                  <span className="font-semibold">{row.name}</span>
                  <div className="text-[12.5px] text-ink3">{row.term}</div>
                </td>
                <td className="r font-bold">{fixed(row.coefficient)}</td>
                <td className="r whitespace-nowrap text-ink2">
                  {fixed(row.lower_95)} to {fixed(row.upper_95)}
                </td>
                <td>{row.plain}</td>
                <td className="r whitespace-nowrap text-ink2">{pValue(row.p_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-6">
        <HowToRead lines={finalCard.howToRead} />
        <div>
          <p className="t-lbl">Two limits</p>
          {finalCard.limits.map((line, i) => (
            <p key={line} className={cx('text-[13px] text-ink2', i === 0 ? 'mt-1' : 'mt-2')}>
              {line}
            </p>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- key results: the trap

/** One predictor: the estimate of each model as a point with its 95% range, and a line at zero. */
function ModelsPanel({ variable }: { variable: string }) {
  const [box, width] = useWidth<HTMLDivElement>(420)
  const rows = MODEL_KINDS.map((kind) => ({ kind, label: s.models[kind].label, row: rowOf(kind, variable) }))
  const { domain, ticks } = niceDomain(rows.flatMap(({ row }) => [row.lower_95, row.upper_95]), 4)
  const left = 112
  const right = Math.max(left + 40, width - 52)
  const top = 4
  const step = 24
  const bottom = top + rows.length * step
  const sx = linear(domain[0], domain[1], left, right)
  const logged = rows[0].row.logged
  return (
    <div ref={box}>
      <p className="text-[13px]">
        <b className="font-semibold">{predictorName(variable)}</b> <span className="text-ink3">{logged ? 'elasticity' : 'coefficient'}</span>
      </p>
      <svg width={width} height={bottom + 22} role="img" aria-label={`${predictorName(variable)}: ${rows.map(({ label, row }) => `${label} ${fixed(row.coefficient)}`).join(', ')}.`} className="mt-1 block overflow-visible">
        {ticks.map((value) => (
          <g key={value}>
            <path d={`M${sx(value)} ${top}V${bottom}`} stroke={value === 0 ? chart.axis : chart.grid} />
            <text x={sx(value)} y={bottom + 15} textAnchor="middle" fontSize={12} fill={chart.ink3} style={{ fontVariantNumeric: 'tabular-nums' }}>
              {value === 0 ? '0' : fixed(value, Math.abs(domain[1] - domain[0]) < 1 ? 2 : 1)}
            </text>
          </g>
        ))}
        {rows.map(({ kind, label, row }, k) => {
          const y = top + step * k + step / 2
          const color = kind === s.recommended ? chart.primary : chart.slate
          return (
            <g key={kind} tabIndex={0} className="outline-none" data-tip={`${label}, ${predictorName(variable).toLowerCase()}\nCoefficient: ${fixed(row.coefficient, 3)}\n95% range: ${fixed(row.lower_95, 3)} to ${fixed(row.upper_95, 3)}`}>
              <rect x={0} y={y - step / 2} width={width} height={step} fill="transparent" />
              <text x={0} y={y} dy="0.32em" fontSize={12.5} fontWeight={kind === s.recommended ? 600 : 400} fill={chart.ink}>
                {label}
              </text>
              <path className="plot-fade" d={`M${sx(row.lower_95)} ${y}H${sx(row.upper_95)}`} stroke={color} strokeWidth={2} strokeLinecap="round" />
              <circle className="plot-dot" cx={sx(row.coefficient)} cy={y} r={5} fill={color} stroke="#fff" strokeWidth={2} />
              <text x={right + 8} y={y} dy="0.32em" fontSize={12.5} fontWeight={600} fill={chart.ink} style={{ fontVariantNumeric: 'tabular-nums' }}>
                {fixed(row.coefficient)}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

/** The stores on a chart of price and sales, both in logarithms: within a store sales fall steeply with the price, across the stores they do not. */
function StoresChart() {
  const within = rowOf('fixed_effects', s.pricePredictor).coefficient
  const pooled = rowOf('pooled', s.pricePredictor).coefficient
  const { overall } = s
  /** The line of one store: through its own average, with the slope of the fixed effects model. */
  const own = (store: (typeof s.stores)[number], price: number) => store.mean_log_sales + within * (Math.log(price) - store.mean_log_price)
  const ends = s.stores.flatMap((store) => [own(store, store.lowest_price), own(store, store.highest_price)])
  const y: [number, number] = [Math.min(...ends) - 0.08, Math.max(...ends) + 0.08]
  const x: [number, number] = [Math.log(overall.lowestPrice) - 0.02, Math.log(overall.highestPrice) + 0.02]
  const yTicks = [100, 150, 250, 500, 1000, 2000, 4000].filter((value) => Math.log(value) > y[0] && Math.log(value) < y[1]).map(Math.log)
  const xTicks = [1.5, 1.7, 1.9, 2.1, 2.3, 2.5, 2.7, 2.9, 3.1].filter((value) => Math.log(value) > x[0] && Math.log(value) < x[1]).map((value) => ({ value: Math.log(value), label: value.toFixed(2) }))
  const pooledAt = (price: number) => overall.meanLogSales + pooled * (Math.log(price) - overall.meanLogPrice)
  return (
    <>
      <Plot
        height={300}
        x={x}
        y={y}
        xTicks={xTicks}
        yTicks={yTicks}
        yFormat={(value) => thousands(Math.round(Math.exp(value)))}
        yLabel="Units sold per week"
        xLabel="Shelf price, CHF"
        label={`${s.trap.whyTitle}. Within a store the price elasticity is ${fixed(within)}. The pooled model sees ${fixed(pooled)}.`}
        fallbackWidth={440}
      >
        {(frame) => (
          <>
            {s.stores.map((store) => (
              <Line
                key={store.unit}
                points={[
                  [frame.sx(Math.log(store.lowest_price)), frame.sy(own(store, store.lowest_price))],
                  [frame.sx(Math.log(store.highest_price)), frame.sy(own(store, store.highest_price))],
                ]}
                color={chart.primary}
                width={1.5}
                opacity={0.38}
              />
            ))}
            <Line
              points={[
                [frame.sx(Math.log(overall.lowestPrice)), frame.sy(pooledAt(overall.lowestPrice))],
                [frame.sx(Math.log(overall.highestPrice)), frame.sy(pooledAt(overall.highestPrice))],
              ]}
              color={chart.ink}
              width={2.5}
            />
            {s.stores.map((store) => (
              <Dot
                key={store.unit}
                x={frame.sx(store.mean_log_price)}
                y={frame.sy(store.mean_log_sales)}
                r={2.5}
                color={chart.primary}
                tip={`Store ${store.unit}\nAverage price: CHF ${store.mean_price.toFixed(2)}\nAverage sales: ${thousands(store.mean_sales)} units a week\nIts prices: CHF ${store.lowest_price.toFixed(2)} to CHF ${store.highest_price.toFixed(2)}`}
              />
            ))}
          </>
        )}
      </Plot>
      <Legend
        className="mt-2"
        items={[
          { label: `One store, and how its sales follow its own price: ${fixed(within)}`, color: chart.primary, mark: 'dot' },
          { label: `All store weeks as if from one store: ${fixed(pooled)}`, color: chart.ink },
        ]}
      />
    </>
  )
}

function PooledTrap() {
  const { trap } = s
  return (
    <Trap title={trap.title} className="mt-4">
      <p className="max-w-[98ch]">{trap.text}</p>
      <div className="mt-4 grid grid-cols-[minmax(0,10fr)_minmax(0,11fr)] gap-8">
        <div>
          <div className="flex items-center gap-2.5">
            <h4 className="text-[13.5px] font-bold text-ink">{trap.chartTitle}</h4>
            <RunTag id={s.otherRunId} />
          </div>
          <p className="mt-0.5 text-[13px] text-ink3">{trap.chartNote}</p>
          <div className="mt-3 flex flex-col gap-4">
            {variables.map((variable) => (
              <ModelsPanel key={variable} variable={variable} />
            ))}
          </div>
        </div>
        <div>
          <h4 className="text-[13.5px] font-bold text-ink">{trap.whyTitle}</h4>
          <p className="mt-0.5 text-[13px] text-ink3">{trap.whyNote}</p>
          <div className="mt-2">
            <StoresChart />
          </div>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-4">
        {trap.tests.map((test) => (
          <div key={test.question} className="rounded-lg border border-line p-3.5">
            <p className="text-[13px] text-ink2">{test.question}</p>
            <p className="mt-0.5 text-[15px] font-bold text-ink">{test.answer}</p>
            <p className="num mt-1 text-[12.5px] text-ink3">{test.detail}</p>
            <p className="mt-1 text-[12.5px] text-ink3">{test.meaning}</p>
          </div>
        ))}
        <div className="rounded-lg border border-primary-l bg-primary-t p-3.5">
          <p className="text-[13px] text-primary-d">The engine recommends</p>
          <p className="mt-0.5 text-[15px] font-bold text-primary-d">{trap.recommended}</p>
          <p className="mt-1 text-[12.5px] text-ink2">{trap.reason}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {trap.engineSays.map((text) => (
          <EngineSays key={text}>{text}</EngineSays>
        ))}
      </div>
    </Trap>
  )
}

// ---------------------------------------------------------------- key results: carry-over

function CarryCard() {
  const { carryCard } = s
  const { tried } = carryCard
  const errors = niceDomain(tried.squared_error, 4, Math.min(...tried.squared_error))
  const parts = fading(carryCard.first, carryCard.rate, carryCard.periods)
  const effects = niceDomain(parts, 4)
  const bestError = tried.squared_error[tried.rate.findIndex((rate) => Math.abs(rate - carryCard.rate) < 1e-9)]
  return (
    <Card className="mt-4 p-5">
      <CardHead title={carryCard.title} note={carryCard.note} />
      <div className="mt-4 grid grid-cols-2 gap-8">
        <div>
          <h4 className="text-[13.5px] font-bold">{carryCard.searchTitle}</h4>
          <Plot
            className="mt-1"
            height={250}
            x={[tried.rate[0], tried.rate[tried.rate.length - 1]]}
            y={errors.domain}
            yTicks={errors.ticks}
            xTicks={[0, 0.2, 0.4, 0.6, 0.8].map((value) => ({ value, label: value.toFixed(1) }))}
            yFormat={(value) => String(value)}
            yLabel="Squared error of the model"
            xLabel="Carry-over rate"
            label={`${carryCard.searchTitle}. The smallest error is at a rate of ${carryCard.rate.toFixed(2)}.`}
            margin={{ top: 40 }}
            fallbackWidth={440}
          >
            {(frame) => (
              <>
                <Shade frame={frame} from={frame.sx(carryCard.range[0])} to={frame.sx(carryCard.range[1])} />
                <VRule x={frame.sx(carryCard.rate)} top={frame.top - 6} bottom={frame.bottom} color={chart.primary} />
                <Mark x={frame.sx(carryCard.rate)} y={frame.top - 12} anchor="middle" color={chart.ink} strong>
                  Smallest error: {carryCard.rate.toFixed(2)}
                </Mark>
                <Line points={tried.rate.map((rate, k) => [frame.sx(rate), frame.sy(tried.squared_error[k])])} color={chart.slate} />
                <Dot x={frame.sx(carryCard.rate)} y={frame.sy(bestError)} color={chart.primary} />
                <HoverColumns frame={frame} focusable items={tried.rate.map((rate, k) => ({ x: frame.sx(rate), tip: `Carry-over rate ${rate.toFixed(2)}\nSquared error: ${tried.squared_error[k].toFixed(2)}` }))} />
              </>
            )}
          </Plot>
          <Legend
            className="mt-1"
            items={[
              { label: 'Squared error', color: chart.slate },
              { label: `95% range of the rate: ${carryCard.range[0].toFixed(2)} to ${carryCard.range[1].toFixed(2)}`, color: chart.ink, mark: 'band' },
            ]}
          />
        </div>
        <div>
          <h4 className="text-[13.5px] font-bold">{carryCard.fadingTitle}</h4>
          <Plot
            className="mt-1"
            height={250}
            x={[-0.6, parts.length - 0.4]}
            y={effects.domain}
            yTicks={effects.ticks}
            xTicks={parts.map((_, k) => ({ value: k, label: k === 0 ? 'its week' : `+${k}` }))}
            yFormat={(value) => `${value.toFixed(2)}%`}
            yLabel="More units sold"
            xLabel="Weeks after the advertising"
            label={`${carryCard.fadingTitle}. ${carryCard.fadingNote}`}
            margin={{ top: 40, left: 54 }}
            fallbackWidth={440}
          >
            {(frame) => (
              <>
                {parts.map((effect, k) => (
                  <Column
                    key={k}
                    x={frame.sx(k)}
                    y={frame.sy(effect)}
                    base={frame.sy(0)}
                    width={(frame.right - frame.left) / parts.length - 8}
                    color={chart.slate}
                    tip={`${k === 0 ? 'In the week of the advertising' : `${k} ${k === 1 ? 'week' : 'weeks'} later`}\n${effect.toFixed(3)}% more units sold for 1% more advertising`}
                  />
                ))}
                <Mark x={frame.sx(0) + 18} y={frame.sy(parts[0]) + 4} color={chart.ink} strong>
                  {parts[0].toFixed(3)}%
                </Mark>
              </>
            )}
          </Plot>
          <p className="mt-1 text-[13px] text-ink2">{carryCard.fadingNote}</p>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- what if

function WhatIf() {
  const { whatIf } = s
  const [price, setPrice] = useState(whatIf.start.price)
  const [advertising, setAdvertising] = useState(whatIf.start.advertising)
  const [promotion, setPromotion] = useState(whatIf.start.promotion)
  const changes = { [s.pricePredictor]: price / 100, [whatIf.advertisingKey]: advertising / 100, [whatIf.promotionKey]: promotion ? 1 : 0 }
  const answers = MODEL_KINDS.map((kind) => ({ kind, label: s.models[kind].label, ...changeBy(s.models[kind].coefficients, changes, s.pricePredictor) }))
  const pooled = answers.find((answer) => answer.kind === 'pooled') ?? answers[0]
  const recommended = answers.find((answer) => answer.kind === s.recommended) ?? answers[0]
  const nothing = price === 0 && advertising === 0 && !promotion
  const oppositeSigns = Math.sign(Math.round(pooled.revenue * 1000)) * Math.sign(Math.round(recommended.revenue * 1000)) < 0
  const percent = (value: number) => (Math.abs(value) < 0.0005 ? '0.0%' : signedPct(value, 1))

  return (
    <Card>
      <div className="px-5 pt-4">
        <CardHead
          title={
            <span className="flex items-center gap-2.5 text-[16px]">
              {whatIf.title} <RunTag id={s.otherRunId} />
            </span>
          }
          note={whatIf.text}
        />
      </div>
      <div className="grid grid-cols-[320px_minmax(0,1fr)] gap-8 px-5 pb-5 pt-4">
        <div className="flex flex-col gap-4">
          <Slider label="Price" {...whatIf.price} value={price} onChange={setPrice} format={(value) => (value === 0 ? 'as it is' : signedPct(value / 100))} />
          <Slider label="Advertising" {...whatIf.advertising} value={advertising} onChange={setAdvertising} format={(value) => (value === 0 ? 'as it is' : signedPct(value / 100))} />
          <div className="flex items-center justify-between gap-3">
            <span className="t-lbl">A week on a promotion display</span>
            <span className="flex items-center gap-2 text-[14px] font-semibold">
              {promotion ? 'Yes' : 'No'}
              <Switch on={promotion} onChange={setPromotion} label="A week on a promotion display" />
            </span>
          </div>
        </div>
        <div>
          <div className="-mx-3">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Model</th>
                  <th className="r">Units sold</th>
                  <th className="r">Revenue</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {answers.map((answer) => (
                  <tr key={answer.kind}>
                    <td>
                      <span className={cx(answer.kind === s.recommended && 'font-semibold')}>{answer.label}</span>
                    </td>
                    <td className="r font-bold">{percent(answer.sales)}</td>
                    <td className={cx('r font-bold', answer.revenue < -0.0005 && 'text-danger')}>{percent(answer.revenue)}</td>
                    <td className="w-[150px]">{answer.kind === s.recommended && <Tag tone="primary">Recommended</Tag>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3">
            {nothing ? (
              <Note icon="info">Move a slider, or switch the promotion on.</Note>
            ) : oppositeSigns ? (
              <Note icon="alert" tone="warn">
                The two models point in opposite directions: the pooled model expects {percent(pooled.revenue)} revenue, {recommended.label.toLowerCase()} expect {percent(recommended.revenue)}.
              </Note>
            ) : (
              <Note icon="info">
                The pooled model expects {percent(pooled.revenue)} revenue, {recommended.label.toLowerCase()} expect {percent(recommended.revenue)}: a difference of {(Math.abs(pooled.revenue - recommended.revenue) * 100).toFixed(1)} percentage points.
              </Note>
            )}
          </div>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- details

function StoreLevels() {
  const { stores } = s.details
  const values = stores.rows.map((row) => row.sales_against_average)
  const { domain, ticks } = niceDomain(values, 5)
  return (
    <>
      <p className="mt-3 max-w-[94ch] text-[13.5px] text-ink2">{stores.text}</p>
      <Plot
        className="mt-2"
        height={260}
        x={[-0.7, stores.rows.length - 0.3]}
        y={domain}
        yTicks={ticks}
        xTicks={stores.rows.map((row, k) => ({ value: k, label: row.unit.replace(/^S/, '') }))}
        yFormat={(value) => (value === 0 ? 'average' : signedPct(value))}
        yLabel="Sales against the average store"
        xLabel="Store, from the highest to the lowest level"
        label={`${stores.title}: ${stores.text}`}
        margin={{ left: 62 }}
      >
        {(frame) => (
          <>
            {stores.rows.map((row, k) => (
              <Column
                key={row.unit}
                x={frame.sx(k)}
                y={frame.sy(row.sales_against_average)}
                base={frame.sy(0)}
                width={(frame.right - frame.left) / stores.rows.length - 3}
                color={chart.slate}
                tip={`Store ${row.unit}\n${signedPct(row.sales_against_average)} against the average store\nAt the same price, advertising and promotion`}
              />
            ))}
          </>
        )}
      </Plot>
    </>
  )
}

function ModelsTable() {
  const { models } = s.details
  const fitRows: { name: string; value: (kind: ModelKind) => string }[] = [
    { name: 'Explained of all differences in sales', value: (kind) => pct(s.models[kind].fit.r_squared) },
    { name: 'Explained of the changes within a store', value: (kind) => (s.models[kind].fit.r_squared_within === null ? 'not defined' : pct(s.models[kind].fit.r_squared_within ?? 0)) },
    { name: 'Typical error (logarithm of sales)', value: (kind) => s.models[kind].fit.residual_sd.toFixed(3) },
  ]
  return (
    <>
      <table className="tbl tbl-tight mt-2">
        <thead>
          <tr>
            <th />
            {MODEL_KINDS.map((kind) => (
              <th key={kind} className="r">
                {s.models[kind].label}
                {kind === s.recommended && ' (recommended)'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {variables.map((variable) => (
            <tr key={variable}>
              <td>
                <span className="font-semibold">{predictorName(variable)}</span>
                <div className="text-[12.5px] text-ink3">{rowOf(s.recommended, variable).term}</div>
              </td>
              {MODEL_KINDS.map((kind) => {
                const row = rowOf(kind, variable)
                return (
                  <td key={kind} className="r">
                    <span className="font-bold">{fixed(row.coefficient, 3)}</span>
                    <div className="whitespace-nowrap text-[12.5px] text-ink3">standard error {row.standard_error.toFixed(3)}</div>
                  </td>
                )
              })}
            </tr>
          ))}
          {fitRows.map((fit) => (
            <tr key={fit.name}>
              <td className="text-ink2">{fit.name}</td>
              {MODEL_KINDS.map((kind) => (
                <td key={kind} className="r">
                  {fit.value(kind)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 max-w-[94ch] text-[13.5px] text-ink2">{models.fitNote}</p>
      {models.between !== null && (
        <p className="mt-2 max-w-[94ch] text-[13.5px] text-ink2">
          Random effects split the spread of sales that the predictors leave open into two sources: {pct(models.between)} of it lies between the stores, the rest within them from week to week.
        </p>
      )}
    </>
  )
}

function RatesTable() {
  const { tried } = s.carryCard
  const best = Math.min(...tried.squared_error)
  const half = Math.ceil(tried.rate.length / 2)
  const columns = [tried.rate.map((rate, k) => ({ rate, error: tried.squared_error[k] })).slice(0, half), tried.rate.map((rate, k) => ({ rate, error: tried.squared_error[k] })).slice(half)]
  return (
    <div className="mt-2 grid max-w-[560px] grid-cols-2 gap-8">
      {columns.map((rows, i) => (
        <table key={i} className="tbl tbl-tight">
          <thead>
            <tr>
              <th className="r">Carry-over rate</th>
              <th className="r">Squared error</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.rate}>
                <td className={cx('r', row.error === best && 'font-bold')}>{row.rate.toFixed(2)}</td>
                <td className={cx('r', row.error === best && 'font-bold')}>{row.error.toFixed(3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- screen

export default function PanelRegression() {
  const toInterpretation = useInterpretation()
  const { details } = s
  return (
    <Page crumbs={[course.name, caseBrief.name, 'Panel regression', s.runId]}>
      <RunHeader id={s.runId} summary={s.summary} setupTo={`/panel/setup/${s.runId}`} compareTo={`/runs?a=${s.otherRunId}&b=${s.runId}`} onInterpret={toInterpretation} />

      <div className="mt-8">
        <Layer n={1} title="Headline" note="The one thing to take away">
          <Headline wide>{s.headline}</Headline>
          <Stats className="mt-6" items={s.stats} />
        </Layer>

        <Layer n={2} title="Key results" note="Enough for most decisions">
          <FinalCard />
          <PooledTrap />
          <CarryCard />
        </Layer>

        <Layer n={3} title="What if" note="One change, three models">
          <WhatIf />
        </Layer>

        <Layer n={4} title="Details" note="Open what you need">
          <Accordion title={details.stores.title} note={details.stores.note}>
            <StoreLevels />
          </Accordion>
          <Accordion title={details.models.title} note={details.models.note} icon="table">
            <ModelsTable />
          </Accordion>
          <Accordion title={details.rates.title} note={details.rates.note} icon="table">
            <RatesTable />
          </Accordion>
        </Layer>

        <Layer n={5} title="Interpretation" note="Your reading first, then the coach" id={INTERPRETATION} last>
          <CoachCard script={s.coach} />
        </Layer>
      </div>
    </Page>
  )
}
