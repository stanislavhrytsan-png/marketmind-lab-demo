/**
 * `npm run check`: do the demo and the engine still agree?
 *
 * 1. The market simulator in the browser (src/lib/conjoint.ts) must give the
 *    same shares as the engine for the products the engine wrote into
 *    src/data/engine_results.json, within 0.1 percentage points.
 * 2. The numbers the presenting script in README.md says out loud must be
 *    the engine's numbers.
 *
 * Whether engine_results.json itself is up to date is checked from the
 * engine: `python -m marketmind.export_demo --check` (also part of the
 * engine's test suite).
 */
import { readFileSync } from 'node:fs'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' })
let problems = []
try {
  const { engineDisagreements } = await server.ssrLoadModule('/src/lib/conjoint.ts')
  const { readmeNumbers } = await server.ssrLoadModule('/src/data/alpineOat.ts')
  problems = engineDisagreements()

  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
  for (const phrase of readmeNumbers) {
    if (!readme.includes(phrase)) problems.push(`README.md does not say "${phrase}"`)
  }
} finally {
  await server.close()
}

if (problems.length) {
  console.error(`The demo and the engine disagree in ${problems.length} place(s):\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
console.log('The simulator in the browser and the README give the engine’s numbers.')
