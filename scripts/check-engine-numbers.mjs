/**
 * `npm run check`: do the demo and the engine still agree?
 *
 * 1. Where the demo calculates in the browser, it must give the engine's
 *    numbers: the market simulator, the Bass curve and so on (the list is in
 *    src/lib/checks.ts). The engine wrote its own results for a list of cases
 *    into src/data/engine_results.json. The browser's arithmetic must match
 *    them within 0.1 percentage points for shares and within 0.1% for other
 *    values.
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
const problems = []
const passed = []
try {
  const { browserChecks, readmePhrases } = await server.ssrLoadModule('/src/lib/checks.ts')
  for (const check of browserChecks) {
    const found = check.run()
    problems.push(...found)
    if (found.length === 0) passed.push(check.name)
  }

  const readme = readFileSync(new URL('../README.md', import.meta.url), 'utf8')
  for (const phrase of readmePhrases) {
    if (!readme.includes(phrase)) problems.push(`README.md does not say "${phrase}"`)
  }
} finally {
  await server.close()
}

if (problems.length) {
  console.error(`The demo and the engine disagree in ${problems.length} place(s):\n- ${problems.join('\n- ')}`)
  process.exit(1)
}
console.log(`The browser gives the engine's numbers, and the README quotes them. Checked:\n- ${passed.join('\n- ')}`)
