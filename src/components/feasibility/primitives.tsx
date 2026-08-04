'use client'

/**
 * Friendly form and display primitives for the feasibility wizard.
 *
 * The design brief was "a client could use it", which drives three decisions
 * throughout: every field carries a plain-English hint, every money input
 * formats itself with separators as you type, and every derived number can be
 * clicked to see where it came from.
 */

import * as React from 'react'
import { Check, ChevronRight, Info, ShieldCheck, TriangleAlert } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

import { CONFIDENCE_BLURBS, CONFIDENCE_LABELS, type Option } from '@/lib/feasibility/labels'
import { sourceFor } from '@/lib/feasibility/sources'
import { formatStep, money, percent } from '@/lib/feasibility/trace'
import type { Confidence, Traced } from '@/lib/feasibility/types'

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function SectionCard({
  title,
  blurb,
  icon,
  children,
  className,
  action,
}: {
  title: string
  blurb?: string
  icon?: React.ReactNode
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}) {
  return (
    <Card className={cn('border-gray-200/80 shadow-sm', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
              {icon}
              {title}
            </CardTitle>
            {blurb ? <p className="text-sm leading-relaxed text-gray-500">{blurb}</p> : null}
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">{children}</CardContent>
    </Card>
  )
}

/** A labelled field with an optional hint underneath. */
export function Field({
  label,
  hint,
  children,
  htmlFor,
  warning,
}: {
  label: string
  hint?: React.ReactNode
  children: React.ReactNode
  htmlFor?: string
  warning?: string
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-gray-800">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-xs leading-relaxed text-gray-500">{hint}</p> : null}
      {warning ? (
        <p className="flex items-start gap-1.5 text-xs leading-relaxed text-amber-700">
          <TriangleAlert className="mt-0.5 h-3 w-3 shrink-0" />
          {warning}
        </p>
      ) : null}
    </div>
  )
}

/** Two-column field grid that collapses on small screens. */
export function FieldGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 sm:grid-cols-2">{children}</div>
}

/** A callout for the things clients genuinely do not know exist. */
export function DidYouKnow({
  title,
  children,
  tone = 'amber',
}: {
  title: string
  children: React.ReactNode
  tone?: 'amber' | 'blue'
}) {
  const tones = {
    amber: 'border-amber-200 bg-amber-50/70 text-amber-900',
    blue: 'border-blue-200 bg-blue-50/70 text-blue-900',
  }
  return (
    <div className={cn('rounded-xl border p-4', tones[tone])}>
      <p className="flex items-center gap-2 text-sm font-semibold">
        {tone === 'amber' ? (
          <TriangleAlert className="h-4 w-4 shrink-0" />
        ) : (
          <Info className="h-4 w-4 shrink-0" />
        )}
        {title}
      </p>
      <div className="mt-2 space-y-2 text-xs leading-relaxed">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

/**
 * Money input that shows thousands separators while you type.
 *
 * Local state holds what the client is typing so the caret does not jump as
 * separators are inserted, but the displayed value is *derived* rather than
 * synced from a prop: while focused we show their text, and the moment they
 * blur we fall back to formatting the real value. That keeps an external change
 * — a share link loading, or switching goal — visible without an effect fighting
 * the client mid-keystroke.
 */
export function MoneyInput({
  value,
  onChange,
  id,
  placeholder,
  disabled,
}: {
  value: number
  onChange: (value: number) => void
  id?: string
  placeholder?: string
  disabled?: boolean
}) {
  const [typed, setTyped] = React.useState('')
  const [focused, setFocused] = React.useState(false)

  const display = focused ? typed : value ? Math.round(value).toLocaleString('en-AU') : ''

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
        $
      </span>
      <Input
        id={id}
        inputMode="numeric"
        disabled={disabled}
        className="pl-7 font-mono tabular-nums"
        placeholder={placeholder}
        value={display}
        onFocus={() => {
          setTyped(value ? Math.round(value).toLocaleString('en-AU') : '')
          setFocused(true)
        }}
        onBlur={() => setFocused(false)}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, '')
          setTyped(digits ? Number(digits).toLocaleString('en-AU') : '')
          onChange(digits ? Number(digits) : 0)
        }}
      />
    </div>
  )
}

export function NumberInput({
  value,
  onChange,
  id,
  suffix,
  min = 0,
  max,
  step = 1,
  disabled,
}: {
  value: number
  onChange: (value: number) => void
  id?: string
  suffix?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        disabled={disabled}
        className={cn('font-mono tabular-nums', suffix && 'pr-14')}
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        step={step}
        onChange={(e) => {
          const next = e.target.value === '' ? 0 : Number(e.target.value)
          if (!Number.isFinite(next)) return
          onChange(max !== undefined ? Math.min(max, Math.max(min, next)) : Math.max(min, next))
        }}
      />
      {suffix ? (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-gray-400">
          {suffix}
        </span>
      ) : null}
    </div>
  )
}

/** Percentage input that displays whole percents but stores a decimal. */
export function PercentInput({
  value,
  onChange,
  id,
  decimals = 2,
  disabled,
}: {
  value: number
  onChange: (value: number) => void
  id?: string
  decimals?: number
  disabled?: boolean
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        disabled={disabled}
        className="pr-8 font-mono tabular-nums"
        step={decimals >= 2 ? 0.05 : 0.5}
        value={Number.isFinite(value) ? Number((value * 100).toFixed(decimals)) : ''}
        onChange={(e) => {
          const next = e.target.value === '' ? 0 : Number(e.target.value)
          if (!Number.isFinite(next)) return
          onChange(Math.max(0, next) / 100)
        }}
      />
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-400">
        %
      </span>
    </div>
  )
}

/** Slider with a live readout — used for the overrun buffer and target margin. */
export function PercentSlider({
  value,
  onChange,
  min = 0,
  max = 0.25,
  step = 0.005,
  marks,
}: {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  marks?: { at: number; label: string }[]
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-2xl font-semibold tabular-nums text-gray-900">
          {percent(value, 1)}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={([next]) => onChange(next)}
      />
      {marks ? (
        <div className="flex justify-between text-[11px] text-gray-400">
          {marks.map((m) => (
            <span key={m.at}>{m.label}</span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

/**
 * Big tappable choice cards. Used wherever the option set is small and the
 * choice is consequential — a dropdown hides the hints that make these
 * decisions obvious.
 */
export function ChoiceCards<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
  disabledValues,
}: {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
  columns?: 1 | 2 | 3
  disabledValues?: T[]
}) {
  const cols = { 1: 'grid-cols-1', 2 : 'sm:grid-cols-2', 3: 'sm:grid-cols-3' }[columns]
  return (
    <div className={cn('grid gap-3', cols)}>
      {options.map((option) => {
        const selected = option.value === value
        const disabled = disabledValues?.includes(option.value)
        return (
          <button
            key={String(option.value)}
            type="button"
            disabled={disabled}
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              'group relative rounded-xl border p-4 text-left transition-all',
              selected
                ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
              disabled && 'cursor-not-allowed opacity-40 hover:border-gray-200 hover:bg-white'
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  'text-sm font-semibold',
                  selected ? 'text-blue-900' : 'text-gray-900'
                )}
              >
                {option.label}
              </span>
              {selected ? (
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
              ) : null}
            </div>
            {option.hint ? (
              <span
                className={cn(
                  'mt-1 block text-xs leading-relaxed',
                  selected ? 'text-blue-700/80' : 'text-gray-500'
                )}
              >
                {option.hint}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}

/** Compact inline toggle group for two or three short options. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-gray-100 p-1">
      {options.map((option) => {
        const selected = option.value === value
        return (
          <button
            key={String(option.value)}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            className={cn(
              'rounded-md px-3 py-1.5 text-xs font-semibold transition-all',
              selected
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Trust layer
// ---------------------------------------------------------------------------

export function ConfidenceBadge({
  confidence,
  overridden,
  className,
}: {
  confidence: Confidence
  overridden?: boolean
  className?: string
}) {
  if (overridden) {
    return (
      <Badge
        variant="outline"
        className={cn('gap-1 border-emerald-300 bg-emerald-50 text-emerald-800', className)}
      >
        <ShieldCheck className="h-3 w-3" />
        Yours
      </Badge>
    )
  }

  const styles: Record<Confidence, string> = {
    high: 'border-emerald-300 bg-emerald-50 text-emerald-800',
    medium: 'border-blue-300 bg-blue-50 text-blue-800',
    low: 'border-amber-300 bg-amber-50 text-amber-800',
  }

  const shortLabel: Record<Confidence, string> = {
    high: 'High',
    medium: 'Medium',
    low: 'Verify',
  }

  return (
    <Badge variant="outline" className={cn(styles[confidence], className)}>
      {shortLabel[confidence]}
    </Badge>
  )
}

/**
 * Click any number to see the arithmetic behind it, its confidence, its
 * plausible range and its source. This is the single feature that makes an
 * estimate defensible to a client rather than a black box.
 */
export function TraceSheet({
  open,
  onOpenChange,
  title,
  traced,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  traced: Traced | null
}) {
  const source = sourceFor(traced?.sourceKey)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-left">{title}</SheetTitle>
          <SheetDescription className="text-left">
            How this figure was calculated, how much to trust it, and where it came from.
          </SheetDescription>
        </SheetHeader>

        {traced ? (
          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-4">
              <p className="font-mono text-3xl font-semibold tabular-nums text-gray-900">
                {money(traced.value)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <ConfidenceBadge
                  confidence={traced.confidence}
                  overridden={traced.overridden}
                />
                <span className="text-xs text-gray-500">
                  {traced.overridden
                    ? 'You pinned this value, so it replaces the rate library.'
                    : CONFIDENCE_BLURBS[traced.confidence]}
                </span>
              </div>
            </div>

            {traced.range ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Plausible range
                </p>
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3 font-mono text-sm tabular-nums">
                  <span className="text-gray-500">{money(traced.range.low)}</span>
                  <ChevronRight className="h-3 w-3 text-gray-300" />
                  <span className="font-semibold text-gray-900">{money(traced.value)}</span>
                  <ChevronRight className="h-3 w-3 text-gray-300" />
                  <span className="text-gray-500">{money(traced.range.high)}</span>
                </div>
              </div>
            ) : null}

            {traced.steps.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  How this was built
                </p>
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {traced.steps.map((step, i) => (
                    <div key={i} className="flex items-start justify-between gap-4 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-800">{step.label}</p>
                        {step.detail ? (
                          <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                            {step.detail}
                          </p>
                        ) : null}
                      </div>
                      {step.value !== undefined ? (
                        <span className="shrink-0 font-mono text-sm tabular-nums text-gray-900">
                          {formatStep(step)}
                        </span>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {traced.verifyWith ? (
              <DidYouKnow title="Verify this one" tone="amber">
                <p>Check this figure with {traced.verifyWith}.</p>
              </DidYouKnow>
            ) : null}

            {source ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Source
                </p>
                <div className="rounded-lg border border-gray-200 p-4">
                  <p className="text-sm font-semibold text-gray-900">{source.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{source.detail}</p>
                  <p className="mt-2 text-[11px] text-gray-400">As at {source.asAt}</p>
                  {source.url ? (
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-block text-xs font-medium text-blue-600 hover:underline"
                    >
                      View the source ↗
                    </a>
                  ) : null}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

/** A number the client can click to open its trace. */
export function TracedValue({
  traced,
  title,
  format = 'money',
  className,
}: {
  traced: Traced
  title: string
  format?: 'money' | 'percent'
  className?: string
}) {
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          'group inline-flex items-center gap-1.5 font-mono tabular-nums underline decoration-gray-300 decoration-dotted underline-offset-4 transition-colors hover:decoration-blue-500',
          className
        )}
        title="Click to see how this was calculated"
      >
        {format === 'percent' ? percent(traced.value) : money(traced.value)}
        <Info className="h-3 w-3 text-gray-300 transition-colors group-hover:text-blue-500" />
      </button>
      <TraceSheet open={open} onOpenChange={setOpen} title={title} traced={traced} />
    </>
  )
}

// ---------------------------------------------------------------------------
// Display
// ---------------------------------------------------------------------------

export function StatTile({
  label,
  value,
  sub,
  tone = 'neutral',
  className,
}: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  tone?: 'neutral' | 'positive' | 'negative' | 'warning'
  className?: string
}) {
  const tones = {
    neutral: 'text-gray-900',
    positive: 'text-emerald-600',
    negative: 'text-red-600',
    warning: 'text-amber-600',
  }
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white p-4', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{label}</p>
      <p className={cn('mt-1.5 font-mono text-xl font-semibold tabular-nums', tones[tone])}>
        {value}
      </p>
      {sub ? <p className="mt-1 text-xs leading-relaxed text-gray-500">{sub}</p> : null}
    </div>
  )
}

/** Renders the **bold** markers the narrative layer emits. */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <strong key={i} className="font-semibold text-gray-900">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  )
}

export { CONFIDENCE_LABELS }
