import { useState } from 'react'
import { Icon } from '../../components/Icon'
import { Eyebrow, Page } from '../../components/Shell'
import { ChatBubble } from '../../components/tutor'
import { Button, Card, DemoButton, Hr, ModeChip, Note, RunTag, Tag } from '../../components/ui'
import { assignment, course, student, submissions } from '../../data/alpineOat'
import { cx, useDemo } from '../../lib/demo'

type Status = 'sent' | 'draft' | 'missing'

function Avatar({ initials }: { initials: string }) {
  return (
    <span className="grid h-[30px] w-[30px] flex-none place-items-center rounded-full bg-primary-t text-[12px] font-bold text-primary-d">
      {initials}
    </span>
  )
}

function StatusTag({ status }: { status: Status }) {
  if (status === 'missing') return <span className="text-[13px] text-ink3">Not submitted</span>
  return status === 'sent' ? (
    <Tag tone="ok" className="mt-0.5">
      Approved and sent
    </Tag>
  ) : (
    <Tag tone="primary" className="mt-0.5">
      AI draft ready
    </Tag>
  )
}

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="whitespace-nowrap">
      <span className="num font-serif text-[26px] leading-none">{value}</span>
      <div className="mt-1 text-[13px] text-ink2">{label}</div>
    </div>
  )
}

// ---------------------------------------------------------------- class overview

function CommonMistakes() {
  const { notInDemo } = useDemo()
  const total = submissions.stats.submitted
  return (
    <Card className="mt-6 px-5 pb-1.5 pt-4">
      <div className="flex items-center gap-3">
        <h2 className="t-h3 text-[16px]">Common mistakes in this class</h2>
        <span className="text-[13px] text-ink3">{submissions.mistakesNote}</span>
        <span className="flex-1" />
        <DemoButton size="sm" icon="bars">
          Prepare a recap for the next lecture
        </DemoButton>
      </div>
      <div className="mt-3">
        {submissions.mistakes.map((mistake) => {
          const share = Math.round((mistake.students / total) * 100)
          return (
            <div key={mistake.title} className="flex items-center gap-4 border-t border-line2 py-3">
              <div className="flex-1">
                <div className="font-semibold">{mistake.title}</div>
                <div className="text-[13px] text-ink2">{mistake.example}</div>
              </div>
              <div className="w-[200px]" tabIndex={0} data-tip={`${mistake.students} of ${total} submissions`}>
                <div className="h-3 rounded-[3px] bg-fill">
                  <i className="block h-3 rounded-r-[3px] bg-slate" style={{ width: `${share}%` }} />
                </div>
              </div>
              <div className="num w-[104px]">
                <b>{mistake.students} students</b>
                <br />
                <span className="text-[13px] text-ink3">
                  {share}% of {total}
                </span>
              </div>
              <Button variant="quiet" size="sm" onClick={() => notInDemo()}>
                Show them
              </Button>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- one submission

/** The student's own reasoning and her conversation with the coach. */
function Submission({ onStep }: { onStep: (by: number) => void }) {
  const { lea } = submissions
  return (
    <Card>
      <div className="flex items-center gap-3 px-5 pb-3 pt-4">
        <Avatar initials={student.initials} />
        <div>
          <div className="t-h3 text-[16px]">{student.name}</div>
          <div className="whitespace-nowrap text-[13px] text-ink3">{lea.submitted}</div>
        </div>
        <span className="flex-1" />
        <Button size="sm" aria-label="Previous student" onClick={() => onStep(-1)}>
          Previous
        </Button>
        <Button size="sm" aria-label="Next student" onClick={() => onStep(1)}>
          Next
        </Button>
      </div>
      <Hr />
      <div className="px-5 py-4">
        <p className="t-lbl">Her interpretation, as submitted</p>
        <div className="mt-2 max-w-[62ch] font-serif text-[17px] leading-[1.55]">
          {lea.paragraphs.map((paragraph) => (
            <p key={paragraph} className="mb-2.5">
              {paragraph}
            </p>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-ink3">Runs she cites:</span>
          {lea.cites.map((id) => (
            <RunTag key={id} id={id} />
          ))}
          <DemoButton variant="quiet" size="sm">
            Open her run history
          </DemoButton>
        </div>
      </div>
      <Hr />
      <div className="px-5 pb-5 pt-4">
        <div className="flex items-center gap-3">
          <p className="t-lbl">Her conversation with the coach</p>
          <span className="flex-1" />
          <span className="text-[13px] text-ink2">{lea.conversationNote}</span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {lea.conversation.map((message, i) => (
            <ChatBubble key={i} message={message} name={student.firstName} />
          ))}
        </div>
        <Note icon="history" className="mt-3">
          {lea.draftChange}{' '}
          <DemoButton variant="quiet" size="sm" className="h-[22px] align-baseline">
            Compare drafts
          </DemoButton>
        </Note>
      </div>
    </Card>
  )
}

/** AI-drafted feedback. Nothing reaches the student until the professor approves. */
function Feedback({ sent, onSent }: { sent: boolean; onSent: (sent: boolean) => void }) {
  const { feedback } = submissions.lea
  const [scores, setScores] = useState(feedback.scores.map((s) => s.score))
  const [comment, setComment] = useState(feedback.comment)
  const [editing, setEditing] = useState(false)
  const total = scores.reduce((a, b) => a + b, 0)
  const max = feedback.scores.reduce((a, s) => a + s.of, 0)

  return (
    <Card className="border-primary-l">
      <div className="flex items-center gap-3 rounded-t-[10px] border-b border-primary-l bg-primary-t px-[18px] py-3.5">
        <Icon name="coach" size={17} className="text-primary" />
        <span className="t-h3">Feedback</span>
        <span className="flex-1" />
        {sent ? (
          <Tag tone="ok" icon="check">
            Approved and sent
          </Tag>
        ) : (
          <span className="whitespace-nowrap rounded border border-dashed border-primary bg-white px-2 py-px text-[12.5px] font-semibold text-primary-d">
            {editing ? 'Your draft, not sent' : 'AI draft, not sent'}
          </span>
        )}
      </div>
      <div className="px-[18px] pb-[18px] pt-3.5">
        <p className="t-lbl">{sent ? 'Scores' : 'Suggested scores'}</p>
        <div className="mt-1">
          {feedback.scores.map((row, i) => (
            <div key={row.title} className="flex items-center gap-3 border-t border-line2 py-[9px]">
              <div className="flex-1">
                <div className="text-[13px] font-semibold">{row.title}</div>
                <div className="text-[12.5px] text-ink2">{row.note}</div>
              </div>
              <div className="num flex h-8 w-[62px] items-center justify-center gap-1.5 rounded-md border border-ctl bg-white text-[14px]">
                {editing ? (
                  <input
                    type="number"
                    min={0}
                    max={row.of}
                    aria-label={`Score for ${row.title}`}
                    value={scores[i]}
                    onChange={(e) => {
                      const value = Math.max(0, Math.min(row.of, Number(e.target.value) || 0))
                      setScores(scores.map((s, k) => (k === i ? value : s)))
                    }}
                    className="w-7 bg-transparent text-center font-bold outline-none [appearance:textfield]"
                  />
                ) : (
                  <b>{scores[i]}</b>
                )}
                <span className="text-ink3">/{row.of}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center border-t border-line py-2.5">
          <span className="flex-1 font-semibold">Total</span>
          <b className="num text-[16px]">
            {total} / {max}
          </b>
        </div>

        <label htmlFor="comment" className="t-lbl mt-2 block">
          Comment to the student
        </label>
        <textarea
          id="comment"
          rows={9}
          readOnly={!editing}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className={cx(
            'mt-1 block w-full resize-none rounded-lg border bg-white p-3 text-[14px] leading-[1.55] focus:outline-none',
            editing ? 'border-primary' : 'border-ctl',
          )}
        />

        {sent ? (
          <div className="fade-in mt-4">
            <Note icon="check">
              Sent to {student.name}. She now sees the scores and your comment.
            </Note>
            <Button variant="quiet" size="sm" className="-ml-2.5 mt-2" onClick={() => onSent(false)}>
              Undo
            </Button>
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-col gap-2">
              <Button
                variant="pri"
                icon="check"
                className="justify-center"
                onClick={() => {
                  setEditing(false)
                  onSent(true)
                }}
              >
                Approve and send to {student.firstName}
              </Button>
              <div className="flex gap-2">
                <Button icon="pencil" className="flex-1 justify-center" onClick={() => setEditing(!editing)}>
                  {editing ? 'Done editing' : 'Edit comment'}
                </Button>
                <DemoButton className="flex-1 justify-center">Discard draft</DemoButton>
              </div>
            </div>
            <p className="mt-2 text-[12.5px] text-ink3">{feedback.footnote}</p>
          </>
        )}
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- screen

export default function SubmissionsReview() {
  const [selected, setSelected] = useState(student.name)
  const [filter, setFilter] = useState<'review' | 'all'>('all')
  const [query, setQuery] = useState('')
  const [sent, setSent] = useState(false)
  const { stats } = submissions

  const students = submissions.students.map((s) => ({
    ...s,
    status: (s.name === student.name ? (sent ? 'sent' : 'draft') : s.status) as Status,
  }))
  const drafts = stats.drafts - (sent ? 1 : 0)
  const text = query.trim().toLowerCase()
  const shown = students.filter(
    (s) =>
      // The student that is open stays in the list, even after approval.
      (filter === 'all' || s.status === 'draft' || s.name === selected) &&
      (!text || s.name.toLowerCase().includes(text)),
  )
  const current = students.find((s) => s.name === selected)!
  const isLea = selected === student.name

  const step = (by: number) => {
    const index = shown.findIndex((s) => s.name === selected)
    const next = shown[(index + by + shown.length) % shown.length]
    if (next) setSelected(next.name)
  }

  return (
    <Page crumbs={[course.name, 'Submissions', submissions.title]} variant="professor">
      <div className="flex items-start gap-3">
        <div>
          <Eyebrow>Submissions</Eyebrow>
          <h1 className="t-h1">{submissions.title}</h1>
          <p className="mt-2 flex items-center gap-1.5 text-[13px] text-ink2">
            {submissions.line} <ModeChip mode={assignment.mode} />
          </p>
        </div>
        <span className="flex-1" />
        <div className="flex items-center gap-8 pt-1.5">
          <Stat value={`${stats.submitted} of ${stats.of}`} label="submitted" />
          <Stat value={drafts} label="AI drafts to review" />
          <Stat value={stats.sent + (sent ? 1 : 0)} label="approved and sent" />
          <Stat value={stats.hints} label="hints used on average" />
        </div>
      </div>

      {/* What to reteach, before reading single submissions */}
      <CommonMistakes />

      <div className="mt-4 grid grid-cols-[232px_minmax(0,1fr)_372px] items-start gap-4">
        <Card className="pb-2 pt-3">
          <div className="px-3.5 pb-2">
            <label className="flex h-8 items-center gap-2 rounded-md border border-ctl bg-white px-2.5 text-ink3 focus-within:border-primary">
              <Icon name="search" size={14} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a student"
                aria-label="Find a student"
                className="h-full min-w-0 flex-1 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink3"
              />
            </label>
            <div className="mt-2 flex items-center gap-1.5">
              <button type="button" aria-pressed={filter === 'review'} onClick={() => setFilter('review')}>
                <Tag tone={filter === 'review' ? 'primary' : 'outline'}>To review {drafts}</Tag>
              </button>
              <button type="button" aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>
                <Tag tone={filter === 'all' ? 'primary' : 'outline'}>All {stats.of}</Tag>
              </button>
            </div>
          </div>
          {shown.map((s) => (
            <button
              key={s.name}
              type="button"
              aria-current={s.name === selected}
              onClick={() => setSelected(s.name)}
              className={cx(
                'flex w-full items-center gap-2.5 px-3.5 py-[9px] text-left transition-colors duration-150 ease-std',
                s.name === selected ? 'bg-primary-t shadow-[inset_3px_0_0_var(--color-primary)]' : 'hover:bg-[#FAFAFC]',
              )}
            >
              <Avatar initials={s.initials} />
              <span className="min-w-0">
                <span className="block font-semibold">{s.name}</span>
                <StatusTag status={s.status} />
              </span>
            </button>
          ))}
          <p className="px-3.5 pb-1 pt-2 text-[12.5px] text-ink3">
            {shown.length === 0
              ? 'No student matches.'
              : `Showing ${shown.length} of ${filter === 'review' ? Math.max(drafts, shown.length) : stats.of}`}
          </p>
        </Card>

        {isLea ? (
          <>
            <Submission onStep={step} />
            <Feedback sent={sent} onSent={setSent} />
          </>
        ) : (
          <Card tone="dashed" className="col-span-2 grid min-h-[320px] place-items-center p-8 text-center">
            <div>
              <span className="inline-flex">
                <Avatar initials={current.initials} />
              </span>
              <p className="t-h3 mt-3 text-[16px]">{current.name}</p>
              <p className="mx-auto mt-1 max-w-[44ch] text-[13px] text-ink3">
                {current.status === 'missing' ? `${current.name} has not submitted yet. ` : ''}
                {submissions.emptyStudent}
              </p>
              <Button size="sm" className="mt-4" onClick={() => setSelected(student.name)}>
                Back to {student.name}
              </Button>
            </div>
          </Card>
        )}
      </div>
    </Page>
  )
}
