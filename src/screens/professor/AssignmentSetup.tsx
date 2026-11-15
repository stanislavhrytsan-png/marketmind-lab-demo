import { useState } from 'react'
import type { ReactNode } from 'react'
import { Icon } from '../../components/Icon'
import type { IconName } from '../../components/Icon'
import { Eyebrow, Page } from '../../components/Shell'
import { ModePlate } from '../../components/tutor'
import {
  Button,
  Card,
  CheckMark,
  DemoButton,
  ModeChip,
  Note,
  OptionCard,
  SegmentedControl,
  StepNumber,
  Tag,
  What,
} from '../../components/ui'
import { assignmentSetup, course, modes } from '../../data/alpineOat'
import type { Mode, ModuleId } from '../../data/alpineOat'
import { cx, useDemo } from '../../lib/demo'

const modeOrder: Mode[] = ['off', 'coach', 'explain']
const settingsTitle: Record<Mode, string> = {
  off: 'Off settings',
  coach: 'Coach settings',
  explain: 'Explain settings',
}
const moduleIcons: Record<ModuleId, IconName> = {
  segmentation: 'segmentation',
  positioning: 'positioning',
  conjoint: 'conjoint',
}

function Block({ n, title, note, first = false }: { n: number; title: string; note?: string; first?: boolean }) {
  return (
    <div className={cx('flex items-center gap-2.5', !first && 'mt-8')}>
      <StepNumber n={n} />
      <h2 className="t-h3 text-[16px]">{title}</h2>
      {note && <span className="text-[13px] text-ink3">{note}</span>}
    </div>
  )
}

/** A setting the professor can switch, or one that is always on (shown faded). */
function Toggle({
  on,
  onChange,
  title,
  children,
}: {
  on: boolean
  onChange?: (on: boolean) => void
  title: string
  children: ReactNode
}) {
  const content = (
    <>
      <span className="mt-0.5">
        <CheckMark on={on} faded={!onChange} />
      </span>
      <span className="text-[13px]">
        <b>{title}</b> <span className="text-ink2">{children}</span>
      </span>
    </>
  )
  return onChange ? (
    <button type="button" role="checkbox" aria-checked={on} onClick={() => onChange(!on)} className="flex items-start gap-2 text-left">
      {content}
    </button>
  ) : (
    <div className="flex items-start gap-2">{content}</div>
  )
}

export default function AssignmentSetup() {
  const { notInDemo } = useDemo()
  const setup = assignmentSetup

  const [caseId, setCaseId] = useState(setup.cases[0].id)
  const [ticked, setTicked] = useState<ModuleId[]>(setup.modules.map((m) => m.id))
  const [format, setFormat] = useState<'Individual' | 'Groups'>('Individual')
  const [mode, setMode] = useState<Mode>('coach')
  const [reasons, setReasons] = useState<Record<Mode, string>>({
    off: modes.off.reason,
    coach: modes.coach.reason,
    explain: modes.explain.reason,
  })
  const [hints, setHints] = useState(setup.hintsDefault)
  const [canRead, setCanRead] = useState(true)
  const [published, setPublished] = useState(false)

  const chosenCase = setup.cases.find((c) => c.id === caseId)!
  const moduleLine =
    setup.modules
      .filter((m) => ticked.includes(m.id))
      .map((m) => m.name)
      .join(', ') || 'No module ticked yet'
  const students = course.studentCount

  return (
    <Page crumbs={[course.name, 'Assignments', 'New assignment']} variant="professor">
      <Eyebrow>Assignments</Eyebrow>
      <h1 className="t-h1">New assignment</h1>
      <p className="t-lead mt-1">{setup.lead}</p>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_336px] items-start gap-6">
        <div className="min-w-0">
          {/* 1. Case */}
          <Block n={1} title="Case" note={setup.caseNote} first />
          <div role="radiogroup" aria-label="Case" className="mt-3 grid grid-cols-3 gap-4">
            {setup.cases.map((c) => (
              <OptionCard
                key={c.id}
                selected={caseId === c.id}
                onSelect={() => setCaseId(c.id)}
                title={c.name}
                dashed={c.dashed}
              >
                <p className="mt-1 text-[13px] text-ink3">{c.meta}</p>
                <p className="mt-2 text-[13px] text-ink2">{c.text}</p>
              </OptionCard>
            ))}
          </div>

          {/* 2. Modules */}
          <Block n={2} title="Modules" note={setup.modulesNote} />
          <Card className="mt-3 px-5 pb-1.5 pt-0.5">
            <div className="-mt-px">
              {setup.modules.map((m) => {
                const on = ticked.includes(m.id)
                return (
                  <button
                    key={m.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    onClick={() => setTicked(on ? ticked.filter((id) => id !== m.id) : [...ticked, m.id])}
                    className="flex w-full items-center gap-3 border-t border-line2 py-2.5 text-left"
                  >
                    <CheckMark on={on} />
                    <Icon name={moduleIcons[m.id]} size={17} className="text-primary" />
                    <span className="w-[150px] font-semibold">{m.name}</span>
                    <span className="text-[13px] text-ink2">{m.text}</span>
                  </button>
                )
              })}
            </div>
            <p className="border-t border-line2 py-2.5 text-[13px] text-ink3">{setup.modulesFootnote}</p>
          </Card>

          {/* 3. Deadline and format */}
          <Block n={3} title="Deadline and format" />
          <div className="mt-3 flex items-start gap-4">
            {[
              { label: 'Opens', value: setup.opens },
              { label: 'Due', value: setup.due },
            ].map((field) => (
              <div key={field.label} className="flex-1">
                <span className="t-lbl">{field.label}</span>
                <button
                  type="button"
                  onClick={() => notInDemo()}
                  className="mt-1 flex h-9 w-full items-center gap-2 whitespace-nowrap rounded-md border border-ctl bg-white px-2.5 text-left text-[14px]"
                >
                  <Icon name="calendar" size={15} />
                  {field.value}
                </button>
              </div>
            ))}
            <div>
              <span className="t-lbl">Format</span>
              <div className="mt-1">
                <SegmentedControl
                  label="Format"
                  className="h-9 items-center"
                  value={format}
                  onChange={setFormat}
                  options={[
                    { value: 'Individual', label: 'Individual' },
                    { value: 'Groups', label: 'Groups' },
                  ]}
                />
              </div>
            </div>
            <div className="w-[120px]">
              <span className="t-lbl">Weight in grade</span>
              <div className="mt-1 flex h-9 items-center rounded-md border border-ctl bg-white px-2.5 text-[14px]">
                {setup.weight}
              </div>
            </div>
          </div>

          {/* 4. AI tutor mode: the professor decides how much help the AI may give */}
          <Block n={4} title="AI tutor mode" note={setup.modeNote} />
          <div role="radiogroup" aria-label="AI tutor mode" className="mt-3 grid grid-cols-3 gap-4">
            {modeOrder.map((m) => (
              <OptionCard key={m} selected={mode === m} onSelect={() => setMode(m)} title={<ModeChip mode={m} />}>
                <p className="mt-3 text-[13px] text-ink2">{modes[m].setup.summary}</p>
                <What
                  stack
                  className="mt-3"
                  rows={[
                    { term: 'Students get', text: modes[m].setup.studentsGet },
                    { term: 'Typical use', text: modes[m].setup.typicalUse },
                  ]}
                />
              </OptionCard>
            ))}
          </div>

          <Card className="mt-4 p-5">
            <p className="t-h3">{settingsTitle[mode]}</p>
            <div className="mt-3 flex items-start gap-6">
              <div className="flex-1">
                <label htmlFor="reason" className="t-lbl">
                  {setup.reasonLabel}
                </label>
                <textarea
                  id="reason"
                  rows={2}
                  value={reasons[mode]}
                  onChange={(e) => setReasons({ ...reasons, [mode]: e.target.value })}
                  className="mt-1 block w-full resize-none rounded-lg border border-ctl bg-white p-3 text-[14px] leading-[1.55] transition-colors duration-150 ease-std focus:border-primary focus:outline-none"
                />
                <p className="mt-1 text-[12.5px] text-ink3">{setup.reasonNote}</p>
              </div>

              <div className="flex w-[250px] flex-col gap-3">
                {mode === 'coach' && (
                  <div className="mb-1">
                    <span className="t-lbl">Hints per student</span>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Button
                        aria-label="Fewer hints"
                        className="w-9 justify-center px-0"
                        onClick={() => setHints(Math.max(1, hints - 1))}
                        disabled={hints <= 1}
                      >
                        −
                      </Button>
                      <div
                        aria-live="polite"
                        className="num flex h-9 w-14 items-center justify-center rounded-md border border-ctl bg-white font-bold"
                      >
                        {hints}
                      </div>
                      <Button
                        aria-label="More hints"
                        className="w-9 justify-center px-0"
                        onClick={() => setHints(Math.min(5, hints + 1))}
                        disabled={hints >= 5}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )}
                {mode === 'coach' && (
                  <Toggle on title={setup.toggles.interpretationFirst.title}>
                    {setup.toggles.interpretationFirst.text}
                  </Toggle>
                )}
                {mode === 'explain' && (
                  <Toggle on title={setup.toggles.explainLock.title}>
                    {setup.toggles.explainLock.text}
                  </Toggle>
                )}
                {mode === 'off' ? (
                  <Toggle on title={setup.toggles.offNote.title}>
                    {setup.toggles.offNote.text}
                  </Toggle>
                ) : (
                  <Toggle on={canRead} onChange={setCanRead} title={setup.toggles.canRead.title}>
                    {setup.toggles.canRead.text}
                  </Toggle>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Live preview: the assignment as students will see it */}
        <Card className="sticky top-[72px] overflow-hidden">
          <div className="p-5 pb-3.5">
            <p className="t-lbl">What students will see</p>
            <p className="t-h3 mt-2 text-[16px]">{chosenCase.previewTitle}</p>
            <p className="mt-1 text-[13px] text-ink2">{moduleLine}</p>
            <p className="mt-2 text-[13px]">
              <b>{setup.dueShort}</b>
              <br />
              <span className="text-ink3">
                {format}, {setup.weight} of the course grade
              </span>
            </p>
          </div>
          <div className="border-t border-line">
            <ModePlate mode={mode} reason={reasons[mode]} />
          </div>
          <div className="p-5">
            <Note icon="users">
              {students} students in {course.name}, {course.term}
            </Note>
            {published ? (
              <div className="fade-in mt-4">
                <Tag tone="ok" icon="check">
                  Published to {students} students
                </Tag>
                <p className="mt-2 text-[13px] text-ink2">{setup.published}</p>
                <Button size="sm" className="mt-3" onClick={() => setPublished(false)}>
                  Edit assignment
                </Button>
              </div>
            ) : (
              <>
                <div className="mt-4 flex flex-col gap-2">
                  <Button
                    variant="pri"
                    icon="send"
                    className="justify-center"
                    disabled={ticked.length === 0}
                    onClick={() => setPublished(true)}
                  >
                    Publish to {students} students
                  </Button>
                  <DemoButton className="justify-center">Save as draft</DemoButton>
                </div>
                <p className="mt-2 text-[12.5px] text-ink3">{setup.publishNote}</p>
              </>
            )}
          </div>
        </Card>
      </div>
    </Page>
  )
}
