import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Icon } from '../../components/Icon'
import { SetupHeading, ThisRunCard } from '../../components/setup'
import { Eyebrow, Page } from '../../components/Shell'
import {
  Button,
  Card,
  CheckMark,
  DemoButton,
  Hr,
  LinkButton,
  Note,
  OptionCard,
  RunTag,
  Switch,
  Tag,
  What,
} from '../../components/ui'
import { attributes, caseBrief, conjointSetup, course, restriction } from '../../data/alpineOat'
import { allowedCount, productCount } from '../../lib/conjoint'
import { useDemo } from '../../lib/demo'

const RUN_TIME = 1700 // ms. The results are pre-made, so the "run" is only a short pause.

const runId = (index: number) => `CJ-0${index + 1}`

/** "CJ-01", "CJ-01 and CJ-02", "CJ-01, CJ-02 and CJ-03" as run tags. */
function RunList({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <span key={i}>
          {i > 0 && (i === count - 1 ? ' and ' : ', ')}
          <RunTag id={runId(i)} />
        </span>
      ))}
    </>
  )
}

export default function ConjointSetup() {
  const navigate = useNavigate()
  const { conjointRun, markConjointRun, rename, notInDemo } = useDemo()
  const { utilities, rules, batch } = conjointSetup

  const [utility, setUtility] = useState('segment')
  const [rule, setRule] = useState('share')
  const [batchOn, setBatchOn] = useState(true)
  const [ticked, setTicked] = useState<string[]>(batch.premade)
  const [customLabel, setCustomLabel] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const timer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  // Which runs would be created with the current settings.
  const scenarios = batchOn
    ? batch.scenarios.filter((s) => ticked.includes(s.id))
    : [
        {
          id: `${utility}-${rule}`,
          runLabel: utilities.find((u) => u.id === utility)!.runLabel + (rule === 'first' ? ', first choice' : ''),
        },
      ]
  const count = scenarios.length
  const premade = batchOn && count === batch.premade.length && batch.premade.every((id) => ticked.includes(id))

  const defaultLabel = scenarios[0]?.runLabel ?? ''
  const label = customLabel ?? defaultLabel

  const hasAll = ticked.includes('all')
  const hasSegment = ticked.includes('segment') || ticked.includes('segmentFirst')
  const utilitiesLine = !batchOn
    ? utilities.find((u) => u.id === utility)!.title
    : hasAll && hasSegment
      ? 'All respondents, and each segment (batch)'
      : hasAll
        ? 'All respondents'
        : hasSegment
          ? 'Each segment'
          : 'No scenario ticked'
  const ruleLine = !batchOn
    ? rules.find((r) => r.id === rule)!.title
    : ticked.includes('segmentFirst')
      ? ticked.length > 1
        ? 'Share of preference, and first choice (batch)'
        : 'First choice'
      : 'Share of preference'

  const levelCount = attributes.reduce((sum, a) => sum + a.levels.length, 0)
  const removed = productCount - allowedCount
  const level = (r: typeof restriction.a) => {
    const attr = attributes.find((a) => a.id === r.attr)!
    return { attr: attr.name, level: attr.levels[r.level] }
  }
  const [left, right] = [level(restriction.a), level(restriction.b)]

  const reset = () => {
    setUtility('segment')
    setRule('share')
    setBatchOn(true)
    setTicked(batch.premade)
  }

  const run = () => {
    setRunning(true)
    timer.current = window.setTimeout(() => {
      if (customLabel && customLabel.trim() !== defaultLabel) rename('CJ-01', customLabel)
      markConjointRun()
      navigate('/conjoint/results')
    }, RUN_TIME)
  }

  const runLabel = count > 1 ? `Run ${count} scenarios` : 'Run conjoint analysis'

  return (
    <Page crumbs={[course.name, caseBrief.name, 'Conjoint analysis', 'New run']}>
      <Eyebrow>Conjoint analysis</Eyebrow>
      <h1 className="t-h1">Set up a conjoint run</h1>
      <p className="t-lead mt-1">{conjointSetup.lead}</p>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_300px] items-start gap-6">
        <div className="min-w-0">
          {/* Attributes and levels in one table */}
          <Card>
            <div className="flex items-center gap-3 px-5 pb-1 pt-4">
              <SetupHeading>Attributes and levels</SetupHeading>
              <span className="flex-1" />
              <span className="num text-[13px] text-ink2">
                {attributes.map((a) => a.levels.length).join(' × ')} = <b>{productCount}</b> possible products
              </span>
            </div>
            <div className="px-2 pb-1">
              <table className="tbl">
                <tbody>
                  {attributes.map((attr) => (
                    <tr key={attr.id}>
                      <td className="w-[130px] font-semibold">{attr.name}</td>
                      <td>
                        <div className="flex flex-wrap items-center gap-1.5">
                          {attr.levels.map((name) => (
                            <span
                              key={name}
                              className="whitespace-nowrap rounded border border-line bg-white px-2.5 py-[3px] text-[13.5px] font-medium text-ink2"
                            >
                              {name}
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => notInDemo()}
                            className="inline-flex items-center gap-[5px] rounded px-2 py-px text-[12.5px] font-semibold text-primary"
                          >
                            <Icon name="plus" size={13} />
                            Add level
                          </button>
                        </div>
                      </td>
                      <td className="r w-[80px] whitespace-nowrap text-[13px] text-ink3">{attr.levels.length} levels</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Hr />
            <div className="px-3 py-2">
              <DemoButton variant="quiet" icon="plus">
                Add attribute
              </DemoButton>
            </div>
          </Card>

          {/* The restriction is written as a sentence */}
          <Card className="mt-4 p-5">
            <div className="flex items-center gap-3">
              <SetupHeading>Restrictions</SetupHeading>
              <span className="flex-1" />
              <Tag tone="primary">
                1 restriction, removes {removed} of {productCount} products
              </Tag>
            </div>
            <What
              className="mt-2"
              rows={[
                { term: 'What it does', text: conjointSetup.restrictions.does },
                { term: 'Choose it when', text: conjointSetup.restrictions.when },
              ]}
            />
            <div className="mt-4 flex items-center gap-2.5 rounded-lg bg-fill px-3 py-2.5">
              <button
                type="button"
                onClick={() => notInDemo()}
                className="flex h-8 items-center gap-2 whitespace-nowrap rounded-md border border-ctl bg-white px-2.5 text-[14px]"
              >
                {left.attr} is <b>{left.level}</b>
                <Icon name="chevronDown" size={14} />
              </button>
              <span className="whitespace-nowrap font-semibold text-ink2">cannot be combined with</span>
              <button
                type="button"
                onClick={() => notInDemo()}
                className="flex h-8 items-center gap-2 whitespace-nowrap rounded-md border border-ctl bg-white px-2.5 text-[14px]"
              >
                {right.attr} is <b>{right.level}</b>
                <Icon name="chevronDown" size={14} />
              </button>
              <span className="flex-1" />
              <DemoButton variant="quiet" size="sm" aria-label="Remove restriction">
                <Icon name="close" size={15} />
              </DemoButton>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <DemoButton variant="quiet" icon="plus" className="-ml-2">
                Add restriction
              </DemoButton>
              <span className="flex-1" />
              <div className="w-[260px]">
                <div className="text-[13px] font-semibold">
                  {allowedCount} of {productCount} products allowed
                </div>
                <div className="mt-[5px] h-1.5 rounded-[3px] bg-line">
                  <i
                    className="block h-1.5 rounded-[3px] bg-primary"
                    style={{ width: `${(allowedCount / productCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Analysis settings, each with "What it does" and "Choose it when" */}
          <section className="mt-6">
            <SetupHeading>Estimate utilities for</SetupHeading>
            <div role="radiogroup" aria-label="Estimate utilities for" className="mt-2 grid grid-cols-3 gap-4">
              {utilities.map((option) => (
                <OptionCard
                  key={option.id}
                  selected={utility === option.id}
                  onSelect={() => setUtility(option.id)}
                  title={option.title}
                  tag={option.tag}
                  className="px-4 py-3.5"
                >
                  <What
                    stack
                    className="mt-2"
                    rows={[
                      { term: 'What it does', text: option.does },
                      { term: 'Choose it when', text: option.when },
                    ]}
                  />
                </OptionCard>
              ))}
            </div>

            <SetupHeading className="mt-6">Choice rule in the simulator</SetupHeading>
            <div role="radiogroup" aria-label="Choice rule in the simulator" className="mt-2 grid grid-cols-2 gap-4">
              {rules.map((option) => (
                <OptionCard
                  key={option.id}
                  selected={rule === option.id}
                  onSelect={() => setRule(option.id)}
                  title={option.title}
                  tag={option.tag}
                  className="px-4 py-3.5"
                >
                  <What
                    className="mt-2"
                    rows={[
                      { term: 'What it does', text: option.does },
                      { term: 'Choose it when', text: option.when },
                    ]}
                  />
                </OptionCard>
              ))}
            </div>
          </section>

          {/* Scenario batch: several named runs in one go */}
          <Card tone="tint" className="mt-6 p-5">
            <div className="flex items-center gap-3">
              <Switch on={batchOn} onChange={setBatchOn} label="Scenario batch" />
              <SetupHeading>Scenario batch</SetupHeading>
              <span className="flex-1" />
              <span className="text-[13px] text-ink2">
                {batchOn ? `${count} ${count === 1 ? 'run' : 'runs'} will be created` : 'Off: one run will be created'}
              </span>
            </div>
            <p className="mt-2 max-w-[70ch] text-[13px] text-ink2">{batch.text}</p>
            <div className="mt-3 flex flex-col gap-2">
              {batch.scenarios.map((scenario) => {
                const on = batchOn && ticked.includes(scenario.id)
                const index = scenarios.findIndex((s) => s.id === scenario.id)
                return (
                  <button
                    key={scenario.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    disabled={!batchOn}
                    onClick={() =>
                      setTicked((old) =>
                        old.includes(scenario.id) ? old.filter((id) => id !== scenario.id) : [...old, scenario.id],
                      )
                    }
                    className="flex items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <CheckMark on={on} />
                    <span className={on ? 'font-semibold' : 'text-ink2'}>{scenario.label}</span>
                    {on && (
                      <>
                        <span className="text-[13px] text-ink2">becomes</span>
                        <RunTag id={runId(index)} />
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          </Card>
        </div>

        {/* The run is named before it exists */}
        <ThisRunCard
          id={runId(0)}
          label={label}
          onLabelChange={setCustomLabel}
          lines={[
            { name: 'Attributes', value: `${attributes.length} attributes, ${levelCount} levels` },
            { name: 'Restrictions', value: `1, leaving ${allowedCount} of ${productCount} products` },
            { name: 'Utilities', value: utilitiesLine },
            { name: 'Choice rule', value: ruleLine },
          ]}
        >
          {batchOn && count > 0 && !(conjointRun && premade) && (
            <Note icon="compare" className="mt-4">
              Scenario batch is on. This creates <RunList count={count} /> with one click.
            </Note>
          )}
          {conjointRun && premade && (
            <Note icon="check" className="mt-4">
              You have already run these settings as <RunList count={count} />.
            </Note>
          )}

          <div className="mt-4">
            {conjointRun && premade ? (
              <LinkButton to="/conjoint/results" variant="pri" className="w-full justify-center">
                Open results
              </LinkButton>
            ) : (
              <Button
                variant="pri"
                icon="play"
                className="w-full justify-center"
                disabled={!premade || running}
                onClick={run}
              >
                {running ? `Running ${count} scenarios…` : runLabel}
              </Button>
            )}
          </div>

          {running && (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" role="progressbar" aria-label="Run in progress">
              <i className="block h-1 origin-left animate-[grow_1.7s_linear_both] rounded-full bg-primary" />
            </div>
          )}

          {premade ? (
            !conjointRun && !running && <p className="mt-2 text-[13px] text-ink3">{conjointSetup.runNote}</p>
          ) : (
            <div className="mt-2 text-[13px] text-ink3">
              {conjointSetup.demoOnlyNote}
              <div>
                <Button variant="quiet" size="sm" className="-ml-2.5 mt-1" onClick={reset}>
                  Back to defaults
                </Button>
              </div>
            </div>
          )}
        </ThisRunCard>
      </div>
    </Page>
  )
}
