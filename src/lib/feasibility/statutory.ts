/**
 * NSW statutory costs — stamp duty, land tax, HBCF and GST.
 *
 * These are the lines that most often get left out of a back-of-the-envelope
 * feasibility, and they are large: duty on a $2M site is over $91,000 and land
 * tax on a $3M site runs about $31,000 a year while you hold it.
 *
 * Every function here returns a `Traced` value so the UI can show the working.
 */

import { NSW } from './jurisdictions/nsw'
import {
  dutyBandDescription,
  dutyFor,
  dutyForRegime,
  landTaxFor,
  warrantyPremiumFor,
  type DutyRegime,
} from './jurisdictions/types'
import { traced } from './trace'
import type { Traced } from './types'

// ---------------------------------------------------------------------------
// Transfer (stamp) duty — NSW, FY2026/27 (contracts dated from 1 July 2026)
// ---------------------------------------------------------------------------

/**
 * The duty schedule now lives in the NSW jurisdiction profile, transcribed from
 * Revenue NSW's published FY2026/27 table and verified against their own
 * $3,870,000 → $194,137 premium anchor.
 *
 * These wrappers keep the existing call sites working while the engine migrates
 * to reading profiles directly. They are the reason the app reports the current
 * year's duty rather than the superseded FY2025-26 figures this file used to
 * hardcode.
 */

export const PREMIUM_DUTY_THRESHOLD = NSW.duty.premiumThreshold ?? Infinity

/** Raw duty figure, no trace. Used by solvers that iterate. */
export function nswStampDutyAmount(dutiableValue: number): number {
  return dutyFor(NSW.duty, dutiableValue)
}

/**
 * Duty on land that is not residential.
 *
 * NSW premium property duty is residential-only, so a commercial or industrial
 * site above $3,870,000 stays on the general 5.5% band. Applying the premium
 * tier to it would overstate the largest line in the acquisition.
 */
export function nswStampDutyAmountFor(dutiableValue: number, regime: DutyRegime): number {
  return dutyForRegime(NSW, dutiableValue, regime)
}

export function nswStampDuty(dutiableValue: number): Traced {
  const amount = nswStampDutyAmount(dutiableValue)
  if (dutiableValue <= 0) {
    return traced(0, 'high', {
      steps: [{ label: 'No dutiable acquisition', detail: 'You already own the land' }],
      sourceKey: 'nsw_transfer_duty',
    })
  }

  const isPremium = dutiableValue > PREMIUM_DUTY_THRESHOLD

  return traced(amount, 'high', {
    steps: [
      { label: 'Dutiable value', value: dutiableValue, format: 'money' },
      {
        label: isPremium ? 'Premium property band (residential only)' : 'General band',
        detail: dutyBandDescription(NSW.duty, dutiableValue),
      },
      {
        label: `Revenue NSW schedule, ${NSW.taxYear}`,
        detail:
          'Thresholds are CPI-indexed every 1 July, and the year that applies is set by your contract date, not settlement.',
      },
      { label: 'Transfer duty', value: amount, format: 'money' },
    ],
    sourceKey: 'nsw_transfer_duty',
  })
}

// ---------------------------------------------------------------------------
// Land tax — NSW, 2026 land tax year (taxing date 31 December 2025)
// ---------------------------------------------------------------------------

// Frozen for every land tax year after 2024 by the 2024-25 State Budget, so
// unlike the duty thresholds these are stable for multi-year modelling.
export const LAND_TAX_GENERAL_THRESHOLD = NSW.landTax.threshold
export const LAND_TAX_PREMIUM_THRESHOLD = 6_571_000
const LAND_TAX_GENERAL_RATE = 0.016
const LAND_TAX_PREMIUM_RATE = 0.02
const LAND_TAX_FIXED = 100

/** Raw annual land tax, no trace. */
export function nswLandTaxAmount(landValue: number, exempt: boolean): number {
  return landTaxFor(NSW.landTax, landValue, exempt)
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
export const HBCF_THRESHOLD = NSW.warranty.threshold
const HBCF_PCT = NSW.warranty.premiumRate

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
  const amount = warrantyPremiumFor(NSW.warranty, contractValue, isResidential)
  return traced(amount, 'medium', {
    range: {
      low: Math.round(contractValue * NSW.warranty.premiumRange.low),
      high: Math.round(contractValue * NSW.warranty.premiumRange.high),
    },
    steps: [
      { label: 'Contract value', value: contractValue, format: 'money' },
      {
        label: 'HBCF premium',
        detail: `${(HBCF_PCT * 100).toFixed(2)}% of contract value (indicative)`,
        value: amount,
        format: 'money',
      },
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
