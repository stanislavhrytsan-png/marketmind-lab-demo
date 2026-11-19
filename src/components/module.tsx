/**
 * Pieces shared by the screens of the further modules (forecasting, price
 * optimization and so on). They follow the same patterns as the survey
 * modules: a headline, numbers in the serif face, quiet cards, and the AI
 * tutor with its mode plate.
 */
import { useId, useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { tutor } from '../data/alpineOat'
import type { CoachScript } from '../data/moduleKit'
import { practiceMode } from '../data/moduleKit'
import { useCoachScript } from '../lib/coach'
import { cx } from '../lib/demo'
import { wordCount } from '../lib/format'
import { Conversation, ModePlate, ReplyField, SectionHead, VisibleNote } from './tutor'
import { Card, Note, Tag } from './ui'

// ---------------------------------------------------------------- headline and numbers

/** The one finding of a results screen, in the serif face. It states a finding, never the decision. */
export function Headline({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <p className={cx('font-serif text-[28px] leading-[1.25]', wide ? 'max-w-[52ch]' : 'max-w-[44ch]')}>{children}</p>
}

/** One number with what it is and one line of context. */
export function Stat({ value, label, note, className }: { value: ReactNode; label: ReactNode; note?: ReactNode; className?: string }) {
  return (
    <div className={cx('min-w-0', className)}>
      <div className="num font-serif text-[30px] leading-[1.1]">{value}</div>
      <div className="mt-1 text-[13px] font-semibold">{label}</div>
      {note && <div className="text-[13px] text-ink3">{note}</div>}
    </div>
  )
}

/** A row of numbers under a headline. */
export function Stats({ items, className }: { items: { value: ReactNode; label: ReactNode; note?: ReactNode }[]; className?: string }) {
  return (
    <div className={cx('flex items-start gap-6', className)}>
      {items.map((item, i) => (
        <Stat key={i} className="flex-1" {...item} />
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- cards

/** Title row of a card: bold title, a quiet note below, and an optional control on the right. */
export function CardHead({ title, note, right }: { title: ReactNode; note?: ReactNode; right?: ReactNode }) {
  return (
    <>
      <div className="flex items-center gap-3">
        <h3 className="t-h3">{title}</h3>
        {right && (
          <>
            <span className="flex-1" />
            {right}
          </>
        )}
      </div>
      {note && <p className="mt-1 text-[13px] text-ink2">{note}</p>}
    </>
  )
}

/**
 * A trap in the data that the student must see: for example an estimate
 * that looks exact and is not. Always a plain sentence first, then the
 * evidence.
 */
export function Trap({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <Card className={cx('border-l-[3px] border-l-warn p-5', className)}>
      <div className="flex items-center gap-2.5">
        <Tag tone="warn" icon="alert">
          Watch out
        </Tag>
        <h3 className="t-h3">{title}</h3>
      </div>
      <div className="mt-2 text-[13.5px] text-ink2">{children}</div>
    </Card>
  )
}

/** What the engine itself says about a result, word for word. */
export function EngineSays({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <Note icon="info" className={className}>
      <b className="font-semibold">The engine says:</b> {children}
    </Note>
  )
}

/** Warnings of the engine belong next to the result they are about. Nothing is shown when there are none. */
export function EngineWarnings({ warnings, className }: { warnings: string[]; className?: string }) {
  if (warnings.length === 0) return null
  return (
    <div className={cx('flex flex-col gap-2', className)}>
      {warnings.map((warning) => (
        <Note key={warning} icon="alert" tone="warn">
          {warning}
        </Note>
      ))}
    </div>
  )
}

/** The engine's own sentences on how to read a result. */
export function HowToRead({ lines, className }: { lines: string[]; className?: string }) {
  return (
    <div className={className}>
      <p className="t-lbl">How to read it</p>
      {lines.map((line, i) => (
        <p key={i} className={cx('text-[13px] text-ink2', i === 0 ? 'mt-1' : 'mt-2')}>
          {line}
        </p>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------- controls

/** A slider with its name and its value. The value is printed in ink, next to the name. */
export function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  format,
  hint,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (value: number) => void
  format: (value: number) => string
  hint?: ReactNode
}) {
  const id = useId()
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="t-lbl">
          {label}
        </label>
        <span className="num text-[14px] font-semibold">{format(value)}</span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1.5 block h-4 w-full cursor-pointer accent-primary"
      />
      {hint && <div className="mt-0.5 text-[12.5px] text-ink3">{hint}</div>}
    </div>
  )
}

/** Switches between the screens of one module, for example new product and existing product. */
export function ModuleTabs({ tabs, label }: { tabs: { to: string; label: string }[]; label: string }) {
  return (
    <nav aria-label={label} className="mb-5 inline-flex gap-0.5 rounded-md border border-line bg-fill p-0.5">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            cx(
              'whitespace-nowrap rounded px-3 py-1 text-[13px] font-semibold transition-colors duration-150 ease-std',
              isActive ? 'bg-white text-ink shadow-[0_0_0_1px_var(--color-line)]' : 'text-ink2 hover:text-ink',
            )
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  )
}

// ---------------------------------------------------------------- AI tutor

/**
 * The AI tutor on a module screen, in Coach mode: the mode plate, the
 * student's own reading first, then one short scripted exchange. No model is
 * called. The lines are fixed text with the engine's numbers.
 */
export function CoachCard({ script, id }: { script: CoachScript; id?: string }) {
  const [text, setText] = useState(script.note)
  const chat = useCoachScript(script)
  return (
    <Card className="grid grid-cols-[minmax(0,5fr)_minmax(0,6fr)] overflow-hidden" as="section">
      <div id={id} className="border-r border-line">
        <ModePlate mode="coach" reason={practiceMode.reason} setFor={practiceMode.setFor} />
        <div className="px-5 pb-5 pt-[18px]">
          <SectionHead n={1} title="Your reading" note={`${wordCount(text)} words`} />
          <textarea
            aria-label="Your reading of the result"
            value={text}
            rows={6}
            onChange={(event) => setText(event.target.value)}
            className="mt-2 block w-full resize-none rounded-lg border border-ctl bg-white p-3 text-[14px] leading-[1.55] transition-colors duration-150 ease-std focus:border-primary focus:outline-none"
          />
          <VisibleNote>{tutor.visibleNote}</VisibleNote>
        </div>
      </div>
      <div className="flex flex-col px-5 pb-4 pt-[18px]">
        <SectionHead n={2} title="Coach" note={tutor.coach.subtitle} />
        <div className="flex-1">
          <Conversation messages={chat.messages} thinking={chat.thinking} />
        </div>
        <div className="mt-4">
          <ReplyField
            reply={chat.reply}
            thinking={chat.thinking}
            scriptDone={chat.scriptDone}
            onInsert={chat.insertReply}
            onSend={chat.send}
          />
          <p className="mt-2 text-[12.5px] text-ink3">{practiceMode.noAnswer}</p>
        </div>
      </div>
    </Card>
  )
}
