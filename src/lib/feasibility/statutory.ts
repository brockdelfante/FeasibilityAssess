/**
 * NSW statutory costs — stamp duty, land tax, HBCF and GST.
 *
 * These are the lines that most often get left out of a back-of-the-envelope
 * feasibility, and they are large: duty on a $2M site is over $92,000 and land
 * tax on a $3M site runs about $31,000 a year while you hold it.
 *
 * Every function here returns a `Traced` value so the UI can show the working.
 */

import { traced } from './trace'
import type { Traced } from './types'

// ---------------------------------------------------------------------------
// Transfer (stamp) duty — NSW, 1 July 2025 to 30 June 2026
// ---------------------------------------------------------------------------

interface DutyBracket {
  /** Upper bound of the bracket. Infinity for the top bracket. */
  upTo: number
  /** Duty accumulated at the start of this bracket. */
  base: number
  /** Rate per $100 of the amount over `from`. */
  ratePer100: number
  from: number
}

/**
 * Revenue NSW transfer duty schedule for FY2025–26. Thresholds are CPI-indexed
 * every July, so this table needs a review each financial year.
 */
const NSW_DUTY_BRACKETS: DutyBracket[] = [
  { from: 0, upTo: 17_000, base: 0, ratePer100: 1.25 },
  { from: 17_000, upTo: 37_000, base: 212, ratePer100: 1.5 },
  { from: 37_000, upTo: 99_000, base: 512, ratePer100: 1.75 },
  { from: 99_000, upTo: 372_000, base: 1_597, ratePer100: 3.5 },
  { from: 372_000, upTo: 1_240_000, base: 11_152, ratePer100: 4.5 },
  { from: 1_240_000, upTo: 3_721_000, base: 50_212, ratePer100: 5.5 },
  // Premium property duty
  { from: 3_721_000, upTo: Infinity, base: 186_667, ratePer100: 7.0 },
]

/** Minimum duty payable on any dutiable transaction. */
const MIN_DUTY = 10

export const PREMIUM_DUTY_THRESHOLD = 3_721_000

/** Raw duty figure, no trace. Used by solvers that iterate. */
export function nswStampDutyAmount(dutiableValue: number): number {
  if (dutiableValue <= 0) return 0
  const bracket =
    NSW_DUTY_BRACKETS.find((b) => dutiableValue > b.from && dutiableValue <= b.upTo) ??
    NSW_DUTY_BRACKETS[NSW_DUTY_BRACKETS.length - 1]
  const duty = bracket.base + ((dutiableValue - bracket.from) / 100) * bracket.ratePer100
  return Math.max(MIN_DUTY, Math.round(duty))
}

export function nswStampDuty(dutiableValue: number): Traced {
  const amount = nswStampDutyAmount(dutiableValue)
  if (dutiableValue <= 0) {
    return traced(0, 'high', {
      steps: [{ label: 'No dutiable acquisition', detail: 'You already own the land' }],
      sourceKey: 'nsw_transfer_duty',
    })
  }
  const bracket =
    NSW_DUTY_BRACKETS.find((b) => dutiableValue > b.from && dutiableValue <= b.upTo) ??
    NSW_DUTY_BRACKETS[NSW_DUTY_BRACKETS.length - 1]
  const isPremium = dutiableValue > PREMIUM_DUTY_THRESHOLD

  return traced(amount, 'high', {
    steps: [
      { label: 'Dutiable value', value: dutiableValue, format: 'money' },
      {
        label: isPremium ? 'Premium property band' : 'Standard band',
        detail: `$${bracket.base.toLocaleString()} + $${bracket.ratePer100.toFixed(2)} per $100 over $${bracket.from.toLocaleString()}`,
      },
      { label: 'Transfer duty', value: amount, format: 'money' },
    ],
    sourceKey: 'nsw_transfer_duty',
  })
}

// ---------------------------------------------------------------------------
// Land tax — NSW, FY2025–26
// ---------------------------------------------------------------------------

export const LAND_TAX_GENERAL_THRESHOLD = 1_075_000
export const LAND_TAX_PREMIUM_THRESHOLD = 6_571_000
const LAND_TAX_GENERAL_RATE = 0.016
const LAND_TAX_PREMIUM_RATE = 0.02
const LAND_TAX_FIXED = 100

/** Raw annual land tax, no trace. */
export function nswLandTaxAmount(landValue: number, exempt: boolean): number {
  if (exempt || landValue <= LAND_TAX_GENERAL_THRESHOLD) return 0
  const generalPortion =
    Math.min(landValue, LAND_TAX_PREMIUM_THRESHOLD) - LAND_TAX_GENERAL_THRESHOLD
  let tax = LAND_TAX_FIXED + generalPortion * LAND_TAX_GENERAL_RATE
  if (landValue > LAND_TAX_PREMIUM_THRESHOLD) {
    tax += (landValue - LAND_TAX_PREMIUM_THRESHOLD) * LAND_TAX_PREMIUM_RATE
  }
  return Math.round(tax)
}

export function nswLandTax(landValue: number, exempt: boolean): Traced {
  const amount = nswLandTaxAmount(landValue, exempt)

  if (exempt) {
    return traced(0, 'high', {
      steps: [
        {
          label: 'Exempt',
          detail: 'Principal place of residence, primary production, or an exempt charity',
        },
      ],
      sourceKey: 'nsw_land_tax',
    })
  }

  if (landValue <= LAND_TAX_GENERAL_THRESHOLD) {
    return traced(0, 'high', {
      steps: [
        { label: 'Land value', value: landValue, format: 'money' },
        {
          label: 'Below the general threshold',
          detail: `Land value is under $${LAND_TAX_GENERAL_THRESHOLD.toLocaleString()} — no land tax payable`,
        },
      ],
      sourceKey: 'nsw_land_tax',
    })
  }

  const generalPortion =
    Math.min(landValue, LAND_TAX_PREMIUM_THRESHOLD) - LAND_TAX_GENERAL_THRESHOLD
  const steps = [
    { label: 'Land value (unimproved)', value: landValue, format: 'money' as const },
    {
      label: 'General band',
      detail: `$100 + 1.6% of $${Math.round(generalPortion).toLocaleString()} above $${LAND_TAX_GENERAL_THRESHOLD.toLocaleString()}`,
      value: LAND_TAX_FIXED + generalPortion * LAND_TAX_GENERAL_RATE,
      format: 'money' as const,
    },
  ]

  if (landValue > LAND_TAX_PREMIUM_THRESHOLD) {
    steps.push({
      label: 'Premium band',
      detail: `2.0% of $${Math.round(landValue - LAND_TAX_PREMIUM_THRESHOLD).toLocaleString()} above $${LAND_TAX_PREMIUM_THRESHOLD.toLocaleString()}`,
      value: (landValue - LAND_TAX_PREMIUM_THRESHOLD) * LAND_TAX_PREMIUM_RATE,
      format: 'money' as const,
    })
  }

  steps.push({ label: 'Land tax per year', value: amount, format: 'money' as const })

  return traced(amount, 'high', { steps, sourceKey: 'nsw_land_tax' })
}

// ---------------------------------------------------------------------------
// Home Building Compensation Fund
// ---------------------------------------------------------------------------

/** HBCF cover is required on residential building work over this value. */
export const HBCF_THRESHOLD = 20_000
const HBCF_PCT = 0.007

export function nswHbcf(contractValue: number, isResidential: boolean): Traced {
  if (!isResidential || contractValue <= HBCF_THRESHOLD) {
    return traced(0, 'high', {
      steps: [
        {
          label: 'Not required',
          detail: isResidential
            ? `Contract value is under the $${HBCF_THRESHOLD.toLocaleString()} threshold`
            : 'HBCF applies to residential building work only',
        },
      ],
      sourceKey: 'nsw_hbcf',
    })
  }
  const amount = Math.round(contractValue * HBCF_PCT)
  return traced(amount, 'medium', {
    range: { low: Math.round(contractValue * 0.005), high: Math.round(contractValue * 0.01) },
    steps: [
      { label: 'Contract value', value: contractValue, format: 'money' },
      { label: 'HBCF premium', detail: '0.7% of contract value (indicative)', value: amount, format: 'money' },
    ],
    sourceKey: 'nsw_hbcf',
    verifyWith: 'your builder — the actual premium depends on their risk rating',
  })
}

// ---------------------------------------------------------------------------
// GST
// ---------------------------------------------------------------------------

/** Raw GST under the margin scheme, no trace. */
export function gstMarginSchemeAmount(grossRealisation: number, acquisitionCost: number): number {
  return Math.max(0, (grossRealisation - acquisitionCost) / 11)
}

export function gstOnSale(
  grossRealisation: number,
  acquisitionCost: number,
  treatment: 'margin_scheme' | 'none'
): Traced {
  if (treatment === 'none') {
    return traced(0, 'high', {
      steps: [
        {
          label: 'No GST',
          detail: 'GST-free or owner-occupier — no GST is remitted on sale',
        },
      ],
      sourceKey: 'gst_margin_scheme',
    })
  }

  const margin = Math.max(0, grossRealisation - acquisitionCost)
  const amount = Math.round(gstMarginSchemeAmount(grossRealisation, acquisitionCost))

  return traced(amount, 'medium', {
    steps: [
      { label: 'Gross realisation', value: grossRealisation, format: 'money' },
      { label: 'Less acquisition cost', value: -acquisitionCost, format: 'money' },
      { label: 'Margin', value: margin, format: 'money' },
      { label: 'GST at 1/11 of the margin', value: amount, format: 'money' },
    ],
    sourceKey: 'gst_margin_scheme',
    verifyWith: 'your accountant — margin scheme eligibility depends on how the land was acquired',
  })
}
