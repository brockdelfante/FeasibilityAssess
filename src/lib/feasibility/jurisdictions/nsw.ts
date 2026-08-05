/**
 * New South Wales — FY2026/27.
 *
 * Transcribed from Revenue NSW's published table (page last updated 26 June
 * 2026) and independently verified. The previous version of this file carried
 * the FY2025-26 schedule, which was superseded on 1 July 2026: duty thresholds
 * and fixed amounts are CPI-indexed EVERY 1 JULY, so this table needs
 * re-scraping each financial year. The applicable year is set by the CONTRACT
 * date, not settlement.
 *
 * The bands are self-consistent in a way that proves the transcription:
 * accumulating each band gives the next band's fixed amount, and the final
 * accumulation 52,237 + 2,580,000 × 0.055 = 194,137 exactly equals Revenue
 * NSW's own published premium-duty fixed amount. That $3,870,000 → $194,137
 * pair is asserted in `__verify.ts` as a regression anchor.
 *
 * Land tax thresholds are NOT indexed: the 2024-25 State Budget froze the
 * general ($1,075,000) and premium ($6,571,000) thresholds for every land tax
 * year after 2024, so those figures are stable for multi-year modelling.
 */

import type { JurisdictionProfile } from './types'

export const NSW: JurisdictionProfile = {
  code: 'NSW',
  name: 'New South Wales',
  taxYear: '2026-27',
  confidence: 'verified',
  asAt: '2026-08-05',

  // -------------------------------------------------------------------------
  // Transfer duty — general (section 32) scale, FY2026/27
  //
  // Verbatim source rows:
  //   $0 to $18,000            | $1.25 for every $100 (minimum $20)
  //   $18,001 to $38,000       | $225 plus $1.50 for every $100 over $18,000
  //   $38,001 to $103,000      | $525 plus $1.75 for every $100 over $38,000
  //   $103,001 to $387,000     | $1,662 plus $3.50 for every $100 over $103,000
  //   $387,001 to $1,290,000   | $11,602 plus $4.50 for every $100 over $387,000
  //   Over $1,290,000          | $52,237 plus $5.50 for every $100 over $1,290,000
  // -------------------------------------------------------------------------
  duty: {
    bands: [
      // Starts at $0, so flat and marginal are arithmetically identical here.
      { from: 0, upTo: 18_000, kind: 'flat', fixed: 0, rate: 0.0125 },
      { from: 18_000, upTo: 38_000, kind: 'marginal', fixed: 225, rate: 0.015 },
      { from: 38_000, upTo: 103_000, kind: 'marginal', fixed: 525, rate: 0.0175 },
      // $1,662 looks like it should be $1,662.50 — the true cumulative figure.
      // Revenue NSW rounded it DOWN and then propagated the rounded value into
      // $11,602, $52,237 and $194,137, none of which reconcile off $1,662.50.
      // Do not "correct" this: it would put every value above $103,000 fifty
      // cents high and break the published premium anchor.
      { from: 103_000, upTo: 387_000, kind: 'marginal', fixed: 1_662, rate: 0.035 },
      { from: 387_000, upTo: 1_290_000, kind: 'marginal', fixed: 11_602, rate: 0.045 },
      { from: 1_290_000, upTo: Infinity, kind: 'marginal', fixed: 52_237, rate: 0.055 },
    ],
    minimum: 20,
    premiumThreshold: 3_870_000,
    roundExcessTo100: true,
    upperBoundInclusive: true,
    // Premium property duty is RESIDENTIAL ONLY. Applying it to a commercial or
    // industrial site would overstate duty badly above the threshold.
    residentialPremium: {
      threshold: 3_870_000,
      fixed: 194_137,
      rate: 0.07,
      note: 'Premium property duty applies to residential land only. Where a parcel is part business, only the residential portion attracts it; above 2 hectares it applies to the first 2 hectares as a proportion of overall value.',
    },
  },
  dutySourceUrl:
    'https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/transfer-duty/understanding-transfer-duty/calculate-transfer-duty',
  commercialDutyTreatment: 'same',
  commercialDuty: null,
  commercialDutyNote:
    'NSW applies the same general scale to commercial and industrial land, but the residential premium tier above $3,870,000 does not apply.',

  // -------------------------------------------------------------------------
  // Land tax — general rate, assessed 31 December
  // -------------------------------------------------------------------------
  landTax: {
    bands: [
      { from: 0, upTo: 1_075_000, fixed: 0, rate: 0 },
      { from: 1_075_000, upTo: 6_571_000, fixed: 100, rate: 0.016 },
      // At the premium threshold the general band has accumulated to $88,036.
      { from: 6_571_000, upTo: Infinity, fixed: 88_036, rate: 0.02 },
    ],
    threshold: 1_075_000,
    assessedOn:
      'Unimproved land value as determined by the NSW Valuer General at 1 July, then averaged over three years (or fewer for a parcel created more recently by subdivision). Taxing date is midnight 31 December and the charge covers the whole following calendar year — it is NOT pro-rated, so selling mid-year does not reduce it. Holdings are aggregated: the threshold applies to the combined value of all your taxable NSW land, and joint owners share one threshold.',
  },
  landTaxSourceUrl: 'https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/land-tax',

  // -------------------------------------------------------------------------
  // Home Building Compensation Fund
  // -------------------------------------------------------------------------
  warranty: {
    name: 'Home Building Compensation Fund',
    shortName: 'HBCF',
    threshold: 20_000,
    premiumRate: 0.007,
    premiumRange: { low: 0.005, high: 0.01 },
    regulator: 'icare',
  },
  warrantySourceUrl: 'https://www.icare.nsw.gov.au/builders-and-homeowners',

  // -------------------------------------------------------------------------
  // Design and Building Practitioners Act 2020 — unique to NSW
  // -------------------------------------------------------------------------
  practitioners: {
    name: 'Design and Building Practitioners Act 2020',
    appliesToClass2: true,
    baseCostUplift: 50_000,
    costPerExtraDwelling: 4_500,
    costRange: { low: 45_000, high: 120_000 },
    programMonthsBase: 1.5,
    programMonthsMax: 4,
    requiredPractitioners: [
      'Registered Design Practitioner (architect or design lead)',
      'Principal Design Practitioner (coordinates the design package)',
      'Registered Building Practitioner (your builder — verify before contract)',
      'Registered fire-safety practitioner',
      'Registered structural engineer (DBP-registered)',
      'Registered hydraulic and mechanical engineers (DBP-registered)',
    ],
    registerUrl: 'https://www.nsw.gov.au/housing-and-construction/registers',
  },

  contributionPerDwelling: { low: 8_000, point: 28_000, high: 75_000 },
  contributionMechanism:
    'Section 7.11 and 7.12 contributions under the Environmental Planning and Assessment Act 1979, set independently by each council',

  // -------------------------------------------------------------------------
  // Construction cost regions — multipliers against the Sydney-metro library
  // -------------------------------------------------------------------------
  regions: [
    { key: 'sydney_metro', label: 'Sydney metro', multiplier: 1.0, isDefault: true },
    { key: 'newcastle_hunter', label: 'Newcastle & Hunter', multiplier: 0.94 },
    { key: 'illawarra', label: 'Illawarra & Wollongong', multiplier: 0.96 },
    { key: 'central_coast', label: 'Central Coast', multiplier: 0.95 },
    { key: 'regional_nsw', label: 'Regional NSW', multiplier: 0.9 },
    { key: 'remote_nsw', label: 'Remote NSW', multiplier: 1.08 },
  ],

  quirks: [
    'Land tax applies to development sites held through a DA, because they are not your principal place of residence. On a $3M site that is roughly $31,000 a year.',
    'Premium property duty adds a top rate of 7% above $3,870,000 — but on RESIDENTIAL land only, so a commercial or industrial site above the threshold does not attract it.',
    'Strata-titling a duplex makes it a Class 2 building, which triggers the DBP Act and its registered-practitioner regime. Torrens title avoids it.',
    'Duty thresholds are CPI-indexed every 1 July, and the applicable year is set by the contract date, not settlement. Land tax thresholds are frozen for all years after 2024.',
    'Surcharge purchaser duty adds 9% of dutiable value where a foreign person acquires residential-related property — including vacant land zoned for residential use. It is not CPI-indexed and is not modelled here.',
    'Surcharge land tax adds 5% of unimproved value annually for foreign owners of residential land, with no tax-free threshold, on top of ordinary land tax.',
    'A discretionary or family trust is a "special trust" for land tax: it gets NO threshold and pays a flat 1.6% from the first dollar. A $600,000 site in a family trust attracts $9,600 where a company would pay nothing.',
  ],
}
