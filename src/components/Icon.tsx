import type { ReactNode } from 'react'
import { cx } from '../lib/demo'

/** The concept's icon set: 24 px grid, 1.8 px stroke, round caps and joins. */
const paths = {
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5h0" />
    </>
  ),
  check: <path d="M5 12l5 5 9-10" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  play: <path d="M7 5l12 7-12 7z" />,
  compare: (
    <>
      <rect x="3" y="5" width="7" height="14" rx="1.5" />
      <rect x="14" y="5" width="7" height="14" rx="1.5" />
    </>
  ),
  pencil: <path d="M4 20l4-1L19 8l-3-3L5 16zM14 7l3 3" />,
  off: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="M6.5 6.5l11 11" />
    </>
  ),
  coach: (
    <>
      <path d="M4 5h16v11H10l-4 4v-4H4z" />
      <path d="M10 9a2 2 0 1 1 2.6 1.9c-.4.2-.6.5-.6 1M12 14h0" />
    </>
  ),
  explain: (
    <path d="M3 5h6a3 3 0 0 1 3 3v12a2.5 2.5 0 0 0-2.5-2.5H3zM21 5h-6a3 3 0 0 0-3 3v12a2.5 2.5 0 0 1 2.5-2.5H21z" />
  ),
  chevronRight: <path d="M9 6l6 6-6 6" />,
  chevronDown: <path d="M6 9l6 6 6-6" />,
  eye: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  home: <path d="M3 11l9-7 9 7M5 10v10h14V10" />,
  document: <path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6" />,
  history: <path d="M3 12a9 9 0 1 0 3-6.7M3 4v4h4M12 8v4l3 2" />,
  segmentation: (
    <>
      <circle cx="7" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.5" />
      <circle cx="11" cy="17" r="3.5" />
    </>
  ),
  positioning: (
    <>
      <path d="M4 4v16h16" />
      <circle cx="10" cy="9" r="1.5" />
      <circle cx="16" cy="13" r="1.5" />
      <path d="M4 20l9-7" />
    </>
  ),
  conjoint: (
    <>
      <path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h12" />
      <circle cx="16" cy="7" r="2" />
      <circle cx="10" cy="12" r="2" />
      <circle cx="18" cy="17" r="2" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .8-1 1.7M12 17h0" />
    </>
  ),
  table: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M3 10h18M3 14.5h18M9 5v14" />
    </>
  ),
  code: <path d="M8 7l-5 5 5 5M16 7l5 5-5 5M13 5l-2 14" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6L6 18" />,
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16l4 4" />
    </>
  ),
  star: <path d="M12 4l2.5 5 5.5.8-4 3.9.9 5.5L12 16.6 7.1 19.2 8 13.7 4 9.8 9.5 9z" />,
  pin: <path d="M9 4h6l-1 6 3 3H7l3-3zM12 13v7" />,
  bulb: <path d="M9 17h6M10 20h4M8 13a6 6 0 1 1 8 0c-.7.7-1 1.5-1 2.5H9c0-1-.3-1.8-1-2.5z" />,
  send: <path d="M4 12l16-8-6 16-3-7z" />,
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6M16 5.5a3 3 0 0 1 0 5.5M17 14.5c2.3.6 4 2.8 4 5.5" />
    </>
  ),
  book: <path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2zM5 18a2 2 0 0 1 2-2h12" />,
  calendar: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </>
  ),
  bars: <path d="M4 20h16M7 20v-7M12 20V6M17 20v-10" />,
  restart: <path d="M4 12a8 8 0 1 1 2.6 5.9M4 20v-5h5" />,
  alert: <path d="M12 4l9 16H3zM12 10v4.5M12 17.3h0" />,
  // The further modules
  forecasting: (
    <>
      <path d="M4 4v16h16" />
      <path d="M7 17c2.5 0 3-9 5.5-9s3 9 5.5 9" />
    </>
  ),
  pricing: (
    <>
      <path d="M3 11V4h7l11 11-7 7z" />
      <circle cx="7.5" cy="8.5" r="1.4" />
    </>
  ),
  targeting: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <path d="M12 12h0" />
    </>
  ),
  lifetimeValue: (
    <>
      <path d="M20 12a8 8 0 1 1-2.3-5.6M20 3.5v4h-4" />
      <circle cx="12" cy="10.3" r="2" />
      <path d="M8.6 15.6c.6-1.6 1.8-2.4 3.4-2.4s2.8.8 3.4 2.4" />
    </>
  ),
  allocation: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v9l6.4 6.4M12 12H3" />
    </>
  ),
  portfolio: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </>
  ),
  panel: <path d="M4 8l4-2 4 3 4-2 4 1M4 13l4-1 4 2 4-3 4 2M4 18l4-2 4 1 4-1 4 2" />,
  sentiment: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9 10h0M15 10h0M8.5 14c1 1.3 2.1 2 3.5 2s2.5-.7 3.5-2" />
    </>
  ),
  network: (
    <>
      <circle cx="6" cy="7" r="2.2" />
      <circle cx="18" cy="8" r="2.2" />
      <circle cx="12" cy="18" r="2.2" />
      <path d="M8.2 7.2l7.6.6M7.1 8.9l3.8 7.2M16.9 9.9l-3.8 6.2" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type IconName = keyof typeof paths

export function Icon({ name, size = 16, className }: { name: IconName; size?: number; className?: string }) {
  return (
    <svg
      className={cx('flex-none', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

/** The MarketMind Lab mark. "light" is the version for the dark sidebar. */
export function Logo({ size = 30, light = false }: { size?: number; light?: boolean }) {
  const box = light ? '#fff' : '#5B2B6E'
  const mark = light ? '#5B2B6E' : '#fff'
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true" className="flex-none">
      <rect width="30" height="30" rx="7" fill={box} />
      <path
        d="M7 21V10l8 8 8-8v11"
        fill="none"
        stroke={mark}
        strokeWidth={2.2}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="7" cy="10" r="2.3" fill={mark} />
      <circle cx="15" cy="18" r="2.3" fill={mark} />
      <circle cx="23" cy="10" r="2.3" fill={mark} />
    </svg>
  )
}
