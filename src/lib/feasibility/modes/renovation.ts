/**
 * Renovate / extend.
 *
 * Same cost engine as the developer side, different question. The homeowner is
 * asking "if I spend $X to add a bed and a bath, am I better off?" — so the
 * verdict is equity gain, not profit.
 *
 * Two tests matter:
 *
 *  - The value ceiling. Pushing a finished property materially above the
 *    suburb median for its bed-count config is risky money, because buyers
 *    anchor hard to comparable sales.
 *  - The rebuild crossover. Once build cost passes roughly half the
 *    post-renovation value, demolishing and building new is often cheaper and
 *    produces a more sellable house.
 */

import { REBUILD_CROSSOVER_RATIO } from '../rates'
import { safeDiv } from '../trace'
import type { FeasibilityInputs, RenovationResult } from '../types'
import type { CoreResult } from '../engine'

export function deriveRenovation(inputs: FeasibilityInputs, core: CoreResult): RenovationResult {
  // Spend excludes any land purchase — a renovation is on a home already owned.
  const spend = core.totalDevelopmentCost - inputs.purchasePrice

  const valueBefore = inputs.preRenoValue
  const valueAfter = inputs.postRenoValue > 0 ? inputs.postRenoValue : valueBefore + spend

  const equityGain = valueAfter - valueBefore - spend

  // Only test the ceiling when the client actually gave us a median.
  const ceiling = inputs.suburbMedianForConfig
  const aboveValueCeiling = ceiling > 0 && valueAfter > ceiling
  const ceilingHeadroom = ceiling > 0 ? ceiling - valueAfter : 0

  const crossoverRatio = safeDiv(core.amounts.construction, valueAfter)

  return {
    spend,
    valueBefore,
    valueAfter,
    equityGain,
    aboveValueCeiling,
    ceilingHeadroom,
    crossoverRatio,
    rebuildLikelyBetter: crossoverRatio > REBUILD_CROSSOVER_RATIO,
  }
}
