'use client'

/**
 * Development Feasibility Assessment — the wizard.
 *
 * Four short input steps, then the results. The live verdict stays visible the
 * whole way through, so a client sees the answer move as they answer questions
 * rather than filling in a form and hoping.
 *
 * That promise used to hold only on a wide screen: the verdict rail was a
 * second grid column, which on a phone means it sits *below* the form and the
 * next/back buttons, out of sight. Under lg it is now a docked summary bar that
 * expands into the full rail, so the answer is on screen at every width.
 *
 * Everything analytical — scenarios, sensitivity, cashflow, scale, the solver
 * and Pro Mode — sits below the results, collapsed. Those panels are also the
 * expensive ones, and each computes only once its section is opened.
 */

import * as React from 'react'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  ChevronUp,
  Calculator,
  LineChart,
  Layers,
  Link2,
  RotateCcw,
  Ruler,
  Sparkles,
  Target,
  BookOpen,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { profileFor } from '@/lib/feasibility/jurisdictions'
import { STEPS, useFeasibilityStore } from '@/lib/feasibility/store'
import { buildShareUrl, decodeInputs } from '@/lib/feasibility/share'
import { money, percent } from '@/lib/feasibility/trace'
import type { FeasibilityResults, Verdict } from '@/lib/feasibility/types'

import { StepIntent, StepMoney, StepQuality, StepSite } from '@/components/feasibility/steps'
import { ResultsView, resultsOutline } from '@/components/feasibility/results'
import { FundingView } from '@/components/feasibility/funding'
import {
  CashflowPanel,
  ScalePanel,
  ScenarioPanel,
  SensitivityPanel,
  SolverPanel,
} from '@/components/feasibility/advanced'
import {
  AssembliesPanel,
  BoqPanel,
  OverridesPanel,
} from '@/components/feasibility/promode'
import {
  DisclaimerFooter,
  DisclaimerGate,
  ExportPanel,
  SourcesPanel,
} from '@/components/feasibility/export'

// ---------------------------------------------------------------------------
// Verdict presentation — one definition, used by the rail, the dock and the
// sticky results header, so the three can never disagree.
// ---------------------------------------------------------------------------

const VERDICT: Record<Verdict, { label: string; chip: string; wrap: string; dot: string }> = {
  feasible: {
    label: 'Feasible',
    chip: 'bg-positive-100 text-positive-800',
    wrap: 'border-positive-200 bg-positive-50',
    dot: 'bg-positive-600',
  },
  marginal: {
    label: 'Marginal',
    chip: 'bg-caution-100 text-caution-800',
    wrap: 'border-caution-200 bg-caution-50',
    dot: 'bg-caution-600',
  },
  not_feasible: {
    label: 'Not feasible',
    chip: 'bg-critical-100 text-critical-800',
    wrap: 'border-critical-200 bg-critical-50',
    dot: 'bg-critical-600',
  },
}

/** The figures the rail and the dock both show, in one place. */
function summaryRows(
  results: FeasibilityResults,
  sells: boolean
): { label: string; value: string }[] {
  return [
    {
      label: sells ? 'Gross revenue' : 'Value on completion',
      value: money(results.grossRevenue),
    },
    { label: 'Total cost', value: money(results.totalDevelopmentCost) },
    ...(sells
      ? [
          { label: 'Net profit', value: money(results.netProfit) },
          { label: 'Margin on cost', value: percent(results.marginOnCost) },
        ]
      : []),
    { label: 'Equity needed', value: money(results.requiredEquity) },
    { label: 'Peak debt', value: money(results.peakDebt) },
  ]
}

// ---------------------------------------------------------------------------
// Stepper
// ---------------------------------------------------------------------------

function Stepper() {
  const { stepIndex, visited, goToStep } = useFeasibilityStore()
  const pct = Math.round((stepIndex / (STEPS.length - 1)) * 100)

  return (
    <div className="space-y-2">
      {/* A single bar reads as "how much is left" at a glance, which five
          separate chips never did. */}
      <div className="flex items-center gap-3">
        <div
          className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Assessment progress"
        >
          <div
            className="h-full rounded-full bg-brand-600 transition-[width] duration-300"
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        </div>
        <span className="shrink-0 text-xs font-medium tabular-nums text-muted-foreground">
          Step {stepIndex + 1} of {STEPS.length}
        </span>
      </div>

      {/* The chips scroll horizontally under sm rather than wrapping into three
          ragged rows on a phone. */}
      <nav
        aria-label="Progress"
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {STEPS.map((step, i) => {
          const isCurrent = i === stepIndex
          const isDone = visited.has(i) && i < stepIndex
          const isReachable = visited.has(i) || i <= stepIndex

          return (
            <button
              key={step.key}
              type="button"
              onClick={() => isReachable && goToStep(i)}
              disabled={!isReachable}
              aria-current={isCurrent ? 'step' : undefined}
              className={cn(
                'flex shrink-0 items-center gap-2 rounded-lg border px-3 py-2 text-left transition-colors',
                isCurrent
                  ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-500'
                  : isDone
                    ? 'border-positive-200 bg-positive-50/60 hover:bg-positive-50'
                    : isReachable
                      ? 'border-border bg-background hover:bg-muted'
                      : 'cursor-not-allowed border-border bg-muted/50 opacity-60'
              )}
            >
              <span
                className={cn(
                  'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
                  isCurrent
                    ? 'bg-brand-600 text-white'
                    : isDone
                      ? 'bg-positive-600 text-white'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                {isDone ? <Check className="h-3 w-3" /> : i + 1}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-xs font-semibold',
                  isCurrent
                    ? 'text-brand-900'
                    : isDone
                      ? 'text-positive-800'
                      : 'text-muted-foreground'
                )}
              >
                {step.title}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Live verdict — desktop rail
// ---------------------------------------------------------------------------

function LiveRail() {
  const { inputs, results, goToStep } = useFeasibilityStore()
  const sells = inputs.mode === 'develop_to_sell'
  const v = VERDICT[results.verdict]

  return (
    <div className="space-y-3">
      <div className={cn('rounded-xl border p-4', v.wrap)}>
        <p className="eyebrow">Live verdict</p>
        <p className="mt-0.5 text-lg font-bold">{v.label}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {results.verdictReason}
        </p>
      </div>

      <div className="space-y-2 rounded-xl border border-border bg-background p-4">
        {summaryRows(results, sells).map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-muted-foreground">{row.label}</span>
            <span className="figure text-sm">{row.value}</span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="text-xs leading-relaxed text-muted-foreground">
          These update as you answer. Every assumption you have not given us yet comes from our
          rate library and your state&rsquo;s own statutory schedules, so the answer is complete
          from the first question.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => goToStep(RESULTS_STEP)}
        >
          Skip to full results
          <ArrowRight className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Live verdict — mobile dock
// ---------------------------------------------------------------------------

/**
 * Under lg the verdict docks to the bottom of the viewport instead of falling
 * below the fold. Tapping it opens the same rail in a sheet, so a phone user
 * gets the identical information rather than a cut-down version.
 */
function LiveDock() {
  const { inputs, results } = useFeasibilityStore()
  const [open, setOpen] = React.useState(false)
  const sells = inputs.mode === 'develop_to_sell'
  const v = VERDICT[results.verdict]

  const headline = sells
    ? { label: 'Net profit', value: money(results.netProfit) }
    : { label: 'Total cost', value: money(results.totalDevelopmentCost) }

  return (
    <>
      {/* Spacer so the dock never covers the last control on the page. */}
      <div aria-hidden className="h-20 lg:hidden" />

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
          aria-label="Show the live verdict in full"
        >
          <span className="flex min-w-0 items-center gap-2.5">
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', v.dot)} />
            <span className="min-w-0">
              <span className="block text-sm font-semibold">{v.label}</span>
              <span className="block truncate text-[11px] text-muted-foreground">
                {headline.label} {headline.value}
              </span>
            </span>
          </span>
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        </button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-left">Live verdict</SheetTitle>
            <SheetDescription className="text-left">
              Updates as you answer. Unanswered assumptions come from the rate library.
            </SheetDescription>
          </SheetHeader>
          <LiveRail />
        </SheetContent>
      </Sheet>
    </>
  )
}

// ---------------------------------------------------------------------------
// Results: sticky summary + section jump
// ---------------------------------------------------------------------------

/**
 * The results page is long. This keeps the verdict and the jump links in view
 * while you scroll it, so you never lose the answer you came for — or have to
 * scroll back up to reach another section.
 */
function ResultsBar() {
  const { inputs, results } = useFeasibilityStore()
  const v = VERDICT[results.verdict]
  const sells = inputs.mode === 'develop_to_sell'
  const outline = resultsOutline(inputs)

  return (
    <div className="sticky top-14 z-20 -mx-4 border-b border-border bg-background/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span
          className={cn(
            'inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold',
            v.chip
          )}
        >
          <span className={cn('h-1.5 w-1.5 rounded-full', v.dot)} />
          {v.label}
        </span>

        {sells ? (
          <span className="shrink-0 text-xs text-muted-foreground">
            <span className="figure text-foreground">{money(results.netProfit)}</span> profit ·{' '}
            <span className="figure text-foreground">{percent(results.marginOnCost)}</span> margin
          </span>
        ) : (
          <span className="shrink-0 text-xs text-muted-foreground">
            <span className="figure text-foreground">
              {money(results.totalDevelopmentCost)}
            </span>{' '}
            total cost
          </span>
        )}

        <nav
          aria-label="Results sections"
          className="-mx-1 flex flex-1 gap-1 overflow-x-auto px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {outline.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className="shrink-0 whitespace-nowrap rounded-md px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {section.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Advanced sections
// ---------------------------------------------------------------------------

/**
 * Each accordion section renders its panel only while open. That is what keeps
 * the expensive panels lazy — the scale grid runs 300 full engine passes, so
 * mounting it unconditionally would make every keystroke feel slow.
 */
function AdvancedSections() {
  const [open, setOpen] = React.useState<string[]>([])

  const sections = [
    {
      value: 'scenarios',
      icon: BarChart3,
      title: 'Scenarios & sensitivity',
      // "What question does this answer?" rather than "what is in it?" — the
      // titles alone gave no reason to open any of them.
      blurb: 'If build costs blow out or prices soften, does this deal still work?',
      render: () => (
        <div className="space-y-6">
          <ScenarioPanel />
          <SensitivityPanel />
        </div>
      ),
    },
    {
      value: 'cashflow',
      icon: LineChart,
      title: 'Cashflow, peak debt & IRR',
      blurb: 'How much cash do I need, when do I need it, and what does the return look like?',
      render: () => <CashflowPanel />,
    },
    {
      value: 'scale',
      icon: Ruler,
      title: 'What scale does this site need?',
      blurb: 'How many dwellings, and how big, before this site pays for itself?',
      render: () => <ScalePanel />,
    },
    {
      value: 'solver',
      icon: Target,
      title: 'What would have to be true?',
      blurb: 'What price, yield or build rate would get me to my target margin?',
      render: () => <SolverPanel />,
    },
    {
      value: 'sources',
      icon: BookOpen,
      title: "What's behind the numbers",
      blurb: 'Which schedule, guide or estimate is each figure standing on?',
      render: () => <SourcesPanel />,
    },
    {
      value: 'pro',
      icon: Layers,
      title: 'Pro Mode — override any number',
      blurb: 'Replace any assumption with your own: quotes, trade breakdowns, assemblies.',
      render: () => (
        <div className="space-y-6">
          <OverridesPanel />
          <BoqPanel />
          <AssembliesPanel />
        </div>
      ),
    },
  ]

  return (
    <Accordion type="multiple" value={open} onValueChange={setOpen} className="space-y-3">
      {sections.map((section) => {
        const Icon = section.icon
        const isOpen = open.includes(section.value)
        return (
          <AccordionItem
            key={section.value}
            value={section.value}
            className="overflow-hidden rounded-xl border border-border bg-background"
          >
            <AccordionTrigger className="px-4 py-4 hover:no-underline sm:px-5">
              <div className="flex min-w-0 items-start gap-3 text-left">
                <span
                  className={cn(
                    'mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                    isOpen ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-600'
                  )}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{section.title}</p>
                  <p className="mt-0.5 text-xs font-normal text-muted-foreground">
                    {section.blurb}
                  </p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="border-t border-border bg-muted/30 p-4 sm:p-5">
              {isOpen ? section.render() : null}
            </AccordionContent>
          </AccordionItem>
        )
      })}
    </Accordion>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * Copy a link that restores everything answered so far.
 *
 * This tool stores nothing — no account, no database — so the URL *is* the
 * save file. That makes it available from every stage rather than only at the
 * end: closing the tab three questions in and losing the lot is the single
 * worst thing that can happen to someone using this.
 */
function SaveProgress() {
  const { inputs } = useFeasibilityStore()
  const [copied, setCopied] = React.useState(false)

  const copy = async () => {
    const url = buildShareUrl(inputs, window.location.origin, window.location.pathname)
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      // Clipboard can be refused (permissions, insecure origin). Putting the
      // link in the address bar still lets them copy it by hand, which beats
      // failing silently.
      window.history.replaceState(null, '', url)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Button variant="outline" size="sm" onClick={copy}>
      {copied ? <Check className="h-3 w-3" /> : <Link2 className="h-3 w-3" />}
      {copied ? 'Link copied' : 'Save my progress'}
    </Button>
  )
}

/** Where the question-asking stops and the answers begin. */
const RESULTS_STEP = STEPS.findIndex((s) => s.key === 'results')
const FUNDING_STEP = STEPS.findIndex((s) => s.key === 'funding')
const REPORT_STEP = STEPS.findIndex((s) => s.key === 'report')

export function FeasibilityApp() {
  const { stepIndex, next, back, resetAll, replaceInputs, inputs } = useFeasibilityStore()
  const step = STEPS[stepIndex]
  const isInputStep = stepIndex < RESULTS_STEP

  // A share link carries the whole input set in the URL fragment. Read it once
  // on mount and jump straight to the results — whoever opened the link wants
  // to see the numbers, not re-answer the questions.
  // A ref rather than state: the guard is never rendered, and it has to flip
  // before the store update to stop a re-render re-reading the hash.
  const hydrated = React.useRef(false)
  React.useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    const hash = window.location.hash.slice(1)
    if (!hash) return
    const decoded = decodeInputs(hash)
    if (decoded) {
      replaceInputs(decoded)
      useFeasibilityStore.getState().goToStep(RESULTS_STEP)
    }
  }, [replaceInputs])

  // Moving between steps should start you at the top of the new step, not
  // halfway down it where the last one happened to be scrolled.
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [stepIndex])

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      <DisclaimerGate />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5 shrink-0 text-brand-600" />
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              Development Feasibility Assessment
            </h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {inputs.projectName ? (
              <span className="font-medium text-foreground">{inputs.projectName} · </span>
            ) : null}
            Feasibility, duty, land tax, builder warranty, margin and IRR — every number
            traceable.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-brand-200 bg-brand-50 text-brand-700">
            <Sparkles className="mr-1 h-3 w-3" />
            {inputs.jurisdiction} · {profileFor(inputs.jurisdiction).taxYear} rates
          </Badge>
          <SaveProgress />
          <Button variant="ghost" size="sm" onClick={resetAll}>
            <RotateCcw className="h-3 w-3" />
            Start over
          </Button>
        </div>
      </div>

      <Stepper />

      {isInputStep ? (
        <>
          <div>
            <h2 className="text-lg font-bold">{step.title}</h2>
            <p className="text-sm text-muted-foreground">{step.blurb}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="min-w-0 space-y-6">
              {stepIndex === 0 ? <StepIntent /> : null}
              {stepIndex === 1 ? <StepSite /> : null}
              {stepIndex === 2 ? <StepQuality /> : null}
              {stepIndex === 3 ? <StepMoney /> : null}
              <StageNav
                onBack={back}
                onNext={next}
                backDisabled={stepIndex === 0}
                nextLabel={stepIndex === RESULTS_STEP - 1 ? 'See if it stacks up' : 'Continue'}
              />
            </div>

            {/* top-20 clears the sticky app header rather than sliding under it. */}
            <aside className="hidden lg:sticky lg:top-20 lg:block lg:self-start">
              <LiveRail />
            </aside>
          </div>

          <LiveDock />
        </>
      ) : null}

      {stepIndex === RESULTS_STEP ? (
        <>
          <ResultsBar />

          <div className="space-y-6">
            <ResultsView />

            <div id="advanced" className="scroll-mt-32">
              <h2 className="mb-1 text-lg font-bold">Want to dig deeper?</h2>
              <p className="mb-3 text-sm text-muted-foreground">
                All optional. Open any section to run it — none of it is needed for the answer
                above.
              </p>
              <AdvancedSections />
            </div>

            <StageNav
              onBack={back}
              onNext={next}
              backLabel="Change my answers"
              nextLabel="Now, can I fund it?"
            />
          </div>
        </>
      ) : null}

      {stepIndex === FUNDING_STEP ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold">{step.title}</h2>
            <p className="text-sm text-muted-foreground">{step.blurb}</p>
          </div>

          <FundingView />

          <StageNav
            onBack={back}
            onNext={next}
            backLabel="Back to the feasibility"
            nextLabel="Get my report"
          />
        </div>
      ) : null}

      {stepIndex === REPORT_STEP ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold">{step.title}</h2>
            <p className="text-sm text-muted-foreground">{step.blurb}</p>
          </div>

          <div id="export" className="scroll-mt-32">
            <ExportPanel />
          </div>
          <DisclaimerFooter />

          <StageNav onBack={back} backLabel="Back to funding" />
        </div>
      ) : null}
    </div>
  )
}

/**
 * The move-between-stages control. One component so every stage gets the same
 * affordance in the same place — the previous version had a Continue button on
 * the input steps and a lone Back button on the results, which is how the flow
 * read as a dead end rather than a next step.
 */
function StageNav({
  onBack,
  onNext,
  backLabel = 'Back',
  nextLabel,
  backDisabled,
}: {
  onBack: () => void
  onNext?: () => void
  backLabel?: string
  nextLabel?: string
  backDisabled?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Button variant="outline" onClick={onBack} disabled={backDisabled}>
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Button>
      {onNext && nextLabel ? (
        <Button onClick={onNext}>
          {nextLabel}
          <ArrowRight className="h-4 w-4" />
        </Button>
      ) : null}
    </div>
  )
}
