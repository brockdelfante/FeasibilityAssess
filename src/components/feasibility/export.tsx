'use client'

/**
 * Export, sources and the disclaimer gate.
 *
 * Everything here stays on the client: the CSVs are generated in the browser
 * and the share link encodes the inputs into the URL fragment, so no project
 * data is uploaded anywhere.
 *
 * The one exception is "Send to a full lender assessment", which deliberately
 * does hit the server — that is the hand-off from an indicative client-facing
 * feasibility into the credit-side platform.
 */

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  BookOpen,
  Check,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Link2,
  Loader2,
  ScrollText,
  ShieldCheck,
  Upload,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { SOURCES, RATE_LIBRARY_REFRESHED, RATE_LIBRARY_VERSION } from '@/lib/feasibility/sources'
import { useFeasibilityStore } from '@/lib/feasibility/store'
import { buildShareUrl, cashflowCsv, downloadCsv, headlineCsv } from '@/lib/feasibility/share'

import { SectionCard } from './primitives'

// ---------------------------------------------------------------------------
// Export bar
// ---------------------------------------------------------------------------

export function ExportPanel() {
  const { inputs, results } = useFeasibilityStore()
  const router = useRouter()
  const [copied, setCopied] = React.useState(false)
  const [pushing, setPushing] = React.useState(false)
  const [pushError, setPushError] = React.useState<string | null>(null)
  const [pdfBusy, setPdfBusy] = React.useState(false)
  const [pdfError, setPdfError] = React.useState<string | null>(null)

  const slug = (inputs.projectName || 'feasibility').replace(/[^a-z0-9]+/gi, '-').toLowerCase()

  /**
   * Download the branded PDF. Rendering happens on the server because
   * @react-pdf/renderer is far too heavy to ship to the browser, but nothing is
   * stored — the response streams straight to a download.
   */
  const downloadPdf = async () => {
    setPdfBusy(true)
    setPdfError(null)
    try {
      const res = await fetch('/api/feasibility/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs,
          generatedAt: new Date().toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error ?? 'Could not generate the PDF')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${slug}-feasibility.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPdfBusy(false)
    }
  }

  const copyShareLink = async () => {
    const url = buildShareUrl(inputs, window.location.origin, window.location.pathname)
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Clipboard can be blocked by permissions policy; fall back to the hash so
      // the client can copy it out of the address bar themselves.
      window.location.hash = url.split('#')[1] ?? ''
    }
  }

  /**
   * Hand the feasibility over to the lender-side assessment.
   *
   * The two models answer different questions, so this creates a new deal
   * seeded from the feasibility rather than trying to keep them in sync.
   */
  const sendToAssessment = async () => {
    setPushing(true)
    setPushError(null)
    try {
      const res = await fetch('/api/feasibility/to-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs }),
      })
      const data = await res.json()
      if (!res.ok || !data?.id) {
        throw new Error(data?.error ?? 'Could not create the assessment')
      }
      router.push(`/deals/${data.id}/edit`)
    } catch (err) {
      setPushError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setPushing(false)
    }
  }

  return (
    <SectionCard
      title="Export & share"
      blurb="Download the numbers, or copy a link that reopens this exact feasibility for someone else — your lender, your partner, your accountant."
      icon={<Download className="h-4 w-4 text-blue-600" />}
    >
      <div className="flex flex-wrap gap-2">
        <Button onClick={downloadPdf} disabled={pdfBusy}>
          {pdfBusy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileText className="h-4 w-4" />
          )}
          {pdfBusy ? 'Generating…' : 'Download PDF report'}
        </Button>
        <Button
          variant="outline"
          onClick={() => downloadCsv(`${slug}-summary.csv`, headlineCsv(inputs, results))}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Summary CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => downloadCsv(`${slug}-cashflow.csv`, cashflowCsv(results))}
        >
          <FileSpreadsheet className="h-4 w-4" />
          Cashflow CSV
        </Button>
        <Button variant="outline" onClick={copyShareLink}>
          {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Link2 className="h-4 w-4" />}
          {copied ? 'Link copied' : 'Copy share link'}
        </Button>
        <Button variant="outline" onClick={() => window.print()}>
          <ScrollText className="h-4 w-4" />
          Print this page
        </Button>
      </div>

      {pdfError ? <p className="text-xs text-red-600">{pdfError}</p> : null}

      <div className="rounded-lg border border-gray-200 bg-gray-50/70 px-4 py-3 text-xs leading-relaxed text-gray-600">
        The CSVs and the share link are generated entirely in your browser — nothing leaves your
        device. The link encodes your inputs in the URL, so whoever opens it sees exactly these
        numbers. The PDF is rendered on our server because the layout engine is too heavy to run in
        a browser, but no copy is kept.
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-blue-900">
          <Upload className="h-4 w-4" />
          Take this into a full lender assessment
        </p>
        <p className="mt-1 text-xs leading-relaxed text-blue-800/90">
          This feasibility is indicative and client-facing. The lender-side assessment adds the
          things a credit team needs: presale registers and cover ratios, mezzanine tranches,
          covenant testing against your policy settings, and credit-committee reports. Your cost
          stack carries across as the starting point.
        </p>
        <Button className="mt-3" onClick={sendToAssessment} disabled={pushing}>
          {pushing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          {pushing ? 'Creating…' : 'Create lender assessment'}
        </Button>
        {pushError ? <p className="mt-2 text-xs text-red-600">{pushError}</p> : null}
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export function SourcesPanel() {
  return (
    <SectionCard
      title="What's behind the numbers"
      blurb="Transparency by default. Every assumption traces to a published source or a stated indicative range — and you can override any of it."
      icon={<BookOpen className="h-4 w-4 text-blue-600" />}
      action={
        <span className="text-[10px] font-medium text-gray-400">
          {RATE_LIBRARY_VERSION} · refreshed {RATE_LIBRARY_REFRESHED}
        </span>
      }
    >
      <div className="space-y-3">
        {Object.values(SOURCES).map((source) => (
          <div key={source.key} className="rounded-lg border border-gray-200 p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-sm font-semibold text-gray-900">{source.title}</p>
              <span className="text-[10px] text-gray-400">As at {source.asAt}</span>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-gray-600">{source.detail}</p>
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
        ))}
      </div>
    </SectionCard>
  )
}

// ---------------------------------------------------------------------------
// Disclaimer
// ---------------------------------------------------------------------------

export function DisclaimerGate() {
  const { disclaimerAccepted, acceptDisclaimer } = useFeasibilityStore()

  return (
    <Dialog open={!disclaimerAccepted}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Before you start
          </DialogTitle>
          <DialogDescription>
            This is an indicative feasibility tool, not financial advice.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm leading-relaxed text-gray-600">
          <p>
            <strong className="text-gray-900">Indicative only.</strong> This assessment is built
            from the inputs you provide plus assumed rates from a library that is updated
            periodically. It is not a quote, a guaranteed cost, or a valuation. Real costs move
            with site conditions, builder selection, design choices, market movement and council
            requirements that no model can capture.
          </p>
          <p>
            <strong className="text-gray-900">Not financial, legal or tax advice.</strong> Stamp
            duty, land tax, GST, HBCF and every other statutory line is calculated from published
            rates current at the time of writing. Confirm each one with a qualified accountant,
            conveyancer, solicitor or finance broker before you commit to anything.
          </p>
          <p>
            <strong className="text-gray-900">Verify what matters.</strong> If a number materially
            affects a decision you are about to make, check it against a registered quantity
            surveyor, a builder, a town planner or the relevant government source. Construction
            rates drift annually and regulatory thresholds change.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={acceptDisclaimer} className="w-full sm:w-auto">
            I understand — continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Persistent footer disclaimer, always visible alongside the results. */
export function DisclaimerFooter() {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/70 p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Disclaimer</p>
      <p className="mt-2 text-xs leading-relaxed text-gray-600">
        This is a feasibility-modelling tool. The figures it produces are indicative estimates
        based on the inputs you entered and assumed rates from a periodically updated library. It
        does not provide financial, legal, tax, planning, valuation or construction advice, and its
        output is not a substitute for professional advice from a qualified accountant, lawyer, town
        planner, quantity surveyor, valuer, lender or builder. Stamp duty, council contributions,
        GST treatment, finance terms and construction rates change frequently and vary by location,
        lender, council and project — verify every figure independently before making any
        acquisition, finance or planning decision.
      </p>
    </div>
  )
}

export { Copy }
