/**
 * Develop-to-hold and buy-existing-to-hold.
 *
 * A hold is judged on income, not on a sale. The questions are what the asset
 * yields on what it cost to create, what the equity earns in cash each year,
 * and whether the rent covers the debt — which is the test a lender applies
 * when the construction facility is refinanced to a term loan.
 */

import * as R from '../rates'
import { safeDiv } from '../trace'
import type { FeasibilityInputs, HoldResult } from '../types'
import type { CoreResult } from '../engine'

export function deriveHold(inputs: FeasibilityInputs, core: CoreResult): HoldResult {
  const grossAnnualRent = inputs.yield * inputs.weeklyRentPerDwelling * 52
  const netAnnualRent = grossAnnualRent * (1 - R.RENTAL_OUTGOINGS_PCT)

  const capRate = inputs.exitCapRate > 0 ? inputs.exitCapRate : R.DEFAULT_EXIT_CAP_RATE
  const completedValue = netAnnualRent > 0 ? netAnnualRent / capRate : core.grossRevenue

  // Yield on cost is the number that tells you whether developing to hold beat
  // simply buying the finished product.
  const yieldOnCost = safeDiv(netAnnualRent, core.totalDevelopmentCost)

  // The stabilised term loan sits at the same leverage as the build facility.
  const termDebt = core.peakDebt
  const annualDebtService = termDebt * R.INVESTMENT_LOAN_RATE

  const equity = Math.max(0, core.requiredEquity)
  const cashOnCash = safeDiv(netAnnualRent - annualDebtService, equity)

  const dscr = safeDiv(netAnnualRent, annualDebtService, netAnnualRent > 0 ? Infinity : 0)

  return {
    grossAnnualRent,
    netAnnualRent,
    completedValue,
    yieldOnCost,
    cashOnCash,
    dscr,
    annualDebtService,
  }
}
