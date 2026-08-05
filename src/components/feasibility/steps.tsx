'use client'

/**
 * The four input steps.
 *
 * Each step asks one coherent group of questions and nothing else. Fields that
 * do not apply to the client's chosen goal are not shown at all — an
 * owner-occupier is never asked about agent commission, and a renovation is
 * never asked for a purchase price.
 */

import {
  Banknote,
  Building2,
  CalendarClock,
  Compass,
  HardHat,
  Landmark,
  MapPin,
  Ruler,
  Target,
  TrendingUp,
} from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { effectiveRegion, locationFactor } from '@/lib/feasibility/engine'
import { profileFor } from '@/lib/feasibility/jurisdictions'
import {
  BUILDER_CONTRACTS,
  costRegionsFor,
  DEAL_MODES,
  DEV_TYPES,
  DUTY_REGIMES,
  FINANCE_PROFILES,
  JURISDICTIONS,
  LIVE_JURISDICTIONS,
  NCC_CLASSES,
  PPR_SUB_MODES,
  PROJECT_STAGES,
  QUALITY_TIERS,
  SITE_DIFFICULTIES,
  TITLE_TYPES,
} from '@/lib/feasibility/labels'
import {
  COUNCIL_RATES_PER_YEAR,
  constructionRate,
  DEFAULT_EXIT_CAP_RATE,
  FINANCE_BANDS,
} from '@/lib/feasibility/rates'
import {
  dutyRegimeFor,
  landTaxAmount,
  premiumDutyThreshold,
  stampDutyAmount,
} from '@/lib/feasibility/statutory'
import { useFeasibilityStore } from '@/lib/feasibility/store'
import { money, percent, ratePerSqm } from '@/lib/feasibility/trace'
import type { DutyRegime, Jurisdiction } from '@/lib/feasibility/types'

import {
  ChoiceCards,
  DidYouKnow,
  Field,
  FieldGrid,
  MoneyInput,
  NumberInput,
  PercentInput,
  PercentSlider,
  SectionCard,
  Segmented,
} from './primitives'

// ---------------------------------------------------------------------------
// Step 1 — the client's goal
// ---------------------------------------------------------------------------

export function StepIntent() {
  const { inputs, setInputs } = useFeasibilityStore()

  const unavailable = JURISDICTIONS.map((j) => j.value).filter(
    (v) => !LIVE_JURISDICTIONS.includes(v)
  )
  const regions = costRegionsFor(inputs.jurisdiction)
  const region = effectiveRegion(inputs)
  const profile = profileFor(inputs.jurisdiction)

  return (
    <div className="space-y-6">
      <SectionCard
        title="What are you doing with this property?"
        blurb="This decides which questions we ask and how we judge the result. You can change it at any time."
        icon={<Compass className="h-4 w-4 text-blue-600" />}
      >
        <ChoiceCards
          options={DEAL_MODES}
          value={inputs.mode}
          onChange={(mode) => setInputs({ mode })}
          columns={2}
        />

        {inputs.mode === 'ppr' ? (
          <Field
            label="Which of these describes it?"
            hint="A rebuild on land you already own skips acquisition stamp duty entirely — usually the single largest one-off cost."
          >
            <ChoiceCards
              options={PPR_SUB_MODES}
              value={inputs.pprSubMode}
              onChange={(pprSubMode) => setInputs({ pprSubMode })}
              columns={3}
            />
          </Field>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Where is it?"
        blurb="Rates, duty and land tax are all state-specific, so the jurisdiction matters."
        icon={<MapPin className="h-4 w-4 text-blue-600" />}
      >
        <FieldGrid>
          <Field
            label="State or territory"
            hint="Duty, land tax and builder warranty are all state law, and the differences are large — the same $2M site is tens of thousands apart between states."
          >
            <Select
              value={inputs.jurisdiction}
              onValueChange={(v) =>
                // Regions are per-jurisdiction, so clear the old one rather than
                // carry a Victorian region into a Queensland project.
                setInputs({ jurisdiction: v as Jurisdiction, costRegion: '' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JURISDICTIONS.map((j) => (
                  <SelectItem
                    key={j.value}
                    value={j.value}
                    disabled={unavailable.includes(j.value)}
                  >
                    {j.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Where in the state?"
            hint="Build rates are calibrated to Sydney metro. This applies the local cost factor."
          >
            <Select value={region} onValueChange={(costRegion) => setInputs({ costRegion })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </FieldGrid>

        <FieldGrid>
          <Field label="Project name" hint="Optional — just so you can tell reports apart.">
            <Input
              placeholder="e.g. Ashfield townhouses"
              value={inputs.projectName}
              onChange={(e) => setInputs({ projectName: e.target.value })}
            />
          </Field>

          <Field
            label="Suburb or address"
            hint="Used on your report. Contributions and build rates vary by council, so note the suburb even if you do not have an address yet."
          >
            <Input
              placeholder="e.g. Ashfield NSW 2131"
              value={inputs.suburbOrAddress}
              onChange={(e) => setInputs({ suburbOrAddress: e.target.value })}
            />
          </Field>
        </FieldGrid>

        <DidYouKnow title={`What we load for ${profile.name}`} tone="blue">
          {profile.name} duty and land tax are loaded for{' '}
          <strong>{profile.taxYear}</strong>, verified against{' '}
          {profile.code === 'NSW' ? 'Revenue NSW' : "the revenue office's"} own published schedule.
          {locationFactor(inputs) !== 1
            ? ` Build rates here run about ${Math.abs(Math.round((locationFactor(inputs) - 1) * 100))}% ${locationFactor(inputs) > 1 ? 'above' : 'below'} Sydney metro.`
            : ''}
        </DidYouKnow>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 2 — the site and the scheme
// ---------------------------------------------------------------------------

export function StepSite() {
  const { inputs, setInputs } = useFeasibilityStore()

  const isPpr = inputs.mode === 'ppr'
  const isReno = inputs.mode === 'renovate'
  const isHold = inputs.mode === 'develop_to_hold' || inputs.mode === 'buy_to_hold'
  const buysLand = !(isPpr && inputs.pprSubMode === 'knock_down_rebuild') && !isReno
  const unitWord = inputs.devType === 'subdivision' ? 'lots' : 'dwellings'

  const regime = dutyRegimeFor(inputs.devType, inputs.dutyRegimeOverride)
  const duty = buysLand ? stampDutyAmount(inputs.jurisdiction, inputs.purchasePrice, regime) : 0
  const premiumThreshold = premiumDutyThreshold(inputs.jurisdiction)

  return (
    <div className="space-y-6">
      {!isPpr && !isReno ? (
        <SectionCard
          title="What would you build?"
          blurb="Everything else is assumed from our rate library — you can drill into any of it later."
          icon={<Building2 className="h-4 w-4 text-blue-600" />}
        >
          <Field label="Development type">
            <Select
              value={inputs.devType}
              onValueChange={(v) => setInputs({ devType: v as typeof inputs.devType })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DEV_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <FieldGrid>
            <Field
              label={`How many ${unitWord}?`}
              hint="Your proposed yield. We will also show you what yield the site would need to hit your target."
            >
              <NumberInput
                value={inputs.yield}
                onChange={(v) => setInputs({ yield: Math.max(1, Math.round(v)) })}
                min={1}
                max={200}
                suffix={unitWord}
              />
            </Field>

            {inputs.devType !== 'subdivision' ? (
              <Field
                label="Average size of each one"
                hint="Gross floor area per dwelling. If you are unsure, a townhouse is typically 180–250 m² and an apartment 70–120 m²."
              >
                <NumberInput
                  value={inputs.avgDwellingSqm}
                  onChange={(v) => setInputs({ avgDwellingSqm: v })}
                  min={0}
                  max={2000}
                  suffix="m²"
                />
              </Field>
            ) : null}
          </FieldGrid>

          {inputs.devType !== 'subdivision' ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-3 text-xs text-gray-600">
              That is{' '}
              <span className="font-mono font-semibold text-gray-900">
                {(inputs.yield * inputs.avgDwellingSqm).toLocaleString('en-AU')} m²
              </span>{' '}
              of gross floor area in total.
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard
        title={isReno ? 'The property' : 'The site'}
        blurb={
          isReno
            ? 'What the home is worth now, and what the work would make it worth.'
            : 'What you are paying, and what the land gives you to work with.'
        }
        icon={<Ruler className="h-4 w-4 text-blue-600" />}
      >
        <FieldGrid>
          {buysLand ? (
            <Field
              label="Purchase price"
              hint={
                duty > 0
                  ? `${inputs.jurisdiction} transfer duty on this would be ${money(duty)}${inputs.purchasePrice > premiumThreshold ? ' — above the premium property threshold' : ''}.`
                  : regime === 'commercial' && inputs.purchasePrice > 0
                    ? `No ${inputs.jurisdiction} conveyance duty is payable on non-residential land at this price.`
                    : 'What you would pay for the land or property.'
              }
            >
              <MoneyInput
                value={inputs.purchasePrice}
                onChange={(purchasePrice) => setInputs({ purchasePrice })}
              />
            </Field>
          ) : null}

          {!isReno ? (
            <Field label="Site area" hint="The land parcel size, from the title or the listing.">
              <NumberInput
                value={inputs.siteAreaSqm}
                onChange={(siteAreaSqm) => setInputs({ siteAreaSqm })}
                suffix="m²"
                max={100000}
              />
            </Field>
          ) : null}
        </FieldGrid>

        {/* --- develop to sell --- */}
        {inputs.mode === 'develop_to_sell' ? (
          <Field
            label={`Expected sale price per ${inputs.devType === 'subdivision' ? 'lot' : 'dwelling'}`}
            hint="Use recent comparable settlements, not asking prices. This is the single biggest driver of the result."
          >
            <MoneyInput
              value={inputs.salePricePerDwelling}
              onChange={(salePricePerDwelling) => setInputs({ salePricePerDwelling })}
            />
          </Field>
        ) : null}

        {/* --- holding --- */}
        {isHold ? (
          <FieldGrid>
            <Field
              label="Expected rent per dwelling"
              hint="Gross weekly rent. We deduct 25% for management, vacancy, repairs and insurance."
            >
              <MoneyInput
                value={inputs.weeklyRentPerDwelling}
                onChange={(weeklyRentPerDwelling) => setInputs({ weeklyRentPerDwelling })}
              />
            </Field>
            <Field
              label="Capitalisation rate on completion"
              hint={`What the market pays for this income. Metro residential sits around ${percent(DEFAULT_EXIT_CAP_RATE)}. A lower cap rate means a higher value.`}
            >
              <PercentInput
                value={inputs.exitCapRate}
                onChange={(exitCapRate) => setInputs({ exitCapRate })}
              />
            </Field>
          </FieldGrid>
        ) : null}

        {/* --- owner occupier --- */}
        {isPpr ? (
          <>
            <FieldGrid>
              {inputs.pprSubMode === 'knock_down_rebuild' ? (
                <Field
                  label="What is your current home worth?"
                  hint="We use this to work out your releasable equity, and the duty you avoid by rebuilding rather than buying elsewhere."
                >
                  <MoneyInput
                    value={inputs.currentHomeValue}
                    onChange={(currentHomeValue) => setInputs({ currentHomeValue })}
                  />
                </Field>
              ) : null}
              <Field
                label="How much do you still owe?"
                hint="Your outstanding mortgage balance. This rolls into the new loan."
              >
                <MoneyInput
                  value={inputs.outstandingMortgage}
                  onChange={(outstandingMortgage) => setInputs({ outstandingMortgage })}
                />
              </Field>
            </FieldGrid>

            <FieldGrid>
              <Field
                label="Size of the home you would build"
                hint="Gross floor area of the finished house."
              >
                <NumberInput
                  value={inputs.avgDwellingSqm}
                  onChange={(avgDwellingSqm) => setInputs({ avgDwellingSqm })}
                  suffix="m²"
                  max={2000}
                />
              </Field>
              <Field
                label="What would the finished home be worth?"
                hint="Leave this at zero and we will estimate it as your land value plus the build cost."
              >
                <MoneyInput
                  value={inputs.postRenoValue}
                  onChange={(postRenoValue) => setInputs({ postRenoValue })}
                />
              </Field>
            </FieldGrid>

            <FieldGrid>
              <Field
                label="Household income before tax"
                hint="Combined annual income. Used for the serviceability and debt-to-income tests."
              >
                <MoneyInput
                  value={inputs.householdIncome}
                  onChange={(householdIncome) => setInputs({ householdIncome })}
                />
              </Field>
              <Field
                label="Other debts"
                hint="Car loans, personal loans, credit card limits, investment property debt."
              >
                <MoneyInput
                  value={inputs.existingOtherDebt}
                  onChange={(existingOtherDebt) => setInputs({ existingOtherDebt })}
                />
              </Field>
            </FieldGrid>
          </>
        ) : null}

        {/* --- renovation --- */}
        {isReno ? (
          <>
            <FieldGrid>
              <Field
                label="What is the property worth now?"
                hint="Before any work. Use recent comparable settlements."
              >
                <MoneyInput
                  value={inputs.preRenoValue}
                  onChange={(preRenoValue) => setInputs({ preRenoValue })}
                />
              </Field>
              <Field
                label="What would it be worth after?"
                hint="The finished value with the extra bedrooms, bathrooms or living space."
              >
                <MoneyInput
                  value={inputs.postRenoValue}
                  onChange={(postRenoValue) => setInputs({ postRenoValue })}
                />
              </Field>
            </FieldGrid>

            <FieldGrid>
              <Field
                label="How much area are you renovating or adding?"
                hint="Floor area affected by the work, not the whole house."
              >
                <NumberInput
                  value={inputs.renovationScopeSqm}
                  onChange={(renovationScopeSqm) => setInputs({ renovationScopeSqm })}
                  suffix="m²"
                  max={2000}
                />
              </Field>
              <Field
                label="Suburb median for the finished configuration"
                hint="The median sale price for that bed and bath count in this suburb. This acts as your value ceiling."
              >
                <MoneyInput
                  value={inputs.suburbMedianForConfig}
                  onChange={(suburbMedianForConfig) => setInputs({ suburbMedianForConfig })}
                />
              </Field>
            </FieldGrid>

            <DidYouKnow title="Why the suburb median matters" tone="blue">
              <p>
                Buyers anchor hard to comparable sales. Pushing a finished property materially
                above the suburb median for its configuration is risky money — the last dollars
                you spend are the least likely to come back.
              </p>
            </DidYouKnow>
          </>
        ) : null}
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 3 — quality, difficulty and funding
// ---------------------------------------------------------------------------

export function StepQuality() {
  const { inputs, setInputs } = useFeasibilityStore()
  const rate = constructionRate(inputs.devType, inputs.qualityTier, inputs.siteDifficulty)
  const band = FINANCE_BANDS[inputs.financeProfile]

  return (
    <div className="space-y-6">
      <SectionCard
        title="How well is it finished?"
        blurb="This picks your build rate out of the library. It is the largest single line in the model, so it is worth getting roughly right."
        icon={<HardHat className="h-4 w-4 text-blue-600" />}
      >
        <ChoiceCards
          options={QUALITY_TIERS}
          value={inputs.qualityTier}
          onChange={(qualityTier) => setInputs({ qualityTier })}
          columns={3}
        />

        <div className="rounded-lg border border-blue-200 bg-blue-50/60 px-4 py-3">
          <p className="text-xs text-blue-900">
            At this quality and site difficulty we assume{' '}
            <span className="font-mono font-semibold">{ratePerSqm(rate.point)}</span> of gross
            floor area, within a plausible range of{' '}
            <span className="font-mono font-semibold">{ratePerSqm(rate.low)}</span> to{' '}
            <span className="font-mono font-semibold">{ratePerSqm(rate.high)}</span>.
          </p>
          <p className="mt-1 text-[11px] text-blue-700/80">
            These are contract-value rates — on a fixed-price contract the builder’s margin is
            already inside them.
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="How hard is the site?"
        blurb="Slope, rock, access and tree protection all move the build rate."
        icon={<Compass className="h-4 w-4 text-blue-600" />}
      >
        <ChoiceCards
          options={SITE_DIFFICULTIES}
          value={inputs.siteDifficulty}
          onChange={(siteDifficulty) => setInputs({ siteDifficulty })}
          columns={2}
        />
      </SectionCard>

      <SectionCard
        title="How is it funded?"
        blurb="Leverage drives your interest cost, your equity requirement and your return on equity."
        icon={<Banknote className="h-4 w-4 text-blue-600" />}
      >
        <ChoiceCards
          options={FINANCE_PROFILES}
          value={inputs.financeProfile}
          onChange={(financeProfile) => setInputs({ financeProfile })}
          columns={2}
        />

        {inputs.financeProfile !== 'cash' ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-3 text-xs text-gray-600">
            We assume an indicative{' '}
            <span className="font-mono font-semibold text-gray-900">
              {percent(band.interestRate)}
            </span>{' '}
            interest rate at{' '}
            <span className="font-mono font-semibold text-gray-900">
              {percent(band.loanToCost, 0)}
            </span>{' '}
            loan-to-cost. Replace both with a real lender quote in Pro Mode before you rely on
            them.
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="How far along is the design?"
        blurb="This sets your contingency. Earlier stages carry more, because more is still unknown."
        icon={<TrendingUp className="h-4 w-4 text-blue-600" />}
      >
        <ChoiceCards
          options={PROJECT_STAGES}
          value={inputs.projectStage}
          onChange={(projectStage) => setInputs({ projectStage })}
          columns={2}
        />

        <Field
          label="Overrun buffer"
          hint="Separate from contingency. Contingency covers unknowns you have not priced; the overrun buffer covers things you HAVE priced that slip anyway — weather, scope creep, late deliveries, prices moving between estimate and order."
        >
          <PercentSlider
            value={inputs.overrunBuffer}
            onChange={(overrunBuffer) => setInputs({ overrunBuffer })}
            min={0}
            max={0.25}
            step={0.005}
            marks={[
              { at: 0, label: '0% optimistic' },
              { at: 0.05, label: '5% baseline' },
              { at: 0.25, label: '25% stress test' },
            ]}
          />
        </Field>
      </SectionCard>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Step 4 — tax, timing and the target
// ---------------------------------------------------------------------------

export function StepMoney() {
  const { inputs, setInputs } = useFeasibilityStore()

  const isPpr = inputs.mode === 'ppr'
  const isReno = inputs.mode === 'renovate'
  const sells = inputs.mode === 'develop_to_sell'
  const landValue = inputs.landValueUv ?? inputs.purchasePrice
  const landTax = landTaxAmount(inputs.jurisdiction, landValue, inputs.landTaxExempt)
  const profile = profileFor(inputs.jurisdiction)
  const buysLand = !(isPpr && inputs.pprSubMode === 'knock_down_rebuild') && !isReno

  // Only worth asking where the answer changes the duty. In SA it is the whole
  // line, in the ACT it is a different scale, and in NSW it decides whether the
  // premium tier applies at all.
  const regimeMatters =
    buysLand &&
    (profile.commercialDutyTreatment !== 'same' || profile.duty.residentialPremium !== null)

  return (
    <div className="space-y-6">
      {!isPpr && !isReno ? (
        <SectionCard
          title="Builder and agent"
          blurb="How the building contract is structured, and who else takes a cut."
          icon={<HardHat className="h-4 w-4 text-blue-600" />}
        >
          <Field
            label="Building contract"
            hint="On a fixed-price contract the builder's margin sits inside the $/m² rate. On cost-plus it is added as a separate 18% line."
          >
            <ChoiceCards
              options={BUILDER_CONTRACTS}
              value={inputs.builderContract}
              onChange={(builderContract) => setInputs({ builderContract })}
              columns={2}
            />
          </Field>

          <Field
            label="Buyer's agent"
            hint="If engaged, we add 2% of the purchase price, within the usual $15,000–$40,000 band."
          >
            <div className="flex items-center gap-3">
              <Switch
                checked={inputs.buyersAgentEngaged}
                onCheckedChange={(buyersAgentEngaged) => setInputs({ buyersAgentEngaged })}
              />
              <span className="text-sm text-gray-600">
                {inputs.buyersAgentEngaged ? 'Engaged' : 'Not engaged'}
              </span>
            </div>
          </Field>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Land tax, rates and GST"
        blurb="The lines that get left out of most back-of-the-envelope numbers."
        icon={<Landmark className="h-4 w-4 text-blue-600" />}
      >
        <DidYouKnow
          title={`${inputs.jurisdiction} land tax — most people do not know this applies to a site sitting idle`}
        >
          <p>
            Land tax is charged on your site’s <strong>unimproved land value</strong> once it
            passes <strong>{money(profile.landTax.threshold)}</strong> in {inputs.jurisdiction},
            and it runs every year you hold the land — <strong>including while you wait on a
            DA</strong>. On a $3M site that is{' '}
            <strong>
              {money(landTaxAmount(inputs.jurisdiction, 3_000_000, false))} a year
            </strong>{' '}
            here.
          </p>
          <p>
            It is assessed on <strong>every parcel you own in the state added together</strong>,
            not site by site, so a new site pushes the rest of your portfolio further up the
            scale. The figure we show is for this site on its own.
          </p>
          <p>
            Exemptions: your principal place of residence, active primary production, and certain
            charities.
          </p>
        </DidYouKnow>

        {regimeMatters ? (
          <Field
            label="Is this residential or commercial land?"
            hint={profile.commercialDutyNote}
          >
            <Segmented
              options={DUTY_REGIMES.map((o) => ({ value: o.value, label: o.label }))}
              value={inputs.dutyRegimeOverride ?? 'auto'}
              onChange={(v) =>
                setInputs({ dutyRegimeOverride: v === 'auto' ? null : (v as DutyRegime) })
              }
            />
          </Field>
        ) : null}

        <FieldGrid>
          <Field
            label="Unimproved land value"
            hint="The council's UV figure, which is what land tax is assessed on. Leave at zero to use the purchase price as a proxy."
          >
            <MoneyInput
              value={inputs.landValueUv ?? 0}
              onChange={(v) => setInputs({ landValueUv: v > 0 ? v : null })}
              placeholder={inputs.purchasePrice ? inputs.purchasePrice.toLocaleString('en-AU') : ''}
            />
          </Field>

          <Field
            label="Land tax exempt?"
            hint="Principal place of residence, primary production, or an exempt charity."
          >
            <div className="flex items-center gap-3">
              <Switch
                checked={inputs.landTaxExempt}
                onCheckedChange={(landTaxExempt) => setInputs({ landTaxExempt })}
              />
              <span className="text-sm text-gray-600">
                {inputs.landTaxExempt ? 'Exempt' : 'Standard — land tax applies'}
              </span>
            </div>
          </Field>
        </FieldGrid>

        <div
          className={
            landTax > 0
              ? 'rounded-lg border border-amber-200 bg-amber-50/70 px-4 py-3 text-xs text-amber-900'
              : 'rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-3 text-xs text-gray-600'
          }
        >
          {landTax > 0 ? (
            <>
              Land tax on this site works out to{' '}
              <span className="font-mono font-semibold">{money(landTax)}</span> a year while you
              hold it.
            </>
          ) : (
            <>No land tax applies on these inputs.</>
          )}
        </div>

        <FieldGrid>
          <Field
            label="Council rates"
            hint={`Per year. Australian councils typically run ${money(COUNCIL_RATES_PER_YEAR.low)}–${money(COUNCIL_RATES_PER_YEAR.high)}, varying by suburb.`}
          >
            <MoneyInput
              value={inputs.councilRatesPerYear}
              onChange={(councilRatesPerYear) => setInputs({ councilRatesPerYear })}
            />
          </Field>

          {sells ? (
            <Field
              label="GST treatment"
              hint="The margin scheme charges GST on one eleventh of the margin between sale price and acquisition cost, rather than on the full sale price. It is standard for residential development, but eligibility depends on how the land was acquired."
            >
              <Segmented
                options={[
                  { value: 'margin_scheme', label: 'Margin scheme' },
                  { value: 'none', label: 'No GST' },
                ]}
                value={inputs.gstTreatment}
                onChange={(gstTreatment) => setInputs({ gstTreatment })}
              />
            </Field>
          ) : null}
        </FieldGrid>
      </SectionCard>

      {!isPpr && !isReno && inputs.devType !== 'subdivision' ? (
        <SectionCard
          title="Building classification"
          blurb={
            profile.practitioners
              ? `Class 1a versus Class 2 decides whether the ${inputs.jurisdiction} ${profile.practitioners.name} applies. It is worth ${money(profile.practitioners.costRange.low)}–${money(profile.practitioners.costRange.high)} and several months of program.`
              : 'Class 1a versus Class 2 changes what your builder has to certify, and how the building is insured.'
          }
          icon={<Building2 className="h-4 w-4 text-blue-600" />}
        >
          <DidYouKnow title="Why title type changes your cost" tone="blue">
            <p>
              <strong>Class 1a</strong> is a single dwelling on its own title — a Torrens-titled
              duplex, for instance. <strong>Class 2</strong> is two or more units sharing a
              building, which covers almost every strata-titled duplex, townhouse and apartment.
            </p>
            {profile.practitioners ? (
              <p>
                In {inputs.jurisdiction}, Class 2 triggers the{' '}
                <strong>{profile.practitioners.name}</strong>: your builder must be registered,
                every regulated design needs a registered practitioner’s compliance declaration,
                and a Principal Design Practitioner coordinates the package.
              </p>
            ) : (
              <p>
                {inputs.jurisdiction} has no registered-practitioner regime of the kind NSW runs,
                so we do not add a compliance uplift here — but Class 2 still changes your
                warranty insurance and certification path. Check the local rules before you
                contract.
              </p>
            )}
          </DidYouKnow>

          <FieldGrid>
            <Field label="Title type" hint="This is what drives Class 1a versus Class 2.">
              <Select
                value={inputs.titleType}
                onValueChange={(v) => setInputs({ titleType: v as typeof inputs.titleType })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TITLE_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                      {t.hint ? ` — ${t.hint}` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Override the class"
              hint="Leave on auto unless you have had the classification confirmed."
            >
              <Select
                value={inputs.nccClassOverride ?? 'auto'}
                onValueChange={(v) =>
                  setInputs({
                    nccClassOverride: v === 'auto' ? null : (v as typeof inputs.nccClassOverride),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto-classify</SelectItem>
                  {NCC_CLASSES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </FieldGrid>
        </SectionCard>
      ) : null}

      <SectionCard
        title="Timing and your target"
        blurb="How long you will hold the site, and what return makes this worth doing."
        icon={<CalendarClock className="h-4 w-4 text-blue-600" />}
      >
        <FieldGrid>
          <Field
            label="Total project duration"
            hint="From settlement to the last sale settling. Include design and approval time — a DA alone often takes six months or more. Every extra month costs interest and land tax."
          >
            <NumberInput
              value={inputs.durationMonths}
              onChange={(durationMonths) => setInputs({ durationMonths })}
              min={1}
              max={120}
              suffix="months"
            />
          </Field>

          <Field
            label="Target margin on cost"
            hint="Profit as a share of total development cost. Most developers look for 18–25% to compensate for the risk; lenders often want at least 20%."
          >
            <div className="pt-1">
              <PercentSlider
                value={inputs.targetMargin}
                onChange={(targetMargin) => setInputs({ targetMargin })}
                min={0}
                max={0.5}
                step={0.005}
                marks={[
                  { at: 0, label: '0%' },
                  { at: 0.2, label: '20% typical' },
                  { at: 0.5, label: '50%' },
                ]}
              />
            </div>
          </Field>
        </FieldGrid>

        {sells ? (
          <>
            <FieldGrid>
              <Field
                label="Presales locked in"
                hint="Share of your gross realisation already under unconditional contract. Lenders typically want 50–70% before they will fund, and presales that settle early repay debt sooner — which cuts both peak debt and total interest."
              >
                <PercentSlider
                  value={inputs.presalesShare}
                  onChange={(presalesShare) => setInputs({ presalesShare })}
                  min={0}
                  max={1}
                  step={0.05}
                  marks={[
                    { at: 0, label: 'None' },
                    { at: 0.6, label: '60% typical' },
                    { at: 1, label: 'All' },
                  ]}
                />
              </Field>

              <Field
                label="When do those presales settle?"
                hint="Leave at zero and we assume everything settles at the very end, which is the conservative case. Set an earlier month to model staged settlements."
              >
                <NumberInput
                  value={inputs.presalesSettleMonth}
                  onChange={(presalesSettleMonth) => setInputs({ presalesSettleMonth })}
                  min={0}
                  max={inputs.durationMonths}
                  suffix="month"
                />
              </Field>
            </FieldGrid>

            {inputs.presalesShare > 0 &&
            (inputs.presalesSettleMonth === 0 ||
              inputs.presalesSettleMonth >= inputs.durationMonths) ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-3 text-xs text-gray-600">
                Your presales are set to settle at the end of the program, so they do not reduce
                peak debt. Set an earlier settlement month to see the benefit.
              </div>
            ) : null}
          </>
        ) : null}

        {!sells ? (
          <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-3 text-xs text-gray-600">
            <Target className="mr-1.5 inline h-3 w-3" />
            You are not selling on completion, so your target margin is used as a cost-versus-value
            check. The verdict for this goal comes from its own metrics — serviceability, equity
            gain or yield, depending on what you chose.
          </div>
        ) : null}
      </SectionCard>
    </div>
  )
}
