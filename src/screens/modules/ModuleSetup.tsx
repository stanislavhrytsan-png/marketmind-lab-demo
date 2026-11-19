/**
 * The setup screen of a run of one of the further modules. One screen serves
 * all of them: it shows the steps of the module, the data the run uses, and
 * every setting with the engine's own texts on what it does and when to
 * choose it.
 *
 * The screen is view-only in the demo. The runs were calculated by the engine
 * before, with exactly the settings shown here.
 */
import { Navigate, useParams } from 'react-router-dom'
import { SetupHeading, ThisRunCard } from '../../components/setup'
import { Eyebrow, Page } from '../../components/Shell'
import { Card, Field, LinkButton, Note, OptionCard, RunTag, Tag, What } from '../../components/ui'
import { caseBrief, course } from '../../data/alpineOat'
import { moduleNames, runs, setupOf } from '../../data/library'
import { settingHelp } from '../../data/moduleKit'
import type { SettingHelp, SetupSetting } from '../../data/moduleKit'
import { cx, useDemo } from '../../lib/demo'

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

/** A setting's value as a student would read it. */
function shown(value: unknown): string {
  if (value === null || value === undefined) return 'Empty'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return String(value)
}

/** "0 to 0.9", "1 or more": what the engine accepts for a number. */
function allowed(help: SettingHelp): string | null {
  const { minimum, maximum } = help
  if (minimum === undefined && maximum === undefined) return null
  if (minimum !== undefined && maximum !== undefined) return `${minimum} to ${maximum.toLocaleString('en-US')}`
  return minimum !== undefined ? `${minimum} or more` : `${maximum} or less`
}

/** One setting: its name, the value of this run, and the engine's two texts. A choice shows every option. */
function SettingCard({ help, setting }: { help: SettingHelp; setting: SetupSetting }) {
  const isDefault = same(help.default, setting.value)
  const range = allowed(help)
  return (
    <Card className="p-5 [&+section]:mt-4">
      <div className="flex items-center gap-3">
        <SetupHeading>{help.label}</SetupHeading>
        <span className="flex-1" />
        {!help.options && <Field className="num h-8 font-semibold">{shown(setting.value)}</Field>}
        <Tag tone={isDefault ? 'primary' : 'neutral'}>{isDefault ? 'Default' : setting.note ? 'Set by the engine' : 'Changed'}</Tag>
      </div>
      <What
        className={cx('mt-2', !help.options && !setting.note && !range && 'mb-0')}
        rows={[
          { term: 'What it does', text: help.what_it_does },
          { term: 'Choose it when', text: help.when_to_choose },
        ]}
      />
      {help.options && (
        <div
          role="radiogroup"
          aria-label={help.label}
          className={cx('grid gap-4', help.options.length === 3 ? 'grid-cols-3' : 'grid-cols-2')}
        >
          {help.options.map((option) => (
            <OptionCard
              key={String(option.value)}
              selected={option.value === setting.value}
              title={option.label}
              tag={option.value === help.default ? 'Default' : undefined}
              tagTone={option.value === setting.value ? 'primary' : 'neutral'}
              className="px-4 py-3.5"
            >
              <What
                stack
                className="mb-0 mt-2"
                rows={[
                  { term: 'What it does', text: option.what_it_does },
                  { term: 'Choose it when', text: option.when_to_choose },
                ]}
              />
            </OptionCard>
          ))}
        </div>
      )}
      {!help.options && (setting.note || range) && (
        <p className="text-[13px] text-ink3">
          {setting.note}
          {setting.note && range && ' '}
          {range && `Allowed: ${range}.`}
        </p>
      )}
    </Card>
  )
}

export default function ModuleSetup() {
  const { runId } = useParams()
  const { labelOf } = useDemo()
  const info = setupOf(runId ?? '')
  const run = runs.find((item) => item.id === info?.runId)
  if (!info || !run) return <Navigate to="/" replace />
  const moduleName = moduleNames[info.module]

  return (
    <Page crumbs={[course.name, caseBrief.name, moduleName, `Setup of ${info.runId}`]}>
      <Eyebrow>{moduleName}</Eyebrow>
      <h1 className="t-h1">{info.title}</h1>
      <p className="t-lead mt-1">{info.question}</p>

      <div className="mt-6 grid grid-cols-[minmax(0,1fr)_300px] items-start gap-6">
        <div className="min-w-0">
          <Note icon="eye">
            View-only in the demo. This is the setup of <RunTag id={info.runId} />: the engine ran it with exactly these
            settings, and the texts next to each setting are the engine&rsquo;s own.
          </Note>

          <Card className="mt-4 p-5">
            <SetupHeading>Steps</SetupHeading>
            <ol className="mt-2 grid gap-1.5 text-[13.5px] text-ink2">
              {info.steps.map((step, i) => (
                <li key={step} className="grid grid-cols-[22px_1fr] gap-2">
                  <span className="num mt-px grid h-[20px] w-[20px] place-items-center rounded-full border border-primary-l bg-primary-t text-[12px] font-bold text-primary-d">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </Card>

          <Card className="mt-4">
            <div className="px-5 pt-4">
              <SetupHeading>Data</SetupHeading>
            </div>
            <div className="px-2 pb-1">
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Input</th>
                    <th>Form</th>
                    <th>In this run</th>
                  </tr>
                </thead>
                <tbody>
                  {info.inputs.map((row) => (
                    <tr key={row.input}>
                      <td className="w-[190px] font-semibold">{row.input}</td>
                      <td className="w-[36%] text-ink2">{row.form}</td>
                      <td>{row.here}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="mt-6 flex items-baseline gap-3">
            <SetupHeading>Settings</SetupHeading>
            <span className="text-[13px] text-ink3">Every setting says what it does and when to choose it</span>
          </div>
          <div className="mt-2">
            {info.settings.map((setting) => (
              <SettingCard key={setting.key} help={settingHelp(info.engineModule, setting.key)} setting={setting} />
            ))}
          </div>
        </div>

        <ThisRunCard id={info.runId} label={labelOf(info.runId)} lines={run.settings}>
          <Note icon="check" className="mt-4">
            You have already run these settings as <RunTag id={info.runId} />.
          </Note>
          <div className="mt-4">
            <LinkButton to={info.resultsTo} variant="pri" className="w-full justify-center">
              Open results
            </LinkButton>
          </div>
          <p className="mt-2 text-[13px] text-ink3">
            Calculated by the engine function <span className="num font-semibold text-ink2">{info.calls}</span>.
          </p>
        </ThisRunCard>
      </div>
    </Page>
  )
}
