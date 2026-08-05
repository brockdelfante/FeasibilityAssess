/**
 * Statutory costs — transfer duty, land tax, builder warranty and GST.
 *
 * These are the lines that most often get left out of a back-of-the-envelope
 * feasibility, and they are large: duty on a $2M NSW site is over $91,000 and
 * land tax on a $3M site runs about $31,000 a year while you hold it.
 *
 * Everything except GST is state law, so every function here takes a
 * jurisdiction and reads its profile. Nothing is hardcoded to one state: the
 * same $2,000,000 site is $91,287 of duty in NSW, $110,000 in Victoria and
 * $95,600 in the ACT, and a commercial site in South Australia is $0.
 *
 * Every function returns a `Traced` value so the UI can show the working.
 */

import { profileFor } from './jurisdictions'
import {
  dutyBandDescription,
  dutyForRegime,
  landTaxFor,
  warrantyPremiumFor,
  type JurisdictionProfile,
  type LandTaxSchedule,
} from './jurisdictions/types'
import { traced } from './trace'
import type { DevType, DutyRegime, Jurisdiction, Traced, TraceStep } from './types'

// ---------------------------------------------------------------------------
// Source keys — one set per jurisdiction, generated in ./sources.ts
// ---------------------------------------------------------------------------

export function dutySourceKey(code: Jurisdiction): string {
  return `duty_${code}`
}
export function landTaxSourceKey(code: Jurisdiction): string {
  return `land_tax_${code}`
}
export function warrantySourceKey(code: Jurisdiction): string {
  return `warranty_${code}`
}
export function contributionsSourceKey(code: Jurisdiction): string {
  return `contributions_${code}`
}
export function practitionerSourceKey(code: Jurisdiction): string {
  return `practitioners_${code}`
}

// ---------------------------------------------------------------------------
// Which duty regime applies
// ---------------------------------------------------------------------------

/**
 * Infer the duty regime from the development type unless the client has set it.
 *
 * Only a purely commercial scheme is treated as commercial by default. Mixed-use
 * is left residential because revenue offices apportion it, and the residential
 * scale is the higher of the two nearly everywhere — so the default errs towards
 * overstating the cost rather than understating it. The override exists for
 * industrial land and for schemes where the apportionment is known.
 */
export function dutyRegimeFor(devType: DevType, override: DutyRegime | null): DutyRegime {
  if (override) return override
  return devType === 'commercial' ? 'commercial' : 'residential'
}

// ---------------------------------------------------------------------------
// Transfer (stamp) duty
// ---------------------------------------------------------------------------

/** Raw duty figure, no trace. Used by solvers that iterate. */
export function stampDutyAmount(
  code: Jurisdiction,
  dutiableValue: number,
  regime: DutyRegime = 'residential'
): number {
  return dutyForRegime(profileFor(code), dutiableValue, regime)
}

export function premiumDutyThreshold(code: Jurisdiction): number {
  return profileFor(code).duty.premiumThreshold ?? Infinity
}

export function stampDuty(
  code: Jurisdiction,
  dutiableValue: number,
  regime: DutyRegime = 'residential'
): Traced {
  const profile = profileFor(code)
  const amount = stampDutyAmount(code, dutiableValue, regime)

  if (dutiableValue <= 0) {
    return traced(0, 'high', {
      steps: [{ label: 'No dutiable acquisition', detail: 'You already own the land' }],
      sourceKey: dutySourceKey(code),
    })
  }

  // A commercial acquisition may not be on the residential scale at all, and in
  // South Australia may not be dutiable. Say which schedule was used, because
  // the difference is the whole line.
  if (regime === 'commercial' && profile.commercialDutyTreatment !== 'same') {
    const schedule = profile.commercialDuty
    return traced(amount, 'high', {
      steps: [
        { label: 'Dutiable value', value: dutiableValue, format: 'money' },
        { label: 'Non-residential land', detail: profile.commercialDutyNote },
        ...(schedule
          ? [
              {
                label: 'Commercial scale',
                detail: dutyBandDescription(schedule, dutiableValue),
              },
            ]
          : []),
        { label: 'Transfer duty', value: amount, format: 'money' as const },
      ],
      sourceKey: dutySourceKey(code),
      verifyWith:
        'your conveyancer — whether land counts as non-residential turns on its use and zoning at settlement',
    })
  }

  const premium = profile.duty.residentialPremium
  const isPremium =
    regime === 'residential' && premium !== null && dutiableValue > premium.threshold
  // The residential premium tier is stripped for commercial land, so describe
  // the schedule that was actually applied rather than the published one.
  const applied =
    regime === 'commercial' ? { ...profile.duty, residentialPremium: null } : profile.duty

  const steps: TraceStep[] = [
    { label: 'Dutiable value', value: dutiableValue, format: 'money' },
    {
      label: isPremium ? 'Premium property band (residential only)' : 'General band',
      detail: dutyBandDescription(applied, dutiableValue),
    },
    {
      label: `${profile.name} schedule, ${profile.taxYear}`,
      detail:
        'Thresholds are re-indexed periodically, and the year that applies is set by your contract date, not settlement.',
    },
    { label: 'Transfer duty', value: amount, format: 'money' },
  ]

  if (regime === 'commercial' && premium) {
    steps.splice(1, 0, {
      label: 'Non-residential land',
      detail: `The ${profile.code} premium tier applies to residential land only, so this stays on the general scale.`,
    })
  }

  return traced(amount, 'high', { steps, sourceKey: dutySourceKey(code) })
}

// ---------------------------------------------------------------------------
// Land tax
// ---------------------------------------------------------------------------

/** Raw annual land tax, no trace. */
export function landTaxAmount(code: Jurisdiction, landValue: number, exempt: boolean): number {
  return landTaxFor(profileFor(code).landTax, landValue, exempt)
}

/** Describe the band a land value falls in, straight off the schedule. */
function landTaxBandDescription(schedule: LandTaxSchedule, landValue: number): string {
  const band =
    schedule.bands.find((b) => landValue > b.from && landValue <= b.upTo) ??
    schedule.bands[schedule.bands.length - 1]

  const fixed = `$${band.fixed.toLocaleString()}`
  if (band.rate === 0) return `${fixed} flat for this band`
  return `${fixed} plus ${(band.rate * 100).toFixed(2)}% of the land value above $${band.from.toLocaleString()}`
}

export function landTax(code: Jurisdiction, landValue: number, exempt: boolean): Traced {
  const profile = profileFor(code)
  const schedule = profile.landTax
  const amount = landTaxAmount(code, landValue, exempt)
  const sourceKey = landTaxSourceKey(code)

  if (exempt) {
    return traced(0, 'high', {
      steps: [
        {
          label: 'Exempt',
          detail: 'Principal place of residence, primary production, or an exempt charity',
        },
      ],
      sourceKey,
    })
  }

  if (landValue <= schedule.threshold) {
    return traced(0, 'high', {
      steps: [
        { label: 'Land value', value: landValue, format: 'money' },
        {
          label: 'Below the threshold',
          detail: `Land value is at or under $${schedule.threshold.toLocaleString()} — no ${profile.code} land tax payable on this site alone`,
        },
      ],
      sourceKey,
    })
  }

  return traced(amount, 'high', {
    steps: [
      { label: 'Land value (unimproved)', value: landValue, format: 'money' },
      { label: 'Land tax band', detail: landTaxBandDescription(schedule, landValue) },
      {
        label: 'Assessed on your whole holding',
        detail:
          'Every jurisdiction aggregates all the land a taxpayer owns, so adding a site pushes the rest of the portfolio further up the scale. This figure is for this site in isolation.',
      },
      { label: 'Land tax per year', value: amount, format: 'money' },
    ],
    sourceKey,
    verifyWith:
      'your accountant, if you hold other land in this state — the assessment is on the aggregate',
  })
}

// ---------------------------------------------------------------------------
// Residential builder warranty / indemnity insurance
// ---------------------------------------------------------------------------

/** What the local scheme is called, for UI labels. */
export function warrantySchemeFor(code: Jurisdiction) {
  return profileFor(code).warranty
}

/** Raw premium, no trace. */
export function warrantyPremiumAmount(
  code: Jurisdiction,
  contractValue: number,
  isResidentialBuild: boolean
): number {
  return warrantyPremiumFor(profileFor(code).warranty, contractValue, isResidentialBuild)
}

export function warrantyPremium(
  code: Jurisdiction,
  contractValue: number,
  isResidentialBuild: boolean
): Traced {
  const scheme = profileFor(code).warranty
  const sourceKey = warrantySourceKey(code)

  if (scheme.threshold === Infinity) {
    return traced(0, 'high', {
      steps: [
        {
          label: 'No mandatory scheme',
          detail: `${code} has no compulsory residential builder warranty insurance scheme.`,
        },
      ],
      sourceKey,
    })
  }

  if (!isResidentialBuild || contractValue <= scheme.threshold) {
    return traced(0, 'high', {
      steps: [
        {
          label: 'Not required',
          detail: isResidentialBuild
            ? `Contract value is under the $${scheme.threshold.toLocaleString()} threshold`
            : `${scheme.shortName} applies to residential building work only`,
        },
      ],
      sourceKey,
    })
  }

  const amount = warrantyPremiumAmount(code, contractValue, isResidentialBuild)
  return traced(amount, 'medium', {
    range: {
      low: Math.round(contractValue * scheme.premiumRange.low),
      high: Math.round(contractValue * scheme.premiumRange.high),
    },
    steps: [
      { label: 'Contract value', value: contractValue, format: 'money' },
      {
        label: `${scheme.shortName} premium`,
        detail: `${(scheme.premiumRate * 100).toFixed(2)}% of contract value (indicative)`,
        value: amount,
        format: 'money',
      },
    ],
    sourceKey,
    verifyWith: 'your builder — the actual premium depends on their risk rating',
  })
}

// ---------------------------------------------------------------------------
// Council / infrastructure contributions
// ---------------------------------------------------------------------------

/** The contribution range and what the mechanism is called locally. */
export function contributionsFor(code: Jurisdiction): {
  perDwelling: JurisdictionProfile['contributionPerDwelling']
  mechanism: string
} {
  const profile = profileFor(code)
  return { perDwelling: profile.contributionPerDwelling, mechanism: profile.contributionMechanism }
}

// ---------------------------------------------------------------------------
// GST — Commonwealth, so the same everywhere
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
