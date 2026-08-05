# Verified statutory research — 5 August 2026

`verified-2026-08-05.json` is the raw output of a verification exercise covering
transfer duty, land tax, builder warranty insurance, developer contributions and
building-practitioner regimes for all eight Australian jurisdictions.

It is kept in the repo as a **provenance record**. Every band in a jurisdiction
profile should be traceable back to a `rowText` field in here, which holds the
verbatim row from the revenue office's published table. If a figure in a profile
ever comes into question, this is where to look before re-scraping.

## Method

Each jurisdiction was transcribed by one agent reading the revenue office's
published markdown table row by row, then independently re-fetched and attacked
by a second agent whose brief was to *refute* the transcription — checking the
tax year, concession contamination, marginal-vs-flat band shape, worked-example
arithmetic and boundary continuity. A final critic reviewed the whole set for
cross-jurisdiction plausibility and carried assumptions.

LLM/JSON extraction was explicitly forbidden on tax tables. It had already been
observed mislabelling a tax year and garbling a band on exactly this material.

## Headline result

**Zero arithmetic failures across all eight jurisdictions.** Every officially
published worked figure reconciles to the cent off the transcribed bands:

| Jurisdiction | Official anchor reconciled |
|---|---|
| NSW | $3,870,000 → $194,137 (premium threshold), plus 4 land tax examples |
| VIC | 13 official duty figures, incl. $7,000,000 → $435,000 |
| QLD | $850,000 → $31,275 |
| SA | $600,000 → $26,830, plus 8 rate-chart spot checks |
| WA | 5 figures incl. $850,000 → $34,890.50, two straddling the top band |
| TAS | land tax ALV $400,000 → $1,287.50; duty continuous at all 6 seams |
| ACT | 4 live-calculator runs incl. $3,000,000 → $136,200 |
| NT | example resolved a coefficient dispute in the official brochure |

Duty on a $3,000,000 site across the set — TAS $130,185 · ACT $136,200 ·
WA $145,565 · NSW $146,287 · QLD $153,025 · SA $158,830 · NT $172,500 ·
VIC $175,000 — a coherent spread with no outlier.

## Ship status

| Jurisdiction | Duty + land tax | Extras |
|---|---|---|
| NSW | **shipped** | held — s7.11/s7.12 figures are indicative |
| VIC | ready | do not ship — premium rate inferred, gazette unread (403) |
| QLD | ready | do not ship — snippet-sourced, unresolved figure conflict |
| SA | ready, **needs a regime gate** | do not ship — three conflicting open-space figures |
| WA | ready | do not ship — premium rate has no source, self-described estimate |
| TAS | ready | held — correct today, flips if the 2023 Act is proclaimed |
| ACT | ready, **needs a regime gate** | do not ship — LVC determinations unread (403) |
| NT | **do not ship** — see below | do not ship — sources conflict 2:1 |

Six of eight *extras* blocks were assembled with primary retrieval blocked
(Firecrawl 402, WebFetch 403). They are search-engine snippets and author
estimates, not transcriptions, and must not ride on the rate schedules'
credibility. The warranty thresholds are the most likely carried assumption in
the set: $20,000 appears for NSW, VIC, SA and WA, but Victoria's DBI threshold
was historically $16,000 and South Australia's BII $12,000. NSW and WA are
confirmed; VIC and SA need the commencing regulation read.

### NT must not ship as transcribed

Its first duty band is a **quadratic** the schedule type cannot express, and it
was recorded as `flat` with `rate: 0`. That silently returns **$0 duty on any NT
site up to $525,000** — a realistic price. Its worked example
(`$140,000 → $3,388`) also cannot be reproduced from its own bands, and comes
from a head of duty abolished on 9 May 2023.

## Two rounding quirks that must NOT be "corrected"

Both look like transcription errors and are not. Each is the operative published
constant, proven against official examples:

- **NSW `$1,662`** at the $103,000 band. True cumulative is $1,662.50; Revenue
  NSW rounded down and propagated the rounded value into $11,602, $52,237 and
  $194,137, none of which reconcile off $1,662.50.
- **WA `$28,453`** at the $725,000 band. Accumulating gives $28,452.50, but the
  official $850,000 → $34,890.50 and $1,000,000 → $42,615.50 both prove $28,453
  is operative.

Also genuine, despite looking like a carried figure: **WA and TAS duty top bands
both begin at exactly $725,000.** Two independent arithmetic proofs confirm it is
coincidence.

## Practitioner regimes

Only **NSW** carries a true Class 2 regime. Victoria's Developer Bond Scheme does
not commence until permits issued from 1 July 2027, is refundable capital rather
than a cost, and triggers on storeys rather than Class 2. The ACT's Property
Developers Act 2024 licence triggers at 3+ dwellings including Class 1 and was
not mandatory until 1 October 2026. Both were initially flagged true and must be
false.

## Annual maintenance

Duty thresholds are CPI-indexed **every 1 July** in most jurisdictions, and the
applicable year is set by the **contract date**, not settlement. These tables
need re-scraping each financial year. NSW land tax thresholds are the exception —
frozen for all years after 2024 by the 2024-25 State Budget.
