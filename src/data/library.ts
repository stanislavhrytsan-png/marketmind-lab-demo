/**
 * The module library: all modules and all runs of the demo in one place.
 *
 * alpineOat.ts describes the three survey modules of the assignment. Each
 * further module (forecasting, price optimization and so on) has its own data
 * file. A further module that is built is listed in `built` below. Until then
 * it stays in the navigation as "coming soon".
 */
import { allocationModule, allocationRuns, allocationSetups } from './allocation'
import { surveyModules, surveyRuns } from './alpineOat'
import type { FurtherModuleId, ModuleId, Run, RunId } from './alpineOat'
import { forecastingModule, forecastingRuns, forecastingSetups } from './forecasting'
import { lifetimeValueModule, lifetimeValueRuns, lifetimeValueSetups } from './lifetimeValue'
import type { FurtherModule, SetupInfo } from './moduleKit'
import { panelModule, panelRuns, panelSetups } from './panel'
import { portfolioModule, portfolioRuns, portfolioSetups } from './portfolio'
import { pricingModule, pricingRuns, pricingSetups } from './pricing'
import { targetingModule, targetingRuns, targetingSetups } from './targeting'

/** The further modules that are built, in the order of the navigation. */
const built: { module: FurtherModule; runs: Run[]; setups: SetupInfo[] }[] = [
  { module: forecastingModule, runs: forecastingRuns, setups: forecastingSetups },
  { module: pricingModule, runs: pricingRuns, setups: pricingSetups },
  { module: targetingModule, runs: targetingRuns, setups: targetingSetups },
  { module: lifetimeValueModule, runs: lifetimeValueRuns, setups: lifetimeValueSetups },
  { module: allocationModule, runs: allocationRuns, setups: allocationSetups },
  { module: portfolioModule, runs: portfolioRuns, setups: portfolioSetups },
  { module: panelModule, runs: panelRuns, setups: panelSetups },
]

/** The names of the further modules that are not built yet, in the order of the concept. */
const planned: { id: FurtherModuleId; name: string }[] = [
  { id: 'sentiment', name: 'Sentiment analysis' },
  { id: 'targeting', name: 'Predictive modeling' },
  { id: 'pricing', name: 'Price optimization' },
  { id: 'portfolio', name: 'GE McKinsey matrix' },
  { id: 'allocation', name: 'Resource allocation' },
  { id: 'lifetimeValue', name: 'Customer lifetime value' },
  { id: 'network', name: 'Network analysis' },
  { id: 'forecasting', name: 'Forecasting' },
  { id: 'panel', name: 'Panel regression' },
]

const builtIds = built.map((entry) => entry.module.id as ModuleId)

export const modules = {
  /** Modules with screens in the demo. `text` is the line in the professor's module list. */
  active: [...surveyModules, ...built.map(({ module }) => ({ id: module.id as ModuleId, name: module.name, to: module.to, text: module.text }))],
  comingSoon: planned.filter((module) => !builtIds.includes(module.id)).map((module) => module.name),
}

export const moduleNames = Object.fromEntries([
  ...planned.map((module) => [module.id, module.name]),
  ...modules.active.map((module) => [module.id, module.name]),
]) as Record<ModuleId, string>

/** Short names for narrow places, for example the filter of the run history. */
export const moduleShortNames = Object.fromEntries([
  ...modules.active.map((module) => [module.id, module.id === 'conjoint' ? 'Conjoint' : module.name]),
  ...built.map(({ module }) => [module.id, module.short]),
]) as Record<ModuleId, string>

/** The order of the modules wherever runs are grouped by module. */
export const moduleOrder: ModuleId[] = modules.active.map((module) => module.id)

/**
 * All runs. The survey runs belong to the assignment. The runs of the
 * further modules come from the weekly exercises on the company data of the
 * same case. Each one is a real run of the engine.
 */
export const runs: Run[] = [...surveyRuns, ...built.flatMap((entry) => entry.runs)]

/** The setup screens of the further modules, by run. */
export const setups: SetupInfo[] = built.flatMap((entry) => entry.setups)
export const setupOf = (id: RunId | string) => setups.find((setup) => setup.runId === id)

/** One sentence for the professor's module list, when modules are still to come. */
export const comingSoonNote =
  modules.comingSoon.length === 0
    ? ''
    : `${modules.comingSoon.length} more ${modules.comingSoon.length === 1 ? 'module is' : 'modules are'} in development: ${modules.comingSoon.join(', ').replace(/, ([^,]*)$/, ' and $1')}. They appear here as they are released.`
