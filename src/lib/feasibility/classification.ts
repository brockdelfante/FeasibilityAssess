/**
 * NCC building classification and the NSW Design and Building Practitioners
 * Act 2020 consequences.
 *
 * This matters more than most people expect. A strata-titled duplex is a
 * Class 2 building, which drags in registered practitioners and regulated
 * design declarations — roughly $45k–$120k of fees and 1.5–4 months of
 * program that a Torrens-titled duplex simply does not carry.
 */

import type { ClassificationResult, DevType, NccClass, TitleType } from './types'

/** Indicative DBP compliance cost uplift, by scheme scale. */
const DBP_UPLIFT_BASE = 50_000
const DBP_UPLIFT_PER_EXTRA_DWELLING = 4_500
const DBP_UPLIFT_MIN = 45_000
const DBP_UPLIFT_MAX = 120_000

const DBP_PROGRAM_MONTHS_BASE = 1.5
const DBP_PROGRAM_MONTHS_MAX = 4

const DBP_PRACTITIONERS = [
  'Registered Design Practitioner (architect or design lead)',
  'Principal Design Practitioner (coordinates the design package)',
  'Registered Building Practitioner (your builder — verify before contract)',
  'Registered fire-safety practitioner',
  'Registered structural engineer (DBP-registered)',
  'Registered hydraulic and mechanical engineers (DBP-registered)',
]

/**
 * Work out the NCC class from title type and yield, unless the user has set it
 * explicitly.
 */
export function classify(
  devType: DevType,
  titleType: TitleType,
  dwellingYield: number,
  override: NccClass | null
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

  const dbpApplies = nccClass === 'class_2' || nccClass === 'class_9c'

  let dbpCostUplift = 0
  let dbpProgramMonths = 0

  if (dbpApplies) {
    const extra = Math.max(0, dwellingYield - 2)
    dbpCostUplift = Math.min(
      DBP_UPLIFT_MAX,
      Math.max(DBP_UPLIFT_MIN, DBP_UPLIFT_BASE + extra * DBP_UPLIFT_PER_EXTRA_DWELLING)
    )
    // Program impact scales with scheme size, capped at the published upper bound.
    dbpProgramMonths = Math.min(
      DBP_PROGRAM_MONTHS_MAX,
      DBP_PROGRAM_MONTHS_BASE + Math.max(0, dwellingYield - 2) * 0.15
    )
  }

  return {
    nccClass,
    inferred,
    dbpApplies,
    dbpCostUplift: Math.round(dbpCostUplift),
    dbpProgramMonths: Math.round(dbpProgramMonths * 10) / 10,
    requiredPractitioners: dbpApplies ? DBP_PRACTITIONERS : [],
    reasoning,
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
        'Apartments are sole-occupancy units sharing a building — Class 2 under the NCC, so the DBP Act applies.',
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
      reasoning:
        'Torrens title puts each dwelling on its own lot — Class 1a, so the DBP Act does not apply.',
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
