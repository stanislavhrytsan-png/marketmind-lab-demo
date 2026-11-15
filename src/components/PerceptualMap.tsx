/**
 * The perceptual map: one flat 2D chart with brands, attribute lines and
 * segment preference arrows. Drawn with Recharts (a scatter chart with
 * reference lines). Every point and arrow has a tooltip.
 */
import { ReferenceLine, Scatter, ScatterChart, XAxis, YAxis } from 'recharts'
import type { ScatterShapeProps } from 'recharts'
import { positioning, segments } from '../data/alpineOat'
import { SegName } from './ui'

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
        x={brand.label === 'left' ? cx - 14 : cx + gap}
        y={cy + 5}
        textAnchor={brand.label === 'left' ? 'end' : 'start'}
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
  const label =
    attribute.label === 'top'
      ? { x: cx, y: cy - 10, anchor: 'middle' as const }
      : attribute.label === 'topLeft'
        ? { x: cx - 8, y: cy - 6, anchor: 'end' as const }
        : { x: cx + 8, y: cy + 4, anchor: 'start' as const }
  return (
    <g tabIndex={0} data-tip={`Attribute: ${attribute.name}. A brand far along this line scores high on it.`} className="outline-none">
      <circle cx={cx} cy={cy} r={2.5} fill="#8D94A3" />
      <text x={label.x} y={label.y} textAnchor={label.anchor} fontSize={13} fontStyle="italic" fill="#475066">
        {attribute.name}
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
  // An HTML label keeps the segment's marker and name together, on either side of the arrow.
  const box =
    preference.label === 'left'
      ? { x: cx - 18 - 160, y: cy - 12, align: 'right' as const }
      : preference.label === 'below'
        ? { x: cx - 5, y: cy + 14, align: 'left' as const }
        : { x: cx + 10, y: cy - 6, align: 'left' as const }
  return (
    <g>
      <path d="M3.5 0L-14 -8.75V8.75Z" fill={segment.color} transform={`translate(${cx} ${cy}) rotate(${angle})`} />
      <foreignObject x={box.x} y={box.y} width={160} height={22}>
        <div style={{ textAlign: box.align, fontSize: 13, lineHeight: '22px' }}>
          <SegName segment={segment.id} />
        </div>
      </foreignObject>
    </g>
  )
}

export function PerceptualMap({ layers }: { layers: MapLayers }) {
  const grid = [-2, -1, 1, 2]
  return (
    <ScatterChart width={WIDTH} height={HEIGHT} margin={MARGIN} accessibilityLayer={false}>
      <XAxis type="number" dataKey="x" domain={[-X_RANGE, X_RANGE]} hide />
      <YAxis type="number" dataKey="y" domain={[-Y_RANGE, Y_RANGE]} hide />

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
