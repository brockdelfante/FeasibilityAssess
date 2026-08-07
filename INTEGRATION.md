# Porting this into the SIARE portal

A handoff brief for whoever is merging this assessment tool with the portal's
existing **renovation feasibility** tool.

Repo: `brockdelfante/FeasibilityAssess`
Branch: `feat/siare-platform-8322355834715374490` (this is the production branch)
Read this first, then `src/lib/feasibility/types.ts` and `engine.ts`.

---

## 0. Read this before you plan the merge

**This app already does renovations.** Before writing a line, look at:

- `src/lib/feasibility/modes/renovation.ts` — the renovation model
- `mode: 'renovate'` and `devType: 'renovation'` in `types.ts`
- inputs `preRenoValue`, `postRenoValue`, `suburbMedianForConfig`, `renovationScopeSqm`
- `RenovationResult` in `types.ts`

It answers "if I spend $X to add a bed and a bath, am I better off?" with equity
gain rather than developer profit, and it tests two things a naive renovation
calculator misses: the **suburb value ceiling** for the bed-count config, and
the **rebuild crossover** (once build cost passes roughly half the post-reno
value, demolishing and building new is often cheaper and more sellable).

So the job is probably **not** "bolt a renovation calculator onto a development
calculator". It is more likely:

1. Diff the portal's renovation logic against `modes/renovation.ts`.
2. Keep whichever is better, per behaviour, not per codebase.
3. Fold anything the portal's version does that this one doesn't into
   `modes/renovation.ts` as an additional mode-specific block.

Duplicating the renovation path would be the main way to get this wrong.

---

## 1. What you are taking

### The engine — take all of it

`src/lib/feasibility/**` is **7,158 lines of pure TypeScript**. Its entire
external dependency surface is:

```
zustand      (only in store.ts — swap it for the portal's state library if you prefer)
```

No React. No Next. No `fetch`. No DOM. It runs in a browser, on a server, or in
a test with no adaptation. That was deliberate, and it is why this port is
cheap. Keep it that way.

| Area | Files | What it is |
|---|---|---|
| Types & contract | `types.ts` | Every input and every result. Start here. |
| Cost engine | `engine.ts` | The cost stack, iterated to convergence for circular finance. |
| Rate library | `rates.ts`, `assemblies.ts`, `boq.ts` | $/m² rates, soft-cost percentages, trade breakdowns. |
| Statutory | `statutory.ts`, `jurisdictions/**` | Duty, land tax, warranty, contributions for 7 states. |
| Modes | `modes/renovation.ts`, `modes/ppr.ts`, `modes/hold.ts` | The per-goal blocks. |
| Funding | `funding.ts` | Senior sizing, presale cover, **second mortgages**. |
| Analysis | `scenarios.ts`, `cashflow.ts` | Sensitivity, scale grid, solver, monthly cashflow, IRR. |
| Explanation | `trace.ts`, `sources.ts`, `insights.ts`, `narrative.ts` | The trust layer — see §3. |
| Classification | `classification.ts` | NCC class and the practitioner-regime cost. |
| State | `store.ts` | zustand. The only replaceable file. |
| Serialisation | `share.ts` | Encodes the whole input set into a URL fragment. |

### The UI — take selectively

`src/components/feasibility/**` is 5,698 lines of React. It is good, but it is
shaped for a standalone public page. Port `primitives.tsx` (the field, money
input, trace sheet, stat tile) and re-skin the rest to the portal's components.

### Leave behind

- `src/app/**` — routing and the public shell, portal-specific
- `src/components/shell/**` — the standalone app chrome
- `src/lib/calculations.ts`, `src/lib/store.ts`, `src/lib/policy.ts` — the
  **old** lender-side engine. Superseded. Do not port it; do not merge it with
  the new one. `bridge.ts` maps between them and can go once it is gone.

---

## 2. The integration contract

Three calls. That is the whole API.

```ts
import { defaultFeasibilityInputs, runFeasibility } from '@/lib/feasibility/engine'
import { computeFunding, fundingVerdict } from '@/lib/feasibility/funding'
import type { FeasibilityInputs, FeasibilityResults } from '@/lib/feasibility/types'

// 1. Every field has a sane default, so a blank form still produces a complete
//    answer. This is load-bearing — see §3.
const inputs: FeasibilityInputs = { ...defaultFeasibilityInputs, ...whatTheUserSaid }

// 2. The whole assessment. Pure function, no I/O, ~1ms.
const results: FeasibilityResults = runFeasibility(inputs)

// 3. The funding position, including the second mortgage.
const funding = computeFunding(inputs, results)
const verdict = fundingVerdict(funding, inputs)
```

`runFeasibility` is pure and cheap enough to call on every keystroke. The
scale grid runs ~300 full passes and still feels instant.

### Setting the goal

`inputs.mode` selects the question being answered:

| mode | Question | Result block |
|---|---|---|
| `develop_to_sell` | Will this development make a profit? | headline metrics |
| `develop_to_hold` | Build and rent — what's the yield on cost? | `results.hold` |
| `buy_to_hold` | Buy existing and rent. | `results.hold` |
| `ppr` | Owner-occupier: buy, build, or knock-down rebuild. | `results.ppr` |
| `renovate` | **Will my reno add more value than it costs?** | `results.renovation` |

Broadening scope means adding a mode and a `modes/*.ts` block, not forking the
engine.

---

## 3. Decisions not to undo

These look like details and are not. Each was a bug that got fixed.

**Defaults-first.** Every input has a default from the rate library, so the tool
shows a complete verdict from question one. Do not add required fields or a
blank initial state. It is the single biggest driver of completion.

**The trace layer.** Every derived number is a `Traced` — value, confidence,
plausible range, the arithmetic steps, and a source key. The UI lets you click
any figure to see where it came from. This is what makes an estimate defensible
rather than a black box. Do not flatten `Traced` to `number` to simplify a prop.

**Statutory tables are generated, not typed.** `jurisdictions/{vic,qld,sa,wa,tas,act}.ts`
are produced by `scripts/generate-jurisdiction-profiles.mjs` from
`_research/verified-2026-08-05.json`. Every band carries the verbatim
revenue-office row as a comment and reconciles against that office's published
worked example. **Edit the artefact and regenerate — never hand-edit a profile.**
Read `jurisdictions/_research/README.md` before touching any of it.

**Duty needs a residential/commercial regime.** SA charges nothing on
non-residential land; the ACT is a flat 5% cliff above $2.1M. Without
`dutyRegimeOverride` those states are wrong by up to the entire duty line, and
it fails silently. Never call `dutyFor` directly — always `dutyForRegime`.

**NT has no profile on purpose.** Its first duty band is a quadratic the schema
cannot express; transcribed as a flat band it returns $0 on any site up to
$525,000. `profileFor('NT')` throws rather than guessing. Fix it with a
quadratic band kind or leave it out.

**Construction rates are Sydney-metro.** Everywhere else applies the profile's
location factor via `inputs.costRegion`. Do not add a second rate table.

**A missing integration must never cost the user their work.** The lead gate
falls back to a download when mail is unconfigured; `/api/deals` returns 503 not
500 when there is no database. Keep that discipline in the portal.

---

## 4. Verification — run these after the merge

Three harnesses, no test framework required:

```bash
npx tsc --outDir /tmp/fv --module commonjs --target es2020 \
  --moduleResolution node --skipLibCheck --esModuleInterop \
  src/lib/feasibility/__verify.ts \
  src/lib/feasibility/__verify_states.ts \
  src/lib/feasibility/jurisdictions/__verify_all.ts

node /tmp/fv/__verify.js                      # 15 checks, engine reconciliation
node /tmp/fv/__verify_states.js               # the engine dispatches per state
node /tmp/fv/jurisdictions/__verify_all.js    # every published worked example
```

`__verify_all.js` checks the schedules against the revenue offices' own
examples — NSW $3,870,000 → $194,137, VIC $7,000,000 → $435,000, QLD $850,000 →
$31,275, SA $600,000 → $26,830, WA $850,000 → $34,891, ACT $3,000,000 →
$136,200. If those break after your merge, the tax tables moved and the numbers
are wrong.

`tests/feasibility.spec.ts` has 15 Playwright tests driving the real UI. They
assume the standalone routing, so expect to rewrite the navigation in them and
keep the assertions.

**A deliberate tripwire:** one test asserts NSW duty of exactly `$91,287`.
Thresholds re-index every 1 July. When that fails, re-scrape the schedules —
do not relax the assertion.

---

## 5. Environment

The public assessment needs **nothing**. It is client-side arithmetic and runs
with zero environment variables. Only these features need configuration:

```
RESEND_API_KEY            # emails the report; falls back to download without it
REPORT_EMAIL_FROM         # e.g. Siare Investments <reports@siare.com.au>
REPORT_EMAIL_REPLY_TO     # optional, so replies reach a human
HUBSPOT_ACCESS_TOKEN      # pushes the lead with its deal numbers attached
NEXT_PUBLIC_SUPABASE_URL  # only the internal /deals/* and /settings/* pages
NEXT_PUBLIC_SUPABASE_ANON_KEY
```

The portal's Supabase (project `Portal`, `acqbrbjctwxxxlxtapmy`) has **no
`deals` table** — this app's schema has never been created. If you want the
internal credit pages, create the schema deliberately; do not assume it exists.

---

## 6. Known gaps, inherited as-is

- **NT** has no duty profile (§3).
- **Warranty premiums and contribution ranges are indicative, not transcribed.**
  Primary retrieval was blocked for most states. Duty and land tax do not share
  this weakness. They are labelled in the citation, but that labelling is easy
  to lose in a redesign — keep it.
- **A live RapidAPI key is hardcoded** in `src/app/api/address-autocomplete/route.ts`
  and `src/app/api/property-intelligence/route.ts`. It is in git history, so it
  needs rotating, not just moving to an env var. Do not copy it forward.
- `src/lib/calculations.ts` and the deal editor carry pre-existing `any` usage
  and lint debt. Not worth porting; see §1.
