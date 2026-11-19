/**
 * Price optimization without price tests (run PR-04): the demand curve comes
 * from the market simulator of the conjoint study. The design saved in CJ-03
 * is put into the simulator once for every tested price. Everything on this
 * screen was calculated by the engine.
 */
import { Link } from 'react-router-dom'
import { CardHead, EngineSays, Headline, HowToRead, ModuleTabs, Stats, Trap } from '../../components/module'
import { Dot, HoverColumns, Line, Mark, Plot, Shade, VRule } from '../../components/plot'
import type { Frame } from '../../components/plot'
import { Layer, RunHeader } from '../../components/results'
import { Page } from '../../components/Shell'
import { Accordion, Card, RunTag } from '../../components/ui'
import { caseBrief, course } from '../../data/alpineOat'
import { conjointPricing, pricingTabs } from '../../data/pricing'
import { chf, fixed, pct, thousands } from '../../lib/format'
import { atInterpretation } from '../../lib/interpretation'
import { chart, niceDomain, niceTicks } from '../../lib/plot'

const s = conjointPricing
const prices = s.curve.price
const X: [number, number] = [prices[0], prices[prices.length - 1]]
const priceTicks = niceTicks(X[0], X[1], 6).map((value) => ({ value, label: value.toFixed(2) }))

/** The prices below the lowest and above the highest one that respondents saw. */
function NotAsked({ frame }: { frame: Frame }) {
  return (
    <>
      <Shade frame={frame} from={frame.left} to={frame.sx(s.priceRange.lowest)} />
      <Shade frame={frame} from={frame.sx(s.priceRange.highest)} to={frame.right} label={s.untestedLabel} />
    </>
  )
}

function ShareChart() {
  const shares = s.curve.quantity.map((quantity) => quantity / s.marketSize)
  const { domain, ticks } = niceDomain(shares, 4)
  return (
    <Card className="p-5">
      <CardHead title={s.shareChart.title} note={s.shareChart.note} />
      <Plot
        className="mt-3"
        height={290}
        x={X}
        y={domain}
        yTicks={ticks}
        xTicks={priceTicks}
        yFormat={(value) => pct(value)}
        yLabel={s.shareChart.yLabel}
        xLabel="Price, CHF"
        label={`${s.shareChart.title}: the share falls from ${pct(s.points[0].share)} at ${s.points[0].level} to ${pct(s.points[s.points.length - 1].share)} at ${s.points[s.points.length - 1].level}.`}
      >
        {(frame) => (
          <>
            <NotAsked frame={frame} />
            <Line points={prices.map((price, k) => [frame.sx(price), frame.sy(shares[k])])} color={chart.slate} />
            {s.points.map((point) => (
              <g key={point.level}>
                <Dot
                  x={frame.sx(point.price)}
                  y={frame.sy(point.share)}
                  color={chart.ink}
                  tip={`${point.level}: ${pct(point.share, 1)} of preference, ${thousands(point.quantity)} litres per week`}
                />
                <Mark x={frame.sx(point.price) + 9} y={frame.sy(point.share) - 8} color={chart.ink} strong>
                  {pct(point.share)}
                </Mark>
              </g>
            ))}
          </>
        )}
      </Plot>
    </Card>
  )
}

function ProfitChart() {
  const { domain, ticks } = niceDomain(s.curve.profit, 4)
  return (
    <Card className="p-5">
      <CardHead title={s.profitChart.title} note={s.profitChart.note} />
      <Plot
        className="mt-3"
        height={290}
        x={X}
        y={domain}
        yTicks={ticks}
        xTicks={priceTicks}
        yFormat={(value) => thousands(value)}
        yLabel={s.profitChart.yLabel}
        xLabel="Price, CHF"
        label={`${s.profitChart.title}: profit is highest at ${chf(s.optimum.optimal_price)}.`}
        margin={{ top: 44, left: 58 }}
      >
        {(frame) => (
          <>
            <NotAsked frame={frame} />
            <Line points={prices.map((price, k) => [frame.sx(price), frame.sy(s.curve.profit[k])])} color={chart.slate} width={2.5} />
            <VRule x={frame.sx(s.optimum.optimal_price)} top={frame.top - 6} bottom={frame.bottom} />
            <Dot x={frame.sx(s.optimum.optimal_price)} y={frame.sy(s.optimum.profit)} color={chart.slate} />
            <Mark x={frame.sx(s.optimum.optimal_price)} y={frame.top - 12} anchor="end" strong color={chart.ink}>
              Best price {chf(s.optimum.optimal_price)}
            </Mark>
            <HoverColumns
              frame={frame}
              items={prices.map((price, k) => ({
                x: frame.sx(price),
                tip: `${chf(price)}\nProfit: ${chf(s.curve.profit[k], 0)} per week\nLitres: ${thousands(s.curve.quantity[k])}`,
              }))}
            />
          </>
        )}
      </Plot>
    </Card>
  )
}

export default function PricingConjoint() {
  return (
    <Page crumbs={[course.name, caseBrief.name, 'Price optimization', s.runId]}>
      <ModuleTabs tabs={pricingTabs} label="Price optimization screens" />
      <RunHeader
        id={s.runId}
        summary={s.summary}
        setupTo={`/pricing/setup/${s.runId}`}
        compareTo={`/runs?a=${s.storeTests.runId}&b=${s.runId}`}
        interpretTo={atInterpretation(pricingTabs[0].to)}
      />

      <div className="mt-8">
        <Layer n={1} title="Headline" note="The one thing to take away">
          <Headline>{s.headline}</Headline>
          <Stats className="mt-6" items={s.stats} />
        </Layer>

        <Layer n={2} title="Key results" note="Enough for most decisions">
          <div className="grid grid-cols-2 items-start gap-4">
            <ShareChart />
            <ProfitChart />
          </div>
          <Trap title={s.trap.title} className="mt-4">
            <p className="max-w-[94ch]">{s.trap.text}</p>
            <p className="mt-2">
              <Link to={`/pricing/price-tests?run=${s.storeTests.runId}`} className="rounded font-semibold text-primary hover:underline">
                Open the store tests
              </Link>{' '}
              <RunTag id={s.storeTests.runId} className="ml-1" />
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {s.trap.engineSays.map((text) => (
                <EngineSays key={text}>{text}</EngineSays>
              ))}
            </div>
          </Trap>
        </Layer>

        <Layer n={3} title="Details" note="Open what you need" last>
          <Accordion title="The tested prices as a table" note={`${s.points.length} prices: share, litres per week and the elasticity to the next price`} icon="table">
            <table className="tbl tbl-tight mt-2">
              <thead>
                <tr>
                  <th>Tested price</th>
                  <th className="r">Share of preference</th>
                  <th className="r">Litres per week</th>
                  <th className="r">Profit per week</th>
                  <th className="r">Elasticity to the next price</th>
                </tr>
              </thead>
              <tbody>
                {s.points.map((point) => (
                  <tr key={point.level}>
                    <td className="font-semibold">{point.level}</td>
                    <td className="r">{pct(point.share, 1)}</td>
                    <td className="r">{thousands(point.quantity)}</td>
                    <td className="r">{chf((point.price - s.unitCost) * point.quantity, 0)}</td>
                    <td className="r">{point.elasticity_to_next_price === null ? '' : fixed(point.elasticity_to_next_price, 2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <HowToRead className="mt-4 max-w-[86ch]" lines={s.howToRead} />
          </Accordion>
        </Layer>
      </div>
    </Page>
  )
}
