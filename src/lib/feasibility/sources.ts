/**
 * Citations. Every derived number carries a `sourceKey` pointing at one of
 * these so the client can see where an assumption came from — and how much to
 * trust it.
 *
 * The statutory citations are generated from the jurisdiction profiles rather
 * than written out here, so a citation cannot claim one schedule while the
 * calculator uses another.
 */

import { LIVE_JURISDICTION_CODES, profileFor } from './jurisdictions'
import {
  contributionsSourceKey,
  dutySourceKey,
  landTaxSourceKey,
  practitionerSourceKey,
  warrantySourceKey,
} from './statutory'

export interface Source {
  key: string
  title: string
  detail: string
  url?: string
  /** When the underlying schedule or library was last checked. */
  asAt: string
}

export const RATE_LIBRARY_VERSION = 'AU-2026.27'

/** Bump when the rate tables below are revised. */
export const RATE_LIBRARY_REFRESHED = '2026-07-01'

/** Long profile prose is fine in a trace sheet, but not unbounded. */
function trim(text: string, max = 420): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`
}

/**
 * One duty / land tax / warranty / contributions citation per live jurisdiction,
 * built straight off the profile so the schedule year and URL always match the
 * figures the engine used.
 */
function jurisdictionSources(): Record<string, Source> {
  const out: Record<string, Source> = {}

  for (const code of LIVE_JURISDICTION_CODES) {
    const p = profileFor(code)

    out[dutySourceKey(code)] = {
      key: dutySourceKey(code),
      title: `${code} transfer (stamp) duty`,
      detail: trim(
        `${p.name} conveyance duty schedule for ${p.taxYear}, transcribed from the revenue office's published table and verified band by band. ${p.commercialDutyNote} The year that applies is set by your contract date, not settlement.`
      ),
      url: p.dutySourceUrl,
      asAt: p.asAt,
    }

    out[landTaxSourceKey(code)] = {
      key: landTaxSourceKey(code),
      title: `${code} land tax`,
      detail: trim(
        `${p.name} land tax, ${p.taxYear}. Assessed on ${p.landTax.assessedOn} A development site sitting idle waiting on DA or construction is generally taxable.`
      ),
      url: p.landTaxSourceUrl,
      asAt: p.asAt,
    }

    out[warrantySourceKey(code)] = {
      key: warrantySourceKey(code),
      title: `${code} ${p.warranty.shortName}`,
      detail: trim(
        `${p.warranty.name} Cover is compulsory on residential building work over $${p.warranty.threshold.toLocaleString()}. The premium shown is an indicative percentage of contract value — INDICATIVE ONLY, not transcribed from a premium table. The real premium varies with contract value, dwelling count and the builder's risk rating.`
      ),
      url: p.warrantySourceUrl ?? undefined,
      asAt: p.asAt,
    }

    out[contributionsSourceKey(code)] = {
      key: contributionsSourceKey(code),
      title: `${code} infrastructure contributions`,
      detail: trim(
        `${p.contributionMechanism} The figure shown is a wide indicative range only — verify with the relevant council or a town planner before you exchange.`
      ),
      asAt: p.asAt,
    }

    // Only jurisdictions with a registered-practitioner regime get a citation
    // for one. Claiming NSW's DBP Act applies in Victoria would be wrong.
    if (p.practitioners) {
      out[practitionerSourceKey(code)] = {
        key: practitionerSourceKey(code),
        title: p.practitioners.name,
        detail: trim(
          `Class 2 and 9c buildings in ${code} require registered practitioners and regulated design declarations: ${p.practitioners.requiredPractitioners.join('; ')}. Verify every practitioner on the public register before contract.`
        ),
        url: p.practitioners.registerUrl ?? undefined,
        asAt: p.asAt,
      }
    }
  }

  return out
}

export const SOURCES: Record<string, Source> = {
  ...jurisdictionSources(),
  construction_rates: {
    key: 'construction_rates',
    title: 'Construction $/m² rates',
    detail:
      'Sydney metro 2025–26 rates, triangulated from published construction cost guides (Rawlinsons, Altus Group, Rider Levett Bucknall) and indicative builder-rate ranges. Replace with a real builder quote for higher confidence.',
    asAt: RATE_LIBRARY_REFRESHED,
  },
  finance_rates: {
    key: 'finance_rates',
    title: 'Finance rates & terms',
    detail:
      'Indicative bands for typical Australian residential development finance. Real pricing depends on the lender, leverage, presales, security and project risk — always replace with a lender quote before committing.',
    asAt: RATE_LIBRARY_REFRESHED,
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
