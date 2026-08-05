/**
 * Development Feasibility Assessment — shared types.
 *
 * This module is deliberately free of any Next.js / React imports so the whole
 * engine can be unit-tested, run on the server, or run in the browser.
 */

// ---------------------------------------------------------------------------
// Enumerations (all user-facing, all with labels in ./labels.ts)
// ---------------------------------------------------------------------------

/** What the client is actually trying to do with the site. Drives which verdict we show. */
export type DealMode =
  | 'develop_to_sell'
  | 'develop_to_hold'
  | 'buy_to_hold'
  | 'ppr'
  | 'renovate'

export type DevType =
  | 'duplex'
  | 'townhouse'
  | 'apartment'
  | 'house_land'
  | 'subdivision'
  | 'renovation'
  | 'mixed_use'
  | 'commercial'

export type QualityTier =
  | 'budget'
  | 'standard'
  | 'medium'
  | 'high_end'
  | 'luxury'
  | 'ultra_luxury'

export type SiteDifficulty = 'easy' | 'normal' | 'difficult' | 'very_difficult'

export type FinanceProfile = 'cash' | 'low_leverage' | 'standard' | 'high_leverage'

/** Earlier stages carry more contingency, because more is unknown. */
export type ProjectStage =
  | 'early_feasibility'
  | 'concept_design'
  | 'da_planning'
  | 'tender'
  | 'builder_quoted'

export type BuilderContract = 'fixed_price' | 'cost_plus'

export type TitleType = 'unknown' | 'torrens' | 'strata'

/** National Construction Code building classification. */
export type NccClass = 'class_1a' | 'class_2' | 'class_9c' | 'other'

export type GstTreatment = 'margin_scheme' | 'none'

export type Jurisdiction = 'NSW' | 'VIC' | 'QLD' | 'SA' | 'WA' | 'TAS' | 'ACT' | 'NT'

/** Knock-down-rebuild vs a straight purchase changes who pays acquisition duty. */
export type PprSubMode = 'buy_and_build' | 'knock_down_rebuild' | 'buy_existing'

// ---------------------------------------------------------------------------
// Trust / traceability primitives
// ---------------------------------------------------------------------------

/**
 * How much weight a client should put on a number.
 *  - high      : statutory schedule, or a figure the user pinned themselves
 *  - medium    : published rate library, triangulated from cost guides
 *  - low       : genuinely variable by council / lender — must be verified
 */
export type Confidence = 'high' | 'medium' | 'low'

/** One step in the "show me how you got that" chain. */
export interface TraceStep {
  label: string
  /** Human-readable arithmetic, e.g. "880 m² × $3,045/m²". */
  detail?: string
  value?: number
  /** Rendered as currency, percent, area, rate or a plain count. */
  format?: 'money' | 'percent' | 'area' | 'rate' | 'number' | 'months'
}

/** A number plus everything a client needs to trust or challenge it. */
export interface Traced {
  value: number
  confidence: Confidence
  /** True when the user pinned this value in Pro Mode. */
  overridden: boolean
  /** Plausible range, where the library publishes one. */
  range?: { low: number; high: number }
  steps: TraceStep[]
  /** Key into SOURCES for the citation shown under the number. */
  sourceKey?: string
  /** Shown when confidence is low — what to do about it. */
  verifyWith?: string
}

// ---------------------------------------------------------------------------
// Cost buckets
// ---------------------------------------------------------------------------

export type BucketKey =
  | 'acquisition'
  | 'planning_design'
  | 'construction'
  | 'professional_fees'
  | 'finance'
  | 'holding'
  | 'marketing_selling'
  | 'contingency'
  | 'overrun'
  | 'taxes_duties'

export interface CostBucket extends Traced {
  key: BucketKey
  label: string
  /** Short line the UI shows under the label. */
  description: string
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/**
 * Everything the wizard collects. Every field has a sane default in
 * `defaultFeasibilityInputs`, so a blank form still produces a full answer —
 * that is the whole point of Quick Mode.
 */
export interface FeasibilityInputs {
  // --- Step 1: what are we doing ---
  jurisdiction: Jurisdiction
  mode: DealMode
  pprSubMode: PprSubMode
  projectName: string
  suburbOrAddress: string

  // --- Step 2: the site & the scheme ---
  devType: DevType
  /** Dwellings / lots / units. */
  yield: number
  /** Average gross floor area per dwelling, m². */
  avgDwellingSqm: number
  /** Land parcel size, m². */
  siteAreaSqm: number
  purchasePrice: number
  /** Expected gross sale price per dwelling. */
  salePricePerDwelling: number

  // --- Step 3: quality & risk ---
  qualityTier: QualityTier
  siteDifficulty: SiteDifficulty
  financeProfile: FinanceProfile
  projectStage: ProjectStage
  /** Overrun buffer as a decimal, e.g. 0.05. Separate from contingency. */
  overrunBuffer: number

  // --- Step 4: builder, agent, rates & tax ---
  builderContract: BuilderContract
  buyersAgentEngaged: boolean
  /** Council rates, $ per year. */
  councilRatesPerYear: number
  /** Unimproved land value for land tax. Falls back to purchasePrice. */
  landValueUv: number | null
  landTaxExempt: boolean
  gstTreatment: GstTreatment
  titleType: TitleType
  /** null = auto-classify from titleType + yield. */
  nccClassOverride: NccClass | null
  /** Total project duration in months. */
  durationMonths: number
  /**
   * Share of gross realisation locked in as presales, as a decimal.
   *
   * Presales that settle before the end of the program repay debt earlier,
   * which cuts both peak debt and total interest — and lenders price the
   * facility off presale coverage in the first place.
   */
  presalesShare: number
  /** Month those presales settle. Must be before the final month to count. */
  presalesSettleMonth: number
  /** Target margin on cost, decimal. Drives the feasibility verdict. */
  targetMargin: number
  /**
   * How strongly sale price responds to dwelling size, as an exponent.
   *
   * Only used by the scale recommender, which is the one place the model varies
   * dwelling size on the client's behalf. 0 means price is unaffected by size,
   * 1 means strictly proportional to it; residential sits around 0.75. See
   * SIZE_PRICE_ELASTICITY.
   */
  sizePriceElasticity: number

  // --- Mode-specific: PPR / knock-down rebuild ---
  currentHomeValue: number
  outstandingMortgage: number
  householdIncome: number
  existingOtherDebt: number

  // --- Mode-specific: renovate / extend ---
  preRenoValue: number
  postRenoValue: number
  /** Suburb median for the proposed bed-count config — the value ceiling. */
  suburbMedianForConfig: number
  renovationScopeSqm: number

  // --- Mode-specific: hold (develop-to-hold / buy-to-hold) ---
  /** Expected gross rent per dwelling per week. */
  weeklyRentPerDwelling: number
  /** Assumed capitalisation rate on completion, decimal. */
  exitCapRate: number

  // --- Pro Mode overrides. null / undefined = use the Quick figure. ---
  overrides: FeasibilityOverrides
  /** Trade-level construction breakdown. Only active once touched. */
  boq: BoqState
  /** Assemblies the user has applied. */
  appliedAssemblies: AppliedAssembly[]
}

export interface FeasibilityOverrides {
  // Underlying rates
  constructionRatePerSqm: number | null
  interestRate: number | null
  loanToCost: number | null
  // Cost buckets
  acquisition: number | null
  planning_design: number | null
  construction: number | null
  professional_fees: number | null
  finance: number | null
  holding: number | null
  marketing_selling: number | null
  contingency: number | null
  taxes_duties: number | null
}

// ---------------------------------------------------------------------------
// Bill of quantities
// ---------------------------------------------------------------------------

export type TradeKey =
  | 'preliminaries'
  | 'substructure'
  | 'superstructure'
  | 'envelope'
  | 'internal_finishes'
  | 'fitout'
  | 'services'
  | 'external_works'
  | 'builder_margin'

export interface BoqLine {
  id: string
  trade: TradeKey
  label: string
  qty: number
  unit: string
  rate: number
  /** Waste allowance as a decimal, e.g. 0.05. */
  waste: number
  /** True when the line came from the assemblies catalogue. */
  fromAssembly?: boolean
}

export interface BoqState {
  /** False until the user edits a cell — while false the Quick number rules. */
  touched: boolean
  lines: BoqLine[]
  /** The construction figure the lines were seeded from, for Δ reporting. */
  seedTotal: number
}

export interface AssemblySubItem {
  label: string
  qty: number
  unit: string
  rate: number
  waste: number
}

export interface Assembly {
  key: string
  name: string
  description: string
  trade: TradeKey
  /** What one unit of this assembly is, e.g. "bathroom", "m² of roof". */
  driver: string
  subItems: AssemblySubItem[]
  /** Minimum order quantity, where it applies. */
  moq?: number
}

export interface AppliedAssembly {
  id: string
  assemblyKey: string
  driverQty: number
  poppedIntoBoq: boolean
}

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface MonthlyCashflowRow {
  month: number
  /** Costs incurred this month, GST-exclusive of the sale-side GST. */
  costs: number
  /** Sales settling this month (gross). */
  revenue: number
  equityDrawn: number
  debtDrawn: number
  debtRepaid: number
  interest: number
  fees: number
  debtBalance: number
  equityBalance: number
  /** Net cash to/from the equity holder, used for IRR. */
  equityCashflow: number
}

export interface CashflowSummary {
  rows: MonthlyCashflowRow[]
  peakDebt: number
  peakDebtMonth: number
  totalInterest: number
  totalFees: number
  equityIn: number
  equityOut: number
  /** Annualised IRR on the equity cashflow. null when it cannot be solved. */
  irr: number | null
  /** Simple equity multiple, equityOut / equityIn. */
  equityMultiple: number | null
}

export type Verdict = 'feasible' | 'marginal' | 'not_feasible'

export interface InsightItem {
  severity: 'warning' | 'positive' | 'info' | 'critical'
  title: string
  category: string
  body: string
  nextStep?: string
}

export interface NarrativeSection {
  heading: string
  bullets: string[]
}

export interface ScenarioResult {
  key: 'conservative' | 'base' | 'optimistic'
  label: string
  verdict: Verdict
  marginOnCost: number
  netProfit: number
  totalDevelopmentCost: number
  deltaVsBasePp: number | null
}

export interface SensitivityRow {
  lever: string
  /** Margin on cost at −10%, −5%, base, +5%, +10% of the lever. */
  cells: { shift: number; marginOnCost: number; meets: 'pass' | 'marginal' | 'fail' }[]
}

export interface ScaleCell {
  yield: number
  dwellingSqm: number
  marginOnCost: number
  outcome: 'pass' | 'marginal' | 'fail'
  /** Sale price assumed for this size, holding $/m² constant. */
  salePricePerDwelling: number
}

export interface ScaleRecommendation {
  grid: ScaleCell[]
  current: ScaleCell | null
  /** Smallest configuration that still meets the target margin. */
  smallestPassing: ScaleCell | null
  headroomPp: number
}

/** Mode-specific verdict blocks. Only the one matching inputs.mode is populated. */
export interface PprResult {
  releasableEquity: number
  buildCost: number
  cashShortfall: number
  loanRequired: number
  completedValue: number
  lvr: number
  lmiPayable: number
  monthlyRepayment: number
  dti: number
  serviceable: boolean
  /** Stamp duty saved by rebuilding rather than buying. */
  dutySaved: number
}

export interface RenovationResult {
  spend: number
  valueBefore: number
  valueAfter: number
  equityGain: number
  /** True when the finished value pushes past the suburb median for the config. */
  aboveValueCeiling: boolean
  ceilingHeadroom: number
  /** Build cost as a share of post-reno value. Past ~0.5, rebuilding often wins. */
  crossoverRatio: number
  rebuildLikelyBetter: boolean
}

export interface HoldResult {
  grossAnnualRent: number
  netAnnualRent: number
  completedValue: number
  yieldOnCost: number
  cashOnCash: number
  /** Debt service cover ratio on the stabilised position. */
  dscr: number
  annualDebtService: number
}

export interface ClassificationResult {
  nccClass: NccClass
  /** True when the class was inferred rather than set explicitly. */
  inferred: boolean
  dbpApplies: boolean
  dbpCostUplift: number
  dbpProgramMonths: number
  requiredPractitioners: string[]
  reasoning: string
}

export interface StatutoryBreakdown {
  stampDuty: Traced
  landTaxPerYear: Traced
  landTaxOverProject: Traced
  hbcfPremium: Traced
  gst: Traced
  councilContributions: Traced
}

export interface FeasibilityResults {
  // Headline
  verdict: Verdict
  verdictReason: string
  grossRevenue: number
  totalDevelopmentCost: number
  netProfit: number
  marginOnCost: number
  marginOnRevenue: number
  returnOnEquity: number
  requiredEquity: number
  peakDebt: number
  peakDebtMonth: number

  // Break-even & land
  breakEvenPerDwelling: number
  /** How far sale prices can fall before profit hits zero, decimal. */
  priceDropHeadroom: number
  /** True break-even, re-solving GST and selling costs. */
  breakEvenPerDwellingAdjusted: number
  maxSupportablePurchasePrice: number
  landHeadroom: number

  // Per-unit economics
  profitPerDwelling: number
  costPerDwelling: number
  totalGfaSqm: number
  constructionRatePerSqm: Traced

  // Detail
  buckets: CostBucket[]
  statutory: StatutoryBreakdown
  classification: ClassificationResult
  cashflow: CashflowSummary
  insights: InsightItem[]
  narrative: NarrativeSection[]

  // Mode-specific
  ppr: PprResult | null
  renovation: RenovationResult | null
  hold: HoldResult | null
}
