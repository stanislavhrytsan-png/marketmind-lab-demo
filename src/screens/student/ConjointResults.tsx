import { useEffect, useMemo, useState } from 'react'
import { PartWorthChart } from '../../components/charts'
import { CellBar, GroupHead, ImportanceTable, Layer, RunHeader } from '../../components/results'
import { Page } from '../../components/Shell'
import {
  Accordion,
  Button,
  Card,
  DemoButton,
  Hr,
  Note,
  RunTag,
  SegName,
  SegmentedControl,
  Select,
  Tag,
} from '../../components/ui'
import {
  allColor,
  attributes,
  caseBrief,
  competitors,
  conjointResults,
  course,
  ownColor,
  partWorths,
  respondentCount,
  restriction,
  savedDesign,
  segments,
} from '../../data/alpineOat'
import type { AttrId, Design, GroupId } from '../../data/alpineOat'
import {
  allowedCount,
  bestProducts,
  describe,
  levelBlocked,
  pct,
  pct1,
  preferredLevel,
  productCount,
  sameDesign,
  sharesAgainstCompetitors,
  signed,
  topAttribute,
} from '../../lib/conjoint'
import { cx, useDemo } from '../../lib/demo'

const groups: GroupId[] = ['all', 'health', 'taste', 'price']
const groupTitle = (g: GroupId) => (g === 'all' ? 'All respondents' : segments.find((s) => s.id === g)!.name)
const groupColor = (g: GroupId) => (g === 'all' ? allColor : segments.find((s) => s.id === g)!.color)

// ---------------------------------------------------------------- key results

function PartWorthsCard() {
  const [group, setGroup] = useState<GroupId>('all')
  // The bars are still when the screen opens and move only when the student switches the group.
  const [animate, setAnimate] = useState(false)
  // One scale for all five attributes, so bars can be compared across attributes.
  const largest = Math.max(...attributes.flatMap((a) => partWorths[group][a.id].map(Math.abs)))
  const extent = largest * 1.125

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3">
        <h3 className="t-h3">Part-worths</h3>
        <span className="flex-1" />
        <Select
          label="Show part-worths for"
          className="w-[138px] [&_select]:h-[30px] [&_select]:text-[13px] [&_svg]:top-2"
          value={group}
          onChange={(v) => {
            setAnimate(!window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            setGroup(v as GroupId)
          }}
          options={groups.map((g) => ({ value: g, label: groupTitle(g) }))}
        />
      </div>
      <p className="mt-1 text-[13px] text-ink2">
        How much each level adds to, or takes from, the chance of being chosen.
      </p>
      <div className="mt-1">
        {attributes.map((attr, i) => {
          const best = preferredLevel(group, attr.id)
          return (
            <div key={attr.id} className={cx('py-2', i > 0 && 'border-t border-line2')}>
              <p className="t-lbl mb-0.5">{attr.name}</p>
              <PartWorthChart
                color={groupColor(group)}
                extent={extent}
                animate={animate}
                rows={attr.levels.map((level, k) => ({
                  level,
                  value: partWorths[group][attr.id][k],
                  best: k === best,
                  tip: `${attr.name}: ${level}. Part-worth ${signed(partWorths[group][attr.id][k])}. Positive values raise the chance that a product is chosen.`,
                }))}
              />
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function PreferredLevels() {
  return (
    <Card className="mt-4 p-5">
      <h3 className="t-h3">Most preferred level</h3>
      <p className="mt-1 text-[13px] text-ink2">
        The level with the highest part-worth, for all respondents and in each segment.
      </p>
      <div className="-mx-3 -mb-2 mt-2">
        <table className="tbl tbl-tight text-[13px]">
          <thead>
            <tr>
              <th />
              {groups.map((g) => (
                <th key={g}>
                  <span className="flex items-center gap-[5px]">
                    <GroupHead group={g} />
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {attributes.map((attr) => (
              <tr key={attr.id}>
                <td className="whitespace-nowrap font-semibold">{attr.name}</td>
                {groups.map((g) => (
                  <td key={g} className={attr.id === 'price' ? 'whitespace-nowrap' : undefined}>
                    {attr.levels[preferredLevel(g, attr.id)]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- simulator

function Simulator() {
  const { labelOf } = useDemo()
  const [design, setDesign] = useState<Design>(savedDesign)
  const [by, setBy] = useState<'share' | 'revenue'>('share')

  const changed = !sameDesign(design, savedDesign)
  const shares = sharesAgainstCompetitors(design)
  const best = useMemo(() => bestProducts(by), [by])
  const savedLabel = labelOf('CJ-03')

  const rows = [
    { name: changed ? 'Unsaved design' : savedLabel, design, own: true },
    ...competitors.map((c) => ({ name: c.name, design: c.design, own: false })),
  ]

  const levelName = (r: typeof restriction.a) => attributes.find((a) => a.id === r.attr)!.levels[r.level]
  const restrictionText = `${levelName(restriction.a)} cannot be combined with ${levelName(restriction.b)}.`

  /** Levels the restriction rules out, given the rest of the design, are not selectable. */
  const optionsFor = (attr: (typeof attributes)[number]) =>
    attr.levels.map((name, level) => {
      const blocked = levelBlocked(design, attr.id, level)
      const other = attr.id === restriction.a.attr ? restriction.b : restriction.a
      return { value: level, label: blocked ? `${name} (not with ${levelName(other)})` : name, disabled: blocked }
    })

  return (
    <Card>
      <div className="flex items-center gap-3 px-5 pt-4">
        <h3 className="t-h3 text-[16px]">Market simulator</h3>
        <span className="text-[13px] text-ink3">{changed ? 'Not saved. Based on' : 'Saved as'}</span>
        <RunTag id="CJ-03" label={savedLabel} />
        {changed && (
          <Button variant="quiet" size="sm" onClick={() => setDesign(savedDesign)}>
            Reset to saved design
          </Button>
        )}
        <span className="flex-1" />
        <span tabIndex={0} data-tip={`Your restriction: ${restrictionText} Excluded levels cannot be selected.`}>
          <Tag tone="ok" icon="check">
            Allowed by your restriction
          </Tag>
        </span>
      </div>

      {/* Design a product: one dropdown per attribute */}
      <div className="flex items-end gap-2.5 px-5 pb-[18px] pt-3">
        {attributes.map((attr) => (
          <label key={attr.id} className={cx('block min-w-0', attr.id === 'sugar' ? 'flex-[1.5]' : 'flex-1')}>
            <span className="t-lbl">{attr.name}</span>
            <Select
              className="mt-1"
              label={attr.name}
              value={design[attr.id]}
              onChange={(v) => {
                const level = Number(v)
                if (!levelBlocked(design, attr.id, level)) setDesign((old) => ({ ...old, [attr.id as AttrId]: level }))
              }}
              options={optionsFor(attr)}
            />
          </label>
        ))}
        <DemoButton icon="plus">Add design</DemoButton>
      </div>
      <Hr />

      <div className="grid grid-cols-[minmax(0,1fr)_264px]">
        {/* Predicted shares against the three competitors */}
        <div className="px-2 pb-2 pt-1">
          <table className="tbl table-fixed">
            <thead>
              <tr>
                <th>Product</th>
                <th className="w-[170px]">Predicted share, all</th>
                {segments.map((s) => (
                  <th key={s.id} className={cx('r', s.id === 'price' ? 'w-[96px]' : 'w-[78px]')}>
                    <span className="flex items-center justify-end gap-[5px]">
                      <SegName segment={s.id} short />
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.own ? 'own' : row.name} className={row.own ? 'bg-primary-t' : undefined}>
                  <td>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-semibold">{row.name}</span>
                      {row.own && <Tag tone="primary">Your design</Tag>}
                    </div>
                    <div className="text-[13px] text-ink3">{describe(row.design)}</div>
                  </td>
                  <td
                    tabIndex={0}
                    data-tip={`${row.name}: ${pct1(shares[i].all)} predicted share of preference among all ${respondentCount} respondents`}
                  >
                    <CellBar
                      fraction={shares[i].all / 0.6}
                      color={row.own ? ownColor : allColor}
                      text={pct(shares[i].all)}
                    />
                  </td>
                  {segments.map((s) => (
                    <td key={s.id} className="r" tabIndex={0} data-tip={`${row.name}, ${s.name}: ${pct1(shares[i][s.id])}`}>
                      {pct(shares[i][s.id])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Best-product search over all allowed products */}
        <div className="self-stretch border-l border-line2 px-5 py-4">
          <h3 className="t-h3">Best product search</h3>
          <SegmentedControl
            className="mt-2"
            label="Rank products by"
            value={by}
            onChange={setBy}
            options={[
              { value: 'share', label: 'By share' },
              { value: 'revenue', label: 'By revenue' },
            ]}
          />
          <div className="mt-2">
            {best.map((candidate, i) => (
              <div key={describe(candidate.design)} className={cx('flex items-start gap-2.5 py-2.5', i > 0 && 'border-t border-line2')}>
                <span className="num w-3.5 font-bold">{i + 1}</span>
                <span className="flex-1 text-[13px]">{describe(candidate.design)}</span>
                <span className="num whitespace-nowrap font-bold">
                  {by === 'share' ? pct(candidate.share) : `CHF ${Math.round(candidate.revenue)}`}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-1 text-[13px] text-ink3">
            {by === 'revenue' && 'Revenue per 100 choices: predicted share times price. '}
            {allowedCount} allowed products checked against the {competitors.length} competitors.{' '}
            {productCount - allowedCount} excluded by your restriction.
          </p>
          <div className="mt-3">
            <Button size="sm" onClick={() => setDesign(best[0].design)} disabled={sameDesign(design, best[0].design)}>
              Load number 1 into the simulator
            </Button>
          </div>
        </div>
      </div>
      <Hr />
      <Note className="mx-5 mb-4 mt-3">{conjointResults.simulatorNote}</Note>
    </Card>
  )
}

// ---------------------------------------------------------------- details

function SegmentPartWorthTable() {
  return (
    <table className="tbl tbl-tight mt-2">
      <thead>
        <tr>
          <th>Attribute</th>
          <th>Level</th>
          {groups.map((g) => (
            <th key={g} className="r">
              <span className="flex items-center justify-end gap-[5px]">
                <GroupHead group={g} />
              </span>
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {attributes.flatMap((attr) =>
          attr.levels.map((level, k) => (
            <tr key={attr.id + k}>
              <td className="font-semibold">{k === 0 ? attr.name : ''}</td>
              <td className="text-ink2">{level}</td>
              {groups.map((g) => (
                <td key={g} className={cx('r', k === preferredLevel(g, attr.id) && 'font-bold')}>
                  {signed(partWorths[g][attr.id][k])}
                </td>
              ))}
            </tr>
          )),
        )}
      </tbody>
    </table>
  )
}

// ---------------------------------------------------------------- screen

export default function ConjointResults() {
  const { markConjointRun } = useDemo()
  // Opening the results directly counts as having run the scenarios.
  useEffect(() => markConjointRun(), [markConjointRun])

  const overall = topAttribute('all')
  const { runId, details } = conjointResults

  return (
    <Page crumbs={[course.name, caseBrief.name, 'Conjoint analysis', runId]}>
      <RunHeader id={runId} summary={conjointResults.summary} setupTo="/conjoint/setup" compareTo="/runs?a=CJ-01&b=CJ-02" />

      <div className="mt-8">
        <Layer n={1} title="Headline" note="The one thing to take away">
          <p className="max-w-[42ch] font-serif text-[28px] leading-[1.25]">
            {overall.name} matters most overall ({pct(overall.value)}), but each segment is driven by a different
            attribute.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-7 gap-y-2.5">
            {segments.map((s) => {
              const top = topAttribute(s.id)
              return (
                <span key={s.id} className="flex items-center gap-2">
                  <SegName segment={s.id} />
                  <span className="text-ink2">
                    {top.name}, {pct(top.value)}
                  </span>
                </span>
              )
            })}
          </div>
        </Layer>

        <Layer n={2} title="Key results" note="Enough for most decisions">
          <div className="grid grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] items-start gap-4">
            <div>
              <Card className="p-5">
                <h3 className="t-h3">Attribute importance</h3>
                <p className="mt-1 text-[13px] text-ink2">
                  How much of the choice each attribute explains. The largest value in each column is in bold.
                </p>
                <div className="-mx-3 mt-2">
                  <ImportanceTable />
                </div>
                <Note className="mt-3">{conjointResults.importanceNote}</Note>
              </Card>
              <PreferredLevels />
            </div>
            <PartWorthsCard />
          </div>
        </Layer>

        <Layer n={3} title="Simulator" note="Design a product and test it">
          <Simulator />
        </Layer>

        <Layer n={4} title="Details" note="Open what you need" last>
          <Accordion title={details[0].title} note={details[0].note}>
            <SegmentPartWorthTable />
          </Accordion>
          <Accordion title={details[1].title} note={details[1].note}>
            <p className="mt-3 max-w-[78ch] text-[13.5px] text-ink2">{details[1].body}</p>
          </Accordion>
          <Accordion title={details[2].title} note={details[2].note} icon="code">
            <p className="mt-3 max-w-[78ch] text-[13.5px] text-ink2">{details[2].body}</p>
          </Accordion>
        </Layer>
      </div>
    </Page>
  )
}
