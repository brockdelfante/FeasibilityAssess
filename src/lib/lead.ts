/**
 * Lead validation and CRM delivery.
 *
 * This is the one place on a public site where a stranger's details are
 * accepted, so it is also the one place that has to be careful: validate, cap
 * the sizes, and never let a CRM failure cost the visitor the report they came
 * for.
 */

export interface LeadDetails {
  name: string
  email: string
  /** Optional — asked for but never required. */
  phone?: string
  /** Explicit opt-in to hear more. Absent means "send the report only". */
  marketingConsent: boolean
}

export interface LeadValidation {
  ok: boolean
  errors: { field: 'name' | 'email'; message: string }[]
  cleaned: LeadDetails
}

/**
 * Free-mail domains.
 *
 * Deliberately NOT blocked. The field says "work email" because that is what we
 * would prefer, but a solo developer doing a $2M duplex is a completely
 * legitimate lead and very often uses Gmail. Refusing them would throw away
 * real enquiries to improve a vanity metric. The list exists so the CRM can
 * flag them for triage, not so the form can reject them.
 *
 * Flip REQUIRE_WORK_EMAIL if that trade-off ever changes.
 */
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'hotmail.com',
  'hotmail.com.au',
  'outlook.com',
  'outlook.com.au',
  'live.com',
  'live.com.au',
  'yahoo.com',
  'yahoo.com.au',
  'icloud.com',
  'me.com',
  'bigpond.com',
  'optusnet.com.au',
  'proton.me',
  'protonmail.com',
])

export const REQUIRE_WORK_EMAIL = false

/** Deliberately permissive: shape only, because anything stricter rejects valid addresses. */
const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

export function isFreeEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split('@')[1] ?? ''
  return FREE_EMAIL_DOMAINS.has(domain)
}

export function validateLead(raw: Partial<LeadDetails>): LeadValidation {
  const name = String(raw.name ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120)
  const email = String(raw.email ?? '')
    .trim()
    .toLowerCase()
    .slice(0, 200)
  const phone = String(raw.phone ?? '')
    .trim()
    .slice(0, 40)

  const errors: LeadValidation['errors'] = []

  if (name.length < 2) {
    errors.push({ field: 'name', message: 'Please tell us your name.' })
  } else if (!name.includes(' ')) {
    errors.push({ field: 'name', message: 'Please include your first and last name.' })
  }

  if (!EMAIL_SHAPE.test(email)) {
    errors.push({ field: 'email', message: "That does not look like an email address." })
  } else if (REQUIRE_WORK_EMAIL && isFreeEmail(email)) {
    errors.push({ field: 'email', message: 'Please use your work email address.' })
  }

  return {
    ok: errors.length === 0,
    errors,
    cleaned: {
      name,
      email,
      phone: phone || undefined,
      marketingConsent: Boolean(raw.marketingConsent),
    },
  }
}

// ---------------------------------------------------------------------------
// CRM
// ---------------------------------------------------------------------------

export function isCrmConfigured(): boolean {
  return Boolean(process.env.HUBSPOT_ACCESS_TOKEN)
}

/**
 * Create or update the contact in HubSpot, with the headline numbers attached.
 *
 * The numbers matter as much as the address. A name with no context is a cold
 * call; a name attached to "$2M site in Ashfield, 24% margin, $3.5M equity gap"
 * is a conversation with an opening line.
 *
 * Returns false rather than throwing: the visitor's report does not depend on
 * the CRM being reachable.
 */
export async function pushLeadToCrm(
  lead: LeadDetails,
  context: Record<string, string | number>
): Promise<boolean> {
  if (!isCrmConfigured()) return false

  const [firstname, ...rest] = lead.name.split(' ')

  try {
    const res = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        properties: {
          email: lead.email,
          firstname,
          lastname: rest.join(' '),
          ...(lead.phone ? { phone: lead.phone } : {}),
          lifecyclestage: 'lead',
          hs_lead_status: 'NEW',
          ...context,
        },
      }),
    })

    // 409 means the contact already exists, which is a success for our
    // purposes — they came back and ran another assessment.
    if (res.status === 409) {
      console.info('lead: contact already in HubSpot', lead.email)
      return true
    }

    if (!res.ok) {
      console.error('lead: HubSpot rejected the contact', res.status, await res.text())
      return false
    }
    return true
  } catch (err) {
    console.error('lead: could not reach HubSpot', err)
    return false
  }
}
