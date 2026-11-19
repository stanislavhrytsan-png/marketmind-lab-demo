import { useState } from 'react'
import { Eyebrow, Page } from '../../components/Shell'
import { buttonClass } from '../../components/styles'
import { Accordion, Card, Hr, LinkButton, Note, SegmentedControl } from '../../components/ui'
import { allColor, caseBrief, course } from '../../data/alpineOat'
import { useDemo } from '../../lib/demo'

const { minimum, maximum } = caseBrief.scale

/** One small bar per answer on the scale: how often each answer was given. */
function AnswerShape({ shape }: { shape: number[] }) {
  const step = 84 / shape.length
  return (
    <svg
      className="inline-block align-baseline"
      width="84"
      height="24"
      viewBox="0 0 84 24"
      role="img"
      aria-label={`Distribution of answers from ${minimum} to ${maximum}`}
    >
      {shape.map((share, i) => {
        const height = Math.round(share * 240) / 10
        return <rect key={i} x={1 + i * step} y={24 - height} width={step - 2} height={height} rx="1.5" fill={allColor} />
      })}
    </svg>
  )
}

export default function CaseBrief() {
  const { conjointRun, notInDemo } = useDemo()
  const [dataset, setDataset] = useState(caseBrief.datasets[0].name)
  const next = caseBrief.nextStep[conjointRun ? 'after' : 'before']
  const variableNames = caseBrief.basisVariables.map((v) => v.name)

  return (
    <Page crumbs={[course.name, caseBrief.name, 'Case brief and data']}>
      <div className="grid grid-cols-[minmax(0,1fr)_300px] items-start gap-6">
        <div className="min-w-0">
          <Eyebrow>Case brief</Eyebrow>
          <h1 className="t-h1">{caseBrief.name}</h1>

          {/* The business question comes first, in the largest type on the page. */}
          <section className="mt-5 border-l-[3px] border-primary py-1 pl-5">
            <p className="t-lbl">The business question</p>
            <p className="mt-1 max-w-[44ch] font-serif text-[25px] leading-[1.3]">{caseBrief.question}</p>
          </section>
          <p className="mt-5 max-w-[74ch] text-[15px] text-ink2">{caseBrief.text}</p>
          <Note className="mt-4 max-w-[74ch]">{caseBrief.fictionNote}</Note>

          <div className="mt-5 grid grid-cols-3 gap-4">
            {caseBrief.steps.map((step) => (
              <Card key={step.label} as="div" className="px-4 py-3.5">
                <span className="t-lbl">{step.label}</span>
                <p className="mt-1 font-semibold">{step.title}</p>
                <p className="text-[13px] text-ink2">{step.text}</p>
              </Card>
            ))}
          </div>

          <div className="mt-10 flex items-center gap-3">
            <h2 className="t-h2">The data</h2>
            <span className="flex-1" />
            <SegmentedControl
              label="Dataset"
              value={dataset}
              onChange={(name) => {
                // Only the first dataset is filled in for the demo.
                if (name === caseBrief.datasets[0].name) setDataset(name)
                else notInDemo()
              }}
              options={caseBrief.datasets.map((d) => ({ value: d.name, label: d.name }))}
            />
          </div>

          {/* Summary first: four numbers and a plain description of every variable. */}
          <Card className="mt-3">
            <div className="flex items-start gap-6 px-6 py-[22px]">
              {caseBrief.summary.map((item) => (
                <div key={item.label} className="flex-1">
                  <div className="num font-serif text-[30px] leading-[1.1]">{item.value}</div>
                  <div className="mt-1 text-[13px] font-semibold">{item.label}</div>
                  <div className="text-[13px] text-ink3">{item.note}</div>
                </div>
              ))}
            </div>
            <Hr />
            <div className="px-6 pb-2 pt-[18px]">
              <div className="flex items-center gap-3">
                <h3 className="t-h3">Basis variables</h3>
                <span className="text-[13px] text-ink3">{caseBrief.basisNote}</span>
              </div>
              <table className="tbl mt-2">
                <thead>
                  <tr>
                    <th>Variable</th>
                    <th>What the respondent was asked</th>
                    <th>
                      Answers, {minimum} to {maximum}
                    </th>
                    <th className="r">Mean</th>
                  </tr>
                </thead>
                <tbody>
                  {caseBrief.basisVariables.map((v) => (
                    <tr key={v.name}>
                      <td className="w-[170px] font-semibold">{v.name}</td>
                      <td className="text-ink2">{v.asked}</td>
                      <td className="w-[110px]">
                        <AnswerShape shape={v.shape} />
                      </td>
                      <td className="r w-[70px]">{v.mean.toFixed(1)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Hr />
            <div className="px-6 pb-2 pt-[18px]">
              <div className="flex items-center gap-3">
                <h3 className="t-h3">Descriptor variables</h3>
                <span className="text-[13px] text-ink3">{caseBrief.descriptorNote}</span>
              </div>
              <table className="tbl mt-2">
                <thead>
                  <tr>
                    <th>Variable</th>
                    <th>What it records</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {caseBrief.descriptorVariables.map((v) => (
                    <tr key={v.name}>
                      <td className="w-[170px] font-semibold">{v.name}</td>
                      <td className="text-ink2">{v.records}</td>
                      <td className="w-[180px] text-ink2">{v.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* The raw table is one click away, but closed by default. */}
          <Accordion
            className="mt-3"
            icon="table"
            title="Raw data table"
            note={caseBrief.rawTable.summary}
            right={
              <>
                <span className="group-open:hidden">
                  <span className={buttonClass('sec', 'sm')}>Open table</span>
                </span>
                <span className="hidden group-open:inline">
                  <span className={buttonClass('sec', 'sm')}>Close table</span>
                </span>
              </>
            }
          >
            {/* Less space between the columns, so that all basis variables fit side by side. */}
            <table className="tbl mt-2 [&_td]:px-[7px] [&_th]:px-[7px]">
              <thead>
                <tr>
                  <th>Respondent</th>
                  {variableNames.map((name) => (
                    <th key={name} className="r">
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {caseBrief.rawTable.rows.map((row) => (
                  <tr key={row.id}>
                    <td className="num font-semibold">{row.id}</td>
                    {row.answers.map((answer, i) => (
                      <td key={i} className={answer === null ? 'r text-ink3' : 'r'}>
                        {answer ?? 'missing'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-2 text-[13px] text-ink3">{caseBrief.rawTable.note}</p>
          </Accordion>
        </div>

        <div>
          <Card className="p-5">
            <h3 className="t-h3">Your next step</h3>
            <p className="mt-1 text-[13px] text-ink2">{next.text}</p>
            <div className="mt-3">
              <LinkButton to={next.to} variant="pri" icon="conjoint">
                {next.button}
              </LinkButton>
            </div>
          </Card>
          <Card className="mt-4 p-5">
            <h3 className="t-h3">Datasets in this case</h3>
            <div className="mt-3 flex flex-col gap-3">
              {caseBrief.datasets.map((d) => (
                <div key={d.name}>
                  <div className="font-semibold">{d.name}</div>
                  <div className="text-[13px] text-ink3">{d.detail}</div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="mt-4 p-5">
            <h3 className="t-h3">Words used on this page</h3>
            <dl className="mt-3 text-[13.5px]">
              {caseBrief.glossary.map((entry, i) => (
                <div key={entry.term} className={i > 0 ? 'mt-3' : undefined}>
                  <dt className="text-[12.5px] font-semibold text-ink3">{entry.term}</dt>
                  <dd className="m-0 mt-1 text-ink2">{entry.text}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </Page>
  )
}
