/**
 * Monthly cashflow, equity-first funding, capitalised interest and IRR.
 *
 * Peak debt is the number a lender cares about and it cannot be derived from
 * totals alone — it depends on *when* money goes out and *when* sales settle.
 * So we build the month-by-month curve and read peak debt off it, rather than
 * approximating it as a share of total cost.
 */

import { safeDiv } from './trace'
import type { CashflowSummary, MonthlyCashflowRow } from './types'

// ---------------------------------------------------------------------------
// S-curve
// ---------------------------------------------------------------------------

/**
 * Cumulative construction spend against elapsed program. Slow start while the
 * site is set up, steep through the main structural period, tapering through
 * finishing and defects.
 */
const S_CURVE: [number, number][] = [
  [0.0, 0.0],
  [0.05, 0.02],
  [0.1, 0.05],
  [0.15, 0.09],
  [0.2, 0.14],
  [0.25, 0.2],
  [0.3, 0.27],
  [0.35, 0.35],
  [0.4, 0.43],
  [0.45, 0.51],
  [0.5, 0.59],
  [0.55, 0.66],
  [0.6, 0.73],
  [0.65, 0.79],
  [0.7, 0.84],
  [0.75, 0.88],
  [0.8, 0.92],
  [0.85, 0.95],
  [0.9, 0.97],
  [0.95, 0.99],
  [1.0, 1.0],
]

function sCurve(progress: number): number {
  const t = Math.max(0, Math.min(1, progress))
  for (let i = 0; i < S_CURVE.length - 1; i++) {
    const [t0, v0] = S_CURVE[i]
    const [t1, v1] = S_CURVE[i + 1]
    if (t >= t0 && t <= t1) {
      if (t1 === t0) return v1
      return v0 + (v1 - v0) * ((t - t0) / (t1 - t0))
    }
  }
  return 1
}

// ---------------------------------------------------------------------------
// Inputs to the cashflow
// ---------------------------------------------------------------------------

export interface CashflowRequest {
  durationMonths: number
  /** Paid at month 1 — land, duty, legals. */
  acquisition: number
  /** Drawn across the build window on an S-curve. */
  construction: number
  /** Half up front at DA stage, half across the build. */
  planningDesign: number
  /** Spread evenly across the whole program. */
  professionalFees: number
  /** Spread evenly — rates, land tax, utilities. */
  holding: number
  /** Paid at settlement, alongside revenue. */
  marketingSelling: number
  /** Drawn with construction — it is a construction risk allowance. */
  contingency: number
  /** Drawn with construction. */
  overrun: number
  /** Remitted at settlement. */
  gst: number

  /** Gross sale proceeds. */
  grossRevenue: number
  /**
   * Share of revenue that settles before the final month, and when.
   * Defaults to everything settling at the end, which is the conservative case.
   */
  presalesSettleMonth?: number
  presalesShare?: number

  interestRate: number
  loanToCost: number
  establishmentPct: number
  lineFeePct: number

  /**
   * Estimated finance cost, included when sizing the facility.
   *
   * The loan-to-cost covenant is tested against *total* development cost, and
   * total cost includes capitalised interest — so the facility limit has to
   * account for interest that has not been calculated yet. The caller iterates
   * this value to convergence.
   */
  financeAllowance?: number

  /** Months of pre-construction (DA, design) before the builder starts. */
  preConstructionMonths?: number
  /** Build window. Defaults to duration less pre-construction less a sales tail. */
  buildMonths?: number
}

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

export function runCashflow(req: CashflowRequest): CashflowSummary {
  const duration = Math.max(1, Math.round(req.durationMonths))

  // Program shape. Pre-construction is design/DA time; the sales tail is the
  // settlement period after practical completion.
  const preCon = Math.max(
    0,
    Math.min(duration - 1, Math.round(req.preConstructionMonths ?? Math.min(6, duration * 0.25)))
  )
  const salesTail = duration > preCon + 2 ? 1 : 0
  const buildMonths = Math.max(1, Math.round(req.buildMonths ?? duration - preCon - salesTail))

  // Costs that are actually drawn month by month.
  const drawnCosts =
    req.acquisition +
    req.construction +
    req.planningDesign +
    req.professionalFees +
    req.holding +
    req.marketingSelling +
    req.contingency +
    req.overrun

  // The facility is sized against total development cost, which includes both
  // the GST remitted on settlement and the capitalised finance cost.
  const costBaseForFacility = drawnCosts + req.gst + (req.financeAllowance ?? 0)
  const debtLimit = Math.max(0, req.loanToCost * costBaseForFacility)
  const establishmentFee = debtLimit * req.establishmentPct
  const monthlyRate = req.interestRate / 12
  const monthlyLineFee = req.lineFeePct / 12

  // Construction-linked costs all follow the S-curve across the build window.
  const sCurveCosts = req.construction + req.contingency + req.overrun

  const presalesShare = Math.max(0, Math.min(1, req.presalesShare ?? 0))
  const presalesMonth = Math.max(
    1,
    Math.min(duration, Math.round(req.presalesSettleMonth ?? duration))
  )
  const earlyShare = presalesMonth < duration ? presalesShare : 0

  const rows: MonthlyCashflowRow[] = []
  let debtBalance = 0
  let equityBalance = 0
  let totalInterest = 0
  let totalFees = establishmentFee
  let equityIn = 0
  let equityOut = 0

  for (let m = 1; m <= duration; m++) {
    // ----- costs incurred this month -----
    let costs = 0

    if (m === 1) costs += req.acquisition + establishmentFee

    // Planning & design: half at the front, half across the build.
    if (m === 1) costs += req.planningDesign * 0.5
    if (m > preCon && m <= preCon + buildMonths) {
      costs += safeDiv(req.planningDesign * 0.5, buildMonths)
    }

    // Construction and its allowances, on the S-curve.
    if (m > preCon && m <= preCon + buildMonths) {
      const progressEnd = (m - preCon) / buildMonths
      const progressStart = (m - preCon - 1) / buildMonths
      costs += sCurveCosts * (sCurve(progressEnd) - sCurve(progressStart))
    }

    // Professional fees and holding costs run for the whole program.
    costs += safeDiv(req.professionalFees, duration)
    costs += safeDiv(req.holding, duration)

    // ----- revenue settling this month -----
    //
    // Presales only count as an early settlement if they land before the final
    // month; otherwise they are simply part of the settlement at the end.
    // Splitting it this way keeps the two branches from both claiming the same
    // revenue.
    let revenue = 0
    if (earlyShare > 0 && m === presalesMonth) revenue += req.grossRevenue * earlyShare
    if (m === duration) {
      revenue += req.grossRevenue * (1 - earlyShare)
      // Selling costs and GST are settled out of the sale proceeds.
      costs += req.marketingSelling + req.gst
    }

    // ----- interest and fees on the opening balance -----
    const opening = debtBalance
    const interest = opening * monthlyRate
    const lineFee = debtLimit * monthlyLineFee
    totalInterest += interest
    totalFees += lineFee

    // Interest and line fees capitalise onto the facility.
    let balance = opening + interest + lineFee

    // ----- fund this month's costs: equity first, then debt -----
    let equityDrawn = 0
    let debtDrawn = 0
    const headroom = Math.max(0, debtLimit - balance)

    if (req.loanToCost <= 0) {
      // Cash-funded: equity covers everything.
      equityDrawn = costs
    } else {
      // Equity goes in first, up to the equity requirement, then debt draws.
      const equityRequirement = Math.max(0, costBaseForFacility - debtLimit)
      const equityRemaining = Math.max(0, equityRequirement - equityBalance)
      equityDrawn = Math.min(costs, equityRemaining)
      const fromDebt = costs - equityDrawn
      debtDrawn = Math.min(fromDebt, headroom)
      // If the facility is exhausted, the shortfall falls back to equity.
      equityDrawn += fromDebt - debtDrawn
    }

    balance += debtDrawn
    equityBalance += equityDrawn
    equityIn += equityDrawn

    // ----- apply revenue: repay debt first, surplus returns to equity -----
    let debtRepaid = 0
    let equityReturn = 0
    if (revenue > 0) {
      debtRepaid = Math.min(balance, revenue)
      balance -= debtRepaid
      equityReturn = revenue - debtRepaid
      equityOut += equityReturn
    }

    debtBalance = balance

    rows.push({
      month: m,
      costs,
      revenue,
      equityDrawn,
      debtDrawn,
      debtRepaid,
      interest,
      fees: lineFee + (m === 1 ? establishmentFee : 0),
      debtBalance,
      equityBalance,
      equityCashflow: equityReturn - equityDrawn,
    })
  }

  const peak = rows.reduce(
    (best, r) => (r.debtBalance > best.debtBalance ? r : best),
    rows[0] ?? { debtBalance: 0, month: 0 }
  )

  return {
    rows,
    peakDebt: Math.max(0, peak.debtBalance),
    peakDebtMonth: peak.month,
    totalInterest,
    totalFees,
    equityIn,
    equityOut,
    irr: computeIrr(rows.map((r) => r.equityCashflow)),
    equityMultiple: equityIn > 0 ? equityOut / equityIn : null,
  }
}

// ---------------------------------------------------------------------------
// IRR
// ---------------------------------------------------------------------------

/**
 * Annualised IRR from a monthly cashflow series, by bisection.
 *
 * Bisection rather than Newton–Raphson: it cannot diverge, and a feasibility
 * tool that occasionally returns a wild IRR is worse than one that returns
 * null. Returns null when the series has no sign change (all-negative or
 * all-positive cashflows have no meaningful IRR).
 */
export function computeIrr(monthlyFlows: number[]): number | null {
  if (monthlyFlows.length === 0) return null

  const hasNegative = monthlyFlows.some((f) => f < -0.01)
  const hasPositive = monthlyFlows.some((f) => f > 0.01)
  if (!hasNegative || !hasPositive) return null

  const npv = (rate: number): number =>
    monthlyFlows.reduce((sum, flow, i) => sum + flow / Math.pow(1 + rate, i + 1), 0)

  // Monthly rate bounds: −99% to +100% a month covers anything realistic.
  let lo = -0.99
  let hi = 1.0
  let npvLo = npv(lo)
  let npvHi = npv(hi)

  if (npvLo * npvHi > 0) return null

  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2
    const npvMid = npv(mid)
    if (Math.abs(npvMid) < 1e-7) {
      lo = mid
      break
    }
    if (npvLo * npvMid < 0) {
      hi = mid
      npvHi = npvMid
    } else {
      lo = mid
      npvLo = npvMid
    }
  }

  const monthlyRate = (lo + hi) / 2
  const annualised = Math.pow(1 + monthlyRate, 12) - 1
  return Number.isFinite(annualised) ? annualised : null
}
