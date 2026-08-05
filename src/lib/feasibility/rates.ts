/**
 * Australian rate library, base year 2026–27.
 *
 * Construction rates are calibrated to SYDNEY METRO. Every other market is
 * reached by the location factor on the jurisdiction profile, so a Bendigo
 * townhouse and a Perth apartment are priced off the same library rather than
 * off separate tables that would drift apart.
 *
 * Everything a client does not know is looked up here, so a nearly-blank form
 * still produces a complete answer. Each rate publishes a plausible range as
 * well as a point estimate — the range is what the UI shows as the confidence
 * band, and what the sensitivity table swings across.
 */

import type { DevType, FinanceProfile, ProjectStage, QualityTier, SiteDifficulty, TradeKey } from './types'

export interface RateRange {
  low: number
  point: number
  high: number
}

/** Which column of the construction table a development type reads from. */
type RateFamily = 'house' | 'apartment' | 'renovation'

function familyFor(devType: DevType): RateFamily {
  switch (devType) {
    case 'apartment':
    case 'mixed_use':
    case 'commercial':
      return 'apartment'
    case 'renovation':
      return 'renovation'
    default:
      // duplex, townhouse, house_land, subdivision
      return 'house'
  }
}

/**
 * Contract-value $/m² of gross floor area, Sydney metro 2025–26.
 *
 * These are CONTRACT VALUE figures — they include the builder's overhead and
 * margin on a fixed-price contract. They exclude land, duty, council
 * contributions, finance, HBCF, consultants and contingency; the engine adds
 * all of those separately.
 */
const CONSTRUCTION_RATES: Record<RateFamily, Record<QualityTier, [number, number]>> = {
  house: {
    budget: [2300, 3000],
    standard: [2600, 3400],
    medium: [2900, 3900],
    high_end: [3400, 5500],
    luxury: [6000, 11000],
    ultra_luxury: [9500, 18000],
  },
  apartment: {
    budget: [2800, 3600],
    standard: [3200, 4100],
    medium: [3600, 4700],
    high_end: [4300, 6500],
    luxury: [6500, 12000],
    ultra_luxury: [11000, 18000],
  },
  renovation: {
    budget: [2500, 3600],
    standard: [3000, 4200],
    medium: [3600, 5000],
    high_end: [4200, 6800],
    luxury: [6500, 13000],
    ultra_luxury: [10000, 20000],
  },
}

/** Multiplier applied on top of the base rate for site conditions. */
export const SITE_DIFFICULTY_MULTIPLIER: Record<SiteDifficulty, number> = {
  easy: 0.95,
  normal: 1.0,
  difficult: 1.12,
  very_difficult: 1.25,
}

/**
 * A subdivision has no building work — the "construction" line is civils only,
 * so it is priced per lot against site area rather than per m² of floor area.
 */
export const SUBDIVISION_CIVILS_PER_LOT: RateRange = { low: 55_000, point: 85_000, high: 140_000 }

/** Look up the construction rate for a scheme, with its plausible range. */
export function constructionRate(
  devType: DevType,
  quality: QualityTier,
  difficulty: SiteDifficulty
): RateRange {
  const [low, high] = CONSTRUCTION_RATES[familyFor(devType)][quality]
  const mult = SITE_DIFFICULTY_MULTIPLIER[difficulty]
  const point = ((low + high) / 2) * mult
  return {
    low: Math.round(low * mult),
    point: Math.round(point),
    high: Math.round(high * mult),
  }
}

// ---------------------------------------------------------------------------
// Soft costs, expressed against construction cost
// ---------------------------------------------------------------------------

/**
 * Consultants — architect, structural, civil, hydraulic, certifier, surveyor,
 * energy, geotech. Published guides put this at 4–12% of construction; the
 * point estimate rises with scheme complexity.
 */
export const CONSULTANT_PCT: Record<RateFamily, RateRange> = {
  house: { low: 0.04, point: 0.07, high: 0.1 },
  apartment: { low: 0.06, point: 0.09, high: 0.12 },
  renovation: { low: 0.04, point: 0.06, high: 0.09 },
}

export function consultantPct(devType: DevType): RateRange {
  return CONSULTANT_PCT[familyFor(devType)]
}

/**
 * Project management, development management, QS, insurance, body corporate
 * setup, strata legals. 2–7.5% of construction.
 */
export const PROFESSIONAL_FEE_PCT: RateRange = { low: 0.02, point: 0.04, high: 0.075 }

/**
 * Council DA fees plus infrastructure contributions, per dwelling. Wildly
 * variable — this is the lowest-confidence line in the whole model.
 *
 * This is the national fallback shape only. The figure the engine actually uses
 * comes from the jurisdiction profile, because the mechanisms are not comparable
 * between states: NSW charges s7.11 / s7.12 under the EP&A Act, Victoria can
 * stack GAIC on top of council contributions, Queensland levies infrastructure
 * charges under an LGIP.
 */
export const COUNCIL_CONTRIBUTION_PER_DWELLING: RateRange = {
  low: 8_000,
  point: 28_000,
  high: 75_000,
}

/**
 * Subdivisions attract contributions per lot at the higher end of the same
 * schedule, because a lot carries the trunk infrastructure the dwellings later
 * connect to. Applied to the jurisdiction's per-dwelling range.
 */
export const SUBDIVISION_CONTRIBUTION_UPLIFT = 1.35

// ---------------------------------------------------------------------------
// Acquisition sundries
// ---------------------------------------------------------------------------

/** Conveyancing / legals on purchase. */
export const ACQUISITION_LEGALS = 3_500
/** Due diligence — survey, contract review, planning report, geotech desktop. */
export const ACQUISITION_DUE_DILIGENCE = 5_500
/** Settlement adjustments — rates and land tax apportioned at settlement. */
export const ACQUISITION_SETTLEMENT_ADJ = 5_500

export const ACQUISITION_SUNDRIES =
  ACQUISITION_LEGALS + ACQUISITION_DUE_DILIGENCE + ACQUISITION_SETTLEMENT_ADJ

/** Buyer's agent, when engaged: percentage of purchase price, within a $ band. */
export const BUYERS_AGENT_PCT: RateRange = { low: 0.015, point: 0.02, high: 0.025 }
export const BUYERS_AGENT_MIN = 15_000
export const BUYERS_AGENT_MAX = 40_000

// ---------------------------------------------------------------------------
// Selling costs
// ---------------------------------------------------------------------------

/** Agent commission as a share of gross realisation. */
export const AGENT_COMMISSION_PCT: RateRange = { low: 0.018, point: 0.022, high: 0.028 }
/** Marketing campaign as a share of gross realisation. */
export const MARKETING_PCT: RateRange = { low: 0.008, point: 0.012, high: 0.018 }
/** Vendor legals per dwelling sold. */
export const SELLING_LEGALS_PER_DWELLING = 1_500

// ---------------------------------------------------------------------------
// Holding costs
// ---------------------------------------------------------------------------

/** Council rates, $/year, Sydney metro. */
export const COUNCIL_RATES_PER_YEAR: RateRange = { low: 1_500, point: 3_000, high: 4_500 }
/** Utilities, site insurance and security while you hold, $/year. */
export const UTILITIES_INSURANCE_PER_YEAR: RateRange = { low: 3_000, point: 5_500, high: 9_000 }

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export interface FinanceBand {
  interestRate: number
  loanToCost: number
  /** Establishment fee as a share of the facility limit. */
  establishmentPct: number
  /** Line fee per annum on the facility limit. */
  lineFeePct: number
}

export const FINANCE_BANDS: Record<FinanceProfile, FinanceBand> = {
  cash: { interestRate: 0, loanToCost: 0, establishmentPct: 0, lineFeePct: 0 },
  low_leverage: { interestRate: 0.082, loanToCost: 0.5, establishmentPct: 0.004, lineFeePct: 0.0025 },
  standard: { interestRate: 0.095, loanToCost: 0.65, establishmentPct: 0.005, lineFeePct: 0.0025 },
  high_leverage: { interestRate: 0.115, loanToCost: 0.75, establishmentPct: 0.0075, lineFeePct: 0.004 },
}

/** Owner-occupier mortgage rate, used by the PPR and renovation modes. */
export const OWNER_OCCUPIER_RATE = 0.061
/** Buffer added to the actual rate when testing serviceability. */
export const SERVICEABILITY_BUFFER = 0.03
/** DTI at or above this is the regulator's heightened-risk zone. */
export const DTI_HOT_ZONE = 6.0
/** Share of income a conservative lender will let go to debt service. */
export const MAX_REPAYMENT_TO_INCOME = 0.35
/** Standard owner-occupier loan term, years. */
export const MORTGAGE_TERM_YEARS = 30

/**
 * Indicative LMI premium as a share of the loan, by LVR band. Applies to
 * owner-occupier lending above 80%.
 */
export const LMI_BANDS: { upTo: number; pct: number }[] = [
  { upTo: 0.8, pct: 0 },
  { upTo: 0.85, pct: 0.0105 },
  { upTo: 0.9, pct: 0.019 },
  { upTo: 0.95, pct: 0.031 },
  { upTo: 1.0, pct: 0.039 },
]

/** Conventional share of a home's value a lender will release as equity. */
export const RELEASABLE_EQUITY_LVR = 0.8

// ---------------------------------------------------------------------------
// Contingency & overrun
// ---------------------------------------------------------------------------

/**
 * Contingency by project stage, applied to construction + planning & design +
 * professional fees. Earlier stages carry more because more is unknown.
 */
export const CONTINGENCY_BY_STAGE: Record<ProjectStage, number> = {
  early_feasibility: 0.1,
  concept_design: 0.08,
  da_planning: 0.065,
  tender: 0.05,
  builder_quoted: 0.035,
}

/** Default overrun buffer. Distinct from contingency — see the UI copy. */
export const DEFAULT_OVERRUN_BUFFER = 0.05

/** Builder's margin added as an explicit line on a cost-plus contract. */
export const COST_PLUS_MARGIN = 0.18

// ---------------------------------------------------------------------------
// Construction trade split (used to seed the bill of quantities)
// ---------------------------------------------------------------------------

export const TRADE_SPLIT: Record<TradeKey, number> = {
  preliminaries: 0.08,
  substructure: 0.08,
  superstructure: 0.18,
  envelope: 0.14,
  internal_finishes: 0.1,
  fitout: 0.12,
  services: 0.12,
  external_works: 0.05,
  builder_margin: 0.13,
}

export const TRADE_ORDER: TradeKey[] = [
  'preliminaries',
  'substructure',
  'superstructure',
  'envelope',
  'internal_finishes',
  'fitout',
  'services',
  'external_works',
  'builder_margin',
]

// ---------------------------------------------------------------------------
// How sale price responds to dwelling size
// ---------------------------------------------------------------------------

/**
 * Elasticity of sale price to dwelling floor area.
 *
 *     price = currentPrice × (sqm / currentSqm) ^ elasticity
 *
 * A dwelling's price is not proportional to its floor area. Part of the value
 * is fixed regardless of size — the land share, the kitchen, the bathrooms, the
 * services, and the simple floor price any dwelling commands — so bigger
 * dwellings sell for more in total but *less per square metre*.
 *
 * The exponent captures that directly, and the two extremes are both wrong:
 *
 *   0.0  price is identical whatever the size (implies a 100 m² unit fetches
 *        the same as a 380 m² house — nonsense, and it makes tiny dwellings
 *        look wildly profitable)
 *   1.0  price is strictly proportional to area, i.e. $/m² never varies with
 *        size (ignores the fixed component, so it understates small dwellings)
 *   0.75 published hedonic studies of Australian residential put the exponent
 *        in the 0.6–0.85 band; 0.75 sits mid-range
 *
 * Only used where the model varies dwelling size on the client's behalf — the
 * scale recommender. Wherever the client states both a size and a price, we use
 * their numbers untouched.
 */
export const SIZE_PRICE_ELASTICITY = 0.75

/** Apply the elasticity. Falls back safely on a zero or missing base size. */
export function priceForSize(
  currentPrice: number,
  currentSqm: number,
  targetSqm: number,
  elasticity: number = SIZE_PRICE_ELASTICITY
): number {
  if (currentSqm <= 0 || targetSqm <= 0 || currentPrice <= 0) return currentPrice
  return currentPrice * Math.pow(targetSqm / currentSqm, elasticity)
}

// ---------------------------------------------------------------------------
// Scenario definitions
// ---------------------------------------------------------------------------

export interface ScenarioShift {
  salePricePct: number
  buildCostPct: number
  /** Percentage points added to the overrun buffer. */
  overrunPp: number
  durationPct: number
}

export const SCENARIO_SHIFTS: Record<'conservative' | 'base' | 'optimistic', ScenarioShift> = {
  conservative: { salePricePct: -0.05, buildCostPct: 0.075, overrunPp: 0.05, durationPct: 0.2 },
  base: { salePricePct: 0, buildCostPct: 0, overrunPp: 0, durationPct: 0 },
  optimistic: { salePricePct: 0.05, buildCostPct: -0.05, overrunPp: -0.02, durationPct: -0.1 },
}

// ---------------------------------------------------------------------------
// Hold-mode assumptions
// ---------------------------------------------------------------------------

/** Share of gross rent lost to management, vacancy, repairs and insurance. */
export const RENTAL_OUTGOINGS_PCT = 0.25
/** Default capitalisation rate for a completed residential holding. */
export const DEFAULT_EXIT_CAP_RATE = 0.042
/** Investment loan rate for the stabilised hold position. */
export const INVESTMENT_LOAN_RATE = 0.066

// ---------------------------------------------------------------------------
// Renovation-mode assumptions
// ---------------------------------------------------------------------------

/**
 * Once build cost passes this share of post-renovation value, knocking down and
 * rebuilding is usually cheaper and produces a more sellable house.
 */
export const REBUILD_CROSSOVER_RATIO = 0.5
/** Demolition and service disconnection on a knock-down rebuild. */
export const DEMOLITION_COST: RateRange = { low: 25_000, point: 42_000, high: 75_000 }
