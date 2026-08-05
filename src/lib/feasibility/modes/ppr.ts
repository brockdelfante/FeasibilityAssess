/**
 * Owner-occupier (PPR) and knock-down rebuild.
 *
 * A homeowner is not asking "what is my margin?" — they are asking "can I
 * actually fund this, and can I service the loan afterwards?". Two numbers
 * decide most rebuilds:
 *
 *  1. Releasable equity versus build cost. If equity is thin, the gap is funded
 *     in cash — so we show the shortfall explicitly rather than burying it.
 *  2. Serviceability. Rebuilding raises the loan against a higher completed
 *     value, so repayments rise even though nobody has moved house.
 */

import * as R from '../rates'
import { nswStampDutyAmount } from '../statutory'
import { safeDiv } from '../trace'
import type { FeasibilityInputs, PprResult } from '../types'
import type { CoreResult } from '../engine'

/** Indicative LMI premium for a loan above 80% LVR. */
export function lmiPremium(loanAmount: number, lvr: number): number {
  if (lvr <= 0.8) return 0
  const band = R.LMI_BANDS.find((b) => lvr <= b.upTo) ?? R.LMI_BANDS[R.LMI_BANDS.length - 1]
  return Math.round(loanAmount * band.pct)
}

/** Standard amortising monthly repayment. */
export function monthlyRepayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0) return 0
  const r = annualRate / 12
  const n = years * 12
  if (r <= 0) return principal / n
  return (principal * r) / (1 - Math.pow(1 + r, -n))
}

/** Practical lending ceiling — no mainstream lender goes past this on an LVR. */
const MAX_LENDABLE_LVR = 0.95

export function derivePpr(inputs: FeasibilityInputs, core: CoreResult): PprResult {
  const isRebuild = inputs.pprSubMode === 'knock_down_rebuild'

  // Releasable equity — conventionally 80% of current value, less what is owed.
  // Note this is borrowing *capacity*, not cash: drawing on it increases the
  // loan. That distinction is why the loan below is not reduced by it.
  const releasableEquity = Math.max(
    0,
    inputs.currentHomeValue * R.RELEASABLE_EQUITY_LVR - inputs.outstandingMortgage
  )

  // What the client has to fund: everything except land they already own.
  const buildCost = isRebuild
    ? core.totalDevelopmentCost
    : core.totalDevelopmentCost - inputs.purchasePrice

  // Value of the finished home, which is what the loan is written against.
  const completedValue =
    core.grossRevenue > 0
      ? core.grossRevenue
      : (isRebuild ? inputs.currentHomeValue : inputs.purchasePrice) + buildCost

  // The existing mortgage rolls into the new facility and the build is borrowed
  // on top of it.
  const loanRequired = inputs.outstandingMortgage + buildCost

  // Anything above the practical lending ceiling has to be funded in cash.
  const cashShortfall = Math.max(0, loanRequired - MAX_LENDABLE_LVR * completedValue)
  const fundedLoan = loanRequired - cashShortfall

  const lvr = safeDiv(fundedLoan, completedValue)
  const lmiPayable = lmiPremium(fundedLoan, lvr)

  const repayment = monthlyRepayment(
    fundedLoan + lmiPayable,
    R.OWNER_OCCUPIER_RATE,
    R.MORTGAGE_TERM_YEARS
  )

  const totalDebt = fundedLoan + inputs.existingOtherDebt
  const dti = safeDiv(totalDebt, inputs.householdIncome)

  // Serviceability is tested at the actual rate plus the regulator's buffer.
  const stressedRepayment = monthlyRepayment(
    fundedLoan + lmiPayable,
    R.OWNER_OCCUPIER_RATE + R.SERVICEABILITY_BUFFER,
    R.MORTGAGE_TERM_YEARS
  )
  const monthlyIncome = inputs.householdIncome / 12
  const serviceable =
    inputs.householdIncome > 0 &&
    stressedRepayment <= monthlyIncome * R.MAX_REPAYMENT_TO_INCOME &&
    dti < R.DTI_HOT_ZONE

  // A rebuild avoids acquisition duty entirely — usually the single largest
  // one-off saving versus buying somewhere else.
  const dutySaved = isRebuild ? nswStampDutyAmount(inputs.currentHomeValue) : 0

  return {
    releasableEquity,
    buildCost,
    cashShortfall,
    loanRequired: fundedLoan,
    completedValue,
    lvr,
    lmiPayable,
    monthlyRepayment: repayment,
    dti,
    serviceable,
    dutySaved,
  }
}
