/**
 * Resource allocation (run RA-01, with RA-02 for the budget question): how
 * the advertising budget should be split across the four sales regions.
 *
 * The response curves and the best split are the engine's. The what-if view
 * values a split of your own in the browser, with the engine's curves
 * (src/lib/allocation.ts).
 */
import { useMemo, useState } from 'react'
import { CardHead, CoachCard, EngineSays, Headline, HowToRead, Slider, Stat, Stats, Trap } from '../../components/module'
import { Dot, HoverColumns, HRule, Legend, Line, Mark, Plot, VRule } from '../../components/plot'
import { Layer, RunHeader } from '../../components/results'
import { Page } from '../../components/Shell'
import { Accordion, Button, Card, Note, RunTag, Tag } from '../../components/ui'
import { caseBrief, course } from '../../data/alpineOat'
import { allocationScreen } from '../../data/allocation'
import type { CurveResult } from '../../data/allocation'
import { salesAt, valueOfSplit } from '../../lib/allocation'
import { cx } from '../../lib/demo'
import { pct, signedPct, thousands } from '../../lib/format'
import { INTERPRETATION, useInterpretation } from '../../lib/interpretation'
import { chart, niceDomain } from '../../lib/plot'

const s = allocationScreen
const signedAmount = (value: number) => (Math.abs(value) < 0.5 ? '0' : `${value < 0 ? '−' : '+'}${thousands(Math.abs(value))}`)

/** A bar on a light track with its value in ink, inside a table cell. */
function AmountBar({ fraction, color, text }: { fraction: number; color: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-4 flex-1 rounded-[3px] bg-fill">
        <i className="bar-grow block h-4 rounded-r" style={{ width: `${Math.max(0, Math.min(1, fraction)) * 100}%`, background: color }} />
      </span>
      <span className="num w-9 text-right font-bold">{text}</span>
    </div>
  )
}

// ---------------------------------------------------------------- key results

function SplitCard() {
  const largest = Math.max(...s.units.flatMap((unit) => [unit.current_spending, unit.spending]))
  return (
    <Card className="p-5">
      <CardHead title={s.splitCard.title} note={s.splitCard.note} />
      <div className="-mx-3 mt-2">
        <table className="tbl">
          <thead>
            <tr>
              <th className="w-[150px]">Region</th>
              <th className="w-[184px]">Today</th>
              <th className="w-[184px]">Best split</th>
              <th className="r">Change</th>
              <th className="r">Profit today</th>
              <th className="r">Profit, best split</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {s.units.map((unit) => (
              <tr key={unit.name}>
                <td>
                  <span className="font-semibold">{unit.name}</span>
                  <div className="text-[13px] text-ink3">{unit.shape} curve</div>
                </td>
                <td tabIndex={0} data-tip={`${unit.name} today: ${thousands(unit.current_spending)} of advertising, sales of ${thousands(unit.sales_at_current)}`}>
                  <AmountBar fraction={unit.current_spending / largest} color={chart.slate3} text={thousands(unit.current_spending)} />
                </td>
                <td tabIndex={0} data-tip={`${unit.name} at the best split: ${thousands(unit.spending, 1)} of advertising, sales of ${thousands(unit.sales)}`}>
                  <AmountBar fraction={unit.spending / largest} color={chart.slate} text={thousands(unit.spending)} />
                </td>
                <td className="r whitespace-nowrap font-bold">{signedPct(unit.change_share)}</td>
                <td className="r text-ink2">{thousands(unit.profit_at_current)}</td>
                <td className="r">{thousands(unit.profit)}</td>
                <td className="w-[150px]">
                  {unit.spending < 0.5 ? (
                    <Tag tone="warn">Gets nothing</Tag>
                  ) : unit.min_spending > 0 ? (
                    <Tag>At least {thousands(unit.min_spending)}</Tag>
                  ) : unit.max_spending !== null ? (
                    <Tag>At most {thousands(unit.max_spending)}</Tag>
                  ) : null}
                </td>
              </tr>
            ))}
            <tr>
              <td className="font-semibold">All regions</td>
              <td className="num pr-[22px] text-right font-bold">{thousands(s.totals.spending_at_current)}</td>
              <td className="num pr-[22px] text-right font-bold">{thousands(s.totals.spending)}</td>
              <td />
              <td className="r text-ink2">{thousands(s.totals.profit_at_current)}</td>
              <td className="r font-bold">{thousands(s.totals.profit)}</td>
              <td className="font-semibold text-ok">{signedPct(s.totals.profit_gain_share, 1)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}

/** One small chart per region: the curve, the manager's answers, today and the best split. */
function CurvePlot({ curve, bestSpending }: { curve: CurveResult; bestSpending: number }) {
  // The curve is drawn far enough to show the best split, also where it lies beyond three times today's spending.
  const end = Math.max(curve.curve.spending[curve.curve.spending.length - 1], bestSpending * 1.15)
  const grid = Array.from({ length: 41 }, (_, k) => (end * k) / 40)
  const { domain, ticks } = niceDomain([curve.sales_at_zero, curve.sales_at_saturation], 3, curve.sales_at_zero)
  const step = [50, 100, 200, 250, 500].find((size) => end / size <= 4.2) ?? 500
  const answers = [
    { x: 0, y: curve.sales_at_zero, what: 'without any advertising' },
    { x: curve.current_spending, y: curve.sales_at_current, what: "with today's advertising" },
    { x: curve.current_spending * (1 + curve.increase), y: curve.sales_at_increase, what: `with ${pct(curve.increase)} more` },
  ]
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2">
        <b className="text-[13.5px] font-semibold">{curve.name}</b>
        <span className="text-[12.5px] text-ink3">{curve.shape}</span>
      </div>
      <Plot
        height={184}
        x={[0, grid[grid.length - 1]]}
        y={domain}
        yTicks={ticks}
        xTicks={Array.from({ length: Math.floor(end / step) + 1 }, (_, k) => ({ value: k * step, label: thousands(k * step) }))}
        yFormat={(value) => thousands(value)}
        label={`Response curve of ${curve.name}: sales by advertising. ${curve.shape_meaning}`}
        margin={{ left: 40, right: 12, top: 24 }}
        fallbackWidth={210}
      >
        {(frame) => (
          <>
            <HRule y={frame.sy(curve.sales_at_saturation)} left={frame.left} right={frame.right} />
            <Line points={grid.map((spending) => [frame.sx(spending), frame.sy(salesAt(curve, spending))])} color={chart.slate} />
            {answers.map((answer) => (
              <Dot key={answer.what} x={frame.sx(answer.x)} y={frame.sy(answer.y)} r={2.5} color={chart.ink} tip={`The manager's answer ${answer.what}: sales of ${thousands(answer.y)}`} />
            ))}
            <Dot x={frame.sx(curve.current_spending)} y={frame.sy(curve.sales_at_current)} r={6} color={chart.slate} hollow />
            <Dot
              x={frame.sx(bestSpending)}
              y={frame.sy(salesAt(curve, bestSpending))}
              r={4}
              color={chart.primary}
              tip={`Best split: ${thousands(bestSpending)} of advertising, sales of ${thousands(salesAt(curve, bestSpending))}`}
            />
            <Mark x={frame.right} y={frame.sy(curve.sales_at_saturation) - 6} anchor="end">
              unlimited advertising
            </Mark>
          </>
        )}
      </Plot>
      <p className="mt-1 text-[12.5px] leading-[1.4] text-ink3">{curve.shape_meaning}</p>
    </div>
  )
}

function CurvesCard() {
  return (
    <Card className="mt-4 p-5">
      <CardHead title={s.curvesCard.title} note={s.curvesCard.note} />
      <div className="mt-4 grid grid-cols-4 gap-5">
        {s.curves.map((curve, k) => (
          <CurvePlot key={curve.name} curve={curve} bestSpending={s.units[k].spending} />
        ))}
      </div>
      <Legend
        className="mt-3"
        items={[
          { label: 'Response curve', color: chart.slate },
          { label: "The manager's answers", color: chart.ink, mark: 'dot' },
          { label: 'Today', color: chart.slate, mark: 'ring' },
          { label: 'Best split', color: chart.primary, mark: 'dot' },
        ]}
      />
    </Card>
  )
}

function JudgmentTrap() {
  const { trap } = s
  return (
    <Trap title={trap.title} className="mt-4">
      <p className="max-w-[94ch]">{trap.text}</p>
      <div className="-mx-3 mt-2">
        <table className="tbl tbl-tight text-[13px]">
          <thead>
            <tr>
              <th>Region</th>
              <th className="r">Answer {pct(trap.change)} lower</th>
              <th className="r">Best budget then</th>
              <th className="r border-l border-line2">Answer as given</th>
              <th className="r">Best budget</th>
              <th className="r border-l border-line2">Answer {pct(trap.change)} higher</th>
              <th className="r">Best budget then</th>
            </tr>
          </thead>
          <tbody>
            {trap.rows.map((row) => (
              <tr key={row.unit}>
                <td className="font-semibold">{row.unit}</td>
                <td className="r text-ink2">{thousands(row.variants[0].judgment)}</td>
                <td className="r">{thousands(row.variants[0].own_spending)}</td>
                <td className="r border-l border-line2 text-ink2">{thousands(row.judgment)}</td>
                <td className="r font-bold">{thousands(row.own_spending)}</td>
                <td className="r border-l border-line2 text-ink2">{thousands(row.variants[1].judgment)}</td>
                <td className="r">{thousands(row.variants[1].own_spending)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-1 text-[12.5px] text-ink3">The answer is the one to the question "{trap.question}"</p>
      <div className="mt-3 flex flex-col gap-2">
        {trap.engineSays.map((text) => (
          <EngineSays key={text}>{text}</EngineSays>
        ))}
      </div>
    </Trap>
  )
}

function BudgetCard() {
  const { budgetCard } = s
  const steps = budgetCard.steps
  const all = steps.flatMap((step) => [step.spend_all.profit, step.up_to.profit])
  const { domain, ticks } = niceDomain(all, 4, Math.min(...all))
  const x: [number, number] = [steps[0].budget, steps[steps.length - 1].budget]
  return (
    <Card className="mt-4 p-5">
      <CardHead
        title={
          <span className="flex items-center gap-2.5">
            {budgetCard.title} <RunTag id={s.otherRunId} />
          </span>
        }
        note={budgetCard.text}
      />
      <Plot
        className="mt-3"
        height={250}
        x={x}
        y={domain}
        yTicks={ticks}
        xTicks={steps.filter((_, k) => k % 2 === 0).map((step) => ({ value: step.budget, label: thousands(step.budget) }))}
        yFormat={(value) => thousands(value)}
        yLabel="Profit of the best split, thousand CHF"
        xLabel="Advertising budget, thousand CHF"
        label={`${budgetCard.title} Profit of the best split by budget. It is highest at about ${thousands(budgetCard.whatPays)}.`}
        margin={{ top: 44 }}
      >
        {(frame) => (
          <>
            <VRule x={frame.sx(budgetCard.caseBudget)} top={frame.top - 6} bottom={frame.bottom} />
            <Mark x={frame.sx(budgetCard.caseBudget) - 6} y={frame.top - 12} anchor="end" color={chart.ink}>
              Budget of the case
            </Mark>
            <VRule x={frame.sx(budgetCard.whatPays)} top={frame.top - 6} bottom={frame.bottom} color={chart.primary} />
            <Mark x={frame.sx(budgetCard.whatPays) + 6} y={frame.top - 12} color={chart.ink} strong>
              What pays: {thousands(budgetCard.whatPays)}
            </Mark>
            <Line points={steps.map((step) => [frame.sx(step.budget), frame.sy(step.up_to.profit)])} color={chart.primary} dashed />
            <Line points={steps.map((step) => [frame.sx(step.budget), frame.sy(step.spend_all.profit)])} color={chart.slate} width={2.5} />
            <HoverColumns
              frame={frame}
              focusable
              items={steps.map((step) => ({
                x: frame.sx(step.budget),
                tip: `Budget of ${thousands(step.budget)}\nAll of it spent: profit ${thousands(step.spend_all.profit)}\nOnly what pays: ${thousands(step.up_to.spent)} spent, profit ${thousands(step.up_to.profit)}`,
              }))}
            />
          </>
        )}
      </Plot>
      <Legend
        className="mt-2"
        items={[
          { label: 'The whole budget is spent', color: chart.slate },
          { label: 'Only what pays is spent', color: chart.primary, mark: 'dash' },
        ]}
      />
      <div className="mt-3 flex flex-col gap-2">
        {budgetCard.engineSays.map((text) => (
          <EngineSays key={text}>{text}</EngineSays>
        ))}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- what if

function WhatIf() {
  const { whatIf } = s
  const [spending, setSpending] = useState(whatIf.presets[0].spending)
  const value = useMemo(() => valueOfSplit(s.curves, spending), [spending])
  const over = value.spending - s.budget
  const outside = s.units.filter((_, k) => spending[k] < whatIf.limits[k].min - 1e-9 || (whatIf.limits[k].max !== null && spending[k] > (whatIf.limits[k].max ?? 0) + 1e-9))
  const same = (preset: number[]) => preset.every((amount, k) => Math.abs(amount - spending[k]) < 1e-9)

  return (
    <Card>
      <div className="px-5 pt-4">
        <CardHead
          title={<span className="text-[16px]">{whatIf.title}</span>}
          note={whatIf.text}
          right={
            <span className="flex items-center gap-1.5">
              {whatIf.presets.map((preset) => (
                <Button key={preset.name} size="sm" onClick={() => setSpending(preset.spending)} disabled={same(preset.spending)}>
                  {preset.name}
                </Button>
              ))}
            </span>
          }
        />
      </div>
      <div className="px-2 pb-1 pt-2">
        <table className="tbl">
          <thead>
            <tr>
              <th>Region</th>
              <th className="w-[300px]">Advertising</th>
              <th className="r">Sales</th>
              <th className="r">Profit</th>
              <th className="r">Against today</th>
              <th className="r">One more franc earns</th>
            </tr>
          </thead>
          <tbody>
            {s.units.map((unit, k) => {
              const row = value.units[k]
              return (
                <tr key={unit.name}>
                  <td>
                    <span className="font-semibold">{unit.name}</span>
                    {whatIf.limits[k].text && <div className="text-[12.5px] text-ink3">{whatIf.limits[k].text}</div>}
                  </td>
                  <td>
                    <Slider
                      label={`Advertising in ${unit.name}`}
                      {...whatIf.slider}
                      value={spending[k]}
                      onChange={(amount) => setSpending((old) => old.map((item, i) => (i === k ? amount : item)))}
                      format={(amount) => thousands(amount)}
                    />
                  </td>
                  <td className="r">{thousands(row.sales)}</td>
                  <td className="r font-bold">{thousands(row.profit)}</td>
                  <td className={cx('r', row.profit < unit.profit_at_current - 0.5 ? 'text-danger' : 'text-ink2')}>{signedAmount(row.profit - unit.profit_at_current)}</td>
                  <td className="r">
                    {row.oneMore === null ? 'a lot' : row.oneMore.toFixed(2)}
                    <span className="ml-2 inline-block w-[92px] text-left text-[12.5px] text-ink3">{spending[k] < 0.5 ? 'no advertising' : row.oneMore === null || row.oneMore > 1.005 ? 'more would pay' : row.oneMore < 0.995 ? 'too much' : 'just right'}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {(Math.abs(over) > 0.5 || outside.length > 0) && (
        <div className="flex flex-col gap-2 px-5 pb-1">
          {Math.abs(over) > 0.5 && (
            <Note icon={over > 0 ? 'alert' : 'info'} tone={over > 0 ? 'warn' : 'neutral'}>
              {over > 0 ? `This split spends ${thousands(over)} more than the budget of ${thousands(s.budget)}.` : `This split leaves ${thousands(-over)} of the budget of ${thousands(s.budget)} unspent.`}
            </Note>
          )}
          {outside.map((unit) => (
            <Note key={unit.name} icon="alert" tone="warn">
              The spending of {unit.name} is outside its limits.
            </Note>
          ))}
        </div>
      )}
      <div className="mx-5 mt-2 flex items-start gap-6 border-t border-line2 pb-5 pt-4">
        <Stat className="flex-1" value={thousands(value.spending)} label="advertising in your split" note={`Budget: ${thousands(s.budget)}`} />
        <Stat className="flex-1" value={thousands(value.profit)} label="profit of your split" note={`Today: ${thousands(whatIf.profitToday)}`} />
        <Stat
          className="flex-1"
          value={signedAmount(value.profit - whatIf.profitToday)}
          label="against today's split"
          note={Math.abs(value.profit - whatIf.profitToday) < 0.5 ? 'The same profit as today' : `${signedPct((value.profit - whatIf.profitToday) / whatIf.profitToday, 1)} profit`}
        />
        <Stat
          className="flex-1"
          value={signedAmount(value.profit - whatIf.profitBest)}
          label="against the best split"
          note={Math.abs(value.profit - whatIf.profitBest) < 0.5 ? 'This is the best split' : value.profit > whatIf.profitBest ? 'More profit, with another budget' : `Best split: ${thousands(whatIf.profitBest)}`}
        />
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- details

function JudgmentsTable() {
  const { judgments } = s.details
  const columns: { key: 'sales_at_zero' | 'sales_at_current' | 'sales_at_increase' | 'sales_at_saturation'; head: string }[] = [
    { key: 'sales_at_zero', head: 'Sales without any advertising' },
    { key: 'sales_at_current', head: "Sales with today's advertising" },
    { key: 'sales_at_increase', head: 'Sales with 50% more' },
    { key: 'sales_at_saturation', head: 'Sales with unlimited advertising' },
  ]
  return (
    <>
      <table className="tbl tbl-tight mt-2">
        <thead>
          <tr>
            <th>Region</th>
            <th className="r">Advertising today</th>
            {columns.map((column) => (
              <th key={column.key} className="r whitespace-normal">
                <span tabIndex={0} data-tip={judgments.questions[column.key]}>
                  {column.head}
                </span>
              </th>
            ))}
            <th className="r">Margin</th>
          </tr>
        </thead>
        <tbody>
          {judgments.rows.map((row) => (
            <tr key={String(row.name)}>
              <td className="font-semibold">{row.name}</td>
              <td className="r">{thousands(Number(row.current_spending))}</td>
              {columns.map((column) => (
                <td key={column.key} className="r">
                  {thousands(Number(row[column.key]))}
                </td>
              ))}
              <td className="r">{pct(Number(row.margin))}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 max-w-[86ch] text-[13.5px] text-ink2">
        Each regional manager answered four questions. Hover a column to read the question as it was asked. Margin: {judgments.margin}.
      </p>
    </>
  )
}

function CurvesTable() {
  return (
    <table className="tbl tbl-tight mt-2">
      <thead>
        <tr>
          <th>Region</th>
          <th>Shape</th>
          <th className="r">Sales without advertising, share of today</th>
          <th className="r">With unlimited advertising</th>
          <th className="r">c</th>
          <th className="r">d</th>
          <th className="r">Steepest at a spending of</th>
        </tr>
      </thead>
      <tbody>
        {s.curves.map((curve) => (
          <tr key={curve.name}>
            <td className="font-semibold">{curve.name}</td>
            <td className="text-ink2">{curve.shape}</td>
            <td className="r">{pct(curve.parameters.low)}</td>
            <td className="r">{pct(curve.parameters.high)}</td>
            <td className="r">{curve.parameters.c.toFixed(2)}</td>
            <td className="r">{curve.parameters.d.toFixed(2)}</td>
            <td className="r">{curve.steepest_at_spending ? thousands(curve.steepest_at_spending) : 'the first franc'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function SplitTable() {
  return (
    <table className="tbl tbl-tight mt-2">
      <thead>
        <tr>
          <th>Region</th>
          <th className="r">Advertising today</th>
          <th className="r">Best split</th>
          <th className="r">Sales today</th>
          <th className="r">Sales, best split</th>
          <th className="r">Profit today</th>
          <th className="r">Profit, best split</th>
          <th className="r">One more franc earns</th>
        </tr>
      </thead>
      <tbody>
        {s.units.map((unit) => (
          <tr key={unit.name}>
            <td className="font-semibold">{unit.name}</td>
            <td className="r text-ink2">{thousands(unit.current_spending)}</td>
            <td className="r font-bold">{thousands(unit.spending, 1)}</td>
            <td className="r text-ink2">{thousands(unit.sales_at_current)}</td>
            <td className="r">{thousands(unit.sales)}</td>
            <td className="r text-ink2">{thousands(unit.profit_at_current)}</td>
            <td className="r">{thousands(unit.profit)}</td>
            <td className="r">{unit.margin_of_one_more_unit_of_spending === null ? '' : unit.margin_of_one_more_unit_of_spending.toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ---------------------------------------------------------------- screen

export default function Allocation() {
  const toInterpretation = useInterpretation()
  const { details } = s
  return (
    <Page crumbs={[course.name, caseBrief.name, 'Resource allocation', s.runId]}>
      <RunHeader id={s.runId} summary={s.summary} setupTo={`/allocation/setup/${s.runId}`} compareTo={`/runs?a=${s.runId}&b=${s.otherRunId}`} onInterpret={toInterpretation} />

      <div className="mt-8">
        <Layer n={1} title="Headline" note="The one thing to take away">
          <Headline>{s.headline}</Headline>
          <Stats className="mt-6" items={s.stats} />
        </Layer>

        <Layer n={2} title="Key results" note="Enough for most decisions">
          <SplitCard />
          <CurvesCard />
          <JudgmentTrap />
          <BudgetCard />
        </Layer>

        <Layer n={3} title="What if" note="A split of your own">
          <WhatIf />
        </Layer>

        <Layer n={4} title="Details" note="Open what you need">
          <Accordion title={details.judgments.title} note={details.judgments.note} icon="table">
            <JudgmentsTable />
          </Accordion>
          <Accordion title={details.curves.title} note={details.curves.note}>
            <CurvesTable />
            <HowToRead className="mt-4 max-w-[86ch]" lines={s.curves[0].how_to_read} />
          </Accordion>
          <Accordion title={details.split.title} note={details.split.note}>
            <SplitTable />
            <HowToRead className="mt-4 max-w-[86ch]" lines={s.howToRead} />
          </Accordion>
        </Layer>

        <Layer n={5} title="Interpretation" note="Your reading first, then the coach" id={INTERPRETATION} last>
          <CoachCard script={s.coach} />
        </Layer>
      </div>
    </Page>
  )
}
