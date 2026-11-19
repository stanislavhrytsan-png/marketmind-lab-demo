/**
 * How numbers are written on the screens of the further modules. Every
 * number comes from the engine's results. These helpers only decide how many
 * digits are shown.
 */

/** 59427.6 -> "59,428" */
export const thousands = (value: number, digits = 0) =>
  value.toLocaleString('en-US', { minimumFractionDigits: digits, maximumFractionDigits: digits })

/** 59427.6 -> "59,400": a number that is only known roughly, rounded to three significant digits. */
export function roughly(value: number): string {
  if (value === 0) return '0'
  const size = 10 ** (Math.floor(Math.log10(Math.abs(value))) - 2)
  return thousands(Math.round(value / size) * size, size < 1 ? Math.min(6, Math.round(-Math.log10(size))) : 0)
}

/** 0.433 -> "43%" */
export const pct = (fraction: number, digits = 0) => `${(fraction * 100).toFixed(digits)}%`

/** 0.067 -> "+7%", -0.216 -> "−22%" (with a real minus sign) */
export const signedPct = (fraction: number, digits = 0) =>
  `${fraction < 0 ? '−' : '+'}${Math.abs(fraction * 100).toFixed(digits)}%`

/** 0.26 -> "+0.26", -0.2 -> "−0.20" */
export const signed = (value: number, digits = 2) => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(digits)}`

/** -2.2 -> "−2.20": a plain number with a real minus sign. */
export const fixed = (value: number, digits = 2) => `${value < 0 ? '−' : ''}${Math.abs(value).toFixed(digits)}`

/** 2.5 -> "CHF 2.50", 1432.2 -> "CHF 1,432" */
export const chf = (value: number, digits = 2) => `${value < 0 ? '−' : ''}CHF ${thousands(Math.abs(value), digits)}`

/** 2 -> "two", for running text */
export const inWords = (count: number) =>
  ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][count] ??
  String(count)

export const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** "A", "A and B", "A, B and C" */
export const listed = (names: string[]) =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

/** 1 -> "1 quarter", 8 -> "8 quarters" */
export const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** "2024-03" -> "Mar 2024". Other labels are returned as they are. */
export function monthName(label: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(label)
  if (!match) return label
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${names[Number(match[2]) - 1]} ${match[1]}`
}

/** How many words a text has. */
export const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length
