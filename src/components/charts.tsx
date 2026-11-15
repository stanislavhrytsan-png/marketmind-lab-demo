/**
 * Charts drawn with Recharts. Rules from the style guide: 2D only, bars start
 * at zero, one axis per chart, values printed in ink next to the bars, and a
 * tooltip on hover or keyboard focus.
 *
 * Recharts works out the scales and animates the bars. The bars themselves are
 * custom shapes, so they carry the same tooltip as every other element
 * (data-tip, see Tooltip.tsx).
 */
import { Bar, BarChart, ReferenceLine, XAxis, YAxis } from 'recharts'
import type { BarShapeProps } from 'recharts'
import { signed } from '../lib/conjoint'

const INK = '#1B2230'
const INK2 = '#475066'
const FILL = '#EEF0F4'

/** Category label on the left edge of the chart, left-aligned like a table cell. */
function leftTick(isStrong: (index: number) => boolean) {
  return function Tick({ y, payload, index }: { y?: number | string; payload?: { value?: string }; index?: number }) {
    const strong = isStrong(index ?? 0)
    return (
      <text x={0} y={y} dy="0.35em" fontSize={13} fontWeight={strong ? 600 : 400} fill={strong ? INK : INK2}>
        {payload?.value}
      </text>
    )
  }
}

/** A rectangle with rounded corners on one end only. */
function barPath(x: number, y: number, w: number, h: number, roundRight: boolean, r: number) {
  const radius = Math.min(r, w, h / 2)
  return roundRight
    ? `M${x} ${y}H${x + w - radius}a${radius} ${radius} 0 0 1 ${radius} ${radius}V${y + h - radius}a${radius} ${radius} 0 0 1 -${radius} ${radius}H${x}Z`
    : `M${x + w} ${y}H${x + radius}a${radius} ${radius} 0 0 0 -${radius} ${radius}V${y + h - radius}a${radius} ${radius} 0 0 0 ${radius} ${radius}H${x + w}Z`
}

// ---------------------------------------------------------------- part-worths

export interface PartWorthRow {
  level: string
  value: number
  /** The most preferred level of the attribute is set in bold. */
  best: boolean
  tip: string
}

const PW_LABEL = 122 // label column plus gap
const PW_VALUE = 54 // gap plus value column
const PW_ROW = 24

/**
 * Diverging bars around zero: how much each level of one attribute adds to,
 * or takes from, the chance of being chosen.
 */
export function PartWorthChart({
  rows,
  color,
  extent,
  animate = false,
}: {
  rows: PartWorthRow[]
  color: string
  /** The axis runs from -extent to +extent, the same for every attribute in view. */
  extent: number
  /** Move the bars (200 ms) when the values change. Off until the student changes the view. */
  animate?: boolean
}) {
  const shape = (props: BarShapeProps) => {
    const { x, y, width, height, parentViewBox } = props
    const row = props.payload as PartWorthRow
    const left = Math.min(x, x + width)
    const w = Math.abs(width)
    return (
      <g data-tip={row.tip} tabIndex={0} className="outline-none">
        <rect x={0} y={y - (PW_ROW - height) / 2} width={parentViewBox.width} height={PW_ROW} fill="transparent" />
        <path d={barPath(left, y, w, height, row.value >= 0, 3)} fill={color} />
        <text
          x={parentViewBox.width}
          y={y + height / 2}
          dy="0.35em"
          textAnchor="end"
          fontSize={13}
          fontWeight={600}
          fill={INK}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {signed(row.value)}
        </text>
      </g>
    )
  }

  return (
    <BarChart
      layout="vertical"
      responsive
      accessibilityLayer={false}
      data={rows}
      margin={{ top: 0, right: PW_VALUE, bottom: 0, left: 0 }}
      style={{ width: '100%', height: rows.length * PW_ROW }}
    >
      <XAxis type="number" domain={[-extent, extent]} hide />
      <YAxis
        type="category"
        dataKey="level"
        width={PW_LABEL}
        axisLine={false}
        tickLine={false}
        interval={0}
        tick={leftTick((i) => rows[i]?.best ?? false)}
      />
      <ReferenceLine x={0} stroke="#AEB4C0" />
      <Bar
        dataKey="value"
        barSize={12}
        shape={shape}
        isAnimationActive={animate}
        animationDuration={200}
        animationEasing="ease-out"
      />
    </BarChart>
  )
}

// ---------------------------------------------------------------- bars on a track

export interface TrackRow {
  label: string
  value: number
  color: string
  /** Text printed right of the bar, for example "43%". */
  text: string
  tip: string
}

const TRACK_ROW = 28

/** Horizontal bars on a light track, with the label on the left and the value on the right. */
export function TrackBarChart({
  rows,
  max,
  labelWidth,
  valueWidth = 40,
}: {
  rows: TrackRow[]
  /** Value at the right end of the track. */
  max: number
  labelWidth: number
  valueWidth?: number
}) {
  const shape = (props: BarShapeProps) => {
    const { x, y, width, height, parentViewBox } = props
    const row = props.payload as TrackRow
    return (
      <g data-tip={row.tip} tabIndex={0} className="outline-none">
        <rect x={0} y={y - (TRACK_ROW - height) / 2} width={parentViewBox.width} height={TRACK_ROW} fill="transparent" />
        <path d={barPath(x, y, Math.max(width, 0), height, true, 4)} fill={row.color} />
        <text
          x={parentViewBox.width}
          y={y + height / 2}
          dy="0.35em"
          textAnchor="end"
          fontSize={13.5}
          fontWeight={600}
          fill={INK}
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          {row.text}
        </text>
      </g>
    )
  }

  return (
    <BarChart
      layout="vertical"
      responsive
      accessibilityLayer={false}
      data={rows}
      margin={{ top: 0, right: valueWidth + 10, bottom: 0, left: 0 }}
      style={{ width: '100%', height: rows.length * TRACK_ROW }}
    >
      <XAxis type="number" domain={[0, max]} hide />
      <YAxis
        type="category"
        dataKey="label"
        width={labelWidth + 10}
        axisLine={false}
        tickLine={false}
        interval={0}
        tick={leftTick(() => false)}
      />
      <Bar
        dataKey="value"
        barSize={14}
        background={{ fill: FILL, radius: 3 }}
        shape={shape}
        isAnimationActive={false}
      />
    </BarChart>
  )
}
