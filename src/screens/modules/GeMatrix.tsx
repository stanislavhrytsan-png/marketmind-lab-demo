/**
 * GE McKinsey matrix (run GE-01, with GE-02 for how firmly the units sit in
 * their cells): which business units deserve investment.
 *
 * Scores, cells, zones and the sensitivity analysis are the engine's. The
 * what-if view places the units again in the browser, with weights of the
 * student's own (src/lib/portfolio.ts).
 */
import { Fragment, useMemo, useState } from 'react'
import { CardHead, CoachCard, EngineSays, Headline, HowToRead, Slider, Stat, Stats, Trap } from '../../components/module'
import { Layer, RunHeader } from '../../components/results'
import { Page } from '../../components/Shell'
import { Accordion, Button, Card, RunTag, Tag } from '../../components/ui'
import { caseBrief, course } from '../../data/alpineOat'
import { portfolioScreen, score, weightChange } from '../../data/portfolio'
import type { UnitResult } from '../../data/portfolio'
import { cx } from '../../lib/demo'
import { pct, thousands } from '../../lib/format'
import { INTERPRETATION, useInterpretation } from '../../lib/interpretation'
import { chart } from '../../lib/plot'
import { DIMENSIONS, placeOf, sharesOfAxis } from '../../lib/portfolio'
import type { Dimension, Level, Place, Zone } from '../../lib/portfolio'

const s = portfolioScreen
const { scale, cuts, zoneOfCell, zoneLabels, zoneMeanings, axes } = s.grid
const LEVELS: Level[] = ['low', 'medium', 'high']
const ZONES: Zone[] = ['invest', 'hold', 'harvest']

/**
 * The three zones are ordered, so they get three steps of one colour: the
 * stronger the tint, the stronger the case for investing. Every zone is also
 * named in the grid and in the key below it.
 */
const zoneFill: Record<Zone, string> = { invest: '#CDB6D9', hold: '#E6DAEC', harvest: '#F7F5F9' }
const zoneTone: Record<Zone, 'primary' | 'neutral' | 'outline'> = { invest: 'primary', hold: 'neutral', harvest: 'outline' }
/** The five factors of an axis, as five steps of the neutral data colour. The key above the bars names them in the same order. */
const factorFill = ['#3F485E', '#5F6983', '#838CA3', '#A9B0C1', '#CDD2DC']

/** 0.637 -> "64%", 0.991 -> "99.1%": a share that is almost 100% keeps one decimal, so that it does not read as "always". */
const share = (value: number) => pct(value, value > 0.99 && value < 1 ? 1 : 0)
const millions = (value: number) => `CHF ${thousands(value, Number.isInteger(value) ? 0 : 1)} million`
const factorsOf = (dimension: Dimension) => s.factors.map((factor, k) => ({ factor, k })).filter((item) => item.factor.dimension === dimension)

function ZoneTag({ zone }: { zone: Zone }) {
  return <Tag tone={zoneTone[zone]}>{zoneLabels[zone]}</Tag>
}

/** A score with its level: "3.68 high". Right at a border it gets a third decimal, so that "3.665 medium" is not read as 3.67. */
function Score({ value, level, strong = true }: { value: number; level: Level; strong?: boolean }) {
  const atBorder = [cuts.low_to_medium, cuts.medium_to_high].some((cut) => Math.abs(value - cut) < 0.005)
  return (
    <span className="whitespace-nowrap">
      <span className={cx('num', strong && 'font-bold')}>{atBorder ? value.toFixed(3) : score(value)}</span> <span className="text-[12.5px] text-ink3">{level}</span>
    </span>
  )
}

// ---------------------------------------------------------------- the matrix

const CELL = 118
const INNER = CELL * 3
const M = { left: 58, top: 28, right: 14, bottom: 48 }
const WIDTH = M.left + INNER + M.right
const HEIGHT = M.top + INNER + M.bottom
const sx = (value: number) => M.left + ((value - scale.lowest) / (scale.highest - scale.lowest)) * INNER
const sy = (value: number) => M.top + INNER - ((value - scale.lowest) / (scale.highest - scale.lowest)) * INNER
const bounds = [scale.lowest, cuts.low_to_medium, cuts.medium_to_high, scale.highest]
/** 2.3333 -> "2.33", 5 -> "5" */
const tick = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(2))

interface MatrixUnit {
  name: string
  place: Pick<Place, Dimension | 'attractiveness_level' | 'strength_level' | 'zone'>
  /** Revenue: the area of the bubble. */
  size: number
  /** How far the two scores move over the sets of weights of the sensitivity analysis. */
  ranges?: Record<Dimension, [number, number]>
  /** The cell depends on the weights: drawn with a ring in the warning colour. */
  nearBorder?: boolean
  /** Where the unit lies with the weights of the case, when the weights shown are others. */
  from?: Pick<Place, Dimension>
  /** The unit has left the cell it has with the weights of the case. */
  moved?: boolean
}

/** The grid of three by three cells, coloured by zone, with one bubble per unit. */
function Matrix({ units, label }: { units: MatrixUnit[]; label: string }) {
  const largest = Math.max(...units.map((unit) => unit.size))
  const radius = (size: number) => Math.max(6, Math.sqrt(size / largest) * 30)
  const named: Record<Zone, string> = { invest: 'high attractiveness, high strength', hold: 'medium attractiveness, medium strength', harvest: 'low attractiveness, low strength' }
  return (
    <svg width={WIDTH} height={HEIGHT} role="img" aria-label={label} className="block flex-none overflow-visible">
      {/* The nine cells */}
      {LEVELS.map((attractiveness, a) =>
        LEVELS.map((strength, st) => {
          const cell = `${attractiveness} attractiveness, ${strength} strength`
          const zone = zoneOfCell[cell]
          const x0 = sx(bounds[st]) + (st > 0 ? 1 : 0)
          const x1 = sx(bounds[st + 1]) - (st < 2 ? 1 : 0)
          const y0 = sy(bounds[a + 1]) + (a < 2 ? 1 : 0)
          const y1 = sy(bounds[a]) - (a > 0 ? 1 : 0)
          return (
            <g key={cell}>
              <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} rx={3} fill={zoneFill[zone]} stroke="#DDD5E3" />
              {named[zone] === cell && (
                <text x={zone === 'invest' ? x1 - 8 : zone === 'harvest' ? x0 + 8 : (x0 + x1) / 2} y={zone === 'invest' ? y0 + 17 : y1 - 9} textAnchor={zone === 'invest' ? 'end' : zone === 'harvest' ? 'start' : 'middle'} fontSize={12} fontWeight={600} fill={chart.ink2}>
                  {zoneLabels[zone]}
                </text>
              )}
            </g>
          )
        }),
      )}

      {/* The two axes: the scores at the borders, and the names of the three levels between them */}
      {bounds.map((value) => (
        <g key={value} fontSize={12} fill={chart.ink3} style={{ fontVariantNumeric: 'tabular-nums' }}>
          <text x={sx(value)} y={M.top + INNER + 17} textAnchor="middle">
            {tick(value)}
          </text>
          <text x={M.left - 8} y={sy(value)} dy="0.32em" textAnchor="end">
            {tick(value)}
          </text>
        </g>
      ))}
      {LEVELS.map((level, k) => (
        <g key={level} fontSize={12} fill={chart.ink2}>
          <text x={(sx(bounds[k]) + sx(bounds[k + 1])) / 2} y={M.top + INNER + 17} textAnchor="middle">
            {level}
          </text>
          <text x={M.left - 8} y={(sy(bounds[k]) + sy(bounds[k + 1])) / 2} dy="0.32em" textAnchor="end">
            {level}
          </text>
        </g>
      ))}
      <text x={0} y={12} fontSize={12} fill={chart.ink3}>
        {axes.attractiveness}
      </text>
      <text x={M.left + INNER} y={HEIGHT - 6} textAnchor="end" fontSize={12} fill={chart.ink3}>
        {axes.strength}
      </text>

      {/* The units, the largest first so that a small bubble is never hidden */}
      {[...units]
        .sort((a, b) => b.size - a.size)
        .map((unit) => {
          const x = sx(unit.place.strength)
          const y = sy(unit.place.attractiveness)
          const r = radius(unit.size)
          const half = unit.name.length * 3.4
          const labelX = Math.min(Math.max(x, M.left + half + 2), M.left + INNER - half - 2)
          const labelY = y - r - 7 < M.top + 10 ? y + r + 15 : y - r - 7
          const ring = unit.moved ? chart.primary : unit.nearBorder ? chart.warn : chart.ink2
          return (
            <g
              key={unit.name}
              tabIndex={0}
              className="outline-none"
              data-tip={`${unit.name}\n${axes.attractiveness}: ${score(unit.place.attractiveness)} (${unit.place.attractiveness_level})\n${axes.strength}: ${score(unit.place.strength)} (${unit.place.strength_level})\n${zoneLabels[unit.place.zone]}\nRevenue: ${millions(unit.size)} a year`}
            >
              {unit.from && (
                <>
                  <path d={`M${sx(unit.from.strength)} ${sy(unit.from.attractiveness)}L${x} ${y}`} stroke={chart.ink3} strokeDasharray="3 3" />
                  <circle cx={sx(unit.from.strength)} cy={sy(unit.from.attractiveness)} r={3.5} fill="#fff" stroke={chart.ink3} strokeWidth={1.5} />
                </>
              )}
              <circle className="plot-dot" cx={x} cy={y} r={r} fill="#fff" fillOpacity={0.8} stroke={ring} strokeWidth={unit.moved || unit.nearBorder ? 2.5 : 1.5} />
              {unit.ranges && (
                <path
                  d={`M${sx(unit.ranges.strength[0])} ${y}H${sx(unit.ranges.strength[1])}M${x} ${sy(unit.ranges.attractiveness[0])}V${sy(unit.ranges.attractiveness[1])}`}
                  stroke={chart.ink}
                  strokeWidth={1.5}
                  strokeLinecap="round"
                />
              )}
              <circle cx={x} cy={y} r={2.5} fill={chart.ink} />
              <text className="plot-mark" x={labelX} y={labelY} textAnchor="middle" fontSize={12.5} fontWeight={600} fill={chart.ink} stroke="#fff" strokeOpacity={0.85} strokeWidth={3} paintOrder="stroke" strokeLinejoin="round">
                {unit.name}
              </text>
            </g>
          )
        })}
    </svg>
  )
}

/** The key of the matrix: the three zones, and what the marks on a bubble mean. */
function MatrixKey({ items }: { items: ('zones' | 'size' | 'cross' | 'border' | 'from' | 'moved')[] }) {
  const ringKey = (color: string, text: string) => (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
      <svg width={14} height={14} aria-hidden="true">
        <circle cx={7} cy={7} r={5} fill="#fff" stroke={color} strokeWidth={2.5} />
      </svg>
      {text}
    </span>
  )
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink2">
      {items.includes('zones') &&
        ZONES.map((zone) => (
          <span key={zone} className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <i className="block h-3 w-4 rounded-[2.5px] border border-[#DDD5E3]" style={{ background: zoneFill[zone] }} />
            {zoneLabels[zone]}
          </span>
        ))}
      {items.includes('size') && (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <svg width={14} height={14} aria-hidden="true">
            <circle cx={7} cy={7} r={5.5} fill="#fff" stroke={chart.ink2} strokeWidth={1.5} />
            <circle cx={7} cy={7} r={1.8} fill={chart.ink} />
          </svg>
          Area: revenue
        </span>
      )}
      {items.includes('cross') && (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <svg width={14} height={14} aria-hidden="true">
            <path d="M1 7H13M7 1V13" stroke={chart.ink} strokeWidth={1.5} strokeLinecap="round" />
          </svg>
          Range of the scores over the {thousands(s.draws)} sets of weights
        </span>
      )}
      {items.includes('border') && ringKey(chart.warn, 'The cell depends on the weights')}
      {items.includes('from') && (
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <svg width={14} height={14} aria-hidden="true">
            <circle cx={7} cy={7} r={3.5} fill="#fff" stroke={chart.ink3} strokeWidth={1.5} />
          </svg>
          With the weights of the case
        </span>
      )}
      {items.includes('moved') && ringKey(chart.primary, 'Has left its cell')}
    </div>
  )
}

/** A share as a bar on a light track, with its value in ink. */
function ShareBar({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="h-3 min-w-[48px] flex-1 rounded-[3px] bg-fill">
        <i className="bar-grow block h-3 rounded-r" style={{ width: `${value * 100}%`, background: chart.slate }} />
      </span>
      <span className="num w-[46px] text-right font-bold">{share(value)}</span>
    </div>
  )
}

// ---------------------------------------------------------------- key results

function MatrixCard() {
  const { matrixCard } = s
  return (
    <Card className="p-5">
      <CardHead title={matrixCard.title} note={matrixCard.note} />
      <div className="mt-4 flex items-start gap-6">
        <div className="flex-none">
          <Matrix
            label={`${matrixCard.title}: ${s.units.map((unit) => `${unit.unit} in ${unit.zone_label}`).join(', ')}.`}
            units={s.units.map((unit) => ({
              name: unit.unit,
              place: unit,
              size: unit.size,
              ranges: { attractiveness: unit.attractiveness_range, strength: unit.strength_range },
              nearBorder: !unit.stable,
            }))}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="-mx-3">
            <table className="tbl tbl-tight">
              <thead>
                <tr>
                  <th>Business unit</th>
                  <th className="r">Attractiveness</th>
                  <th className="r">Strength</th>
                  <th className="w-[128px]">
                    <span tabIndex={0} data-tip={`In how many of the ${thousands(s.draws)} sets of weights of run GE-02 the unit lies in the same cell. Each weight is up to ${pct(s.change)} higher or lower.`}>
                      Keeps its cell
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {ZONES.map((zone) => {
                  const inZone = s.units.filter((unit) => unit.zone === zone)
                  return (
                    <Fragment key={zone}>
                      <tr>
                        <td colSpan={4} className="pt-3">
                          <span className="flex items-center gap-2">
                            <i className="block h-3 w-4 flex-none rounded-[2.5px] border border-[#DDD5E3]" style={{ background: zoneFill[zone] }} />
                            <b className="text-[13.5px]">{zoneLabels[zone]}</b>
                          </span>
                          <div className="mt-0.5 text-[12.5px] text-ink3">{zoneMeanings[zone]}</div>
                        </td>
                      </tr>
                      {inZone.length === 0 && (
                        <tr>
                          <td colSpan={4} className="text-ink3">
                            No unit lies in this zone.
                          </td>
                        </tr>
                      )}
                      {inZone.map((unit) => (
                        <tr key={unit.unit}>
                          <td className="whitespace-nowrap">
                            <span className="font-semibold">{unit.unit}</span>
                            <div className="text-[12.5px] text-ink3">{millions(unit.size)} a year</div>
                          </td>
                          <td className="r">
                            <span className="font-bold">{score(unit.attractiveness)}</span>
                            <div className="text-[12.5px] text-ink3">{unit.attractiveness_level}</div>
                          </td>
                          <td className="r">
                            <span className="font-bold">{score(unit.strength)}</span>
                            <div className="text-[12.5px] text-ink3">{unit.strength_level}</div>
                          </td>
                          <td>
                            <ShareBar value={unit.share_of_draws_in_same_cell} />
                            {!unit.stable && (
                              <Tag tone="warn" icon="alert" className="mt-1">
                                Near a border
                              </Tag>
                            )}
                          </td>
                        </tr>
                      ))}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="mt-3">
        <MatrixKey items={['zones', 'size', 'cross', 'border']} />
      </div>
      <HowToRead className="mt-4 max-w-[94ch]" lines={[...matrixCard.howToRead, matrixCard.crossNote]} />
    </Card>
  )
}

function BorderTrap() {
  const { trap } = s
  return (
    <Trap title={trap.title} className="mt-4">
      <p className="max-w-[98ch]">{trap.text}</p>
      <div className="mt-3 flex items-center gap-2.5 text-[13px] text-ink3">
        <RunTag id={s.otherRunId} /> From the least to the most firmly placed unit
      </div>
      <div className="-mx-3 mt-1">
        <table className="tbl tbl-tight text-[13px]">
          <thead>
            <tr>
              <th>Business unit</th>
              <th className="r w-[150px] whitespace-normal">Distance to the nearest border</th>
              <th className="w-[150px] whitespace-normal">Keeps its cell in the {thousands(s.draws)} sets</th>
              <th className="whitespace-normal">The one weight that moves it with the smallest change</th>
              <th>It then lies in</th>
              <th className="r whitespace-normal">Same zone without one manager</th>
            </tr>
          </thead>
          <tbody>
            {trap.rows.map((unit) => {
              const change = unit.smallest_switch
              return (
                <tr key={unit.unit}>
                  <td>
                    <span className="font-semibold text-ink">{unit.unit}</span>
                    <div className="mt-0.5">
                      <ZoneTag zone={unit.zone} />
                    </div>
                  </td>
                  <td className="r">
                    <span className={cx('font-bold', !unit.stable && 'text-ink')}>{score(unit.distance_to_nearest_cut)}</span>
                    <div className="whitespace-nowrap text-[12.5px] text-ink3">
                      {unit.nearest_cut.dimension} at {score(unit.nearest_cut.cut)}
                    </div>
                  </td>
                  <td>
                    <ShareBar value={unit.share_of_draws_in_same_cell} />
                  </td>
                  <td>{change ? `${change.label}, ${weightChange(change.change_of_weight)}` : 'None'}</td>
                  <td>
                    {change && (
                      <>
                        <ZoneTag zone={change.to_zone} />
                        <div className="mt-0.5 text-[12.5px] text-ink3">{change.to_cell}</div>
                      </>
                    )}
                  </td>
                  <td className="r">
                    {unit.same_zone_without_one_manager} of {trap.raters}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <HowToRead className="mt-3 max-w-[98ch]" lines={trap.howToRead} />
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
  const [points, setPoints] = useState(whatIf.presets[0].points)
  const shares = useMemo(() => sharesOfAxis(s.factors, points), [points])
  const places = useMemo(() => s.units.map((unit) => placeOf(unit.ratings, s.factors, points, cuts, zoneOfCell)), [points])
  const same = (preset: number[]) => preset.every((value, k) => value === points[k])
  const atCase = same(whatIf.presets[0].points)
  const moved = s.units.filter((unit, u) => places[u].cell !== unit.cell)
  /** The sliders row by row: the first factor of each axis, then the second, and so on. */
  const sliderRows = Array.from({ length: Math.max(...DIMENSIONS.map((dimension) => factorsOf(dimension).length)) }, (_, row) =>
    DIMENSIONS.map((dimension) => factorsOf(dimension)[row] as ReturnType<typeof factorsOf>[number] | undefined),
  )

  /** One weight changes. The last weight of an axis that still counts cannot be set to zero: an axis needs at least one factor. */
  const setWeight = (k: number, value: number) =>
    setPoints((old) => {
      const next = old.map((item, i) => (i === k ? value : item))
      const total = s.factors.reduce((sum, factor, i) => (factor.dimension === s.factors[k].dimension ? sum + next[i] : sum), 0)
      return total > 0 ? next : old
    })

  return (
    <Card>
      <div className="px-5 pt-4">
        <CardHead
          title={<span className="text-[16px]">{whatIf.title}</span>}
          note={whatIf.text}
          right={
            <span className="flex items-center gap-1.5">
              {whatIf.presets.map((preset) => (
                <Button key={preset.name} size="sm" onClick={() => setPoints(preset.points)} disabled={same(preset.points)}>
                  {preset.name}
                </Button>
              ))}
            </span>
          }
        />
      </div>
      <div className="flex items-start gap-6 px-5 pb-5 pt-4">
        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-2 items-end gap-x-6 gap-y-2.5">
            {DIMENSIONS.map((dimension) => (
              <p key={dimension} className="text-[13px] font-bold">
                {axes[dimension]}
              </p>
            ))}
            {sliderRows.flatMap((row) =>
              row.map((item, column) =>
                item ? (
                  <Slider key={item.factor.key} label={item.factor.label} {...whatIf.slider} value={points[item.k]} onChange={(value) => setWeight(item.k, value)} format={() => pct(shares[item.k])} />
                ) : (
                  <span key={`empty ${column}`} />
                ),
              ),
            )}
          </div>
          <div className="-mx-3 mt-4">
            <table className="tbl tbl-tight">
              <thead>
                <tr>
                  <th>Business unit</th>
                  <th>Attractiveness</th>
                  <th>Strength</th>
                  <th>Zone</th>
                </tr>
              </thead>
              <tbody>
                {s.units.map((unit, u) => {
                  const place = places[u]
                  const left = place.cell !== unit.cell
                  return (
                    <tr key={unit.unit}>
                      <td className="whitespace-nowrap font-semibold">{unit.unit}</td>
                      <td>
                        <Score value={place.attractiveness} level={place.attractiveness_level} strong={false} />
                      </td>
                      <td>
                        <Score value={place.strength} level={place.strength_level} strong={false} />
                      </td>
                      <td>
                        <ZoneTag zone={place.zone} />
                        {left && <div className="mt-0.5 text-[12.5px] font-semibold text-primary">{place.zone === unit.zone ? 'Another cell of the same zone' : `Was in “${zoneLabels[unit.zone]}”`}</div>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="flex-none">
          <Matrix
            label={`The matrix with your weights: ${s.units.map((unit, u) => `${unit.unit} in ${zoneLabels[places[u].zone]}`).join(', ')}.`}
            units={s.units.map((unit, u) => ({
              name: unit.unit,
              place: places[u],
              size: unit.size,
              from: atCase ? undefined : unit,
              moved: places[u].cell !== unit.cell,
            }))}
          />
          <div className="mt-2 max-w-[460px]">
            <MatrixKey items={atCase ? ['size'] : ['size', 'from', 'moved']} />
          </div>
        </div>
      </div>
      <div className="mx-5 flex items-start gap-6 border-t border-line2 pb-5 pt-4">
        {ZONES.map((zone) => {
          const count = places.filter((place) => place.zone === zone).length
          const before = s.units.filter((unit) => unit.zone === zone).length
          return <Stat key={zone} className="flex-1" value={String(count)} label={`in “${zoneLabels[zone]}”`} note={`With the weights of the case: ${before}`} />
        })}
        <Stat
          className="flex-1"
          value={String(moved.length)}
          label={moved.length === 1 ? 'unit has left its cell' : 'units have left their cell'}
          note={moved.length === 0 ? (atCase ? 'These are the weights of the case' : 'Every unit lies in the same cell as before') : moved.map((unit) => unit.unit).join(', ')}
        />
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- details

/** One stacked bar: the parts are the factors, the length is the score, the two lines are the borders of the grid. */
function ScoreBar({ unit, dimension }: { unit: UnitResult; dimension: Dimension }) {
  const parts = factorsOf(dimension)
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-4 flex-1 rounded-[3px] bg-fill">
        <div className="flex h-4">
          {parts.map(({ factor, k }, i) => (
            <i
              key={factor.key}
              tabIndex={0}
              data-tip={`${unit.unit}, ${factor.label}\nCounts ${pct(factor.weight)}, mean rating ${unit.ratings[k].toFixed(1)}\nAdds ${score(unit.contributions[k])} to the score of ${score(unit[dimension])}`}
              className={cx('bar-grow block h-4 border-r-2 border-white', i === parts.length - 1 && 'rounded-r')}
              style={{ width: `${(unit.contributions[k] / scale.highest) * 100}%`, background: factorFill[i % factorFill.length] }}
            />
          ))}
        </div>
        {[cuts.low_to_medium, cuts.medium_to_high].map((cut) => (
          <span key={cut} className="absolute -bottom-1 -top-1 w-px bg-ink" style={{ left: `${(cut / scale.highest) * 100}%` }} />
        ))}
      </div>
      <span className="w-[86px] flex-none">
        <Score value={unit[dimension]} level={unit[`${dimension}_level`]} />
      </span>
    </div>
  )
}

function ContributionBars() {
  const { contributions } = s.details
  return (
    <>
      <p className="mt-3 max-w-[94ch] text-[13.5px] text-ink2">{contributions.text}</p>
      <div className="mt-3 grid grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)] items-center gap-x-6 gap-y-2.5">
        <span />
        {DIMENSIONS.map((dimension) => (
          <div key={dimension} className="self-end">
            <p className="text-[13px] font-bold">{axes[dimension]}</p>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] text-ink2">
              {factorsOf(dimension).map(({ factor }, i) => (
                <span key={factor.key} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                  <i className="block h-2.5 w-2.5 rounded-[2px]" style={{ background: factorFill[i % factorFill.length] }} />
                  {factor.label} {pct(factor.weight)}
                </span>
              ))}
            </div>
          </div>
        ))}
        {s.units.map((unit) => (
          <div key={unit.unit} className="contents">
            <span className="text-[13.5px] font-semibold">{unit.unit}</span>
            {DIMENSIONS.map((dimension) => (
              <ScoreBar key={dimension} unit={unit} dimension={dimension} />
            ))}
          </div>
        ))}
      </div>
    </>
  )
}

function RatingsTable() {
  const { ratings } = s.details
  return (
    <>
      <p className="mt-3 max-w-[94ch] text-[13.5px] text-ink2">{ratings.text}</p>
      <table className="tbl tbl-tight mt-1">
        <thead>
          <tr>
            <th>Factor</th>
            <th className="r">Weight</th>
            {s.units.map((unit) => (
              <th key={unit.unit} className="r whitespace-normal">
                {unit.unit}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {DIMENSIONS.flatMap((dimension) => [
            ...factorsOf(dimension).map(({ factor, k }) => (
              <tr key={factor.key}>
                <td>{factor.label}</td>
                <td className="r text-ink2">{pct(factor.weight)}</td>
                {s.units.map((unit) => (
                  <td key={unit.unit} className="r">
                    <span tabIndex={0} data-tip={`${unit.unit}, ${factor.label}\nMean of ${unit.n_ratings} ratings: ${unit.ratings[k].toFixed(1)}\nSpread between the managers (standard deviation): ${unit.spread_between_raters[k].toFixed(2)}`}>
                      {unit.ratings[k].toFixed(1)}
                    </span>
                  </td>
                ))}
              </tr>
            )),
            <tr key={dimension}>
              <td className="font-semibold">{axes[dimension]}</td>
              <td className="r text-ink2">100%</td>
              {s.units.map((unit) => (
                <td key={unit.unit} className="r font-bold">
                  {score(unit[dimension])}
                </td>
              ))}
            </tr>,
          ])}
        </tbody>
      </table>
    </>
  )
}

function MovedUnits({ rows }: { rows: { unit: string; to_zone: Zone }[] }) {
  if (rows.length === 0) return <span className="text-ink3">No unit</span>
  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row) => (
        <div key={row.unit}>
          <div className="whitespace-nowrap font-semibold">{row.unit}</div>
          <div className="mt-0.5 flex items-center gap-1.5 whitespace-nowrap text-ink2">
            to <ZoneTag zone={row.to_zone} />
          </div>
        </div>
      ))}
    </div>
  )
}

function OneAtATimeTable() {
  const { oneAtATime } = s.details
  return (
    <>
      <p className="mt-3 max-w-[94ch] text-[13.5px] text-ink2">{oneAtATime.text}</p>
      <table className="tbl tbl-tight mt-1">
        <thead>
          <tr>
            <th>Factor</th>
            <th className="r">Weight</th>
            <th className="r border-l border-line2">{pct(s.change)} higher</th>
            <th>Units that change their cell</th>
            <th className="r border-l border-line2">{pct(s.change)} lower</th>
            <th>Units that change their cell</th>
          </tr>
        </thead>
        <tbody>
          {oneAtATime.rows.map((row) => (
            <tr key={row.factor.key}>
              <td className="whitespace-nowrap">
                <span className="font-semibold">{row.factor.label}</span>
                <div className="text-[12.5px] text-ink3">{axes[row.factor.dimension]}</div>
              </td>
              <td className="r">{pct(row.factor.weight)}</td>
              <td className="r border-l border-line2 text-ink2">{pct(row.up.weight_after, 1)}</td>
              <td>
                <MovedUnits rows={row.up.units_that_change_cell} />
              </td>
              <td className="r border-l border-line2 text-ink2">{pct(row.down.weight_after, 1)}</td>
              <td>
                <MovedUnits rows={row.down.units_that_change_cell} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

function RatersTable() {
  const { raters } = s.details
  return (
    <>
      <p className="mt-3 max-w-[94ch] text-[13.5px] text-ink2">{raters.text}</p>
      <table className="tbl tbl-tight mt-1 max-w-[620px]">
        <thead>
          <tr>
            <th>Left out</th>
            <th>Units that change their cell</th>
          </tr>
        </thead>
        <tbody>
          {raters.rows.map((row) => (
            <tr key={row.manager}>
              <td className="num w-[110px] font-semibold">{row.manager}</td>
              <td>
                <MovedUnits rows={row.moved.map((unit) => ({ unit: unit.unit, to_zone: unit.zone }))} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  )
}

// ---------------------------------------------------------------- screen

export default function GeMatrix() {
  const toInterpretation = useInterpretation()
  const { details } = s
  return (
    <Page crumbs={[course.name, caseBrief.name, 'GE McKinsey matrix', s.runId]}>
      <RunHeader id={s.runId} summary={s.summary} setupTo={`/ge-matrix/setup/${s.runId}`} compareTo={`/runs?a=${s.runId}&b=${s.otherRunId}`} onInterpret={toInterpretation} />

      <div className="mt-8">
        <Layer n={1} title="Headline" note="The one thing to take away">
          <Headline wide>{s.headline}</Headline>
          <Stats className="mt-6" items={s.stats} />
        </Layer>

        <Layer n={2} title="Key results" note="Enough for most decisions">
          <MatrixCard />
          <BorderTrap />
        </Layer>

        <Layer n={3} title="What if" note="Weights of your own">
          <WhatIf />
        </Layer>

        <Layer n={4} title="Details" note="Open what you need">
          <Accordion title={details.contributions.title} note={details.contributions.note}>
            <ContributionBars />
          </Accordion>
          <Accordion title={details.ratings.title} note={details.ratings.note} icon="table">
            <RatingsTable />
          </Accordion>
          <Accordion title={details.oneAtATime.title} note={details.oneAtATime.note}>
            <OneAtATimeTable />
          </Accordion>
          <Accordion title={details.raters.title} note={details.raters.note}>
            <RatersTable />
          </Accordion>
        </Layer>

        <Layer n={5} title="Interpretation" note="Your reading first, then the coach" id={INTERPRETATION} last>
          <CoachCard script={s.coach} />
        </Layer>
      </div>
    </Page>
  )
}
