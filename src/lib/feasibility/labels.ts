/**
 * Every enum value gets a plain-English label and, where it helps, a one-line
 * hint. The wizard reads these directly so the copy lives in one place.
 */

import type {
  BuilderContract,
  DealMode,
  DevType,
  FinanceProfile,
  Jurisdiction,
  NccClass,
  PprSubMode,
  ProjectStage,
  QualityTier,
  SiteDifficulty,
  TitleType,
  TradeKey,
  Confidence,
  BucketKey,
} from './types'

export interface Option<T> {
  value: T
  label: string
  hint?: string
}

export const DEAL_MODES: Option<DealMode>[] = [
  {
    value: 'develop_to_sell',
    label: 'Develop to sell',
    hint: 'Build, sell, take the profit',
  },
  {
    value: 'develop_to_hold',
    label: 'Develop to hold',
    hint: 'Build, then rent long-term',
  },
  {
    value: 'buy_to_hold',
    label: 'Buy existing to hold',
    hint: 'Investment property — no construction',
  },
  {
    value: 'ppr',
    label: 'Live in it (PPR)',
    hint: 'Owner-occupier — buy, build, or rebuild',
  },
  {
    value: 'renovate',
    label: 'Renovate / extend',
    hint: 'Will my reno add more value than it costs?',
  },
]

export const PPR_SUB_MODES: Option<PprSubMode>[] = [
  { value: 'buy_and_build', label: 'Buy land and build', hint: 'You pay acquisition duty' },
  {
    value: 'knock_down_rebuild',
    label: 'Knock-down rebuild',
    hint: 'You already own the land — no acquisition duty',
  },
  { value: 'buy_existing', label: 'Buy an existing home', hint: 'No construction' },
]

export const DEV_TYPES: Option<DevType>[] = [
  { value: 'duplex', label: 'Duplex' },
  { value: 'townhouse', label: 'Townhouse' },
  { value: 'apartment', label: 'Apartment' },
  { value: 'house_land', label: 'House & land' },
  { value: 'subdivision', label: 'Subdivision' },
  { value: 'renovation', label: 'Renovation / extension' },
  { value: 'mixed_use', label: 'Mixed-use' },
  { value: 'commercial', label: 'Commercial' },
]

export const QUALITY_TIERS: Option<QualityTier>[] = [
  { value: 'budget', label: 'Budget', hint: 'Project-home spec, minimal customisation' },
  { value: 'standard', label: 'Standard', hint: 'Volume-builder spec — the usual starting point' },
  { value: 'medium', label: 'Medium', hint: 'Upgraded finishes, some custom joinery' },
  { value: 'high_end', label: 'High-end', hint: 'Architect-designed, premium finishes throughout' },
  { value: 'luxury', label: 'Luxury', hint: 'Bespoke everything, imported stone and joinery' },
  { value: 'ultra_luxury', label: 'Ultra-luxury', hint: 'No budget ceiling' },
]

export const SITE_DIFFICULTIES: Option<SiteDifficulty>[] = [
  { value: 'easy', label: 'Easy site', hint: 'Flat, clear, good access, services at the boundary' },
  { value: 'normal', label: 'Normal', hint: 'Minor slope or access constraint' },
  {
    value: 'difficult',
    label: 'Difficult',
    hint: 'Steep, rock, poor access, or significant tree protection',
  },
  {
    value: 'very_difficult',
    label: 'Very difficult',
    hint: 'Severe slope, piling, flood or bushfire controls, crane-only access',
  },
]

export const FINANCE_PROFILES: Option<FinanceProfile>[] = [
  { value: 'cash', label: 'Cash funded (no debt)', hint: 'No interest, no line fees' },
  { value: 'low_leverage', label: 'Low leverage', hint: 'Around 50% loan-to-cost' },
  { value: 'standard', label: 'Standard development finance', hint: 'Around 65% loan-to-cost' },
  { value: 'high_leverage', label: 'High leverage', hint: 'Around 75% loan-to-cost, priced higher' },
]

export const PROJECT_STAGES: Option<ProjectStage>[] = [
  {
    value: 'early_feasibility',
    label: 'Early feasibility',
    hint: 'Back of the envelope — carries the most contingency',
  },
  { value: 'concept_design', label: 'Concept design', hint: 'Sketch plans, no DA lodged' },
  { value: 'da_planning', label: 'DA / planning', hint: 'Lodged or approved' },
  { value: 'tender', label: 'Tender', hint: 'Documented and out to price' },
  { value: 'builder_quoted', label: 'Builder quoted', hint: 'Signed or near-signed price' },
]

export const BUILDER_CONTRACTS: Option<BuilderContract>[] = [
  {
    value: 'fixed_price',
    label: 'Fixed-price',
    hint: "Builder's margin is already inside the $/m² rate",
  },
  {
    value: 'cost_plus',
    label: 'Cost-plus',
    hint: 'Margin is added as a separate line (18% default)',
  },
]

export const TITLE_TYPES: Option<TitleType>[] = [
  { value: 'unknown', label: 'Unknown / not yet decided', hint: 'We will infer the class' },
  { value: 'torrens', label: 'Torrens', hint: 'Each dwelling on its own lot' },
  { value: 'strata', label: 'Strata', hint: 'Units share a building or common property' },
]

export const NCC_CLASSES: Option<NccClass>[] = [
  { value: 'class_1a', label: 'Class 1a — single dwelling' },
  { value: 'class_2', label: 'Class 2 — multi-unit (DBP regulated)' },
  { value: 'class_9c', label: 'Class 9c — aged care (DBP regulated)' },
  { value: 'other', label: 'Other / non-residential' },
]

export const JURISDICTIONS: Option<Jurisdiction>[] = [
  { value: 'NSW', label: 'New South Wales' },
  { value: 'VIC', label: 'Victoria — coming soon' },
  { value: 'QLD', label: 'Queensland — coming soon' },
  { value: 'SA', label: 'South Australia — coming soon' },
  { value: 'WA', label: 'Western Australia — coming soon' },
  { value: 'TAS', label: 'Tasmania — coming soon' },
  { value: 'ACT', label: 'Australian Capital Territory — coming soon' },
  { value: 'NT', label: 'Northern Territory — coming soon' },
]

/** Only NSW has a complete statutory + rate library today. */
export const LIVE_JURISDICTIONS: Jurisdiction[] = ['NSW']

export const TRADE_LABELS: Record<TradeKey, string> = {
  preliminaries: 'Preliminaries & site',
  substructure: 'Substructure',
  superstructure: 'Superstructure & frame',
  envelope: 'External envelope',
  internal_finishes: 'Internal finishes',
  fitout: 'Fitout (kitchen, bathroom, joinery)',
  services: 'Services (elec, plumb, HVAC, fire)',
  external_works: 'External works & landscaping',
  builder_margin: 'Builder overhead & margin',
}

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  high: 'High confidence',
  medium: 'Medium confidence',
  low: 'Low confidence',
}

export const CONFIDENCE_BLURBS: Record<Confidence, string> = {
  high: 'From a published statutory schedule, or a figure you pinned yourself.',
  medium: 'From our rate library, triangulated from published cost guides.',
  low: 'Genuinely variable by council, lender or site — verify this one.',
}

export const BUCKET_LABELS: Record<BucketKey, { label: string; description: string }> = {
  acquisition: {
    label: 'Acquisition',
    description: 'Purchase price, stamp duty, legals, due diligence, settlement adjustments',
  },
  planning_design: {
    label: 'Planning & design',
    description: 'Architect, engineers, certifier, council contributions, DBP compliance',
  },
  construction: {
    label: 'Construction',
    description: 'Builder contract — $/m² × gross floor area, adjusted for site difficulty',
  },
  professional_fees: {
    label: 'Professional fees',
    description: 'Project management, development management, QS, insurance, strata setup',
  },
  finance: {
    label: 'Finance',
    description: 'Interest, line fees and establishment fees, capitalised onto the loan',
  },
  holding: {
    label: 'Holding costs',
    description: 'Council rates, land tax, utilities and insurance while you hold the site',
  },
  marketing_selling: {
    label: 'Marketing & selling',
    description: 'Agent commission, marketing campaign, legals on sale',
  },
  contingency: {
    label: 'Contingency',
    description: 'Unknowns you have not priced yet — shrinks as the project matures',
  },
  overrun: {
    label: 'Overrun buffer',
    description: 'Things you HAVE priced that slip anyway — weather, scope creep, late deliveries',
  },
  taxes_duties: {
    label: 'Taxes & duties',
    description: 'GST on sale under the margin scheme',
  },
}

export function labelFor<T>(options: Option<T>[], value: T): string {
  return options.find((o) => o.value === value)?.label ?? String(value)
}
