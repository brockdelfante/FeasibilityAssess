/**
 * TAS — 2026-27.
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

export const TAS: JurisdictionProfile = {
  code: 'TAS',
  name: "Tasmania",
  taxYear: "2026-27",
  confidence: 'verified',
  asAt: '2026-08-05',

  duty: {
    bands: [
      // Not more than $3 000 | $50
      { from: 0, upTo: 3_000, kind: 'marginal', fixed: 50, rate: 0 },
      // More than $3 000 but not more than $25 000 | $50 plus $1.75 for every $100,
      // or part, by which the dutiable value exceeds $3 000
      { from: 3_000, upTo: 25_000, kind: 'marginal', fixed: 50, rate: 0.0175 },
      // More than $25 000 but not more than $75 000 | $435 plus $2.25 for every
      // $100, or part, by which the dutiable value exceeds $25 000
      { from: 25_000, upTo: 75_000, kind: 'marginal', fixed: 435, rate: 0.0225 },
      // More than $75 000 but not more than $200 000 | $1,560 plus $3.50 for every
      // $100, or part, by which the dutiable value exceeds $75 000
      { from: 75_000, upTo: 200_000, kind: 'marginal', fixed: 1_560, rate: 0.035 },
      // More than $200 000 but not more than $375 000 | $5,935 plus $4.00 for every
      // $100, or part, by which the dutiable value exceeds $200 000
      { from: 200_000, upTo: 375_000, kind: 'marginal', fixed: 5_935, rate: 0.04 },
      // More than $375 000 but not more than $725 000 | $12,935 plus $4.25 for every
      // $100, or part, by which the dutiable value exceeds $375 000
      { from: 375_000, upTo: 725_000, kind: 'marginal', fixed: 12_935, rate: 0.0425 },
      // More than $725 000 | $27,810 plus $4.50 for every $100, or part, by which
      // the dutiable value exceeds $725 000
      { from: 725_000, upTo: Infinity, kind: 'marginal', fixed: 27_810, rate: 0.045 },
    ],
    minimum: 50,
    premiumThreshold: null,
    roundExcessTo100: true,
    upperBoundInclusive: true,
    residentialPremium: null,
  },
  dutySourceUrl: "https://www.sro.tas.gov.au/property-transfer-duties/rates-of-duty",
  commercialDutyTreatment: 'same',
  commercialDuty: null,
  commercialDutyNote: "The general conveyance scale applies to commercial and industrial land as well as residential.",

  landTax: {
    bands: [
      { from: 0, upTo: 125_000, fixed: 0, rate: 0 },
      { from: 125_000, upTo: 500_000, fixed: 50, rate: 0.0045 },
      { from: 500_000, upTo: Infinity, fixed: 1737.5, rate: 0.015 },
    ],
    threshold: 125_000,
    assessedOn: "Assessed land value (unimproved land value, not site/capital value) as shown on the land tax assessment notice. The Office of the Valuer-General determines assessed land value annually on 1 July; where a council district is not revalued that year, market-based adjustment factors are applied to existing land values. Liability is set by ownership and land classification as at 1 July each year (the assessment date). Where an owner holds more than one taxable property, the assessed land value of each property is aggregated (added together) within each land classification and land tax is calculate…",
  },
  landTaxSourceUrl: "https://www.sro.tas.gov.au/land-tax/rates-of-land-tax",

  warranty: {
    name: "None in force — Tasmania abolished compulsory housing indemnity / home warranty insurance in 2008 and is the only Australian state without a mandatory scheme. A replacement scheme is legislated by the Residential Building (Home Warranty Insurance Amendments) Act 2023 (No. 25 of 2023), which amends the Residential Building Work Contracts and Dispute Resolution Act 2016, but its operative provisions commence on a day to be proclaimed and had not been proclaimed as at the date of this research.",
    shortName: "None (no mandatory scheme)",
    threshold: Infinity,
    premiumRate: 0,
    premiumRange: { low: 0, high: 0 },
    regulator: "None currently — no scheme is in force. Consumer, Building and Occupational Services (CBOS), Department of Justice (Tas) is the building/consumer regulator and would administer the legislated but uncommenced scheme. In the interim CBOS administers a discretionary, budget-funded Financial Assistance Package for consumers affected by construction company failures, which is a government safety net rather than insurance and creates no premium cost line for a builder or developer.",
  },
  warrantySourceUrl: "https://www.cbos.tas.gov.au/topics/housing/buying-selling-property/financial-assistance-package-for-consumers-affected-by-construction-failures",

  practitioners: null,

  contributionPerDwelling: { low: 3_000, point: 12_000, high: 40_000 },
  contributionMechanism: "Tasmania has no codified developer contributions system equivalent to NSW s7.11/s7.12 or Victorian DCPs/GAIC. Contributions arise from three separate, largely uncoordinated sources: (1) planning permit conditions and negotiated agreements under the Land Use Planning and Approvals Act 1993 (LUPAA) — Part 5 agreements between a developer and the planning authority, typically framed as \"works intern…",

  regions: [
    { key: 'hobart', label: "Hobart", multiplier: 0.88, isDefault: true },
    { key: 'launceston', label: "Launceston", multiplier: 0.86 },
    { key: 'regional_tas', label: "Regional Tasmania", multiplier: 0.9 },
  ],

  quirks: [
    "No mandatory home warranty / builder indemnity insurance. Tasmania abolished its compulsory scheme in 2008 and is the only Australian state without one. This removes a 0.5-2% of contract value cost line that exists in every other jurisdiction, but it also means purchaser and lender comfort rests en…",
    "The replacement scheme is legislated but dormant. The Residential Building (Home Warranty Insurance Amendments) Act 2023 amends the Residential Building Work Contracts and Dispute Resolution Act 2016 to require a policy for residential building contracts over a proposed $20,000 threshold, with the …",
    "Water and sewerage headworks are set by ONE statewide authority, not by councils. TasWater is the sole water and sewerage corporation for the whole state (stormwater stays with councils), and its developer charges are approved by the Tasmanian Economic Regulator in a four-yearly Price and Service P…",
    "Section 56 LUPAA gives a route to strip stale headworks conditions. Where TasWater's developer charges policy has changed after a permit issued, a developer can apply to the council for a minor amendment under s 56 of LUPAA to remove or vary the TasWater permit conditions relating to headworks char…",
    "Subdivision runs on a separate statutory track from the planning permit. Beyond the LUPAA planning permit, subdivision in Tasmania is governed by Part 3 of the Local Government (Building and Miscellaneous Provisions) Act 1993 — a 1993-era conveyancing-flavoured regime for sealing of plans, engineer…",
    "Public open space contribution is a percentage of LAND VALUE, not a fixed per-lot charge. Up to 5% of the land or its value under ss 116-117 of the LG(B&MP) Act 1993, generally on subdivision into 3+ lots, with each council setting its own policy and each valuing differently. On expensive Hobart, K…",
    "Statutory warranties under the Residential Building Work Contracts and Dispute Resolution Act 2016 cannot be contracted out of, and disputes must go through COMPULSORY CBOS mediation first. A residential building dispute goes to CBOS mediation before it can reach TASCAT's Civil and Consumer Stream,…",
    "One statewide planning scheme with local variation only in a schedule. The Tasmanian Planning Scheme comprises State Planning Provisions (uniform zones and 16 codes statewide) plus a Local Provisions Schedule per council. Controls are far more standardised than in NSW or Victoria, but where the LPS…",
  ],
}
