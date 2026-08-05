/**
 * Plain-English read on the numbers — risks, opportunities, and what to verify
 * next, sorted most-urgent first.
 *
 * The rule for every insight: say what the number is, say why it matters, and
 * say what to do about it. An insight the client cannot act on is noise.
 *
 * Thresholds here deliberately use the same bases as the engine, so an insight
 * can never contradict the figure it is describing.
 */

import { sellsOnCompletion } from './engine'
import { profileFor } from './jurisdictions'
import { premiumDutyThreshold } from './statutory'
import { money, percent, safeDiv } from './trace'
import * as R from './rates'
import { DTI_HOT_ZONE } from './rates'
import type { FeasibilityInputs, FeasibilityResults, InsightItem } from './types'

const SEVERITY_ORDER: Record<InsightItem['severity'], number> = {
  critical: 0,
  warning: 1,
  info: 2,
  positive: 3,
}

export function buildInsights(
  inputs: FeasibilityInputs,
  results: FeasibilityResults
): InsightItem[] {
  const items: InsightItem[] = []

  const bucket = (key: string) => results.buckets.find((b) => b.key === key)
  const construction = bucket('construction')?.value ?? 0
  const planning = bucket('planning_design')?.value ?? 0
  const professional = bucket('professional_fees')?.value ?? 0
  const contingency = bucket('contingency')?.value ?? 0

  // --- the verdict itself ---
  if (sellsOnCompletion(inputs.mode)) {
    if (results.verdict === 'feasible') {
      items.push({
        severity: 'positive',
        category: 'verdict',
        title: `Deal looks feasible at a ${percent(results.marginOnCost)} margin on cost`,
        body: `You are above your target margin of ${percent(inputs.targetMargin)}, with ${money(results.netProfit)} of profit on ${money(results.totalDevelopmentCost)} of cost.`,
        nextStep: 'Validate the riskiest inputs before you commit — see the items below.',
      })
    } else if (results.verdict === 'marginal') {
      items.push({
        severity: 'warning',
        category: 'verdict',
        title: `Margin of ${percent(results.marginOnCost)} sits just under your ${percent(inputs.targetMargin)} target`,
        body: `Profit of ${money(results.netProfit)} is real, but the buffer is thin. At this margin a single adverse movement — a slower sales campaign, a variation, a rate rise — can take the deal to break-even.`,
        nextStep: 'Test the conservative scenario before committing, and look for cost or yield upside.',
      })
    } else {
      items.push({
        severity: 'critical',
        category: 'verdict',
        title:
          results.netProfit > 0
            ? `Margin of ${percent(results.marginOnCost)} is well short of your ${percent(inputs.targetMargin)} target`
            : 'This deal loses money on the current inputs',
        body:
          results.netProfit > 0
            ? `The deal makes ${money(results.netProfit)}, but not enough to compensate for the risk you are taking.`
            : `Total development cost of ${money(results.totalDevelopmentCost)} exceeds gross realisation of ${money(results.grossRevenue)}, for a loss of ${money(Math.abs(results.netProfit))}.`,
        nextStep: `The maximum you could pay for this site at your target margin is ${money(results.maxSupportablePurchasePrice)} — ${money(Math.abs(results.landHeadroom))} ${results.landHeadroom < 0 ? 'below' : 'above'} the ${money(inputs.purchasePrice)} in your inputs.`,
      })
    }
  }

  // --- contingency adequacy, on the same base the engine uses ---
  const contingencyBase = construction + planning + professional
  const contingencyPct = safeDiv(contingency, contingencyBase)
  const conventional = R.CONTINGENCY_BY_STAGE.early_feasibility

  if (contingencyBase > 0 && contingencyPct < conventional * 0.8) {
    items.push({
      severity: 'warning',
      category: 'contingency',
      title: `Contingency at ${percent(contingencyPct)} is thin for a ${inputs.projectStage.replace(/_/g, ' ')} project`,
      body: `At early stages around ${percent(conventional, 0)} of construction, design and professional fees is conventional. You are below that, so a single unpriced item — a geotech surprise, a services upgrade, an unexpected demolition cost — can take out the margin.`,
      nextStep:
        'If the design is more advanced than the stage you selected, update the stage. Otherwise pin a higher contingency in Pro Mode.',
    })
  }

  // --- the lines nobody remembers ---
  if (results.statutory.landTaxPerYear.value > 0) {
    items.push({
      severity: 'warning',
      category: 'land tax',
      title: `${inputs.jurisdiction} land tax of ${money(results.statutory.landTaxPerYear.value)} a year applies while you hold this site`,
      body: `Land tax is assessed annually on land that is not your principal place of residence — including a development site sitting idle waiting on DA or construction. Over a ${Math.round(results.cashflow.rows.length)}-month program that is ${money(results.statutory.landTaxOverProject.value)}. It is assessed on every parcel you own in the state added together, so this figure is for the site in isolation.`,
      nextStep:
        'Confirm the valuer-general’s unimproved land value rather than relying on the purchase price as a proxy, and check whether any exemption applies.',
    })
  }

  if (results.statutory.stampDuty.value > 0) {
    const isPremium = inputs.purchasePrice > premiumDutyThreshold(inputs.jurisdiction)
    items.push({
      severity: 'info',
      category: 'stamp duty',
      title: `Transfer duty on this purchase is ${money(results.statutory.stampDuty.value)}`,
      body: isPremium
        ? 'The purchase price is above the premium property duty threshold, so the top rate applies. This is the single largest one-off cost after the land itself.'
        : 'Duty is payable on settlement and is not financeable in most development facilities — it has to come out of equity.',
      nextStep: `Confirm the figure against the current ${inputs.jurisdiction} schedule; the year that applies is set by your contract date, not settlement.`,
    })
  }

  // Duty of zero on a real purchase is worth calling out, because it looks like
  // a bug to anyone who has bought land in another state.
  if (
    results.statutory.stampDuty.value === 0 &&
    inputs.purchasePrice > 0 &&
    results.statutory.dutyRegime === 'commercial'
  ) {
    items.push({
      severity: 'positive',
      category: 'stamp duty',
      title: `No ${inputs.jurisdiction} conveyance duty on non-residential land`,
      body: profileFor(inputs.jurisdiction).commercialDutyNote,
      nextStep:
        'Have your conveyancer confirm the land qualifies as non-residential at settlement — the test turns on use and zoning, and getting it wrong is the whole duty line.',
    })
  }

  // --- DBP / classification ---
  if (results.classification.dbpApplies) {
    items.push({
      severity: 'warning',
      category: 'compliance',
      title: `${inputs.jurisdiction} ${results.classification.regimeName} applies — ${results.classification.nccClass === 'class_2' ? 'Class 2' : 'Class 9c'}`,
      body: `${results.classification.reasoning} That brings in registered practitioners and regulated design declarations on every regulated design — roughly ${money(results.classification.dbpCostUplift)} of extra fees and ${results.classification.dbpProgramMonths} months of program.`,
      nextStep: results.classification.inferred
        ? 'Set the title type explicitly in your inputs to firm this up — Torrens title would avoid it entirely.'
        : 'Verify every practitioner on the public register before you sign a building contract.',
    })
  }

  // --- presale coverage, which is what gets a facility approved ---
  if (sellsOnCompletion(inputs.mode) && results.peakDebt > 0) {
    const cover = safeDiv(inputs.presalesShare * results.grossRevenue, results.peakDebt)
    if (inputs.presalesShare <= 0) {
      items.push({
        severity: 'warning',
        category: 'presales',
        title: 'No presales assumed',
        body: `Most lenders will not fund a residential development facility without presales covering 50–70% of gross realisation. With none, this deal is modelled as fully speculative, which in practice means either a much higher interest rate or no facility at all.`,
        nextStep:
          'Add whatever you realistically expect to pre-sell in Step 4 and watch peak debt and IRR respond.',
      })
    } else {
      items.push({
        severity: cover >= 1 ? 'positive' : 'info',
        category: 'presales',
        title: `Presales of ${percent(inputs.presalesShare)} cover ${percent(cover)} of peak debt`,
        body: `${money(inputs.presalesShare * results.grossRevenue)} of contracted sales against peak debt of ${money(results.peakDebt)}. Lenders test coverage against the facility, not against total cost.`,
        nextStep:
          inputs.presalesSettleMonth > 0 && inputs.presalesSettleMonth < inputs.durationMonths
            ? `Those settlements land in month ${inputs.presalesSettleMonth}, which is already reducing your peak debt and interest.`
            : 'Settling some of these before practical completion would cut peak debt and interest further.',
      })
    }
  }

  // --- finance ---
  if (results.peakDebt > 0) {
    const coverage = safeDiv(results.peakDebt, results.grossRevenue)
    items.push({
      severity: coverage > 0.7 ? 'warning' : 'info',
      category: 'finance',
      title: `Peak debt of ${money(results.peakDebt)} is ${percent(coverage)} of gross realisation`,
      body:
        coverage > 0.7
          ? 'That is high. Lenders typically want presales covering 50–70% of gross realisation at this leverage, and will price the facility accordingly.'
          : 'Typical lender expectation is presale coverage of 50–70% of gross realisation. This sits inside that band, but the presale program still drives whether the facility gets approved.',
      nextStep: `Peak debt lands in month ${results.peakDebtMonth}. Take the monthly cashflow to your broker rather than an average — the peak is what gets credit-approved.`,
    })
  }

  if (results.cashflow.irr !== null && sellsOnCompletion(inputs.mode)) {
    items.push({
      severity: 'info',
      category: 'return',
      title: `IRR on equity is ${percent(results.cashflow.irr)} annualised`,
      body: `Equity of ${money(results.cashflow.equityIn)} goes in and ${money(results.cashflow.equityOut)} comes back${results.cashflow.equityMultiple ? `, an equity multiple of ${results.cashflow.equityMultiple.toFixed(2)}×` : ''}. IRR is time-weighted, so it rewards getting money back sooner — margin on cost does not.`,
      nextStep: 'Compare this against what the same equity would earn in your next-best deal, not against a bank rate.',
    })
  }

  // --- break-even headroom ---
  if (sellsOnCompletion(inputs.mode) && results.priceDropHeadroom > 0) {
    items.push({
      severity: results.priceDropHeadroom < 0.1 ? 'warning' : 'info',
      category: 'break-even',
      title: `Sale prices can fall ${percent(results.priceDropHeadroom)} before this deal stops making money`,
      body: `Break-even is ${money(results.breakEvenPerDwellingAdjusted)} per dwelling against your ${money(inputs.salePricePerDwelling)} expectation. That break-even accounts for the GST and commission you would save at a lower price.`,
      nextStep:
        results.priceDropHeadroom < 0.1
          ? 'Under 10% of headroom is tight for a project of this length — stress the sale price before committing.'
          : 'Sanity-check your sale price against recent comparable settlements, not asking prices.',
    })
  }

  // --- construction rate sanity ---
  const rate = results.constructionRatePerSqm
  if (rate.range && !rate.overridden) {
    items.push({
      severity: 'info',
      category: 'construction',
      title: `Build rate assumed at ${money(rate.value)}/m²`,
      body: `The plausible range for this scheme is ${money(rate.range.low)}/m² to ${money(rate.range.high)}/m². At the top of that range construction alone would be ${money(results.totalGfaSqm * rate.range.high)} — ${money(results.totalGfaSqm * (rate.range.high - rate.value))} more than assumed.`,
      nextStep: 'Replace this with a builder quote or a QS estimate as soon as you have one — it is the largest single line in the model.',
    })
  }

  // --- low-confidence lines ---
  const lowConfidence = results.buckets.filter((b) => b.confidence === 'low' && b.value > 0)
  if (lowConfidence.length > 0) {
    items.push({
      severity: 'info',
      category: 'confidence',
      title: `${lowConfidence.length} cost ${lowConfidence.length === 1 ? 'line carries' : 'lines carry'} low confidence`,
      body: `${lowConfidence.map((b) => b.label).join(', ')} — together ${money(lowConfidence.reduce((s, b) => s + b.value, 0))}, or ${percent(safeDiv(lowConfidence.reduce((s, b) => s + b.value, 0), results.totalDevelopmentCost))} of total cost. These vary genuinely by council, lender and site.`,
      nextStep: 'Verify these before you exchange. They are the lines most likely to move against you.',
    })
  }

  // --- mode-specific ---
  if (results.ppr) items.push(...pprInsights(inputs, results))
  if (results.renovation) items.push(...renovationInsights(results))
  if (results.hold) items.push(...holdInsights(results))

  return items.sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity])
}

function pprInsights(inputs: FeasibilityInputs, results: FeasibilityResults): InsightItem[] {
  const ppr = results.ppr!
  const items: InsightItem[] = []

  if (ppr.cashShortfall > 0) {
    items.push({
      severity: 'critical',
      category: 'funding gap',
      title: `You are ${money(ppr.cashShortfall)} short of funding this build`,
      body: `Releasable equity is ${money(ppr.releasableEquity)} — conventionally 80% of your home's ${money(inputs.currentHomeValue)} value, less the ${money(inputs.outstandingMortgage)} still owing. The build costs ${money(ppr.buildCost)}, so the gap has to come from cash or a higher-LVR loan.`,
      nextStep: 'Either reduce scope, or confirm with your broker whether a lender will go above 80% on the completed value.',
    })
  } else {
    items.push({
      severity: 'positive',
      category: 'funding',
      title: 'Releasable equity covers the build',
      body: `Equity of ${money(ppr.releasableEquity)} covers the ${money(ppr.buildCost)} build cost, so no cash top-up is needed on these numbers.`,
    })
  }

  if (ppr.lmiPayable > 0) {
    items.push({
      severity: 'warning',
      category: 'LMI',
      title: `LVR of ${percent(ppr.lvr)} triggers about ${money(ppr.lmiPayable)} of LMI`,
      body: 'Crossing 80% of the completed value means Lenders Mortgage Insurance, a one-off premium usually capitalised onto the loan — so you pay interest on it for the life of the mortgage.',
      nextStep: 'Getting under 80% avoids it entirely. Compare the premium against the cost of contributing more equity.',
    })
  }

  if (ppr.dti >= DTI_HOT_ZONE) {
    items.push({
      severity: 'critical',
      category: 'serviceability',
      title: `Debt-to-income of ${ppr.dti.toFixed(1)} is in the regulator's hot zone`,
      body: `A DTI at or above ${DTI_HOT_ZONE.toFixed(1)} attracts additional scrutiny and many lenders will decline outright. Total debt of ${money(ppr.loanRequired + inputs.existingOtherDebt)} against household income of ${money(inputs.householdIncome)} is the driver.`,
      nextStep: 'Reduce the loan, pay down other debt, or reconsider the scope before you apply.',
    })
  } else if (!ppr.serviceable && inputs.householdIncome > 0) {
    items.push({
      severity: 'warning',
      category: 'serviceability',
      title: 'Repayments look tight against a conservative serviceability test',
      body: `Monthly repayments of ${money(ppr.monthlyRepayment)} are assessed with a ${percent(R.SERVICEABILITY_BUFFER, 0)} buffer on top of the actual rate, which is how lenders test them.`,
      nextStep: 'Get a broker to run a real serviceability assessment before committing to a builder.',
    })
  }

  if (ppr.dutySaved > 0) {
    items.push({
      severity: 'positive',
      category: 'stamp duty',
      title: `Rebuilding avoids about ${money(ppr.dutySaved)} of stamp duty`,
      body: 'Because you already own the land there is no acquisition duty — the single largest one-off cost in buying somewhere else. What you add instead is demolition and service disconnection.',
    })
  }

  return items
}

function renovationInsights(results: FeasibilityResults): InsightItem[] {
  const reno = results.renovation!
  const items: InsightItem[] = []

  items.push({
    severity: reno.equityGain > 0 ? 'positive' : 'critical',
    category: 'equity gain',
    title:
      reno.equityGain > 0
        ? `This renovation adds ${money(reno.equityGain)} more value than it costs`
        : `This renovation costs ${money(Math.abs(reno.equityGain))} more than the value it adds`,
    body: `Spending ${money(reno.spend)} takes the property from ${money(reno.valueBefore)} to ${money(reno.valueAfter)}. The equity gain is the value uplift less what you spent to get it.`,
    nextStep:
      reno.equityGain > 0
        ? 'Sanity-check the post-renovation value against recent comparable settlements for the finished configuration.'
        : 'Reduce scope, or look at whether a rebuild produces a better result for similar money.',
  })

  if (reno.aboveValueCeiling) {
    items.push({
      severity: 'warning',
      category: 'value ceiling',
      title: `The finished value sits ${money(Math.abs(reno.ceilingHeadroom))} above the suburb median for this configuration`,
      body: 'Buyers anchor hard to comparable sales. Pushing materially above the suburb median for the bed-count config is risky money — the last dollars spent are the least likely to come back.',
      nextStep: 'Trim the specification back towards the median, or accept that the top of the spend is lifestyle rather than investment.',
    })
  }

  if (reno.rebuildLikelyBetter) {
    items.push({
      severity: 'warning',
      category: 'rebuild crossover',
      title: `Build cost is ${percent(reno.crossoverRatio)} of the finished value — past the rebuild crossover`,
      body: `Once construction passes about ${percent(R.REBUILD_CROSSOVER_RATIO, 0)} of post-renovation value, knocking down and building new is often cheaper per square metre and produces a more sellable house — no compromises around retained structure.`,
      nextStep: 'Run the same site as a knock-down rebuild and compare the two side by side.',
    })
  }

  return items
}

function holdInsights(results: FeasibilityResults): InsightItem[] {
  const hold = results.hold!
  const items: InsightItem[] = []

  items.push({
    severity: 'info',
    category: 'yield',
    title: `Yield on cost is ${percent(hold.yieldOnCost)}`,
    body: `Net rent of ${money(hold.netAnnualRent)} against total development cost of ${money(results.totalDevelopmentCost)}. Yield on cost is the number that tells you whether developing to hold beat simply buying the finished product at ${money(hold.completedValue)}.`,
    nextStep: 'Compare yield on cost against the market cap rate — if it is lower, buying is the better trade.',
  })

  if (Number.isFinite(hold.dscr) && hold.dscr < 1.25 && hold.annualDebtService > 0) {
    items.push({
      severity: hold.dscr < 1 ? 'critical' : 'warning',
      category: 'debt service',
      title: `Debt service cover of ${hold.dscr.toFixed(2)}× is below the usual 1.25× requirement`,
      body:
        hold.dscr < 1
          ? `Net rent of ${money(hold.netAnnualRent)} does not cover annual debt service of ${money(hold.annualDebtService)} — the holding is cashflow negative before tax.`
          : `Net rent covers debt service, but with less headroom than most lenders require when refinancing a construction facility to a term loan.`,
      nextStep: 'Plan to contribute equity on refinance, or model a lower-leverage term facility.',
    })
  }

  return items
}
