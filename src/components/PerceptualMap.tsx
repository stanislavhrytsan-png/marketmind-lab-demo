/**
 * The perceptual map: one flat 2D chart with brands, attribute lines and
 * segment preference arrows. Drawn with Recharts (a scatter chart with
 * reference lines). Every point and arrow has a tooltip.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import { ReferenceLine, Scatter, ScatterChart, XAxis, YAxis } from 'recharts'
import type { ScatterShapeProps } from 'recharts'
import { positioning, segments } from '../data/alpineOat'
import type { Segment } from '../data/alpineOat'

const WIDTH = 780
const HEIGHT = 600
// The plot area gives both dimensions the same scale: 114 px per unit.
const MARGIN = { top: 21, right: 65.4, bottom: 9, left: 85.4 }
const X_RANGE = 2.76
const Y_RANGE = 2.5
const UNIT = 114

const INK = '#1B2230'
const PRIMARY = '#5B2B6E'

export interface MapLayers {
  brands: boolean
  attributes: boolean
  preferences: boolean
}

type Brand = (typeof positioning.brands)[number]
type Attribute = (typeof positioning.attributes)[number]
type Preference = (typeof positioning.preferences)[number]

const origin = { x: 0, y: 0 }
/** Two invisible points in opposite corners. They keep the axes in place when every layer is hidden. */
const corners = [
  { x: -X_RANGE, y: -Y_RANGE },
  { x: X_RANGE, y: Y_RANGE },
]
const nothing = () => <g />

function BrandPoint(props: ScatterShapeProps) {
  const { cx = 0, cy = 0 } = props
  const brand = props.payload as Brand
  const gap = brand.own ? 19 : 13
  return (
    <g>
      {brand.own && <circle cx={cx} cy={cy} r={13} fill="none" stroke={PRIMARY} strokeWidth={1.5} />}
      <circle
        cx={cx}
        cy={cy}
        r={brand.own ? 8 : 6}
        fill={brand.own ? PRIMARY : INK}
        stroke="#fff"
        strokeWidth={2}
        tabIndex={0}
        data-tip={`${brand.name}. ${brand.tip}`}
        className="outline-none"
      />
      <text
        x={brand.label === 'belowLeft' ? cx + 8 : brand.label === 'left' ? cx - gap - 1 : cx + gap}
        y={brand.label === 'belowLeft' ? cy + gap + 14 : cy + 5}
        textAnchor={brand.label === 'right' ? 'start' : 'end'}
        fontSize={13.5}
        fontWeight={700}
        fill={INK}
      >
        {brand.name}
      </text>
    </g>
  )
}

function AttributePoint(props: ScatterShapeProps) {
  const { cx = 0, cy = 0 } = props
  const attribute = props.payload as Attribute
  // Where the name sits, relative to the end of the line.
  const places = {
    top: { x: cx, y: cy - 10, anchor: 'middle' as const },
    below: { x: cx, y: cy + 20, anchor: 'middle' as const },
    topLeft: { x: cx - 8, y: cy - 6, anchor: 'end' as const },
    right: { x: cx + 8, y: cy + 4, anchor: 'start' as const },
    rightUp: { x: cx + 8, y: cy - 3, anchor: 'start' as const },
    rightDown: { x: cx + 8, y: cy + 13, anchor: 'start' as const },
  }
  const label = places[attribute.label]
  return (
    <g tabIndex={0} data-tip={`Attribute: ${attribute.name}. A brand far along this line scores high on it.`} className="outline-none">
      <circle cx={cx} cy={cy} r={2.5} fill="#8D94A3" />
      <text x={label.x} y={label.y} textAnchor={label.anchor} fontSize={13} fontStyle="italic" fill="#475066">
        {attribute.name}
      </text>
    </g>
  )
}

/**
 * A segment's marker and name next to its arrow, as plain SVG. The text is
 * measured once it is on screen, so the marker can sit in front of a
 * right-aligned name too.
 */
function SegmentLabel({ segment, x, y, align }: { segment: Segment; x: number; y: number; align: 'start' | 'end' }) {
  const text = useRef<SVGTextElement>(null)
  // A first guess of about 6.6 px per letter, replaced by the measured width.
  const [width, setWidth] = useState(segment.name.length * 6.6)
  useLayoutEffect(() => {
    const measured = text.current?.getComputedTextLength()
    if (measured) setWidth(measured)
  }, [segment.name])

  // Centre of the marker: 12 px in front of the first letter, a little above the baseline.
  const mx = (align === 'end' ? x - width : x) - 12
  const my = y - 4.5
  return (
    <g>
      {segment.shape === 'circle' && <circle cx={mx} cy={my} r={5} fill={segment.color} />}
      {segment.shape === 'square' && <rect x={mx - 5} y={my - 5} width={10} height={10} rx={1.5} fill={segment.color} />}
      {segment.shape === 'triangle' && (
        <path d={`M${mx} ${my - 5.5}L${mx + 5.5} ${my + 5}H${mx - 5.5}Z`} fill={segment.color} />
      )}
      <text ref={text} x={x} y={y} textAnchor={align} fontSize={13} fontWeight={600} fill={INK}>
        {segment.name}
      </text>
    </g>
  )
}

/** Arrow head and label at the end of a segment's preference arrow. */
function PreferenceEnd(props: ScatterShapeProps) {
  const { cx = 0, cy = 0 } = props
  const preference = props.payload as Preference
  const segment = segments.find((s) => s.id === preference.segment)!
  // Both axes share one scale, so the angle on screen follows from the data.
  const angle = (Math.atan2(-preference.y, preference.x) * 180) / Math.PI
  // Where the name starts (or ends), relative to the tip of the arrow.
  const places = {
    left: { x: cx - 18, y: cy + 2, align: 'end' as const },
    below: { x: cx + 14, y: cy + 26, align: 'start' as const },
    above: { x: cx + 14, y: cy - 16, align: 'start' as const },
    right: { x: cx + 28, y: cy + 6, align: 'start' as const },
  }
  const label = places[preference.label]
  return (
    <g>
      <path d="M3.5 0L-14 -8.75V8.75Z" fill={segment.color} transform={`translate(${cx} ${cy}) rotate(${angle})`} />
      <SegmentLabel segment={segment} x={label.x} y={label.y} align={label.align} />
    </g>
  )
}

export function PerceptualMap({ layers }: { layers: MapLayers }) {
  const grid = [-2, -1, 1, 2]
  return (
    <ScatterChart width={WIDTH} height={HEIGHT} margin={MARGIN} accessibilityLayer={false}>
      <XAxis type="number" dataKey="x" domain={[-X_RANGE, X_RANGE]} hide />
      <YAxis type="number" dataKey="y" domain={[-Y_RANGE, Y_RANGE]} hide />
      <Scatter data={corners} shape={nothing} isAnimationActive={false} />

      {grid.map((v) => (
        <ReferenceLine key={`x${v}`} x={v} stroke="#F0F1F4" zIndex={10} />
      ))}
      {grid.map((v) => (
        <ReferenceLine key={`y${v}`} y={v} stroke="#F0F1F4" zIndex={10} />
      ))}
      <ReferenceLine x={0} stroke="#C3C8D2" zIndex={20} />
      <ReferenceLine y={0} stroke="#C3C8D2" zIndex={20} />

      {/* axis titles, placed in pixels on the fixed-size chart */}
      <text x={WIDTH - MARGIN.right} y={MARGIN.top + (Y_RANGE * UNIT) - 8} textAnchor="end" fontSize={12} fill="#636B7D">
        {positioning.axes.x}
      </text>
      <text x={MARGIN.left + X_RANGE * UNIT + 8} y={MARGIN.top + 10} fontSize={12} fill="#636B7D">
        {positioning.axes.y}
      </text>

      {layers.attributes &&
        positioning.attributes.map((a) => (
          <ReferenceLine key={a.name} segment={[origin, { x: a.x, y: a.y }]} stroke="#A7ADBA" strokeWidth={1.2} zIndex={30} />
        ))}
      {layers.attributes && (
        <Scatter data={positioning.attributes} shape={AttributePoint} isAnimationActive={false} zIndex={40} />
      )}

      {layers.preferences &&
        positioning.preferences.map((p) => {
          const segment = segments.find((s) => s.id === p.segment)!
          return (
            <ReferenceLine
              key={p.segment}
              segment={[origin, { x: p.x, y: p.y }]}
              stroke={segment.color}
              strokeWidth={2.5}
              zIndex={50}
              tabIndex={0}
              data-tip={`${segment.name} (${segment.share}% of respondents). ${positioning.arrowTip}`}
            />
          )
        })}
      {layers.preferences && (
        <Scatter data={positioning.preferences} shape={PreferenceEnd} isAnimationActive={false} zIndex={60} />
      )}

      {layers.brands && <Scatter data={positioning.brands} shape={BrandPoint} isAnimationActive={false} zIndex={70} />}
    </ScatterChart>
  )
}
