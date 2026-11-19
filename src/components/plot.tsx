/**
 * A small kit for the charts of the further modules: lines, points, columns
 * and bands on one pair of axes, drawn as plain SVG.
 *
 * Rules from the style guide: 2D only, one axis per chart, bars start at
 * zero, quiet grid lines, values in ink (never in the data colour), and a
 * tooltip on hover or keyboard focus (data-tip, see Tooltip.tsx). A chart
 * with two or more series gets a legend, and only a few direct labels.
 *
 * Colours, scales and tick values are in src/lib/plot.ts.
 */
import type { ReactNode } from 'react'
import { cx } from '../lib/demo'
import { chart, linear, linePath, niceTicks, useWidth } from '../lib/plot'
import type { Scale } from '../lib/plot'

// ---------------------------------------------------------------- the frame

export interface Frame {
  sx: Scale
  sy: Scale
  left: number
  right: number
  top: number
  bottom: number
  width: number
  height: number
}

export interface Tick {
  value: number
  label: string
}

/**
 * The frame of a chart: grid lines, tick labels and axis titles. The marks
 * are drawn by the children, which get the two scales.
 */
export function Plot({
  height,
  x,
  y,
  xTicks = [],
  yTicks,
  yFormat = (value) => String(value),
  xLabel,
  yLabel,
  label,
  margin,
  fallbackWidth = 600,
  className,
  children,
}: {
  height: number
  /** The values at the left and right end of the x axis. */
  x: [number, number]
  /** The values at the bottom and top of the y axis. */
  y: [number, number]
  xTicks?: Tick[]
  yTicks?: number[]
  yFormat?: (value: number) => string
  xLabel?: string
  /** Written above the plot, on the left: what the y axis counts. */
  yLabel?: string
  /** What the chart shows, for screen readers. */
  label: string
  margin?: Partial<{ top: number; right: number; bottom: number; left: number }>
  fallbackWidth?: number
  className?: string
  children: (frame: Frame) => ReactNode
}) {
  const [box, width] = useWidth<HTMLDivElement>(fallbackWidth)
  const m = { top: yLabel ? 26 : 10, right: 12, bottom: xLabel ? 44 : 26, left: 48, ...margin }
  const frame: Frame = {
    left: m.left,
    right: Math.max(m.left + 10, width - m.right),
    top: m.top,
    bottom: height - m.bottom,
    width,
    height,
    sx: () => 0,
    sy: () => 0,
  }
  frame.sx = linear(x[0], x[1], frame.left, frame.right)
  frame.sy = linear(y[0], y[1], frame.bottom, frame.top)
  const ticks = yTicks ?? niceTicks(y[0], y[1])

  return (
    <div ref={box} className={cx('w-full', className)}>
      <svg width={width} height={height} role="img" aria-label={label} className="block overflow-visible">
        {ticks.map((tick) => (
          <g key={tick}>
            <path d={`M${frame.left} ${frame.sy(tick)}H${frame.right}`} stroke={tick === 0 ? chart.axis : chart.grid} />
            <text
              x={frame.left - 8}
              y={frame.sy(tick)}
              dy="0.32em"
              textAnchor="end"
              fontSize={12}
              fill={chart.ink3}
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {yFormat(tick)}
            </text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <text key={tick.value} x={frame.sx(tick.value)} y={frame.bottom + 17} textAnchor="middle" fontSize={12} fill={chart.ink3}>
            {tick.label}
          </text>
        ))}
        {yLabel && (
          <text x={0} y={11} fontSize={12} fill={chart.ink3}>
            {yLabel}
          </text>
        )}
        {xLabel && (
          <text x={frame.right} y={height - 6} textAnchor="end" fontSize={12} fill={chart.ink3}>
            {xLabel}
          </text>
        )}
        {children(frame)}
      </svg>
    </div>
  )
}

// ---------------------------------------------------------------- marks

/** A 2 px line through the points, already in pixels. Dashed for a forecast or a what-if. */
export function Line({
  points,
  color,
  width = 2,
  dashed = false,
  opacity,
}: {
  points: ([number, number] | null)[]
  color: string
  width?: number
  dashed?: boolean
  opacity?: number
}) {
  return (
    <path
      className="plot-line"
      d={linePath(points)}
      fill="none"
      stroke={color}
      strokeWidth={width}
      strokeLinejoin="round"
      strokeLinecap="round"
      strokeDasharray={dashed ? '5 5' : undefined}
      opacity={opacity}
    />
  )
}

/** A light wash between two lines, for a range. */
export function Band({ upper, lower, color, opacity = 0.12 }: { upper: [number, number][]; lower: [number, number][]; color: string; opacity?: number }) {
  if (upper.length === 0) return null
  const d = `${linePath(upper)}${linePath([...lower].reverse()).replace('M', 'L')}Z`
  return <path className="plot-band" d={d} fill={color} opacity={opacity} />
}

/** A point with a white ring, so that it stays readable on a line. With a tip it can be hovered and focused. */
export function Dot({
  x,
  y,
  r = 4,
  color,
  hollow = false,
  tip,
}: {
  x: number
  y: number
  r?: number
  color: string
  /** A ring instead of a filled point, for example for a value that is only planned. */
  hollow?: boolean
  tip?: string
}) {
  const mark = hollow ? (
    <circle className="plot-dot" cx={x} cy={y} r={r} fill="#fff" stroke={color} strokeWidth={2} />
  ) : (
    <circle className="plot-dot" cx={x} cy={y} r={r + 1} fill={color} stroke="#fff" strokeWidth={2} />
  )
  if (!tip) return mark
  return (
    <g tabIndex={0} data-tip={tip} className="outline-none">
      {/* The hit area is larger than the mark. */}
      <circle cx={x} cy={y} r={12} fill="transparent" />
      {mark}
    </g>
  )
}

/** A column from the baseline to a value: rounded at the data end, square at the baseline. */
export function Column({
  x,
  y,
  base,
  width,
  color,
  tip,
  opacity,
}: {
  /** Centre of the column, in pixels. */
  x: number
  y: number
  base: number
  width: number
  color: string
  tip?: string
  opacity?: number
}) {
  const w = Math.min(width, 24)
  const left = x - w / 2
  const up = y <= base
  const h = Math.abs(base - y)
  const r = Math.min(4, w / 2, h)
  const d = up
    ? `M${left} ${base}V${y + r}a${r} ${r} 0 0 1 ${r} ${-r}H${left + w - r}a${r} ${r} 0 0 1 ${r} ${r}V${base}Z`
    : `M${left} ${base}V${y - r}a${r} ${r} 0 0 0 ${r} ${r}H${left + w - r}a${r} ${r} 0 0 0 ${r} ${-r}V${base}Z`
  return (
    <g tabIndex={tip ? 0 : undefined} data-tip={tip} className="outline-none">
      {tip && <rect x={x - width / 2} y={Math.min(y, base) - 6} width={width} height={h + 12} fill="transparent" />}
      <path className="plot-column" d={d} fill={color} opacity={opacity} style={{ transformOrigin: `0 ${base}px` }} />
    </g>
  )
}

/** A text inside the plot. The white halo keeps it readable where it crosses a line. */
export function Mark({
  x,
  y,
  anchor = 'start',
  strong = false,
  color = chart.ink2,
  children,
}: {
  x: number
  y: number
  anchor?: 'start' | 'middle' | 'end'
  strong?: boolean
  color?: string
  children: ReactNode
}) {
  return (
    <text
      className="plot-mark"
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={12.5}
      fontWeight={strong ? 600 : 400}
      fill={color}
      stroke="#fff"
      strokeWidth={3}
      paintOrder="stroke"
      strokeLinejoin="round"
    >
      {children}
    </text>
  )
}

/** A vertical hairline with a small label at its top, for example the peak or the best price. */
export function VRule({ x, top, bottom, color = chart.ink3, dashed = true }: { x: number; top: number; bottom: number; color?: string; dashed?: boolean }) {
  return <path d={`M${x} ${top}V${bottom}`} stroke={color} strokeDasharray={dashed ? '3 3' : undefined} />
}

/** A horizontal hairline across the plot, for example the market potential or the acquisition cost. */
export function HRule({ y, left, right, color = chart.ink3, dashed = true }: { y: number; left: number; right: number; color?: string; dashed?: boolean }) {
  return <path d={`M${left} ${y}H${right}`} stroke={color} strokeDasharray={dashed ? '3 3' : undefined} />
}

/**
 * One invisible column per x position. Hovering it shows a hairline and one
 * tooltip with the values of every series at that position, so the pointer
 * never has to hit a 2 px line. Draw it last, on top of the marks.
 */
export function HoverColumns({ frame, items, focusable = false }: { frame: Frame; items: { x: number; tip: string }[]; focusable?: boolean }) {
  return (
    <>
      {items.map((item, i) => {
        const from = i === 0 ? frame.left : (items[i - 1].x + item.x) / 2
        const to = i === items.length - 1 ? frame.right : (item.x + items[i + 1].x) / 2
        return (
          <g key={i} data-tip={item.tip} tabIndex={focusable ? 0 : undefined} className="group/col outline-none">
            <rect x={from} y={frame.top} width={Math.max(0, to - from)} height={frame.bottom - frame.top} fill="transparent" />
            <path
              d={`M${item.x} ${frame.top}V${frame.bottom}`}
              stroke={chart.ink3}
              className="opacity-0 transition-opacity duration-150 ease-std group-hover/col:opacity-60 group-focus/col:opacity-60"
            />
          </g>
        )
      })}
    </>
  )
}

// ---------------------------------------------------------------- legend

export interface LegendItem {
  label: ReactNode
  color: string
  mark?: 'line' | 'dash' | 'dot' | 'ring' | 'bar' | 'band'
}

/** The key of a chart: one small mark per series, with its name in ink. */
export function Legend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <div className={cx('flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-ink2', className)}>
      {items.map((item, i) => (
        <span key={i} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <svg width={item.mark === 'dot' || item.mark === 'ring' ? 12 : 22} height={12} aria-hidden="true" className="flex-none">
            {(item.mark ?? 'line') === 'line' && <path d="M1 6H21" stroke={item.color} strokeWidth={2} strokeLinecap="round" />}
            {item.mark === 'dash' && <path d="M1 6H21" stroke={item.color} strokeWidth={2} strokeLinecap="round" strokeDasharray="5 4" />}
            {item.mark === 'dot' && <circle cx={6} cy={6} r={4.5} fill={item.color} />}
            {item.mark === 'ring' && <circle cx={6} cy={6} r={4} fill="#fff" stroke={item.color} strokeWidth={2} />}
            {item.mark === 'bar' && <rect x={1} y={1} width={20} height={10} rx={2.5} fill={item.color} />}
            {item.mark === 'band' && <rect x={1} y={1} width={20} height={10} rx={2.5} fill={item.color} opacity={0.22} />}
          </svg>
          {item.label}
        </span>
      ))}
    </div>
  )
}
