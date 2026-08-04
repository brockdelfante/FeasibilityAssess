/**
 * The feasibility engine.
 *
 * One engine serves Quick Mode and Pro Mode. Quick Mode simply leaves every
 * override null, so the rate library fills the gaps — which means an override
 * the client sets in Pro Mode flows through every headline metric, scenario,
 * sensitivity row and cashflow month without any duplicate logic.
 *
 * Finance is circular: interest depends on the facility, the facility depends
 * on total cost, and total cost includes interest. We resolve that by iterating
 * to convergence rather than approximating.
 */

import { boqTotal } from './boq'
import { runCashflow, type CashflowRequest } from './cashflow'
import { classify } from './classification'
import { buildInsights } from './insights'
import { BUCKET_LABELS } from './labels'
import { buildNarrative } from './narrative'
import * as R from './rates'
import {
  gstMarginSchemeAmount,
  gstOnSale,
  nswHbcf,
  nswLandTax,
  nswLandTaxAmount,
  nswStampDuty,
  nswStampDutyAmount,
} from './statutory'
import { safeDiv, traced, withOverride } from './trace'
import { deriveHold } from './modes/hold'
import { derivePpr } from './modes/ppr'
import { deriveRenovation } from './modes/renovation'
import type {
  BucketKey,
  CashflowSummary,
  CostBucket,
  DealMode,
  FeasibilityInputs,
  FeasibilityResults,
  Traced,
  Verdict,
} from './types'

// ---------------------------------------------------------------------------
// Defaults — a blank form must still produce a complete answer
// ---------------------------------------------------------------------------

export const defaultFeasibilityInputs: FeasibilityInputs = {
  jurisdiction: 'NSW',
  mode: 'develop_to_sell',
  pprSubMode: 'buy_and_build',
  projectName: '',
  suburbOrAddress: '',

  devType: 'townhouse',
  yield: 4,
  avgDwellingSqm: 220,
  siteAreaSqm: 900,
  purchasePrice: 2_000_000,
  salePricePerDwelling: 2_400_000,

  qualityTier: 'standard',
  siteDifficulty: 'normal',
  financeProfile: 'standard',
  projectStage: 'early_feasibility',
  overrunBuffer: R.DEFAULT_OVERRUN_BUFFER,

  builderContract: 'fixed_price',
  buyersAgentEngaged: false,
  councilRatesPerYear: R.COUNCIL_RATES_PER_YEAR.point,
  landValueUv: null,
  landTaxExempt: false,
  gstTreatment: 'margin_scheme',
  titleType: 'unknown',
  nccClassOverride: null,
  durationMonths: 22,
  presalesShare: 0,
  presalesSettleMonth: 0,
  targetMargin: 0.18,

  currentHomeValue: 0,
  outstandingMortgage: 0,
  householdIncome: 0,
  existingOtherDebt: 0,

  preRenoValue: 0,
  postRenoValue: 0,
  suburbMedianForConfig: 0,
  renovationScopeSqm: 0,

  weeklyRentPerDwelling: 0,
  exitCapRate: R.DEFAULT_EXIT_CAP_RATE,

  overrides: {
    constructionRatePerSqm: null,
    interestRate: null,
    loanToCost: null,
    acquisition: null,
    planning_design: null,
    construction: null,
    professional_fees: null,
    finance: null,
    holding: null,
    marketing_selling: null,
    contingency: null,
    taxes_duties: null,
  },
  boq: { touched: false, lines: [], seedTotal: 0 },
  appliedAssemblies: [],
}

// ---------------------------------------------------------------------------
// Mode helpers
// ---------------------------------------------------------------------------

/** Only develop-to-sell actually sells on completion. */
export function sellsOnCompletion(mode: DealMode): boolean {
  return mode === 'develop_to_sell'
}

/** Buy-to-hold has no building work. */
export function hasConstruction(mode: DealMode): boolean {
  return mode !== 'buy_to_hold'
}

/** Owner-occupiers and landlords do not remit GST on a sale that never happens. */
export function remitsGst(mode: DealMode, gstTreatment: string): boolean {
  return sellsOnCompletion(mode) && gstTreatment === 'margin_scheme'
}

// ---------------------------------------------------------------------------
// Core computation — cheap enough to run inside solvers and grids
// ---------------------------------------------------------------------------

export interface CoreResult {
  grossRevenue: number
  totalDevelopmentCost: number
  netProfit: number
  marginOnCost: number
  marginOnRevenue: number
  amounts: Record<BucketKey, number>
  constructionRate: number
  totalGfaSqm: number
  peakDebt: number
  peakDebtMonth: number
  requiredEquity: number
  interest: number
  fees: number
  effectiveDurationMonths: number
  dbpProgramMonths: number
  irr: number | null
  equityIn: number
  equityOut: number
  /** The full monthly cashflow, kept so the UI can show the breakdown. */
  cashflow: CashflowSummary
}

/**
 * The whole cost stack and headline profit, without the narrative layers.
 * Solvers, the sensitivity table and the scale grid all call this directly.
 */
export function computeCore(inputs: FeasibilityInputs): CoreResult {
  const cls = classify(inputs.devType, inputs.titleType, inputs.yield, inputs.nccClassOverride)

  const totalGfaSqm =
    inputs.devType === 'renovation' || inputs.mode === 'renovate'
      ? inputs.renovationScopeSqm || inputs.yield * inputs.avgDwellingSqm
      : inputs.yield * inputs.avgDwellingSqm

  // --- construction ---
  const rateRange = R.constructionRate(inputs.devType, inputs.qualityTier, inputs.siteDifficulty)
  const constructionRate = inputs.overrides.constructionRatePerSqm ?? rateRange.point

  let construction = 0
  if (hasConstruction(inputs.mode)) {
    if (inputs.devType === 'subdivision') {
      construction = inputs.yield * R.SUBDIVISION_CIVILS_PER_LOT.point
    } else {
      construction = totalGfaSqm * constructionRate
    }
    // A knock-down rebuild has to clear the site first.
    if (inputs.mode === 'ppr' && inputs.pprSubMode === 'knock_down_rebuild') {
      construction += R.DEMOLITION_COST.point
    }
    // Fixed-price rates already carry the builder's margin; cost-plus does not.
    if (inputs.builderContract === 'cost_plus') {
      construction *= 1 + R.COST_PLUS_MARGIN
    }
    // A touched bill of quantities replaces the rate-library figure entirely.
    if (inputs.boq.touched && inputs.boq.lines.length > 0) {
      construction = boqTotal(inputs.boq.lines)
    }
  }
  construction = inputs.overrides.construction ?? construction

  // --- revenue ---
  const grossRevenue = computeGrossRevenue(inputs, construction)

  // --- acquisition ---
  const buysLand = !(inputs.mode === 'ppr' && inputs.pprSubMode === 'knock_down_rebuild')
  const purchasePrice = buysLand ? inputs.purchasePrice : 0
  const duty = buysLand ? nswStampDutyAmount(purchasePrice) : 0
  let buyersAgent = 0
  if (inputs.buyersAgentEngaged && buysLand) {
    buyersAgent = Math.min(
      R.BUYERS_AGENT_MAX,
      Math.max(R.BUYERS_AGENT_MIN, purchasePrice * R.BUYERS_AGENT_PCT.point)
    )
  }
  const acquisition =
    inputs.overrides.acquisition ??
    purchasePrice + duty + (buysLand ? R.ACQUISITION_SUNDRIES : 0) + buyersAgent

  // --- planning & design ---
  const consultants = construction * R.consultantPct(inputs.devType).point
  const contributions =
    inputs.devType === 'subdivision'
      ? inputs.yield * R.SUBDIVISION_CONTRIBUTION_PER_LOT.point
      : hasConstruction(inputs.mode)
        ? inputs.yield * R.COUNCIL_CONTRIBUTION_PER_DWELLING.point
        : 0
  const planningDesign =
    inputs.overrides.planning_design ?? consultants + contributions + cls.dbpCostUplift

  // --- professional fees (includes HBCF, which is an insurance premium) ---
  const isResidentialBuild =
    hasConstruction(inputs.mode) &&
    inputs.devType !== 'subdivision' &&
    inputs.devType !== 'commercial'
  const hbcf = isResidentialBuild && construction > 20_000 ? construction * 0.007 : 0
  const professionalFees =
    inputs.overrides.professional_fees ?? construction * R.PROFESSIONAL_FEE_PCT.point + hbcf

  // --- program length: the DBP process adds real months ---
  const effectiveDurationMonths = Math.max(1, inputs.durationMonths + cls.dbpProgramMonths)

  // --- holding ---
  const landValue = inputs.landValueUv ?? inputs.purchasePrice
  const landTaxPerYear = nswLandTaxAmount(landValue, inputs.landTaxExempt || inputs.mode === 'ppr')
  const holdingPerYear =
    landTaxPerYear + inputs.councilRatesPerYear + R.UTILITIES_INSURANCE_PER_YEAR.point
  const holding = inputs.overrides.holding ?? holdingPerYear * (effectiveDurationMonths / 12)

  // --- marketing & selling ---
  const marketingSelling =
    inputs.overrides.marketing_selling ??
    (sellsOnCompletion(inputs.mode)
      ? grossRevenue * (R.AGENT_COMMISSION_PCT.point + R.MARKETING_PCT.point) +
        inputs.yield * R.SELLING_LEGALS_PER_DWELLING
      : 0)

  // --- contingency & overrun ---
  const contingencyBase = construction + planningDesign + professionalFees
  const contingency =
    inputs.overrides.contingency ?? contingencyBase * R.CONTINGENCY_BY_STAGE[inputs.projectStage]
  const overrun = (contingencyBase + contingency) * Math.max(0, inputs.overrunBuffer)

  // --- GST ---
  const gst = remitsGst(inputs.mode, inputs.gstTreatment)
    ? gstMarginSchemeAmount(grossRevenue, acquisition)
    : 0
  const taxesDuties = inputs.overrides.taxes_duties ?? gst

  // --- finance: iterate, because the facility depends on total cost ---
  const band = R.FINANCE_BANDS[inputs.financeProfile]
  const interestRate = inputs.overrides.interestRate ?? band.interestRate
  const loanToCost = inputs.overrides.loanToCost ?? band.loanToCost

  const nonFinance =
    acquisition +
    planningDesign +
    construction +
    professionalFees +
    holding +
    marketingSelling +
    contingency +
    overrun +
    taxesDuties

  const buildCashflowRequest = (financeAllowance: number): CashflowRequest => ({
    durationMonths: effectiveDurationMonths,
    acquisition,
    construction,
    planningDesign,
    professionalFees,
    holding,
    marketingSelling,
    contingency,
    overrun,
    gst: taxesDuties,
    grossRevenue,
    // Only a scheme that actually sells can have presales.
    presalesShare: sellsOnCompletion(inputs.mode) ? inputs.presalesShare : 0,
    presalesSettleMonth: inputs.presalesSettleMonth || undefined,
    interestRate,
    loanToCost,
    establishmentPct: band.establishmentPct,
    lineFeePct: band.lineFeePct,
    financeAllowance,
    preConstructionMonths: Math.min(
      Math.max(1, Math.round(effectiveDurationMonths * 0.25)),
      Math.max(1, effectiveDurationMonths - 1)
    ),
  })

  // Interest is circular: it depends on the facility, the facility is sized
  // against total cost, and total cost includes the interest. Iterate until the
  // correction is under a dollar — in practice that takes two or three passes,
  // because each pass shrinks the error by roughly the interest rate.
  let finance = inputs.overrides.finance ?? 0
  let cashflow = runCashflow(buildCashflowRequest(finance))

  if (inputs.overrides.finance === null) {
    for (let pass = 0; pass < 6; pass++) {
      const next = cashflow.totalInterest + cashflow.totalFees
      const converged = Math.abs(next - finance) < 1
      finance = next
      cashflow = runCashflow(buildCashflowRequest(finance))
      if (converged) break
    }
    finance = cashflow.totalInterest + cashflow.totalFees
  }

  const totalDevelopmentCost = nonFinance + finance
  const netProfit = grossRevenue - totalDevelopmentCost
  const marginOnCost = safeDiv(netProfit, totalDevelopmentCost)
  const marginOnRevenue = safeDiv(netProfit, grossRevenue)

  const requiredEquity = cashflow.equityIn > 0 ? cashflow.equityIn : Math.max(0, totalDevelopmentCost - cashflow.peakDebt)

  return {
    grossRevenue,
    totalDevelopmentCost,
    netProfit,
    marginOnCost,
    marginOnRevenue,
    amounts: {
      acquisition,
      planning_design: planningDesign,
      construction,
      professional_fees: professionalFees,
      finance,
      holding,
      marketing_selling: marketingSelling,
      contingency,
      overrun,
      taxes_duties: taxesDuties,
    },
    constructionRate,
    totalGfaSqm,
    peakDebt: cashflow.peakDebt,
    peakDebtMonth: cashflow.peakDebtMonth,
    requiredEquity,
    interest: cashflow.totalInterest,
    fees: cashflow.totalFees,
    effectiveDurationMonths,
    dbpProgramMonths: cls.dbpProgramMonths,
    irr: cashflow.irr,
    equityIn: cashflow.equityIn,
    equityOut: cashflow.equityOut,
    cashflow,
  }
}

/**
 * Gross realisation depends on what the client is doing with the site: a sale
 * price if they are selling, a capitalised valuation if they are holding.
 */
function computeGrossRevenue(inputs: FeasibilityInputs, construction: number): number {
  switch (inputs.mode) {
    case 'develop_to_sell':
      return inputs.yield * inputs.salePricePerDwelling

    case 'develop_to_hold':
    case 'buy_to_hold': {
      // Value on completion, capitalised off net rent where the client gave us
      // a rent; otherwise fall back to comparable sale prices.
      const grossRent = inputs.yield * inputs.weeklyRentPerDwelling * 52
      const netRent = grossRent * (1 - R.RENTAL_OUTGOINGS_PCT)
      const capRate = inputs.exitCapRate > 0 ? inputs.exitCapRate : R.DEFAULT_EXIT_CAP_RATE
      const capitalised = netRent > 0 ? netRent / capRate : 0
      const comparable = inputs.yield * inputs.salePricePerDwelling
      return capitalised > 0 ? capitalised : comparable
    }

    case 'renovate':
      return inputs.postRenoValue > 0 ? inputs.postRenoValue : inputs.preRenoValue + construction

    case 'ppr': {
      // An owner-occupier is not realising anything — the "revenue" is the
      // value of the finished home, used only for LVR and equity tests.
      if (inputs.postRenoValue > 0) return inputs.postRenoValue
      // Land they already own (a rebuild) or land they are buying, plus the
      // house they are putting on it.
      const landValue =
        inputs.pprSubMode === 'knock_down_rebuild'
          ? inputs.currentHomeValue
          : inputs.purchasePrice
      return landValue + construction
    }

    default:
      return 0
  }
}

// ---------------------------------------------------------------------------
// Verdict
// ---------------------------------------------------------------------------

export function verdictFor(
  mode: DealMode,
  marginOnCost: number,
  targetMargin: number
): { verdict: Verdict; reason: string } {
  // Within 15% of target counts as marginal rather than a hard fail — that band
  // is inside the noise of an early-stage estimate.
  const marginalFloor = targetMargin * 0.85

  if (!sellsOnCompletion(mode)) {
    // Hold, PPR and renovation modes are judged by their own metrics; the
    // margin test still gives a useful cost-vs-value read.
    if (marginOnCost >= 0) {
      return {
        verdict: marginOnCost >= targetMargin ? 'feasible' : 'marginal',
        reason:
          marginOnCost >= targetMargin
            ? 'Value created exceeds total cost by more than your target'
            : 'Value created covers cost, but by less than your target margin',
      }
    }
    return { verdict: 'not_feasible', reason: 'Total cost exceeds the value created' }
  }

  if (marginOnCost >= targetMargin) {
    return { verdict: 'feasible', reason: 'Meets your target margin' }
  }
  if (marginOnCost >= marginalFloor) {
    return { verdict: 'marginal', reason: 'Close to your target margin, but under it' }
  }
  if (marginOnCost > 0) {
    return { verdict: 'not_feasible', reason: 'Profitable, but well short of your target margin' }
  }
  return { verdict: 'not_feasible', reason: 'This deal loses money on the current inputs' }
}

// ---------------------------------------------------------------------------
// Break-even and land solvers
// ---------------------------------------------------------------------------

/**
 * True break-even sale price, re-solving GST and selling costs as revenue
 * moves. The naive "total cost ÷ dwellings" figure understates break-even,
 * because dropping the sale price also drops the GST and commission you pay.
 */
export function solveBreakEvenPerDwelling(inputs: FeasibilityInputs): number {
  if (inputs.yield <= 0) return 0

  const profitAt = (pricePerDwelling: number): number =>
    computeCore({ ...inputs, salePricePerDwelling: pricePerDwelling }).netProfit

  let lo = 0
  let hi = Math.max(inputs.salePricePerDwelling * 3, 1_000_000)

  if (profitAt(hi) < 0) return hi // cannot break even within a sane range

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (profitAt(mid) < 0) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

/**
 * The most you can pay for the site and still hit your target margin.
 *
 * Solved rather than approximated, because paying more for land also increases
 * stamp duty (progressively) and *reduces* the GST margin — so the relationship
 * is not linear.
 */
export function solveMaxSupportablePurchasePrice(inputs: FeasibilityInputs): number {
  const marginAt = (price: number): number =>
    computeCore({ ...inputs, purchasePrice: price, landValueUv: inputs.landValueUv }).marginOnCost

  // The site can never be worth more than the gross realisation, so that is a
  // safe upper bound for the search.
  const hiBound = Math.max(inputs.yield * inputs.salePricePerDwelling, inputs.purchasePrice * 2, 1)
  let lo = 0
  let hi = hiBound

  // If even a free site cannot hit the target, there is no supportable price.
  if (marginAt(lo) < inputs.targetMargin) return 0

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    if (marginAt(mid) >= inputs.targetMargin) lo = mid
    else hi = mid
  }
  return (lo + hi) / 2
}

// ---------------------------------------------------------------------------
// Full assessment
// ---------------------------------------------------------------------------

export function runFeasibility(inputs: FeasibilityInputs): FeasibilityResults {
  const core = computeCore(inputs)
  const cls = classify(inputs.devType, inputs.titleType, inputs.yield, inputs.nccClassOverride)

  const { verdict, reason } = verdictFor(inputs.mode, core.marginOnCost, inputs.targetMargin)

  // --- statutory detail, with full traces for the UI ---
  const buysLand = !(inputs.mode === 'ppr' && inputs.pprSubMode === 'knock_down_rebuild')
  const landValue = inputs.landValueUv ?? inputs.purchasePrice
  const landTaxExempt = inputs.landTaxExempt || inputs.mode === 'ppr'
  const landTaxTraced = nswLandTax(landValue, landTaxExempt)

  const statutory = {
    stampDuty: nswStampDuty(buysLand ? inputs.purchasePrice : 0),
    landTaxPerYear: landTaxTraced,
    landTaxOverProject: traced(
      landTaxTraced.value * (core.effectiveDurationMonths / 12),
      landTaxTraced.confidence,
      {
        steps: [
          { label: 'Land tax per year', value: landTaxTraced.value, format: 'money' },
          { label: 'Project duration', value: core.effectiveDurationMonths, format: 'months' },
          {
            label: 'Land tax over the project',
            value: landTaxTraced.value * (core.effectiveDurationMonths / 12),
            format: 'money',
          },
        ],
        sourceKey: 'nsw_land_tax',
      }
    ),
    hbcfPremium: nswHbcf(
      core.amounts.construction,
      hasConstruction(inputs.mode) &&
        inputs.devType !== 'subdivision' &&
        inputs.devType !== 'commercial'
    ),
    gst: gstOnSale(
      core.grossRevenue,
      core.amounts.acquisition,
      remitsGst(inputs.mode, inputs.gstTreatment) ? 'margin_scheme' : 'none'
    ),
    councilContributions: buildContributionsTrace(inputs),
  }

  // --- buckets, with traces ---
  const buckets = buildBuckets(inputs, core, cls, statutory)

  const constructionRateTraced = buildConstructionRateTrace(inputs)

  // --- break-even and land headroom ---
  const breakEvenPerDwelling = safeDiv(core.totalDevelopmentCost, inputs.yield)
  const breakEvenAdjusted = sellsOnCompletion(inputs.mode)
    ? solveBreakEvenPerDwelling(inputs)
    : breakEvenPerDwelling
  const priceDropHeadroom = sellsOnCompletion(inputs.mode)
    ? safeDiv(inputs.salePricePerDwelling - breakEvenAdjusted, inputs.salePricePerDwelling)
    : 0
  const maxLand = sellsOnCompletion(inputs.mode) ? solveMaxSupportablePurchasePrice(inputs) : 0

  // --- mode-specific blocks ---
  const ppr = inputs.mode === 'ppr' ? derivePpr(inputs, core) : null
  const renovation = inputs.mode === 'renovate' ? deriveRenovation(inputs, core) : null
  const hold =
    inputs.mode === 'develop_to_hold' || inputs.mode === 'buy_to_hold'
      ? deriveHold(inputs, core)
      : null

  const results: FeasibilityResults = {
    verdict,
    verdictReason: reason,
    grossRevenue: core.grossRevenue,
    totalDevelopmentCost: core.totalDevelopmentCost,
    netProfit: core.netProfit,
    marginOnCost: core.marginOnCost,
    marginOnRevenue: core.marginOnRevenue,
    returnOnEquity: safeDiv(core.netProfit, core.requiredEquity),
    requiredEquity: core.requiredEquity,
    peakDebt: core.peakDebt,
    peakDebtMonth: core.peakDebtMonth,

    breakEvenPerDwelling,
    priceDropHeadroom,
    breakEvenPerDwellingAdjusted: breakEvenAdjusted,
    maxSupportablePurchasePrice: maxLand,
    landHeadroom: maxLand - inputs.purchasePrice,

    profitPerDwelling: safeDiv(core.netProfit, inputs.yield),
    costPerDwelling: safeDiv(core.totalDevelopmentCost, inputs.yield),
    totalGfaSqm: core.totalGfaSqm,
    constructionRatePerSqm: constructionRateTraced,

    buckets,
    statutory,
    classification: cls,
    cashflow: core.cashflow,
    insights: [],
    narrative: [],

    ppr,
    renovation,
    hold,
  }

  // Insights and narrative read the finished results, so they run last.
  results.insights = buildInsights(inputs, results)
  results.narrative = buildNarrative(inputs, results)

  return results
}

// ---------------------------------------------------------------------------
// Trace builders
// ---------------------------------------------------------------------------

function buildConstructionRateTrace(inputs: FeasibilityInputs): Traced {
  const range = R.constructionRate(inputs.devType, inputs.qualityTier, inputs.siteDifficulty)
  const base = traced(range.point, 'medium', {
    range: { low: range.low, high: range.high },
    steps: [
      {
        label: 'Rate library lookup',
        detail: `Sydney metro ${inputs.qualityTier.replace('_', '-')} ${inputs.devType.replace('_', ' ')} on a ${inputs.siteDifficulty.replace('_', ' ')} site`,
        value: range.point,
        format: 'rate',
      },
      {
        label: 'Site difficulty multiplier',
        value: R.SITE_DIFFICULTY_MULTIPLIER[inputs.siteDifficulty],
        detail: 'Applied on top of the base rate',
      },
      {
        label: 'Plausible range',
        detail: `$${range.low.toLocaleString()}/m² – $${range.high.toLocaleString()}/m²`,
      },
    ],
    sourceKey: 'construction_rates',
    verifyWith: 'a builder quote or a QS estimate',
  })
  return withOverride(base, inputs.overrides.constructionRatePerSqm)
}

function buildContributionsTrace(inputs: FeasibilityInputs): Traced {
  const isSub = inputs.devType === 'subdivision'
  const perUnit = isSub
    ? R.SUBDIVISION_CONTRIBUTION_PER_LOT
    : R.COUNCIL_CONTRIBUTION_PER_DWELLING
  const total = hasConstruction(inputs.mode) ? inputs.yield * perUnit.point : 0

  return traced(total, 'low', {
    range: { low: inputs.yield * perUnit.low, high: inputs.yield * perUnit.high },
    steps: [
      { label: isSub ? 'Lots' : 'Dwellings', value: inputs.yield, format: 'number' },
      {
        label: 'Indicative contribution per ' + (isSub ? 'lot' : 'dwelling'),
        value: perUnit.point,
        format: 'money',
        detail: `Range $${perUnit.low.toLocaleString()} – $${perUnit.high.toLocaleString()}`,
      },
      { label: 'Total contributions', value: total, format: 'money' },
    ],
    sourceKey: 'council_contributions',
    verifyWith: 'the relevant council or a town planner — this line varies enormously',
  })
}

function buildBuckets(
  inputs: FeasibilityInputs,
  core: CoreResult,
  cls: ReturnType<typeof classify>,
  statutory: FeasibilityResults['statutory']
): CostBucket[] {
  const a = core.amounts
  const buysLand = !(inputs.mode === 'ppr' && inputs.pprSubMode === 'knock_down_rebuild')

  const bucket = (
    key: BucketKey,
    value: number,
    confidence: Parameters<typeof traced>[1],
    steps: Traced['steps'],
    opts: { sourceKey?: string; verifyWith?: string; range?: { low: number; high: number } } = {}
  ): CostBucket => ({
    key,
    label: BUCKET_LABELS[key].label,
    description: BUCKET_LABELS[key].description,
    ...traced(value, confidence, { steps, ...opts }),
  })

  const consultantPct = R.consultantPct(inputs.devType).point
  const rateRange = R.constructionRate(inputs.devType, inputs.qualityTier, inputs.siteDifficulty)
  const costPlusFactor = inputs.builderContract === 'cost_plus' ? 1 + R.COST_PLUS_MARGIN : 1

  const out: CostBucket[] = [
    withBucketOverride(
      bucket(
        'acquisition',
        a.acquisition,
        'high',
        buysLand
          ? [
              { label: 'Purchase price', value: inputs.purchasePrice, format: 'money' },
              { label: 'NSW transfer duty', value: statutory.stampDuty.value, format: 'money' },
              {
                label: 'Legals, due diligence, settlement adjustments',
                value: R.ACQUISITION_SUNDRIES,
                format: 'money',
              },
              ...(inputs.buyersAgentEngaged
                ? [
                    {
                      label: "Buyer's agent",
                      value:
                        a.acquisition -
                        inputs.purchasePrice -
                        statutory.stampDuty.value -
                        R.ACQUISITION_SUNDRIES,
                      format: 'money' as const,
                    },
                  ]
                : []),
            ]
          : [
              {
                label: 'You already own the site',
                detail: 'No purchase price and no acquisition duty on a knock-down rebuild',
              },
            ],
        { sourceKey: 'nsw_transfer_duty' }
      ),
      inputs.overrides.acquisition
    ),

    withBucketOverride(
      bucket(
        'planning_design',
        a.planning_design,
        'low',
        [
          {
            label: 'Consultants',
            detail: `${(consultantPct * 100).toFixed(0)}% of construction — architect, structural, civil, hydraulic, certifier, surveyor, energy, geotech`,
            value: a.construction * consultantPct,
            format: 'money',
          },
          {
            label: 'Council & infrastructure contributions',
            value: statutory.councilContributions.value,
            format: 'money',
            detail: 's7.11 / s7.12 — varies enormously by council',
          },
          ...(cls.dbpApplies
            ? [
                {
                  label: 'NSW DBP compliance',
                  value: cls.dbpCostUplift,
                  format: 'money' as const,
                  detail: 'Registered practitioners and regulated design declarations',
                },
              ]
            : []),
        ],
        {
          sourceKey: 'council_contributions',
          verifyWith: 'the relevant council or a town planner',
          // Contributions swing from $8k to $75k a dwelling, which dominates the
          // uncertainty in this bucket — so the band is worth showing.
          range: {
            low:
              a.planning_design -
              statutory.councilContributions.value +
              (statutory.councilContributions.range?.low ?? 0),
            high:
              a.planning_design -
              statutory.councilContributions.value +
              (statutory.councilContributions.range?.high ?? 0),
          },
        }
      ),
      inputs.overrides.planning_design
    ),

    withBucketOverride(
      bucket(
        'construction',
        a.construction,
        'medium',
        inputs.boq.touched
          ? [
              {
                label: 'From your bill of quantities',
                detail: `${inputs.boq.lines.length} priced lines replace the rate-library figure`,
                value: a.construction,
                format: 'money',
              },
            ]
          : [
              { label: 'Gross floor area', value: core.totalGfaSqm, format: 'area' },
              { label: 'Construction rate', value: core.constructionRate, format: 'rate' },
              ...(inputs.builderContract === 'cost_plus'
                ? [
                    {
                      label: "Builder's margin (cost-plus)",
                      detail: `${(R.COST_PLUS_MARGIN * 100).toFixed(0)}% added as an explicit line`,
                    },
                  ]
                : [
                    {
                      label: "Builder's margin",
                      detail: 'Already included in the fixed-price rate',
                    },
                  ]),
              { label: 'Construction cost', value: a.construction, format: 'money' },
            ],
        {
          sourceKey: 'construction_rates',
          verifyWith: 'a builder quote or a QS estimate',
          // Carry the rate band up to the bucket, so the client sees what the
          // construction line could plausibly come in at — not just the point
          // estimate. Meaningless once a BoQ is driving the figure.
          ...(inputs.boq.touched || inputs.devType === 'subdivision'
            ? {}
            : {
                range: {
                  low: core.totalGfaSqm * rateRange.low * costPlusFactor,
                  high: core.totalGfaSqm * rateRange.high * costPlusFactor,
                },
              }),
        }
      ),
      inputs.overrides.construction
    ),

    withBucketOverride(
      bucket(
        'professional_fees',
        a.professional_fees,
        'medium',
        [
          {
            label: 'PM, DM, QS, insurance, strata setup',
            detail: `${(R.PROFESSIONAL_FEE_PCT.point * 100).toFixed(0)}% of construction`,
            value: a.construction * R.PROFESSIONAL_FEE_PCT.point,
            format: 'money',
          },
          ...(statutory.hbcfPremium.value > 0
            ? [
                {
                  label: 'HBCF premium',
                  value: statutory.hbcfPremium.value,
                  format: 'money' as const,
                  detail: 'NSW Home Building Compensation Fund',
                },
              ]
            : []),
        ],
        { sourceKey: 'nsw_hbcf' }
      ),
      inputs.overrides.professional_fees
    ),

    withBucketOverride(
      bucket(
        'finance',
        a.finance,
        'low',
        [
          {
            label: 'Interest (capitalised)',
            value: core.interest,
            format: 'money',
            detail: `${((inputs.overrides.interestRate ?? R.FINANCE_BANDS[inputs.financeProfile].interestRate) * 100).toFixed(2)}% on the drawn balance`,
          },
          {
            label: 'Line and establishment fees',
            value: core.fees,
            format: 'money',
          },
          {
            label: 'Peak debt',
            value: core.peakDebt,
            format: 'money',
            detail: `Month ${core.peakDebtMonth} of ${Math.round(core.effectiveDurationMonths)}`,
          },
        ],
        { sourceKey: 'finance_rates', verifyWith: 'a lender quote — this is indicative pricing' }
      ),
      inputs.overrides.finance
    ),

    withBucketOverride(
      bucket(
        'holding',
        a.holding,
        'medium',
        [
          {
            label: 'NSW land tax',
            value: statutory.landTaxOverProject.value,
            format: 'money',
            detail:
              statutory.landTaxPerYear.value > 0
                ? `${(statutory.landTaxPerYear.value).toLocaleString('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 })} per year while you hold`
                : 'Below the threshold, or exempt',
          },
          {
            label: 'Council rates',
            value: inputs.councilRatesPerYear * (core.effectiveDurationMonths / 12),
            format: 'money',
          },
          {
            label: 'Utilities, insurance, site security',
            value: R.UTILITIES_INSURANCE_PER_YEAR.point * (core.effectiveDurationMonths / 12),
            format: 'money',
          },
        ],
        { sourceKey: 'nsw_land_tax' }
      ),
      inputs.overrides.holding
    ),

    withBucketOverride(
      bucket(
        'marketing_selling',
        a.marketing_selling,
        'medium',
        sellsOnCompletion(inputs.mode)
          ? [
              {
                label: 'Agent commission',
                detail: `${(R.AGENT_COMMISSION_PCT.point * 100).toFixed(1)}% of gross realisation`,
                value: core.grossRevenue * R.AGENT_COMMISSION_PCT.point,
                format: 'money',
              },
              {
                label: 'Marketing campaign',
                detail: `${(R.MARKETING_PCT.point * 100).toFixed(1)}% of gross realisation`,
                value: core.grossRevenue * R.MARKETING_PCT.point,
                format: 'money',
              },
              {
                label: 'Legals on sale',
                value: inputs.yield * R.SELLING_LEGALS_PER_DWELLING,
                format: 'money',
              },
            ]
          : [{ label: 'Not selling', detail: 'No agent commission or campaign on a hold' }],
        { sourceKey: 'selling_costs' }
      ),
      inputs.overrides.marketing_selling
    ),

    withBucketOverride(
      bucket('contingency', a.contingency, 'medium', [
        {
          label: 'Project stage',
          detail: inputs.projectStage.replace(/_/g, ' '),
        },
        {
          label: 'Contingency rate',
          value: R.CONTINGENCY_BY_STAGE[inputs.projectStage],
          format: 'percent',
          detail: 'Applied to construction + planning & design + professional fees',
        },
        { label: 'Contingency', value: a.contingency, format: 'money' },
      ]),
      inputs.overrides.contingency
    ),

    bucket('overrun', a.overrun, 'medium', [
      {
        label: 'Overrun buffer',
        value: inputs.overrunBuffer,
        format: 'percent',
        detail: 'Things you HAVE priced that slip anyway — separate from contingency',
      },
      { label: 'Overrun allowance', value: a.overrun, format: 'money' },
    ]),
  ]

  if (a.taxes_duties > 0) {
    out.push(
      withBucketOverride(
        bucket('taxes_duties', a.taxes_duties, 'medium', statutory.gst.steps, {
          sourceKey: 'gst_margin_scheme',
          verifyWith: 'your accountant',
        }),
        inputs.overrides.taxes_duties
      )
    )
  }

  return out
}

function withBucketOverride(bucket: CostBucket, override: number | null): CostBucket {
  return { ...bucket, ...withOverride(bucket, override) }
}
