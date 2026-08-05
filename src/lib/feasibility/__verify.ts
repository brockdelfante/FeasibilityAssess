/**
 * Numeric sanity check against a published worked example.
 *
 * Run with: npx tsc --outDir /tmp/fv --module commonjs --target es2020 \
 *   --moduleResolution node src/lib/feasibility/__verify.ts && node /tmp/fv/lib/feasibility/__verify.js
 *
 * Not a unit-test suite — a harness that prints the cost stack for a known
 * scheme so the statutory lines can be eyeballed against the source schedules.
 */

import { computeCore, defaultFeasibilityInputs, runFeasibility } from './engine'
import { nswLandTaxAmount, nswStampDutyAmount, gstMarginSchemeAmount } from './statutory'
import { runScenarios, runSensitivity, runScaleRecommendation, solveAll } from './scenarios'
import { money, percent } from './trace'

function check(label: string, actual: number, expected: number, tolerance = 1) {
  const pass = Math.abs(actual - expected) <= tolerance
  const mark = pass ? 'PASS' : 'FAIL'
  console.log(
    `${mark}  ${label.padEnd(44)} actual=${money(actual)}  expected=${money(expected)}${pass ? '' : `  DIFF=${money(actual - expected)}`}`
  )
  return pass
}

console.log('\n=== Statutory schedules (independent of the engine) ===\n')

// Revenue NSW FY2025-26: $50,212 + $5.50 per $100 over $1,240,000.
check('Stamp duty on $2,000,000', nswStampDutyAmount(2_000_000), 92_012)
// Premium band base, at the threshold exactly.
check('Stamp duty on $3,721,000', nswStampDutyAmount(3_721_000), 186_667)
// Land tax: $100 + 1.6% of the excess over $1,075,000.
check('Land tax on $2,000,000', nswLandTaxAmount(2_000_000, false), 14_900)
// At the premium threshold the general band has accumulated to $88,036.
check('Land tax on $6,571,000', nswLandTaxAmount(6_571_000, false), 88_036)
check('Land tax below threshold', nswLandTaxAmount(1_000_000, false), 0)
check('Land tax when exempt', nswLandTaxAmount(5_000_000, true), 0)
// Margin scheme: 1/11 of (revenue - acquisition).
check('GST margin scheme on $9.6M / $2.0M', gstMarginSchemeAmount(9_600_000, 2_000_000), 690_909, 1)

console.log('\n=== Worked example: 4 townhouses, $2.0M site, $2.4M each ===\n')

const inputs = {
  ...defaultFeasibilityInputs,
  yield: 4,
  avgDwellingSqm: 220,
  purchasePrice: 2_000_000,
  salePricePerDwelling: 2_400_000,
  devType: 'townhouse' as const,
  qualityTier: 'standard' as const,
  siteDifficulty: 'normal' as const,
  projectStage: 'early_feasibility' as const,
  durationMonths: 22,
  targetMargin: 0.18,
  councilRatesPerYear: 3_000,
  titleType: 'strata' as const,
}

const core = computeCore(inputs)
const results = runFeasibility(inputs)

console.log(`Gross revenue                ${money(core.grossRevenue)}`)
console.log(`Total GFA                    ${core.totalGfaSqm} m²`)
console.log(`Construction rate            ${money(core.constructionRate)}/m²`)
console.log('')
for (const bucket of results.buckets) {
  console.log(
    `  ${bucket.label.padEnd(24)} ${money(bucket.value).padStart(14)}   ${bucket.confidence}${bucket.overridden ? ' (overridden)' : ''}`
  )
}
console.log(`  ${'TOTAL DEVELOPMENT COST'.padEnd(24)} ${money(core.totalDevelopmentCost).padStart(14)}`)
console.log('')
console.log(`Net profit                   ${money(results.netProfit)}`)
console.log(`Margin on cost               ${percent(results.marginOnCost)}`)
console.log(`Return on equity             ${percent(results.returnOnEquity)}`)
console.log(`IRR (annualised)             ${results.cashflow.irr === null ? 'n/a' : percent(results.cashflow.irr)}`)
console.log(`Required equity              ${money(results.requiredEquity)}`)
console.log(`Peak debt                    ${money(results.peakDebt)} (month ${results.peakDebtMonth})`)
console.log(`Break-even per dwelling      ${money(results.breakEvenPerDwellingAdjusted)}`)
console.log(`Price drop headroom          ${percent(results.priceDropHeadroom)}`)
console.log(`Max supportable land         ${money(results.maxSupportablePurchasePrice)}`)
console.log(`Verdict                      ${results.verdict} — ${results.verdictReason}`)

console.log('\n--- Statutory lines reconciled inside the model ---')
console.log(`Stamp duty                   ${money(results.statutory.stampDuty.value)}`)
console.log(`Land tax per year            ${money(results.statutory.landTaxPerYear.value)}`)
console.log(`Land tax over project        ${money(results.statutory.landTaxOverProject.value)}`)
console.log(`HBCF premium                 ${money(results.statutory.hbcfPremium.value)}`)
console.log(`GST on sale                  ${money(results.statutory.gst.value)}`)
console.log(`Council contributions        ${money(results.statutory.councilContributions.value)}`)

console.log('\n--- Classification ---')
console.log(`NCC class                    ${results.classification.nccClass}`)
console.log(`DBP applies                  ${results.classification.dbpApplies}`)
console.log(`DBP cost uplift              ${money(results.classification.dbpCostUplift)}`)
console.log(`DBP program impact           ${results.classification.dbpProgramMonths} months`)

console.log('\n--- Reconciliation checks ---\n')
// Acquisition should be purchase + duty + sundries, exactly.
check('Acquisition = purchase + duty + $14.5k', core.amounts.acquisition, 2_000_000 + 92_012 + 14_500)
// Professional fees = 4% of construction + 0.7% HBCF.
check(
  'Professional fees = 4% + HBCF 0.7%',
  core.amounts.professional_fees,
  core.amounts.construction * 0.047,
  2
)
// Selling = 2.2% + 1.2% of GRV + $1,500/dwelling.
check(
  'Selling = 3.4% of GRV + legals',
  core.amounts.marketing_selling,
  core.grossRevenue * 0.034 + 4 * 1_500,
  2
)
// Buckets must sum to the reported total.
const bucketSum = results.buckets.reduce((s, b) => s + b.value, 0)
check('Buckets sum to total dev cost', bucketSum, core.totalDevelopmentCost, 2)
// Profit identity.
check('Profit = revenue − cost', results.netProfit, core.grossRevenue - core.totalDevelopmentCost, 1)
// Finance must have converged: interest + fees == the finance bucket.
check('Finance = interest + fees', core.amounts.finance, core.interest + core.fees, 2)
// Break-even must actually produce zero profit.
const atBreakEven = computeCore({
  ...inputs,
  salePricePerDwelling: results.breakEvenPerDwellingAdjusted,
})
check('Profit at solved break-even ≈ 0', atBreakEven.netProfit, 0, 500)
// Max supportable land must actually produce the target margin.
const atMaxLand = computeCore({ ...inputs, purchasePrice: results.maxSupportablePurchasePrice })
console.log(
  `${Math.abs(atMaxLand.marginOnCost - 0.18) < 0.002 ? 'PASS' : 'FAIL'}  ${'Margin at max supportable land'.padEnd(44)} actual=${percent(atMaxLand.marginOnCost)}  expected=18.0%`
)

console.log('\n--- Scenarios ---')
for (const s of runScenarios(inputs)) {
  console.log(
    `  ${s.label.padEnd(14)} ${percent(s.marginOnCost).padStart(7)}  profit ${money(s.netProfit).padStart(12)}  TDC ${money(s.totalDevelopmentCost).padStart(12)}  ${s.verdict}`
  )
}

console.log('\n--- Sensitivity (margin on cost) ---')
console.log(`  ${'Lever'.padEnd(16)}${['-10%', '-5%', 'base', '+5%', '+10%'].map((h) => h.padStart(9)).join('')}`)
for (const row of runSensitivity(inputs)) {
  console.log(
    `  ${row.lever.padEnd(16)}${row.cells.map((c) => percent(c.marginOnCost).padStart(9)).join('')}`
  )
}

console.log('\n--- Scale recommender ---')
const scale = runScaleRecommendation(inputs)
console.log(
  `  Current:          ${scale.current?.yield} × ${scale.current?.dwellingSqm} m² → ${percent(scale.current?.marginOnCost ?? 0)} (${scale.current?.outcome})`
)
console.log(
  `  Smallest passing: ${scale.smallestPassing?.yield} × ${scale.smallestPassing?.dwellingSqm} m² → ${percent(scale.smallestPassing?.marginOnCost ?? 0)}`
)
console.log(`  Headroom:         ${percent(scale.headroomPp)}`)

console.log('\n--- What-if solver (to hit 18% margin) ---')
for (const s of solveAll(inputs, 0.18)) {
  const fmt = s.unit === 'money' ? money(s.solved) : s.unit === 'rate' ? `${money(s.solved)}/m²` : s.solved.toFixed(1)
  const cur = s.unit === 'money' ? money(s.current) : s.unit === 'rate' ? `${money(s.current)}/m²` : s.current.toFixed(1)
  console.log(
    `  ${s.label.padEnd(26)} now ${cur.padStart(14)} → needs ${fmt.padStart(14)}${s.unreachable ? '  (unreachable)' : ''}`
  )
}

console.log('\n--- Insights ---')
for (const i of results.insights) {
  console.log(`  [${i.severity}] ${i.title}`)
}

console.log('\n=== Mode smoke tests ===\n')
for (const mode of ['develop_to_hold', 'buy_to_hold', 'ppr', 'renovate'] as const) {
  const modeInputs = {
    ...inputs,
    mode,
    weeklyRentPerDwelling: 1_250,
    currentHomeValue: 1_800_000,
    outstandingMortgage: 400_000,
    householdIncome: 320_000,
    preRenoValue: 1_800_000,
    postRenoValue: 2_400_000,
    suburbMedianForConfig: 2_300_000,
    renovationScopeSqm: 80,
  }
  const r = runFeasibility(modeInputs)
  const finite =
    Number.isFinite(r.totalDevelopmentCost) &&
    Number.isFinite(r.netProfit) &&
    Number.isFinite(r.marginOnCost)
  console.log(
    `  ${mode.padEnd(18)} ${finite ? 'PASS' : 'FAIL'}  TDC ${money(r.totalDevelopmentCost).padStart(13)}  verdict=${r.verdict.padEnd(14)} insights=${r.insights.length}`
  )
  if (mode === 'ppr' && r.ppr) {
    console.log(
      `      releasable equity ${money(r.ppr.releasableEquity)}, shortfall ${money(r.ppr.cashShortfall)}, LVR ${percent(r.ppr.lvr)}, DTI ${r.ppr.dti.toFixed(2)}, serviceable=${r.ppr.serviceable}`
    )
  }
  if (mode === 'renovate' && r.renovation) {
    console.log(
      `      spend ${money(r.renovation.spend)}, equity gain ${money(r.renovation.equityGain)}, crossover ${percent(r.renovation.crossoverRatio)}, rebuild better=${r.renovation.rebuildLikelyBetter}`
    )
  }
  if (r.hold) {
    console.log(
      `      net rent ${money(r.hold.netAnnualRent)}, yield on cost ${percent(r.hold.yieldOnCost)}, DSCR ${r.hold.dscr.toFixed(2)}`
    )
  }
}

console.log('\n=== Edge cases: a blank form must not produce NaN ===\n')
const blank = {
  ...defaultFeasibilityInputs,
  yield: 0,
  avgDwellingSqm: 0,
  purchasePrice: 0,
  salePricePerDwelling: 0,
  durationMonths: 1,
}
const blankResults = runFeasibility(blank)
const blankFields: [string, number][] = [
  ['totalDevelopmentCost', blankResults.totalDevelopmentCost],
  ['netProfit', blankResults.netProfit],
  ['marginOnCost', blankResults.marginOnCost],
  ['returnOnEquity', blankResults.returnOnEquity],
  ['requiredEquity', blankResults.requiredEquity],
  ['peakDebt', blankResults.peakDebt],
  ['breakEvenPerDwelling', blankResults.breakEvenPerDwelling],
  ['costPerDwelling', blankResults.costPerDwelling],
]
for (const [name, value] of blankFields) {
  console.log(`  ${Number.isFinite(value) ? 'PASS' : 'FAIL'}  ${name.padEnd(24)} ${value}`)
}

// Cash-funded must produce no interest at all.
const cashFunded = computeCore({ ...inputs, financeProfile: 'cash' })
console.log(
  `\n  ${cashFunded.amounts.finance === 0 && cashFunded.peakDebt === 0 ? 'PASS' : 'FAIL'}  cash-funded has no debt and no finance cost (finance=${money(cashFunded.amounts.finance)}, peak=${money(cashFunded.peakDebt)})`
)

// A Torrens-titled duplex must escape the DBP regime.
const torrens = runFeasibility({ ...inputs, devType: 'duplex', yield: 2, titleType: 'torrens' })
console.log(
  `  ${!torrens.classification.dbpApplies ? 'PASS' : 'FAIL'}  Torrens duplex avoids the DBP Act (class=${torrens.classification.nccClass})`
)
const strata = runFeasibility({ ...inputs, devType: 'duplex', yield: 2, titleType: 'strata' })
console.log(
  `  ${strata.classification.dbpApplies ? 'PASS' : 'FAIL'}  Strata duplex triggers the DBP Act (uplift ${money(strata.classification.dbpCostUplift)})`
)

console.log('')
