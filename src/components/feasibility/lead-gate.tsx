'use client'

/**
 * The one thing we ask for.
 *
 * The visitor has just spent several minutes answering questions and has seen a
 * verdict and a funding position. This is the moment to ask, and it is the only
 * moment we do.
 *
 * Two things it must never do: lose their work, or lie to them. If mail is not
 * configured or the send fails, it says so and hands over the download — a
 * broken integration is our problem, not theirs.
 */

import * as React from 'react'
import { Check, Loader2, Mail, ShieldCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { useFeasibilityStore } from '@/lib/feasibility/store'
import { downloadReportPdf } from '@/lib/feasibility/report-client'

type FieldErrors = Partial<Record<'name' | 'email', string>>

export interface LeadResult {
  emailed: boolean
  emailConfigured: boolean
  email: string
  name: string
}

export function LeadGate({
  open,
  onOpenChange,
  onCaptured,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCaptured: (result: LeadResult) => void
}) {
  const { inputs } = useFeasibilityStore()

  const [name, setName] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [consent, setConsent] = React.useState(false)
  const [errors, setErrors] = React.useState<FieldErrors>({})
  const [busy, setBusy] = React.useState(false)
  const [failed, setFailed] = React.useState<string | null>(null)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrors({})
    setFailed(null)

    // Check the obvious client-side so a typo does not cost a round trip. The
    // server validates again regardless — this is convenience, not security.
    const next: FieldErrors = {}
    if (name.trim().split(/\s+/).length < 2) {
      next.name = 'Please give your first and last name.'
    }
    if (!/^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email.trim())) {
      next.email = 'That does not look like an email address.'
    }
    if (Object.keys(next).length > 0) {
      setErrors(next)
      return
    }

    setBusy(true)
    try {
      const res = await fetch('/api/feasibility/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead: { name, email, marketingConsent: consent },
          inputs,
          generatedAt: new Date().toLocaleDateString('en-AU'),
        }),
      })

      if (res.status === 422) {
        const data = await res.json()
        const mapped: FieldErrors = {}
        for (const e of data.errors ?? []) mapped[e.field as 'name' | 'email'] = e.message
        setErrors(mapped)
        return
      }

      if (!res.ok) throw new Error(`The server returned ${res.status}.`)

      const data = await res.json()
      onCaptured({
        emailed: Boolean(data.emailed),
        emailConfigured: Boolean(data.emailConfigured),
        email: email.trim().toLowerCase(),
        name: name.trim(),
      })
      onOpenChange(false)
    } catch (err) {
      // Never strand them. Say what happened and give them the report anyway.
      setFailed(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  const downloadInstead = async () => {
    setBusy(true)
    try {
      await downloadReportPdf(inputs)
      onOpenChange(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Where should we send it?</DialogTitle>
          <DialogDescription>
            We&rsquo;ll email your full assessment as a PDF — the cost stack, the statutory costs,
            and what a lender would advance against this project.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lead-name">Full name</Label>
            <Input
              id="lead-name"
              autoComplete="name"
              placeholder="Alex Nguyen"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? 'lead-name-error' : undefined}
            />
            {errors.name ? (
              <p id="lead-name-error" className="text-xs text-critical-600">
                {errors.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="lead-email">Work email</Label>
            <Input
              id="lead-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="alex@company.com.au"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? 'lead-email-error' : undefined}
            />
            {errors.email ? (
              <p id="lead-email-error" className="text-xs text-critical-600">
                {errors.email}
              </p>
            ) : null}
          </div>

          {/* Unticked by default. Sending the report they asked for needs no
              consent; anything beyond it does. */}
          <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border accent-brand-600"
            />
            <span>
              I&rsquo;d like Siare to contact me about funding this project. You can say no and
              still get the report.
            </span>
          </label>

          {failed ? (
            <div className="rounded-lg border border-caution-200 bg-caution-50 p-3">
              <p className="text-xs leading-relaxed text-caution-800">
                We couldn&rsquo;t email it just then — {failed} You can download it instead and
                nothing is lost.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={downloadInstead}
                disabled={busy}
              >
                Download the PDF instead
              </Button>
            </div>
          ) : null}

          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Preparing your report…
              </>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Email me the report
              </>
            )}
          </Button>

          <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-3 w-3 shrink-0" />
            We use your details to send this report and, if you asked us to, to talk to you about
            funding. We don&rsquo;t sell them or pass them on.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Confirmation shown on the report stage once the details are in. */
export function LeadConfirmation({ result }: { result: LeadResult }) {
  const { inputs } = useFeasibilityStore()
  const [busy, setBusy] = React.useState(false)

  const download = async () => {
    setBusy(true)
    try {
      await downloadReportPdf(inputs)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="rounded-2xl border border-positive-200 bg-positive-50 p-6">
      <div className="flex items-start gap-4">
        <Check className="h-5 w-5 shrink-0 text-positive-600" />
        <div className="min-w-0">
          {result.emailed ? (
            <>
              <p className="text-lg font-bold">On its way to {result.email}</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                It should land within a minute or two. If it doesn&rsquo;t, check your spam folder
                — or grab it here directly.
              </p>
            </>
          ) : (
            <>
              <p className="text-lg font-bold">Your report is ready</p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {result.emailConfigured
                  ? 'We could not email it just then, so download it here — nothing is lost.'
                  : 'Download it here. We have your details and will be in touch.'}
              </p>
            </>
          )}
          <Button variant="outline" size="sm" className="mt-3" onClick={download} disabled={busy}>
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
            Download the PDF
          </Button>
        </div>
      </div>
    </div>
  )
}
