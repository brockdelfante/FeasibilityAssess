'use client'

/**
 * The results view.
 *
 * Ordered the way a client reads: the verdict, the four numbers they care
 * about, then the plain-English read, then the cost stack, then the prose
 * explanation. Anything analytical is collapsed into the advanced section
 * below — nobody needs a sensitivity table before they know whether the deal
 * works.
 */

import * as React from 'react'
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileText,
  Info,
  Landmark,
  Lightbulb,
  ScrollText,
  ShieldAlert,
  XCircle,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

import { nccClassLabel } from '@/lib/feasibility/classification'
import { BUCKET_LABELS } from '@/lib/feasibility/labels'
import { RATE_LIBRARY_REFRESHED, RATE_LIBRARY_VERSION } from '@/lib/feasibility/sources'
import { useFeasibilityStore } from '@/lib/feasibility/store'
import { area, money, percent, ratePerSqm, safeDiv } from '@/lib/feasibility/trace'
import type {
  CostBucket,
  FeasibilityInputs,
  FeasibilityResults,
  InsightItem,
  Verdict,
} from '@/lib/feasibility/types'

import {
  ConfidenceBadge,
  DidYouKnow,
  RichText,
  SectionCard,
  StatTile,
  TraceSheet,
} from './primitives'

// ---------------------------------------------------------------------------
// Verdict
// ---------------------------------------------------------------------------

const VERDICT_STYLES: Record<
  Verdict,
  { label: string; wrap: string; icon: React.ReactNode; text: string }
> = {
  feasible: {
    label: 'Feasible',
    wrap: 'border-emerald-200 bg-gradient-to-br from-emerald-50 to-white',
    icon: <CheckCircle2 className="h-6 w-6 text-emerald-600" />,
    text: 'text-emerald-900',
  },
  marginal: {
    label: 'Marginal',
    wrap: 'border-amber-200 bg-gradient-to-br from-amber-50 to-white',
    icon: <CircleAlert className="h-6 w-6 text-amber-600" />,
    text: 'text-amber-900',
  },
  not_feasible: {
    label: 'Not feasible',
    wrap: 'border-red-200 bg-gradient-to-br from-red-50 to-white',
    icon: <XCircle className="h-6 w-6 text-red-600" />,
    text: 'text-red-900',
  },
}

export function VerdictBanner({
  inputs,
  results,
}: {
  inputs: FeasibilityInputs
  results: FeasibilityResults
}) {
  const style = VERDICT_STYLES[results.verdict]
  const sells = inputs.mode === 'develop_to_sell'

  return (
    <div className={cn('rounded-2xl border p-6 shadow-sm', style.wrap)}>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="flex items-start gap-4">
          {style.icon}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Feasibility verdict
            </p>
            <p className={cn('mt-0.5 text-2xl font-bold', style.text)}>{style.label}</p>
            <p className="mt-1 text-sm text-gray-600">{results.verdictReason}</p>
          </div>
        </div>

        {sells ? (
          <div className="flex flex-wrap gap-8">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Net profit
              </p>
              <p
                className={cn(
                  'font-mono text-2xl font-bold tabular-nums',
                  results.netProfit >= 0 ? 'text-gray-900' : 'text-red-600'
                )}
              >
                {money(results.netProfit)}
              </p>
              <p className="text-xs text-gray-500">
                {percent(results.marginOnCost)} margin on cost
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Your target
              </p>
              <p className="font-mono text-2xl font-bold tabular-nums text-gray-400">
                {percent(inputs.targetMargin)}
              </p>
              <p
                className={cn(
                  'text-xs font-medium',
                  results.marginOnCost >= inputs.targetMargin
                    ? 'text-emerald-600'
                    : 'text-red-600'
                )}
              >
                {results.marginOnCost >= inputs.targetMargin ? '+' : '−'}
                {percent(Math.abs(results.marginOnCost - inputs.targetMargin))} vs target
              </p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Headline stats
// ---------------------------------------------------------------------------

export function HeadlineStats({
  inputs,
  results,
}: {
  inputs: FeasibilityInputs
  results: FeasibilityResults
}) {
  const sells = inputs.mode === 'develop_to_sell'
  const unit = inputs.devType === 'subdivision' ? 'lot' : 'dwelling'

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label={sells ? 'Gross revenue' : 'Value on completion'}
        value={money(results.grossRevenue)}
        sub={
          sells
            ? `${inputs.yield} × ${money(inputs.salePricePerDwelling)}`
            : 'What the finished asset is worth'
        }
      />
      <StatTile
        label="Total development cost"
        value={money(results.totalDevelopmentCost)}
        sub={`${money(results.costPerDwelling)} per ${unit}`}
      />
      <StatTile
        label="Required equity"
        value={money(results.requiredEquity)}
        sub="Cash you need to put in"
      />
      <StatTile
        label="Peak debt"
        value={money(results.peakDebt)}
        sub={
          results.peakDebt > 0
            ? `Highest in month ${results.peakDebtMonth}`
            : 'Cash funded — no debt'
        }
      />

      {sells ? (
        <>
          <StatTile
            label="Margin on cost"
            value={percent(results.marginOnCost)}
            tone={results.marginOnCost >= inputs.targetMargin ? 'positive' : 'negative'}
            sub={`Target ${percent(inputs.targetMargin)}`}
          />
          <StatTile
            label="Return on equity"
            value={percent(results.returnOnEquity)}
            sub="Profit ÷ equity you put in"
          />
          <StatTile
            label="IRR (annualised)"
            value={results.cashflow.irr === null ? '—' : percent(results.cashflow.irr)}
            sub={
              results.cashflow.equityMultiple
                ? `${results.cashflow.equityMultiple.toFixed(2)}× equity multiple`
                : 'Time-weighted return on equity'
            }
          />
          <StatTile
            label={`Break-even per ${unit}`}
            value={money(results.breakEvenPerDwellingAdjusted)}
            tone={results.priceDropHeadroom < 0.1 ? 'warning' : 'neutral'}
            sub={`Prices can fall ${percent(results.priceDropHeadroom)} before you lose money`}
          />
        </>
      ) : null}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

const INSIGHT_STYLES: Record<
  InsightItem['severity'],
  { icon: React.ReactNode; wrap: string; badge: string }
> = {
  critical: {
    icon: <ShieldAlert className="h-4 w-4 text-red-600" />,
    wrap: 'border-red-200 bg-red-50/50',
    badge: 'border-red-300 bg-red-100 text-red-800',
  },
  warning: {
    icon: <AlertTriangle className="h-4 w-4 text-amber-600" />,
    wrap: 'border-amber-200 bg-amber-50/50',
    badge: 'border-amber-300 bg-amber-100 text-amber-800',
  },
  info: {
    icon: <Info className="h-4 w-4 text-blue-600" />,
    wrap: 'border-blue-200 bg-blue-50/40',
    badge: 'border-blue-300 bg-blue-100 text-blue-800',
  },
  positive: {
    icon: <CheckCircle2 className="h-4 w-4 text-emerald-600" />,
    wrap: 'border-emerald-200 bg-emerald-50/40',
    badge: 'border-emerald-300 bg-emerald-100 text-emerald-800',
  },
}

export function InsightList({ results }: { results: FeasibilityResults }) {
  const counts = results.insights.reduce<Record<string, number>>((acc, i) => {
    acc[i.severity] = (acc[i.severity] ?? 0) + 1
    return acc
  }, {})

  return (
    <SectionCard
      title="What this deal is telling you"
      blurb="A plain-English read on the current numbers, sorted most urgent first."
      icon={<Lightbulb className="h-4 w-4 text-blue-600" />}
      action={
        <div className="flex flex-wrap gap-1.5">
          {(['critical', 'warning', 'info', 'positive'] as const).map((sev) =>
            counts[sev] ? (
              <Badge key={sev} variant="outline" className={INSIGHT_STYLES[sev].badge}>
                {counts[sev]} {sev}
              </Badge>
            ) : null
          )}
        </div>
      }
    >
      <div className="space-y-3">
        {results.insights.map((insight, i) => {
          const style = INSIGHT_STYLES[insight.severity]
          return (
            <div key={i} className={cn('rounded-xl border p-4', style.wrap)}>
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0">{style.icon}</span>
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">{insight.title}</p>
                    <span className="rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-gray-500">
                      {insight.category}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-gray-600">{insight.body}</p>
                  {insight.nextStep ? (
                    <p className="flex items-start gap-1.5 text-xs leading-relaxed text-gray-700">
                      <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-gray-400" />
                      <span>
                        <span className="font-medium">Next step: </span>
                        {insight.nextStep}
                      </span>
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Cost breakdown
// ---------------------------------------------------------------------------

export function CostBreakdown({ results }: { results: FeasibilityResults }) {
  const [openBucket, setOpenBucket] = React.useState<CostBucket | null>(null)
  const total = results.totalDevelopmentCost

  return (
    <>
      <SectionCard
        title="Cost breakdown"
        blurb="Click any line to see exactly how it was built, how much to trust it, and where it came from."
        icon={<FileText className="h-4 w-4 text-blue-600" />}
        action={
          <Badge variant="outline" className="border-gray-300 text-[10px] text-gray-500">
            {RATE_LIBRARY_VERSION} · refreshed {RATE_LIBRARY_REFRESHED}
          </Badge>
        }
      >
        <div className="divide-y divide-gray-100">
          {results.buckets.map((bucket) => {
            const share = safeDiv(bucket.value, total)
            return (
              <button
                key={bucket.key}
                type="button"
                onClick={() => setOpenBucket(bucket)}
                className="group flex w-full items-center gap-4 py-3 text-left transition-colors hover:bg-gray-50/70"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{bucket.label}</span>
                    <ConfidenceBadge
                      confidence={bucket.confidence}
                      overridden={bucket.overridden}
                      className="text-[10px]"
                    />
                  </div>
                  <p className="mt-0.5 truncate text-xs text-gray-500">{bucket.description}</p>
                  {/* Share-of-cost bar, so the big lines are obvious at a glance. */}
                  <div className="mt-1.5 h-1 w-full max-w-xs overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-blue-500/70"
                      style={{ width: `${Math.min(100, share * 100)}%` }}
                    />
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-mono text-sm font-semibold tabular-nums text-gray-900">
                    {money(bucket.value)}
                  </p>
                  <p className="text-[11px] text-gray-400">{percent(share, 1)} of cost</p>
                </div>
                <Info className="h-3.5 w-3.5 shrink-0 text-gray-300 transition-colors group-hover:text-blue-500" />
              </button>
            )
          })}
        </div>

        <Separator />

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm font-semibold text-gray-900">Total development cost</span>
          <span className="font-mono text-lg font-bold tabular-nums text-gray-900">
            {money(total)}
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Gross floor area"
            value={area(results.totalGfaSqm)}
            sub="Total across the scheme"
          />
          <StatTile
            label="Build rate assumed"
            value={ratePerSqm(results.constructionRatePerSqm.value)}
            sub={
              results.constructionRatePerSqm.range
                ? `Range ${ratePerSqm(results.constructionRatePerSqm.range.low)} – ${ratePerSqm(results.constructionRatePerSqm.range.high)}`
                : 'Pinned by you'
            }
          />
          <StatTile
            label="Cost per m²"
            value={ratePerSqm(safeDiv(total, results.totalGfaSqm))}
            sub="All-in, including land and finance"
          />
        </div>
      </SectionCard>

      <TraceSheet
        open={openBucket !== null}
        onOpenChange={(open) => !open && setOpenBucket(null)}
        title={openBucket?.label ?? ''}
        traced={openBucket}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Statutory detail
// ---------------------------------------------------------------------------

export function StatutoryPanel({ results }: { results: FeasibilityResults }) {
  const [open, setOpen] = React.useState<{ title: string; traced: CostBucket | null } | null>(null)
  const s = results.statutory

  const j = s.jurisdiction
  const lines: { title: string; traced: typeof s.stampDuty; note: string }[] = [
    {
      title: `${j} transfer (stamp) duty`,
      traced: s.stampDuty,
      note:
        s.dutyRegime === 'commercial'
          ? 'Payable on settlement — non-residential scale'
          : 'Payable on settlement',
    },
    { title: `${j} land tax`, traced: s.landTaxPerYear, note: 'Per year, while you hold' },
    {
      title: `${j} land tax over the project`,
      traced: s.landTaxOverProject,
      note: 'Included in holding costs',
    },
    {
      title: `${s.warrantyShortName} premium`,
      traced: s.hbcfPremium,
      note: s.warrantyName.split(',')[0].split('(')[0].trim(),
    },
    { title: 'GST on sale', traced: s.gst, note: 'Under the margin scheme' },
    {
      title: 'Council & infrastructure contributions',
      traced: s.councilContributions,
      note: s.contributionMechanismShort,
    },
  ]

  return (
    <>
      <SectionCard
        title="Statutory costs & duties"
        blurb="Every figure here comes from a published schedule. These are the lines most often missed entirely."
        icon={<Landmark className="h-4 w-4 text-blue-600" />}
      >
        <div className="divide-y divide-gray-100">
          {lines.map((line) => (
            <button
              key={line.title}
              type="button"
              onClick={() =>
                setOpen({
                  title: line.title,
                  traced: { ...line.traced, key: 'taxes_duties', label: line.title, description: line.note },
                })
              }
              className="group flex w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:bg-gray-50/70"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{line.title}</span>
                  <ConfidenceBadge
                    confidence={line.traced.confidence}
                    className="text-[10px]"
                  />
                </div>
                <p className="mt-0.5 text-xs text-gray-500">{line.note}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="font-mono text-sm font-semibold tabular-nums text-gray-900">
                  {money(line.traced.value)}
                </span>
                <Info className="h-3.5 w-3.5 text-gray-300 transition-colors group-hover:text-blue-500" />
              </div>
            </button>
          ))}
        </div>
      </SectionCard>

      <TraceSheet
        open={open !== null}
        onOpenChange={(o) => !o && setOpen(null)}
        title={open?.title ?? ''}
        traced={open?.traced ?? null}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

export function ClassificationPanel({ results }: { results: FeasibilityResults }) {
  const c = results.classification

  return (
    <SectionCard
      title="Building classification"
      blurb="What the National Construction Code calls this building, and what that costs you."
      icon={<ShieldAlert className="h-4 w-4 text-blue-600" />}
      action={
        <Badge
          variant="outline"
          className={
            c.dbpApplies
              ? 'border-amber-300 bg-amber-50 text-amber-800'
              : 'border-emerald-300 bg-emerald-50 text-emerald-800'
          }
        >
          {nccClassLabel(c.nccClass)}
        </Badge>
      }
    >
      <p className="text-sm leading-relaxed text-gray-600">
        {c.reasoning}
        {c.inferred ? (
          <span className="text-gray-400"> (Inferred — set the title type to firm this up.)</span>
        ) : null}
      </p>

      {c.dbpApplies ? (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <StatTile
              label="Compliance cost uplift"
              value={money(c.dbpCostUplift)}
              tone="warning"
              sub="Included in planning & design"
            />
            <StatTile
              label="Program impact"
              value={`${c.dbpProgramMonths} months`}
              tone="warning"
              sub="Added to your project duration"
            />
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Practitioners that must be registered
            </p>
            <ul className="space-y-1.5">
              {c.requiredPractitioners.map((p) => (
                <li key={p} className="flex items-start gap-2 text-xs text-gray-600">
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-gray-300" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-gray-500">
              {c.regimeRegisterUrl ? (
                <>
                  Verify each one on the{' '}
                  <a
                    href={c.regimeRegisterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    public register
                  </a>{' '}
                  before you sign a building contract.
                </>
              ) : (
                <>Verify each one on the public register before you sign a building contract.</>
              )}
            </p>
          </div>
        </>
      ) : c.regimeName ? (
        <DidYouKnow title={`The ${c.regimeName} does not apply here`} tone="blue">
          <p>
            That saves roughly{' '}
            {c.regimeCostRange
              ? `${money(c.regimeCostRange.low)}–${money(c.regimeCostRange.high)}`
              : 'a substantial sum'}{' '}
            of registered-practitioner fees and one and a half to four months of program compared
            with a Class 2 scheme. If the title type changes to strata, this changes with it.
          </p>
        </DidYouKnow>
      ) : (
        <DidYouKnow title="No registered-practitioner uplift in this state" tone="blue">
          <p>
            {results.statutory.jurisdiction} does not run a scheme like the NSW Design and Building
            Practitioners Act, so we have not added a compliance uplift. The classification still
            drives your warranty insurance and certification path, and some states impose a
            developer bond on taller residential buildings instead — check the local rules before
            you contract.
          </p>
        </DidYouKnow>
      )}
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Narrative
// ---------------------------------------------------------------------------

export function NarrativePanel({ results }: { results: FeasibilityResults }) {
  return (
    <SectionCard
      title="Here's how the numbers were built"
      blurb="The same model, explained in words. Updates live as you edit anything."
      icon={<ScrollText className="h-4 w-4 text-blue-600" />}
    >
      <div className="space-y-5">
        {results.narrative.map((section) => (
          <div key={section.heading}>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {section.heading}
            </p>
            <ul className="mt-2 space-y-2">
              {section.bullets.map((bullet, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm leading-relaxed text-gray-600"
                >
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-gray-300" />
                  <span>
                    <RichText text={bullet} />
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Mode-specific verdict blocks
// ---------------------------------------------------------------------------

export function ModeBlocks({
  inputs,
  results,
}: {
  inputs: FeasibilityInputs
  results: FeasibilityResults
}) {
  if (results.ppr) {
    const p = results.ppr
    return (
      <SectionCard
        title={
          inputs.pprSubMode === 'knock_down_rebuild'
            ? 'Your rebuild — funding and serviceability'
            : 'Your build — funding and serviceability'
        }
        blurb="Two numbers decide most owner-occupier builds: whether you can fund it, and whether you can service it afterwards."
        icon={<Landmark className="h-4 w-4 text-blue-600" />}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Releasable equity"
            value={money(p.releasableEquity)}
            sub="80% of your home's value, less what you owe"
          />
          <StatTile
            label="Build cost"
            value={money(p.buildCost)}
            sub="Everything except land you already own"
          />
          <StatTile
            label="Cash shortfall"
            value={money(p.cashShortfall)}
            tone={p.cashShortfall > 0 ? 'negative' : 'positive'}
            sub={
              p.cashShortfall > 0
                ? 'Above what a lender will advance — you fund this'
                : 'Fully fundable on these numbers'
            }
          />
          <StatTile
            label="Duty saved"
            value={money(p.dutySaved)}
            tone={p.dutySaved > 0 ? 'positive' : 'neutral'}
            sub={p.dutySaved > 0 ? 'By rebuilding instead of buying' : 'Not a rebuild'}
          />
          <StatTile
            label="Loan required"
            value={money(p.loanRequired)}
            sub="Existing mortgage plus the build"
          />
          <StatTile
            label="LVR on completion"
            value={percent(p.lvr)}
            tone={p.lvr > 0.8 ? 'warning' : 'positive'}
            sub={`Against ${money(p.completedValue)} completed value`}
          />
          <StatTile
            label="Monthly repayment"
            value={money(p.monthlyRepayment)}
            sub="Principal and interest over 30 years"
          />
          <StatTile
            label="Debt-to-income"
            value={p.dti.toFixed(2)}
            tone={p.dti >= 6 ? 'negative' : p.dti >= 5 ? 'warning' : 'positive'}
            sub={p.dti >= 6 ? "In the regulator's hot zone" : 'Below the 6.0 threshold'}
          />
        </div>

        {p.lmiPayable > 0 ? (
          <DidYouKnow title={`Lenders Mortgage Insurance of about ${money(p.lmiPayable)}`}>
            <p>
              Crossing 80% of the completed value triggers LMI. It is a one-off premium, usually
              capitalised onto the loan — so you pay interest on it for the life of the mortgage.
              Getting under 80% avoids it entirely.
            </p>
          </DidYouKnow>
        ) : null}
      </SectionCard>
    )
  }

  if (results.renovation) {
    const r = results.renovation
    return (
      <SectionCard
        title="Your renovation — is it worth it?"
        blurb="The verdict here is equity gain, not profit: does the work add more value than it costs?"
        icon={<Landmark className="h-4 w-4 text-blue-600" />}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile label="Total spend" value={money(r.spend)} sub="All-in, including soft costs" />
          <StatTile label="Value before" value={money(r.valueBefore)} />
          <StatTile label="Value after" value={money(r.valueAfter)} />
          <StatTile
            label="Equity gain"
            value={money(r.equityGain)}
            tone={r.equityGain > 0 ? 'positive' : 'negative'}
            sub="Value uplift less what you spent"
          />
        </div>

        {r.aboveValueCeiling ? (
          <DidYouKnow title="You are pushing above the suburb median">
            <p>
              The finished value sits {money(Math.abs(r.ceilingHeadroom))} above the median for
              this configuration. Buyers anchor to comparable sales, so the money spent past the
              median is the least likely to come back.
            </p>
          </DidYouKnow>
        ) : null}

        {r.rebuildLikelyBetter ? (
          <DidYouKnow title="Consider a rebuild instead">
            <p>
              Construction is {percent(r.crossoverRatio)} of the finished value. Past roughly 50%,
              knocking down and building new is often cheaper per square metre and produces a more
              sellable house — no compromises around retained structure. Run this site as a
              knock-down rebuild and compare.
            </p>
          </DidYouKnow>
        ) : null}
      </SectionCard>
    )
  }

  if (results.hold) {
    const h = results.hold
    return (
      <SectionCard
        title="Your holding — income and cover"
        blurb="A hold is judged on income, not on a sale."
        icon={<Landmark className="h-4 w-4 text-blue-600" />}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Gross annual rent"
            value={money(h.grossAnnualRent)}
            sub={`${inputs.yield} × ${money(inputs.weeklyRentPerDwelling)}/week`}
          />
          <StatTile
            label="Net annual rent"
            value={money(h.netAnnualRent)}
            sub="After 25% for management, vacancy, repairs"
          />
          <StatTile
            label="Yield on cost"
            value={percent(h.yieldOnCost)}
            sub="Net rent ÷ total development cost"
          />
          <StatTile
            label="Value on completion"
            value={money(h.completedValue)}
            sub={`Capitalised at ${percent(inputs.exitCapRate)}`}
          />
          <StatTile
            label="Annual debt service"
            value={money(h.annualDebtService)}
            sub="Interest on the term facility"
          />
          <StatTile
            label="Debt service cover"
            value={Number.isFinite(h.dscr) ? `${h.dscr.toFixed(2)}×` : '—'}
            tone={h.dscr < 1 ? 'negative' : h.dscr < 1.25 ? 'warning' : 'positive'}
            sub="Lenders usually want 1.25× or better"
          />
          <StatTile
            label="Cash on cash"
            value={percent(h.cashOnCash)}
            tone={h.cashOnCash < 0 ? 'negative' : 'neutral'}
            sub="Net rent less debt service, ÷ equity"
          />
        </div>

        {h.yieldOnCost > 0 && h.yieldOnCost < inputs.exitCapRate ? (
          <DidYouKnow title="Buying may beat building here">
            <p>
              Yield on cost of {percent(h.yieldOnCost)} is below the {percent(inputs.exitCapRate)}{' '}
              cap rate you would pay in the market. On these numbers you would be taking
              development risk for a worse income return than simply buying the finished product.
            </p>
          </DidYouKnow>
        ) : null}
      </SectionCard>
    )
  }

  return null
}

// ---------------------------------------------------------------------------
// Composed results view
// ---------------------------------------------------------------------------

export function ResultsView() {
  const { inputs, results } = useFeasibilityStore()

  return (
    <div className="space-y-6">
      <VerdictBanner inputs={inputs} results={results} />
      <HeadlineStats inputs={inputs} results={results} />
      <ModeBlocks inputs={inputs} results={results} />
      <InsightList results={results} />
      <CostBreakdown results={results} />
      <StatutoryPanel results={results} />
      {inputs.mode !== 'renovate' && inputs.devType !== 'subdivision' ? (
        <ClassificationPanel results={results} />
      ) : null}
      <NarrativePanel results={results} />
    </div>
  )
}

export { BUCKET_LABELS }
