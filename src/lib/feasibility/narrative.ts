/**
 * "Here's how the numbers were built" — the model explaining itself in prose.
 *
 * A client will not audit a spreadsheet, but they will read a paragraph. This
 * is the layer that turns the cost stack into something a person can check line
 * by line and argue with.
 */

import { sellsOnCompletion } from './engine'
import { area, money, percent, ratePerSqm, safeDiv } from './trace'
import * as R from './rates'
import { CONFIDENCE_LABELS } from './labels'
import type { FeasibilityInputs, FeasibilityResults, NarrativeSection } from './types'

export function buildNarrative(
  inputs: FeasibilityInputs,
  results: FeasibilityResults
): NarrativeSection[] {
  const sections: NarrativeSection[] = []
  const amount = (key: string) => results.buckets.find((b) => b.key === key)?.value ?? 0

  const unit = inputs.devType === 'subdivision' ? 'lot' : 'dwelling'
  const unitPlural = inputs.devType === 'subdivision' ? 'lots' : 'dwellings'

  // --- revenue ---
  if (sellsOnCompletion(inputs.mode)) {
    sections.push({
      heading: 'Revenue',
      bullets: [
        `Gross realisation of **${money(results.grossRevenue)}** comes from **${inputs.yield} ${unitPlural}** selling at an average of **${money(inputs.salePricePerDwelling)}** each.`,
        `That is **${money(safeDiv(results.grossRevenue, results.totalGfaSqm))}** per square metre of the **${area(results.totalGfaSqm)}** you are building.`,
      ],
    })
  } else if (results.hold) {
    sections.push({
      heading: 'Income & value',
      bullets: [
        `Gross rent of **${money(results.hold.grossAnnualRent)}** a year, less **${percent(R.RENTAL_OUTGOINGS_PCT, 0)}** for management, vacancy, repairs and insurance, gives net rent of **${money(results.hold.netAnnualRent)}**.`,
        `Capitalised at **${percent(inputs.exitCapRate)}**, that values the completed holding at **${money(results.hold.completedValue)}**.`,
      ],
    })
  }

  // --- construction ---
  const constructionBullets: string[] = []
  if (inputs.boq.touched) {
    constructionBullets.push(
      `Construction of **${money(amount('construction'))}** comes from your bill of quantities — **${inputs.boq.lines.length}** priced lines, which replaces the rate-library figure entirely.`
    )
  } else if (inputs.devType === 'subdivision') {
    constructionBullets.push(
      `Civil works land at **${money(amount('construction'))}** — **${inputs.yield} ${unitPlural}** at an indicative **${money(R.SUBDIVISION_CIVILS_PER_LOT.point)}** per lot for roads, drainage, services and earthworks.`
    )
  } else if (amount('construction') > 0) {
    const rate = results.constructionRatePerSqm
    constructionBullets.push(
      `Construction lands at **${money(amount('construction'))}** — **${area(results.totalGfaSqm)}** of gross floor area at **${ratePerSqm(results.constructionRatePerSqm.value)}**.`
    )
    if (rate.range && !rate.overridden) {
      constructionBullets.push(
        `That rate is a Sydney metro **${inputs.qualityTier.replace(/_/g, '-')}** ${inputs.devType.replace(/_/g, ' ')} build on a **${inputs.siteDifficulty.replace(/_/g, ' ')}** site, from the rate library at **${CONFIDENCE_LABELS[rate.confidence].toLowerCase()}**. Plausible range: **${ratePerSqm(rate.range.low)} – ${ratePerSqm(rate.range.high)}**.`
      )
    }
    constructionBullets.push(
      inputs.builderContract === 'fixed_price'
        ? `On a fixed-price contract the builder's overhead and margin is already inside that rate.`
        : `On a cost-plus contract the builder's margin is added separately, at **${percent(R.COST_PLUS_MARGIN, 0)}** on cost.`
    )
  }
  if (constructionBullets.length > 0) {
    sections.push({ heading: 'Construction cost', bullets: constructionBullets })
  }

  // --- acquisition ---
  const acquisitionBullets: string[] = []
  if (inputs.mode === 'ppr' && inputs.pprSubMode === 'knock_down_rebuild') {
    acquisitionBullets.push(
      `You already own the land, so there is **no acquisition stamp duty** — normally the single largest one-off cost in a purchase. What you add instead is demolition and disconnecting the existing services.`
    )
  } else {
    acquisitionBullets.push(
      `Acquisition totals **${money(amount('acquisition'))}** — the **${money(inputs.purchasePrice)}** purchase plus **${money(amount('acquisition') - inputs.purchasePrice)}** of NSW transfer duty, legals, due diligence and settlement adjustments.`
    )
    acquisitionBullets.push(
      `Transfer duty alone is **${money(results.statutory.stampDuty.value)}**, against the Revenue NSW schedule for **1 July 2025 – 30 June 2026**. The thresholds re-index every July.`
    )
    if (inputs.buyersAgentEngaged) {
      acquisitionBullets.push(
        `A buyer's agent is included at **${percent(R.BUYERS_AGENT_PCT.point)}** of the purchase price, within the usual ${money(R.BUYERS_AGENT_MIN)}–${money(R.BUYERS_AGENT_MAX)} band.`
      )
    }
  }
  sections.push({ heading: 'Acquisition', bullets: acquisitionBullets })

  // --- soft costs, finance, contingency ---
  const softBullets: string[] = [
    `Planning and design — architect, engineers, planners, certifier, plus council and authority contributions — adds **${money(amount('planning_design'))}**. Contributions vary enormously by council, so this line carries **low confidence** and should be verified.`,
  ]

  if (results.classification.dbpApplies) {
    softBullets.push(
      `Because this is a **${results.classification.nccClass === 'class_2' ? 'Class 2' : 'Class 9c'}** building, the NSW DBP Act 2020 applies — an extra **${money(results.classification.dbpCostUplift)}** of registered-practitioner fees and **${results.classification.dbpProgramMonths} months** of program, both included above.`
    )
  }

  softBullets.push(
    `Project management, QS, insurance and other professional fees add **${money(amount('professional_fees'))}**${results.statutory.hbcfPremium.value > 0 ? `, including a **${money(results.statutory.hbcfPremium.value)}** HBCF premium` : ''}.`
  )

  if (amount('marketing_selling') > 0) {
    softBullets.push(
      `Marketing, agent commission and legals on sale add **${money(amount('marketing_selling'))}** — about **${percent(R.AGENT_COMMISSION_PCT.point)}** commission and **${percent(R.MARKETING_PCT.point)}** campaign on gross realisation.`
    )
  }

  if (amount('finance') > 0) {
    const rate = inputs.overrides.interestRate ?? R.FINANCE_BANDS[inputs.financeProfile].interestRate
    const ltc = inputs.overrides.loanToCost ?? R.FINANCE_BANDS[inputs.financeProfile].loanToCost
    softBullets.push(
      `Finance — interest plus establishment and line fees — adds **${money(amount('finance'))}** at an indicative **${percent(rate)}** and **${percent(ltc, 0)}** loan-to-cost. Peak debt of **${money(results.peakDebt)}** lands in **month ${results.peakDebtMonth}**. Replace this with a real lender quote before relying on it.`
    )
  } else {
    softBullets.push(`This is modelled as cash-funded, so there is no interest or facility cost.`)
  }

  softBullets.push(
    `Holding costs — council rates, NSW land tax, utilities and insurance while you hold the site — add **${money(amount('holding'))}** over the project's life.`
  )

  const contingencyBase = amount('construction') + amount('planning_design') + amount('professional_fees')
  softBullets.push(
    `Contingency of **${money(amount('contingency'))}** reflects the **${inputs.projectStage.replace(/_/g, ' ')}** stage — **${percent(R.CONTINGENCY_BY_STAGE[inputs.projectStage], 1)}** of the **${money(contingencyBase)}** of construction, design and professional fees. Earlier stages carry more, because more is unknown; it shrinks as the builder's price hardens.`
  )
  softBullets.push(
    `On top of that sits an overrun buffer of **${money(amount('overrun'))}** at **${percent(inputs.overrunBuffer)}**. Contingency covers unknowns you have not priced; the overrun buffer covers things you *have* priced that slip anyway — weather, scope creep, late deliveries, prices moving between estimate and order.`
  )

  sections.push({ heading: 'Soft costs, finance & contingency', bullets: softBullets })

  // --- the bottom line ---
  const bottomBullets: string[] = [
    `Total development cost is **${money(results.totalDevelopmentCost)}**.`,
  ]

  if (sellsOnCompletion(inputs.mode)) {
    bottomBullets.push(
      `Against gross realisation of **${money(results.grossRevenue)}**, the deal yields **${money(results.netProfit)}** — a **${percent(results.marginOnCost)}** margin on cost and **${percent(results.marginOnRevenue)}** on revenue.`
    )
    const delta = results.marginOnCost - inputs.targetMargin
    bottomBullets.push(
      delta >= 0
        ? `That is **${percent(delta)}** above your **${percent(inputs.targetMargin)}** target — the deal meets your benchmark.`
        : `That is **${percent(Math.abs(delta))}** below your **${percent(inputs.targetMargin)}** target.`
    )
    if (amount('taxes_duties') > 0) {
      bottomBullets.push(
        `GST of **${money(amount('taxes_duties'))}** is included, calculated under the margin scheme as one eleventh of the **${money(results.grossRevenue - amount('acquisition'))}** margin between sale prices and acquisition cost.`
      )
    }
  }

  bottomBullets.push(
    `Required equity is **${money(results.requiredEquity)}** with peak debt of **${money(results.peakDebt)}**. Return on equity comes in at **${percent(results.returnOnEquity)}**${results.cashflow.irr !== null ? `, and the annualised IRR on the equity cashflow is **${percent(results.cashflow.irr)}**` : ''}.`
  )

  sections.push({ heading: 'The bottom line', bullets: bottomBullets })

  // --- what would change the answer ---
  if (sellsOnCompletion(inputs.mode)) {
    sections.push({
      heading: 'What would change the answer',
      bullets: [
        `Break-even is **${money(results.breakEvenPerDwellingAdjusted)}** per ${unit} — sale prices can fall **${percent(results.priceDropHeadroom)}** before the deal stops making money. That accounts for the GST and commission you would save at a lower price.`,
        `At your **${percent(inputs.targetMargin)}** target margin, the maximum supportable purchase price is **${money(results.maxSupportablePurchasePrice)}** — **${money(Math.abs(results.landHeadroom))}** ${results.landHeadroom >= 0 ? 'of headroom above' : 'more than'} the **${money(inputs.purchasePrice)}** you are paying. That is solved rather than estimated, because paying more for land also lifts stamp duty and shrinks the GST margin.`,
      ],
    })
  }

  return sections
}
