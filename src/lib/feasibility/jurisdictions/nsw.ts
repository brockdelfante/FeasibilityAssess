/**
 * New South Wales.
 *
 * The duty and land tax figures here are asserted in `__verify.ts` against the
 * published schedules — duty on $2,000,000 is $92,012, and land tax at the
 * premium threshold is $88,036, which is the accumulated general-band tax at
 * that point and therefore a good check that the bands are continuous.
 */

import type { JurisdictionProfile } from './types'

export const NSW: JurisdictionProfile = {
  code: 'NSW',
  name: 'New South Wales',
  taxYear: '2025-26',
  confidence: 'verified',
  asAt: '2026-08-05',

  // -------------------------------------------------------------------------
  // Transfer duty — general rate, purely marginal
  // -------------------------------------------------------------------------
  duty: {
    bands: [
      { from: 0, upTo: 17_000, kind: 'marginal', fixed: 0, rate: 0.0125 },
      { from: 17_000, upTo: 37_000, kind: 'marginal', fixed: 212, rate: 0.015 },
      { from: 37_000, upTo: 99_000, kind: 'marginal', fixed: 512, rate: 0.0175 },
      { from: 99_000, upTo: 372_000, kind: 'marginal', fixed: 1_597, rate: 0.035 },
      { from: 372_000, upTo: 1_240_000, kind: 'marginal', fixed: 11_152, rate: 0.045 },
      { from: 1_240_000, upTo: 3_721_000, kind: 'marginal', fixed: 50_212, rate: 0.055 },
      // Premium property duty.
      { from: 3_721_000, upTo: Infinity, kind: 'marginal', fixed: 186_667, rate: 0.07 },
    ],
    minimum: 10,
    premiumThreshold: 3_721_000,
  },
  dutySourceUrl: 'https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/transfer-duty',

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
      'Total taxable land value of all NSW land you own that is not exempt, assessed at midnight on 31 December each year. Holdings are aggregated, so a portfolio owner pays more than this single-site figure.',
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
    'Premium property duty adds a top marginal rate of 7% above $3,721,000.',
    'Strata-titling a duplex makes it a Class 2 building, which triggers the DBP Act and its registered-practitioner regime. Torrens title avoids it.',
    'Duty thresholds are CPI-indexed every 1 July under the Duties Act 1997.',
  ],
}
