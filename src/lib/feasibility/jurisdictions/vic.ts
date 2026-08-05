/**
 * VIC — Duty: contracts entered into on or after 1 July 2021 (current as at FY2026-27). Land tax: rates apply for the 2024-2033 land tax years; current land tax year is 2026 (assessed on holdings at 31 December 2025)..
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

export const VIC: JurisdictionProfile = {
  code: 'VIC',
  name: "Victoria",
  taxYear: "2026-27",
  confidence: 'verified',
  asAt: '2026-08-05',

  duty: {
    bands: [
      // $0 - $25,000 | 1.4% of the dutiable value of the property
      { from: 0, upTo: 25_000, kind: 'flat', fixed: 0, rate: 0.014 },
      // >$25,000 - $130,000 | $350 plus 2.4% of the dutiable value in excess of
      // $25,000
      { from: 25_000, upTo: 130_000, kind: 'marginal', fixed: 350, rate: 0.024 },
      // >$130,000 - $960,000 | $2870 plus 6% of the dutiable value in excess of
      // $130,000
      { from: 130_000, upTo: 960_000, kind: 'marginal', fixed: 2_870, rate: 0.06 },
      // >$960,000 - $2,000,000 | 5.5% of the dutiable value
      { from: 960_000, upTo: 2_000_000, kind: 'flat', fixed: 0, rate: 0.055 },
      // More than $2,000,000 | $110,000 plus 6.5% of the dutiable value in excess of
      // $2,000,000
      { from: 2_000_000, upTo: Infinity, kind: 'marginal', fixed: 110_000, rate: 0.065 },
    ],
    minimum: 0,
    premiumThreshold: 2_000_000,
    roundExcessTo100: false,
    upperBoundInclusive: true,
    residentialPremium: null,
  },
  dutySourceUrl: "https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/land-transfer-duty-non-principal-place-residence-current-rates",
  commercialDutyTreatment: 'same',
  commercialDuty: null,
  commercialDutyNote: "The general conveyance scale applies to commercial and industrial land as well as residential.",

  landTax: {
    bands: [
      { from: 0, upTo: 50_000, fixed: 0, rate: 0 },
      { from: 50_000, upTo: 100_000, fixed: 500, rate: 0 },
      { from: 100_000, upTo: 300_000, fixed: 975, rate: 0 },
      { from: 300_000, upTo: 600_000, fixed: 1_350, rate: 0.003 },
      { from: 600_000, upTo: 1_000_000, fixed: 2_250, rate: 0.006 },
      { from: 1_000_000, upTo: 1_800_000, fixed: 4_650, rate: 0.009 },
      { from: 1_800_000, upTo: 3_000_000, fixed: 11_850, rate: 0.0165 },
      { from: 3_000_000, upTo: Infinity, fixed: 31_650, rate: 0.0265 },
    ],
    threshold: 50_000,
    assessedOn: "Site value, as determined by the Valuer-General Victoria, of all taxable land the owner held as at midnight on 31 December of the year preceding the year of assessment (i.e. 31 December 2025 for the 2026 land tax year). Land tax applies for a calendar year. It is assessed on the TOTAL taxable value of all the taxpayer's Victorian land holdings aggregated together (grouping rules apply to related corporations), not property by property, so a developer's new site pushes the whole portfolio up the scale. Land used as the owner's principal place of residence is exempt; these are the general (non-…",
  },
  landTaxSourceUrl: "https://www.sro.vic.gov.au/about-us/rates-and-statistics/current-rates/land-tax-current-rates",

  warranty: {
    name: "Home Warranty insurance (the First-resort Home Warranty Scheme), the statutory insurance scheme under Part 9A of the Building Act 1993 (Vic), introduced by the Building Legislation Amendment (Buyer Protections) Act 2025 and commenced 1 July 2026. It REPLACED Domestic Building Insurance (DBI) for contracts signed on or after 1 July 2026; DBI policies for earlier contracts continue on their original last-resort terms ($300,000 cap).",
    shortName: "Home Warranty",
    threshold: 20_000,
    premiumRate: 0.013,
    premiumRange: { low: 0.007, high: 0.025 },
    regulator: "Building and Plumbing Commission (BPC) — the sole provider and regulator. BPC was established 1 July 2025 and absorbed the Victorian Building Authority (VBA), Domestic Building Dispute Resolution Victoria (DBDRV) and the domestic building insurance arm of the Victorian Managed Insurance Authority (VMIA). Premiums are set by a Premiums Order gazetted under the Building Act 1993 and require ministerial approval before any change.",
  },
  warrantySourceUrl: "https://www.bpc.vic.gov.au/home-owners/insurance-for-domestic-building-work/home-warranty",

  practitioners: null,

  contributionPerDwelling: { low: 2_000, point: 28_000, high: 85_000 },
  contributionMechanism: "Four separate, cumulative mechanisms — a Victorian project can be hit by all of them at once: 1. GAIC (Growth Areas Infrastructure Contribution) — Part 9B of the Planning and Environment Act 1987. A one-off STATE charge per hectare in the 7 designated growth councils (Cardinia, Casey, Hume, Melton, Mitchell, Whittlesea, Wyndham), collected by the State Revenue Office. 2026-27 rates: Type A land $…",

  regions: [
    { key: 'melbourne_metro', label: "Melbourne metro", multiplier: 0.95, isDefault: true },
    { key: 'geelong', label: "Geelong & Surf Coast", multiplier: 0.92 },
    { key: 'ballarat_bendigo', label: "Ballarat & Bendigo", multiplier: 0.88 },
    { key: 'regional_vic', label: "Regional Victoria", multiplier: 0.86 },
  ],

  quirks: [
    "REGIME CHANGE ON 1 JULY 2026 — do not use pre-2026 Victorian data. Domestic Building Insurance (DBI) was replaced by Home Warranty for all major domestic building contracts signed on or after 1 July 2026. The compulsory threshold rose from $16,000 to more than $20,000, the cover cap rose from $300,…",
    "FIRST RESORT is the big commercial difference. Under DBI a homeowner could only claim if the builder died, disappeared, became insolvent or failed to comply with a tribunal order. Under Home Warranty a homeowner can claim for incomplete, defective or non-compliant work while the builder is still tr…",
    "THE THREE-STOREY CLIFF. Home Warranty only covers residential buildings up to three storeys. Apartment buildings of four storeys or more containing more than 2 homes have NO statutory warranty insurance in Victoria at all. Government's stated reason is to keep premiums low by excluding the high rec…",
    "DEVELOPER BOND SCHEME — the Class 2 substitute, and a real cash-flow item. Developers of residential apartment buildings four storeys and above must lodge a bond of 2% of total build cost with BPC before applying for an occupancy permit. Owners can claim against it for defect rectification. It is a…",
    "OFF-THE-PLAN RESCISSION RISK tied to the bond. Once the bond scheme applies, a purchaser of an off-the-plan apartment is entitled to rescind their contract if the developer has not paid the bond, or has paid less than the required amount. This turns a bond administration slip into a pre-sale-destro…",
    "MAXIMUM CONSTRUCTION CAPACITY (MCC) caps your pipeline, not just each job. From 1 July 2026 the Minimum Financial Requirements regime determines the total value of domestic building work a registered builder may have under construction at any one time. Staging and settlement timing must be modelled…",
    "RECTIFICATION ORDERS REACH DEVELOPERS, NOT JUST BUILDERS. BPC can issue rectification orders directing builders, subcontractors AND developers to fix poor work at any time during construction and for up to 10 years after practical completion. This 10-year tail on the developer entity itself is unus…",
    "MAJOR DEFECTS now expressly include waterproofing and weatherproofing, not just structural defects, and carry the 6-year cover period. Everything else gets 2 years. Minor cosmetic differences between the completed work and the contract plans and specifications are excluded, with BPC empowered to pu…",
  ],
}
