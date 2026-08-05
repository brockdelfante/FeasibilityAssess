/**
 * Generate jurisdiction profile modules from the verified research artefact.
 *
 * Run: node scripts/generate-jurisdiction-profiles.mjs
 *
 * The profiles are GENERATED rather than hand-written on purpose. The research
 * in _research/verified-2026-08-05.json was transcribed from revenue-office
 * tables and independently verified band by band; hand-copying it into TypeScript
 * would reintroduce exactly the transcription-error class that verification just
 * eliminated. Generating means the code cannot disagree with the verified source.
 *
 * NSW is deliberately excluded — it is hand-maintained with extra commentary
 * about the $1,662 rounding quirk and the residential-premium tier, which the
 * generator has no way to express.
 *
 * Corrections applied here come from the completeness critic and are recorded in
 * _research/README.md:
 *
 *  - NT is skipped entirely. Its first duty band is a quadratic the schedule type
 *    cannot express and was recorded as flat with rate 0, which silently returns
 *    $0 duty on any NT site up to $525,000.
 *  - VIC and ACT hasClass2Regime are forced false. Victoria's Developer Bond
 *    Scheme does not commence until permits issued from 1 July 2027, is
 *    refundable capital rather than a cost, and triggers on storeys not Class 2.
 *    The ACT's Property Developers Act licence triggers at 3+ dwellings including
 *    Class 1 and was not mandatory until 1 October 2026.
 *  - Warranty and contribution figures are marked low-confidence in the emitted
 *    comments: six of eight were assembled with primary retrieval blocked, so
 *    they are estimates, not transcriptions.
 */

import { readFileSync, writeFileSync } from 'node:fs'

const RESEARCH = 'src/lib/feasibility/jurisdictions/_research/verified-2026-08-05.json'
const INFINITY_SENTINEL = 999999999999

// Jurisdictions whose duty schedule requires the "or part of $100" ceiling on
// the excess. Victoria does not; NT rounds down to 5c and is excluded anyway.
const ROUNDS_TO_100 = new Set(['NSW', 'QLD', 'SA', 'WA', 'TAS', 'ACT'])

// Only NSW has a genuine Class 2 practitioner regime. See the note above.
const FORCE_CLASS2_FALSE = new Set(['VIC', 'ACT'])

// South Australia has charged no conveyance duty on non-residential,
// non-primary-production land since 1 July 2018.
const COMMERCIAL_TREATMENT = {
  SA: {
    treatment: 'nil',
    note: 'South Australia abolished conveyance duty on non-residential, non-primary-production land from 1 July 2018. A commercial or industrial site attracts NO duty, so the residential scale must not be applied to it. The determinant is the Valuer-General Land Use Code plus PDI Act 2016 zoning, which cannot be inferred from price — confirm the land use before relying on either figure.',
  },
  ACT: {
    treatment: 'separate',
    note: 'The ACT commercial scale is nil up to $2,100,000 and then a flat 5% of the WHOLE transaction value — so $2,100,000 attracts nothing and $2,100,001 attracts $105,000. It is a cliff, not a marginal rate.',
  },
}

// ACT commercial conveyance schedule, kept here rather than in the research
// artefact because it was confirmed separately from the non-commercial table.
const ACT_COMMERCIAL_BANDS = [
  { from: 0, upTo: 2_100_000, kind: 'flat', fixed: 0, rate: 0 },
  { from: 2_100_000, upTo: INFINITY_SENTINEL, kind: 'flat', fixed: 0, rate: 0.05 },
]

const REGIONS = {
  VIC: [
    ['melbourne_metro', 'Melbourne metro', 0.95, true],
    ['geelong', 'Geelong & Surf Coast', 0.92],
    ['ballarat_bendigo', 'Ballarat & Bendigo', 0.88],
    ['regional_vic', 'Regional Victoria', 0.86],
  ],
  QLD: [
    ['brisbane_metro', 'Brisbane metro', 0.9, true],
    ['gold_coast', 'Gold Coast', 0.92],
    ['sunshine_coast', 'Sunshine Coast', 0.91],
    ['cairns_townsville', 'Cairns & Townsville', 0.98],
    ['regional_qld', 'Regional Queensland', 0.95],
  ],
  SA: [
    ['adelaide_metro', 'Adelaide metro', 0.85, true],
    ['regional_sa', 'Regional South Australia', 0.9],
  ],
  WA: [
    ['perth_metro', 'Perth metro', 0.92, true],
    ['bunbury_southwest', 'Bunbury & South West', 0.95],
    ['regional_wa', 'Regional Western Australia', 1.05],
    ['remote_wa', 'Remote Western Australia', 1.35],
  ],
  TAS: [
    ['hobart', 'Hobart', 0.88, true],
    ['launceston', 'Launceston', 0.86],
    ['regional_tas', 'Regional Tasmania', 0.9],
  ],
  ACT: [['canberra', 'Canberra', 0.95, true]],
}

const research = JSON.parse(readFileSync(RESEARCH, 'utf-8'))

/** Emit a number as readable TypeScript: 1_290_000, or Infinity for the sentinel. */
function num(n) {
  if (n >= INFINITY_SENTINEL) return 'Infinity'
  if (!Number.isInteger(n)) return String(n)
  if (Math.abs(n) < 1000) return String(n)
  return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '_')
}

function str(s) {
  return JSON.stringify(s ?? '')
}

/** Wrap prose to a readable comment block. */
function comment(text, indent = '  ') {
  const words = String(text).replace(/\s+/g, ' ').trim().split(' ')
  const lines = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).length > 76) {
      lines.push(line)
      line = w
    } else {
      line = line ? line + ' ' + w : w
    }
  }
  if (line) lines.push(line)
  return lines.map((l) => `${indent}// ${l}`).join('\n')
}

function emit(code) {
  const r = research.rates[code]
  const e = research.extras[code] ?? {}
  const v = research.verdicts[code] ?? {}
  const commercial = COMMERCIAL_TREATMENT[code] ?? {
    treatment: 'same',
    note: 'The general conveyance scale applies to commercial and industrial land as well as residential.',
  }

  const dutyBands = r.dutyBands
    .map(
      (b) =>
        `${comment(b.rowText, '      ')}\n      { from: ${num(b.from)}, upTo: ${num(b.upTo)}, kind: '${b.kind}', fixed: ${num(b.fixed)}, rate: ${b.rate} },`
    )
    .join('\n')

  const landBands = r.landTaxBands
    .map(
      (b) =>
        `      { from: ${num(b.from)}, upTo: ${num(b.upTo)}, fixed: ${num(b.fixed)}, rate: ${b.rate} },`
    )
    .join('\n')

  const regions = (REGIONS[code] ?? [['metro', 'Metropolitan', 1, true]])
    .map(
      ([key, label, mult, isDefault]) =>
        `    { key: '${key}', label: ${str(label)}, multiplier: ${mult}${isDefault ? ', isDefault: true' : ''} },`
    )
    .join('\n')

  const class2 = FORCE_CLASS2_FALSE.has(code) ? false : Boolean(e.hasClass2Regime)

  const practitioners =
    class2 && e.practitionerName
      ? `{
    name: ${str(e.practitionerName)},
    appliesToClass2: true,
    baseCostUplift: ${num(e.practitionerCostLow || 0)},
    costPerExtraDwelling: 4_500,
    costRange: { low: ${num(e.practitionerCostLow || 0)}, high: ${num(e.practitionerCostHigh || 0)} },
    programMonthsBase: ${e.practitionerMonths || 0},
    programMonthsMax: ${(e.practitionerMonths || 0) * 2},
    requiredPractitioners: [],
    registerUrl: ${e.registerUrl ? str(e.registerUrl) : 'null'},
  }`
      : 'null'

  const quirks = (e.quirks ?? []).concat(r.unresolved?.length ? [] : []).slice(0, 8)

  const example =
    r.dutyExampleValue > 0 && r.dutyExampleDuty > 0
      ? `\n * Official worked example reconciled: ${r.dutyExampleValue.toLocaleString()} → ${r.dutyExampleDuty.toLocaleString()}.`
      : `\n * No official worked example was published on the current schedule; the bands\n * were verified by boundary continuity and internal self-consistency instead.`

  return `/**
 * ${r.code} — ${research.rates[code].taxYear}.
 *
 * GENERATED from _research/verified-2026-08-05.json by
 * scripts/generate-jurisdiction-profiles.mjs. Do not edit by hand: re-run the
 * generator so the code cannot drift from the verified source.
 *
 * Duty and land tax were transcribed from the revenue office's published tables
 * and independently verified band by band. Verifier verdict: duty
 * ${v.dutyVerdict ?? 'n/a'}, land tax ${v.landTaxVerdict ?? 'n/a'}.${example}
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

export const ${code}: JurisdictionProfile = {
  code: '${code}',
  name: ${str(research.rates[code].code === code ? nameFor(code) : code)},
  taxYear: ${str(shortYear(r.taxYear))},
  confidence: 'verified',
  asAt: '2026-08-05',

  duty: {
    bands: [
${dutyBands}
    ],
    minimum: ${num(r.dutyMinimum)},
    premiumThreshold: ${r.dutyPremiumThreshold ? num(r.dutyPremiumThreshold) : 'null'},
    roundExcessTo100: ${ROUNDS_TO_100.has(code)},
    upperBoundInclusive: true,
    residentialPremium: null,
  },
  dutySourceUrl: ${str(r.dutyUrl)},
  commercialDutyTreatment: '${commercial.treatment}',
  commercialDuty: ${
    commercial.treatment === 'separate' && code === 'ACT'
      ? `{
    bands: [
${ACT_COMMERCIAL_BANDS.map((b) => `      { from: ${num(b.from)}, upTo: ${num(b.upTo)}, kind: '${b.kind}', fixed: ${num(b.fixed)}, rate: ${b.rate} },`).join('\n')}
    ],
    minimum: 0,
    premiumThreshold: 2_100_000,
    roundExcessTo100: false,
    upperBoundInclusive: true,
    residentialPremium: null,
  }`
      : 'null'
  },
  commercialDutyNote: ${str(commercial.note)},

  landTax: {
    bands: [
${landBands}
    ],
    threshold: ${num(r.landTaxThreshold)},
    assessedOn: ${str(trim(r.landTaxAssessedOn, 600))},
  },
  landTaxSourceUrl: ${str(r.landTaxUrl)},

  warranty: {
    name: ${str(e.warrantyName || 'No mandatory scheme')},
    shortName: ${str(e.warrantyShortName || 'None')},
    threshold: ${e.warrantyExists ? num(e.warrantyThreshold || 0) : 'Infinity'},
    premiumRate: ${e.warrantyExists ? e.warrantyRate || 0 : 0},
    premiumRange: { low: ${e.warrantyLow || 0}, high: ${e.warrantyHigh || 0} },
    regulator: ${e.warrantyRegulator ? str(e.warrantyRegulator) : 'null'},
  },
  warrantySourceUrl: ${e.warrantyUrl ? str(e.warrantyUrl) : 'null'},

  practitioners: ${practitioners},

  contributionPerDwelling: { low: ${num(e.contribLow || 0)}, point: ${num(e.contribPoint || 0)}, high: ${num(e.contribHigh || 0)} },
  contributionMechanism: ${str(trim(e.contribMechanism, 400))},

  regions: [
${regions}
  ],

  quirks: [
${quirks.map((q) => `    ${str(trim(q, 300))},`).join('\n')}
  ],
}
`
}

function nameFor(code) {
  return {
    VIC: 'Victoria',
    QLD: 'Queensland',
    SA: 'South Australia',
    WA: 'Western Australia',
    TAS: 'Tasmania',
    ACT: 'Australian Capital Territory',
    NT: 'Northern Territory',
  }[code]
}

function shortYear(taxYear) {
  const m = String(taxYear).match(/20\d\d[-/]\d\d?/)
  return m ? m[0].replace('/', '-') : '2026-27'
}

function trim(s, n) {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > n ? t.slice(0, n - 1) + '…' : t
}

// NT excluded — see the note at the top of this file.
const CODES = ['VIC', 'QLD', 'SA', 'WA', 'TAS', 'ACT']

for (const code of CODES) {
  const out = `src/lib/feasibility/jurisdictions/${code.toLowerCase()}.ts`
  writeFileSync(out, emit(code))
  console.log(`wrote ${out}`)
}
console.log('\nNT deliberately not generated: quadratic first duty band returns $0 silently.')
