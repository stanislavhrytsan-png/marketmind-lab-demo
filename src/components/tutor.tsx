/**
 * The AI tutor panel. It always opens with the same mode plate: the three
 * modes, which one is active, who set it and why. The student's own
 * interpretation comes first, and a permanent line says that the professor
 * can read it.
 *
 * No model is called. Every tutor message is scripted text from the data file.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { interpretation, modes, professor, tutor } from '../data/alpineOat'
import type { ChatMessage, Mode } from '../data/alpineOat'
import { cx, useDemo } from '../lib/demo'
import { Icon } from './Icon'
import { modeIcon } from './styles'
import { Button, StepNumber } from './ui'

const modeOrder: Mode[] = ['off', 'coach', 'explain']
const modeTitle: Record<Mode, string> = { off: 'Off', coach: 'Coach mode', explain: 'Explain mode' }

// ---------------------------------------------------------------- mode plate

/**
 * The mode plate. Students cannot change the mode: the two modes that are not
 * in use carry a lock.
 */
export function ModePlate({ mode, reason }: { mode: Mode; reason: string }) {
  return (
    <div className="border-b border-primary-l bg-primary-t px-5 py-4">
      <div className="flex items-center gap-3">
        <Icon name="coach" size={18} className="text-primary" />
        <span className="t-h3 text-[15.5px]">AI tutor</span>
        <span className="flex-1" />
        <span className="flex items-center gap-[5px] text-[12.5px] font-semibold text-primary-d">
          <Icon name="eye" size={14} />
          {tutor.visibleTo}
        </span>
      </div>
      <div
        role="group"
        aria-label="AI tutor mode, set by your professor"
        className="mt-2.5 grid grid-cols-3 gap-1 rounded-lg border border-primary-l bg-white p-[3px]"
      >
        {modeOrder.map((m) => {
          const active = m === mode
          return (
            <div
              key={m}
              tabIndex={0}
              aria-current={active}
              data-tip={active ? modes[m].tip : `${modes[m].tip} Not used in this assignment.`}
              className={cx(
                'flex h-[30px] items-center justify-center gap-1.5 rounded-[5px] text-[13px] font-semibold transition-colors duration-150 ease-std',
                active ? 'bg-primary text-white' : 'text-ink3',
              )}
            >
              <Icon name={modeIcon(m)} size={14} />
              {modes[m].label}
              {!active && <Icon name="lock" size={12} />}
            </div>
          )
        })}
      </div>
      <p className="mt-3 text-[13px] text-primary-d">
        <b>{modeTitle[mode]}</b>, set by {professor.shortName} for this assignment. Her reason: "{reason}"
      </p>
    </div>
  )
}

// ---------------------------------------------------------------- pieces

function Message({ message, name }: { message: ChatMessage; name?: string }) {
  const fromCoach = message.from === 'coach'
  return (
    <div
      className={cx(
        'fade-in max-w-[88%] rounded-[10px] px-3 py-2.5 text-[14px]',
        fromCoach ? 'rounded-tl-sm bg-primary-t' : 'ml-auto rounded-tr-sm bg-fill',
      )}
    >
      <span className="mb-0.5 block text-[12px] font-semibold text-ink3">
        {fromCoach ? 'Coach' : (name ?? 'You')}
        {message.hint && `, hint ${message.hint} of ${tutor.coach.hintLimit}`}
      </span>
      {message.text}
    </div>
  )
}

export { Message as ChatBubble }

function SectionHead({ n, title, note }: { n: number; title: string; note: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <StepNumber n={n} size={22} />
      <h3 className="t-h3">{title}</h3>
      <span className="flex-1" />
      <span className="text-right text-[12.5px] text-ink3">{note}</span>
    </div>
  )
}

function VisibleNote({ children }: { children: ReactNode }) {
  return (
    <p className="mt-2 flex items-start gap-1.5 text-[12.5px] text-ink2">
      <Icon name="eye" size={14} className="mt-0.5" />
      <span>{children}</span>
    </p>
  )
}

const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

// ---------------------------------------------------------------- coach

function Coach({ onNewMessage }: { onNewMessage: () => void }) {
  const { coach } = tutor
  const [messages, setMessages] = useState<ChatMessage[]>(coach.opening)
  const [turn, setTurn] = useState(0)
  const [hints, setHints] = useState(0)
  const [reply, setReply] = useState('')
  const [thinking, setThinking] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Bring a new message into view. The opening conversation does not move the panel.
  const seen = useRef(messages.length)
  useEffect(() => {
    if (messages.length > seen.current || thinking) onNewMessage()
    seen.current = messages.length
  }, [messages, thinking, onNewMessage])

  const scriptDone = turn >= coach.turns.length
  const next = coach.turns[turn]

  /** The coach "answers" after a short pause, with the next scripted line. */
  const coachSays = (message: ChatMessage, after?: () => void) => {
    setThinking(true)
    timer.current = window.setTimeout(() => {
      setMessages((old) => [...old, message])
      setThinking(false)
      after?.()
    }, 900)
  }

  const send = () => {
    if (!reply || thinking || !next) return
    setMessages((old) => [...old, { from: 'student', text: reply }])
    setReply('')
    coachSays({ from: 'coach', text: next.coach }, () => setTurn((t) => t + 1))
  }

  const askHint = () => {
    if (hints >= coach.hintLimit || thinking) return
    const n = hints + 1
    setHints(n)
    coachSays({ from: 'coach', text: coach.hints[n - 1], hint: n })
  }

  return (
    <>
      <div className="flex-1 px-5 pt-5">
        <SectionHead n={2} title="Coach" note={coach.subtitle} />
        <div className="mt-3 flex flex-col gap-2.5" aria-live="polite">
          {messages.map((message, i) => (
            <Message key={i} message={message} />
          ))}
          {thinking && (
            <div className="fade-in max-w-[88%] rounded-[10px] rounded-tl-sm bg-primary-t px-3 py-2.5 text-[13px] text-ink3">
              Coach is writing…
            </div>
          )}
        </div>
      </div>

      <div className="px-5 pb-4 pt-3.5">
        <div className="flex items-center gap-3">
          <Button size="sm" icon="bulb" onClick={askHint} disabled={hints >= coach.hintLimit || thinking}>
            {hints >= coach.hintLimit ? 'No hints left' : 'Ask for a hint'}
          </Button>
          <span className="text-[12.5px] text-ink2">
            {hints} of {coach.hintLimit} hints used
          </span>
          <span className="flex-1" />
          <span className="cursor-help text-[12.5px] text-ink3" tabIndex={0} data-tip={coach.whyNoAnswer}>
            Why no direct answer?
          </span>
        </div>

        {/* The reply is scripted too: clicking the field inserts the student's next answer. */}
        <div
          className={cx(
            'mt-2 flex min-h-10 items-center gap-2 rounded-md border bg-white py-1.5 pl-2.5 pr-1.5 text-[14px]',
            scriptDone ? 'border-line bg-fill text-ink3' : 'border-ctl focus-within:border-primary',
          )}
        >
          {scriptDone ? (
            <span className="flex-1 py-1 text-[13px]">{coach.closing}</span>
          ) : (
            <>
              <button
                type="button"
                aria-label="Reply to the coach. In the demo, a click inserts the next scripted reply."
                data-tip={reply ? undefined : 'Demo: click to insert the next scripted reply'}
                onClick={() => !reply && setReply(next.student)}
                className={cx('min-w-0 flex-1 cursor-text py-1 text-left', reply ? 'text-ink' : 'text-ink3')}
              >
                {reply || coach.replyPlaceholder}
              </button>
              <button
                type="button"
                aria-label="Send reply"
                onClick={send}
                disabled={!reply || thinking}
                className="grid h-7 w-7 flex-none place-items-center self-end rounded text-primary transition-colors duration-150 ease-std hover:bg-primary-t disabled:text-ctl2 disabled:hover:bg-transparent"
              >
                <Icon name="send" size={16} />
              </button>
            </>
          )}
        </div>
        <VisibleNote>{tutor.visibleNote}</VisibleNote>
      </div>
    </>
  )
}

// ---------------------------------------------------------------- explain

function Explain({ submitted }: { submitted: boolean }) {
  const { explain } = tutor
  const { notInDemo } = useDemo()
  return (
    <>
      <div className="flex-1 px-5 pt-5">
        <SectionHead
          n={2}
          title="Explanation"
          note={submitted ? 'Unlocked by your submission' : explain.subtitle}
        />
        {submitted ? (
          <div className="fade-in mt-3 rounded-[10px] rounded-tl-sm bg-primary-t px-3.5 py-3 text-[14px]">
            <span className="mb-1 block text-[12px] font-semibold text-ink3">Tutor</span>
            <p>{explain.intro}</p>
            {explain.points.map((point) => (
              <p key={point.title} className="mt-2.5">
                <b>{point.title}.</b> {point.text}
              </p>
            ))}
          </div>
        ) : (
          <div className="mt-3 rounded-[10px] border border-dashed border-ctl px-4 py-5 text-center">
            <Icon name="lock" size={20} className="mx-auto text-ink3" />
            <p className="t-h3 mt-2">{explain.lockedTitle}</p>
            <p className="mx-auto mt-1 max-w-[40ch] text-[13px] text-ink2">{explain.lockedBody}</p>
          </div>
        )}
      </div>
      <div className="px-5 pb-4 pt-3.5">
        {submitted && (
          <button
            type="button"
            onClick={() => notInDemo()}
            className="flex h-10 w-full items-center gap-2 rounded-md border border-ctl bg-white pl-2.5 pr-2 text-left text-[14px] text-ink3"
          >
            <span className="flex-1">{explain.followUpPlaceholder}</span>
            <Icon name="send" size={16} className="text-primary" />
          </button>
        )}
        <VisibleNote>{tutor.visibleNote}</VisibleNote>
      </div>
    </>
  )
}

// ---------------------------------------------------------------- panel

export function TutorPanel({
  mode,
  text,
  onTextChange,
  demoControl,
}: {
  mode: Mode
  /** The student's interpretation. It is kept when the demo switches the mode. */
  text: string
  onTextChange: (text: string) => void
  /** Strip above the plate that is not part of the product (the demo's mode switch). */
  demoControl?: ReactNode
}) {
  const [submitted, setSubmitted] = useState(false)
  const [edited, setEdited] = useState(false)
  const panel = useRef<HTMLElement>(null)
  const words = wordCount(text)
  const [min, max] = interpretation.wordRange

  /** New tutor messages should be in view, as in a chat. */
  const scrollToEnd = useCallback(() => {
    const el = panel.current
    if (el && el.scrollHeight > el.clientHeight) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
  }, [])

  return (
    <aside
      ref={panel}
      aria-label="Interpretation and AI tutor"
      className="sticky top-14 flex h-[calc(var(--app-h)-56px)] flex-col overflow-y-auto border-l border-line bg-white"
    >
      {demoControl}
      <ModePlate mode={mode} reason={modes[mode].reason} />

      {/* 1. The student's own interpretation always comes first. */}
      <div className="px-5 pt-[18px]">
        <SectionHead
          n={1}
          title="Your interpretation"
          note={`${words} of ${min} to ${max} words, saved ${edited ? 'just now' : interpretation.savedAt}`}
        />
        <textarea
          aria-label="Your interpretation"
          value={text}
          rows={6}
          onChange={(e) => {
            onTextChange(e.target.value)
            setEdited(true)
          }}
          className="mt-2 block w-full resize-none rounded-lg border border-ctl bg-white p-3 text-[14px] leading-[1.55] transition-colors duration-150 ease-std focus:border-primary focus:outline-none"
        />
        <div className="mt-2 flex items-center gap-3">
          <Button variant={submitted ? 'sec' : 'pri'} size="sm" onClick={() => setSubmitted(true)} disabled={words === 0}>
            {submitted ? 'Submit again' : 'Submit interpretation'}
          </Button>
          {submitted ? (
            <span className="fade-in flex items-center gap-1.5 text-[12.5px] font-semibold text-ok">
              <Icon name="check" size={14} />
              Submitted. You can still edit until Fri 27 Nov, 23:59
            </span>
          ) : (
            <span className="text-[12.5px] text-ink3">{interpretation.deadlineNote}</span>
          )}
        </div>
      </div>

      {/* 2. What the tutor does depends on the mode the professor chose. */}
      {mode === 'coach' && <Coach onNewMessage={scrollToEnd} />}
      {mode === 'explain' && <Explain submitted={submitted} />}
      {mode === 'off' && (
        <>
          <div className="flex-1 px-5 pt-5">
            <div className="rounded-[10px] bg-fill px-4 py-4">
              <div className="flex items-center gap-2">
                <Icon name="off" size={16} className="text-ink2" />
                <span className="t-h3">{tutor.off.title}</span>
              </div>
              <p className="mt-1 text-[13px] text-ink2">{tutor.off.body}</p>
            </div>
          </div>
          <div className="px-5 pb-4 pt-3.5">
            <VisibleNote>{professor.shortName} can read your interpretation.</VisibleNote>
          </div>
        </>
      )}
    </aside>
  )
}
