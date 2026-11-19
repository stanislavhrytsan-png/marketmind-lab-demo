import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { courseHome } from '../data/alpineOat'
import type { RunId } from '../data/alpineOat'
import { runs } from '../data/library'
import { DemoContext } from './demo'
import type { DemoState } from './demo'

/** Holds the demo state and shows the quiet "Not part of this demo" note. */
export function DemoProvider({ children }: { children: ReactNode }) {
  const [conjointRun, setConjointRun] = useState(false)
  const [labels, setLabels] = useState<Partial<Record<RunId, string>>>({})
  const [note, setNote] = useState<{ key: number; text: string } | null>(null)
  const timer = useRef<number | undefined>(undefined)

  const notInDemo = useCallback((text = 'Not part of this demo') => {
    window.clearTimeout(timer.current)
    setNote({ key: Date.now(), text })
    timer.current = window.setTimeout(() => setNote(null), 2200)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  const value = useMemo<DemoState>(
    () => ({
      conjointRun,
      markConjointRun: () => setConjointRun(true),
      visibleRuns: runs.filter((r) => r.module !== 'conjoint' || conjointRun),
      labelOf: (id) => labels[id] ?? runs.find((r) => r.id === id)!.label,
      rename: (id, label) => {
        const clean = label.trim()
        setLabels((old) => {
          const next = { ...old }
          if (clean) next[id] = clean
          else delete next[id]
          return next
        })
      },
      savedAt: conjointRun ? courseHome.savedAt.after : courseHome.savedAt.before,
      notInDemo,
      restart: () => {
        setConjointRun(false)
        setLabels({})
      },
    }),
    [conjointRun, labels, notInDemo],
  )

  return (
    <DemoContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[60] flex justify-center">
        {note && (
          <div
            key={note.key}
            className="fade-in rounded-md bg-ink px-3.5 py-2 text-[13px] font-medium text-white shadow-[0_4px_16px_rgba(27,34,48,.18)]"
          >
            {note.text}
          </div>
        )}
      </div>
    </DemoContext.Provider>
  )
}
