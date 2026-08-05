/**
 * Scenarios, sensitivity and scale.
 *
 * All three answer the same question from different angles: how wrong can the
 * inputs be before the answer changes? Each one re-runs the full engine rather
 * than scaling the headline figure, so second-order effects are captured — a
 * lower sale price really does reduce the GST and the commission, and a longer
 * program really does cost more interest.
 */

import { computeCore, verdictFor } from './engine'
import {
  constructionRate,
  priceForSize,
  SCENARIO_SHIFTS,
  SIZE_PRICE_ELASTICITY,
  type ScenarioShift,
} from './rates'
import { safeDiv } from './trace'
import type {
  FeasibilityInputs,
  ScaleCell,
  ScaleRecommendation,
  ScenarioResult,
  SensitivityRow,
  Verdict,
} from './types'

// ---------------------------------------------------------------------------
// Applying a shift
// ---------------------------------------------------------------------------

/**
 * Apply a scenario shift to a set of inputs.
 *
 * Build cost is shifted through whichever layer is actually driving the
 * construction figure — a pinned bucket, a bill of quantities, or the rate — so
 * the shift is never silently ignored.
 */
export function applyShift(inputs: FeasibilityInputs, shift: ScenarioShift): FeasibilityInputs {
  const next: FeasibilityInputs = {
    ...inputs,
    salePricePerDwelling: inputs.salePricePerDwelling * (1 + shift.salePricePct),
    postRenoValue: inputs.postRenoValue * (1 + shift.salePricePct),
    overrunBuffer: Math.max(0, inputs.overrunBuffer + shift.overrunPp),
    durationMonths: Math.max(1, inputs.durationMonths * (1 + shift.durationPct)),
    overrides: { ...inputs.overrides },
  }

  if (shift.buildCostPct !== 0) {
    const driverIsBucket = inputs.overrides.construction !== null || inputs.boq.touched
    if (driverIsBucket) {
      const base =
        inputs.overrides.construction ?? computeCore(inputs).amounts.construction
      next.overrides.construction = base * (1 + shift.buildCostPct)
    } else {
      const base =
        inputs.overrides.constructionRatePerSqm ??
        constructionRate(inputs.devType, inputs.qualityTier, inputs.siteDifficulty).point
      next.overrides.constructionRatePerSqm = base * (1 + shift.buildCostPct)
    }
  }

  return next
}

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

const SCENARIO_LABELS: Record<'conservative' | 'base' | 'optimistic', string> = {
  conservative: 'Conservative',
  base: 'Base',
  optimistic: 'Optimistic',
}

export function runScenarios(inputs: FeasibilityInputs): ScenarioResult[] {
  const baseCore = computeCore(inputs)

  return (['conservative', 'base', 'optimistic'] as const).map((key) => {
    const shifted = key === 'base' ? inputs : applyShift(inputs, SCENARIO_SHIFTS[key])
    const core = key === 'base' ? baseCore : computeCore(shifted)
    const { verdict } = verdictFor(inputs.mode, core.marginOnCost, inputs.targetMargin)

    return {
      key,
      label: SCENARIO_LABELS[key],
      verdict,
      marginOnCost: core.marginOnCost,
      netProfit: core.netProfit,
      totalDevelopmentCost: core.totalDevelopmentCost,
      deltaVsBasePp: key === 'base' ? null : core.marginOnCost - baseCore.marginOnCost,
    }
  })
}

/** Human-readable description of what each scenario does to the inputs. */
export function describeScenario(key: 'conservative' | 'optimistic'): string {
  const s = SCENARIO_SHIFTS[key]
  const parts = [
    `${s.salePricePct >= 0 ? '+' : '−'}${Math.abs(s.salePricePct * 100)}% sale price`,
    `${s.buildCostPct >= 0 ? '+' : '−'}${Math.abs(s.buildCostPct * 100)}% build cost`,
    `${s.overrunPp >= 0 ? '+' : '−'}${Math.abs(s.overrunPp * 100)}pp overrun buffer`,
    `${s.durationPct >= 0 ? '+' : '−'}${Math.abs(s.durationPct * 100)}% duration`,
  ]
  return parts.join(', ')
}

// ---------------------------------------------------------------------------
// Sensitivity
// ---------------------------------------------------------------------------

const SENSITIVITY_SHIFTS = [-0.1, -0.05, 0, 0.05, 0.1]

interface Lever {
  label: string
  /** Build the shift for a given magnitude. */
  build: (magnitude: number) => ScenarioShift
}

const ZERO: ScenarioShift = { salePricePct: 0, buildCostPct: 0, overrunPp: 0, durationPct: 0 }

const LEVERS: Lever[] = [
  { label: 'Sale price', build: (m) => ({ ...ZERO, salePricePct: m }) },
  { label: 'Build cost', build: (m) => ({ ...ZERO, buildCostPct: m }) },
  { label: 'Duration', build: (m) => ({ ...ZERO, durationPct: m }) },
  // The overrun buffer is already a percentage, so the column shifts it in
  // percentage points and clamps at zero — a negative buffer is meaningless.
  { label: 'Overrun buffer', build: (m) => ({ ...ZERO, overrunPp: m }) },
]

export function runSensitivity(inputs: FeasibilityInputs): SensitivityRow[] {
  const target = inputs.targetMargin

  return LEVERS.map((lever) => ({
    lever: lever.label,
    cells: SENSITIVITY_SHIFTS.map((shift) => {
      const core =
        shift === 0 ? computeCore(inputs) : computeCore(applyShift(inputs, lever.build(shift)))
      return {
        shift,
        marginOnCost: core.marginOnCost,
        meets: outcomeFor(core.marginOnCost, target),
      }
    }),
  }))
}

function outcomeFor(marginOnCost: number, target: number): 'pass' | 'marginal' | 'fail' {
  if (marginOnCost >= target) return 'pass'
  if (marginOnCost >= target * 0.85) return 'marginal'
  return 'fail'
}

// ---------------------------------------------------------------------------
// Scale recommender
// ---------------------------------------------------------------------------

const SCALE_DWELLING_SIZES = [380, 360, 340, 320, 300, 280, 260, 240, 220, 200, 180, 160, 140, 120, 100]
const SCALE_MAX_YIELD = 20

/**
 * Sweep yield against dwelling size to find the smallest configuration that
 * still meets the target margin.
 *
 * This is the question a client actually has once the headline looks marginal:
 * not "is this deal feasible" but "what would I have to build here to make it
 * work?".
 */
export function runScaleRecommendation(inputs: FeasibilityInputs): ScaleRecommendation {
  const target = inputs.targetMargin
  const grid: ScaleCell[] = []

  // Sale price has to move with dwelling size, but not proportionally: part of a
  // dwelling's value is fixed whatever its area, so bigger dwellings fetch more
  // in total and less per square metre. `priceForSize` applies that elasticity,
  // anchored on the client's own size and price — so the cell matching their
  // actual configuration always shows exactly the price they entered.
  const elasticity = inputs.sizePriceElasticity ?? SIZE_PRICE_ELASTICITY

  for (const dwellingSqm of SCALE_DWELLING_SIZES) {
    const salePrice = priceForSize(
      inputs.salePricePerDwelling,
      inputs.avgDwellingSqm,
      dwellingSqm,
      elasticity
    )
    for (let y = 1; y <= SCALE_MAX_YIELD; y++) {
      const core = computeCore({
        ...inputs,
        yield: y,
        avgDwellingSqm: dwellingSqm,
        salePricePerDwelling: salePrice,
      })
      grid.push({
        yield: y,
        dwellingSqm,
        marginOnCost: core.marginOnCost,
        outcome: outcomeFor(core.marginOnCost, target),
        salePricePerDwelling: salePrice,
      })
    }
  }

  const currentCore = computeCore(inputs)
  const current: ScaleCell = {
    yield: inputs.yield,
    dwellingSqm: inputs.avgDwellingSqm,
    marginOnCost: currentCore.marginOnCost,
    outcome: outcomeFor(currentCore.marginOnCost, target),
    salePricePerDwelling: inputs.salePricePerDwelling,
  }

  // "Smallest" means least total floor area built — the configuration that hits
  // the target with the least construction risk and capital at stake.
  const passing = grid.filter((c) => c.outcome === 'pass')
  const smallestPassing =
    passing.length > 0
      ? passing.reduce((best, c) =>
          c.yield * c.dwellingSqm < best.yield * best.dwellingSqm ? c : best
        )
      : null

  return {
    grid,
    current,
    smallestPassing,
    headroomPp: currentCore.marginOnCost - target,
  }
}

// ---------------------------------------------------------------------------
// What-if solver
// ---------------------------------------------------------------------------

export type SolveTarget =
  | 'sale_price'
  | 'purchase_price'
  | 'build_rate'
  | 'yield'
  | 'duration'

export interface SolveResult {
  target: SolveTarget
  label: string
  /** The value that hits the goal. */
  solved: number
  /** What the input is now. */
  current: number
  /** True when no value in a sane range reaches the goal. */
  unreachable: boolean
  unit: 'money' | 'rate' | 'number' | 'months'
}

/**
 * Goal-seek a single input to hit a target margin on cost.
 *
 * Bisection on the full engine, which means every knock-on effect is included:
 * solving for purchase price accounts for the extra stamp duty, solving for
 * duration accounts for the extra interest and land tax.
 */
export function solveFor(
  inputs: FeasibilityInputs,
  target: SolveTarget,
  goalMargin: number
): SolveResult {
  const config: Record<
    SolveTarget,
    {
      label: string
      unit: SolveResult['unit']
      current: number
      lo: number
      hi: number
      /** True when raising the input raises the margin. */
      increasing: boolean
      apply: (value: number) => FeasibilityInputs
    }
  > = {
    sale_price: {
      label: 'Sale price per dwelling',
      unit: 'money',
      current: inputs.salePricePerDwelling,
      lo: 0,
      hi: Math.max(inputs.salePricePerDwelling * 4, 1_000_000),
      increasing: true,
      apply: (v) => ({ ...inputs, salePricePerDwelling: v }),
    },
    purchase_price: {
      label: 'Purchase price',
      unit: 'money',
      current: inputs.purchasePrice,
      lo: 0,
      hi: Math.max(inputs.purchasePrice * 3, inputs.yield * inputs.salePricePerDwelling),
      increasing: false,
      apply: (v) => ({ ...inputs, purchasePrice: v }),
    },
    build_rate: {
      label: 'Construction rate',
      unit: 'rate',
      current:
        inputs.overrides.constructionRatePerSqm ??
        constructionRate(inputs.devType, inputs.qualityTier, inputs.siteDifficulty).point,
      lo: 0,
      hi: 30_000,
      increasing: false,
      apply: (v) => ({
        ...inputs,
        overrides: { ...inputs.overrides, constructionRatePerSqm: v },
      }),
    },
    yield: {
      label: 'Number of dwellings',
      unit: 'number',
      current: inputs.yield,
      lo: 1,
      hi: 40,
      increasing: true,
      apply: (v) => ({ ...inputs, yield: Math.round(v) }),
    },
    duration: {
      label: 'Project duration',
      unit: 'months',
      current: inputs.durationMonths,
      lo: 3,
      hi: 120,
      increasing: false,
      apply: (v) => ({ ...inputs, durationMonths: v }),
    },
  }

  const c = config[target]
  const marginAt = (v: number) => computeCore(c.apply(v)).marginOnCost

  let lo = c.lo
  let hi = c.hi
  const marginLo = marginAt(lo)
  const marginHi = marginAt(hi)

  // The goal has to sit between the two ends, otherwise no solution exists.
  const reachable = c.increasing
    ? marginLo <= goalMargin && marginHi >= goalMargin
    : marginLo >= goalMargin && marginHi <= goalMargin

  if (!reachable) {
    return {
      target,
      label: c.label,
      solved: c.increasing ? hi : lo,
      current: c.current,
      unreachable: true,
      unit: c.unit,
    }
  }

  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2
    const m = marginAt(mid)
    const tooLow = c.increasing ? m < goalMargin : m > goalMargin
    if (tooLow) lo = mid
    else hi = mid
  }

  // A dwelling count has to be a whole number, and rounding down would land
  // under the goal — so round up to the next configuration that clears it.
  const solved = target === 'yield' ? Math.ceil(hi) : (lo + hi) / 2

  return {
    target,
    label: c.label,
    solved,
    current: c.current,
    unreachable: false,
    unit: c.unit,
  }
}

/** Run every solver at once — the "what would have to be true" panel. */
export function solveAll(inputs: FeasibilityInputs, goalMargin: number): SolveResult[] {
  const targets: SolveTarget[] = ['sale_price', 'purchase_price', 'build_rate', 'yield', 'duration']
  return targets.map((t) => solveFor(inputs, t, goalMargin))
}

/** Verdict helper re-exported so UI components need only one import. */
export function verdictOf(inputs: FeasibilityInputs, marginOnCost: number): Verdict {
  return verdictFor(inputs.mode, marginOnCost, inputs.targetMargin).verdict
}

export { safeDiv }
