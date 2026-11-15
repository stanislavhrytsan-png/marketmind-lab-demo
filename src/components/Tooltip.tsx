import { useEffect, useState } from 'react'

/**
 * One tooltip for the whole app. Any element with a data-tip attribute shows
 * its text on hover or keyboard focus, next to the pointer. Charts, bars and
 * icons all use the same tooltip, as in the concept.
 */
export function TooltipLayer() {
  const [tip, setTip] = useState<{ text: string; x: number; y: number } | null>(null)

  useEffect(() => {
    const show = (e: MouseEvent | FocusEvent) => {
      const target = e.target instanceof Element ? e.target.closest('[data-tip]') : null
      const text = target?.getAttribute('data-tip')
      if (!target || !text) {
        setTip(null)
        return
      }
      const box = target.getBoundingClientRect()
      const byMouse = e instanceof MouseEvent && (e.clientX !== 0 || e.clientY !== 0)
      const x = (byMouse ? e.clientX : box.left + box.width / 2) + 14
      const y = (byMouse ? e.clientY : box.bottom) + 14
      setTip({ text, x: Math.min(x, window.innerWidth - 280), y: Math.min(y, window.innerHeight - 80) })
    }
    const hide = () => setTip(null)
    document.addEventListener('mousemove', show)
    document.addEventListener('focusin', show)
    document.addEventListener('focusout', hide)
    document.addEventListener('mousedown', hide)
    window.addEventListener('scroll', hide, true)
    return () => {
      document.removeEventListener('mousemove', show)
      document.removeEventListener('focusin', show)
      document.removeEventListener('focusout', hide)
      document.removeEventListener('mousedown', hide)
      window.removeEventListener('scroll', hide, true)
    }
  }, [])

  return (
    <div
      role="tooltip"
      className="pointer-events-none fixed z-50 max-w-[260px] whitespace-pre-line rounded-md bg-ink px-2.5 py-[7px] text-[12.5px] leading-[1.4] text-white transition-opacity duration-150 ease-std"
      style={{ left: tip?.x ?? 0, top: tip?.y ?? 0, opacity: tip ? 1 : 0 }}
    >
      {tip?.text}
    </div>
  )
}
