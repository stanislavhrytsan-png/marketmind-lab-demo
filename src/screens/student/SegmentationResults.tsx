/**
 * Segmentation results. Priority 2: view-only in the demo. Results come in
 * three layers: the headline, one profile card per segment, then details.
 */
import { Dendrogram } from '../../components/Dendrogram'
import { Icon } from '../../components/Icon'
import { DivergingRow, Layer, RunHeader, SizeBar } from '../../components/results'
import { Page } from '../../components/Shell'
import { Accordion, Marker, RunTag } from '../../components/ui'
import { caseBrief, course, segmentationResults, segments } from '../../data/alpineOat'
import { useDemo } from '../../lib/demo'
import { segmentParts } from '../../lib/sizeParts'

export default function SegmentationResults() {
  const { notInDemo } = useDemo()
  const results = segmentationResults

  return (
    <Page crumbs={[course.name, caseBrief.name, 'Segmentation', results.runId]}>
      <RunHeader
        id={results.runId}
        summary={results.summary}
        setupTo="/segmentation/setup"
        compareTo="/runs?a=SEG-02&b=SEG-03"
      />

      <div className="mt-8">
        <Layer n={1} title="Headline" note="The one thing to take away">
          <p className="max-w-[40ch] font-serif text-[28px] leading-[1.25]">{results.headline}</p>
          <div className="mt-5">
            <SizeBar parts={segmentParts()} />
          </div>
        </Layer>

        <Layer n={2} title="Key results" note="Enough for most decisions">
          <div className="grid grid-cols-3 gap-4">
            {segments.map((segment) => (
              <article
                key={segment.id}
                className="rounded-[10px] border border-line bg-white"
                style={{ borderTop: `4px solid ${segment.color}` }}
              >
                <div className="p-5">
                  <div className="flex items-center gap-3">
                    <Marker segment={segment.id} size={13} />
                    <span className="t-h3 text-[16px]">{segment.name}</span>
                    <button
                      type="button"
                      aria-label={`Rename ${segment.name}`}
                      data-tip={results.renameTip}
                      onClick={() => notInDemo()}
                      className="rounded text-ink3 transition-colors duration-150 ease-std hover:text-primary"
                    >
                      <Icon name="pencil" size={14} />
                    </button>
                  </div>
                  <p className="num text-[13px] text-ink2">
                    {segment.n} respondents, {segment.share}%
                  </p>
                  <p className="t-lbl mt-4">What sets them apart</p>
                  <div className="mt-2">
                    {segment.profile.map((row) => (
                      <DivergingRow
                        key={row.variable}
                        label={row.variable}
                        value={row.z}
                        extent={1.6}
                        color={segment.color}
                        tip={`${row.variable}: ${row.z < 0 ? '−' : '+'}${Math.abs(row.z).toFixed(1)} standard deviations from the average respondent`}
                      />
                    ))}
                  </div>
                  <p className="t-lbl mt-4">Who they are</p>
                  <ul className="mt-1.5 list-disc pl-[18px] text-[13px] text-ink2">
                    {segment.who.map((line) => (
                      <li key={line}>{line}</li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-ink3">{results.profileNote}</p>
        </Layer>

        <Layer n={3} title="Details" note="Open what you need" last>
          <Accordion
            defaultOpen
            title={
              <>
                {results.tree.title} <RunTag id={results.tree.fromRun} />
              </>
            }
          >
            <div className="mt-3 flex items-start gap-6">
              <Dendrogram />
              <div className="flex-1">
                <p className="t-lbl">How to read it</p>
                {results.tree.howToRead.map((text, i) => (
                  <p key={i} className={i === 0 ? 'mt-1 text-[13px] text-ink2' : 'mt-2 text-[13px] text-ink2'}>
                    {text}
                  </p>
                ))}
              </div>
            </div>
          </Accordion>
          {results.details.map((detail) => (
            <Accordion key={detail.title} title={detail.title} note={detail.note}>
              <p className="mt-3 text-[13px] text-ink3">{results.detailsEmpty}</p>
            </Accordion>
          ))}
        </Layer>
      </div>
    </Page>
  )
}
