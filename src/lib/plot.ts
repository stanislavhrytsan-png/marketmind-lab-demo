/**
 * Helpers for the charts of the further modules: the colours of the chart
 * parts, scales, round tick values and the path of a line. The chart
 * components themselves are in src/components/plot.tsx.
 */
import { useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/** Colours of the chart parts. Data colours for groups are in the data files. */
export const chart = {
  ink: '#1B2230',
  ink2: '#475066',
  ink3: '#636B7D',
  grid: '#ECEEF2',
  axis: '#C3C8D2',
  /** Neutral data colour, and two lighter steps for series that stand back. */
  slate: '#56607A',
  slate2: '#8C95AB',
  slate3: '#B4BAC8',
  /** "Yours": the student's own scenario, and the one series a chart is about. */
  primary: '#5B2B6E',
  primaryLight: '#D8C6E1',
  /** Good and bad, always with a word or a sign next to the colour. */
  good: '#1F6F43',
  bad: '#B3261E',
  warn: '#8A5A00',
  warnTint: '#FFF3D1',
} as const

// ---------------------------------------------------------------- measuring and scales

/** The width of the element a chart sits in, so that the chart can fill it without scaling its text. */
export function useWidth<T extends HTMLElement>(fallback: number): [RefObject<T | null>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(fallback)
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const measure = () => {
      if (element.clientWidth > 0) setWidth(element.clientWidth)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return [ref, width]
}

export type Scale = (value: number) => number

/** A straight-line scale from data values to pixels. */
export const linear =
  (from: number, to: number, start: number, end: number): Scale =>
  (value) =>
    start + ((value - from) / (to - from || 1)) * (end - start)

/** Round tick values between min and max, about `count` of them. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  const span = max - min
  if (!(span > 0)) return [min]
  const power = 10 ** Math.floor(Math.log10(span / count))
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((size) => span / size <= count + 0.5) ?? 10 * power
  const ticks: number[] = []
  for (let k = Math.ceil(min / step - 1e-9); k * step <= max + step * 1e-9; k++) ticks.push(Number((k * step).toPrecision(12)))
  return ticks
}

/** An axis from zero (or below, if there are negative values) to a round number above the largest value. */
export function niceDomain(values: number[], count = 5, from = 0): { domain: [number, number]; ticks: number[] } {
  const low = Math.min(from, ...values)
  const high = Math.max(from, ...values)
  const span = high - low || 1
  const power = 10 ** Math.floor(Math.log10(span / count))
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * power).find((size) => span / size <= count + 0.5) ?? 10 * power
  const bottom = Math.floor(low / step + 1e-9) * step
  const top = Math.ceil(high / step - 1e-9) * step
  return { domain: [bottom, top], ticks: niceTicks(bottom, top, Math.round((top - bottom) / step)) }
}

/** "M x y L x y ..." through the points. Points without a value break the line. */
export function linePath(points: ([number, number] | null)[]): string {
  let path = ''
  let pen = false
  for (const point of points) {
    if (!point || !Number.isFinite(point[1])) {
      pen = false
      continue
    }
    path += `${pen ? 'L' : 'M'}${point[0].toFixed(1)} ${point[1].toFixed(1)}`
    pen = true
  }
  return path
}

/**
 * Moves labels apart that would sit on top of each other. Takes the y position each label
 * would like, and returns positions that are at least `gap` pixels apart, in the same order.
 */
export function spread(wanted: number[], gap = 15): number[] {
  const order = wanted.map((y, index) => ({ y, index })).sort((a, b) => a.y - b.y)
  for (let k = 1; k < order.length; k++) {
    if (order[k].y - order[k - 1].y < gap) order[k].y = order[k - 1].y + gap
  }
  const placed = [...wanted]
  order.forEach((item) => (placed[item.index] = item.y))
  return placed
}
