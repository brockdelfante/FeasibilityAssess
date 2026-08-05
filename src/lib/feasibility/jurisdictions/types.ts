/**
 * Per-jurisdiction statutory schedules.
 *
 * Every Australian state and territory charges transfer duty and land tax on its
 * own schedule, and the *shapes* differ — not just the numbers. NSW duty is
 * purely marginal (a base amount plus a rate on the excess over a threshold).
 * Victoria's $960k–$2M band is a flat percentage of the entire dutiable value,
 * so a dollar more of purchase price can cost far more than a dollar of duty.
 * Queensland, South Australia and the rest each have their own quirks.
 *
 * So a band declares which kind it is rather than assuming marginal, and the
 * calculator honours that. Getting this wrong is not a rounding error: it
 * misstates the single largest one-off cost in an acquisition.
 */

import type { Jurisdiction } from '../types'

// ---------------------------------------------------------------------------
// Duty
// ---------------------------------------------------------------------------

export type BandKind =
  /** duty = fixed + (value − from) × rate */
  | 'marginal'
  /** duty = value × rate, applied to the whole dutiable value */
  | 'flat'

export interface DutyBand {
  /** Lower bound, exclusive. */
  from: number
  /** Upper bound, inclusive. Infinity for the top band. */
  upTo: number
  kind: BandKind
  /** Duty accumulated at the start of the band. Marginal bands only. */
  fixed: number
  /** Rate as a decimal, e.g. 0.055 for 5.5%. */
  rate: number
}

export interface DutySchedule {
  bands: DutyBand[]
  /** Minimum duty payable on any dutiable transaction, where one applies. */
  minimum: number
  /**
   * Threshold above which a premium/top rate applies, purely so the UI can say
   * "this purchase is in the premium band". Null where the jurisdiction has no
   * distinct premium tier.
   */
  premiumThreshold: number | null
}

// ---------------------------------------------------------------------------
// Land tax
// ---------------------------------------------------------------------------

export interface LandTaxBand {
  from: number
  upTo: number
  /** Tax accumulated at the start of the band. */
  fixed: number
  /** Marginal rate on the excess over `from`, as a decimal. */
  rate: number
}

export interface LandTaxSchedule {
  bands: LandTaxBand[]
  /** Land value at or below which no land tax is payable. */
  threshold: number
  /**
   * What the tax is assessed on. Every jurisdiction aggregates a taxpayer's
   * holdings, so a single-site figure understates a portfolio holder's bill.
   * Stated so the UI can say so.
   */
  assessedOn: string
}

// ---------------------------------------------------------------------------
// Residential builder warranty / indemnity insurance
// ---------------------------------------------------------------------------

export interface WarrantyScheme {
  /** What the jurisdiction calls it, e.g. "Home Building Compensation Fund". */
  name: string
  /** Short form for tight UI, e.g. "HBCF". */
  shortName: string
  /** Contract value above which cover is mandatory. Infinity where none exists. */
  threshold: number
  /** Indicative premium as a share of contract value. */
  premiumRate: number
  /** Plausible band for that premium. */
  premiumRange: { low: number; high: number }
  /** Null where the jurisdiction has no mandatory scheme. */
  regulator: string | null
}

// ---------------------------------------------------------------------------
// Building practitioner regime
// ---------------------------------------------------------------------------

export interface PractitionerRegime {
  /** Statute or scheme name, e.g. "Design and Building Practitioners Act 2020". */
  name: string
  /** True where a multi-unit (Class 2) scheme attracts extra regulated cost. */
  appliesToClass2: boolean
  /** Indicative compliance cost uplift on a small Class 2 scheme. */
  baseCostUplift: number
  /** Additional uplift per dwelling beyond the second. */
  costPerExtraDwelling: number
  /** Bounds on the uplift. */
  costRange: { low: number; high: number }
  /** Indicative program impact in months. */
  programMonthsBase: number
  programMonthsMax: number
  /** Practitioners that must be registered under the regime. */
  requiredPractitioners: string[]
  /** Public register, where one exists. */
  registerUrl: string | null
}

// ---------------------------------------------------------------------------
// Construction cost regionalisation
// ---------------------------------------------------------------------------

export interface CostRegion {
  key: string
  label: string
  /**
   * Multiplier on the base rate library, which is calibrated to Sydney metro.
   * Set from published state-by-state location factors.
   */
  multiplier: number
  /** True for the jurisdiction's default (usually its capital). */
  isDefault?: boolean
}

// ---------------------------------------------------------------------------
// A whole jurisdiction
// ---------------------------------------------------------------------------

/** How much the numbers in a jurisdiction profile can be relied on. */
export type ProfileConfidence =
  /** Transcribed from the revenue office's published table and reconciled. */
  | 'verified'
  /** Transcribed from a published source but not independently reconciled. */
  | 'transcribed'
  /** Indicative only — needs checking against the primary source. */
  | 'indicative'

export interface JurisdictionProfile {
  code: Jurisdiction
  name: string
  /** Financial year the schedules belong to, e.g. "2025-26". */
  taxYear: string
  confidence: ProfileConfidence
  /** ISO date these figures were transcribed. */
  asAt: string

  duty: DutySchedule
  dutySourceUrl: string
  landTax: LandTaxSchedule
  landTaxSourceUrl: string
  warranty: WarrantyScheme
  warrantySourceUrl: string | null
  practitioners: PractitionerRegime | null

  /** Indicative council/infrastructure contribution per dwelling. */
  contributionPerDwelling: { low: number; point: number; high: number }
  /** What the contribution mechanism is called locally, for the UI. */
  contributionMechanism: string

  regions: CostRegion[]

  /** Anything a developer in this jurisdiction must know that others need not. */
  quirks: string[]
}

// ---------------------------------------------------------------------------
// Calculators — shared across every jurisdiction
// ---------------------------------------------------------------------------

export function dutyFor(schedule: DutySchedule, dutiableValue: number): number {
  if (dutiableValue <= 0) return 0

  const band =
    schedule.bands.find((b) => dutiableValue > b.from && dutiableValue <= b.upTo) ??
    schedule.bands[schedule.bands.length - 1]

  const duty =
    band.kind === 'flat'
      ? dutiableValue * band.rate
      : band.fixed + (dutiableValue - band.from) * band.rate

  return Math.max(schedule.minimum, Math.round(duty))
}

/** Describe the band that applied, for the trace. */
export function dutyBandDescription(schedule: DutySchedule, dutiableValue: number): string {
  if (dutiableValue <= 0) return 'No dutiable acquisition'
  const band =
    schedule.bands.find((b) => dutiableValue > b.from && dutiableValue <= b.upTo) ??
    schedule.bands[schedule.bands.length - 1]

  if (band.kind === 'flat') {
    return `${(band.rate * 100).toFixed(2)}% of the whole dutiable value (this band is a flat rate, not marginal)`
  }
  return `$${band.fixed.toLocaleString()} plus ${(band.rate * 100).toFixed(2)}% of the value above $${band.from.toLocaleString()}`
}

export function landTaxFor(
  schedule: LandTaxSchedule,
  landValue: number,
  exempt: boolean
): number {
  if (exempt || landValue <= schedule.threshold) return 0

  const band =
    schedule.bands.find((b) => landValue > b.from && landValue <= b.upTo) ??
    schedule.bands[schedule.bands.length - 1]

  return Math.round(band.fixed + (landValue - band.from) * band.rate)
}

export function warrantyPremiumFor(
  scheme: WarrantyScheme,
  contractValue: number,
  isResidentialBuild: boolean
): number {
  if (!isResidentialBuild) return 0
  if (contractValue <= scheme.threshold) return 0
  return Math.round(contractValue * scheme.premiumRate)
}
