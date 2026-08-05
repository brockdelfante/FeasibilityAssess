/**
 * QLD — 2026-27.
 *
 * GENERATED from _research/verified-2026-08-05.json by
 * scripts/generate-jurisdiction-profiles.mjs. Do not edit by hand: re-run the
 * generator so the code cannot drift from the verified source.
 *
 * Duty and land tax were transcribed from the revenue office's published tables
 * and independently verified band by band. Verifier verdict: duty
 * confirmed, land tax confirmed.
 * Official worked example reconciled: 850,000 → 31,275.
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

export const QLD: JurisdictionProfile = {
  code: 'QLD',
  name: "Queensland",
  taxYear: "2026-27",
  confidence: 'verified',
  asAt: '2026-08-05',

  duty: {
    bands: [
      // Not more than $5,000 | Nil
      { from: 0, upTo: 5_000, kind: 'marginal', fixed: 0, rate: 0 },
      // More than $5,000 up to $75,000 | $1.50 for each $100, or part of $100, over
      // $5,000
      { from: 5_000, upTo: 75_000, kind: 'marginal', fixed: 0, rate: 0.015 },
      // $75,000 to $540,000 | $1,050 plus $3.50 for each $100, or part of $100, over
      // $75,000
      { from: 75_000, upTo: 540_000, kind: 'marginal', fixed: 1_050, rate: 0.035 },
      // $540,000 to $1,000,000 | $17,325 plus $4.50 for each $100, or part of $100,
      // over $540,000
      { from: 540_000, upTo: 1_000_000, kind: 'marginal', fixed: 17_325, rate: 0.045 },
      // More than $1,000,000 | $38,025 plus $5.75 for each $100, or part of $100,
      // over $1,000,000
      { from: 1_000_000, upTo: Infinity, kind: 'marginal', fixed: 38_025, rate: 0.0575 },
    ],
    minimum: 0,
    premiumThreshold: null,
    roundExcessTo100: true,
    upperBoundInclusive: true,
    residentialPremium: null,
  },
  dutySourceUrl: "https://qro.qld.gov.au/duties/transfer-duty/calculate/rates/",
  commercialDutyTreatment: 'same',
  commercialDuty: null,
  commercialDutyNote: "The general conveyance scale applies to commercial and industrial land as well as residential.",

  landTax: {
    bands: [
      { from: 0, upTo: 350_000, fixed: 0, rate: 0 },
      { from: 350_000, upTo: 2_250_000, fixed: 1_450, rate: 0.017 },
      { from: 2_250_000, upTo: 5_000_000, fixed: 33_750, rate: 0.015 },
      { from: 5_000_000, upTo: 10_000_000, fixed: 75_000, rate: 0.0225 },
      { from: 10_000_000, upTo: Infinity, fixed: 187_500, rate: 0.0275 },
    ],
    threshold: 350_000,
    assessedOn: "Total taxable value of all freehold land the owner holds in Queensland at midnight 30 June (for the 2026-27 year, midnight 30 June 2026). Land tax AGGREGATES across the taxpayer's holdings: all land owned solely plus the owner's share (interest) in land owned jointly with others. Each entity is assessed separately, so land held by a company, by an individual, and by that person as trustee are three separate aggregations with separate assessment notices. Per QRO, the 'taxable value' of each parcel for a financial year is the LESSER of (a) the Land Valuation Act 2010 value (the statutory land v…",
  },
  landTaxSourceUrl: "https://qro.qld.gov.au/land-tax/calculate/company-trust/",

  warranty: {
    name: "Queensland Home Warranty Scheme (statutory insurance under the Queensland Building and Construction Commission Act 1991 and the QBCC Regulation 2018) - commonly called QBCC home warranty insurance",
    shortName: "QHWS",
    threshold: 3_300,
    premiumRate: 0.0056,
    premiumRange: { low: 0.004, high: 0.01 },
    regulator: "Queensland Building and Construction Commission (QBCC) - the scheme is a not-for-profit statutory insurance fund administered by QBCC itself, not by private insurers",
  },
  warrantySourceUrl: "https://www.qbcc.qld.gov.au/home-owner-hub/queensland-home-warranty-scheme",

  practitioners: null,

  contributionPerDwelling: { low: 4_000, point: 22_000, high: 37_000 },
  contributionMechanism: "Infrastructure charges: levied by an infrastructure charges notice (Planning Act 2016 (Qld) ch 4, notice under s 119/s 121) at rates set in each local government's adopted infrastructure charges resolution (charges resolution). An adopted charge cannot exceed the \"maximum adopted charge\" / prescribed amount in sch 16 of the Planning Regulation 2017, indexed annually by the Producer Price Index fo…",

  regions: [
    { key: 'brisbane_metro', label: "Brisbane metro", multiplier: 0.9, isDefault: true },
    { key: 'gold_coast', label: "Gold Coast", multiplier: 0.92 },
    { key: 'sunshine_coast', label: "Sunshine Coast", multiplier: 0.91 },
    { key: 'cairns_townsville', label: "Cairns & Townsville", multiplier: 0.98 },
    { key: 'regional_qld', label: "Regional Queensland", multiplier: 0.95 },
  ],

  quirks: [
    "Three-storey cliff-edge on home warranty cover: building work in or for a multiple dwelling of MORE than three storeys (disregarding one storey used mainly as a carpark) is not 'residential construction work' and is therefore NOT insurable under the QHWS. A 3-storey walk-up carries the premium and …",
    "Premium is a pre-condition to starting: the contractor must pay the QHWS premium to QBCC before commencing work and, in practice, before accepting a deposit - it is a genuine up-front cash outflow, not an end-of-job cost, and it must be shown in the contract price.",
    "Cover is capped at $200,000 per dwelling for non-completion/defect claims, and the structural-defect cover period runs 6 years 6 months from the date of contract (extending to 7 years where the build takes more than 6 months) - the clock runs from contract date, not practical completion, which is u…",
    "Mandatory RPEQ: under the Professional Engineers Act 2002 all 'professional engineering services' provided in or for Queensland must be carried out or directly supervised by a Registered Professional Engineer of Queensland. Interstate consulting engineers cannot simply sign Queensland designs - thi…",
    "Two infrastructure charges notices in SEQ: council levies transport/parks/stormwater, while Urban Utilities or Unitywater separately levies water and sewerage under the SEQ Water (Distribution and Retail Restructuring) Act 2009. Feasibility models built on 'the council charge' alone systematically …",
    "Charges are capped by state regulation (sch 16, Planning Regulation 2017) - unlike NSW s7.11 plans there is a hard statutory ceiling per dwelling, and many regional councils adopt well below it or run temporary discounts/incentive policies down to near zero, so the same product can face a 10x swing…",
    "Infrastructure charges notices are negotiable and appellable: a recipient can seek a negotiated infrastructure charges notice, and can appeal a charges notice to the Planning and Environment Court or a development tribunal on limited grounds (e.g. error in calculation or application of the resoluti…",
    "Third-party (submitter) merits appeals: for impact-assessable development, anyone who made a properly made submission can appeal an approval to the Planning and Environment Court. This open-standing merits appeal right is a Queensland hallmark and a real programme/holding-cost risk that NSW and Vic…",
  ],
}
