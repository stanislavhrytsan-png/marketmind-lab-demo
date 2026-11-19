/**
 * Building blocks of the results screens: the run header, the depth rail
 * (results in numbered layers), and the small tables and bars that show
 * segment sizes and attribute importance.
 */
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { allColor, attributes, respondentCount, segments } from '../data/alpineOat'
import type { AttrId, GroupId, RunId } from '../data/alpineOat'
import { importance } from '../lib/conjoint'
import { cx } from '../lib/demo'
import type { SizePart } from '../lib/sizeParts'
import { Button, DemoButton, EditableLabel, LinkButton, Marker, RunTag, SegName } from './ui'

// ---------------------------------------------------------------- run header

export function RunHeader({
  id,
  summary,
  setupTo,
  compareTo,
  onInterpret,
  interpretTo = '/interpretation',
}: {
  id: RunId
  summary: string
  /** The setup screen of this run, if the demo has one. */
  setupTo?: string
  compareTo: string
  /** What "Write interpretation" does when the interpretation is on the same screen. Default: open the interpretation screen. */
  onInterpret?: () => void
  /** Where "Write interpretation" leads instead of the interpretation screen of the assignment. */
  interpretTo?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div>
        <div className="flex items-center gap-3">
          <RunTag id={id} />
          <EditableLabel id={id} className="text-[18px] font-bold leading-[1.25]" />
        </div>
        <p className="mt-1 text-[13px] text-ink2">
          {summary}
          {setupTo && (
            <>
              {' '}
              <Link to={setupTo} className="font-semibold text-primary hover:underline">
                Open setup
              </Link>
            </>
          )}
        </p>
      </div>
      <span className="flex-1" />
      <LinkButton to={compareTo} icon="compare">
        Compare
      </LinkButton>
      <DemoButton icon="code">Export as Python or R</DemoButton>
      {onInterpret ? (
        <Button variant="pri" icon="pencil" onClick={onInterpret}>
          Write interpretation
        </Button>
      ) : (
        <LinkButton to={interpretTo} variant="pri" icon="pencil">
          Write interpretation
        </LinkButton>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- depth rail

/**
 * One layer of a results screen. The rail on the left tells the student how
 * deep they are: 1 Headline, 2 Key results, 3 Details.
 */
export function Layer({
  n,
  title,
  note,
  last = false,
  id,
  children,
}: {
  n: number
  title: string
  note: string
  last?: boolean
  /** A name to scroll to. The layer then stops below the top bar. */
  id?: string
  children: ReactNode
}) {
  return (
    <section id={id} className="relative grid scroll-mt-[76px] grid-cols-[150px_minmax(0,1fr)] gap-x-6 [&+section]:mt-8">
      <div className="relative grid grid-cols-[26px_1fr] content-start gap-x-2.5">
        <span
          className={cx(
            'relative z-[1] row-span-2 grid h-[26px] w-[26px] place-items-center rounded-full text-[13px] font-bold',
            n === 1 ? 'bg-primary text-white' : 'border-[1.5px] border-primary bg-white text-primary',
          )}
        >
          {n}
        </span>
        <b className="mt-[3px] text-[13.5px]">{title}</b>
        <span className="col-start-2 mt-0.5 text-[12.5px] leading-[1.35] text-ink3">{note}</span>
        {!last && <span className="absolute -bottom-[34px] left-[12.5px] top-[30px] w-px bg-primary-l" />}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  )
}

// ---------------------------------------------------------------- segment sizes

/** One horizontal bar split by segment size, with a labelled legend below. */
export function SizeBar({ parts, height = 34 }: { parts: SizePart[]; height?: number }) {
  return (
    <>
      <div className="flex gap-0.5" style={{ height }}>
        {parts.map((p) => (
          <div
            key={p.key}
            tabIndex={0}
            data-tip={`${p.name}: ${p.share}% of respondents (${p.n} of ${respondentCount})`}
            className={cx('bar-grow min-w-0 rounded', !p.segment && 'hatch')}
            style={{ flex: p.share, background: p.segment?.color, opacity: p.faded ? 0.28 : 1 }}
          />
        ))}
      </div>
      <div className="mt-2 flex gap-0.5">
        {parts.map((p) => (
          <div key={p.key} className="min-w-0 text-[13px]" style={{ flex: p.share }}>
            <span
              className={cx(
                'inline-flex items-center gap-1.5 whitespace-nowrap',
                p.faded ? 'font-normal text-ink3' : 'font-semibold',
              )}
            >
              <span className={cx('inline-flex', p.faded && 'opacity-45')}>
                {p.segment ? (
                  <Marker segment={p.segment.id} />
                ) : (
                  <span className="hatch inline-block h-[11px] w-[11px] rounded-sm" />
                )}
              </span>
              {p.name}
            </span>
            <br />
            <span className={cx('num whitespace-nowrap', p.faded ? 'text-ink3' : 'text-ink2')}>
              {p.caption ?? `${p.share}%, ${p.n} respondents`}
            </span>
          </div>
        ))}
      </div>
    </>
  )
}

// ---------------------------------------------------------------- attribute importance

const groupColor = (group: GroupId) => (group === 'all' ? allColor : segments.find((s) => s.id === group)!.color)
const groupName = (group: GroupId) => (group === 'all' ? 'All respondents' : segments.find((s) => s.id === group)!.short)

export function GroupHead({ group }: { group: GroupId }) {
  return group === 'all' ? <>All respondents</> : <SegName segment={group} short className="font-semibold" />
}

export interface ImportanceColumn {
  group: GroupId
  /** Column heading. Default: the group's name with its marker. */
  label?: ReactNode
  /** Faded columns are the ones that did not change in a comparison. */
  faded?: boolean
  /** Importance from another run than the final one. Default: the group's importance in run CJ-02. */
  values?: Record<AttrId, number>
}

const defaultColumns: ImportanceColumn[] = [{ group: 'all' }, { group: 'health' }, { group: 'taste' }, { group: 'price' }]

/**
 * Attribute importance for all respondents and for each segment, side by side.
 * The largest value in each column is in bold.
 */
export function ImportanceTable({ columns = defaultColumns }: { columns?: ImportanceColumn[] }) {
  const data = columns.map((column) => {
    const values = column.values ?? importance(column.group)
    return { ...column, values, max: Math.max(...Object.values(values)) }
  })
  return (
    <table className="tbl tbl-tight">
      <thead>
        <tr>
          <th />
          {data.map((c, i) => (
            <th key={i} className={c.faded ? 'font-normal' : undefined}>
              <span className="flex items-center gap-[5px]">{c.label ?? <GroupHead group={c.group} />}</span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {attributes.map((attr) => (
          <tr key={attr.id}>
            <td className="w-[84px] whitespace-nowrap font-semibold">{attr.name}</td>
            {data.map((c, i) => {
              const value = c.values[attr.id]
              return (
                <td
                  key={i}
                  tabIndex={0}
                  data-tip={`${attr.name}, ${groupName(c.group)}: ${Math.round(value * 100)}% of the choice`}
                >
                  <div className="flex items-center gap-2">
                    <span className="h-3 flex-1 rounded-[3px] bg-fill">
                      <i
                        className="bar-grow block h-3 rounded-r-[3px]"
                        style={{
                          width: `${Math.min(100, (value / 0.65) * 100)}%`,
                          background: groupColor(c.group),
                          opacity: c.faded ? 0.35 : 1,
                        }}
                      />
                    </span>
                    <span
                      className={cx(
                        'num w-8 text-right',
                        c.faded ? 'text-ink3' : value === c.max ? 'font-bold' : 'text-ink2',
                      )}
                    >
                      {Math.round(value * 100)}%
                    </span>
                  </div>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

// ---------------------------------------------------------------- small bars

/** Bar inside a table cell: a track, a bar and the value in ink. */
export function CellBar({
  fraction,
  color,
  text,
  height = 16,
}: {
  /** Filled part of the track, 0 to 1. */
  fraction: number
  color: string
  text: string
  height?: number
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex-1 rounded-[3px] bg-fill" style={{ height }}>
        <i
          className="bar-grow block rounded-r transition-[width] duration-200 ease-std"
          style={{ height, width: `${Math.max(0, Math.min(1, fraction)) * 100}%`, background: color }}
        />
      </span>
      <span className="num w-[38px] text-right font-bold">{text}</span>
    </div>
  )
}

/** Diverging bar around a centre line, for example a segment against the average respondent. */
export function DivergingRow({
  label,
  value,
  extent,
  color,
  tip,
}: {
  label: string
  value: number
  /** Value at the outer end of the track. */
  extent: number
  color: string
  tip: string
}) {
  const width = (Math.abs(value) / extent) * 50
  return (
    <div
      tabIndex={0}
      data-tip={tip}
      className="grid h-6 grid-cols-[118px_1fr_40px] items-center gap-2.5 text-[13px]"
    >
      <span>{label}</span>
      <span className="relative h-3">
        <span className="absolute -bottom-1 -top-1 left-1/2 w-px bg-[#AEB4C0]" />
        <i
          className={cx('absolute top-0 h-3', value >= 0 ? 'rounded-r-[3px]' : 'rounded-l-[3px]')}
          style={{ left: `${value >= 0 ? 50 : 50 - width}%`, width: `${width}%`, background: color }}
        />
      </span>
      <span className="num text-right font-semibold">
        {value < 0 ? '−' : '+'}
        {Math.abs(value).toFixed(1)}
      </span>
    </div>
  )
}
