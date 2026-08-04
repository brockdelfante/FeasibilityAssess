'use client'

/**
 * Pro Mode — override anything.
 *
 * Entirely optional, and the copy says so repeatedly. Leave every cell blank
 * and the headline numbers do not change a cent: the Quick answer stays in
 * effect. The point is that a client who *does* have a builder quote or a QS
 * estimate can pin it without abandoning the model.
 *
 * Quick and Pro share one engine, so any override flows through every headline
 * metric, scenario, sensitivity row and cashflow month.
 */

import * as React from 'react'
import { Layers, PlusCircle, RotateCcw, Sliders, Trash2, Wrench } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'

import { ASSEMBLIES, assemblyByKey, assemblyUnitCost } from '@/lib/feasibility/assemblies'
import { boqLineTotal, boqTotal, boqTradeTotal } from '@/lib/feasibility/boq'
import { computeCore } from '@/lib/feasibility/engine'
import { TRADE_LABELS } from '@/lib/feasibility/labels'
import { TRADE_ORDER } from '@/lib/feasibility/rates'
import { useFeasibilityStore } from '@/lib/feasibility/store'
import { money, percent, safeDiv } from '@/lib/feasibility/trace'
import type { BucketKey, FeasibilityOverrides, TradeKey } from '@/lib/feasibility/types'

import { MoneyInput, SectionCard, StatTile } from './primitives'

// ---------------------------------------------------------------------------
// Cost overrides
// ---------------------------------------------------------------------------

/** An optional-override cell: blank means "use the Quick figure". */
function OverrideCell({
  quickValue,
  override,
  onChange,
  format = 'money',
}: {
  quickValue: number
  override: number | null
  onChange: (value: number | null) => void
  format?: 'money' | 'percent' | 'rate'
}) {
  const [text, setText] = React.useState(() =>
    override === null ? '' : format === 'percent' ? String(override * 100) : String(Math.round(override))
  )

  React.useEffect(() => {
    setText(
      override === null ? '' : format === 'percent' ? String(override * 100) : String(Math.round(override))
    )
  }, [override, format])

  const active = override !== null
  const activeValue = override ?? quickValue

  return (
    <>
      <TableCell className="text-right font-mono text-xs tabular-nums text-gray-500">
        {format === 'percent' ? percent(quickValue) : money(quickValue)}
        {format === 'rate' ? '/m²' : ''}
      </TableCell>
      <TableCell>
        <Input
          value={text}
          placeholder="—"
          inputMode="decimal"
          className={cn(
            'h-8 text-right font-mono text-xs tabular-nums',
            active && 'border-emerald-400 bg-emerald-50/60'
          )}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.]/g, '')
            setText(raw)
            if (raw === '') {
              onChange(null)
              return
            }
            const num = Number(raw)
            if (!Number.isFinite(num)) return
            onChange(format === 'percent' ? num / 100 : num)
          }}
        />
      </TableCell>
      <TableCell className="text-right">
        <span
          className={cn(
            'font-mono text-xs font-semibold tabular-nums',
            active ? 'text-emerald-700' : 'text-gray-900'
          )}
        >
          {format === 'percent' ? percent(activeValue) : money(activeValue)}
          {format === 'rate' ? '/m²' : ''}
        </span>
      </TableCell>
      <TableCell className="w-8">
        {active ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            title="Clear this override"
            onClick={() => onChange(null)}
          >
            <RotateCcw className="h-3 w-3" />
          </Button>
        ) : null}
      </TableCell>
    </>
  )
}

export function OverridesPanel() {
  const { inputs, results, setOverride, clearAllOverrides } = useFeasibilityStore()

  // The Quick figures, computed with every override stripped out, so the
  // comparison column always shows what the library would have said.
  const quick = React.useMemo(
    () =>
      computeCore({
        ...inputs,
        overrides: {
          constructionRatePerSqm: null,
          interestRate: null,
          loanToCost: null,
          acquisition: null,
          planning_design: null,
          construction: null,
          professional_fees: null,
          finance: null,
          holding: null,
          marketing_selling: null,
          contingency: null,
          taxes_duties: null,
        },
        boq: { touched: false, lines: [], seedTotal: 0 },
      }),
    [inputs]
  )

  const activeCount = Object.values(inputs.overrides).filter((v) => v !== null).length

  const bucketRows: { key: BucketKey & keyof FeasibilityOverrides; label: string }[] = [
    { key: 'acquisition', label: 'Acquisition (land, duty, legals)' },
    { key: 'planning_design', label: 'Planning & design' },
    { key: 'construction', label: 'Construction' },
    { key: 'professional_fees', label: 'Professional fees' },
    { key: 'finance', label: 'Finance' },
    { key: 'holding', label: 'Holding costs' },
    { key: 'marketing_selling', label: 'Marketing & selling' },
    { key: 'contingency', label: 'Contingency' },
    { key: 'taxes_duties', label: 'Taxes & duties (GST)' },
  ]

  return (
    <SectionCard
      title="Override any number"
      blurb="Completely optional. Leave every cell blank and your headline numbers do not change a cent — the Quick answer stays in effect. Use this when you have a real quote."
      icon={<Sliders className="h-4 w-4 text-blue-600" />}
      action={
        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <Badge variant="outline" className="border-emerald-300 bg-emerald-50 text-emerald-800">
              {activeCount} pinned
            </Badge>
          ) : null}
          <Button variant="outline" size="sm" onClick={clearAllOverrides}>
            <RotateCcw className="h-3 w-3" />
            Reset to Quick
          </Button>
        </div>
      }
    >
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Underlying rates
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rate</TableHead>
              <TableHead className="text-right">Quick (library)</TableHead>
              <TableHead className="w-32">Your value</TableHead>
              <TableHead className="text-right">Active</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium text-gray-800">Construction rate</TableCell>
              <OverrideCell
                quickValue={quick.constructionRate}
                override={inputs.overrides.constructionRatePerSqm}
                onChange={(v) => setOverride('constructionRatePerSqm', v)}
                format="rate"
              />
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-gray-800">Interest rate</TableCell>
              <OverrideCell
                quickValue={
                  quick.amounts.finance > 0 || true
                    ? (inputs.overrides.interestRate ?? 0) || quickInterest(inputs)
                    : 0
                }
                override={inputs.overrides.interestRate}
                onChange={(v) => setOverride('interestRate', v)}
                format="percent"
              />
            </TableRow>
            <TableRow>
              <TableCell className="font-medium text-gray-800">Loan-to-cost</TableCell>
              <OverrideCell
                quickValue={quickLtc(inputs)}
                override={inputs.overrides.loanToCost}
                onChange={(v) => setOverride('loanToCost', v)}
                format="percent"
              />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          Cost buckets
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bucket</TableHead>
              <TableHead className="text-right">Quick (derived)</TableHead>
              <TableHead className="w-32">Your value</TableHead>
              <TableHead className="text-right">Active</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {bucketRows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium text-gray-800">{row.label}</TableCell>
                <OverrideCell
                  quickValue={quick.amounts[row.key]}
                  override={inputs.overrides[row.key]}
                  onChange={(v) => setOverride(row.key, v)}
                />
              </TableRow>
            ))}
            <TableRow className="bg-gray-50">
              <TableCell className="font-semibold text-gray-900">
                Total development cost
              </TableCell>
              <TableCell className="text-right font-mono text-xs tabular-nums text-gray-500">
                {money(quick.totalDevelopmentCost)}
              </TableCell>
              <TableCell />
              <TableCell className="text-right font-mono text-xs font-bold tabular-nums text-gray-900">
                {money(results.totalDevelopmentCost)}
              </TableCell>
              <TableCell />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <p className="text-xs leading-relaxed text-gray-500">
        A pinned cell flips its trust badge to <strong>Yours</strong> and replaces the rate-library
        lookup. Click any number on the results above to see the full trace, including which fields
        are now pinned.
      </p>
    </SectionCard>
  )
}

function quickInterest(inputs: ReturnType<typeof useFeasibilityStore.getState>['inputs']): number {
  // Mirrors the engine's band lookup without importing the whole rate table.
  const bands: Record<string, number> = {
    cash: 0,
    low_leverage: 0.082,
    standard: 0.095,
    high_leverage: 0.115,
  }
  return bands[inputs.financeProfile] ?? 0.095
}

function quickLtc(inputs: ReturnType<typeof useFeasibilityStore.getState>['inputs']): number {
  const bands: Record<string, number> = {
    cash: 0,
    low_leverage: 0.5,
    standard: 0.65,
    high_leverage: 0.75,
  }
  return bands[inputs.financeProfile] ?? 0.65
}

// ---------------------------------------------------------------------------
// Bill of quantities
// ---------------------------------------------------------------------------

export function BoqPanel() {
  const {
    inputs,
    seedBoqFromQuick,
    updateBoqLine,
    addBoqLine,
    removeBoqLine,
  } = useFeasibilityStore()

  const [expanded, setExpanded] = React.useState<Set<TradeKey>>(new Set())
  const boq = inputs.boq
  const total = boqTotal(boq.lines)
  const delta = total - boq.seedTotal

  const toggle = (trade: TradeKey) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(trade)) next.delete(trade)
      else next.add(trade)
      return next
    })

  if (boq.lines.length === 0) {
    return (
      <SectionCard
        title="Construction breakdown"
        blurb="Split the construction figure across nine trade categories so you can drill in, or type a QS estimate line by line."
        icon={<Wrench className="h-4 w-4 text-blue-600" />}
      >
        <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
          <p className="text-sm text-gray-600">
            Nothing here yet. Seeding splits your current construction figure across the standard
            trades — it changes nothing until you edit a cell.
          </p>
          <Button className="mt-4" onClick={seedBoqFromQuick}>
            Seed from the Quick figure
          </Button>
        </div>
      </SectionCard>
    )
  }

  return (
    <SectionCard
      title="Construction breakdown"
      blurb="Trade-level drill-down. Leave every cell untouched and the Quick construction number stays in effect — this panel only takes over once you edit something."
      icon={<Wrench className="h-4 w-4 text-blue-600" />}
      action={
        <Button variant="outline" size="sm" onClick={seedBoqFromQuick}>
          <RotateCcw className="h-3 w-3" />
          Reseed
        </Button>
      }
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Seed (Quick)" value={money(boq.seedTotal)} />
        <StatTile label="Breakdown total" value={money(total)} />
        <StatTile
          label="Difference"
          value={`${delta >= 0 ? '+' : '−'}${money(Math.abs(delta))}`}
          tone={Math.abs(delta) < 1 ? 'neutral' : delta > 0 ? 'negative' : 'positive'}
        />
      </div>

      {!boq.touched ? (
        <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3 text-xs text-blue-900">
          Untouched seed — your Quick construction number is still what drives the model. Edit any
          cell below to make this breakdown take over.
        </div>
      ) : (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3 text-xs text-emerald-900">
          This breakdown is now driving the construction cost, replacing the rate-library figure.
        </div>
      )}

      <div className="space-y-2">
        {TRADE_ORDER.map((trade) => {
          const lines = boq.lines.filter((l) => l.trade === trade)
          const tradeTotal = boqTradeTotal(boq.lines, trade)
          const isOpen = expanded.has(trade)

          return (
            <div key={trade} className="rounded-lg border border-gray-200">
              <button
                type="button"
                onClick={() => toggle(trade)}
                className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left hover:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">{TRADE_LABELS[trade]}</span>
                  <span className="text-xs text-gray-400">
                    {lines.length} {lines.length === 1 ? 'line' : 'lines'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-400">
                    {percent(safeDiv(tradeTotal, total))}
                  </span>
                  <span className="font-mono text-sm font-semibold tabular-nums text-gray-900">
                    {money(tradeTotal)}
                  </span>
                </div>
              </button>

              {isOpen ? (
                <div className="border-t border-gray-100 p-3">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-20 text-right">Qty</TableHead>
                        <TableHead className="w-20">Unit</TableHead>
                        <TableHead className="w-28 text-right">Rate</TableHead>
                        <TableHead className="w-20 text-right">Waste</TableHead>
                        <TableHead className="w-28 text-right">Total</TableHead>
                        <TableHead className="w-8" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell>
                            <Input
                              value={line.label}
                              className="h-8 text-xs"
                              onChange={(e) => updateBoqLine(line.id, { label: e.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={line.qty}
                              className="h-8 text-right font-mono text-xs tabular-nums"
                              onChange={(e) =>
                                updateBoqLine(line.id, { qty: Number(e.target.value) || 0 })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.unit}
                              className="h-8 text-xs"
                              onChange={(e) => updateBoqLine(line.id, { unit: e.target.value })}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={Math.round(line.rate)}
                              className="h-8 text-right font-mono text-xs tabular-nums"
                              onChange={(e) =>
                                updateBoqLine(line.id, { rate: Number(e.target.value) || 0 })
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={Number((line.waste * 100).toFixed(1))}
                              className="h-8 text-right font-mono text-xs tabular-nums"
                              onChange={(e) =>
                                updateBoqLine(line.id, {
                                  waste: (Number(e.target.value) || 0) / 100,
                                })
                              }
                            />
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs font-semibold tabular-nums">
                            {money(boqLineTotal(line))}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-gray-400 hover:text-red-600"
                              onClick={() => removeBoqLine(line.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-2"
                    onClick={() => addBoqLine(trade)}
                  >
                    <PlusCircle className="h-3 w-3" />
                    Add a line
                  </Button>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between rounded-lg bg-gray-900 px-4 py-3">
        <span className="text-sm font-semibold text-white">Construction total</span>
        <span className="font-mono text-lg font-bold tabular-nums text-white">{money(total)}</span>
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Assemblies catalogue
// ---------------------------------------------------------------------------

export function AssembliesPanel() {
  const { inputs, applyAssembly, removeAppliedAssembly, popAssemblyIntoBoq } =
    useFeasibilityStore()

  const [selected, setSelected] = React.useState(ASSEMBLIES[0].key)
  const [qty, setQty] = React.useState(1)
  const assembly = assemblyByKey(selected)

  return (
    <SectionCard
      title="Takeoff & assemblies"
      blurb="Most people cannot quote a $/m² rate, but they can tell you how many bathrooms. Pick an assembly, set the quantity, and drop it into the construction breakdown as editable lines."
      icon={<Layers className="h-4 w-4 text-blue-600" />}
    >
      <p className="rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-3 text-xs text-gray-600">
        Skip this entirely if you do not want to specify beds, baths and slabs. Nothing here is
        required — your Quick construction figure stays in effect until you apply an assembly and
        add it to the breakdown.
      </p>

      <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Catalogue</p>
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ASSEMBLIES.map((a) => (
                <SelectItem key={a.key} value={a.key}>
                  {a.name} — {money(assemblyUnitCost(a))} per {a.driver}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {assembly ? (
            <p className="text-xs leading-relaxed text-gray-500">{assembly.description}</p>
          ) : null}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            How many {assembly?.driver ?? 'units'}?
          </p>
          <Input
            type="number"
            min={0}
            value={qty}
            className="font-mono tabular-nums"
            onChange={(e) => setQty(Math.max(0, Number(e.target.value) || 0))}
          />
          <Button
            className="w-full"
            disabled={qty <= 0}
            onClick={() => applyAssembly(selected, qty)}
          >
            Apply
          </Button>
        </div>
      </div>

      {assembly ? (
        <div className="rounded-lg border border-gray-200">
          <p className="border-b border-gray-100 px-4 py-2 text-xs font-semibold text-gray-500">
            {assembly.name} — {assembly.subItems.length} sub-items, {money(assemblyUnitCost(assembly))} per{' '}
            {assembly.driver}
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead className="text-right">Rate</TableHead>
                <TableHead className="text-right">Waste</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assembly.subItems.map((item) => (
                <TableRow key={item.label}>
                  <TableCell className="text-xs text-gray-700">{item.label}</TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {item.qty}
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">{item.unit}</TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {money(item.rate)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums text-gray-400">
                    {percent(item.waste, 0)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Applied ({inputs.appliedAssemblies.length})
        </p>
        {inputs.appliedAssemblies.length === 0 ? (
          <p className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-xs text-gray-500">
            None applied yet. Pick one above, set the quantity, and click Apply.
          </p>
        ) : (
          <div className="space-y-2">
            {inputs.appliedAssemblies.map((applied) => {
              const a = assemblyByKey(applied.assemblyKey)
              if (!a) return null
              const cost = assemblyUnitCost(a) * applied.driverQty
              return (
                <div
                  key={applied.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {a.name}{' '}
                      <span className="text-gray-400">
                        × {applied.driverQty} {a.driver}
                      </span>
                    </p>
                    <p className="font-mono text-xs tabular-nums text-gray-500">{money(cost)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {applied.poppedIntoBoq ? (
                      <Badge
                        variant="outline"
                        className="border-emerald-300 bg-emerald-50 text-emerald-800"
                      >
                        In the breakdown
                      </Badge>
                    ) : (
                      <Button size="sm" onClick={() => popAssemblyIntoBoq(applied.id)}>
                        Add to breakdown
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-gray-400 hover:text-red-600"
                      onClick={() => removeAppliedAssembly(applied.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-xs leading-relaxed text-gray-500">
        Adding an assembly to the breakdown imports its sub-items as ordinary editable rows. Once
        imported they behave like any other line — applying the same assembly again appends new
        rows rather than updating the old ones.
      </p>
    </SectionCard>
  )
}
