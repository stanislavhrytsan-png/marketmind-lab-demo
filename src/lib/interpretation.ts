/**
 * The interpretation with the AI tutor sits at the end of the main screen of
 * each further module. "Write interpretation" in the run header scrolls
 * there. From another screen of the same module the button leads to the main
 * screen and then scrolls (the address carries ?at=interpretation).
 */
import { useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export const INTERPRETATION = 'interpretation'

/** The address of a module's main screen, opened at its interpretation. */
export const atInterpretation = (to: string) => `${to}${to.includes('?') ? '&' : '?'}at=${INTERPRETATION}`

/** For the main screen: scrolls to the interpretation when asked to, and returns the handler for the button. */
export function useInterpretation(): () => void {
  const [params] = useSearchParams()
  const asked = params.get('at') === INTERPRETATION
  useEffect(() => {
    if (asked) document.getElementById(INTERPRETATION)?.scrollIntoView()
  }, [asked])
  return useCallback(() => document.getElementById(INTERPRETATION)?.scrollIntoView({ behavior: 'smooth' }), [])
}
