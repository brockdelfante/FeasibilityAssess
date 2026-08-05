/**
 * Share links and CSV export.
 *
 * A share link encodes the whole input set into the URL fragment, so opening it
 * reproduces the exact feasibility — nothing is uploaded, and the link works
 * without an account. The fragment (rather than a query string) keeps the
 * payload out of server logs entirely.
 */

import { defaultFeasibilityInputs } from './engine'
import { BUCKET_LABELS } from './labels'
import type { FeasibilityInputs, FeasibilityResults } from './types'

const SHARE_PREFIX = 'f1:'

// ---------------------------------------------------------------------------
// base64url, safe for both browser and server
// ---------------------------------------------------------------------------

function toBase64Url(input: string): string {
  const bytes = new TextEncoder().encode(input)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  const base64 =
    typeof btoa === 'function' ? btoa(binary) : Buffer.from(input, 'utf-8').toString('base64')
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function fromBase64Url(input: string): string {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  if (typeof atob === 'function') {
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (ch) => ch.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  }
  return Buffer.from(padded, 'base64').toString('utf-8')
}

// ---------------------------------------------------------------------------
// Encode / decode
// ---------------------------------------------------------------------------

export function encodeInputs(inputs: FeasibilityInputs): string {
  return SHARE_PREFIX + toBase64Url(JSON.stringify(inputs))
}

/**
 * Decode a share payload, merged over the defaults.
 *
 * Merging matters: a link created before a new input existed still opens, and
 * the new field picks up its default rather than arriving undefined and
 * producing NaN halfway down the cost stack.
 */
export function decodeInputs(payload: string): FeasibilityInputs | null {
  try {
    const raw = payload.startsWith(SHARE_PREFIX) ? payload.slice(SHARE_PREFIX.length) : payload
    const parsed = JSON.parse(fromBase64Url(raw)) as Partial<FeasibilityInputs>
    if (!parsed || typeof parsed !== 'object') return null

    return {
      ...defaultFeasibilityInputs,
      ...parsed,
      overrides: { ...defaultFeasibilityInputs.overrides, ...(parsed.overrides ?? {}) },
      boq: parsed.boq ?? defaultFeasibilityInputs.boq,
      appliedAssemblies: parsed.appliedAssemblies ?? [],
    }
  } catch {
    return null
  }
}

export function buildShareUrl(inputs: FeasibilityInputs, origin: string, path: string): string {
  return `${origin}${path}#${encodeInputs(inputs)}`
}

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

function csvEscape(value: string | number): string {
  const str = String(value)
  return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str
}

function toCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(csvEscape).join(',')).join('\n')
}

/** Headline figures plus the full cost breakdown. */
export function headlineCsv(inputs: FeasibilityInputs, results: FeasibilityResults): string {
  const rows: (string | number)[][] = [
    ['Development Feasibility Assessment'],
    ['Project', inputs.projectName || 'Untitled'],
    ['Location', inputs.suburbOrAddress || '—'],
    ['Jurisdiction', inputs.jurisdiction],
    [],
    ['Headline', 'Value'],
    ['Verdict', results.verdict],
    ['Gross revenue', Math.round(results.grossRevenue)],
    ['Total development cost', Math.round(results.totalDevelopmentCost)],
    ['Net profit', Math.round(results.netProfit)],
    ['Margin on cost', results.marginOnCost.toFixed(4)],
    ['Margin on revenue', results.marginOnRevenue.toFixed(4)],
    ['Return on equity', results.returnOnEquity.toFixed(4)],
    ['IRR (annualised)', results.cashflow.irr === null ? 'n/a' : results.cashflow.irr.toFixed(4)],
    ['Required equity', Math.round(results.requiredEquity)],
    ['Peak debt', Math.round(results.peakDebt)],
    ['Peak debt month', results.peakDebtMonth],
    ['Break-even per dwelling', Math.round(results.breakEvenPerDwellingAdjusted)],
    ['Price drop headroom', results.priceDropHeadroom.toFixed(4)],
    ['Max supportable purchase price', Math.round(results.maxSupportablePurchasePrice)],
    [],
    ['Cost bucket', 'Amount', 'Confidence', 'Overridden'],
    ...results.buckets.map((b) => [
      BUCKET_LABELS[b.key].label,
      Math.round(b.value),
      b.confidence,
      b.overridden ? 'yes' : 'no',
    ]),
    ['Total', Math.round(results.totalDevelopmentCost), '', ''],
    [],
    ['Statutory line', 'Amount'],
    [
      `${inputs.jurisdiction} transfer duty (${results.statutory.dutyRegime})`,
      Math.round(results.statutory.stampDuty.value),
    ],
    [
      `${inputs.jurisdiction} land tax (per year)`,
      Math.round(results.statutory.landTaxPerYear.value),
    ],
    [
      `${inputs.jurisdiction} land tax (over project)`,
      Math.round(results.statutory.landTaxOverProject.value),
    ],
    [
      `${results.statutory.warrantyShortName} premium`,
      Math.round(results.statutory.hbcfPremium.value),
    ],
    ['GST on sale', Math.round(results.statutory.gst.value)],
    ['Council contributions', Math.round(results.statutory.councilContributions.value)],
    [],
    ['Indicative feasibility only — not financial, legal, tax or planning advice.'],
  ]
  return toCsv(rows)
}

/** Month-by-month cashflow. */
export function cashflowCsv(results: FeasibilityResults): string {
  const rows: (string | number)[][] = [
    [
      'Month',
      'Costs',
      'Revenue',
      'Equity drawn',
      'Debt drawn',
      'Debt repaid',
      'Interest',
      'Fees',
      'Debt balance',
      'Equity contributed',
      'Equity cashflow',
    ],
    ...results.cashflow.rows.map((r) => [
      r.month,
      Math.round(r.costs),
      Math.round(r.revenue),
      Math.round(r.equityDrawn),
      Math.round(r.debtDrawn),
      Math.round(r.debtRepaid),
      Math.round(r.interest),
      Math.round(r.fees),
      Math.round(r.debtBalance),
      Math.round(r.equityBalance),
      Math.round(r.equityCashflow),
    ]),
  ]
  return toCsv(rows)
}

/** Trigger a client-side download without touching the network. */
export function downloadCsv(filename: string, contents: string): void {
  const blob = new Blob([contents], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
