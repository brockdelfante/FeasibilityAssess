'use client'

/**
 * Development Feasibility Assessment — the wizard.
 *
 * Four short input steps, then the results. The live verdict rail stays pinned
 * beside the form the whole way through, so a client sees the answer move as
 * they answer questions rather than filling in a form and hoping.
 *
 * Everything analytical — scenarios, sensitivity, cashflow, scale, the solver
 * and Pro Mode — sits below the results, collapsed. Those panels are also the
 * expensive ones, and the store only computes each once its section is opened.
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
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Calculator,
  RotateCcw,
  Sparkles,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { STEPS, useFeasibilityStore } from '@/lib/feasibility/store'
import { decodeInputs } from '@/lib/feasibility/share'
import { money, percent } from '@/lib/feasibility/trace'

import { StepIntent, StepMoney, StepQuality, StepSite } from '@/components/feasibility/steps'
import { ResultsView } from '@/components/feasibility/results'
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
// Stepper
// ---------------------------------------------------------------------------

function Stepper() {
  const { stepIndex, visited, goToStep } = useFeasibilityStore()

  return (
    <nav aria-label="Progress" className="flex flex-wrap gap-2">
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
              'flex items-center gap-2 rounded-lg border px-3 py-2 text-left transition-all',
              isCurrent
                ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500'
                : isDone
                  ? 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-50'
                  : isReachable
                    ? 'border-gray-200 bg-white hover:bg-gray-50'
                    : 'cursor-not-allowed border-gray-100 bg-gray-50 opacity-60'
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                isCurrent
                  ? 'bg-blue-600 text-white'
                  : isDone
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-200 text-gray-500'
              )}
            >
              {isDone ? <Check className="h-3 w-3" /> : i + 1}
            </span>
            <span
              className={cn(
                'text-xs font-semibold',
                isCurrent ? 'text-blue-900' : isDone ? 'text-emerald-900' : 'text-gray-600'
              )}
            >
              {step.title}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

// ---------------------------------------------------------------------------
// Live verdict rail
// ---------------------------------------------------------------------------

function LiveRail() {
  const { inputs, results, goToStep } = useFeasibilityStore()
  const sells = inputs.mode === 'develop_to_sell'

  const tone =
    results.verdict === 'feasible'
      ? 'border-emerald-300 bg-emerald-50'
      : results.verdict === 'marginal'
        ? 'border-amber-300 bg-amber-50'
        : 'border-red-300 bg-red-50'

  const label =
    results.verdict === 'feasible'
      ? 'Feasible'
      : results.verdict === 'marginal'
        ? 'Marginal'
        : 'Not feasible'

  return (
    <div className="space-y-3">
      <div className={cn('rounded-xl border p-4', tone)}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          Live verdict
        </p>
        <p className="mt-0.5 text-lg font-bold text-gray-900">{label}</p>
        <p className="mt-1 text-xs leading-relaxed text-gray-600">{results.verdictReason}</p>
      </div>

      <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-4">
        {[
          sells
            ? { label: 'Gross revenue', value: money(results.grossRevenue) }
            : { label: 'Value on completion', value: money(results.grossRevenue) },
          { label: 'Total cost', value: money(results.totalDevelopmentCost) },
          ...(sells
            ? [
                { label: 'Net profit', value: money(results.netProfit) },
                { label: 'Margin on cost', value: percent(results.marginOnCost) },
              ]
            : []),
          { label: 'Equity needed', value: money(results.requiredEquity) },
          { label: 'Peak debt', value: money(results.peakDebt) },
        ].map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-2">
            <span className="text-xs text-gray-500">{row.label}</span>
            <span className="font-mono text-sm font-semibold tabular-nums text-gray-900">
              {row.value}
            </span>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
        <p className="text-xs leading-relaxed text-gray-500">
          These update as you answer. Every assumption you have not given us yet comes from our NSW
          rate library, so the answer is complete from the first question.
        </p>
        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => goToStep(STEPS.length - 1)}
        >
          Skip to full results
          <ArrowRight className="h-3 w-3" />
        </Button>
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
      title: 'Scenarios & sensitivity',
      blurb: 'How resilient is this deal, and which levers matter most?',
      render: () => (
        <div className="space-y-6">
          <ScenarioPanel />
          <SensitivityPanel />
        </div>
      ),
    },
    {
      value: 'cashflow',
      title: 'Cashflow, peak debt & IRR',
      blurb: 'Month-by-month debt curve, equity-first funding, capitalised interest.',
      render: () => <CashflowPanel />,
    },
    {
      value: 'scale',
      title: 'What scale does this site need?',
      blurb: 'Yield against dwelling size, and the smallest configuration that works.',
      render: () => <ScalePanel />,
    },
    {
      value: 'solver',
      title: 'What would have to be true?',
      blurb: 'Solve any single input back from your target margin.',
      render: () => <SolverPanel />,
    },
    {
      value: 'pro',
      title: 'Pro Mode — override any number',
      blurb: 'Cost overrides, trade-level breakdown, and the assemblies catalogue. All optional.',
      render: () => (
        <div className="space-y-6">
          <OverridesPanel />
          <BoqPanel />
          <AssembliesPanel />
        </div>
      ),
    },
    {
      value: 'sources',
      title: "What's behind the numbers",
      blurb: 'Every source, every schedule, every indicative range.',
      render: () => <SourcesPanel />,
    },
  ]

  return (
    <Accordion type="multiple" value={open} onValueChange={setOpen} className="space-y-3">
      {sections.map((section) => (
        <AccordionItem
          key={section.value}
          value={section.value}
          className="overflow-hidden rounded-xl border border-gray-200 bg-white"
        >
          <AccordionTrigger className="px-5 py-4 hover:no-underline">
            <div className="text-left">
              <p className="text-sm font-semibold text-gray-900">{section.title}</p>
              <p className="mt-0.5 text-xs font-normal text-gray-500">{section.blurb}</p>
            </div>
          </AccordionTrigger>
          <AccordionContent className="border-t border-gray-100 bg-gray-50/40 p-5">
            {open.includes(section.value) ? section.render() : null}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function FeasibilityPage() {
  const { stepIndex, next, back, resetAll, replaceInputs, inputs } = useFeasibilityStore()
  const isResults = stepIndex === STEPS.length - 1
  const step = STEPS[stepIndex]

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
      useFeasibilityStore.getState().goToStep(STEPS.length - 1)
    }
  }, [replaceInputs])

  return (
    <div className="min-h-screen bg-gray-50">
      <DisclaimerGate />

      <div className="mx-auto max-w-7xl space-y-6 p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                Development Feasibility Assessment
              </h1>
            </div>
            <p className="mt-1 text-sm text-gray-500">
              {inputs.projectName ? (
                <span className="font-medium text-gray-700">{inputs.projectName} · </span>
              ) : null}
              Property development feasibility, stamp duty, land tax, HBCF, margin and IRR — every
              number traceable.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-blue-200 bg-blue-50 text-blue-700">
              <Sparkles className="mr-1 h-3 w-3" />
              NSW · 2025–26 rates
            </Badge>
            <Button variant="ghost" size="sm" onClick={resetAll}>
              <RotateCcw className="h-3 w-3" />
              Start over
            </Button>
          </div>
        </div>

        <Stepper />

        {/* Current step */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            Step {stepIndex + 1} of {STEPS.length}
          </p>
          <h2 className="mt-1 text-lg font-bold text-gray-900">{step.title}</h2>
          <p className="text-sm text-gray-500">{step.blurb}</p>
        </div>

        {isResults ? (
          <div className="space-y-6">
            <ResultsView />

            <div>
              <h2 className="mb-1 text-lg font-bold text-gray-900">Advanced analysis</h2>
              <p className="mb-3 text-sm text-gray-500">
                Optional. Open any section to run it — nothing here is needed for the verdict above.
              </p>
              <AdvancedSections />
            </div>

            <ExportPanel />
            <DisclaimerFooter />

            <div className="flex justify-start">
              <Button variant="outline" onClick={back}>
                <ArrowLeft className="h-4 w-4" />
                Back to inputs
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              {stepIndex === 0 ? <StepIntent /> : null}
              {stepIndex === 1 ? <StepSite /> : null}
              {stepIndex === 2 ? <StepQuality /> : null}
              {stepIndex === 3 ? <StepMoney /> : null}

              <div className="flex items-center justify-between">
                <Button variant="outline" onClick={back} disabled={stepIndex === 0}>
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={next}>
                  {stepIndex === STEPS.length - 2 ? 'See my results' : 'Continue'}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <aside className="lg:sticky lg:top-6 lg:self-start">
              <LiveRail />
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
