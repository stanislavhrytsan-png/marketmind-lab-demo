/**
 * Core components from the style guide: buttons, cards, tags, the run tag,
 * the AI mode chip, form controls, notes, option cards and details.
 */
import { useEffect, useRef, useState } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { modes, segments } from '../data/alpineOat'
import type { Mode, RunId, SegmentId } from '../data/alpineOat'
import { cx, useDemo } from '../lib/demo'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { buttonClass, modeIcon } from './styles'
import type { ButtonSize, ButtonVariant } from './styles'

// ---------------------------------------------------------------- buttons

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
}

export function Button({ variant, size, icon, className, children, ...rest }: ButtonProps) {
  return (
    <button type="button" className={buttonClass(variant, size, className)} {...rest}>
      {icon && <Icon name={icon} size={15} />}
      {children}
    </button>
  )
}

/** A button that leads to another screen. */
export function LinkButton({
  to,
  variant,
  size,
  icon,
  className,
  children,
}: {
  to: string
  variant?: ButtonVariant
  size?: ButtonSize
  icon?: IconName
  className?: string
  children: ReactNode
}) {
  return (
    <Link to={to} className={buttonClass(variant, size, className)}>
      {icon && <Icon name={icon} size={15} />}
      {children}
    </Link>
  )
}

/**
 * A control that the concept shows but the demo does not implement.
 * It stays visible and answers with one quiet note.
 */
export function DemoButton(props: ButtonProps) {
  const { notInDemo } = useDemo()
  return <Button {...props} onClick={() => notInDemo()} />
}

// ---------------------------------------------------------------- surfaces

export function Card({
  className,
  children,
  as: Tag = 'section',
  tone = 'white',
}: {
  className?: string
  children: ReactNode
  as?: 'section' | 'div' | 'article'
  /** "tint" is the primary-tinted card, "dashed" a quiet placeholder on the page background. */
  tone?: 'white' | 'tint' | 'dashed'
}) {
  return (
    <Tag
      className={cx(
        'rounded-[10px] border',
        tone === 'white' && 'border-line bg-white',
        tone === 'tint' && 'border-primary-l bg-primary-t',
        tone === 'dashed' && 'border-dashed border-line bg-transparent',
        className,
      )}
    >
      {children}
    </Tag>
  )
}

export function Hr({ className }: { className?: string }) {
  return <hr className={cx('m-0 h-px border-0 bg-line2', className)} />
}

// ---------------------------------------------------------------- tags

type TagTone = 'neutral' | 'warn' | 'primary' | 'ok' | 'outline'

const tagTones: Record<TagTone, string> = {
  neutral: 'bg-fill text-ink2',
  warn: 'bg-warn-t text-warn',
  primary: 'bg-primary-t text-primary-d',
  ok: 'bg-ok-t text-ok',
  outline: 'border border-line bg-white text-ink2',
}

export function Tag({
  tone = 'neutral',
  icon,
  className,
  children,
}: {
  tone?: TagTone
  icon?: IconName
  className?: string
  children: ReactNode
}) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-[5px] whitespace-nowrap rounded px-2 py-px text-[12.5px] font-semibold',
        tagTones[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  )
}

/**
 * The run tag: automatic ID on dark ground, plus the student's own label.
 * It appears wherever a result appears, so a number can always be traced
 * back to the run that produced it.
 */
export function RunTag({ id, label, className }: { id: RunId | string; label?: string; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-2 whitespace-nowrap', className)}>
      <b className="num rounded bg-ink px-[7px] py-px text-[12.5px] font-bold tracking-[.03em] text-white">
        {id}
      </b>
      {label && <span className="font-semibold">{label}</span>}
    </span>
  )
}

/** Run tag with the label the student gave the run (or the default label). */
export function NamedRun({ id }: { id: RunId }) {
  const { labelOf } = useDemo()
  return <RunTag id={id} label={labelOf(id)} />
}

const modeChipTones: Record<Mode, string> = {
  off: 'border-line bg-fill text-ink2',
  coach: 'border-primary-l bg-primary-t text-primary-d',
  explain: 'border-primary bg-white text-primary-d',
}

/** AI mode chip: always icon plus word. Set by the professor, read-only for students. */
export function ModeChip({ mode, prefix }: { mode: Mode; prefix?: string }) {
  return (
    <span
      className={cx(
        'inline-flex h-[26px] items-center gap-1.5 whitespace-nowrap rounded-[13px] border pl-2 pr-2.5 text-[13px] font-semibold',
        modeChipTones[mode],
      )}
    >
      <Icon name={modeIcon(mode)} size={14} />
      {prefix}
      {modes[mode].label}
    </span>
  )
}

// ---------------------------------------------------------------- segments

/** Segment marker. Every segment has its own shape, so nothing depends on colour alone. */
export function Marker({ segment, size = 10 }: { segment: SegmentId; size?: number }) {
  const s = segments.find((x) => x.id === segment)!
  return (
    <svg className="flex-none" width={size} height={size} viewBox="0 0 12 12" aria-hidden="true">
      {s.shape === 'circle' && <circle cx="6" cy="6" r="5" fill={s.color} />}
      {s.shape === 'square' && <rect x="1" y="1" width="10" height="10" rx="1.5" fill={s.color} />}
      {s.shape === 'triangle' && <path d="M6 0.8L11.5 11H0.5z" fill={s.color} />}
    </svg>
  )
}

export function SegName({
  segment,
  short = false,
  className,
}: {
  segment: SegmentId
  short?: boolean
  className?: string
}) {
  const s = segments.find((x) => x.id === segment)!
  return (
    <span className={cx('inline-flex items-center gap-1.5 whitespace-nowrap font-semibold', className)}>
      <Marker segment={segment} />
      {short ? s.short : s.name}
    </span>
  )
}

// ---------------------------------------------------------------- form controls

/** A read-only field that looks like an input or a dropdown. */
export function Field({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cx(
        'flex h-9 items-center gap-2 whitespace-nowrap rounded-md border border-ctl bg-white px-2.5 text-[14px]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function Select({
  value,
  onChange,
  options,
  label,
  className,
}: {
  value: number | string
  onChange: (value: string) => void
  options: { value: number | string; label: string; disabled?: boolean }[]
  label: string
  className?: string
}) {
  return (
    <span className={cx('relative block', className)}>
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-[34px] w-full appearance-none truncate rounded-md border border-ctl bg-white pl-2.5 pr-7 text-[14px] transition-colors duration-150 ease-std hover:border-ctl2"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} disabled={o.disabled}>
            {o.label}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" size={14} className="pointer-events-none absolute right-2 top-2.5" />
    </span>
  )
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cx('inline-flex gap-0.5 rounded-md border border-line bg-fill p-0.5', className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className={cx(
            'whitespace-nowrap rounded px-3 py-1 text-[13px] font-semibold transition-colors duration-150 ease-std',
            o.value === value ? 'bg-white text-ink shadow-[0_0_0_1px_var(--color-line)]' : 'text-ink2',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Switch({
  on,
  onChange,
  label,
}: {
  on: boolean
  onChange?: (on: boolean) => void
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange?.(!on)}
      className={cx(
        'relative h-[18px] w-8 flex-none rounded-[9px] transition-colors duration-150 ease-std',
        on ? 'bg-primary' : 'bg-ctl3',
      )}
    >
      <span
        className={cx(
          'absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-[left] duration-150 ease-std',
          on ? 'left-4' : 'left-0.5',
        )}
      />
    </button>
  )
}

/** The square of a checkbox. Purely visual: put it inside a button or label. */
export function CheckMark({ on, faded = false }: { on: boolean; faded?: boolean }) {
  return (
    <span
      className={cx(
        'inline-grid h-4 w-4 flex-none place-items-center rounded-[3px] border-[1.5px]',
        on ? 'border-primary bg-primary text-white' : 'border-ctl2 bg-white',
        faded && 'opacity-55',
      )}
    >
      {on && <Icon name="check" size={12} />}
    </span>
  )
}

export function Checkbox({
  on,
  onChange,
  children,
  className,
}: {
  on: boolean
  onChange: (on: boolean) => void
  children: ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cx('flex items-center gap-3 text-left', className)}
    >
      <CheckMark on={on} />
      {children}
    </button>
  )
}

/** The circle of a radio button. Purely visual. */
export function RadioMark({ on }: { on: boolean }) {
  return (
    <span
      className={cx(
        'inline-grid h-4 w-4 flex-none place-items-center rounded-full border-[1.5px] bg-white',
        on ? 'border-primary' : 'border-ctl2',
      )}
    >
      {on && <span className="h-2 w-2 rounded-full bg-primary" />}
    </span>
  )
}

// ---------------------------------------------------------------- notes and explanations

export function Note({
  icon = 'info',
  tone = 'neutral',
  className,
  children,
}: {
  icon?: IconName
  tone?: 'neutral' | 'primary'
  className?: string
  children: ReactNode
}) {
  return (
    <div
      className={cx(
        'flex items-start gap-2.5 rounded-lg px-3 py-2.5 text-[13px]',
        tone === 'primary' ? 'bg-primary-t text-primary-d' : 'bg-fill text-ink2',
        className,
      )}
    >
      <Icon name={icon} size={16} className="mt-[2px]" />
      <span className="min-w-0">{children}</span>
    </div>
  )
}

/** Term and explanation pairs, for example "What it does" and "Choose it when". */
export function What({
  rows,
  stack = false,
  className,
}: {
  rows: { term: string; text: ReactNode }[]
  stack?: boolean
  className?: string
}) {
  return (
    <dl
      className={cx(
        // The bottom margin of one line is part of the concept's rhythm.
        'mb-[13.5px] grid text-[13.5px]',
        stack ? 'grid-cols-1 gap-y-0.5' : 'grid-cols-[104px_1fr] gap-x-3 gap-y-1',
        className,
      )}
    >
      {rows.map((r) => (
        <div key={r.term} className="contents">
          <dt className="pt-px text-[12.5px] font-semibold text-ink3">{r.term}</dt>
          <dd className={cx('m-0 text-ink2', stack && 'mb-1.5')}>{r.text}</dd>
        </div>
      ))}
    </dl>
  )
}

/**
 * Guided option card: every setting says what it does and when to choose it.
 * The whole card is the radio button.
 */
export function OptionCard({
  selected,
  onSelect,
  title,
  tag,
  tagTone = 'primary',
  children,
  className,
  dashed = false,
}: {
  selected: boolean
  /** Without a handler the card is shown as it is and cannot be selected (view-only screens). */
  onSelect?: () => void
  title: ReactNode
  tag?: string
  tagTone?: TagTone
  children: ReactNode
  className?: string
  dashed?: boolean
}) {
  return (
    <div
      role="radio"
      aria-checked={selected}
      aria-disabled={!onSelect}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (onSelect && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cx(
        'relative rounded-lg border p-4 transition-[border-color,box-shadow] duration-150 ease-std',
        onSelect && 'cursor-pointer',
        selected
          ? 'border-primary bg-white shadow-[0_0_0_1px_var(--color-primary)]'
          : cx('border-line', onSelect && 'hover:border-ctl', dashed ? 'border-dashed bg-transparent' : 'bg-white'),
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <RadioMark on={selected} />
        {typeof title === 'string' ? <span className="t-h3">{title}</span> : title}
        <span className="flex-1" />
        {tag && <Tag tone={tagTone}>{tag}</Tag>}
      </div>
      {children}
    </div>
  )
}

/** Collapsed details: closed until the student opens them. */
export function Accordion({
  title,
  note,
  icon,
  defaultOpen = false,
  right,
  children,
  className,
}: {
  title: ReactNode
  note?: string
  icon?: IconName
  defaultOpen?: boolean
  right?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className={cx('group rounded-lg border border-line bg-white [&+details]:mt-2', className)}
    >
      <summary className="flex list-none items-center gap-2.5 px-4 py-3 font-semibold">
        <Icon
          name="chevronRight"
          size={16}
          className="text-ink3 transition-transform duration-200 ease-std group-open:rotate-90"
        />
        {icon && <Icon name={icon} size={16} />}
        <span className="flex items-center gap-2.5 whitespace-nowrap">{title}</span>
        {note && <span className="min-w-0 text-[13px] font-normal text-ink3">{note}</span>}
        {right && (
          <>
            <span className="flex-1" />
            {right}
          </>
        )}
      </summary>
      {open && <div className="fade-in border-t border-line2 px-4 pb-[18px] pt-1">{children}</div>}
    </details>
  )
}

// ---------------------------------------------------------------- editable run label

/**
 * The student's own label for a run. Click the pencil, type, press Enter.
 * The new label then shows wherever the run appears.
 */
export function EditableLabel({ id, className }: { id: RunId; className?: string }) {
  const { labelOf, rename } = useDemo()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const input = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) input.current?.select()
  }, [editing])

  const save = () => {
    rename(id, draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={input}
        aria-label={`Label of run ${id}`}
        value={draft}
        maxLength={40}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save()
          if (e.key === 'Escape') setEditing(false)
        }}
        className={cx('h-8 w-64 rounded-md border border-primary bg-white px-2', className)}
      />
    )
  }
  return (
    <span className="inline-flex items-center gap-3">
      <span className={className}>{labelOf(id)}</span>
      <button
        type="button"
        aria-label={`Rename run ${id}`}
        data-tip="Rename this run"
        onClick={() => {
          setDraft(labelOf(id))
          setEditing(true)
        }}
        className="rounded text-ink3 transition-colors duration-150 ease-std hover:text-primary"
      >
        <Icon name="pencil" size={14} />
      </button>
    </span>
  )
}

/** Small numbered circle used for steps and sections. */
export function StepNumber({ n, size = 26 }: { n: number | string; size?: number }) {
  return (
    <span
      className="grid flex-none place-items-center rounded-full bg-primary font-bold text-white"
      style={{ width: size, height: size, fontSize: size >= 26 ? 13 : 12.5 }}
    >
      {n}
    </span>
  )
}
