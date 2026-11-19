/**
 * Everything `npm run check` looks at, in one place.
 *
 * 1. Where the demo calculates in the browser, it must give the engine's
 *    numbers: within 0.1 percentage points for shares, within 0.1% for other
 *    values. Each calculation has its own check next to its code.
 * 2. The numbers the presenting script in README.md says out loud must be the
 *    engine's numbers.
 */
import { allocationReadme } from '../data/allocation'
import { readmeNumbers } from '../data/alpineOat'
import { forecastingReadme } from '../data/forecasting'
import { lifetimeValueReadme } from '../data/lifetimeValue'
import { pricingReadme } from '../data/pricing'
import { targetingReadme } from '../data/targeting'
import { engineDisagreements as allocation } from './allocation'
import { engineDisagreements as conjoint } from './conjoint'
import { engineDisagreements as forecasting } from './forecasting'
import { engineDisagreements as lifetimeValue } from './lifetimeValue'
import { engineDisagreements as pricing } from './pricing'
import { engineDisagreements as targeting } from './targeting'

/** The calculations of the browser that are compared with the engine. */
export const browserChecks: { name: string; run: () => string[] }[] = [
  { name: 'Conjoint: market simulator and best-product search', run: conjoint },
  { name: 'Forecasting: Bass curve', run: forecasting },
  { name: 'Price optimization: demand curves, profit and the best price', run: pricing },
  { name: 'Predictive modeling: campaign profit by depth', run: targeting },
  { name: 'Customer lifetime value: the formula, payback and the value of each year', run: lifetimeValue },
  { name: 'Resource allocation: response curves and the value of a budget split', run: allocation },
]

/** Phrases the README must contain, because the presenter reads them out. */
export const readmePhrases: string[] = [
  ...readmeNumbers,
  ...forecastingReadme,
  ...pricingReadme,
  ...targetingReadme,
  ...lifetimeValueReadme,
  ...allocationReadme,
]
