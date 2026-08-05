/**
 * Jurisdiction registry.
 *
 * One profile per state and territory. The engine reads everything
 * jurisdiction-specific through here, so adding a jurisdiction means adding a
 * profile rather than touching the cost model.
 *
 * Profiles are only listed as live once their schedules have been transcribed
 * from the revenue office's own published table AND independently verified. A
 * profile that has not cleared that bar stays out of the selector: these figures
 * drive acquisition decisions, and a confidently-rendered wrong duty number is
 * worse than an honest "not yet available".
 */

import type { Jurisdiction } from '../types'
import { ACT } from './act'
import { NSW } from './nsw'
import { QLD } from './qld'
import { SA } from './sa'
import { TAS } from './tas'
import { VIC } from './vic'
import { WA } from './wa'
import type { JurisdictionProfile } from './types'

export * from './types'

/**
 * Every profile we have. Keyed by code so a missing jurisdiction is a lookup
 * failure rather than a silent fallback to the wrong state's tax law.
 */
const PROFILES: Partial<Record<Jurisdiction, JurisdictionProfile>> = {
  NSW,
  VIC,
  QLD,
  SA,
  WA,
  TAS,
  ACT,
  // NT is deliberately absent. Its first duty band is a quadratic the schedule
  // type cannot express, and transcribing it as a flat band with a zero rate
  // silently returns $0 duty on any site up to $525,000 — a realistic price. It
  // needs a quadratic band kind before it can ship. See _research/README.md.
}

/** Jurisdictions a client can actually select. */
export const LIVE_JURISDICTION_CODES: Jurisdiction[] = (
  Object.keys(PROFILES) as Jurisdiction[]
).filter((code) => {
  const profile = PROFILES[code]
  return profile !== undefined && profile.confidence !== 'indicative'
})

export function profileFor(code: Jurisdiction): JurisdictionProfile {
  const profile = PROFILES[code]
  if (profile) return profile

  // Falling back to another jurisdiction's tax law would be actively
  // misleading, so this is a programming error rather than a soft failure. The
  // UI must not offer a code that has no profile.
  throw new Error(
    `No statutory profile for ${code}. Only ${LIVE_JURISDICTION_CODES.join(', ')} are available.`
  )
}

export function hasProfile(code: Jurisdiction): boolean {
  return PROFILES[code] !== undefined
}

/** The region list for a jurisdiction, for the construction-cost multiplier. */
export function regionsFor(code: Jurisdiction) {
  return hasProfile(code) ? profileFor(code).regions : []
}

export function defaultRegionFor(code: Jurisdiction): string {
  const regions = regionsFor(code)
  return (regions.find((r) => r.isDefault) ?? regions[0])?.key ?? ''
}

export function regionMultiplier(code: Jurisdiction, regionKey: string): number {
  const region = regionsFor(code).find((r) => r.key === regionKey)
  return region?.multiplier ?? 1
}
