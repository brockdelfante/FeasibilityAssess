/**
 * Bridge from the client-facing feasibility into the lender-side assessment.
 *
 * The two models answer different questions. The feasibility asks "does this
 * deal work?" using a rate library and indicative statutory costs; the lender
 * assessment asks "will we fund it, at what LVR, and does it breach policy?"
 * using figures a credit team has verified.
 *
 * So this is a one-way seed, not a sync. It maps the feasibility's cost stack
 * onto the deal schema so an analyst starts from real numbers instead of an
 * empty form, and deliberately leaves the credit-side fields — presales,
 * mezzanine, risk grades — for them to fill in.
 */

import { computeCore } from './engine'
import type { FeasibilityInputs } from './types'

/** Shape matching the `deals` table columns the assessment form reads. */
export interface DealSeed {
  deal_type: 'construction' | 'subdivision'
  customer_group: string
  project_address: string
  loan_term_months: number
  build_term_months: number
  interest_rate: number
  gst_method: 'standard' | 'margin_scheme'
  sales_commission_rate: number
  land_acquisition_cost: number
  site_value: number
  preliminaries: number
  construction: number
  construction_contingency: number
  professional_fees: number
  council_contributions: number
  authority_fees: number
  legal_fees: number
  development_contingency: number
  marketing_selling_cost: number
  rates_taxes: number
  target_roc: number
  status: string
  deal_products: {
    num_lots: number
    description: string
    area_sqm: number
    gross_aic_valuation: number
    qualifying_presale_value: number
    non_qualifying_presale_value: number
  }[]
}

export function feasibilityToDealSeed(inputs: FeasibilityInputs): DealSeed {
  const core = computeCore(inputs)
  const a = core.amounts

  // The feasibility bundles consultants, council contributions and DBP
  // compliance into one planning bucket. The deal schema splits contributions
  // out, so unpick them here rather than dumping the lot into one field.
  const contributions =
    inputs.devType === 'subdivision' ? inputs.yield * 38_000 : inputs.yield * 28_000
  const consultantsAndOther = Math.max(0, a.planning_design - contributions)

  // Site value in the deal model is the land itself; duty and legals are
  // separate acquisition lines.
  const siteValue = inputs.purchasePrice
  const acquisitionExtras = Math.max(0, a.acquisition - inputs.purchasePrice)

  // The build window, excluding the design and sales periods either side.
  const buildTerm = Math.max(
    1,
    Math.round(core.effectiveDurationMonths - Math.min(6, core.effectiveDurationMonths * 0.25) - 1)
  )

  return {
    deal_type: inputs.devType === 'subdivision' ? 'subdivision' : 'construction',
    customer_group: inputs.projectName || 'Feasibility import',
    project_address: inputs.suburbOrAddress || inputs.projectName || 'Not specified',
    loan_term_months: Math.round(core.effectiveDurationMonths),
    build_term_months: buildTerm,
    interest_rate: inputs.overrides.interestRate ?? 0.0999,
    // The deal engine's margin-scheme branch expects the same inputs, so carry
    // the client's GST treatment across rather than silently defaulting.
    gst_method: inputs.gstTreatment === 'margin_scheme' ? 'margin_scheme' : 'standard',
    sales_commission_rate: 0.022,
    land_acquisition_cost: inputs.purchasePrice,
    site_value: siteValue,
    preliminaries: 0,
    construction: a.construction,
    construction_contingency: a.contingency,
    professional_fees: a.professional_fees + consultantsAndOther,
    council_contributions: contributions,
    authority_fees: 0,
    legal_fees: acquisitionExtras,
    // The overrun buffer has no equivalent field, so it lands in the
    // development contingency where a credit analyst will see it.
    development_contingency: a.overrun,
    marketing_selling_cost: a.marketing_selling,
    rates_taxes: a.holding,
    target_roc: inputs.targetMargin,
    status: 'draft',
    deal_products: [
      {
        num_lots: inputs.yield,
        description:
          inputs.devType === 'subdivision'
            ? 'Lots (from feasibility)'
            : `${inputs.devType.replace(/_/g, ' ')} (from feasibility)`,
        area_sqm: inputs.avgDwellingSqm,
        gross_aic_valuation: inputs.salePricePerDwelling,
        qualifying_presale_value: 0,
        non_qualifying_presale_value: 0,
      },
    ],
  }
}
