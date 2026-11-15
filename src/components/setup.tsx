/**
 * Pieces shared by the guided setup screens: the "This run" card that names
 * a run before it exists, and the numbered section heading.
 */
import type { ReactNode } from 'react'
import { Icon } from './Icon'
import { Card, RunTag } from './ui'

export function ThisRunCard({
  id,
  label,
  onLabelChange,
  lines,
  children,
}: {
  id: string
  label: string
  /** Without a handler the label is shown read-only. */
  onLabelChange?: (label: string) => void
  lines: { name: string; value: string }[]
  children: ReactNode
}) {
  return (
    <Card className="sticky top-[72px] p-5">
      <p className="t-lbl">This run</p>
      <div className="mt-1 flex items-center gap-3">
        <RunTag id={id} />
        <span className="text-[13px] text-ink3">named automatically</span>
      </div>

      <label htmlFor="run-label" className="t-lbl mt-4 block">
        Your label
      </label>
      <div className="relative mt-1">
        <input
          id="run-label"
          value={label}
          maxLength={40}
          readOnly={!onLabelChange}
          onChange={(e) => onLabelChange?.(e.target.value)}
          className="h-9 w-full rounded-md border border-ctl bg-white pl-2.5 pr-8 text-[14px] transition-colors duration-150 ease-std hover:border-ctl2"
        />
        <Icon name="pencil" size={14} className="pointer-events-none absolute right-2.5 top-[11px] text-ink3" />
      </div>

      <div className="mt-4 flex flex-col gap-2.5">
        {lines.map((line) => (
          <div key={line.name} className="flex items-start gap-2 text-[13.5px]">
            <Icon name="check" size={14} className="mt-[3px] text-primary" />
            <span>
              <span className="text-ink3">{line.name}</span>
              <br />
              <span className="font-semibold">{line.value}</span>
            </span>
          </div>
        ))}
      </div>
      {children}
    </Card>
  )
}

/** Section heading on a setup screen: bold title, optional note on the right. */
export function SetupHeading({ children, className }: { children: ReactNode; className?: string }) {
  return <h2 className={`t-h3 text-[16px] ${className ?? ''}`}>{children}</h2>
}
