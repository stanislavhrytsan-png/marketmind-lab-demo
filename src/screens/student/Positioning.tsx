/**
 * Positioning. Priority 2: view-only in the demo, apart from the three
 * switches that show or hide the layers of the map.
 */
import { useState } from 'react'
import type { ReactNode } from 'react'
import { TrackBarChart } from '../../components/charts'
import { PerceptualMap } from '../../components/PerceptualMap'
import type { MapLayers } from '../../components/PerceptualMap'
import { RunHeader } from '../../components/results'
import { Page } from '../../components/Shell'
import { Card, Hr, SegName, SegmentedControl, Switch } from '../../components/ui'
import { caseBrief, course, positioning, segments } from '../../data/alpineOat'
import { useDemo } from '../../lib/demo'

function LegendItem({ children, mark }: { children: ReactNode; mark: ReactNode }) {
  return (
    <span className="flex items-center gap-1.5">
      {mark}
      {children}
    </span>
  )
}

export default function Positioning() {
  const { notInDemo } = useDemo()
  const [layers, setLayers] = useState<MapLayers>({ brands: true, attributes: true, preferences: true })
  const toggles: { key: keyof MapLayers; label: string; note?: string }[] = [
    { key: 'brands', label: 'Brands' },
    { key: 'attributes', label: 'Attribute lines' },
    { key: 'preferences', label: 'Segment preferences', note: positioning.layersNote },
  ]

  return (
    <Page crumbs={[course.name, caseBrief.name, 'Positioning', positioning.runId]}>
      <RunHeader id={positioning.runId} summary={positioning.summary} compareTo="/runs?a=POS-01" />

      <p className="mt-6 max-w-[44ch] font-serif text-[26px] leading-[1.25]">{positioning.headline}</p>

      <div className="mt-5 grid grid-cols-[minmax(0,1fr)_296px] items-start gap-6">
        <Card className="px-3 pb-3 pt-2">
          <div className="flex justify-center overflow-hidden">
            <PerceptualMap layers={layers} />
          </div>
          <div className="flex items-center gap-5 px-3 py-1 text-[13px] text-ink2">
            <LegendItem
              mark={
                <svg width="14" height="14" aria-hidden="true">
                  <circle cx="7" cy="7" r="5" fill="#1B2230" />
                </svg>
              }
            >
              Brand
            </LegendItem>
            <LegendItem
              mark={
                <svg width="20" height="14" aria-hidden="true">
                  <circle cx="10" cy="7" r="5" fill="#5B2B6E" />
                  <circle cx="10" cy="7" r="6.5" fill="none" stroke="#5B2B6E" />
                </svg>
              }
            >
              Your brand
            </LegendItem>
            <LegendItem
              mark={
                <svg width="22" height="14" aria-hidden="true">
                  <path d="M1 7H19" stroke="#A7ADBA" strokeWidth="1.5" />
                  <circle cx="19" cy="7" r="2.5" fill="#8D94A3" />
                </svg>
              }
            >
              <i>Attribute</i>
            </LegendItem>
            <LegendItem
              mark={
                <svg width="26" height="14" aria-hidden="true">
                  <path d="M1 7H20" stroke="#475066" strokeWidth="2.5" />
                  <path d="M19 3L25 7L19 11z" fill="#475066" />
                </svg>
              }
            >
              Segment preference
            </LegendItem>
            <span className="flex-1" />
            <span className="text-ink3">Hover any point or arrow for details</span>
          </div>
        </Card>

        <div>
          <Card className="p-5">
            <h3 className="t-h3">How to read this map</h3>
            <ol className="mt-2 grid list-decimal gap-1.5 pl-[18px] text-[13px] text-ink2">
              {positioning.howToRead.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ol>
          </Card>

          <Card className="mt-4 p-5">
            <h3 className="t-h3">Show on the map</h3>
            <div className="mt-2">
              {toggles.map((toggle) => (
                <div key={toggle.key} className="flex items-center gap-3 py-[7px]">
                  <Switch
                    label={toggle.label}
                    on={layers[toggle.key]}
                    onChange={(on) => setLayers({ ...layers, [toggle.key]: on })}
                  />
                  <span>
                    <span className="font-semibold">{toggle.label}</span>
                    {toggle.note && (
                      <>
                        <br />
                        <span className="text-[13px] text-ink3">{toggle.note}</span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <SegmentedControl
              className="mt-2"
              label="Show segment preferences as"
              value="arrows"
              onChange={(value) => {
                // Ideal points are not drawn in the demo.
                if (value !== 'arrows') notInDemo()
              }}
              options={[
                { value: 'arrows', label: 'Arrows' },
                { value: 'ideal', label: 'Ideal points' },
              ]}
            />
            <p className="mt-2 text-[13px] text-ink3">{positioning.arrowsNote}</p>
            <Hr />
            <div className="mt-3">
              {segments.map((s) => (
                <div key={s.id} className="flex items-center gap-2 py-[3px]">
                  <SegName segment={s.id} />
                  <span className="flex-1" />
                  <span className="num text-[13px] text-ink3">{s.share}%</span>
                </div>
              ))}
            </div>
          </Card>

          <Card className="mt-4 p-5">
            <h3 className="t-h3">Variance explained</h3>
            <p className="mt-1 text-[13px] text-ink2">{positioning.varianceNote}</p>
            <div className="mt-3">
              <TrackBarChart
                max={100}
                labelWidth={92}
                valueWidth={36}
                rows={positioning.variance.map((v) => ({
                  label: v.name,
                  value: v.value,
                  color: v.color,
                  text: `${v.value}%`,
                  tip: `${v.name}: ${v.value}% of the variance in the brand ratings`,
                }))}
              />
            </div>
          </Card>
        </div>
      </div>
    </Page>
  )
}
