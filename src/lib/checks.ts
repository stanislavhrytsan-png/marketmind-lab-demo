/**
 * Everything `npm run check` looks at, in one place.
 *
 * 1. Where the demo calculates in the browser, it must give the engine's
 *    numbers: within 0.1 percentage points for shares, within 0.1% for other
 *    values. Each calculation has its own check next to its code.
 * 2. The numbers the presenting script in README.md says out loud must be the
 *    engine's numbers.
 */
import { readmeNumbers } from '../data/alpineOat'
import { forecastingReadme } from '../data/forecasting'
import { engineDisagreements as conjoint } from './conjoint'
import { engineDisagreements as forecasting } from './forecasting'

/** The calculations of the browser that are compared with the engine. */
export const browserChecks: { name: string; run: () => string[] }[] = [
  { name: 'Conjoint: market simulator and best-product search', run: conjoint },
  { name: 'Forecasting: Bass curve', run: forecasting },
]

/** Phrases the README must contain, because the presenter reads them out. */
export const readmePhrases: string[] = [...readmeNumbers, ...forecastingReadme]
