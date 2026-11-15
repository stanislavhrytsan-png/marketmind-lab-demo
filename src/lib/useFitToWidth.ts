import { useEffect, useState } from 'react'

/** The demo is designed for a 1440 px wide desktop window, like the concept. */
const DESIGN_WIDTH = 1440
const SMALLEST_SCALE = 0.7

const measure = () => Math.max(SMALLEST_SCALE, Math.min(1, window.innerWidth / DESIGN_WIDTH))

/**
 * In a window narrower than 1440 px the whole interface is scaled down to fit,
 * so every screen keeps the layout of the concept (useful on a small laptop or
 * a projector). In a wider window nothing is scaled.
 *
 * Returns the scale factor: 1 at 1440 px and wider, less below.
 */
export function useFitToWidth(): number {
  const [scale, setScale] = useState(measure)
  useEffect(() => {
    const update = () => setScale(measure())
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return scale
}
