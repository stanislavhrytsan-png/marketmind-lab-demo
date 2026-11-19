/**
 * Price optimization from price tests (runs PR-01 to PR-03, one per product):
 * three forms of the demand curve, and the price with the highest profit.
 *
 * The curves and the best price of each run are the engine's. The what-if
 * view moves along these curves in the browser: another unit cost, another
 * form, another price (src/lib/pricing.ts).
 */
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CardHead, CoachCard, EngineSays, Headline, HowToRead, ModuleTabs, Slider, Stat, Stats, Trap } from '../../components/module'
import { Dot, HoverColumns, Legend, Line, Mark, Plot, Shade, VRule } from '../../components/plot'
import type { Frame } from '../../components/plot'
import { Layer, RunHeader } from '../../components/results'
import { Page } from '../../components/Shell'
import { Accordion, Button, Card, Note, SegmentedControl, Tag } from '../../components/ui'
import { caseBrief, course } from '../../data/alpineOat'
import { priceTestProducts, priceTestRunIds, priceTestScreen, pricingTabs } from '../../data/pricing'
import type { FormResult, PriceTestRunId } from '../../data/pricing'
import { cx } from '../../lib/demo'
import { chf, fixed, pct, thousands } from '../../lib/format'
import { INTERPRETATION, useInterpretation } from '../../lib/interpretation'
import { chart, niceDomain, niceTicks } from '../../lib/plot'
import { bestPrice, elasticityAt, profitAt, quantityAt } from '../../lib/pricing'
import type { DemandForm } from '../../lib/pricing'

type Screen = ReturnType<typeof priceTestScreen>

const priceTicks = (from: number, to: number) => niceTicks(from, to, 6).map((value) => ({ value, label: value.toFixed(2) }))

/** The two ends of the price axis that no test covered. */
function Untested({ frame, s }: { frame: Frame; s: Screen }) {
  return (
    <>
      <Shade frame={frame} from={frame.left} to={frame.sx(s.priceRange.lowest)} />
      <Shade frame={frame} from={frame.sx(s.priceRange.highest)} to={frame.right} label={s.untestedLabel} />
    </>
  )
}

// ---------------------------------------------------------------- key results

function DemandChart({ s }: { s: Screen }) {
  const grid = s.chosen.curve.price
  const x: [number, number] = [grid[0], grid[grid.length - 1]]
  const { domain, ticks } = niceDomain([...s.observations.quantity, ...s.chosen.curve.quantity])
  // The chosen form is drawn last, on top of the two others.
  const others = s.forms.filter((form) => form.form !== s.chosen.form)
  const order = [...others, s.chosen]
  return (
    <Card className="p-5">
      <CardHead title={s.demandChart.title} note={s.demandChart.note} />
      <Plot
        className="mt-3"
        height={300}
        x={x}
        y={domain}
        yTicks={ticks}
        xTicks={priceTicks(x[0], x[1])}
        yFormat={(value) => thousands(value)}
        yLabel={s.demandChart.yLabel}
        xLabel="Price, CHF"
        label={`${s.demandChart.title}: units sold at each tested price, with three fitted demand curves. ${s.chosen.label} fits best.`}
      >
        {(frame) => {
          return (
            <>
              <defs>
                <clipPath id="demand-plot">
                  <rect x={frame.left} y={frame.top} width={frame.right - frame.left} height={frame.bottom - frame.top} />
                </clipPath>
              </defs>
              <Untested frame={frame} s={s} />
              {s.observations.price.map((price, i) => (
                <circle key={i} cx={frame.sx(price)} cy={frame.sy(s.observations.quantity[i])} r={2.5} fill={chart.ink} opacity={0.4} />
              ))}
              <g clipPath="url(#demand-plot)">
                {order.map((form) => (
                  <Line
                    key={form.form}
                    points={form.curve.price.map((price, k) => [frame.sx(price), frame.sy(form.curve.quantity[k])])}
                    color={form.form === s.chosen.form ? chart.slate : chart.slate3}
                    width={form.form === s.chosen.form ? 2.5 : 1.5}
                  />
                ))}
              </g>
              <HoverColumns
                frame={frame}
                focusable
                items={s.byPrice.map((row) => ({
                  x: frame.sx(row.price),
                  tip: `${chf(row.price)}\nMean of the stores: ${thousands(row.mean)} units (${thousands(row.lowest)} to ${thousands(row.highest)})\n${s.forms
                    .map((form) => `${form.label}: ${thousands(quantityAt(form.form, form.parameters, row.price))}`)
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
          { label: 'One store and week', color: chart.slate2, mark: 'dot' },
          { label: `Best fit: ${s.chosen.label.toLowerCase()}`, color: chart.slate },
          { label: others.map((form) => form.label).join(', '), color: chart.slate3 },
        ]}
      />
    </Card>
  )
}

/**
 * Profit over a range of prices, with a marker on the best price. Used for
 * the engine's run and for the what-if view.
 */
function ProfitPlot({
  s,
  prices,
  profit,
  revenue,
  reference,
  best,
  own,
  color,
  label,
}: {
  s: Screen
  prices: number[]
  profit: number[]
  revenue?: number[]
  /** The profit of the saved run, drawn in grey behind the what-if curve. */
  reference?: number[]
  best: { price: number; profit: number } | null
  /** The student's own price. */
  own?: { price: number; profit: number }
  color: string
  label: string
}) {
  const x: [number, number] = [prices[0], prices[prices.length - 1]]
  const { domain, ticks } = niceDomain([...profit, ...(revenue ?? []), ...(reference ?? [])])
  const visible = (price: number) => price >= x[0] && price <= x[1]
  return (
    <Plot
      className="mt-3"
      height={300}
      x={x}
      y={domain}
      yTicks={ticks}
      xTicks={priceTicks(x[0], x[1])}
      yFormat={(value) => thousands(value)}
      yLabel={s.profitChart.yLabel}
      xLabel="Price, CHF"
      label={label}
      margin={{ top: 44 }}
    >
      {(frame) => {
        const at = (values: number[]) => values.map((value, k): [number, number] => [frame.sx(prices[k]), frame.sy(value)])
        return (
          <>
            <Untested frame={frame} s={s} />
            {revenue && <Line points={at(revenue)} color={chart.slate3} width={1.5} />}
            {reference && <Line points={at(reference)} color={chart.slate3} />}
            <Line points={at(profit)} color={color} width={2.5} />
            {best && visible(best.price) && (
              <>
                <VRule x={frame.sx(best.price)} top={frame.top - 6} bottom={frame.bottom} />
                <Dot x={frame.sx(best.price)} y={frame.sy(best.profit)} color={color} />
                <Mark x={frame.sx(best.price)} y={frame.top - 12} anchor="middle" strong color={chart.ink}>
                  Best price {chf(best.price)}
                </Mark>
              </>
            )}
            {own && visible(own.price) && <Dot x={frame.sx(own.price)} y={frame.sy(own.profit)} color={color} hollow r={5} />}
            <HoverColumns
              frame={frame}
              items={prices.map((price, k) => ({
                x: frame.sx(price),
                tip: `${chf(price)}\nProfit: ${chf(profit[k], 0)}${revenue ? `\nRevenue: ${chf(revenue[k], 0)}` : ''}${reference ? `\nRun ${s.runId}: ${chf(reference[k], 0)}` : ''}`,
              }))}
            />
          </>
        )
      }}
    </Plot>
  )
}

function ProfitCard({ s }: { s: Screen }) {
  const { curve, optimum } = s.chosen
  return (
    <Card className="p-5">
      <CardHead title={s.profitChart.title} note={s.profitChart.note} />
      <ProfitPlot
        s={s}
        prices={curve.price}
        profit={curve.profit}
        revenue={curve.revenue}
        best={{ price: optimum.optimal_price, profit: optimum.profit }}
        color={chart.slate}
        label={`${s.profitChart.title}: profit is highest at ${chf(optimum.optimal_price)}.`}
      />
      <Legend
        className="mt-2"
        items={[
          { label: 'Profit', color: chart.slate },
          { label: 'Revenue', color: chart.slate3 },
        ]}
      />
      <p className="mt-3 text-[13px] text-ink2">{s.profitChart.near}</p>
    </Card>
  )
}

function FormTrap({ s }: { s: Screen }) {
  const { trap } = s
  return (
    <Trap title={trap.title} className="mt-4">
      <p className="max-w-[94ch]">{trap.text}</p>
      <div className="-mx-3 mt-2">
        <table className="tbl tbl-tight text-[13px]">
          <thead>
            <tr>
              <th>Form of the curve</th>
              <th className="r">Differences explained</th>
              <th className="r">Best price</th>
              <th className="r">Profit by its own curve</th>
              <th className="r">{trap.rightCurve}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {s.byRank.map((form) => (
              <tr key={form.form} className={form.rank === 1 ? 'bg-primary-t' : undefined}>
                <td className="font-semibold">{form.label}</td>
                <td className="r">{pct(form.fit.r_squared, 1)}</td>
                <td className="r">{chf(form.optimum.optimal_price)}</td>
                <td className="r">{chf(form.optimum.profit, 0)}</td>
                <td className={cx('r', form.on_best_fitting_curve.profit_lost > 0.05 && 'font-bold')}>
                  {chf(form.on_best_fitting_curve.profit, 0)}
                  {form.rank > 1 && <span className="font-normal text-ink3"> ({pct(-form.on_best_fitting_curve.profit_lost, 1).replace('-', '−')})</span>}
                </td>
                <td className="w-[178px]">
                  {form.rank === 1 ? (
                    <Tag tone="primary">Best fit</Tag>
                  ) : form.optimum.inside_observed_prices ? null : (
                    <Tag tone="warn">Outside the tested prices</Tag>
                  )}
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
  const saved = { form: s.chosen.form, cost: s.unitCost, price: s.chosen.optimum.optimal_price }
  const [form, setForm] = useState<DemandForm>(saved.form)
  const [cost, setCost] = useState(saved.cost)
  const [price, setPrice] = useState(saved.price)
  const changed = form !== saved.form || cost !== saved.cost || price !== saved.price

  const fitted = s.forms.find((item) => item.form === form) as FormResult
  const prices = s.chosen.curve.price
  const profit = useMemo(() => prices.map((p) => profitAt(form, fitted.parameters, p, cost)), [prices, form, fitted, cost])
  const best = bestPrice(form, fitted.parameters, cost)
  const bestProfit = best === null ? null : profitAt(form, fitted.parameters, best, cost)
  const ownProfit = profitAt(form, fitted.parameters, price, cost)
  const lost = bestProfit ? 1 - ownProfit / bestProfit : 0
  const outside = best !== null && (best < s.priceRange.lowest || best > s.priceRange.highest)

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
                  setForm(saved.form)
                  setCost(saved.cost)
                  setPrice(saved.price)
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
          <div>
            <span className="t-lbl">Form of the demand curve</span>
            <SegmentedControl
              className="mt-1 flex w-full [&>button]:flex-1 [&>button]:px-1.5"
              label="Form of the demand curve"
              value={form}
              onChange={setForm}
              options={s.forms.map((item) => ({ value: item.form, label: item.label === 'Constant elasticity' ? 'Const. elasticity' : item.label }))}
            />
            <span className="mt-1.5 block text-[12.5px] text-ink3">{whatIf.formHelp[form].text}</span>
          </div>
          <Slider label="Unit cost" {...whatIf.cost} value={cost} onChange={setCost} format={(value) => chf(value)} />
          <Slider label="Your price" {...whatIf.price} value={price} onChange={setPrice} format={(value) => chf(value)} />
        </div>

        <div className="min-w-0">
          <ProfitPlot
            s={s}
            prices={prices}
            profit={profit}
            reference={changed ? s.chosen.curve.profit : undefined}
            best={best === null || bestProfit === null ? null : { price: best, profit: bestProfit }}
            own={{ price, profit: ownProfit }}
            color={chart.primary}
            label="Profit by price for the form and the unit cost on the left, with your own price."
          />
          <Legend
            className="mt-2"
            items={[
              { label: 'Profit with your values', color: chart.primary },
              { label: 'Your price', color: chart.primary, mark: 'ring' },
              ...(changed ? [{ label: `Run ${s.runId}`, color: chart.slate3 }] : []),
            ]}
          />
          {outside && (
            <Note icon="alert" tone="warn" className="mt-3">
              {whatIf.outside}
            </Note>
          )}
          <div className="mt-4 flex items-start gap-6 border-t border-line2 pt-4">
            <Stat
              className="flex-1"
              value={best === null ? 'None' : chf(best)}
              label="price with the highest profit"
              note={best === null ? 'With this curve a higher price always earns more' : `${s.runId}: ${chf(saved.price)}`}
            />
            <Stat
              className="flex-1"
              value={bestProfit === null ? '' : chf(bestProfit, 0)}
              label="profit at that price"
              note={best === null ? undefined : `Elasticity there: ${fixed(elasticityAt(form, fitted.parameters, best), 1)}`}
            />
            <Stat
              className="flex-1"
              value={chf(ownProfit, 0)}
              label={`profit at your price, ${chf(price)}`}
              note={bestProfit === null ? undefined : lost < 0.0005 ? 'The best price' : `${pct(lost, 1)} less than at the best price`}
            />
          </div>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- details

function TestsTable({ s }: { s: Screen }) {
  return (
    <table className="tbl tbl-tight mt-2">
      <thead>
        <tr>
          <th>Tested price</th>
          <th className="r">Mean units sold</th>
          <th className="r">Lowest store</th>
          <th className="r">Highest store</th>
          {s.forms.map((form) => (
            <th key={form.form} className="r">
              {form.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {s.byPrice.map((row) => (
          <tr key={row.price}>
            <td className="font-semibold">{chf(row.price)}</td>
            <td className="r">{thousands(row.mean, 1)}</td>
            <td className="r text-ink2">{thousands(row.lowest)}</td>
            <td className="r text-ink2">{thousands(row.highest)}</td>
            {s.forms.map((form) => (
              <td key={form.form} className={cx('r', form.form === s.chosen.form ? 'font-bold' : 'text-ink2')}>
                {thousands(quantityAt(form.form, form.parameters, row.price), 1)}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function FormsTable({ s }: { s: Screen }) {
  return (
    <table className="tbl tbl-tight mt-2">
      <thead>
        <tr>
          <th>Form</th>
          <th>Equation the engine fitted</th>
          <th className="r">Differences explained</th>
          <th className="r">Typical miss, units</th>
          <th className="r">Elasticity at the mean price</th>
        </tr>
      </thead>
      <tbody>
        {s.byRank.map((form) => (
          <tr key={form.form}>
            <td className="font-semibold">
              {form.rank}. {form.label}
            </td>
            <td className="num text-ink2">{form.equation}</td>
            <td className="r">{pct(form.fit.r_squared, 1)}</td>
            <td className="r">{thousands(form.fit.rmse, 1)}</td>
            <td className="r">{fixed(form.elasticity_at_mean_price, 2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ---------------------------------------------------------------- screen

export default function PricingTests() {
  const [params, setParams] = useSearchParams()
  const id: PriceTestRunId = priceTestRunIds.find((run) => run === params.get('run')) ?? priceTestRunIds[0]
  const s = useMemo(() => priceTestScreen(id), [id])
  const toInterpretation = useInterpretation()

  return (
    <Page crumbs={[course.name, caseBrief.name, 'Price optimization', s.runId]}>
      <div className="flex items-start gap-4">
        <ModuleTabs tabs={pricingTabs} label="Price optimization screens" />
        <span className="flex-1" />
        <span className="mt-[5px] text-[13px] text-ink2">Product</span>
        <SegmentedControl label="Product" value={id} onChange={(run) => setParams({ run }, { replace: true })} options={priceTestProducts} />
      </div>
      <RunHeader
        key={id}
        id={s.runId}
        summary={s.summary}
        setupTo={`/pricing/setup/${s.runId}`}
        compareTo={`/runs?a=${priceTestRunIds[0]}&b=${id === priceTestRunIds[0] ? priceTestRunIds[1] : id}`}
        onInterpret={toInterpretation}
      />

      <div className="mt-8">
        <Layer n={1} title="Headline" note="The one thing to take away">
          <Headline>{s.headline}</Headline>
          <Stats className="mt-6" items={s.stats} />
        </Layer>

        <Layer n={2} title="Key results" note="Enough for most decisions">
          <div className="grid grid-cols-2 items-start gap-4">
            <DemandChart s={s} />
            <ProfitCard s={s} />
          </div>
          <FormTrap s={s} />
        </Layer>

        <Layer n={3} title="What if" note="Change the cost, the curve or the price">
          <WhatIf key={id} s={s} />
        </Layer>

        <Layer n={4} title="Details" note="Open what you need">
          <Accordion title={s.details.tests.title} note={s.details.tests.note} icon="table">
            <TestsTable s={s} />
          </Accordion>
          <Accordion title={s.details.forms.title} note={s.details.forms.note}>
            <FormsTable s={s} />
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
