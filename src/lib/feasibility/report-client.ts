import type { FeasibilityInputs } from './types'

/**
 * Fetch the rendered PDF and hand it to the browser as a download.
 *
 * Rendering happens on the server because @react-pdf/renderer is far too heavy
 * to ship to the browser, and nothing is stored — the response streams straight
 * to a download.
 *
 * Shared between the export panel and the lead gate's fallback, because those
 * two must behave identically: if the email cannot be sent, the download the
 * visitor gets instead has to be the same file they were promised.
 */
export async function downloadReportPdf(inputs: FeasibilityInputs): Promise<void> {
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
  link.download = reportFilename(inputs)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function reportFilename(inputs: FeasibilityInputs): string {
  const slug =
    (inputs.projectName || inputs.suburbOrAddress || 'feasibility')
      .replace(/[^a-z0-9]+/gi, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase() || 'feasibility'
  return `${slug}-feasibility.pdf`
}
