/**
 * The small amount of motion in the demo, in one place.
 *
 * Motion here is functional and short: a screen fades in, a chart builds up
 * when it comes into view, a headline number counts up, a tutor message is
 * typed out. Nothing loops and nothing is decoration. All of it is switched
 * off when the reader has asked the system for reduced motion: the CSS
 * animations by a rule in index.css, the scripted ones by `reducedMotion`.
 */
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { RefObject } from 'react'

/** True when the reader has asked for reduced motion, or when there is no window to ask. */
export const reducedMotion = () => typeof window === 'undefined' || !window.matchMedia || window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ---------------------------------------------------------------- charts build up when they come into view

let watcher: IntersectionObserver | undefined

/** One observer for all cards: it marks a card as seen the first time it enters the window, and then lets it go. */
function sharedWatcher(): IntersectionObserver {
  watcher ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        ;(entry.target as HTMLElement).dataset.seen = 'true'
        watcher?.unobserve(entry.target)
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  )
  return watcher
}

/**
 * Marks an element with data-seen="false" until it first comes into view,
 * then with "true". The charts inside hold their first frame until then
 * (see index.css). Without an observer nothing is marked, and the charts
 * build up as soon as they are on the page.
 */
export function useSeen<T extends HTMLElement>(): RefObject<T | null> {
  const ref = useRef<T>(null)
  useLayoutEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined' || reducedMotion()) return
    node.dataset.seen = 'false'
    const observer = sharedWatcher()
    observer.observe(node)
    return () => observer.unobserve(node)
  }, [])
  return ref
}

// ---------------------------------------------------------------- numbers that count up

const COUNT_MS = 250
/** A sign or a currency in front, one number, and a unit behind it: "+9.6%", "CHF 1,682,511", "−2.22". */
const ONE_NUMBER = /^((?:CHF |about )?[+−–-]?(?:CHF )?)(\d[\d,]*(?:\.\d+)?)(\D*)$/

/**
 * A number that counts up from zero to its value once, when it first appears.
 * Only the digits move: sign, currency, unit, decimals and thousands
 * separators stay as they are written. A text that is not one plain number
 * ("4 of 6", "68% to 81%") is shown as it is.
 */
export function useCountUp(text: string, enabled = true): string {
  const parts = enabled ? ONE_NUMBER.exec(text) : null
  const animate = parts !== null && !reducedMotion()
  const [progress, setProgress] = useState(animate ? 0 : 1)
  useEffect(() => {
    if (!animate) return
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      // The first frame can carry a time stamp from just before the start, so the share is kept between 0 and 1.
      const share = Math.min(1, Math.max(0, (now - start) / COUNT_MS))
      setProgress(1 - (1 - share) ** 3)
      if (share < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [animate])
  if (!parts || progress >= 1) return text
  const [, before, digits, after] = parts
  const decimals = digits.includes('.') ? digits.length - digits.indexOf('.') - 1 : 0
  const value = Number(digits.replaceAll(',', '')) * progress
  const shown = digits.includes(',') ? value.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) : value.toFixed(decimals)
  return `${before}${shown}${after}`
}

// ---------------------------------------------------------------- text that is typed out

/**
 * How much of a text is shown while it is typed out: a number of characters
 * that grows to the full length in well under a second, however long the
 * text is. With `enabled` false, or with reduced motion, the whole text is
 * there at once.
 */
export function useTyped(text: string, enabled: boolean): number {
  const animate = enabled && !reducedMotion()
  const [shown, setShown] = useState(animate ? 0 : text.length)
  useEffect(() => {
    if (!animate) return
    let frame = 0
    let count = 0
    // About 40 frames for any text: two thirds of a second.
    const perFrame = Math.max(2, Math.ceil(text.length / 40))
    const tick = () => {
      count = Math.min(text.length, count + perFrame)
      setShown(count)
      if (count < text.length) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [animate, text])
  return shown
}
