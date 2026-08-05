/**
 * SA — 2026-27.
 *
 * GENERATED from _research/verified-2026-08-05.json by
 * scripts/generate-jurisdiction-profiles.mjs. Do not edit by hand: re-run the
 * generator so the code cannot drift from the verified source.
 *
 * Duty and land tax were transcribed from the revenue office's published tables
 * and independently verified band by band. Verifier verdict: duty
 * confirmed, land tax confirmed.
 * Official worked example reconciled: 600,000 → 26,830.
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

export const SA: JurisdictionProfile = {
  code: 'SA',
  name: "South Australia",
  taxYear: "2026-27",
  confidence: 'verified',
  asAt: '2026-08-05',

  duty: {
    bands: [
      // Does not exceed $12,000 — $1.00 for every $100 or part of $100
      { from: 0, upTo: 12_000, kind: 'marginal', fixed: 0, rate: 0.01 },
      // Exceeds $12,000 but not $30,000 — $120 plus $2.00 for every $100 or part of
      // $100 over $12,000
      { from: 12_000, upTo: 30_000, kind: 'marginal', fixed: 120, rate: 0.02 },
      // Exceeds $30,000 but not $50,000 — $480 plus $3.00 for every $100 or part of
      // $100 over $30,000
      { from: 30_000, upTo: 50_000, kind: 'marginal', fixed: 480, rate: 0.03 },
      // Exceeds $50,000 but not $100,000 — $1,080 plus $3.50 for every $100 or part
      // of $100 over $50,000
      { from: 50_000, upTo: 100_000, kind: 'marginal', fixed: 1_080, rate: 0.035 },
      // Exceeds $100,000 but not $200,000 — $2,830 plus $4.00 for every $100 or part
      // of $100 over $100,000
      { from: 100_000, upTo: 200_000, kind: 'marginal', fixed: 2_830, rate: 0.04 },
      // Exceeds $200,000 but not $250,000 — $6,830 plus $4.25 for every $100 or part
      // of $100 over $200,000
      { from: 200_000, upTo: 250_000, kind: 'marginal', fixed: 6_830, rate: 0.0425 },
      // Exceeds $250,000 but not $300,000 — $8,955 plus $4.75 for every $100 or part
      // of $100 over $250,000
      { from: 250_000, upTo: 300_000, kind: 'marginal', fixed: 8_955, rate: 0.0475 },
      // Exceeds $300,000 but not $500,000 — $11,330 plus $5.00 for every $100 or
      // part of $100 over $300,000
      { from: 300_000, upTo: 500_000, kind: 'marginal', fixed: 11_330, rate: 0.05 },
      // Exceeds $500,000 — $21,330 plus $5.50 for every $100 or part of $100 over
      // $500,000
      { from: 500_000, upTo: Infinity, kind: 'marginal', fixed: 21_330, rate: 0.055 },
    ],
    minimum: 0,
    premiumThreshold: null,
    roundExcessTo100: true,
    upperBoundInclusive: true,
    residentialPremium: null,
  },
  dutySourceUrl: "https://revenuesa.sa.gov.au/stamp-duty/rate-of-stamp-duty",
  commercialDutyTreatment: 'nil',
  commercialDuty: null,
  commercialDutyNote: "South Australia abolished conveyance duty on non-residential, non-primary-production land from 1 July 2018. A commercial or industrial site attracts NO duty, so the residential scale must not be applied to it. The determinant is the Valuer-General Land Use Code plus PDI Act 2016 zoning, which cannot be inferred from price — confirm the land use before relying on either figure.",

  landTax: {
    bands: [
      { from: 0, upTo: 936_000, fixed: 0, rate: 0 },
      { from: 936_000, upTo: 1_504_000, fixed: 0, rate: 0.005 },
      { from: 1_504_000, upTo: 2_188_000, fixed: 2_840, rate: 0.01 },
      { from: 2_188_000, upTo: 3_504_000, fixed: 9_680, rate: 0.02 },
      { from: 3_504_000, upTo: Infinity, fixed: 36_000, rate: 0.024 },
    ],
    threshold: 936_000,
    assessedOn: "Site value (the Valuer-General's site value of the land, i.e. land value excluding improvements — explicitly NOT capital value), assessed on ownership and property details as at midnight on 30 June immediately preceding the financial year (so 30 June 2026 for the 2026-27 year). Land tax aggregates: where an ownership holds more than one taxable property, all taxable site values are added together (aggregated) to give the \"total taxable site value\" for that ownership, the rate scale is applied to that aggregate, and the resulting tax is then apportioned back to each taxable property in proport…",
  },
  landTaxSourceUrl: "https://revenuesa.sa.gov.au/landtax/rates-and-thresholds",

  warranty: {
    name: "Building Indemnity Insurance (required under s 34 of the Building Work Contractors Act 1995 (SA) and the Building Work Contractors Regulations 2011)",
    shortName: "BII",
    threshold: 20_000,
    premiumRate: 0.0045,
    premiumRange: { low: 0.003, high: 0.008 },
    regulator: "Consumer and Business Services (CBS), SA Attorney-General's Department — licensing, eligibility and enforcement; cover is written by private insurers (QBE holds the large majority of the SA market) and reinsured/backed by the South Australian Government Financing Authority (SAFA), which administers the scheme's builder/broker, homeowner and certifier interfaces",
  },
  warrantySourceUrl: "https://www.sa.gov.au/topics/housing/buying-building-selling/building-a-home/building-indemnity-insurance",

  practitioners: null,

  contributionPerDwelling: { low: 4_000, point: 16_000, high: 45_000 },
  contributionMechanism: "SA has no NSW-style s7.11/s7.12 general developer-contributions system and no GAIC equivalent. Instead a developer faces a stack of separate, mostly state-level charges: (1) OPEN SPACE CONTRIBUTION under s 198 of the Planning, Development and Infrastructure Act 2016 (PDI Act), with rates set by the Planning, Development and Infrastructure (Fees, Charges and Contributions) Regulations 2019 — eithe…",

  regions: [
    { key: 'adelaide_metro', label: "Adelaide metro", multiplier: 0.85, isDefault: true },
    { key: 'regional_sa', label: "Regional South Australia", multiplier: 0.9 },
  ],

  quirks: [
    "Building Indemnity Insurance thresholds and limits moved recently: from 10 November 2025 the trigger value rose from $12,000 to $20,000 and the statutory policy limit rose to $250,000 (QBE lifted its own limit to $250,000 from 1 October 2025). Feasibility models and contract templates built on the …",
    "BII cover is narrow by national standards - it responds only where the builder dies, disappears or becomes insolvent, and runs for 5 years from completion. It is not a general defects warranty, so buyer/lender due diligence in SA leans harder on the builder's own covenant.",
    "SA's scheme is a private-market scheme sitting on a government balance sheet: QBE writes most policies, SAFA reinsures and administers the scheme's public-facing information, and CBS gates entry via eligibility letters and job/turnover profile limits. A builder's eligibility ceiling, not the contra…",
    "There is no general council developer-contributions plan regime. A developer cannot look up a single 'contributions plan' the way they would in NSW or QLD - the charges are scattered across the PDI Act open space contribution, SA Water augmentation charges, and (in growth areas only) a Part 13 infr…",
    "Part 13 infrastructure schemes are brand new and only just being used. Concordia is the first basic infrastructure scheme, at $15,409 per dwelling; 'general infrastructure schemes' remain dormant because the Act requires a State Planning Commission inquiry before they can be switched on. Expect mor…",
    "SA Water augmentation charges are on a deliberate, steep escalation path (infill went from $2,500 per connection in 2024-25 to $5,120 in 2025-26, heading toward about $10,000 from 1 July 2027). The charge attaches by SA Water development approval date within the financial year, so approval timing m…",
    "The open space contribution is per additional allotment and only bites on allotments not exceeding 1 hectare; a strata or community-title conversion can therefore attract it lot-by-lot. Above 20 allotments the authority can instead demand up to 12.5% of the site vested as open space, which is a lan…",
    "The Planning and Design Code's Affordable Housing Overlay requires a minimum 15% affordable housing in developments of 20 or more dwellings or residential allotments in overlay areas, and the overlay is routinely applied when land is rezoned for growth or higher density. Rezoning upside in SA is us…",
  ],
}
