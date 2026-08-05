'use client'

/**
 * "Can I fund it?" — the stage after the feasibility verdict.
 *
 * Written for the developer assessing their own project, so every line answers
 * a question they would actually ask out loud: how much will a lender give me,
 * how much do I have to find, is there a gap, and what does closing it cost?
 *
 * The second mortgage is the point of the stage. A shortfall stated without a
 * priced way to close it leaves the client exactly where they started, so the
 * gap and its remedy sit next to each other.
 */

import * as React from 'react'
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  HandCoins,
  Landmark,
  Layers,
  TrendingDown,
} from 'lucide-react'

import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

import {
  computeFunding,
  fundingVerdict,
  MEZZ_BROKER_PCT,
  MEZZ_ESTABLISHMENT_PCT,
  MEZZ_LEGALS,
  MEZZ_RATE,
  QUALIFYING_PRESALE_SHARE,
  SENIOR_LVR_CAP,
} from '@/lib/feasibility/funding'
import { useFeasibilityStore } from '@/lib/feasibility/store'
import { money, percent } from '@/lib/feasibility/trace'

import {
  DidYouKnow,
  Field,
  FieldGrid,
  MoneyInput,
  PercentInput,
  SectionCard,
  StatTile,
} from './primitives'

const TONE_STYLES = {
  positive: {
    wrap: 'border-positive-200 bg-positive-50',
    icon: <CheckCircle2 className="h-5 w-5 text-positive-600" />,
  },
  caution: {
    wrap: 'border-caution-200 bg-caution-50',
    icon: <AlertTriangle className="h-5 w-5 text-caution-600" />,
  },
  critical: {
    wrap: 'border-critical-200 bg-critical-50',
    icon: <TrendingDown className="h-5 w-5 text-critical-600" />,
  },
}

export function FundingView() {
  const { inputs, results, setInputs } = useFeasibilityStore()

  // Same memo discipline as the other analysis panels: cheap here, but it keeps
  // the funding figures from being recomputed on every unrelated render.
  const funding = React.useMemo(() => computeFunding(inputs, results), [inputs, results])
  const verdict = React.useMemo(() => fundingVerdict(funding, inputs), [funding, inputs])
  const tone = TONE_STYLES[verdict.tone]

  const isCash = inputs.financeProfile === 'cash'

  return (
    <div className="space-y-6">
      {/* The answer, before any of the arithmetic. */}
      <div className={cn('rounded-2xl border p-6 shadow-sm', tone.wrap)}>
        <div className="flex items-start gap-4">
          {tone.icon}
          <div className="min-w-0">
            <p className="eyebrow">Funding position</p>
            <p className="mt-0.5 text-xl font-bold sm:text-2xl">{verdict.headline}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{verdict.detail}</p>
          </div>
        </div>
      </div>

      <SectionCard
        title="What you have to put in"
        blurb="Tell us your cash, and we will show you whether it covers what the lender will not."
        icon={<HandCoins className="h-4 w-4 text-brand-600" />}
      >
        <FieldGrid>
          <Field
            label="Cash you can put into this project"
            hint="Your own equity — savings, released equity from another property, or a partner's contribution."
          >
            <MoneyInput
              value={inputs.equityAvailable}
              onChange={(equityAvailable) => setInputs({ equityAvailable })}
            />
          </Field>

          <Field
            label="Senior lender's LVR ceiling"
            hint={`How much of the end value a first-mortgage lender will lend against. Leave at zero to use the market norm of ${percent(SENIOR_LVR_CAP, 0)}.`}
          >
            <PercentInput
              value={inputs.seniorLvrCap}
              onChange={(seniorLvrCap) => setInputs({ seniorLvrCap })}
              decimals={1}
            />
          </Field>
        </FieldGrid>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Senior debt available"
            value={money(funding.seniorLimit)}
            sub={
              funding.boundBy === 'none'
                ? 'No debt on a cash-funded project'
                : funding.boundBy === 'value'
                  ? 'Capped by end value, not cost'
                  : 'Capped by total cost, not value'
            }
          />
          <StatTile
            label="Total cost to build"
            value={money(results.totalDevelopmentCost)}
            sub="From your feasibility"
          />
          <StatTile
            label="You need to fund"
            value={money(funding.equityRequired)}
            sub="Everything the lender will not"
          />
          {/* Until the client says what cash they have, there is no gap to
              show — only a requirement. A red "gap" tile measured against an
              unanswered question is just alarming. */}
          {inputs.equityAvailable > 0 ? (
            <StatTile
              label={funding.shortfall > 0 ? 'Gap to close' : 'Surplus cash'}
              value={money(
                funding.shortfall > 0
                  ? funding.shortfall
                  : inputs.equityAvailable - funding.equityRequired
              )}
              tone={funding.shortfall > 0 ? 'negative' : 'positive'}
              sub={
                funding.shortfall > 0 ? 'Beyond the cash you have' : 'Left over after funding it'
              }
            />
          ) : (
            <StatTile
              label="Your cash"
              value="—"
              sub="Enter it above to see if there is a gap"
            />
          )}
        </div>

        {!isCash ? (
          <DidYouKnow title="Two ceilings apply, and the lower one wins" tone="blue">
            <p>
              A first-mortgage lender sizes the facility on the <strong>lower</strong> of a share of
              your end value and a share of your total cost. Here that is{' '}
              <strong>{money(funding.seniorLimitByValue)}</strong> on value against{' '}
              <strong>{money(funding.seniorLimitByCost)}</strong> on cost — so{' '}
              <strong>
                {funding.boundBy === 'value' ? 'end value' : 'total cost'} is what is binding
              </strong>
              .
            </p>
            <p>
              Developers are usually surprised by the cost test. A project can sit comfortably
              inside the value test and still be capped, because the lender wants you to have real
              money at risk alongside theirs.
            </p>
          </DidYouKnow>
        ) : null}
      </SectionCard>

      {/* Presales — what they unlock, not just what they are. */}
      {inputs.presalesShare > 0 ? (
        <SectionCard
          title="What your presales do for you"
          blurb="Lenders count presales towards the facility, but only the ones that qualify."
          icon={<Landmark className="h-4 w-4 text-brand-600" />}
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile
              label="Presales locked in"
              value={money(funding.presaleValue)}
              sub={`${percent(inputs.presalesShare)} of gross realisation`}
            />
            <StatTile
              label="What a lender would count"
              value={money(funding.qualifyingPresaleValue)}
              sub={`About ${percent(QUALIFYING_PRESALE_SHARE, 0)} qualify in practice`}
            />
            <StatTile
              label="Cover of the senior facility"
              value={percent(funding.presaleCoverOfSenior)}
              tone={funding.presaleCoverOfSenior >= 0.8 ? 'positive' : 'warning'}
              sub="Most lenders want 80% or better"
            />
          </div>

          <DidYouKnow title="Not every presale counts" tone="amber">
            <p>
              A contract only qualifies if it is unconditional, at arm&rsquo;s length, to a buyer
              unrelated to you, with the deposit held in trust. Related-party sales and
              conditional contracts are usually excluded outright.
            </p>
            <p>
              That is why the number a lender credits you with is smaller than your sales
              report — and why the gap is worth checking before you rely on it.
            </p>
          </DidYouKnow>
        </SectionCard>
      ) : null}

      {/* The second mortgage. */}
      {!isCash ? (
        <SectionCard
          title="Covering the gap with a second mortgage"
          blurb="Also called mezzanine. It sits behind your first-mortgage lender and fills the equity gap — at a price."
          icon={<Layers className="h-4 w-4 text-brand-600" />}
          action={
            <div className="flex items-center gap-2">
              <Switch
                checked={inputs.mezzEnabled}
                onCheckedChange={(mezzEnabled) => setInputs({ mezzEnabled })}
                aria-label="Price a second mortgage"
              />
              <span className="text-xs text-muted-foreground">
                {inputs.mezzEnabled ? 'On' : 'Off'}
              </span>
            </div>
          }
        >
          {funding.shortfall <= 0 && !inputs.mezzEnabled ? (
            <p className="text-sm text-muted-foreground">
              You do not have a gap on these numbers, so you do not need one. Turn it on if you
              want to see what borrowing more would cost anyway — some developers use it to keep
              cash free for the next site.
            </p>
          ) : null}

          {inputs.mezzEnabled ? (
            <>
              <FieldGrid>
                <Field
                  label="How much do you want to borrow?"
                  hint={
                    funding.shortfall > 0
                      ? `Leave at zero to size it exactly to your ${money(funding.shortfall)} gap.`
                      : 'Leave at zero and we will size it to your gap. You have no gap right now.'
                  }
                >
                  <MoneyInput
                    value={inputs.mezzAmount}
                    onChange={(mezzAmount) => setInputs({ mezzAmount })}
                    placeholder={Math.round(funding.shortfall).toLocaleString('en-AU')}
                  />
                </Field>

                <Field
                  label="Interest rate"
                  hint={`Second mortgages are priced deal by deal — typically ${percent(MEZZ_RATE.low, 0)} to ${percent(MEZZ_RATE.high, 0)}. Leave at zero to use ${percent(MEZZ_RATE.point, 0)}.`}
                >
                  <PercentInput
                    value={inputs.mezzInterestRate}
                    onChange={(mezzInterestRate) => setInputs({ mezzInterestRate })}
                    decimals={1}
                  />
                </Field>
              </FieldGrid>

              {funding.mezzUsed ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <StatTile
                      label="Second mortgage"
                      value={money(funding.mezzAmount)}
                      sub="Sized to your gap"
                    />
                    <StatTile
                      label="What it costs you"
                      value={money(funding.mezzTotalCost)}
                      tone="warning"
                      sub={`${money(funding.mezzInterest)} interest + ${money(funding.mezzFees)} fees`}
                    />
                    <StatTile
                      label="Blended rate"
                      value={percent(funding.blendedRate)}
                      sub="Across both facilities"
                    />
                    <StatTile
                      label="Profit after it is paid"
                      value={money(funding.profitAfterMezz)}
                      tone={funding.profitAfterMezz > 0 ? 'neutral' : 'negative'}
                      sub={`${percent(funding.marginAfterMezz)} margin on cost`}
                    />
                  </div>

                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <p className="eyebrow">How the cost is built</p>
                    <div className="mt-2 divide-y divide-border text-sm">
                      {[
                        {
                          label: 'Interest',
                          detail: `${percent(inputs.mezzInterestRate || MEZZ_RATE.point)} on ${money(funding.mezzAmount)}, charged over about half the program — mezzanine is drawn late and repaid on settlement`,
                          value: funding.mezzInterest,
                        },
                        {
                          label: 'Establishment fee',
                          detail: `${percent(MEZZ_ESTABLISHMENT_PCT, 0)} of the amount drawn`,
                          value: funding.mezzAmount * MEZZ_ESTABLISHMENT_PCT,
                        },
                        {
                          label: 'Broker / placement fee',
                          detail: `${percent(MEZZ_BROKER_PCT, 0)} of the amount drawn`,
                          value: funding.mezzAmount * MEZZ_BROKER_PCT,
                        },
                        {
                          label: 'Legals',
                          detail: 'Second-mortgage documentation and the deed of priority',
                          value: MEZZ_LEGALS,
                        },
                      ].map((row) => (
                        <div
                          key={row.label}
                          className="flex items-start justify-between gap-4 py-2"
                        >
                          <div className="min-w-0">
                            <p className="font-medium">{row.label}</p>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {row.detail}
                            </p>
                          </div>
                          <span className="figure shrink-0 text-sm">{money(row.value)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between gap-4 py-2 font-semibold">
                        <span>Total cost of the second mortgage</span>
                        <span className="figure">{money(funding.mezzTotalCost)}</span>
                      </div>
                    </div>
                  </div>

                  <DidYouKnow
                    title={`This money costs ${percent(funding.mezzCostShareOfProfit)} of your profit`}
                    tone={funding.mezzCostShareOfProfit > 0.25 ? 'amber' : 'blue'}
                  >
                    <p>
                      Mezzanine is the most expensive money in a development, and it is the last to
                      be repaid. That is the trade: it lets a project proceed that otherwise could
                      not, and you pay for the privilege out of the profit.
                    </p>
                    {funding.mezzCostShareOfProfit > 0.25 ? (
                      <p>
                        A quarter of your profit is a lot to give up. Before you commit, look at
                        what a smaller scheme, a lower land price or a bigger equity contribution
                        would do — the solver on the feasibility step will tell you exactly how
                        much has to move.
                      </p>
                    ) : null}
                  </DidYouKnow>
                </>
              ) : null}

              {funding.stillShort ? (
                <div className="rounded-xl border border-critical-200 bg-critical-50 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold text-critical-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Still {money(funding.cashStillRequired)} short
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-critical-800">
                    Even with the second mortgage you have capped, this project does not fund. Raise
                    the amount, bring in more equity, or change the scheme.
                  </p>
                </div>
              ) : null}
            </>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard
        title="Your whole funding stack"
        blurb="Every dollar going into this project, and where it comes from."
        icon={<Banknote className="h-4 w-4 text-brand-600" />}
      >
        <div className="divide-y divide-border">
          {[
            {
              label: 'Senior debt (first mortgage)',
              value: Math.min(funding.seniorLimit, funding.peakFundingNeed),
              note: 'Drawn progressively as you build',
            },
            ...(funding.mezzUsed
              ? [
                  {
                    label: 'Second mortgage (mezzanine)',
                    value: funding.mezzAmount,
                    note: 'Sits behind the senior lender, repaid last',
                  },
                ]
              : []),
            {
              label: 'Your cash',
              value: Math.max(0, funding.equityRequired - funding.mezzAmount),
              note: 'Goes in first, comes out last',
            },
          ].map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{row.label}</p>
                <p className="text-xs text-muted-foreground">{row.note}</p>
              </div>
              <span className="figure shrink-0">{money(row.value)}</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 py-3 font-semibold">
            <span className="text-sm">Total cost to deliver</span>
            <span className="figure">{money(results.totalDevelopmentCost)}</span>
          </div>
        </div>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Indicative only. Real facility terms depend on the lender, your track record, the
          presale book and the security offered — take this to a broker or a lender before you
          rely on it.
        </p>
      </SectionCard>
    </div>
  )
}
