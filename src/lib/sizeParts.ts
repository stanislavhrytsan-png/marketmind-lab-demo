import { segments } from '../data/alpineOat'
import type { Segment } from '../data/alpineOat'

/** One part of a segment size bar. */
export interface SizePart {
  key: string
  /** A segment from the data file. Without one the part is an extra group, drawn as a grey hatch. */
  segment?: Segment
  name: string
  share: number
  n: number
  /** Text under the name. Default: "38%, 114 respondents". */
  caption?: string
  /** Faded parts are the ones that did not change in a comparison. */
  faded?: boolean
}

/** The three segments of run SEG-03 as parts of a size bar. */
export const segmentParts = (): SizePart[] =>
  segments.map((s) => ({ key: s.id, segment: s, name: s.name, share: s.share, n: s.n }))
