/**
 * Cross-jurisdiction harness.
 *
 * The point of this one is not the duty tables — __verify_all.ts already proves
 * those against each revenue office's published worked example. The point is
 * that the ENGINE actually dispatches on the selected jurisdiction, because a
 * verified schedule the engine never calls is worth nothing. This is the check
 * that would have caught statutory.ts hardcoding NSW while seven profiles sat
 * unused next to it.
 *
 * Run with: npx tsc --outDir /tmp/fvs --module commonjs --target es2020 \
 *   --moduleResolution node src/lib/feasibility/__verify_states.ts && \
 *   node /tmp/fvs/lib/feasibility/__verify_states.js
 */

import { classify } from './classification'
import { computeCore, defaultFeasibilityInputs, runFeasibility } from './engine'
import { LIVE_JURISDICTION_CODES, profileFor } from './jurisdictions'
import { money } from './trace'
import type { FeasibilityInputs, Jurisdiction } from './types'

let failures = 0

function ok(label: string, condition: boolean, detail = '') {
  if (!condition) failures++
  console.log(`${condition ? 'PASS' : 'FAIL'}  ${label}${detail ? `  ${detail}` : ''}`)
}

function inputsFor(over: Partial<FeasibilityInputs> = {}): FeasibilityInputs {
  return {
    ...defaultFeasibilityInputs,
    yield: 4,
    avgDwellingSqm: 220,
    purchasePrice: 2_000_000,
    salePricePerDwelling: 2_400_000,
    titleType: 'strata',
    ...over,
  }
}

// ---------------------------------------------------------------------------
console.log('\n=== Every live jurisdiction runs end to end ===\n')

const byCode = new Map<Jurisdiction, ReturnType<typeof runFeasibility>>()

for (const code of LIVE_JURISDICTION_CODES) {
  const results = runFeasibility(inputsFor({ jurisdiction: code }))
  byCode.set(code, results)

  const finite =
    Number.isFinite(results.totalDevelopmentCost) &&
    Number.isFinite(results.netProfit) &&
    Number.isFinite(results.marginOnCost) &&
    results.totalDevelopmentCost > 0
  ok(`${code} produces a complete assessment`, finite)
  ok(
    `${code} labels its own statutory lines`,
    results.statutory.jurisdiction === code &&
      results.statutory.stampDuty.sourceKey === `duty_${code}`,
    results.statutory.stampDuty.sourceKey ?? ''
  )
}

// ---------------------------------------------------------------------------
console.log('\n=== Duty on the same $2,000,000 site, by state ===\n')

const dutyByCode = new Map<Jurisdiction, number>()
for (const code of LIVE_JURISDICTION_CODES) {
  const duty = byCode.get(code)!.statutory.stampDuty.value
  dutyByCode.set(code, duty)
  console.log(`  ${code.padEnd(4)} ${money(duty).padStart(12)}`)
}

// If the engine were still hardcoded to NSW every one of these would be equal.
const distinct = new Set(dutyByCode.values())
ok(
  'duty actually varies by jurisdiction',
  distinct.size >= LIVE_JURISDICTION_CODES.length - 1,
  `${distinct.size} distinct figures across ${LIVE_JURISDICTION_CODES.length} states`
)

// Spot anchors, straight off each schedule at $2,000,000.
ok('NSW duty is $91,287', dutyByCode.get('NSW') === 91_287, money(dutyByCode.get('NSW')!))
// VIC: $110,000 + 6.5% of nothing at exactly $2,000,000 — the flat 5.5% band
// tops out here, so 5.5% x $2,000,000.
ok('VIC duty is $110,000', dutyByCode.get('VIC') === 110_000, money(dutyByCode.get('VIC')!))

// ---------------------------------------------------------------------------
console.log('\n=== The regime gate reaches the engine ===\n')

// South Australia charges nothing on non-residential land. If the wizard's
// answer did not reach the engine, this would still be ~$95,000.
const saResidential = runFeasibility(inputsFor({ jurisdiction: 'SA' }))
const saCommercial = runFeasibility(
  inputsFor({ jurisdiction: 'SA', dutyRegimeOverride: 'commercial' })
)
ok('SA residential duty is charged', saResidential.statutory.stampDuty.value > 90_000, money(saResidential.statutory.stampDuty.value))
ok('SA commercial duty is nil', saCommercial.statutory.stampDuty.value === 0)
ok(
  'the SA saving flows into total cost',
  Math.round(saResidential.totalDevelopmentCost - saCommercial.totalDevelopmentCost) > 90_000,
  money(saResidential.totalDevelopmentCost - saCommercial.totalDevelopmentCost)
)

// The ACT cliff: nil to $2,100,000, then a flat 5% of the whole value.
const actUnder = runFeasibility(
  inputsFor({ jurisdiction: 'ACT', purchasePrice: 2_100_000, dutyRegimeOverride: 'commercial' })
)
const actOver = runFeasibility(
  inputsFor({ jurisdiction: 'ACT', purchasePrice: 2_100_001, dutyRegimeOverride: 'commercial' })
)
ok('ACT commercial at $2,100,000 is nil', actUnder.statutory.stampDuty.value === 0)
ok(
  'ACT commercial at $2,100,001 is $105,000',
  actOver.statutory.stampDuty.value === 105_000,
  money(actOver.statutory.stampDuty.value)
)

// NSW premium duty is residential-only, so a commercial site above the
// threshold must stay on the general 5.5% band.
const nswPremiumRes = runFeasibility(inputsFor({ jurisdiction: 'NSW', purchasePrice: 5_000_000 }))
const nswPremiumCom = runFeasibility(
  inputsFor({ jurisdiction: 'NSW', purchasePrice: 5_000_000, dutyRegimeOverride: 'commercial' })
)
ok(
  'NSW premium duty does not apply to commercial land',
  nswPremiumCom.statutory.stampDuty.value < nswPremiumRes.statutory.stampDuty.value,
  `${money(nswPremiumCom.statutory.stampDuty.value)} vs ${money(nswPremiumRes.statutory.stampDuty.value)}`
)

// ---------------------------------------------------------------------------
console.log('\n=== The practitioner regime is not exported to states without one ===\n')

for (const code of LIVE_JURISDICTION_CODES) {
  const cls = classify('apartment', 'strata', 6, null, profileFor(code).practitioners)
  const hasRegime = profileFor(code).practitioners?.appliesToClass2 === true
  ok(
    `${code} Class 2 uplift ${hasRegime ? 'applies' : 'is zero'}`,
    hasRegime ? cls.dbpCostUplift > 0 : cls.dbpCostUplift === 0,
    money(cls.dbpCostUplift)
  )
}

// ---------------------------------------------------------------------------
console.log('\n=== Location factors reach the construction line ===\n')

const sydney = computeCore(inputsFor({ jurisdiction: 'NSW', costRegion: 'sydney_metro' }))
for (const code of LIVE_JURISDICTION_CODES) {
  const profile = profileFor(code)
  const cheapest = profile.regions.reduce((a, b) => (b.multiplier < a.multiplier ? b : a))
  const core = computeCore(inputsFor({ jurisdiction: code, costRegion: cheapest.key }))
  const factor = core.constructionRate / sydney.constructionRate
  console.log(
    `  ${code.padEnd(4)} ${cheapest.label.padEnd(28)} ${money(core.constructionRate)}/m²  (${factor.toFixed(2)}x Sydney)`
  )
  ok(
    `${code} applies its own location factor`,
    Math.abs(factor - cheapest.multiplier) < 0.02,
    `expected ${cheapest.multiplier}x, got ${factor.toFixed(3)}x`
  )
}

// An unknown region must fall back to the default rather than silently
// multiplying by 1 and pricing a Bendigo job at Sydney rates.
const bogus = computeCore(inputsFor({ jurisdiction: 'VIC', costRegion: 'not_a_region' }))
const vicDefault = computeCore(inputsFor({ jurisdiction: 'VIC' }))
ok('an unknown region falls back to the default', bogus.constructionRate === vicDefault.constructionRate)

// ---------------------------------------------------------------------------
console.log('\n=== Every jurisdiction has a citation for every figure it renders ===\n')

for (const code of LIVE_JURISDICTION_CODES) {
  // Imported lazily so the SOURCES map is built after the registry.
  const { SOURCES } = require('./sources') as typeof import('./sources')
  const s = byCode.get(code)!.statutory
  const keys = [
    s.stampDuty.sourceKey,
    s.landTaxPerYear.sourceKey,
    s.hbcfPremium.sourceKey,
    s.councilContributions.sourceKey,
  ]
  const missing = keys.filter((k) => !k || !SOURCES[k])
  ok(`${code} cites every statutory line`, missing.length === 0, missing.join(', '))
}

console.log(
  failures === 0 ? '\nALL CHECKS PASSED\n' : `\n${failures} CHECK(S) FAILED\n`
)
process.exit(failures === 0 ? 0 : 1)
