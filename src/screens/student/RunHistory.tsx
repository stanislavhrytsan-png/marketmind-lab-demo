import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TrackBarChart } from '../../components/charts'
import { ImportanceTable, SizeBar } from '../../components/results'
import type { ImportanceColumn } from '../../components/results'
import { Icon } from '../../components/Icon'
import { Eyebrow, Page } from '../../components/Shell'
import { Card, CheckMark, Hr, Note, RunTag, SegName, Tag } from '../../components/ui'
import {
  allColor,
  caseBrief,
  comparisons,
  competitors,
  course,
  moduleNames,
  ownColor,
  runHistory,
  runs,
  savedDesign,
  segmentComparison,
  segments,
} from '../../data/alpineOat'
import type { ModuleId, Run, RunId } from '../../data/alpineOat'
import { pct, pct1, sharesAgainstCompetitors } from '../../lib/conjoint'
import { cx, useDemo } from '../../lib/demo'
import type { SizePart } from '../../lib/sizeParts'

const moduleOrder: ModuleId[] = ['segmentation', 'positioning', 'conjoint']
const byId = (id: string) => runs.find((r) => r.id === id)

/** The letter that marks a run in a comparison. */
function Letter({ is }: { is: 'A' | 'B' }) {
  return (
    <span className="inline-grid h-[22px] w-[22px] flex-none place-items-center rounded-[5px] bg-primary text-[12.5px] font-bold text-white">
      {is}
    </span>
  )
}

// ---------------------------------------------------------------- run list

function RunRow({ run, letter, onToggle }: { run: Run; letter?: 'A' | 'B'; onToggle: () => void }) {
  const { labelOf } = useDemo()
  const tag = <RunTag id={run.id} label={labelOf(run.id)} />
  return (
    <div
      onClick={onToggle}
      className={cx(
        'flex cursor-pointer items-start gap-2.5 px-4 py-2.5 transition-colors duration-150 ease-std',
        letter ? 'bg-primary-t shadow-[inset_3px_0_0_var(--color-primary)]' : 'hover:bg-[#FAFAFC]',
      )}
    >
      <button
        type="button"
        role="checkbox"
        aria-checked={!!letter}
        aria-label={`Compare ${run.id}, ${labelOf(run.id)}`}
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className="flex-none rounded"
      >
        {letter ? (
          <Letter is={letter} />
        ) : (
          <span className="m-[3px] block">
            <CheckMark on={false} />
          </span>
        )}
      </button>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          {run.to ? (
            <Link
              to={run.to}
              onClick={(e) => e.stopPropagation()}
              data-tip="Open the results of this run"
              className="rounded hover:underline"
            >
              {tag}
            </Link>
          ) : (
            tag
          )}
          {run.final && (
            <span className="text-primary" tabIndex={0} data-tip={runHistory.finalTip}>
              <Icon name="star" size={15} />
            </span>
          )}
        </div>
        <div className="mt-1 text-[13px] text-ink2">{run.summary}</div>
        <div className="text-[12.5px] text-ink3">{run.when}</div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------- result blocks

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <>
      <Hr />
      <div className="p-5">
        <div className="flex items-center gap-3">
          <h3 className="t-h3">{title}</h3>
          {note && <span className="text-[13px] text-ink3">{note}</span>}
        </div>
        {children}
      </div>
    </>
  )
}

function WhatChanged({ children }: { children: ReactNode }) {
  return (
    <Note icon="compare" tone="primary" className="mt-5">
      <b>What changed.</b> {children}
    </Note>
  )
}

/** CJ-01 against CJ-02: the same importance overall, plus one column per segment in B. */
function ImportanceComparison({ hideSame, text }: { hideSame: boolean; text: string }) {
  const same: ImportanceColumn[] = [
    { group: 'all', label: 'A, all respondents', faded: true },
    { group: 'all', label: 'B, all respondents', faded: true },
  ]
  const added: ImportanceColumn[] = segments.map((s) => ({
    group: s.id,
    label: (
      <>
        B, <SegName segment={s.id} short />
      </>
    ),
  }))
  return (
    <Section title="Attribute importance" note="Identical columns are faded. The segment columns exist only in B.">
      <div className="-mx-3 mt-2">
        <ImportanceTable columns={hideSame ? added : [...same, ...added]} />
      </div>
      <WhatChanged>{text}</WhatChanged>
    </Section>
  )
}

/** CJ-02 against CJ-03: B adds one product design with its predicted shares. */
function DesignComparison({ text }: { text: string }) {
  const { labelOf } = useDemo()
  const shares = sharesAgainstCompetitors(savedDesign)
  const names = [labelOf('CJ-03'), ...competitors.map((c) => c.name)]
  return (
    <Section title="Predicted shares" note="Only in B">
      <div className="mt-3">
        <TrackBarChart
          max={0.6}
          labelWidth={160}
          rows={names.map((name, i) => ({
            label: name,
            value: shares[i].all,
            color: i === 0 ? ownColor : allColor,
            text: pct(shares[i].all),
            tip: `${name}: ${pct1(shares[i].all)}`,
          }))}
        />
      </div>
      <WhatChanged>{text}</WhatChanged>
    </Section>
  )
}

/** SEG-02 against SEG-03: two segments stay, one is split. */
function SegmentComparison({ hideSame, text }: { hideSame: boolean; text: string }) {
  const { notInDemo } = useDemo()
  const { a, b, split } = segmentComparison
  const parts = (rows: typeof a | typeof b): SizePart[] =>
    rows.map((row) => {
      const segment = segments.find((s) => s.id === row.segment)
      const changedSegment = !row.same && !!segment
      return {
        key: row.segment,
        segment,
        name: segment?.name ?? ('name' in row ? row.name : undefined) ?? '',
        share: row.share,
        n: row.n,
        faded: row.same,
        caption: `${row.share}%, ${row.n}${changedSegment ? ' respondents' : ''}`,
      }
    })
  return (
    <>
      <Section title="Segment sizes" note={segmentComparison.sizesNote}>
        <div className="mt-4 flex items-start gap-3">
          <span className="mt-1">
            <Letter is="A" />
          </span>
          <div className="min-w-0 flex-1">
            <SizeBar parts={parts(a)} height={30} />
          </div>
        </div>
        <div className="mt-5 flex items-start gap-3">
          <span className="mt-1">
            <Letter is="B" />
          </span>
          <div className="min-w-0 flex-1">
            <SizeBar parts={parts(b)} height={30} />
          </div>
        </div>
        <WhatChanged>{text}</WhatChanged>
      </Section>
      <Section title={split.title} note={split.note}>
        <table className="tbl mt-2">
          <thead>
            <tr>
              <th>Variable</th>
              {split.columns.map((c) => (
                <th key={c} className="r">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {split.rows.map((row) => (
              <tr key={row.variable}>
                <td className="font-semibold">{row.variable}</td>
                {row.values.map((value, i) => (
                  <td key={i} className={cx('r', i === row.bold && 'font-bold')}>
                    {value}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {!hideSame && (
          <div className="mt-2 flex items-center gap-3 text-ink3">
            <span className="text-[13px]">{split.rest}</span>
            <button
              type="button"
              onClick={() => notInDemo()}
              className="h-[30px] rounded-md px-2.5 text-[13px] font-semibold text-primary hover:bg-primary-t"
            >
              Show them
            </button>
          </div>
        )}
      </Section>
    </>
  )
}

// ---------------------------------------------------------------- compare panel

function Compare({ a, b }: { a: Run; b: Run }) {
  const { labelOf } = useDemo()
  const [hideSame, setHideSame] = useState(false)

  // The settings table is worked out from the two runs. Nothing is pre-written here.
  const names = [...new Set([...a.settings, ...b.settings].map((s) => s.name))]
  const value = (run: Run, name: string) => run.settings.find((s) => s.name === name)?.value ?? 'None'
  const rows = names.map((name) => ({ name, a: value(a, name), b: value(b, name) }))
  const changed = rows.filter((r) => r.a !== r.b)

  const prepared = comparisons[`${a.id}|${b.id}`]
  const list = changed.map((r) => r.name.toLowerCase())
  const sentence =
    prepared?.sentence ??
    (changed.length === 0
      ? 'These two runs have the same settings.'
      : changed.length === 1
        ? `One setting differs: ${list[0]}.`
        : `${changed.length} settings differ: ${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}.`)

  return (
    <Card>
      <div className="p-5 pb-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <Letter is="A" />
          <RunTag id={a.id} label={labelOf(a.id)} />
          <span className="text-ink2">compared with</span>
          <Letter is="B" />
          <RunTag id={b.id} label={labelOf(b.id)} />
        </div>
        <p className="mt-4 max-w-[46ch] font-serif text-[24px] leading-[1.3]">{sentence}</p>
      </div>
      <Hr />

      <div className="p-5">
        <div className="flex items-center gap-3">
          <h3 className="t-h3">Settings</h3>
          <span className="text-[13px] text-ink3">
            {changed.length} of {rows.length} {changed.length === 1 ? 'differs' : 'differ'}
          </span>
          <span className="flex-1" />
          <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold">
            <input
              type="checkbox"
              checked={hideSame}
              onChange={(e) => setHideSame(e.target.checked)}
              className="m-0 h-4 w-4 accent-primary"
            />
            Hide what is identical
          </label>
        </div>
        <table className="tbl mt-2">
          <thead>
            <tr>
              <th>Setting</th>
              <th>A, {a.id}</th>
              <th>B, {b.id}</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const same = row.a === row.b
              if (same && hideSame) return null
              const big = Math.max(row.a.length, row.b.length) <= 3
              return same ? (
                // Identical settings fade back.
                <tr key={row.name} className="text-ink3">
                  <td>{row.name}</td>
                  <td>{row.a}</td>
                  <td>{row.b}</td>
                  <td className="w-[110px] text-[13px]">Same</td>
                </tr>
              ) : (
                // The changed setting is marked.
                <tr key={row.name} className="bg-primary-t">
                  <td className="font-semibold shadow-[inset_3px_0_0_var(--color-primary)]">{row.name}</td>
                  <td className={cx('font-bold', big && 'text-[16px]')}>{row.a}</td>
                  <td className={cx('font-bold', big && 'text-[16px]')}>{row.b}</td>
                  <td className="w-[110px]">
                    <Tag tone="primary">Changed</Tag>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {prepared?.result === 'importance' && <ImportanceComparison hideSame={hideSame} text={prepared.whatChanged} />}
      {prepared?.result === 'design' && <DesignComparison text={prepared.whatChanged} />}
      {prepared?.result === 'segments' && <SegmentComparison hideSame={hideSame} text={prepared.whatChanged} />}
      {!prepared && (
        <>
          <Hr />
          <p className="p-5 text-[13px] text-ink3">{runHistory.noResultComparison}</p>
        </>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------- screen

export default function RunHistory() {
  const { visibleRuns, conjointRun, markConjointRun, labelOf } = useDemo()
  const [params, setParams] = useSearchParams()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<ModuleId | 'all'>('all')

  // A link such as /runs?a=CJ-01&b=CJ-02 only makes sense once the conjoint runs exist.
  const asked = [params.get('a'), params.get('b')].filter((id): id is string => !!id)
  const asksForConjoint = asked.some((id) => byId(id)?.module === 'conjoint')
  useEffect(() => {
    if (asksForConjoint) markConjointRun()
  }, [asksForConjoint, markConjointRun])

  const order = (id: string) => runs.findIndex((r) => r.id === id)
  const selected = (params.has('a') || params.has('b') ? asked : runHistory.defaultPair[conjointRun ? 'after' : 'before'])
    .filter((id) => visibleRuns.some((r) => r.id === id))
    .sort((x, y) => order(x) - order(y)) as RunId[]

  const toggle = (id: RunId) => {
    const run = byId(id)!
    const next = selected.includes(id)
      ? selected.filter((x) => x !== id)
      : // Only runs of the same module can be compared, and only two at a time.
        [...selected.filter((x) => byId(x)!.module === run.module), id].slice(-2)
    next.sort((x, y) => order(x) - order(y))
    setParams({ a: next[0] ?? '', b: next[1] ?? '' }, { replace: true })
  }

  const text = query.trim().toLowerCase()
  const shown = visibleRuns.filter(
    (r) =>
      (filter === 'all' || r.module === filter) &&
      (!text || `${r.id} ${labelOf(r.id)} ${r.summary}`.toLowerCase().includes(text)),
  )
  const count = (m: ModuleId) => visibleRuns.filter((r) => r.module === m).length
  const chips: { id: ModuleId | 'all'; label: string }[] = [
    { id: 'all', label: `All ${visibleRuns.length}` },
    ...moduleOrder
      .filter((m) => count(m) > 0)
      .map((m) => ({ id: m, label: `${m === 'conjoint' ? 'Conjoint' : moduleNames[m]} ${count(m)}` })),
  ]

  const [a, b] = selected.map((id) => byId(id)!)
  /** A single ticked run whose module has no second run to compare it with. */
  const alone = !!a && !b && count(a.module) === 1

  return (
    <Page crumbs={[course.name, caseBrief.name, 'Run history']}>
      <div className="flex items-center gap-3">
        <div>
          <Eyebrow>{caseBrief.name}</Eyebrow>
          <h1 className="t-h1">Run history</h1>
        </div>
        <span className="flex-1" />
        <span className="text-[13px] text-ink2">{runHistory.hint}</span>
      </div>

      <div className="mt-5 grid grid-cols-[392px_minmax(0,1fr)] items-start gap-6">
        <Card className="pb-2">
          <div className="px-4 pt-3.5">
            <label className="flex h-9 items-center gap-2 rounded-md border border-ctl bg-white px-2.5 text-ink3 focus-within:border-primary">
              <Icon name="search" size={15} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or setting"
                aria-label="Search runs by name or setting"
                className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none placeholder:text-ink3"
              />
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 px-4 pt-2.5">
            {chips.map((chip) => (
              <button key={chip.id} type="button" aria-pressed={filter === chip.id} onClick={() => setFilter(chip.id)}>
                <Tag tone={filter === chip.id ? 'primary' : 'outline'}>{chip.label}</Tag>
              </button>
            ))}
          </div>

          {moduleOrder.map((m) => {
            const list = shown.filter((r) => r.module === m)
            if (list.length === 0) return null
            return (
              <div key={m}>
                <div className="t-lbl px-4 pb-1 pt-3.5">{moduleNames[m]}</div>
                {list.map((run) => (
                  <RunRow
                    key={run.id}
                    run={run}
                    letter={selected.includes(run.id) ? (selected.indexOf(run.id) === 0 ? 'A' : 'B') : undefined}
                    onToggle={() => toggle(run.id)}
                  />
                ))}
              </div>
            )
          })}
          {shown.length === 0 && <p className="px-4 py-6 text-[13px] text-ink3">No run matches your search.</p>}
        </Card>

        {a && b ? (
          <Compare key={`${a.id}|${b.id}`} a={a} b={b} />
        ) : (
          <Card tone="dashed" className="grid min-h-[280px] place-items-center p-8 text-center">
            <div>
              <Icon name="compare" size={22} className="mx-auto text-ink3" />
              <p className="t-h3 mt-3">
                {!a
                  ? 'Tick two runs to compare them'
                  : alone
                    ? `${a.id} is the only ${moduleNames[a.module].toLowerCase()} run`
                    : `Tick one more ${moduleNames[a.module].toLowerCase()} run`}
              </p>
              <p className="mt-1 max-w-[44ch] text-[13px] text-ink3">
                {alone
                  ? 'A comparison needs two runs of the same module.'
                  : 'The comparison shows only what differs: identical settings and results fade back.'}
              </p>
            </div>
          </Card>
        )}
      </div>
    </Page>
  )
}
