import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { TrackBarChart } from '../../components/charts'
import { Icon } from '../../components/Icon'
import { ImportanceTable, SizeBar } from '../../components/results'
import { Eyebrow, Page } from '../../components/Shell'
import { TutorPanel } from '../../components/tutor'
import { Card, Checkbox, DemoButton, RunTag, SegmentedControl } from '../../components/ui'
import {
  allColor,
  assignment,
  caseBrief,
  competitors,
  course,
  interpretation,
  modes,
  ownColor,
  runs,
  savedDesign,
} from '../../data/alpineOat'
import type { Mode, RunId } from '../../data/alpineOat'
import { pct, pct1, sharesAgainstCompetitors } from '../../lib/conjoint'
import { useDemo } from '../../lib/demo'
import { segmentParts } from '../../lib/sizeParts'

/** A result the student pinned, always with the run it comes from. */
function Pinned({ run, title, children }: { run: RunId; title: string; children: ReactNode }) {
  const { labelOf, notInDemo } = useDemo()
  const to = runs.find((r) => r.id === run)?.to
  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        {to ? (
          <Link to={to} className="rounded" data-tip="Open the results of this run">
            <RunTag id={run} />
          </Link>
        ) : (
          <RunTag id={run} />
        )}
        <span className="text-[13px] text-ink2">{labelOf(run)}</span>
        <span className="flex-1" />
        <button
          type="button"
          aria-label="Unpin this result"
          data-tip="Unpin this result"
          onClick={() => notInDemo()}
          className="rounded text-ink3 transition-colors duration-150 ease-std hover:text-primary"
        >
          <Icon name="pin" size={15} />
        </button>
      </div>
      <h3 className="t-h3 mt-2">{title}</h3>
      <div className="mt-2">{children}</div>
    </Card>
  )
}

function PinnedShares() {
  const { labelOf } = useDemo()
  const shares = sharesAgainstCompetitors(savedDesign)
  const names = [labelOf('CJ-03'), ...competitors.map((c) => c.name)]
  return (
    <TrackBarChart
      max={0.6}
      labelWidth={150}
      rows={names.map((name, i) => ({
        label: name,
        value: shares[i].all,
        color: i === 0 ? ownColor : allColor,
        text: pct(shares[i].all),
        tip: `${name}: ${pct1(shares[i].all)}`,
      }))}
    />
  )
}

export default function Interpretation() {
  const { markConjointRun } = useDemo()
  // The pinned results come from the conjoint runs, so those count as done here.
  useEffect(() => markConjointRun(), [markConjointRun])

  const [mode, setMode] = useState<Mode>(assignment.mode)
  const [text, setText] = useState(interpretation.draft)
  const [checks, setChecks] = useState(interpretation.checklist.map((c) => c.done))

  /** Not part of the product: lets the presenter show how each of the three modes behaves. */
  const demoControl = (
    <div className="border-b border-dashed border-ctl bg-page px-5 py-2.5">
      <div className="flex items-center gap-2.5">
        <span className="whitespace-nowrap rounded border border-dashed border-ctl2 px-1.5 text-[11.5px] font-semibold uppercase tracking-[.04em] text-ink2">
          Demo control
        </span>
        <span className="whitespace-nowrap text-[12.5px] text-ink2">Tutor mode</span>
        <span className="flex-1" />
        <SegmentedControl
          label="Demo control: AI tutor mode"
          value={mode}
          onChange={setMode}
          options={(['off', 'coach', 'explain'] as Mode[]).map((m) => ({ value: m, label: modes[m].label }))}
        />
      </div>
      <p className="mt-1.5 text-[12px] leading-[1.4] text-ink3">
        Not part of the product: there the professor sets the mode and students cannot change it. All tutor messages
        are scripted.
      </p>
    </div>
  )

  return (
    <Page
      crumbs={[course.name, caseBrief.name, 'Interpretation']}
      mode={mode}
      aside={<TutorPanel key={mode} mode={mode} text={text} onTextChange={setText} demoControl={demoControl} />}
    >
      <Eyebrow>{interpretation.eyebrow}</Eyebrow>
      <h1 className="t-h1 max-w-[34ch]">{interpretation.question}</h1>
      <p className="t-lead mt-2 max-w-[60ch]">{interpretation.ask}</p>

      <div className="mt-8 flex items-center gap-3">
        <h2 className="t-h2">Results you pinned</h2>
        <span className="flex-1" />
        <DemoButton size="sm" icon="pin">
          Pin another result
        </DemoButton>
      </div>
      <div className="mt-3 flex flex-col gap-4">
        <Pinned run="CJ-02" title={interpretation.pinned[0].title}>
          <div className="-mx-3">
            <ImportanceTable />
          </div>
        </Pinned>
        <Pinned run="CJ-03" title={interpretation.pinned[1].title}>
          <PinnedShares />
        </Pinned>
        <Pinned run="SEG-03" title={interpretation.pinned[2].title}>
          <SizeBar parts={segmentParts()} />
        </Pinned>
      </div>

      <section className="mt-6">
        <h2 className="t-h3">{interpretation.checklistTitle}</h2>
        <div className="mt-2 flex flex-col gap-2">
          {interpretation.checklist.map((item, i) => (
            <Checkbox key={item.text} on={checks[i]} onChange={(on) => setChecks(checks.map((c, k) => (k === i ? on : c)))}>
              {item.text}
            </Checkbox>
          ))}
        </div>
      </section>
    </Page>
  )
}
