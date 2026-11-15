/**
 * The little bit of state that connects the screens of the demo, as a React
 * context. It lives in memory only: reloading the page starts the story again.
 * The provider component is in DemoProvider.tsx.
 */
import { createContext, useContext } from 'react'
import type { Run, RunId } from '../data/alpineOat'

export interface DemoState {
  /** False until the student has run the conjoint scenarios. */
  conjointRun: boolean
  markConjointRun: () => void
  /** Runs that exist at this point of the story. */
  visibleRuns: Run[]
  /** A run's label: the student's own, or the default from the data file. */
  labelOf: (id: RunId) => string
  rename: (id: RunId, label: string) => void
  /** Time shown as "Saved hh:mm" in the top bar. */
  savedAt: string
  /** Quiet message for controls that are not part of the demo. */
  notInDemo: (text?: string) => void
  restart: () => void
}

export const DemoContext = createContext<DemoState | null>(null)

export function useDemo(): DemoState {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider')
  return ctx
}

/** Joins class names and drops empty values. */
export function cx(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(' ')
}
