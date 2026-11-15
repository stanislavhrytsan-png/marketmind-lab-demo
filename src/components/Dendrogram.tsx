/**
 * The tree from hierarchical clustering (run SEG-01), drawn as plain SVG.
 * Each segment's branch keeps the segment colour up to the cut line. Above
 * the cut the tree is grey, because there the segments are merged.
 */
import { segmentationResults, segments } from '../data/alpineOat'
import type { Segment, TreeNode } from '../data/alpineOat'

const W = 670
const H = 320
const LEFT = 54
const RIGHT = 654
const BASE = 246 // y of distance 0
const STEP = 20.17 // px per unit of distance
const FIRST_LEAF = 81.3
const LEAF_GAP = 54.54
const GREY = '#8D94A3'

const y = (distance: number) => BASE - distance * STEP

interface Drawn {
  /** x of the vertical line that leaves this node upwards. */
  x: number
  /** Distance at which this node was formed (0 for a leaf). */
  at: number
  lines: string[]
  leaves: { x: number; n: number }[]
}

/** Lays out one subtree from the given leaf index onwards and returns its lines. */
function draw(node: TreeNode, firstLeaf: number): Drawn {
  if ('n' in node) {
    const x = FIRST_LEAF + firstLeaf * LEAF_GAP
    return { x, at: 0, lines: [], leaves: [{ x, n: node.n }] }
  }
  const left = draw(node.left, firstLeaf)
  const right = draw(node.right, firstLeaf + left.leaves.length)
  const top = y(node.at)
  return {
    x: (left.x + right.x) / 2,
    at: node.at,
    lines: [
      ...left.lines,
      ...right.lines,
      `M${left.x} ${y(left.at)}V${top}`,
      `M${right.x} ${y(right.at)}V${top}`,
      `M${left.x} ${top}H${right.x}`,
    ],
    leaves: [...left.leaves, ...right.leaves],
  }
}

export function Dendrogram() {
  const { tree } = segmentationResults
  const cut = y(tree.cutAt)

  // One branch per segment, laid out left to right.
  const branches = segments.reduce<(Drawn & { segment: Segment })[]>((done, segment) => {
    const leavesSoFar = done.reduce((sum, b) => sum + b.leaves.length, 0)
    return [...done, { segment, ...draw(tree[segment.id], leavesSoFar) }]
  }, [])
  const [health, taste, price] = branches
  const healthTaste = (health.x + taste.x) / 2
  const mergeHT = y(tree.mergeHealthTaste)
  const mergeAll = y(tree.mergeAll)
  const ticks = [0, 2, 4, 6, 8, 10]

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Dendrogram. Cutting the tree at distance ${tree.cutAt} gives three segments.`}
      className="flex-none"
    >
      {/* distance axis */}
      {ticks.map((t) => (
        <g key={t}>
          <path d={`M${LEFT} ${y(t)}H${RIGHT}`} stroke="#ECEEF2" />
          <text x={46} y={y(t) + 4} textAnchor="end" fontSize={12} fill="#636B7D">
            {t}
          </text>
        </g>
      ))}
      <text transform="translate(14 130) rotate(-90)" textAnchor="middle" fontSize={12} fill="#636B7D">
        {tree.axisLabel}
      </text>

      {/* one coloured branch per segment, up to the cut line */}
      {branches.map((b) => (
        <g key={b.segment.id} stroke={b.segment.color} strokeWidth={2} fill="none">
          {b.lines.map((d) => (
            <path key={d} d={d} />
          ))}
          <path d={`M${b.x} ${y(b.at)}V${cut}`} />
        </g>
      ))}

      {/* above the cut: the merges between segments */}
      <g stroke={GREY} strokeWidth={1.5} fill="none">
        <path d={`M${health.x} ${cut}V${mergeHT}`} />
        <path d={`M${taste.x} ${cut}V${mergeHT}`} />
        <path d={`M${health.x} ${mergeHT}H${taste.x}`} />
        <path d={`M${healthTaste} ${mergeHT}V${mergeAll}`} />
        <path d={`M${price.x} ${cut}V${mergeAll}`} />
        <path d={`M${healthTaste} ${mergeAll}H${price.x}`} />
      </g>

      {/* leaves: small groups of similar respondents, labelled with their size */}
      {branches.flatMap((b) =>
        b.leaves.map((leaf) => (
          <text
            key={leaf.x}
            x={leaf.x}
            y={262}
            textAnchor="middle"
            fontSize={12}
            fill="#636B7D"
            tabIndex={0}
            data-tip={`A group of ${leaf.n} similar respondents, part of ${b.segment.name}`}
          >
            {leaf.n}
          </text>
        )),
      )}

      {/* the segment each branch becomes */}
      {branches.map((b) => {
        const first = b.leaves[0].x
        const last = b.leaves[b.leaves.length - 1].x
        const middle = (first + last) / 2
        return (
          <g key={b.segment.id}>
            <rect x={first - 26} y={272} width={last - first + 52} height={5} rx={2.5} fill={b.segment.color} />
            <text x={middle} y={296} textAnchor="middle" fontSize={13} fontWeight={600} fill="#1B2230">
              {b.segment.name}
            </text>
            <text x={middle} y={312} textAnchor="middle" fontSize={12} fill="#636B7D">
              {b.segment.n} respondents
            </text>
          </g>
        )
      })}

      {/* the cut */}
      <path d={`M${LEFT} ${cut}H${RIGHT}`} stroke="#5B2B6E" strokeWidth={1.5} strokeDasharray="5 4" />
      <rect x={468} y={cut - 24} width={186} height={20} rx={4} fill="#5B2B6E" />
      <text x={561} y={cut - 10} textAnchor="middle" fill="#fff" fontSize={12.5} fontWeight={600}>
        {tree.cutLabel}
      </text>
    </svg>
  )
}
