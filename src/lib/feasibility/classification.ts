/**
 * NCC building classification and the registered-practitioner consequences.
 *
 * This matters more than most people expect. A strata-titled duplex is a
 * Class 2 building, which in NSW drags in registered practitioners and
 * regulated design declarations — roughly $45k–$120k of fees and 1.5–4 months
 * of program that a Torrens-titled duplex simply does not carry.
 *
 * The classification itself is national (the NCC is), but the cost consequence
 * is not: the uplift comes from the jurisdiction's own practitioner regime, so
 * it is read off the profile rather than assumed. Applying NSW's DBP Act costs
 * to a Victorian townhouse would add roughly $60,000 that nobody is charging.
 */

import type { PractitionerRegime } from './jurisdictions/types'
import type { ClassificationResult, DevType, NccClass, TitleType } from './types'

/**
 * Work out the NCC class from title type and yield, unless the user has set it
 * explicitly, and price the local practitioner regime against it.
 *
 * `regime` is the jurisdiction's registered-practitioner scheme, or null where
 * it has none — in which case a Class 2 scheme still gets classified as Class 2
 * (it is, under the NCC) but carries no regulated uplift.
 */
export function classify(
  devType: DevType,
  titleType: TitleType,
  dwellingYield: number,
  override: NccClass | null,
  regime: PractitionerRegime | null = null
): ClassificationResult {
  let nccClass: NccClass
  let inferred = false
  let reasoning: string

  if (override) {
    nccClass = override
    reasoning = 'Class set explicitly in your inputs.'
  } else {
    inferred = true
    const result = inferClass(devType, titleType, dwellingYield)
    nccClass = result.nccClass
    reasoning = result.reasoning
  }

  const isRegulatedClass = nccClass === 'class_2' || nccClass === 'class_9c'
  const dbpApplies = isRegulatedClass && regime !== null && regime.appliesToClass2

  let dbpCostUplift = 0
  let dbpProgramMonths = 0

  if (dbpApplies && regime) {
    const extra = Math.max(0, dwellingYield - 2)
    dbpCostUplift = Math.min(
      regime.costRange.high,
      Math.max(regime.costRange.low, regime.baseCostUplift + extra * regime.costPerExtraDwelling)
    )
    // Program impact scales with scheme size, capped at the published upper bound.
    dbpProgramMonths = Math.min(
      regime.programMonthsMax,
      regime.programMonthsBase + extra * 0.15
    )
  }

  return {
    nccClass,
    inferred,
    dbpApplies,
    dbpCostUplift: Math.round(dbpCostUplift),
    dbpProgramMonths: Math.round(dbpProgramMonths * 10) / 10,
    requiredPractitioners: dbpApplies && regime ? regime.requiredPractitioners : [],
    reasoning,
    regimeName: regime?.name ?? null,
    regimeRegisterUrl: regime?.registerUrl ?? null,
    regimeCostRange: regime?.costRange ?? null,
  }
}

function inferClass(
  devType: DevType,
  titleType: TitleType,
  dwellingYield: number
): { nccClass: NccClass; reasoning: string } {
  if (devType === 'commercial') {
    return {
      nccClass: 'other',
      reasoning: 'Commercial development — outside the Class 1/2 residential classifications.',
    }
  }

  if (devType === 'subdivision') {
    return {
      nccClass: 'other',
      reasoning: 'Land subdivision with no building work — no NCC class applies to the lots.',
    }
  }

  if (devType === 'renovation') {
    return {
      nccClass: titleType === 'strata' ? 'class_2' : 'class_1a',
      reasoning:
        titleType === 'strata'
          ? 'Renovation within a strata building — the building remains Class 2.'
          : 'Renovation to a single dwelling on its own title — Class 1a.',
    }
  }

  if (devType === 'apartment' || devType === 'mixed_use') {
    return {
      nccClass: 'class_2',
      reasoning:
        'Apartments are sole-occupancy units sharing a building — Class 2 under the NCC.',
    }
  }

  if (titleType === 'strata') {
    return {
      nccClass: 'class_2',
      reasoning:
        'Strata title means the dwellings share a building or common property — Class 2 under the NCC.',
    }
  }

  if (titleType === 'torrens') {
    return {
      nccClass: 'class_1a',
      reasoning: 'Torrens title puts each dwelling on its own lot — Class 1a.',
    }
  }

  // Title not yet decided. Multi-dwelling schemes are usually strata in practice.
  if (dwellingYield >= 2) {
    return {
      nccClass: 'class_2',
      reasoning:
        'Title type was not set. Multi-dwelling schemes are usually strata-titled, so we have assumed Class 2 — set the title type explicitly for a firmer answer.',
    }
  }

  return {
    nccClass: 'class_1a',
    reasoning: 'A single dwelling on its own title — Class 1a.',
  }
}

export function nccClassLabel(nccClass: NccClass): string {
  switch (nccClass) {
    case 'class_1a':
      return 'Class 1a — single dwelling'
    case 'class_2':
      return 'Class 2 — multi-unit residential'
    case 'class_9c':
      return 'Class 9c — residential aged care'
    default:
      return 'Other / non-residential'
  }
}
