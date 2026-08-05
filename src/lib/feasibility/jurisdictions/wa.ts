/**
 * WA — 2026-27.
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

export const WA: JurisdictionProfile = {
  code: 'WA',
  name: "Western Australia",
  taxYear: "2026-27",
  confidence: 'verified',
  asAt: '2026-08-05',

  duty: {
    bands: [
      // $0 - $120,000 | $1.90 per $100 or part thereof
      { from: 0, upTo: 120_000, kind: 'marginal', fixed: 0, rate: 0.019 },
      // $120,001 - $150,000 | $2,280 + $2.85 per $100 or part thereof above $120,000
      { from: 120_000, upTo: 150_000, kind: 'marginal', fixed: 2_280, rate: 0.0285 },
      // $150,001 - $360,000 | $3,135 + $3.80 per $100 or part thereof above $150,000
      { from: 150_000, upTo: 360_000, kind: 'marginal', fixed: 3_135, rate: 0.038 },
      // $360,001 - $725,000 | $11,115 + $4.75 per $100 or part thereof above
      // $360,000
      { from: 360_000, upTo: 725_000, kind: 'marginal', fixed: 11_115, rate: 0.0475 },
      // $725,001 + | $28,453 + $5.15 per $100 or part thereof above $725,000
      { from: 725_000, upTo: Infinity, kind: 'marginal', fixed: 28_453, rate: 0.0515 },
    ],
    minimum: 0,
    premiumThreshold: null,
    roundExcessTo100: true,
    upperBoundInclusive: true,
    residentialPremium: null,
  },
  dutySourceUrl: "https://www.wa.gov.au/organisation/department-of-treasury-and-finance/transfer-duty-assessment",
  commercialDutyTreatment: 'same',
  commercialDuty: null,
  commercialDutyNote: "The general conveyance scale applies to commercial and industrial land as well as residential.",

  landTax: {
    bands: [
      { from: 0, upTo: 300_000, fixed: 0, rate: 0 },
      { from: 300_000, upTo: 420_000, fixed: 300, rate: 0 },
      { from: 420_000, upTo: 1_000_000, fixed: 300, rate: 0.0025 },
      { from: 1_000_000, upTo: 1_800_000, fixed: 1_750, rate: 0.009 },
      { from: 1_800_000, upTo: 5_000_000, fixed: 8_950, rate: 0.018 },
      { from: 5_000_000, upTo: 11_000_000, fixed: 66_550, rate: 0.02 },
      { from: 11_000_000, upTo: Infinity, fixed: 186_550, rate: 0.0267 },
    ],
    threshold: 300_000,
    assessedOn: "Unimproved value of the land as determined by the Valuer-General (NOT site value, and not capital/improved value). Per RevenueWA: \"The taxable value for land is the lesser of the current unimproved value of the land or 150% of the previous year's unimproved value\" — a per-parcel cap applied before aggregation. Assessment date: ownership at midnight on 30 June immediately preceding the assessment (financial) year — i.e. 30 June 2026 for the 2026-27 assessment year. Land tax AGGREGATES across a taxpayer's holdings: \"Land tax is calculated on the aggregated taxable value of all non-exempt land h…",
  },
  landTaxSourceUrl: "https://www.wa.gov.au/organisation/department-of-treasury-and-finance/land-tax-assessment",

  warranty: {
    name: "Home Indemnity Insurance (compulsory under the Home Building Contracts Act 1991 (WA), Part 3A; policies issued by QBE Insurance (Australia) Ltd as agent for a State-supported scheme, plus AOBIS for owner-builders)",
    shortName: "HII",
    threshold: 20_000,
    premiumRate: 0.003,
    premiumRange: { low: 0.0015, high: 0.007 },
    regulator: "Building and Energy, Department of Local Government, Industry Regulation and Safety (LGIRS) — established 1 July 2025, taking over Industry Regulation and Safety from the former DEMIRS/DMIRS. Building Services Board handles registration; the permit authority (local government) must sight the HII certificate before issuing a building permit.",
  },
  warrantySourceUrl: "https://www.wa.gov.au/government/publications/home-indemnity-insurance-fact-sheet",

  practitioners: null,

  contributionPerDwelling: { low: 0, point: 10_000, high: 30_000 },
  contributionMechanism: "Development Contribution Plans (DCPs) applying to gazetted Development Contribution Areas (DCAs), imposed through local planning scheme provisions made under the Planning and Development Act 2005 and the Planning and Development (Local Planning Schemes) Regulations 2015, guided by State Planning Policy 3.6 – Infrastructure Contributions (revised SPP 3.6 gazetted 30 April 2021). Contributions are …",

  regions: [
    { key: 'perth_metro', label: "Perth metro", multiplier: 0.92, isDefault: true },
    { key: 'bunbury_southwest', label: "Bunbury & South West", multiplier: 0.95 },
    { key: 'regional_wa', label: "Regional Western Australia", multiplier: 1.05 },
    { key: 'remote_wa', label: "Remote Western Australia", multiplier: 1.35 },
  ],

  quirks: [
    "HOME INDEMNITY INSURANCE DOES NOT APPLY TO APARTMENTS. Under the Home Building Contracts (Home Indemnity Insurance Exemptions) Regulations 2002 (amended 2024), building work on a 'multi-storey multi-unit development' (a building of 2 or more independent dwelling units) is exempt from the compulsory…",
    "Cover limits doubled in 2024: HII now pays up to $40,000 for loss of deposit and up to $200,000 for incomplete or defective work (previously $20,000/$100,000), capped at the contract value, with a $500 QBE excess. Cover runs for the construction period plus six years from practical completion, and …",
    "QBE is effectively the only provider for registered builders, writing as agent for the State scheme (the State receives a share of premiums). There is no published premium rate table: eligibility and per-project premiums are set by QBE underwriting on the builder's financial capacity, turnover and …",
    "SUBDIVISION IS A STATE DECISION, NOT A COUNCIL ONE. The Western Australian Planning Commission (not the local government) determines all subdivision and strata subdivision applications under the Planning and Development Act 2005. Local government is a referral agency only. Developers must therefore…",
    "TWO LAYERS OF PLANNING SCHEME IN PERTH AND PEEL. The Metropolitan Region Scheme (and the Peel and Greater Bunbury region schemes) sits above local schemes and reserves land for regional roads, parks and infrastructure. Land in an MRS reservation cannot be developed and is compulsorily acquired over…",
    "10% PUBLIC OPEN SPACE CESSION, FREE OF COST. WAPC Development Control Policy 2.3 requires 10% of the gross subdivisible area to be ceded free of cost and vested in the Crown as recreation reserve, generally where 6 or more lots are created (including built-strata). Cash-in-lieu is only available wi…",
    "TWO CONSTRUCTION LEVIES ON TOP OF PERMIT FEES. (1) Construction Training Fund levy at 0.2% of estimated construction value — payable before construction starts, on residential, commercial and civil work, and payable whether or not a building permit is required. The threshold rose from $20,000 to $1…",
    "DEVELOPMENT ASSESSMENT PANELS ARE NOW OPT-IN, NOT MANDATORY. Since the 1 March 2024 reforms (Planning and Development Amendment Act 2023), DAP determination is an election available to the applicant for non-excluded development over $2 million, including grouped and multiple dwellings of any size —…",
  ],
}
