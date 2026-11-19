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
const TOP = 44.3 // y of the highest tick of the distance axis
const FIRST_LEAF = 81.3
const LAST_LEAF = 626.7
const GREY = '#8D94A3'

const { tree } = segmentationResults

/** The distance axis: at most six round ticks that reach past the last merge. */
const tickStep = [1, 2, 5, 10, 20, 50, 100].find((step) => tree.mergeAll / step <= 5) ?? 100
const ticks = Array.from({ length: Math.ceil(tree.mergeAll / tickStep) + 1 }, (_, i) => i * tickStep)
const STEP = (BASE - TOP) / ticks[ticks.length - 1] // px per unit of distance
const y = (distance: number) => BASE - distance * STEP

const countLeaves = (node: TreeNode): number => ('n' in node ? 1 : countLeaves(node.left) + countLeaves(node.right))
const LEAF_GAP =
  (LAST_LEAF - FIRST_LEAF) / (tree.branches.reduce((sum, branch) => sum + countLeaves(branch.tree), 0) - 1)

/**
 * The branches from left to right: in the order of the segments, as on every
 * other screen, as long as the two branches that merge first stay neighbours.
 */
const segmentOrder = segments.map((segment) => segment.id)
const bySegment = [...tree.branches].sort((a, b) => segmentOrder.indexOf(a.segment) - segmentOrder.indexOf(b.segment))
const pairStaysTogether =
  Math.abs(bySegment.indexOf(tree.branches[0]) - bySegment.indexOf(tree.branches[1])) === 1
const shownBranches = pairStaysTogether ? bySegment : tree.branches

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
  const cut = y(tree.cutAt)

  // One branch per segment, laid out left to right.
  const branches = shownBranches.reduce<(Drawn & { segment: Segment; n: number; first: boolean })[]>((done, branch) => {
    const leavesSoFar = done.reduce((sum, b) => sum + b.leaves.length, 0)
    const segment = segments.find((s) => s.id === branch.segment)!
    const first = tree.branches.indexOf(branch) < 2
    return [...done, { segment, n: branch.n, first, ...draw(branch.tree, leavesSoFar) }]
  }, [])
  // Two branches merge first, then the third joins them.
  const [one, two] = branches.filter((b) => b.first)
  const third = branches.find((b) => !b.first)!
  const pair = (one.x + two.x) / 2
  const mergePair = y(tree.mergeFirstTwo)
  const mergeAll = y(tree.mergeAll)

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Dendrogram. Cutting the tree at distance ${tree.cutAt} gives ${branches.length} segments.`}
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
        <g key={b.segment.id} className="plot-fade" stroke={b.segment.color} strokeWidth={2} fill="none">
          {b.lines.map((d) => (
            <path key={d} d={d} />
          ))}
          <path d={`M${b.x} ${y(b.at)}V${cut}`} />
        </g>
      ))}

      {/* above the cut: the merges between segments */}
      <g className="plot-fade" stroke={GREY} strokeWidth={1.5} fill="none">
        <path d={`M${one.x} ${cut}V${mergePair}`} />
        <path d={`M${two.x} ${cut}V${mergePair}`} />
        <path d={`M${one.x} ${mergePair}H${two.x}`} />
        <path d={`M${pair} ${mergePair}V${mergeAll}`} />
        <path d={`M${third.x} ${cut}V${mergeAll}`} />
        <path d={`M${pair} ${mergeAll}H${third.x}`} />
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
            data-tip={`A group of ${leaf.n} similar respondents, in the branch that becomes ${b.segment.name}`}
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
              {b.n} respondents
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
