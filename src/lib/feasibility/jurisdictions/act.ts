/**
 * ACT — 2026-27.
 *
 * GENERATED from _research/verified-2026-08-05.json by
 * scripts/generate-jurisdiction-profiles.mjs. Do not edit by hand: re-run the
 * generator so the code cannot drift from the verified source.
 *
 * Duty and land tax were transcribed from the revenue office's published tables
 * and independently verified band by band. Verifier verdict: duty
 * confirmed, land tax confirmed.
 * No official worked example was published on the current schedule; the bands
 * were verified by boundary continuity and internal self-consistency instead.
 *
 * Duty thresholds are re-indexed annually in most jurisdictions and the year that
 * applies is set by the CONTRACT date, not settlement. Re-scrape each July.
 *
 * WARRANTY AND CONTRIBUTION FIGURES ARE INDICATIVE, NOT TRANSCRIBED. Primary
 * retrieval was blocked for most jurisdictions, so treat them as estimates and
 * verify before relying on them. The rate schedules above do not share that
 * weakness.
 */

import type { JurisdictionProfile } from './types'

export const ACT: JurisdictionProfile = {
  code: 'ACT',
  name: "Australian Capital Territory",
  taxYear: "2026-27",
  confidence: 'verified',
  asAt: '2026-08-05',

  duty: {
    bands: [
      // Up to $200 000 | $1.20 per $100 or part thereof up to $200,000
      { from: 0, upTo: 200_000, kind: 'marginal', fixed: 0, rate: 0.012 },
      // $200 001 to $300 000 | $2 400 plus $2.20 per $100 or part thereof by which
      // the value exceeds $200,000
      { from: 200_000, upTo: 300_000, kind: 'marginal', fixed: 2_400, rate: 0.022 },
      // $300 001 to $500 000 | $4 600 plus $3.40 per $100 or part thereof by which
      // the value exceeds $300,000
      { from: 300_000, upTo: 500_000, kind: 'marginal', fixed: 4_600, rate: 0.034 },
      // $500 001 to $750 000 | $11 400 plus $4.32 per $100 or part thereof by which
      // the value exceeds $500,000
      { from: 500_000, upTo: 750_000, kind: 'marginal', fixed: 11_400, rate: 0.0432 },
      // $750 001 to $1 000 000 | $22 200 plus $5.90 per $100, or part thereof by
      // which the value exceeds $750,000
      { from: 750_000, upTo: 1_000_000, kind: 'marginal', fixed: 22_200, rate: 0.059 },
      // $1 000 001 to $1 455 000 | $36 950 plus $6.40 per $100, or part thereof by
      // which the value exceeds $1,000,000
      { from: 1_000_000, upTo: 1_455_000, kind: 'marginal', fixed: 36_950, rate: 0.064 },
      // More than $1 455 000 | A flat rate of $4.54 per $100 applied to the total
      // transaction value
      { from: 1_455_000, upTo: Infinity, kind: 'flat', fixed: 0, rate: 0.0454 },
    ],
    minimum: 0,
    premiumThreshold: null,
    roundExcessTo100: true,
    upperBoundInclusive: true,
    residentialPremium: null,
  },
  dutySourceUrl: "https://www.revenue.act.gov.au/rates-and-property-charges/conveyance-duty-stamp-duty/conveyance-duty-for-non-commercial-property",
  commercialDutyTreatment: 'separate',
  commercialDuty: {
    bands: [
      { from: 0, upTo: 2_100_000, kind: 'flat', fixed: 0, rate: 0 },
      { from: 2_100_000, upTo: Infinity, kind: 'flat', fixed: 0, rate: 0.05 },
    ],
    minimum: 0,
    premiumThreshold: 2_100_000,
    roundExcessTo100: false,
    upperBoundInclusive: true,
    residentialPremium: null,
  },
  commercialDutyNote: "The ACT commercial scale is nil up to $2,100,000 and then a flat 5% of the WHOLE transaction value — so $2,100,000 attracts nothing and $2,100,001 attracts $105,000. It is a cliff, not a marginal rate.",

  landTax: {
    bands: [
      { from: 0, upTo: 150_000, fixed: 0, rate: 0.0054 },
      { from: 150_000, upTo: 275_000, fixed: 810, rate: 0.0064 },
      { from: 275_000, upTo: 1_000_000, fixed: 1_610, rate: 0.0124 },
      { from: 1_000_000, upTo: 2_000_000, fixed: 10_600, rate: 0.0125 },
      { from: 2_000_000, upTo: Infinity, fixed: 23_100, rate: 0.0126 },
    ],
    threshold: 0,
    assessedOn: "Average Unimproved Value (AUV) of the parcel - the average of the property's unimproved value over up to 5 years. For 2026-27 the AUV is the average of the property's unimproved value as at 2022, 2023, 2024, 2025 and 2026. Land tax has TWO components and the bands below are only the second: (1) a FIXED CHARGE of $1,778 per year from 1 July 2026, plus (2) a valuation charge from the marginal AUV bands. The tool must add the fixed charge to the banded amount. Assessed QUARTERLY on the status of the property at four key dates - 1 July, 1 October, 1 January and 1 April each year - for each whole …",
  },
  landTaxSourceUrl: "https://www.revenue.act.gov.au/rates-and-property-charges/land-tax/how-land-tax-is-calculated",

  warranty: {
    name: "Residential building work insurance (builders warranty insurance) or a fidelity fund certificate from an approved fidelity fund scheme, required under Part 6 of the Building Act 2004 (ACT)",
    shortName: "RBWI",
    threshold: 12_000,
    premiumRate: 0.005,
    premiumRange: { low: 0.0025, high: 0.01 },
    regulator: "ACT Construction Occupations Registrar, administered through Access Canberra (with the ACT City and Environment Directorate / planning.act.gov.au publishing the scheme rules). QBE is currently the only approved insurer and the Master Builders Fidelity Fund the only approved fidelity fund scheme.",
  },
  warrantySourceUrl: "https://www.planning.act.gov.au/community/build-or-renovate/before-you-start/building-contracts/residential-building-work-insurance",

  practitioners: null,

  contributionPerDwelling: { low: 0, point: 50_000, high: 300_000 },
  contributionMechanism: "The ACT has no council-based developer contributions plan (there are no local councils and no s7.11/s7.12-style contributions). Value capture instead runs through the Lease Variation Charge (LVC) on variation of a Crown lease, now under the Planning Act 2023 (ACT) and the annual Planning (Lease Variation Charges) Determination (currently the 2026 determination; previously the Planning and Develop…",

  regions: [
    { key: 'canberra', label: "Canberra", multiplier: 0.95, isDefault: true },
  ],

  quirks: [
    "All ACT land is Crown leasehold (typically 99-year leases with a binding purpose clause), not freehold. Nearly any change in permitted use or dwelling yield requires a lease variation, and the Lease Variation Charge is the single biggest ACT-specific feasibility line item - $49,000 per dwelling cod…",
    "Residential building work insurance does NOT apply to apartment buildings of more than three storeys (excluding basement carpark) - such work falls outside the definition of 'residential building work' in s 84 of the Building Act 2004. So a mid/high-rise Class 2 project carries no warranty premium …",
    "Where cover is required, it is capped: minimum insured amount per dwelling rose from $85,000 to $200,000 on 1 January 2025 and the claim lodgement window from 90 to 180 days. The cap is per dwelling and is widely criticised as inadequate for current build costs.",
    "Only two providers exist: QBE (the sole approved insurer) and the Master Builders Fidelity Fund (the sole approved fidelity fund scheme, which issues a certificate rather than an insurance policy and covers 5 years, with cheaper rates for MBA members). Capacity and eligibility rather than price is …",
    "Property Developers Act 2024 (ACT): from 1 October 2026 it is mandatory to hold a property developer licence for any residential project of three or more dwellings (Class 1 or Class 2). Fees are $1,000 application, $1,000 per annual licence term, $500 per residential dwelling payable at building ap…",
    "No councils and no development contributions plans - one territory-wide planning authority, one Territory Plan (2023) and one DA pathway under the Planning Act 2023. This removes council-by-council contribution variability but concentrates all discretion in one agency.",
    "Icon Water's Water and Sewerage Capital Contribution applies only to infill inside designated precincts and is charged per additional equivalent person ($961 per EP in 2025-26). Two identical projects can differ by thousands of dollars per dwelling purely on whether the block sits inside a precinct…",
    "All-electric mandate: a regulation preventing new gas network connections commenced 8 December 2023, and buildings captured by it (all residential, plus commercial and community facility zones) must be designed and built all-electric from 1 March 2024 unless exempted. Transitional relief only for D…",
  ],
}
