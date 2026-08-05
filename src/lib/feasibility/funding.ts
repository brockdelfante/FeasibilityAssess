/**
 * Can I fund it? — the borrower's side of the finance question.
 *
 * The feasibility engine answers "does this project make money". This answers
 * the question that immediately follows: "can I actually get the money, how
 * much of it has to be mine, and what does the debt cost me?"
 *
 * It is deliberately written in the developer's voice, not a credit
 * assessor's. A lender asks "is the LVR inside policy"; a developer asks "how
 * much do I have to put in, and is there a gap I need to cover". Those are the
 * same arithmetic and completely different sentences, and the sentence is the
 * part that makes this usable.
 *
 * The second mortgage is the reason this stage exists at all. Senior lenders
 * size a facility on the LOWER of a share of end value and a share of total
 * cost, and that ceiling routinely lands below what a developer can fund from
 * their own cash. The gap is real, it is common, and it is expensive to close
 * — so the model shows the gap, prices the mezzanine that closes it, and then
 * shows what that does to the profit at the end. Quoting a shortfall without
 * pricing the fix would leave the client exactly where they started.
 */

import { FINANCE_BANDS } from './rates'
import { safeDiv } from './trace'
import type { FeasibilityInputs, FeasibilityResults } from './types'

// ---------------------------------------------------------------------------
// Senior debt sizing
// ---------------------------------------------------------------------------

/**
 * Indicative senior ceilings for Australian residential development finance.
 *
 * Both bind at once and the facility is the lower of the two, which is the bit
 * developers are most often surprised by: a project can sit comfortably inside
 * the LVR test and still be capped by loan-to-cost.
 */
export const SENIOR_LVR_CAP = 0.65
export const SENIOR_LTC_CAP = 0.8

/** Typical second-mortgage pricing. Wide, because this money is priced deal by deal. */
export const MEZZ_RATE = { low: 0.1, point: 0.14, high: 0.2 }
/** Establishment fee on the mezzanine facility, share of the amount drawn. */
export const MEZZ_ESTABLISHMENT_PCT = 0.02
/** Broker/placement fee, share of the amount drawn. */
export const MEZZ_BROKER_PCT = 0.01
/** Legals on a second mortgage, indicative flat cost. */
export const MEZZ_LEGALS = 15_000

/**
 * Lenders count presales toward the facility only where the contract is
 * "qualifying" — unconditional, arm's length, to a buyer who is not related to
 * the developer, with a deposit held. A useful rule of thumb is that a
 * meaningful share of a raw presale book fails one of those tests.
 */
export const QUALIFYING_PRESALE_SHARE = 0.85

export interface FundingResult {
  /** What the senior lender will advance, and which test bound it. */
  seniorLimit: number
  seniorLimitByValue: number
  seniorLimitByCost: number
  boundBy: 'value' | 'cost' | 'none'

  /** Peak funding need, from the feasibility cashflow. */
  peakFundingNeed: number
  /** Cash the developer must find if there is no second mortgage. */
  equityRequired: number
  /** Equity need beyond what the developer says they have. Zero if they have enough. */
  shortfall: number

  /** Presale cover, and the share of it a lender would actually count. */
  presaleValue: number
  qualifyingPresaleValue: number
  presaleCoverOfSenior: number

  // --- second mortgage ---
  mezzUsed: boolean
  mezzAmount: number
  mezzInterest: number
  mezzFees: number
  /** Everything the second mortgage costs over the term. */
  mezzTotalCost: number
  /** Weighted rate across senior and mezzanine. */
  blendedRate: number
  /** Total debt across both facilities. */
  totalDebt: number
  /** Total debt as a share of end value. */
  totalDebtToValue: number

  /** Cash the developer still has to find after the second mortgage. */
  cashStillRequired: number
  /** True where even a second mortgage does not close the gap. */
  stillShort: boolean

  /** Profit after the second mortgage is paid for. */
  profitAfterMezz: number
  marginAfterMezz: number
  /** What the mezzanine costs as a share of the profit it unlocks. */
  mezzCostShareOfProfit: number
}

/**
 * Work out the funding position for a project.
 *
 * `results` comes from the feasibility engine, so this never re-derives cost or
 * revenue — it reads the same figures the client has already seen. That matters
 * more than it sounds: a funding page that quietly disagreed with the
 * feasibility page above it would destroy trust in both.
 */
export function computeFunding(
  inputs: FeasibilityInputs,
  results: FeasibilityResults
): FundingResult {
  const grv = results.grossRevenue
  const tdc = results.totalDevelopmentCost

  // --- what a senior lender will advance ---
  const band = FINANCE_BANDS[inputs.financeProfile]
  const lvrCap = inputs.seniorLvrCap > 0 ? inputs.seniorLvrCap : SENIOR_LVR_CAP
  // A cash-funded project has no facility at all; otherwise the profile's
  // loan-to-cost is the developer's intent and the policy cap is the ceiling.
  const ltcCap =
    inputs.financeProfile === 'cash' ? 0 : Math.min(band.loanToCost, SENIOR_LTC_CAP)

  const seniorLimitByValue = Math.max(0, grv * lvrCap)
  const seniorLimitByCost = Math.max(0, tdc * ltcCap)
  const seniorLimit = Math.min(seniorLimitByValue, seniorLimitByCost)

  const boundBy: FundingResult['boundBy'] =
    seniorLimit <= 0
      ? 'none'
      : seniorLimitByValue < seniorLimitByCost
        ? 'value'
        : 'cost'

  // --- how much of it is actually needed, and what is left for the developer ---
  // Peak debt is what the project draws at its worst month. A facility limit
  // above that is headroom, not money the developer receives.
  const peakFundingNeed = results.peakDebt
  const seniorDrawn = Math.min(seniorLimit, peakFundingNeed)
  const equityRequired = Math.max(0, tdc - seniorDrawn)

  const equityAvailable = Math.max(0, inputs.equityAvailable)
  const shortfall = Math.max(0, equityRequired - equityAvailable)

  // --- presales ---
  const presaleValue = grv * Math.max(0, Math.min(1, inputs.presalesShare))
  const qualifyingPresaleValue = presaleValue * QUALIFYING_PRESALE_SHARE
  const presaleCoverOfSenior = safeDiv(qualifyingPresaleValue, seniorLimit)

  // --- the second mortgage that closes the gap ---
  const wantsMezz = inputs.mezzEnabled && shortfall > 0
  // Sized to the gap unless the client has pinned an amount. Never larger than
  // the gap: borrowing mezzanine you do not need is the most expensive money in
  // the deal sitting idle.
  const mezzAmount = wantsMezz
    ? inputs.mezzAmount > 0
      ? Math.min(inputs.mezzAmount, shortfall)
      : shortfall
    : 0

  const mezzRate = inputs.mezzInterestRate > 0 ? inputs.mezzInterestRate : MEZZ_RATE.point
  const months = Math.max(1, results.cashflow.rows.length)

  // Mezzanine is drawn late and repaid on settlement, so charging the headline
  // rate across the whole program overstates it. Half the term is the
  // convention, and it is stated in the trace rather than hidden.
  const mezzMonths = months / 2
  const mezzInterest = wantsMezz ? mezzAmount * mezzRate * (mezzMonths / 12) : 0
  const mezzFees = wantsMezz
    ? mezzAmount * (MEZZ_ESTABLISHMENT_PCT + MEZZ_BROKER_PCT) + MEZZ_LEGALS
    : 0
  const mezzTotalCost = mezzInterest + mezzFees

  const totalDebt = seniorDrawn + mezzAmount
  const blendedRate =
    totalDebt > 0
      ? (seniorDrawn * band.interestRate + mezzAmount * mezzRate) / totalDebt
      : 0
  const totalDebtToValue = safeDiv(totalDebt, grv)

  const cashStillRequired = Math.max(0, shortfall - mezzAmount)

  // --- what it costs at the end ---
  const profitAfterMezz = results.netProfit - mezzTotalCost
  const marginAfterMezz = safeDiv(profitAfterMezz, tdc + mezzTotalCost)
  const mezzCostShareOfProfit = safeDiv(mezzTotalCost, Math.max(1, results.netProfit))

  return {
    seniorLimit,
    seniorLimitByValue,
    seniorLimitByCost,
    boundBy,

    peakFundingNeed,
    equityRequired,
    shortfall,

    presaleValue,
    qualifyingPresaleValue,
    presaleCoverOfSenior,

    mezzUsed: wantsMezz && mezzAmount > 0,
    mezzAmount,
    mezzInterest,
    mezzFees,
    mezzTotalCost,
    blendedRate,
    totalDebt,
    totalDebtToValue,

    cashStillRequired,
    stillShort: cashStillRequired > 0,

    profitAfterMezz,
    marginAfterMezz,
    mezzCostShareOfProfit,
  }
}

/**
 * The one-line answer, in the developer's words.
 *
 * Every funding position reduces to one of five situations, and naming which
 * one you are in is worth more than any table of ratios.
 */
export function fundingVerdict(
  funding: FundingResult,
  inputs: FeasibilityInputs
): { tone: 'positive' | 'caution' | 'critical'; headline: string; detail: string } {
  if (inputs.financeProfile === 'cash') {
    return {
      tone: 'positive',
      headline: 'You are funding this without debt',
      detail: `That means no interest and no facility fees, but you need the full ${money(funding.equityRequired)} in cash and it is tied up for the whole program.`,
    }
  }

  // Nothing has been said about available cash yet, so there is no gap to
  // report — only a requirement. Announcing a shortfall here would be alarming
  // and wrong: it is measured against an answer the client has not given.
  if (inputs.equityAvailable <= 0) {
    return {
      tone: 'caution',
      headline: `You would need to put in ${money(funding.equityRequired)}`,
      detail: `A senior lender should advance around ${money(funding.seniorLimit)} against this project. Tell us how much cash you have below and we will show you whether there is a gap — and what closing it would cost.`,
    }
  }

  if (funding.shortfall <= 0) {
    return {
      tone: 'positive',
      headline: 'Your cash covers what the lender will not',
      detail: `A senior lender should advance around ${money(funding.seniorLimit)}, leaving ${money(funding.equityRequired)} for you to fund — and you have ${money(inputs.equityAvailable)}.`,
    }
  }

  // Only claim a second mortgage does not fix it once one has actually been
  // priced. Otherwise this reads as a verdict on an option never considered.
  if (funding.mezzUsed && funding.stillShort) {
    return {
      tone: 'critical',
      headline: `Still ${money(funding.cashStillRequired)} short, even with the second mortgage`,
      detail:
        'Closing this needs a bigger second mortgage, more equity, a partner, a cheaper site, or a smaller scheme. The scale and solver panels on the feasibility step will tell you how much has to change.',
    }
  }

  if (funding.mezzUsed) {
    return {
      tone: 'caution',
      headline: `A second mortgage of ${money(funding.mezzAmount)} closes the gap`,
      detail: `It costs ${money(funding.mezzTotalCost)} over the program — ${percentOf(funding.mezzCostShareOfProfit)} of your profit — and takes your blended rate to ${percentOf(funding.blendedRate)}.`,
    }
  }

  return {
    tone: 'caution',
    headline: `You are ${money(funding.shortfall)} short on cash`,
    detail:
      'A second mortgage sits behind the senior lender and can cover the gap. Turn it on below to see what it would cost you.',
  }
}

// Local formatters so this module stays free of UI imports.
function money(value: number): string {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(Math.round(value))
}

function percentOf(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}
