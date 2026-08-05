import React from 'react'
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

import { nccClassLabel } from '@/lib/feasibility/classification'
import { computeFunding } from '@/lib/feasibility/funding'
import { money, percent, area, ratePerSqm, safeDiv } from '@/lib/feasibility/trace'
import { RATE_LIBRARY_REFRESHED, RATE_LIBRARY_VERSION, SOURCES } from '@/lib/feasibility/sources'
import type { FeasibilityInputs, FeasibilityResults } from '@/lib/feasibility/types'

/**
 * The client-facing feasibility report.
 *
 * Deliberately mirrors what is on screen, in the same order, so a client who
 * read the wizard recognises the document. Confidence grades travel with every
 * cost line — a report that hides which numbers are soft is worse than no
 * report.
 */

const styles = StyleSheet.create({
  page: { padding: 44, paddingBottom: 70, fontSize: 9.5, fontFamily: 'Helvetica', color: '#1e293b' },

  brand: { fontSize: 22, fontWeight: 'bold', color: '#1A4F8A', letterSpacing: 2 },
  title: { fontSize: 13, marginTop: 8, color: '#334155' },
  address: { fontSize: 10, marginTop: 3, color: '#94a3b8' },
  header: { marginBottom: 22, borderBottom: 1, borderBottomColor: '#e2e8f0', paddingBottom: 14 },

  verdictBox: { padding: 14, borderRadius: 6, marginBottom: 18 },
  verdictLabel: { fontSize: 8, textTransform: 'uppercase', letterSpacing: 1, color: '#64748b' },
  verdictValue: { fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  verdictReason: { fontSize: 9, color: '#475569', marginTop: 3 },

  section: { marginTop: 18 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#1e293b',
    borderBottom: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 4,
    marginBottom: 10,
  },

  tileRow: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  tile: {
    width: '25%',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  tileInner: { backgroundColor: '#f8fafc', borderRadius: 4, padding: 9 },
  tileLabel: { fontSize: 7, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 },
  tileValue: { fontSize: 12, fontWeight: 'bold', color: '#0f172a' },
  tileSub: { fontSize: 7, color: '#94a3b8', marginTop: 2 },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4.5,
    borderBottom: 0.5,
    borderBottomColor: '#eef2f7',
  },
  rowLabel: { flex: 1, fontSize: 9 },
  rowNote: { fontSize: 7, color: '#94a3b8', marginTop: 1 },
  rowValue: { width: 78, textAlign: 'right', fontSize: 9, fontWeight: 'bold' },
  rowShare: { width: 42, textAlign: 'right', fontSize: 8, color: '#94a3b8' },
  badge: { fontSize: 6.5, textTransform: 'uppercase', letterSpacing: 0.4 },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 7,
    marginTop: 2,
    borderTop: 1,
    borderTopColor: '#cbd5e1',
  },
  totalLabel: { fontSize: 10, fontWeight: 'bold' },
  totalValue: { fontSize: 11, fontWeight: 'bold' },

  insight: { marginBottom: 9, paddingLeft: 8, borderLeft: 2 },
  insightTitle: { fontSize: 9, fontWeight: 'bold' },
  insightBody: { fontSize: 8, color: '#475569', marginTop: 2, lineHeight: 1.45 },
  insightNext: { fontSize: 8, color: '#334155', marginTop: 2, lineHeight: 1.45 },

  bullet: { flexDirection: 'row', marginBottom: 4 },
  bulletDot: { width: 8, fontSize: 8, color: '#cbd5e1' },
  bulletText: { flex: 1, fontSize: 8, color: '#475569', lineHeight: 1.5 },

  narrativeHeading: {
    fontSize: 7.5,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    color: '#64748b',
    marginTop: 8,
    marginBottom: 4,
  },

  sourceItem: { marginBottom: 7 },
  sourceTitle: { fontSize: 8, fontWeight: 'bold' },
  sourceDetail: { fontSize: 7, color: '#64748b', marginTop: 1.5, lineHeight: 1.4 },

  disclaimer: { marginTop: 18, backgroundColor: '#f8fafc', borderRadius: 4, padding: 10 },
  disclaimerText: { fontSize: 6.5, color: '#64748b', lineHeight: 1.5 },

  footer: {
    position: 'absolute',
    bottom: 26,
    left: 44,
    right: 44,
    borderTop: 0.5,
    borderTopColor: '#e2e8f0',
    paddingTop: 7,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: { fontSize: 6.5, color: '#94a3b8' },
})

const VERDICT_COLOURS = {
  feasible: { bg: '#ecfdf5', text: '#065f46' },
  marginal: { bg: '#fffbeb', text: '#92400e' },
  not_feasible: { bg: '#fef2f2', text: '#991b1b' },
}

const VERDICT_LABELS = {
  feasible: 'Feasible',
  marginal: 'Marginal',
  not_feasible: 'Not feasible',
}

const CONFIDENCE_COLOURS = {
  high: '#059669',
  medium: '#2563eb',
  low: '#d97706',
}

const CONFIDENCE_TEXT = { high: 'High', medium: 'Medium', low: 'Verify' }

const INSIGHT_COLOURS = {
  critical: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
  positive: '#059669',
}

/**
 * Make a string safe for the built-in PDF fonts.
 *
 * react-pdf's standard Helvetica has no glyphs for em dashes, en dashes, curly
 * quotes or the minus sign, and it drops them silently rather than substituting
 * — which turns "Builder contract — $/m² × GFA" into "Builder contract  $/m² ×"
 * with a gap where the dash should be. So fold everything to ASCII equivalents
 * first. The one exception is m², which Helvetica does render.
 */
function ascii(text: string): string {
  return text
    .replace(/\*\*/g, '') // the narrative layer's bold markers
    .replace(/[—–]/g, '-') // em dash, en dash
    .replace(/[‘’]/g, "'") // curly single quotes
    .replace(/[“”]/g, '"') // curly double quotes
    .replace(/−/g, '-') // true minus sign (Helvetica has the ASCII one only)
    .replace(/…/g, '...') // ellipsis
}

/**
 * Text that sanitises its own content. Using this everywhere instead of `Text`
 * means no future copy change can reintroduce a silently-dropped glyph.
 */
/**
 * react-pdf's Text props are a union — it doubles as an SVG element — so its
 * style type includes SVG attributes that a page-level Text will not accept.
 * Deriving the type from our own stylesheet sidesteps that.
 */
type PdfStyle = Parameters<typeof StyleSheet.create>[0][string]

function T({
  children,
  style,
}: {
  children?: React.ReactNode
  style?: PdfStyle | PdfStyle[]
}) {
  return (
    <Text style={style}>
      {React.Children.map(children, (child) =>
        typeof child === 'string' ? ascii(child) : child
      )}
    </Text>
  )
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.tile}>
      <View style={styles.tileInner}>
        <T style={styles.tileLabel}>{label}</T>
        <T style={styles.tileValue}>{value}</T>
        {sub ? <T style={styles.tileSub}>{sub}</T> : null}
      </View>
    </View>
  )
}

export function FeasibilityReport({
  inputs,
  results,
  generatedAt,
}: {
  inputs: FeasibilityInputs
  results: FeasibilityResults
  /** Passed in rather than read from the clock, so the document is pure. */
  generatedAt: string
}) {
  const verdict = VERDICT_COLOURS[results.verdict]
  const funding = computeFunding(inputs, results)
  const sells = inputs.mode === 'develop_to_sell'
  const unit = inputs.devType === 'subdivision' ? 'lot' : 'dwelling'

  return (
    <Document
      title={`Feasibility — ${inputs.projectName || inputs.suburbOrAddress || 'Untitled'}`}
      author="Siare Investments"
    >
      {/* ---------------- Page 1: verdict, headline, costs ---------------- */}
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <T style={styles.brand}>SIARE</T>
          <T style={styles.title}>Development Feasibility Assessment</T>
          <T style={styles.address}>
            {inputs.projectName ? `${inputs.projectName} — ` : ''}
            {inputs.suburbOrAddress || 'Location not specified'} · {inputs.jurisdiction}
          </T>
        </View>

        <View style={[styles.verdictBox, { backgroundColor: verdict.bg }]}>
          <T style={styles.verdictLabel}>Feasibility verdict</T>
          <T style={[styles.verdictValue, { color: verdict.text }]}>
            {VERDICT_LABELS[results.verdict]}
          </T>
          <T style={styles.verdictReason}>{results.verdictReason}</T>
        </View>

        <View style={styles.tileRow}>
          <Tile
            label={sells ? 'Gross revenue' : 'Value on completion'}
            value={money(results.grossRevenue)}
            sub={sells ? `${inputs.yield} × ${money(inputs.salePricePerDwelling)}` : undefined}
          />
          <Tile
            label="Total dev cost"
            value={money(results.totalDevelopmentCost)}
            sub={`${money(results.costPerDwelling)} per ${unit}`}
          />
          {sells ? (
            <>
              <Tile
                label="Net profit"
                value={money(results.netProfit)}
                sub={`${percent(results.marginOnCost)} margin on cost`}
              />
              <Tile
                label="Margin vs target"
                value={percent(results.marginOnCost)}
                sub={`Target ${percent(inputs.targetMargin)}`}
              />
            </>
          ) : null}
          <Tile label="Required equity" value={money(results.requiredEquity)} sub="Cash in" />
          <Tile
            label="Peak debt"
            value={money(results.peakDebt)}
            sub={results.peakDebt > 0 ? `Month ${results.peakDebtMonth}` : 'Cash funded'}
          />
          {sells ? (
            <>
              <Tile
                label="Return on equity"
                value={percent(results.returnOnEquity)}
                sub="Profit ÷ equity"
              />
              <Tile
                label="IRR annualised"
                value={results.cashflow.irr === null ? '—' : percent(results.cashflow.irr)}
                sub="On equity cashflow"
              />
              <Tile
                label={`Break-even / ${unit}`}
                value={money(results.breakEvenPerDwellingAdjusted)}
                sub={`${percent(results.priceDropHeadroom)} price headroom`}
              />
              <Tile
                label="Max supportable land"
                value={money(results.maxSupportablePurchasePrice)}
                sub="At your target margin"
              />
            </>
          ) : null}
          <Tile label="Gross floor area" value={area(results.totalGfaSqm)} sub="Total scheme" />
          <Tile
            label="Build rate"
            value={ratePerSqm(results.constructionRatePerSqm.value)}
            sub={
              results.constructionRatePerSqm.range
                ? `${ratePerSqm(results.constructionRatePerSqm.range.low)}–${ratePerSqm(results.constructionRatePerSqm.range.high)}`
                : 'Pinned by you'
            }
          />
        </View>

        <View style={styles.section}>
          <T style={styles.sectionTitle}>Cost breakdown</T>
          {results.buckets.map((bucket) => (
            <View key={bucket.key} style={styles.row}>
              <View style={styles.rowLabel}>
                <T>
                  {bucket.label}{' '}
                  <T
                    style={[
                      styles.badge,
                      {
                        color: bucket.overridden
                          ? '#059669'
                          : CONFIDENCE_COLOURS[bucket.confidence],
                      },
                    ]}
                  >
                    {bucket.overridden ? 'Yours' : CONFIDENCE_TEXT[bucket.confidence]}
                  </T>
                </T>
                <T style={styles.rowNote}>{bucket.description}</T>
              </View>
              <T style={styles.rowShare}>
                {percent(safeDiv(bucket.value, results.totalDevelopmentCost), 1)}
              </T>
              <T style={styles.rowValue}>{money(bucket.value)}</T>
            </View>
          ))}
          <View style={styles.totalRow}>
            <T style={styles.totalLabel}>Total development cost</T>
            <T style={styles.totalValue}>{money(results.totalDevelopmentCost)}</T>
          </View>
        </View>

        <View style={styles.section}>
          <T style={styles.sectionTitle}>Can it be funded?</T>
          {[
            [
              'Senior debt available',
              funding.seniorLimit,
              funding.boundBy === 'value' ? 'Capped by end value' : 'Capped by total cost',
            ],
            ['You need to fund', funding.equityRequired, 'Everything the lender will not'],
            [
              funding.shortfall > 0 ? 'Gap beyond your cash' : 'Cash surplus',
              funding.shortfall > 0
                ? funding.shortfall
                : Math.max(0, inputs.equityAvailable - funding.equityRequired),
              funding.shortfall > 0 ? 'Needs covering' : 'Left over',
            ],
            ...(funding.mezzUsed
              ? ([
                  [
                    'Second mortgage',
                    funding.mezzAmount,
                    `At ${percent(inputs.mezzInterestRate || 0.14)}, blended ${percent(funding.blendedRate)}`,
                  ],
                  [
                    'Cost of the second mortgage',
                    funding.mezzTotalCost,
                    `${percent(funding.mezzCostShareOfProfit)} of your profit`,
                  ],
                  [
                    'Profit after it is paid',
                    funding.profitAfterMezz,
                    `${percent(funding.marginAfterMezz)} margin on cost`,
                  ],
                ] as [string, number, string][])
              : []),
          ].map(([label, value, note]) => (
            <View key={label as string} style={styles.row}>
              <View style={styles.rowLabel}>
                <T>{label as string}</T>
                <T style={styles.rowNote}>{note as string}</T>
              </View>
              <T style={styles.rowValue}>{money(value as number)}</T>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <T style={styles.sectionTitle}>Statutory costs & duties</T>
          {[
            [
              `${results.statutory.jurisdiction} transfer (stamp) duty`,
              results.statutory.stampDuty.value,
              results.statutory.dutyRegime === 'commercial'
                ? 'On settlement, non-residential scale'
                : 'On settlement',
            ],
            [
              `${results.statutory.jurisdiction} land tax (per year)`,
              results.statutory.landTaxPerYear.value,
              'While you hold',
            ],
            [
              `${results.statutory.jurisdiction} land tax (over the project)`,
              results.statutory.landTaxOverProject.value,
              'In holding costs',
            ],
            [
              `${results.statutory.warrantyShortName} premium`,
              results.statutory.hbcfPremium.value,
              'Residential building work',
            ],
            ['GST on sale', results.statutory.gst.value, 'Margin scheme'],
            [
              'Council & infrastructure contributions',
              results.statutory.councilContributions.value,
              'Verify with the council',
            ],
          ].map(([label, value, note]) => (
            <View key={label as string} style={styles.row}>
              <View style={styles.rowLabel}>
                <T>{label as string}</T>
                <T style={styles.rowNote}>{note as string}</T>
              </View>
              <T style={styles.rowValue}>{money(value as number)}</T>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <T style={styles.footerText}>
            Indicative feasibility only — not financial, legal, tax or planning advice
          </T>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>

      {/* ---------------- Page 2: insights, classification ---------------- */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <T style={styles.sectionTitle}>What this deal is telling you</T>
          {results.insights.map((insight, i) => (
            <View
              key={i}
              style={[styles.insight, { borderLeftColor: INSIGHT_COLOURS[insight.severity] }]}
            >
              <T style={styles.insightTitle}>{insight.title}</T>
              <T style={styles.insightBody}>{insight.body}</T>
              {insight.nextStep ? (
                <T style={styles.insightNext}>Next step: {insight.nextStep}</T>
              ) : null}
            </View>
          ))}
        </View>

        {inputs.mode !== 'renovate' && inputs.devType !== 'subdivision' ? (
          <View style={styles.section}>
            <T style={styles.sectionTitle}>Building classification</T>
            <T style={{ fontSize: 9, fontWeight: 'bold', marginBottom: 4 }}>
              {nccClassLabel(results.classification.nccClass)}
              {results.classification.inferred ? ' (inferred)' : ''}
            </T>
            <T style={styles.insightBody}>{results.classification.reasoning}</T>
            {results.classification.dbpApplies ? (
              <>
                <T style={[styles.insightNext, { marginTop: 5 }]}>
                  The {results.statutory.jurisdiction} {results.classification.regimeName} applies:{' '}
                  {money(results.classification.dbpCostUplift)} of additional fees and{' '}
                  {results.classification.dbpProgramMonths} months of program, both already included
                  above.
                </T>
                <T style={styles.narrativeHeading}>Practitioners that must be registered</T>
                {results.classification.requiredPractitioners.map((p) => (
                  <View key={p} style={styles.bullet}>
                    <T style={styles.bulletDot}>•</T>
                    <T style={styles.bulletText}>{p}</T>
                  </View>
                ))}
              </>
            ) : null}
          </View>
        ) : null}

        <View style={styles.footer} fixed>
          <T style={styles.footerText}>
            Indicative feasibility only — not financial, legal, tax or planning advice
          </T>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>

      {/* ---------------- Page 3: narrative, sources, disclaimer ---------------- */}
      <Page size="A4" style={styles.page}>
        <View style={styles.section}>
          <T style={styles.sectionTitle}>How the numbers were built</T>
          {results.narrative.map((section) => (
            <View key={section.heading}>
              <T style={styles.narrativeHeading}>{section.heading}</T>
              {section.bullets.map((bullet, i) => (
                <View key={i} style={styles.bullet}>
                  <T style={styles.bulletDot}>•</T>
                  <T style={styles.bulletText}>{bullet}</T>
                </View>
              ))}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <T style={styles.sectionTitle}>
            What&apos;s behind the numbers — {RATE_LIBRARY_VERSION}, refreshed{' '}
            {RATE_LIBRARY_REFRESHED}
          </T>
          {Object.values(SOURCES).map((source) => (
            <View key={source.key} style={styles.sourceItem}>
              <T style={styles.sourceTitle}>
                {source.title}{' '}
                <T style={{ color: '#94a3b8', fontWeight: 'normal' }}>
                  (as at {source.asAt})
                </T>
              </T>
              <T style={styles.sourceDetail}>{source.detail}</T>
            </View>
          ))}
        </View>

        <View style={styles.disclaimer}>
          <T style={[styles.sourceTitle, { marginBottom: 3 }]}>Disclaimer</T>
          <T style={styles.disclaimerText}>
            This is a feasibility-modelling tool. The figures in this report are indicative
            estimates based on the inputs provided and assumed rates from a periodically updated
            library. It does not constitute financial, legal, tax, planning, valuation or
            construction advice, and is not a substitute for professional advice from a qualified
            accountant, lawyer, town planner, quantity surveyor, valuer, lender or builder. Stamp
            duty, council contributions, GST treatment, finance terms and construction rates change
            frequently and vary by location, lender, council and project. Every figure must be
            verified independently before any acquisition, finance or planning decision is made. It
            is not a quote, a guaranteed cost, or a valuation.
          </T>
        </View>

        <View style={styles.footer} fixed>
          <T style={styles.footerText}>Generated {generatedAt}</T>
          <Text
            style={styles.footerText}
            render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
          />
        </View>
      </Page>
    </Document>
  )
}
