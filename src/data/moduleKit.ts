/**
 * What the data files of the further modules share: the engine's description
 * of its settings, and the shape of a setup screen and of a tutor exchange.
 *
 * The further modules are the ones that work with the records of the company
 * (forecasting, price optimization and so on). Each has one data file next to
 * this one, with its texts and with the way the engine's numbers reach its
 * screens. library.ts brings them together.
 */
import engineResults from './engine_results.json'
import type { ChatMessage, FurtherModuleId, RunId } from './alpineOat'

/** Written by the engine. Do not edit engine_results.json by hand: run the export again. */
export const engineModules = engineResults.modules

// ---------------------------------------------------------------- settings, in the engine's own words

export interface SettingOption {
  value: string | number | boolean | null
  label: string
  what_it_does: string
  when_to_choose: string
}

/** One setting as the engine describes it (describe_settings in the engine). */
export interface SettingHelp {
  key: string
  label: string
  kind: 'choice' | 'integer' | 'number' | 'list' | 'text'
  default: unknown
  what_it_does: string
  when_to_choose: string
  options?: SettingOption[]
  minimum?: number
  maximum?: number
  optional?: boolean
}

/** The engine's settings help, by the engine's name of the module. */
export const settingsHelp = engineResults.settings_help as unknown as Record<string, SettingHelp[]>

export function settingHelp(engineModule: string, key: string): SettingHelp {
  const found = settingsHelp[engineModule]?.find((setting) => setting.key === key)
  if (!found) throw new Error(`The engine describes no setting "${key}" for the module "${engineModule}".`)
  return found
}

/** The engine's label of a choice: "nonlinear" -> "Nonlinear least squares". */
export function optionLabel(engineModule: string, key: string, value: unknown): string {
  const option = settingHelp(engineModule, key).options?.find((item) => item.value === value)
  return option?.label ?? String(value)
}

// ---------------------------------------------------------------- setup screen

/** A setting of one run: the value the engine recorded, and optionally one sentence about it. */
export interface SetupSetting {
  key: string
  value: unknown
  /** For example "Left empty. The engine chose 12." */
  note?: string
}

/** Everything the setup screen of one run shows. The screen is view-only in the demo. */
export interface SetupInfo {
  runId: RunId
  module: FurtherModuleId
  /** The engine's name of the module, as in its settings help. */
  engineModule: string
  /** Page title, for example "Set up a forecast for a new product". */
  title: string
  /** The question the module answers. */
  question: string
  /** The steps of the student in this module, in plain language. */
  steps: string[]
  /** What the student brings: the data and the numbers the run needs. */
  inputs: { input: string; form: string; here: string }[]
  settings: SetupSetting[]
  /** The engine function the run calls. */
  calls: string
  resultsTo: string
}

// ---------------------------------------------------------------- AI tutor

/**
 * One short scripted exchange with the AI tutor in Coach mode. No model is
 * called: the lines are fixed text, and only their numbers come from the
 * engine. The student's own reading always comes first.
 */
export interface CoachScript {
  /** What the student wrote about the result. */
  note: string
  /** The coach's first reaction to the note. */
  opening: ChatMessage[]
  /** What happens next. Each click on the reply field inserts the next student reply. */
  turns: { student: string; coach: string }[]
}

/** The professor's reason for Coach mode in the weekly exercises, shown on the mode plate. */
export const practiceMode = {
  setFor: 'the weekly exercises',
  reason: 'These exercises are for practice. The tutor asks questions and gives hints, so that you learn to read the results yourself.',
  noAnswer: 'The coach never writes your conclusion.',
}

// ---------------------------------------------------------------- one screen of a module

/** A module in the navigation and in the professor's module list. */
export interface FurtherModule {
  id: FurtherModuleId
  name: string
  /** Short name for narrow places, for example the filter of the run history. */
  short: string
  to: string
  /** One line for the professor's module list. */
  text: string
}
