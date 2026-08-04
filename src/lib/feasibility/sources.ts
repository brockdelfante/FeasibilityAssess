/**
 * Citations. Every derived number carries a `sourceKey` pointing at one of
 * these so the client can see where an assumption came from — and how much to
 * trust it.
 */

export interface Source {
  key: string
  title: string
  detail: string
  url?: string
  /** When the underlying schedule or library was last checked. */
  asAt: string
}

export const RATE_LIBRARY_VERSION = 'NSW-2025.26'

/** Bump when the rate tables below are revised. */
export const RATE_LIBRARY_REFRESHED = '2026-07-01'

export const SOURCES: Record<string, Source> = {
  nsw_transfer_duty: {
    key: 'nsw_transfer_duty',
    title: 'NSW transfer (stamp) duty',
    detail:
      'Schedule for 1 July 2025 – 30 June 2026, from Revenue NSW. Thresholds are CPI-indexed annually under the Duties Act 1997, Chapter 2, Part 3, Division 3, so they re-index every July.',
    url: 'https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/transfer-duty',
    asAt: '2025-07-01',
  },
  nsw_land_tax: {
    key: 'nsw_land_tax',
    title: 'NSW land tax',
    detail:
      'FY2025–26 thresholds. Assessed on 31 December each year on land that is not your principal place of residence — including development sites sitting idle waiting on DA or construction.',
    url: 'https://www.revenue.nsw.gov.au/taxes-duties-levies-royalties/land-tax',
    asAt: '2025-07-01',
  },
  nsw_hbcf: {
    key: 'nsw_hbcf',
    title: 'NSW Home Building Compensation Fund',
    detail:
      'HBCF cover is required on residential building work over $20,000. The premium shown is an indicative percentage of contract value — the actual premium varies with contract value, dwelling count and builder risk rating.',
    url: 'https://www.icare.nsw.gov.au/builders-and-homeowners',
    asAt: '2025-07-01',
  },
  construction_rates: {
    key: 'construction_rates',
    title: 'Construction $/m² rates',
    detail:
      'Sydney metro 2025–26 rates, triangulated from published construction cost guides (Rawlinsons, Altus Group, Rider Levett Bucknall) and indicative builder-rate ranges. Replace with a real builder quote for higher confidence.',
    asAt: RATE_LIBRARY_REFRESHED,
  },
  council_contributions: {
    key: 'council_contributions',
    title: 'Council & infrastructure contributions',
    detail:
      'NSW councils set contributions independently under s7.11 / s7.12 of the Environmental Planning and Assessment Act 1979. The figure shown is a wide indicative range only — verify with the relevant council or a town planner before you exchange.',
    asAt: RATE_LIBRARY_REFRESHED,
  },
  finance_rates: {
    key: 'finance_rates',
    title: 'Finance rates & terms',
    detail:
      'Indicative bands for typical Australian residential development finance. Real pricing depends on the lender, leverage, presales, security and project risk — always replace with a lender quote before committing.',
    asAt: RATE_LIBRARY_REFRESHED,
  },
  nsw_dbp: {
    key: 'nsw_dbp',
    title: 'NSW Design and Building Practitioners Act 2020',
    detail:
      'Class 2, 3 and 9c buildings require registered Design and Building Practitioners and regulated design declarations. Verify every practitioner on the NSW Public Register before contract.',
    url: 'https://www.nsw.gov.au/housing-and-construction/registers',
    asAt: '2025-07-01',
  },
  ncc_classes: {
    key: 'ncc_classes',
    title: 'National Construction Code building classifications',
    detail:
      'Class 1a is a single dwelling on its own title. Class 2 is two or more sole-occupancy units sharing a building — which covers almost every strata-titled duplex, townhouse or apartment.',
    url: 'https://ncc.abcb.gov.au/',
    asAt: '2025-07-01',
  },
  gst_margin_scheme: {
    key: 'gst_margin_scheme',
    title: 'GST margin scheme',
    detail:
      'Under Division 75 of the GST Act the margin scheme charges 1/11 of the margin (sale price less acquisition cost) rather than 1/11 of the full sale price. Eligibility depends on how the land was acquired — confirm with your accountant.',
    url: 'https://www.ato.gov.au/businesses-and-organisations/gst-excise-and-indirect-taxes/gst/in-detail/your-industry/property/gst-and-the-margin-scheme',
    asAt: '2025-07-01',
  },
  selling_costs: {
    key: 'selling_costs',
    title: 'Agent commission & marketing',
    detail:
      'Indicative Sydney metro rates — agent commission around 2.2% of gross realisation and a marketing campaign around 1.2%. Both are negotiable and vary with price point and agency.',
    asAt: RATE_LIBRARY_REFRESHED,
  },
  lmi: {
    key: 'lmi',
    title: 'Lenders Mortgage Insurance',
    detail:
      'Indicative LMI premium bands for owner-occupier lending above 80% LVR. Actual premiums vary by lender, loan size and borrower profile.',
    asAt: RATE_LIBRARY_REFRESHED,
  },
  serviceability: {
    key: 'serviceability',
    title: 'Serviceability & DTI',
    detail:
      'APRA guidance expects lenders to assess repayments with a serviceability buffer above the actual rate, and treats debt-to-income ratios at or above 6.0 as heightened risk.',
    url: 'https://www.apra.gov.au/',
    asAt: '2025-07-01',
  },
}

export function sourceFor(key: string | undefined): Source | null {
  if (!key) return null
  return SOURCES[key] ?? null
}
