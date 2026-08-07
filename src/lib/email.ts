import { Resend } from 'resend'

/**
 * Sending the assessment to the person who asked for it.
 *
 * Two rules shape this module:
 *
 * 1. **A missing API key is not an error.** The report must still reach the
 *    visitor. If mail is not configured, `sendReportEmail` says so and the
 *    caller falls back to a direct download — a broken integration must never
 *    cost someone the work they just did.
 *
 * 2. **A failed send is not an error either.** Same reason. We report it, log
 *    it, and let the client download instead.
 */

const FROM = process.env.REPORT_EMAIL_FROM ?? 'Siare Investments <reports@siare.com.au>'
const REPLY_TO = process.env.REPORT_EMAIL_REPLY_TO

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

export type SendOutcome =
  | { sent: true }
  | { sent: false; reason: 'not_configured' | 'send_failed'; detail?: string }

export async function sendReportEmail(opts: {
  to: string
  name: string
  projectLabel: string
  pdf: Buffer
  filename: string
}): Promise<SendOutcome> {
  if (!isEmailConfigured()) {
    return { sent: false, reason: 'not_configured' }
  }

  const firstName = opts.name.trim().split(/\s+/)[0] || 'there'

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({
      from: FROM,
      to: opts.to,
      ...(REPLY_TO ? { replyTo: REPLY_TO } : {}),
      subject: `Your development feasibility — ${opts.projectLabel}`,
      text: bodyText(firstName, opts.projectLabel),
      html: bodyHtml(firstName, opts.projectLabel),
      attachments: [
        {
          filename: opts.filename,
          content: opts.pdf.toString('base64'),
        },
      ],
    })

    if (error) {
      return { sent: false, reason: 'send_failed', detail: error.message }
    }
    return { sent: true }
  } catch (err) {
    return {
      sent: false,
      reason: 'send_failed',
      detail: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

function bodyText(firstName: string, projectLabel: string): string {
  return `Hi ${firstName},

Your development feasibility assessment for ${projectLabel} is attached.

It covers the full cost stack, the statutory costs most back-of-the-envelope
numbers leave out, and what a lender would advance against the project. Every
figure in it traces back to a published schedule or our rate library.

A few things worth knowing:

- It is indicative. The construction rate and the council contributions are the
  two lines most likely to move once you have a builder's price and a planner's
  advice.
- Duty and land tax are the ones people forget, and they are large. Those come
  from the revenue office's own published schedule for the state you selected.
- If the project needs more equity than you have, a second mortgage can close
  the gap. The report prices one, including what it costs you in profit.

If you want us to look at the funding, reply to this email and we will come back
to you.

Siare Private Investments

This assessment is indicative only and is not financial, legal, tax or planning
advice.`
}

function bodyHtml(firstName: string, projectLabel: string): string {
  // Deliberately plain: inlined styles, table-free, no images. Report emails
  // land in spam far less often when they look like correspondence rather than
  // a campaign.
  return `<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.6;color:#0f1923;max-width:560px">
  <p>Hi ${escapeHtml(firstName)},</p>
  <p>Your development feasibility assessment for <strong>${escapeHtml(projectLabel)}</strong> is attached.</p>
  <p>It covers the full cost stack, the statutory costs most back-of-the-envelope numbers leave out, and what a lender would advance against the project. Every figure in it traces back to a published schedule or our rate library.</p>
  <p>A few things worth knowing:</p>
  <ul>
    <li>It is indicative. The construction rate and the council contributions are the two lines most likely to move once you have a builder&rsquo;s price and a planner&rsquo;s advice.</li>
    <li>Duty and land tax are the ones people forget, and they are large. Those come from the revenue office&rsquo;s own published schedule for the state you selected.</li>
    <li>If the project needs more equity than you have, a second mortgage can close the gap. The report prices one, including what it costs you in profit.</li>
  </ul>
  <p>If you want us to look at the funding, just reply to this email.</p>
  <p style="margin-top:24px">Siare Private Investments</p>
  <p style="font-size:12px;color:#64748b;border-top:1px solid #e2e8f0;padding-top:12px;margin-top:24px">
    This assessment is indicative only and is not financial, legal, tax or planning advice.
  </p>
</div>`
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
