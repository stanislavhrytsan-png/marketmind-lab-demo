/** Class names and small lookups shared by several components. */
import type { Mode, ModuleId } from '../data/alpineOat'
import { cx } from '../lib/demo'
import type { IconName } from './Icon'

export type ButtonVariant = 'pri' | 'sec' | 'quiet'
export type ButtonSize = 'md' | 'sm'

/** The button look from the style guide. Used by buttons and by links that look like buttons. */
export function buttonClass(variant: ButtonVariant = 'sec', size: ButtonSize = 'md', extra?: string) {
  return cx(
    'inline-flex items-center gap-[7px] rounded-md border font-semibold whitespace-nowrap',
    'transition-[color,background-color,border-color,transform] duration-150 ease-std active:translate-y-px',
    size === 'md' ? 'h-9 text-[14px]' : 'h-[30px] text-[13px]',
    variant === 'quiet' ? (size === 'md' ? 'px-2' : 'px-2.5') : size === 'md' ? 'px-3.5' : 'px-2.5',
    variant === 'pri' && 'border-primary bg-primary text-white hover:border-primary-d hover:bg-primary-d',
    variant === 'sec' && 'border-line bg-white text-ink hover:border-ctl hover:bg-[#FAFAFC]',
    variant === 'quiet' && 'border-transparent bg-transparent text-primary hover:bg-primary-t',
    'disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-fill disabled:bg-fill disabled:text-ctl2',
    extra,
  )
}

const modeIcons: Record<Mode, IconName> = { off: 'off', coach: 'coach', explain: 'explain' }
export const modeIcon = (mode: Mode) => modeIcons[mode]

/** Every module has its own icon, in the navigation and in the professor's module list. */
export const moduleIcons: Record<ModuleId, IconName> = {
  segmentation: 'segmentation',
  positioning: 'positioning',
  conjoint: 'conjoint',
  forecasting: 'forecasting',
  pricing: 'pricing',
  targeting: 'targeting',
  lifetimeValue: 'lifetimeValue',
  allocation: 'allocation',
  portfolio: 'portfolio',
  panel: 'panel',
  sentiment: 'sentiment',
  network: 'network',
}
