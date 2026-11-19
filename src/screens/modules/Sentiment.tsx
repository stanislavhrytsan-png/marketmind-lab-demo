/**
 * Sentiment analysis (run SE-02, with SE-01 for the gaps of the word list
 * and SE-03 for the negations): what 1,500 customers write about four
 * brands of oat drink.
 *
 * Every number is the engine's. Nothing is calculated in the browser: the
 * what-if view switches between two real runs.
 */
import { Fragment, useState } from 'react'
import type { ReactNode } from 'react'
import { CardHead, CoachCard, EngineSays, Headline, HowToRead, Stat, Stats, Trap } from '../../components/module'
import { Layer, RunHeader } from '../../components/results'
import { Page } from '../../components/Shell'
import { Accordion, Card, Note, RunTag, SegmentedControl, Tag } from '../../components/ui'
import { caseBrief, course } from '../../data/alpineOat'
import { LABELS, sentimentScreen } from '../../data/sentiment'
import type { Driver, Example, Found, GroupLevel, Label, SentimentRunId } from '../../data/sentiment'
import { cx } from '../../lib/demo'
import { capital, fixed, pct, signed, thousands } from '../../lib/format'
import { INTERPRETATION, useInterpretation } from '../../lib/interpretation'
import { chart } from '../../lib/plot'

const s = sentimentScreen

/**
 * Negative, neutral and positive: the colours for bad and good of the style
 * guide, with grey between them. A label or a column head always says which
 * part is which, so the colour never stands alone.
 */
const toneOf: Record<Label, string> = { negative: chart.bad, neutral: chart.slate3, positive: chart.good }
const shareOf = (level: GroupLevel, label: Label) => level[`share_${label}`]
const pText = (p: number) => (p < 0.001 ? 'below 0.001' : p.toFixed(3))
const stars = (count: number) => `${count} ${count === 1 ? 'star' : 'stars'}`
/** A score from -1 to +1 with its sign. A score that rounds to zero is written without a sign. */
const scoreText = (value: number) => (Math.abs(value) < 0.005 ? '0.00' : signed(value))

// ---------------------------------------------------------------- shared pieces

/** One bar of 100%: the negative reviews on the left, the neutral ones in the middle, the positive ones on the right. */
function MoodBar({ level, height = 16 }: { level: GroupLevel; height?: number }) {
  return (
    <div className="flex w-full overflow-hidden rounded-[3px]" style={{ height }} role="img" aria-label={`${level.group}: ${LABELS.map((label) => `${pct(shareOf(level, label))} ${label}`).join(', ')}`}>
      {LABELS.map((label) => (
        <i
          key={label}
          tabIndex={0}
          data-tip={`${level.group}\n${pct(shareOf(level, label), 1)} of ${thousands(level.n_reviews)} reviews are ${label}`}
          className="bar-grow block h-full border-r-2 border-white last:border-r-0"
          style={{ width: `${shareOf(level, label) * 100}%`, background: toneOf[label] }}
        />
      ))}
    </div>
  )
}

function MoodKey({ className }: { className?: string }) {
  return (
    <div className={cx('flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-ink2', className)}>
      {LABELS.map((label) => (
        <span key={label} className="inline-flex items-center gap-1.5">
          <i className="block h-2.5 w-4 rounded-[2.5px]" style={{ background: toneOf[label] }} />
          {capital(label)}
        </span>
      ))}
    </div>
  )
}

/** A review with the words the engine found marked in it. The two word columns next to it say which is which. */
function Marked({ text, found }: { text: string; found: Pick<Found, 'positive_words' | 'negative_words'> }) {
  const parts = text.split(/([A-Za-z’']+)/)
  const marks: (Label | undefined)[] = parts.map(() => undefined)
  const mark = (items: string[], tone: Label) =>
    items.forEach((item) => {
      const tokens = item.toLowerCase().split(' ')
      const word = tokens[tokens.length - 1]
      const at = parts.findIndex((part, i) => i % 2 === 1 && marks[i] === undefined && part.toLowerCase() === word)
      if (at < 0) return
      marks[at] = tone
      // A negation in front of the word belongs to it: "not pleasant" is marked as one finding.
      if (tokens.length > 1) {
        for (let i = at - 2; i >= Math.max(1, at - 8); i -= 2) {
          if (parts[i].toLowerCase() === tokens[0]) {
            marks[i] = tone
            break
          }
        }
      }
    })
  mark(found.positive_words, 'positive')
  mark(found.negative_words, 'negative')
  return (
    <span>
      {parts.map((part, i) =>
        marks[i] ? (
          <mark key={i} className={cx('rounded-[3px] px-px font-semibold', marks[i] === 'positive' ? 'bg-ok-t text-ok' : 'bg-[#FBE7E5] text-danger')}>
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </span>
  )
}

function LabelTag({ label }: { label: Label }) {
  return <Tag tone={label === 'positive' ? 'ok' : label === 'negative' ? 'bad' : 'neutral'}>{capital(label)}</Tag>
}

// ---------------------------------------------------------------- key results

function GroupRows({ levels, strong = false }: { levels: GroupLevel[]; strong?: boolean }) {
  return (
    <>
      {levels.map((level) => (
        <tr key={level.group}>
          <td className="whitespace-nowrap">
            <span className={cx(strong ? 'font-bold' : 'font-semibold')}>{level.group}</span>
            <div className="text-[12.5px] text-ink3">{thousands(level.n_reviews)} reviews</div>
          </td>
          <td className="w-[34%]">
            <MoodBar level={level} />
          </td>
          {LABELS.map((label) => (
            <td key={label} className="r">
              {pct(shareOf(level, label))}
            </td>
          ))}
          <td className="r">
            <span className="font-bold">{scoreText(level.mean_score)}</span>
            {level.standard_error > 0 && (
              <div className="whitespace-nowrap text-[12.5px] text-ink3">
                {scoreText(level.lower_95)} to {scoreText(level.upper_95)}
              </div>
            )}
          </td>
        </tr>
      ))}
    </>
  )
}

function GroupsCard() {
  const { groupsCard } = s
  return (
    <Card className="p-5">
      <CardHead title={groupsCard.title} note={groupsCard.note} right={<MoodKey />} />
      <div className="-mx-3 mt-2">
        <table className="tbl tbl-tight">
          <thead>
            <tr>
              <th />
              <th>Share of the reviews</th>
              {LABELS.map((label) => (
                <th key={label} className="r">
                  {capital(label)}
                </th>
              ))}
              <th className="r">Mean score, 95% range</th>
            </tr>
          </thead>
          <tbody>
            <GroupRows levels={[groupsCard.all]} strong />
            {groupsCard.blocks.map((block) => (
              <Fragment key={block.name}>
                <tr>
                  <td colSpan={6} className="pt-4 text-[12.5px] font-semibold text-ink3">
                    {block.name}
                    <span className="ml-3 font-normal">
                      {block.test.groups_differ ? 'The groups differ by more than chance allows' : 'The groups do not differ by more than chance allows'} (F test: {block.test.f.toFixed(1)}, p {pText(block.test.p_value)})
                    </span>
                  </td>
                </tr>
                <GroupRows levels={block.levels} />
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <HowToRead className="mt-3 max-w-[94ch]" lines={groupsCard.howToRead} />
    </Card>
  )
}

/** One side of the drivers: a bar per word, as long as the evidence is strong. Words that are not clear are drawn faintly and say so. */
function DriverList({ title, rows, tone, extent }: { title: string; rows: Driver[]; tone: Label; extent: number }) {
  return (
    <div>
      <p className="text-[13px] font-bold">{title}</p>
      <div className="mt-2 flex flex-col gap-1.5">
        {rows.map((row) => (
          <div
            key={row.word}
            tabIndex={0}
            data-tip={`"${row.word}"\nIn ${pct(row.share_of_positive_reviews)} of the positive and ${pct(row.share_of_negative_reviews)} of the negative reviews\n${pct(row.share_positive_when_used)} of the reviews with this word are positive\n${row.clear ? 'Clear' : 'Not clear'}: z = ${fixed(row.z, 1)}`}
            className="grid grid-cols-[92px_minmax(0,1fr)_170px] items-center gap-3 text-[13px]"
          >
            <span className={cx('font-semibold', !row.clear && 'font-normal text-ink3')}>{row.word}</span>
            <span className="h-3.5 rounded-[3px] bg-fill">
              <i className="bar-grow block h-3.5 rounded-r" style={{ width: `${Math.min(1, Math.abs(row.z) / extent) * 100}%`, background: toneOf[tone], opacity: row.clear ? 1 : 0.3 }} />
            </span>
            <span className="num whitespace-nowrap text-[12.5px] text-ink3">
              {row.clear ? `${pct(row.share_of_positive_reviews)} positive, ${pct(row.share_of_negative_reviews)} negative` : 'not clear'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function DriversCard() {
  const { driversCard } = s
  const extent = Math.max(...[...driversCard.positive, ...driversCard.negative].map((row) => Math.abs(row.z)))
  return (
    <Card className="mt-4 p-5">
      <CardHead title={driversCard.title} note={driversCard.note} />
      <div className="mt-4 grid grid-cols-2 gap-10">
        <DriverList title="Go with negative reviews" rows={driversCard.negative} tone="negative" extent={extent} />
        <DriverList title="Go with positive reviews" rows={driversCard.positive} tone="positive" extent={extent} />
      </div>
      <p className="mt-3 text-[12.5px] text-ink3">The longer the bar, the clearer the link. The two numbers are the shares of the positive and of the negative reviews that use the word.</p>
      <Note icon="info" className="mt-3">
        {driversCard.chance}
      </Note>
      <HowToRead className="mt-3 max-w-[94ch]" lines={driversCard.howToRead} />
    </Card>
  )
}

function ReadAs({ run, found }: { run: SentimentRunId; found: Found }) {
  const words = [...found.positive_words, ...found.negative_words]
  return (
    <div className="flex items-center gap-2 text-[12.5px] text-ink2">
      <RunTag id={run} />
      <LabelTag label={found.label} />
      <span className="min-w-0 truncate">{words.length ? `found: ${words.join(', ')}` : 'no word found'}</span>
    </div>
  )
}

function ExampleCard({ example, title, text, runs }: { example: Example; title: string; text: string; runs: SentimentRunId[] }) {
  return (
    <div className="flex flex-col rounded-lg border border-line p-3.5">
      <p className="text-[13px] font-bold text-ink">{title}</p>
      <p className="mt-2 text-[14px] leading-[1.5] text-ink">
        “<Marked text={example.text} found={example.by_run[runs[runs.length - 1]]} />”
      </p>
      <p className="mt-1 text-[12.5px] text-ink3">
        {example.id}, {example.brand}, {stars(example.stars)}
      </p>
      <div className="mt-2 flex flex-col gap-1.5">
        {runs.map((run) => (
          <ReadAs key={run} run={run} found={example.by_run[run]} />
        ))}
      </div>
      <p className="mt-2 text-[12.5px] text-ink3">{text}</p>
    </div>
  )
}

function ListTrap() {
  const { trap } = s
  const sides: { name: string; data: typeof trap.before }[] = [
    { name: 'Built-in word list', data: trap.before },
    { name: 'With the own words', data: trap.after },
  ]
  return (
    <Trap title={trap.title} className="mt-4">
      <p className="max-w-[98ch]">{trap.text}</p>
      <div className="-mx-3 mt-3">
        <table className="tbl tbl-tight text-[13px]">
          <thead>
            <tr>
              <th>Run</th>
              <th className="w-[30%]">Share of the reviews</th>
              {LABELS.map((label) => (
                <th key={label} className="r">
                  {capital(label)}
                </th>
              ))}
              <th className="r whitespace-normal">Reviews without a word of the list</th>
              <th className="r whitespace-normal">Neutral, but 1, 2, 4 or 5 stars</th>
            </tr>
          </thead>
          <tbody>
            {sides.map(({ name, data }) => (
              <tr key={data.run}>
                <td className="whitespace-nowrap">
                  <span className="flex items-center gap-2.5 text-ink">
                    <RunTag id={data.run} /> {name}
                  </span>
                </td>
                <td>
                  <MoodBar
                    height={12}
                    level={{ group: name, n_reviews: s.groupsCard.all.n_reviews, share_negative: data.shares.negative, share_neutral: data.shares.neutral, share_positive: data.shares.positive } as GroupLevel}
                  />
                </td>
                {LABELS.map((label) => (
                  <td key={label} className="r">
                    {pct(data.shares[label], 1)}
                  </td>
                ))}
                <td className="r font-bold text-ink">{thousands(data.without)}</td>
                <td className="r font-bold text-ink">{thousands(data.unclear)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[13.5px] font-bold text-ink">Words the list does not know that go clearly with the stars</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {trap.unknown.map((row) => (
          <span
            key={row.word}
            tabIndex={0}
            data-tip={`"${row.word}" in ${row.n_reviews} reviews\n${pct(row.share_positive_when_used)} of them have 4 or 5 stars\n${row.added ? `Added as a ${row.side} word for run SE-02` : 'A topic, not a feeling: not added'}`}
            className={cx('inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[13px]', row.added ? 'border-primary-l bg-primary-t font-semibold text-primary-d' : 'border-line bg-white text-ink2')}
          >
            {row.word}
            <span className="text-[12px] font-normal text-ink3">{row.side === 'positive' ? 'high stars' : 'low stars'}</span>
          </span>
        ))}
      </div>
      <p className="mt-1.5 text-[12.5px] text-ink3">Highlighted: the words that express a feeling and were added. The others are topics.</p>

      <p className="mt-4 text-[13.5px] font-bold text-ink">{trap.examplesTitle}</p>
      <div className="mt-2 grid grid-cols-3 gap-4">
        {trap.examples.map((item) => (
          <ExampleCard key={item.example.id} example={item.example} title={item.title} text={item.text} runs={['SE-01', 'SE-02']} />
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {trap.engineSays.map((text) => (
          <EngineSays key={text}>{text}</EngineSays>
        ))}
        <Note icon="info">{trap.irony}</Note>
      </div>
    </Trap>
  )
}

function WordsCard() {
  const { wordsCard } = s
  const most = wordsCard.words[0].share_of_reviews
  return (
    <Card className="mt-4 p-5">
      <CardHead title={wordsCard.title} note={wordsCard.note} />
      <div className="mt-4 grid grid-cols-[minmax(0,4fr)_minmax(0,7fr)] gap-10">
        <div>
          <p className="text-[13px] font-bold">The twelve most frequent words</p>
          <div className="mt-2 flex flex-col gap-1.5">
            {wordsCard.words.map((word) => (
              <div key={word.word} tabIndex={0} data-tip={`"${word.word}" is used ${thousands(word.count)} times, in ${thousands(word.n_reviews)} reviews`} className="grid grid-cols-[84px_minmax(0,1fr)_40px] items-center gap-3 text-[13px]">
                <span className="font-semibold">{word.word}</span>
                <span className="h-3.5 rounded-[3px] bg-fill">
                  <i className="bar-grow block h-3.5 rounded-r" style={{ width: `${(word.share_of_reviews / most) * 100}%`, background: chart.slate }} />
                </span>
                <span className="num text-right font-bold">{pct(word.share_of_reviews)}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[12.5px] text-ink3">Share of the reviews that use the word.</p>
        </div>
        <div>
          <p className="text-[13px] font-bold">{wordsCard.typicalTitle}</p>
          <p className="text-[12.5px] text-ink3">{wordsCard.typicalNote}</p>
          <div className="-mx-3 mt-1">
            <table className="tbl tbl-tight">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Word</th>
                  <th className="r whitespace-normal">In its reviews</th>
                  <th className="r whitespace-normal">In the other reviews</th>
                  <th className="r whitespace-normal">Times as often</th>
                </tr>
              </thead>
              <tbody>
                {wordsCard.groups.flatMap((group) =>
                  group.typical.map((word, k) => (
                    <tr key={`${group.group} ${word.word}`}>
                      <td className="whitespace-nowrap font-semibold">{k === 0 ? group.group : ''}</td>
                      <td>{word.word}</td>
                      <td className="r">{pct(word.share_of_reviews)}</td>
                      <td className="r text-ink2">{pct(word.share_of_other_reviews)}</td>
                      <td className="r font-bold">{word.times_as_often !== null ? word.times_as_often.toFixed(1) : 'only here'}</td>
                    </tr>
                  )),
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- what if

function WhatIf() {
  const { whatIf } = s
  const [run, setRun] = useState<SentimentRunId>(whatIf.options[0].value)
  const shown = whatIf.runs[run]
  const ignored = run === whatIf.options[1].value
  return (
    <Card>
      <div className="px-5 pt-4">
        <CardHead
          title={<span className="text-[16px]">{whatIf.title}</span>}
          note={whatIf.text}
          right={<SegmentedControl label="Negations" value={run} onChange={setRun} options={whatIf.options} />}
        />
      </div>
      <div className="grid grid-cols-[minmax(0,6fr)_minmax(0,5fr)] gap-8 px-5 pb-5 pt-3">
        <div>
          <div className="-mx-3">
            <table className="tbl tbl-tight">
              <thead>
                <tr>
                  <th>
                    <RunTag id={run} />
                  </th>
                  <th>Share of the reviews</th>
                  <th className="r">Mean score</th>
                </tr>
              </thead>
              <tbody>
                {[shown.all, ...shown.brands].map((level, k) => (
                  <tr key={level.group}>
                    <td className={cx('whitespace-nowrap', k === 0 ? 'font-bold' : 'font-semibold')}>{level.group}</td>
                    <td className="w-[46%]">
                      <MoodBar level={level} />
                    </td>
                    <td className="r font-bold">{scoreText(level.mean_score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <MoodKey className="mt-2" />
        </div>
        <div>
          <div className="flex items-start gap-6">
            <Stat
              className="flex-1"
              value={ignored ? thousands(whatIf.changed.n_changed) : thousands(whatIf.negated)}
              label={ignored ? 'reviews change their label' : 'reviews hold a word with a negation in front'}
              note={ignored ? `Of ${thousands(whatIf.negated)} reviews with a negated word` : 'The engine turns the meaning of the word around'}
            />
            <Stat className="flex-1" value={thousands(shown.unclear)} label="neutral reviews with 1, 2, 4 or 5 stars" note={ignored ? `With the meaning turned around: ${thousands(whatIf.runs[whatIf.options[0].value].unclear)}` : 'Fewer is better'} />
          </div>
          {whatIf.example && (
            <div className="mt-4 rounded-lg border border-line p-3.5">
              <p className="text-[14px] leading-[1.5]">
                “<Marked text={whatIf.example.text} found={whatIf.example.by_run[run]} />”
              </p>
              <p className="mt-1 text-[12.5px] text-ink3">
                {whatIf.example.id}, {whatIf.example.brand}, {stars(whatIf.example.stars)}
              </p>
              <div className="mt-2">
                <ReadAs run={run} found={whatIf.example.by_run[run]} />
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}

// ---------------------------------------------------------------- details

function SampleTable() {
  const { sample } = s.details
  return (
    <table className="tbl tbl-tight mt-2">
      <thead>
        <tr>
          <th>Review</th>
          <th className="w-[42%]">Text</th>
          <th>Positive words found</th>
          <th>Negative words found</th>
          <th className="r">Score</th>
          <th>Label</th>
        </tr>
      </thead>
      <tbody>
        {sample.rows.map((row) => (
          <tr key={row.id}>
            <td className="whitespace-nowrap align-top">
              <span className="num font-semibold">{row.id}</span>
              <div className="text-[12.5px] text-ink3">
                {row.brand}, {stars(row.stars)}
              </div>
            </td>
            <td className="align-top leading-[1.5]">
              <Marked text={row.text} found={row} />
            </td>
            <td className="align-top text-ink2">{row.positive_words.join(', ') || 'None'}</td>
            <td className="align-top text-ink2">{row.negative_words.join(', ') || 'None'}</td>
            <td className="r align-top font-bold">{scoreText(row.score)}</td>
            <td className="align-top">
              <LabelTag label={row.label} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Brands down, segments across: the mean score of each combination, tinted by its sign and size. The number is always printed. */
function CrossHeat() {
  const { cross } = s.details
  const extent = Math.max(...cross.cells.map((cell) => Math.abs(cell.mean_score)))
  const tint = (score: number) => {
    const [r, g, b] = score >= 0 ? [31, 111, 67] : [179, 38, 30]
    return `rgba(${r}, ${g}, ${b}, ${(0.06 + 0.3 * (Math.abs(score) / extent)).toFixed(3)})`
  }
  return (
    <table className="mt-3 w-full max-w-[760px] border-separate border-spacing-[2px] text-[13.5px]">
      <thead>
        <tr>
          <th />
          {cross.segments.map((segment) => (
            <th key={segment} className="px-3 pb-1 text-right text-[12.5px] font-semibold text-ink3">
              {segment}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {cross.brands.map((brand) => (
          <tr key={brand}>
            <td className="whitespace-nowrap pr-4 font-semibold">{brand}</td>
            {cross.segments.map((segment) => {
              const cell = cross.cells.find((item) => item.brand === brand && item.segment === segment)
              if (!cell) return <td key={segment} />
              return (
                <td
                  key={segment}
                  tabIndex={0}
                  data-tip={`${brand}, ${segment}\n${cell.n_reviews} reviews, mean score ${signed(cell.mean_score)}\n${pct(cell.share_positive)} positive, ${pct(cell.share_negative)} negative`}
                  className="num rounded px-3 py-2.5 text-right font-bold"
                  style={{ background: tint(cell.mean_score) }}
                >
                  {scoreText(cell.mean_score)}
                  <div className="text-[12px] font-normal text-ink2">{cell.n_reviews} reviews</div>
                </td>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function StarDrivers() {
  const { stars: starDrivers } = s.details
  const side = (title: string, rows: Driver[]): ReactNode => (
    <div>
      <p className="text-[13px] font-bold">{title}</p>
      <table className="tbl tbl-tight mt-1">
        <thead>
          <tr>
            <th>Word</th>
            <th className="r">Reviews</th>
            <th className="r whitespace-normal">With 4 or 5 stars when used</th>
            <th>In the word list</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.word}>
              <td className="font-semibold">{row.word}</td>
              <td className="r">{thousands(row.n_reviews)}</td>
              <td className="r">{pct(row.share_positive_when_used)}</td>
              <td className={cx(!row.in_word_list && 'font-semibold text-primary')}>{row.in_word_list ? 'Yes' : 'No'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
  return (
    <>
      <p className="mt-3 max-w-[94ch] text-[13.5px] text-ink2">{starDrivers.text}</p>
      <div className="mt-3 grid grid-cols-2 gap-8">
        {side('The ten clearest words of the reviews with low stars', starDrivers.negative)}
        {side('The ten clearest words of the reviews with high stars', starDrivers.positive)}
      </div>
    </>
  )
}

function LabelsTable() {
  const { labels } = s.details
  const block = (run: SentimentRunId, rows: typeof labels.before): ReactNode => (
    <div>
      <p className="flex items-center gap-2.5 text-[13px] font-bold">
        <RunTag id={run} /> {run === s.firstRunId ? 'Built-in word list' : 'With the own words'}
      </p>
      <table className="tbl tbl-tight mt-1">
        <thead>
          <tr>
            <th>Stars</th>
            {LABELS.map((label) => (
              <th key={label} className="r">
                {capital(label)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.stars}>
              <td className="font-semibold">{stars(row.stars)}</td>
              {LABELS.map((label) => (
                <td key={label} className="r">
                  {thousands(row[label])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
  return (
    <div className="mt-3 grid max-w-[820px] grid-cols-2 gap-8">
      {block('SE-01', labels.before)}
      {block('SE-02', labels.after)}
    </div>
  )
}

// ---------------------------------------------------------------- screen

export default function Sentiment() {
  const toInterpretation = useInterpretation()
  const { details } = s
  return (
    <Page crumbs={[course.name, caseBrief.name, 'Sentiment analysis', s.runId]}>
      <RunHeader id={s.runId} summary={s.summary} setupTo={`/sentiment/setup/${s.runId}`} compareTo={`/runs?a=${s.firstRunId}&b=${s.runId}`} onInterpret={toInterpretation} />

      <div className="mt-8">
        <Layer n={1} title="Headline" note="The one thing to take away">
          <Headline wide>{s.headline}</Headline>
          <Stats className="mt-6" items={s.stats} />
        </Layer>

        <Layer n={2} title="Key results" note="Enough for most decisions">
          <GroupsCard />
          <DriversCard />
          <ListTrap />
          <WordsCard />
        </Layer>

        <Layer n={3} title="What if" note="Another reading of the same reviews">
          <WhatIf />
        </Layer>

        <Layer n={4} title="Details" note="Open what you need">
          <Accordion title={details.sample.title} note={details.sample.note} icon="table">
            <SampleTable />
          </Accordion>
          <Accordion title={details.cross.title} note={details.cross.note}>
            <CrossHeat />
          </Accordion>
          <Accordion title={details.stars.title} note={details.stars.note} icon="table">
            <StarDrivers />
          </Accordion>
          <Accordion title={details.labels.title} note={details.labels.note} icon="table">
            <LabelsTable />
          </Accordion>
        </Layer>

        <Layer n={5} title="Interpretation" note="Your reading first, then the coach" id={INTERPRETATION} last>
          <CoachCard script={s.coach} />
        </Layer>
      </div>
    </Page>
  )
}
