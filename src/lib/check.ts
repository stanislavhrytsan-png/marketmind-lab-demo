/**
 * Comparing a number calculated in the browser with the engine's number.
 * The rule of the demo: the two may differ by 0.1% of the value, or, for
 * shares, by 0.1 percentage points. Used by `npm run check` and, while
 * developing, reported in the browser console.
 */

/** Largest allowed difference, as a share of the engine's value. */
export const RELATIVE = 0.001
/** Largest allowed difference between two shares: 0.1 percentage points. */
export const POINTS = 0.001

export class Problems {
  readonly list: string[] = []
  private readonly where: string

  constructor(where: string) {
    this.where = where
  }

  /** A value: within 0.1% of the engine's number. `scale` is a typical size, for values close to zero. */
  value(what: string, here: number, engine: number, scale = Math.abs(engine)) {
    const allowed = RELATIVE * Math.max(Math.abs(engine), scale * 0.001, 1e-9)
    if (!(Math.abs(here - engine) <= allowed)) this.list.push(`${this.where}: ${what}: ${here} here, ${engine} in the engine`)
  }

  /** A share between 0 and 1: within 0.1 percentage points. */
  share(what: string, here: number, engine: number) {
    if (!(Math.abs(here - engine) <= POINTS)) {
      this.list.push(`${this.where}: ${what}: ${(here * 100).toFixed(2)}% here, ${(engine * 100).toFixed(2)}% in the engine`)
    }
  }

  /** Two things that must be exactly the same, for example the best period. */
  same(what: string, here: unknown, engine: unknown) {
    if (here !== engine) this.list.push(`${this.where}: ${what}: ${String(here)} here, ${String(engine)} in the engine`)
  }
}

/** While developing: say in the browser console where the browser and the engine disagree. */
export function reportInConsole(problems: string[]) {
  if (import.meta.env.DEV && typeof window !== 'undefined' && problems.length) {
    console.warn('[MarketMind demo data] ' + problems.join('\n'))
  }
}
