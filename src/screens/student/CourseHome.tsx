import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { Page } from '../../components/Shell'
import { buttonClass } from '../../components/styles'
import { Button, Card, Hr, LinkButton, ModeChip, NamedRun, Note, Tag } from '../../components/ui'
import { assignment, assignmentRows, course, courseHome, modes } from '../../data/alpineOat'
import type { AssignmentRow, Mode, RunId } from '../../data/alpineOat'
import { runs } from '../../data/library'
import { cx, useDemo } from '../../lib/demo'

/** Six-step progress line: done, current, still to do. */
function ProgressLine() {
  const { steps, currentStep } = assignment
  return (
    <div className="mt-6 flex items-start">
      {steps.map((step, i) => {
        const state = i < currentStep ? 'done' : i === currentStep ? 'current' : 'todo'
        const last = i === steps.length - 1
        return (
          <div key={step} className={cx('min-w-0', last ? 'w-[52px] flex-none' : 'flex-1')}>
            <div className="flex items-center gap-1.5">
              {state === 'done' && (
                <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full bg-primary text-white">
                  <Icon name="check" size={13} />
                </span>
              )}
              {state === 'current' && (
                <span className="grid h-[22px] w-[22px] flex-none place-items-center rounded-full border-2 border-primary bg-white">
                  <i className="h-2 w-2 rounded-full bg-primary" />
                </span>
              )}
              {state === 'todo' && (
                <span className="h-[22px] w-[22px] flex-none rounded-full border-[1.5px] border-ctl3 bg-white" />
              )}
              {!last && <span className={cx('h-0.5 flex-1', state === 'done' ? 'bg-primary' : 'bg-line')} />}
            </div>
            <div
              className={cx(
                'mt-2 whitespace-nowrap text-[13px]',
                state === 'done' && 'text-ink2',
                state === 'current' && 'font-semibold',
                state === 'todo' && 'text-ink3',
              )}
            >
              {step}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ProgressCell({ progress }: { progress: AssignmentRow['progress'] }) {
  if ('feedbackReady' in progress) {
    return (
      <Tag tone="ok" icon="check">
        Feedback ready
      </Tag>
    )
  }
  return (
    <>
      <div className="flex gap-[3px]">
        {Array.from({ length: progress.of }, (_, i) => (
          <i key={i} className={cx('h-1.5 flex-1 rounded-[3px]', i < progress.done ? 'bg-primary' : 'bg-line')} />
        ))}
      </div>
      <div className="mt-1 text-[13px] text-ink3">{progress.label}</div>
    </>
  )
}

function RowAction({ action }: { action: AssignmentRow['action'] }) {
  const { notInDemo } = useDemo()
  if (action.kind === 'locked') {
    return (
      <span className="flex items-center justify-end gap-[5px] text-[13px] text-ink3">
        <Icon name="lock" size={14} />
        {action.label}
      </span>
    )
  }
  const variant = action.kind === 'quiet' ? 'quiet' : 'sec'
  return action.to ? (
    <LinkButton to={action.to} variant={variant}>
      {action.label}
    </LinkButton>
  ) : (
    <Button variant={variant} onClick={() => notInDemo()}>
      {action.label}
    </Button>
  )
}

/** A run that links to its results screen, when the demo has one. */
function RunLink({ id }: { id: RunId }) {
  const to = runs.find((r) => r.id === id)?.to
  return to ? (
    <Link to={to} className="rounded hover:underline">
      <NamedRun id={id} />
    </Link>
  ) : (
    <NamedRun id={id} />
  )
}

export default function CourseHome() {
  const { conjointRun } = useDemo()
  const phase = conjointRun ? 'after' : 'before'
  const lastRun = courseHome.lastRun[phase]
  const modeOrder: Mode[] = ['off', 'coach', 'explain']

  return (
    <Page crumbs={[course.name, 'Course home']} variant="home">
      <h1 className="t-h1">{course.name}</h1>
      <p className="t-lead mt-1">{course.intro}</p>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_316px] items-start gap-6">
        <div className="min-w-0">
          <Card className="px-[26px] py-6">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Tag tone="primary">In progress</Tag>
                  <span className="text-[13px] text-ink3">{assignment.kind}</span>
                </div>
                <h2 className="t-h1 mt-2 text-[26px]">{assignment.title}</h2>
                <p className="mt-1 text-ink2">{assignment.summary}</p>
              </div>
              <div className="text-right">
                <div className="t-lbl">Due</div>
                <div className="text-[16px] font-bold">{assignment.due}</div>
                <div className="text-[13px] text-ink2">{assignment.daysLeft}</div>
              </div>
            </div>

            <ProgressLine />

            <Hr />
            <div className="mt-4 flex items-center gap-3">
              <LinkButton to="/conjoint" variant="pri" icon="play">
                Continue conjoint analysis
              </LinkButton>
              <div className="whitespace-nowrap">
                <div className="text-[13px] text-ink3">{lastRun.when}</div>
                <RunLink id={lastRun.id} />
              </div>
              <span className="flex-1" />
              <div className="whitespace-nowrap text-right">
                <ModeChip mode={assignment.mode} prefix="AI tutor: " />
                <div className="mt-1 text-[13px] text-ink3">{modes[assignment.mode].short}</div>
              </div>
            </div>
          </Card>

          <h2 className="t-h2 mt-8">All assignments</h2>
          <Card className="mt-3">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Modules</th>
                  <th>Due</th>
                  <th>AI tutor</th>
                  <th>Progress</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {assignmentRows.map((row) => (
                  <tr key={row.title}>
                    <td className="w-[33%]">
                      <div className="font-semibold">{row.title}</div>
                      <div className="text-[13px] text-ink3">{row.sub}</div>
                    </td>
                    <td className="text-[13px] text-ink2">{row.modules}</td>
                    <td className="whitespace-nowrap">
                      <div className="num font-semibold">{row.due}</div>
                      <div className="text-[13px]">
                        {row.dueWarn ? (
                          <Tag tone="warn" icon="clock">
                            {row.dueNote}
                          </Tag>
                        ) : (
                          <span className="text-ink3">{row.dueNote}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <ModeChip mode={row.mode} />
                    </td>
                    <td className="w-[150px]">
                      <ProgressCell progress={row.progress} />
                    </td>
                    <td className="text-right">
                      <RowAction action={row.action} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div>
          <Card className="p-5">
            <h3 className="t-h3">How the AI tutor works here</h3>
            <p className="mt-1 text-[13px] text-ink2">Your professor chooses one mode per assignment.</p>
            <div className="mt-2">
              {modeOrder.map((mode, i) => (
                <div key={mode} className={cx('flex items-start gap-2.5 py-3', i > 0 && 'border-t border-line2')}>
                  <div className="w-[86px] flex-none">
                    <ModeChip mode={mode} />
                  </div>
                  <div className="text-[13px] text-ink2">{modes[mode].legend}</div>
                </div>
              ))}
            </div>
            <Note icon="eye" tone="primary" className="mt-2">
              {courseHome.legendNote}
            </Note>
          </Card>

          <Card className="mt-4 p-5">
            <h3 className="t-h3">Recent runs</h3>
            <div className="mt-3 flex flex-col gap-2.5">
              {courseHome.recentRuns[phase].map((run) => (
                <div key={run.id}>
                  <RunLink id={run.id} />
                  <div className="text-[13px] text-ink3">{run.when}</div>
                </div>
              ))}
            </div>
            <div className="mt-3">
              <Link to="/runs" className={buttonClass('quiet', 'md', '-ml-2')}>
                <Icon name="history" size={15} />
                Open run history
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </Page>
  )
}
