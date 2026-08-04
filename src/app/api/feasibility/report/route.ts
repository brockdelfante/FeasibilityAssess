import React from 'react'
import { NextRequest, NextResponse } from 'next/server'
import ReactPDF from '@react-pdf/renderer'

import { FeasibilityReport } from '@/lib/pdf/FeasibilityReport'
import { defaultFeasibilityInputs, runFeasibility } from '@/lib/feasibility/engine'
import type { FeasibilityInputs } from '@/lib/feasibility/types'

/**
 * Render the feasibility report to a PDF and stream it straight back.
 *
 * Nothing is persisted — unlike the lender-side reports, which are uploaded to
 * storage and logged against a deal, this is a client's own indicative
 * assessment and there is no reason to keep a copy.
 *
 * Only the inputs cross the wire; the results are recomputed here so the PDF
 * can never disagree with the engine.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

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

    // The client sends its own local date so the report reads in their
    // timezone rather than the server's.
    const generatedAt =
      typeof body?.generatedAt === 'string' && body.generatedAt.length <= 40
        ? body.generatedAt
        : new Date().toISOString().slice(0, 10)

    const element = React.createElement(FeasibilityReport, { inputs, results, generatedAt })

    // @ts-expect-error renderToStream's element type is narrower than the JSX it accepts
    const stream = await ReactPDF.renderToStream(element)

    const chunks: Buffer[] = []
    for await (const chunk of stream) {
      chunks.push(Buffer.from(chunk))
    }
    const pdf = Buffer.concat(chunks)

    const slug =
      (inputs.projectName || inputs.suburbOrAddress || 'feasibility')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .toLowerCase() || 'feasibility'

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${slug}-feasibility.pdf"`,
        'Content-Length': String(pdf.length),
        // A client's own numbers should not sit in a shared cache.
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('POST /api/feasibility/report error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
