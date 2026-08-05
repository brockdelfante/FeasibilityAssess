'use client'

/**
 * Advanced analysis — scenarios, sensitivity, cashflow, scale and the what-if
 * solver.
 *
 * All of this is collapsed by default. A client wants to know whether the deal
 * works before they are asked to read a sensitivity matrix, and these panels
 * are the expensive ones: the scale grid alone runs 300 full engine passes, so
 * each panel computes only once its accordion section is opened.
 */

import * as React from 'react'
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Activity, GitCompare, Grid3x3, Target, Wallet } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

import {
  describeScenario,
  runScaleRecommendation,
  runScenarios,
  runSensitivity,
  solveAll,
} from '@/lib/feasibility/scenarios'
import { useFeasibilityStore } from '@/lib/feasibility/store'
import { money, moneyCompact, percent, pp } from '@/lib/feasibility/trace'

import { SectionCard, StatTile } from './primitives'

// ---------------------------------------------------------------------------
// Scenarios
// ---------------------------------------------------------------------------

export function ScenarioPanel() {
  const inputs = useFeasibilityStore((s) => s.inputs)
  const targetMargin = inputs.targetMargin
  // Memoised rather than cached in the store: same laziness, no store write
  // during render. `inputs` is replaced wholesale on every edit, so identity
  // comparison is exactly the right invalidation key.
  const scenarios = React.useMemo(() => runScenarios(inputs), [inputs])

  return (
    <SectionCard
      title="Scenarios — how resilient is this deal?"
      blurb="The conservative case stress-tests the deal; the optimistic case gives it tailwinds. Both re-run the whole model, so knock-on effects are included."
      icon={<GitCompare className="h-4 w-4 text-brand-600" />}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {scenarios.map((s) => {
          const meets = s.marginOnCost >= targetMargin
          return (
            <div
              key={s.key}
              className={cn(
                'rounded-xl border p-4',
                s.key === 'base'
                  ? 'border-brand-300 bg-brand-50/50 ring-1 ring-brand-200'
                  : 'border-border bg-background'
              )}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{s.label}</p>
                <Badge
                  variant="outline"
                  className={
                    meets
                      ? 'border-positive-300 bg-positive-50 text-positive-800'
                      : 'border-critical-300 bg-critical-50 text-critical-800'
                  }
                >
                  {meets ? 'Meets target' : 'Below target'}
                </Badge>
              </div>
              <p className="mt-3 font-mono text-2xl font-bold tabular-nums text-foreground">
                {percent(s.marginOnCost)}
              </p>
              <p className="text-xs text-muted-foreground">margin on cost</p>
              {s.deltaVsBasePp !== null ? (
                <p
                  className={cn(
                    'mt-1 text-xs font-medium',
                    s.deltaVsBasePp >= 0 ? 'text-positive-600' : 'text-critical-600'
                  )}
                >
                  {pp(s.deltaVsBasePp)} vs base
                </p>
              ) : null}
              <div className="mt-3 space-y-1 border-t border-border pt-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net profit</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {money(s.netProfit)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total cost</span>
                  <span className="font-mono tabular-nums text-foreground">
                    {money(s.totalDevelopmentCost)}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="space-y-1 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        <p>
          <span className="font-semibold text-foreground">Conservative:</span>{' '}
          {describeScenario('conservative')}
        </p>
        <p>
          <span className="font-semibold text-foreground">Optimistic:</span>{' '}
          {describeScenario('optimistic')}
        </p>
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Sensitivity
// ---------------------------------------------------------------------------

const OUTCOME_CELL: Record<'pass' | 'marginal' | 'fail', string> = {
  pass: 'bg-positive-50 text-positive-800',
  marginal: 'bg-caution-50 text-caution-800',
  fail: 'bg-critical-50 text-critical-800',
}

export function SensitivityPanel() {
  const inputs = useFeasibilityStore((s) => s.inputs)
  const targetMargin = inputs.targetMargin
  const rows = React.useMemo(() => runSensitivity(inputs), [inputs])

  return (
    <SectionCard
      title="Sensitivity — which levers move the needle"
      blurb={`Margin on cost as each input moves, against your ${percent(targetMargin)} target. The steepest row is the one to nail down first.`}
      icon={<Activity className="h-4 w-4 text-brand-600" />}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Lever</TableHead>
              {['−10%', '−5%', 'Base', '+5%', '+10%'].map((h) => (
                <TableHead key={h} className="text-center">
                  {h}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.lever}>
                <TableCell className="font-medium text-foreground">{row.lever}</TableCell>
                {row.cells.map((cell, i) => (
                  <TableCell
                    key={i}
                    className={cn(
                      'text-center font-mono text-sm tabular-nums',
                      OUTCOME_CELL[cell.meets],
                      cell.shift === 0 && 'font-bold ring-1 ring-inset ring-brand-300'
                    )}
                  >
                    {percent(cell.marginOnCost)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs">
        {(
          [
            ['pass', 'Meets target'],
            ['marginal', 'Within 15% of target'],
            ['fail', 'Below target'],
          ] as const
        ).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={cn('h-3 w-3 rounded', OUTCOME_CELL[key])} />
            <span className="text-muted-foreground">{label}</span>
          </span>
        ))}
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        The overrun buffer row shifts in percentage points rather than proportionally, and clamps
        at zero — a negative buffer is meaningless. That is why its two left-hand columns can read
        the same.
      </p>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Cashflow
// ---------------------------------------------------------------------------

export function CashflowPanel() {
  const results = useFeasibilityStore((s) => s.results)
  const [showTable, setShowTable] = React.useState(false)
  const cf = results.cashflow

  const chartData = cf.rows.map((r) => ({
    month: r.month,
    debt: Math.round(r.debtBalance),
    equity: Math.round(r.equityBalance),
  }))

  return (
    <SectionCard
      title="Cashflow & finance"
      blurb="The monthly debt curve, with equity funded first and interest capitalising onto the facility. Peak debt is what gets credit-approved — not an average."
      icon={<Wallet className="h-4 w-4 text-brand-600" />}
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          label="Peak debt"
          value={money(cf.peakDebt)}
          sub={cf.peakDebt > 0 ? `in month ${cf.peakDebtMonth}` : 'Cash funded'}
        />
        <StatTile label="Total interest" value={money(cf.totalInterest)} sub="Capitalised" />
        <StatTile
          label="Equity in / out"
          value={`${moneyCompact(cf.equityIn)} / ${moneyCompact(cf.equityOut)}`}
          sub={cf.equityMultiple ? `${cf.equityMultiple.toFixed(2)}× multiple` : undefined}
        />
        <StatTile
          label="IRR (annualised)"
          value={cf.irr === null ? '—' : percent(cf.irr)}
          sub="On the equity cashflow"
        />
      </div>

      {chartData.length > 0 ? (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="debtFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                label={{ value: 'Month', position: 'insideBottom', offset: -2, fontSize: 11, fill: '#94a3b8' }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => moneyCompact(v)}
                width={64}
              />
              <Tooltip
                formatter={(value, name) => [
                  money(typeof value === 'number' ? value : Number(value)),
                  name === 'debt' ? 'Debt balance' : 'Equity contributed',
                ]}
                labelFormatter={(label) => `Month ${label}`}
                contentStyle={{
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  fontSize: 12,
                }}
              />
              <Area
                type="monotone"
                dataKey="debt"
                stroke="#3b82f6"
                strokeWidth={2}
                fill="url(#debtFill)"
              />
              <Line
                type="monotone"
                dataKey="equity"
                stroke="#10b981"
                strokeWidth={1.5}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : null}

      <div>
        <Button variant="outline" size="sm" onClick={() => setShowTable((v) => !v)}>
          {showTable ? 'Hide' : 'Show'} monthly breakdown ({cf.rows.length} months)
        </Button>
      </div>

      {showTable ? (
        <div className="max-h-96 overflow-auto rounded-lg border border-border">
          <Table>
            <TableHeader className="sticky top-0 bg-muted/40">
              <TableRow>
                <TableHead>Month</TableHead>
                <TableHead className="text-right">Costs</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Equity in</TableHead>
                <TableHead className="text-right">Debt drawn</TableHead>
                <TableHead className="text-right">Interest</TableHead>
                <TableHead className="text-right">Debt balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cf.rows.map((r) => (
                <TableRow key={r.month} className={r.month === cf.peakDebtMonth ? 'bg-brand-50/60' : ''}>
                  <TableCell className="font-medium">{r.month}</TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {money(r.costs)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {r.revenue > 0 ? money(r.revenue) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {r.equityDrawn > 0 ? money(r.equityDrawn) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {r.debtDrawn > 0 ? money(r.debtDrawn) : '—'}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {money(r.interest)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs font-semibold tabular-nums">
                    {money(r.debtBalance)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : null}

      <p className="text-xs leading-relaxed text-muted-foreground">
        Sales are assumed to settle at the end of the program, which is the conservative case. A
        presales schedule that settles earlier would reduce both peak debt and total interest.
      </p>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Scale recommender
// ---------------------------------------------------------------------------

/**
 * How sale price is assumed to respond to dwelling size.
 *
 * Exposed here rather than in the wizard because it only affects this panel, and
 * because a client answering "what would I build here?" should not have to hold
 * an opinion about hedonic price elasticity to get an answer. The default is
 * mid-range for residential; the endpoints are offered because they are the two
 * assumptions other tools make implicitly, and seeing them move the grid is the
 * clearest way to understand what the assumption is doing.
 */
function ElasticityControl() {
  const elasticity = useFeasibilityStore((s) => s.inputs.sizePriceElasticity)
  const setInputs = useFeasibilityStore((s) => s.setInputs)
  const inputs = useFeasibilityStore((s) => s.inputs)

  const options = [
    { value: 0, label: 'Not at all', hint: 'Price is the same at any size' },
    { value: 0.75, label: 'Realistic', hint: 'Bigger costs more, less per m²' },
    { value: 1, label: 'Proportionally', hint: '$/m² identical at every size' },
  ]

  // Show what the assumption implies at the extremes of the grid.
  const priceAt = (sqm: number) =>
    inputs.avgDwellingSqm > 0
      ? inputs.salePricePerDwelling * Math.pow(sqm / inputs.avgDwellingSqm, elasticity)
      : inputs.salePricePerDwelling

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div>
        <p className="text-sm font-medium text-foreground">
          How does sale price respond to dwelling size?
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Part of a dwelling&apos;s value is fixed whatever its area — the land share, the kitchen,
          the bathrooms, the services. So bigger dwellings fetch more in total but less per square
          metre. This only affects the grid below; everywhere else we use the size and price you
          entered.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = Math.abs(elasticity - o.value) < 0.01
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => setInputs({ sizePriceElasticity: o.value })}
              aria-pressed={selected}
              className={cn(
                'rounded-lg border px-3 py-2 text-left transition-all',
                selected
                  ? 'border-brand-500 bg-brand-50/60 ring-1 ring-brand-500'
                  : 'border-border bg-background hover:bg-muted/40'
              )}
            >
              <span
                className={cn(
                  'block text-xs font-semibold',
                  selected ? 'text-brand-900' : 'text-foreground'
                )}
              >
                {o.label}
              </span>
              <span
                className={cn('block text-[11px]', selected ? 'text-brand-700/80' : 'text-muted-foreground')}
              >
                {o.hint}
              </span>
            </button>
          )
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        On this assumption a{' '}
        <span className="font-mono font-semibold text-foreground">100 m²</span> dwelling is priced at{' '}
        <span className="font-mono font-semibold text-foreground">{money(priceAt(100))}</span> and a{' '}
        <span className="font-mono font-semibold text-foreground">380 m²</span> one at{' '}
        <span className="font-mono font-semibold text-foreground">{money(priceAt(380))}</span>, against
        your {inputs.avgDwellingSqm} m² at {money(inputs.salePricePerDwelling)}.
      </p>
    </div>
  )
}

export function ScalePanel() {
  const inputs = useFeasibilityStore((s) => s.inputs)
  // The heaviest analysis in the app — 300 full engine passes. Memoising it here
  // means it runs once per input change, and only while this panel is open.
  const scale = React.useMemo(() => runScaleRecommendation(inputs), [inputs])

  // Pivot the flat grid into rows by dwelling size for the heat map.
  const sizes = Array.from(new Set(scale.grid.map((c) => c.dwellingSqm)))
  const yields = Array.from(new Set(scale.grid.map((c) => c.yield))).sort((a, b) => a - b)
  const cellAt = (size: number, y: number) =>
    scale.grid.find((c) => c.dwellingSqm === size && c.yield === y)

  return (
    <SectionCard
      title="What scale does this site need?"
      blurb="Every combination of yield and dwelling size, run through the full model. Sale price moves with dwelling size, holding your implied price per square metre constant."
      icon={<Grid3x3 className="h-4 w-4 text-brand-600" />}
    >
      <div className="rounded-lg border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          You are proposing{' '}
          <span className="font-semibold">
            {inputs.yield} × {inputs.avgDwellingSqm} m²
          </span>{' '}
          ({(inputs.yield * inputs.avgDwellingSqm).toLocaleString('en-AU')} m² total) →{' '}
          <span className="font-mono font-semibold">
            {percent(scale.current?.marginOnCost ?? 0)}
          </span>{' '}
          margin on cost.
        </p>
        {scale.smallestPassing ? (
          <p className="mt-2">
            The smallest configuration that still hits your {percent(inputs.targetMargin)} target
            is{' '}
            <span className="font-semibold">
              {scale.smallestPassing.yield} × {scale.smallestPassing.dwellingSqm} m²
            </span>{' '}
            (
            {(
              scale.smallestPassing.yield * scale.smallestPassing.dwellingSqm
            ).toLocaleString('en-AU')}{' '}
            m² at{' '}
            <span className="font-mono">{percent(scale.smallestPassing.marginOnCost)}</span>). You
            have{' '}
            <span className="font-mono font-semibold">{percent(Math.abs(scale.headroomPp))}</span>{' '}
            {scale.headroomPp >= 0 ? 'of headroom above' : 'below'} target.
          </p>
        ) : (
          <p className="mt-2 text-caution-700">
            No configuration in the grid reaches your {percent(inputs.targetMargin)} target on
            these inputs. The constraint is more likely the land price or the sale price than the
            scheme size.
          </p>
        )}
      </div>

      <ElasticityControl />

      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0.5 text-[10px]">
          <thead>
            <tr>
              <th className="sticky left-0 bg-background px-2 py-1 text-left font-semibold text-muted-foreground">
                m² ↓ / units →
              </th>
              {yields.map((y) => (
                <th key={y} className="px-1 py-1 text-center font-semibold text-muted-foreground">
                  {y}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizes.map((size) => (
              <tr key={size}>
                <td className="sticky left-0 bg-background px-2 py-1 text-right font-medium text-muted-foreground">
                  {size}
                </td>
                {yields.map((y) => {
                  const cell = cellAt(size, y)
                  if (!cell) return <td key={y} />
                  const isCurrent =
                    size === inputs.avgDwellingSqm && y === inputs.yield
                  const isSmallest =
                    scale.smallestPassing?.dwellingSqm === size &&
                    scale.smallestPassing?.yield === y
                  return (
                    <td
                      key={y}
                      title={`${y} × ${size} m² → ${percent(cell.marginOnCost)} margin on cost (sale price ${money(cell.salePricePerDwelling)})`}
                      className={cn(
                        'px-1 py-1 text-center font-mono tabular-nums',
                        OUTCOME_CELL[cell.outcome],
                        isCurrent && 'ring-2 ring-inset ring-brand-600 font-bold',
                        isSmallest && !isCurrent && 'ring-2 ring-inset ring-positive-600'
                      )}
                    >
                      {(cell.marginOnCost * 100).toFixed(0)}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded ring-2 ring-inset ring-brand-600" />
          <span className="text-muted-foreground">Your current scale</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded ring-2 ring-inset ring-positive-600" />
          <span className="text-muted-foreground">Smallest passing</span>
        </span>
        {(
          [
            ['pass', 'Meets target'],
            ['marginal', 'Close'],
            ['fail', 'Below target'],
          ] as const
        ).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={cn('h-3 w-3 rounded', OUTCOME_CELL[key])} />
            <span className="text-muted-foreground">{label}</span>
          </span>
        ))}
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// What-if solver
// ---------------------------------------------------------------------------

export function SolverPanel() {
  const inputs = useFeasibilityStore((s) => s.inputs)
  const solver = React.useMemo(() => solveAll(inputs, inputs.targetMargin), [inputs])

  const fmt = (value: number, unit: string) => {
    switch (unit) {
      case 'money':
        return money(value)
      case 'rate':
        return `${money(value)}/m²`
      case 'months':
        return `${value.toFixed(0)} months`
      default:
        return value.toFixed(0)
    }
  }

  return (
    <SectionCard
      title="What would have to be true?"
      blurb={`Each row solves one input to hit your ${percent(inputs.targetMargin)} target, holding everything else fixed. Solved against the full model, so knock-on effects are included — a higher land price brings more stamp duty with it.`}
      icon={<Target className="h-4 w-4 text-brand-600" />}
    >
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Input</TableHead>
              <TableHead className="text-right">Now</TableHead>
              <TableHead className="text-right">Needs to be</TableHead>
              <TableHead className="text-right">Change</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {solver.map((s) => {
              const delta = s.solved - s.current
              const pctChange = s.current !== 0 ? delta / s.current : 0
              return (
                <TableRow key={s.target}>
                  <TableCell className="font-medium text-foreground">{s.label}</TableCell>
                  <TableCell className="text-right font-mono text-sm tabular-nums text-muted-foreground">
                    {fmt(s.current, s.unit)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                    {s.unreachable ? '—' : fmt(s.solved, s.unit)}
                  </TableCell>
                  <TableCell className="text-right">
                    {s.unreachable ? (
                      <span className="text-xs text-muted-foreground">
                        Not reachable in a sensible range
                      </span>
                    ) : (
                      <span
                        className={cn(
                          'font-mono text-sm tabular-nums',
                          Math.abs(pctChange) < 0.001
                            ? 'text-muted-foreground'
                            : delta > 0
                              ? 'text-positive-600'
                              : 'text-critical-600'
                        )}
                      >
                        {delta >= 0 ? '+' : '−'}
                        {percent(Math.abs(pctChange))}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </SectionCard>
  )
}
