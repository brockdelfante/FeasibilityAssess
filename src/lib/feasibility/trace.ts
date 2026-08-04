/**
 * Traceability and formatting primitives.
 *
 * Every derived number in the model is wrapped in a `Traced` so the UI can
 * answer "where did that come from?" without the engine and the components
 * having to agree on anything else.
 */

import type { Confidence, Traced, TraceStep } from './types'

export function traced(
  value: number,
  confidence: Confidence,
  opts: {
    range?: { low: number; high: number }
    steps?: TraceStep[]
    sourceKey?: string
    verifyWith?: string
    overridden?: boolean
  } = {}
): Traced {
  return {
    value,
    confidence,
    overridden: opts.overridden ?? false,
    range: opts.range,
    steps: opts.steps ?? [],
    sourceKey: opts.sourceKey,
    verifyWith: opts.verifyWith,
  }
}

/**
 * Replace a computed value with one the user pinned in Pro Mode. An override is
 * always high confidence — the user is asserting they know better than the
 * library, which for a real builder quote they usually do.
 */
export function withOverride(base: Traced, override: number | null | undefined): Traced {
  if (override === null || override === undefined || !Number.isFinite(override)) return base
  return {
    ...base,
    value: override,
    confidence: 'high',
    overridden: true,
    range: undefined,
    steps: [
      { label: 'Overridden by you', value: override, format: 'money' },
      {
        label: 'Quick figure (replaced)',
        value: base.value,
        format: 'money',
        detail: 'Clear the override to fall back to the rate library',
      },
    ],
  }
}

/** The weakest confidence wins when several inputs feed one number. */
export function weakestConfidence(...items: (Confidence | undefined)[]): Confidence {
  const present = items.filter(Boolean) as Confidence[]
  if (present.includes('low')) return 'low'
  if (present.includes('medium')) return 'medium'
  return 'high'
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

export function money(value: number | null | undefined, opts: { decimals?: number } = {}): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const decimals = opts.decimals ?? 0
  const negative = value < 0
  const formatted = Math.abs(value).toLocaleString('en-AU', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  return `${negative ? '−' : ''}$${formatted}`
}

/** Compact money for tight spaces: $1.2M, $850k. */
export function moneyCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  const sign = value < 0 ? '−' : ''
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1)}M`
  if (abs >= 1_000) return `${sign}$${Math.round(abs / 1_000)}k`
  return `${sign}$${Math.round(abs)}`
}

export function percent(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${(value * 100).toFixed(decimals)}%`
}

/** Percentage points, for scenario deltas. */
export function pp(value: number | null | undefined, decimals = 1): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const sign = value > 0 ? '+' : value < 0 ? '−' : ''
  return `${sign}${Math.abs(value * 100).toFixed(decimals)}pp`
}

export function area(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `${Math.round(value).toLocaleString('en-AU')} m²`
}

export function ratePerSqm(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  return `$${Math.round(value).toLocaleString('en-AU')}/m²`
}

export function months(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—'
  const rounded = Math.round(value * 10) / 10
  return `${rounded} ${rounded === 1 ? 'month' : 'months'}`
}

/** Format a trace step's value according to its declared format. */
export function formatStep(step: TraceStep): string {
  if (step.value === undefined) return ''
  switch (step.format) {
    case 'percent':
      return percent(step.value)
    case 'area':
      return area(step.value)
    case 'rate':
      return ratePerSqm(step.value)
    case 'months':
      return months(step.value)
    case 'number':
      return Math.round(step.value).toLocaleString('en-AU')
    case 'money':
    default:
      return money(step.value)
  }
}

// ---------------------------------------------------------------------------
// Small numeric helpers used across the engine
// ---------------------------------------------------------------------------

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Guard every division in the engine — a blank form must not produce NaN. */
export function safeDiv(numerator: number, denominator: number, fallback = 0): number {
  if (!denominator || !Number.isFinite(denominator)) return fallback
  const result = numerator / denominator
  return Number.isFinite(result) ? result : fallback
}
