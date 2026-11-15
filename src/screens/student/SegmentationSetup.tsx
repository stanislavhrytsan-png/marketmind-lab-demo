/**
 * Segmentation setup. Priority 2: this screen is view-only in the demo. It
 * shows the guided four-step flow with the settings of run SEG-03.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { ThisRunCard } from '../../components/setup'
import { buttonClass } from '../../components/styles'
import { Eyebrow, Page } from '../../components/Shell'
import {
  Accordion,
  Card,
  DemoButton,
  LinkButton,
  Note,
  OptionCard,
  RunTag,
  Tag,
  What,
} from '../../components/ui'
import { caseBrief, course, segmentationSetup } from '../../data/alpineOat'
import { cx } from '../../lib/demo'

/** One step of the flow. Finished steps collapse to one line, the open step shows its options. */
function Step({
  state,
  n,
  last = false,
  children,
}: {
  state: 'done' | 'current' | 'todo'
  n: number
  last?: boolean
  children: ReactNode
}) {
  return (
    <div className="relative grid grid-cols-[36px_1fr] gap-x-3.5 pb-4">
      {!last && <span className="absolute -bottom-2.5 left-[13.5px] top-[38px] w-px bg-line" />}
      <span
        className={cx(
          'relative z-[1] mt-2.5 grid h-7 w-7 place-items-center rounded-full border-[1.5px] text-[13px] font-bold',
          state === 'done' && 'border-primary-l bg-primary-t text-primary-d',
          state === 'current' && 'border-primary bg-primary text-white',
          state === 'todo' && 'border-ctl3 bg-white text-ink2',
        )}
      >
        {state === 'done' ? <Icon name="check" size={14} /> : n}
      </span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function StepHead({ title, text, big = false, right }: { title: string; text: string; big?: boolean; right?: ReactNode }) {
  return (
    <div className="flex min-h-12 items-center gap-3">
      <div>
        <span className={cx('t-h3', big && 'text-[16px]')}>{title}</span>
        <div className="text-[13px] text-ink2">{text}</div>
      </div>
      {right && (
        <>
          <span className="flex-1" />
          {right}
        </>
      )}
    </div>
  )
}

export default function SegmentationSetup() {
  const { doneSteps, method, number, thisRun } = segmentationSetup
  return (
    <Page crumbs={[course.name, caseBrief.name, 'Segmentation', 'New run']}>
      <Eyebrow>Segmentation</Eyebrow>
      <h1 className="t-h1">Set up a segmentation run</h1>
      <p className="t-lead mt-1">{segmentationSetup.lead}</p>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_300px] items-start gap-6">
        <div className="min-w-0">
          {doneSteps.map((step, i) => (
            <Step key={step.title} state="done" n={i + 1}>
              <StepHead title={step.title} text={step.text} right={<DemoButton variant="quiet">Change</DemoButton>} />
            </Step>
          ))}

          <Step state="current" n={3}>
            <StepHead title={method.title} text={method.question} big />
            <div className="mt-1 grid grid-cols-2 gap-4">
              {method.options.map((option) => (
                <OptionCard
                  key={option.id}
                  selected={!!option.selected}
                  title={option.title}
                  tag={option.tag}
                  tagTone={option.selected ? 'primary' : 'neutral'}
                >
                  <What
                    className="mt-3"
                    rows={[
                      { term: 'What it does', text: option.does },
                      { term: 'Choose it when', text: option.when },
                    ]}
                  />
                  {option.doneIn && (
                    <p className="mt-3 text-[13px] text-ink3">
                      You already did this in <RunTag id={option.doneIn} />
                    </p>
                  )}
                </OptionCard>
              ))}
            </div>
            <Accordion className="mt-3" title="Advanced settings" note={method.advanced.note}>
              <What className="mt-3" rows={method.advanced.rows} />
            </Accordion>
            <div className="mt-4 flex items-center gap-3">
              <DemoButton variant="pri">Confirm method</DemoButton>
              <span className="text-[13px] text-ink3">Next: number of segments</span>
            </div>
          </Step>

          <Step state="todo" n={4} last>
            <StepHead title={number.title} text={number.text} />
            <Card tone="dashed" as="div" className="px-4 py-3.5">
              <div className="flex items-center gap-1.5">
                {number.options.map((k) => (
                  <span
                    key={k}
                    className={cx(
                      'grid h-[34px] w-[34px] place-items-center rounded-md font-semibold',
                      k === number.suggested ? 'bg-primary text-white' : 'border border-line bg-white text-ink2',
                    )}
                  >
                    {k}
                  </span>
                ))}
                <span className="flex-1" />
                <Tag tone="primary">Suggested: {number.suggested}</Tag>
              </div>
              <p className="mt-3 text-[13px] text-ink2">
                {number.whyBefore} <RunTag id="SEG-01" /> {number.whyAfter}
              </p>
              <div className="mt-2">
                <Link to="/segmentation/results" className={buttonClass('quiet', 'md', '-ml-2')}>
                  <Icon name="eye" size={15} />
                  Look at the SEG-01 tree
                </Link>
              </div>
            </Card>
          </Step>
        </div>

        {/* The run is named before it exists, and the card says what differs from the previous run. */}
        <ThisRunCard id={thisRun.id} label={thisRun.label} lines={thisRun.lines}>
          <Note icon="compare" className="mt-4">
            Compared with <RunTag id={thisRun.compareWith} />
            {thisRun.compareText}
          </Note>
          <div className="mt-4">
            <LinkButton to="/segmentation/results" variant="pri" icon="play" className="w-full justify-center">
              Run segmentation
            </LinkButton>
          </div>
          <p className="mt-2 text-[13px] text-ink3">{thisRun.note}</p>
        </ThisRunCard>
      </div>
    </Page>
  )
}
