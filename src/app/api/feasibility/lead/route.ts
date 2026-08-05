import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import ReactPDF from '@react-pdf/renderer'

import { defaultFeasibilityInputs, runFeasibility } from '@/lib/feasibility/engine'
import { computeFunding } from '@/lib/feasibility/funding'
import { FeasibilityReport } from '@/lib/pdf/FeasibilityReport'
import { isEmailConfigured, sendReportEmail } from '@/lib/email'
import { isFreeEmail, pushLeadToCrm, validateLead } from '@/lib/lead'
import type { FeasibilityInputs } from '@/lib/feasibility/types'

/**
 * Capture the lead, then email them their report.
 *
 * The governing principle: **the visitor always gets their assessment.** They
 * have just spent several minutes on it. If mail is not configured, or the
 * provider is down, or HubSpot rejects the contact, none of that is their
 * problem — the response says what happened and the client falls back to a
 * direct download.
 *
 * So this route reports partial success honestly rather than returning an error
 * that would strand someone in front of a form.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    const validation = validateLead(body?.lead ?? {})
    if (!validation.ok) {
      return NextResponse.json({ errors: validation.errors }, { status: 422 })
    }
    const lead = validation.cleaned

    // Recompute from the inputs rather than trusting numbers off the wire, so
    // the emailed PDF can never disagree with the engine.
    const inputs: FeasibilityInputs = {
      ...defaultFeasibilityInputs,
      ...(body?.inputs ?? {}),
      overrides: {
        ...defaultFeasibilityInputs.overrides,
        ...(body?.inputs?.overrides ?? {}),
      },
      boq: body?.inputs?.boq ?? defaultFeasibilityInputs.boq,
      appliedAssemblies: body?.inputs?.appliedAssemblies ?? [],
    }

    const results = runFeasibility(inputs)
    const funding = computeFunding(inputs, results)

    const generatedAt =
      typeof body?.generatedAt === 'string' && body.generatedAt.length <= 40
        ? body.generatedAt
        : new Date().toISOString().slice(0, 10)

    const projectLabel =
      inputs.projectName || inputs.suburbOrAddress || `${inputs.jurisdiction} development`

    const slug =
      projectLabel
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'feasibility'
    const filename = `${slug}-feasibility.pdf`

    const element = React.createElement(FeasibilityReport, { inputs, results, generatedAt })
    // @ts-expect-error renderToStream's element type is narrower than the JSX it accepts
    const stream = await ReactPDF.renderToStream(element)
    const chunks: Buffer[] = []
    for await (const chunk of stream) chunks.push(Buffer.from(chunk))
    const pdf = Buffer.concat(chunks)

    // The CRM gets the numbers, not just the name. A contact attached to
    // "$2M site, 24% margin, $3.5M equity gap" is a conversation with an
    // opening line; a bare address is a cold call.
    const crmPushed = await pushLeadToCrm(lead, {
      siare_project: projectLabel,
      siare_jurisdiction: inputs.jurisdiction,
      siare_purchase_price: Math.round(inputs.purchasePrice),
      siare_total_cost: Math.round(results.totalDevelopmentCost),
      siare_gross_revenue: Math.round(results.grossRevenue),
      siare_margin_on_cost: Number((results.marginOnCost * 100).toFixed(1)),
      siare_verdict: results.verdict,
      siare_equity_required: Math.round(funding.equityRequired),
      siare_equity_gap: Math.round(funding.shortfall),
      siare_needs_second_mortgage: funding.shortfall > 0 ? 'yes' : 'no',
      siare_free_email: isFreeEmail(lead.email) ? 'yes' : 'no',
      siare_marketing_consent: lead.marketingConsent ? 'yes' : 'no',
    })

    const outcome = await sendReportEmail({
      to: lead.email,
      name: lead.name,
      projectLabel,
      pdf,
      filename,
    })

    return NextResponse.json({
      emailed: outcome.sent,
      // Tells the client whether to offer a download instead of "check your
      // inbox" — the difference between a working funnel and a dead end.
      emailConfigured: isEmailConfigured(),
      emailError: outcome.sent ? null : (outcome.reason ?? null),
      crmPushed,
      filename,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('POST /api/feasibility/lead error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
