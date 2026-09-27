import { groupByEmail } from './_lib/groupByEmail.js'
import { renderConfirmation } from './_lib/renderConfirmation.js'
import { missingConfig, supabaseAdmin } from './_lib/supabaseAdmin.js'
import {
  CONTACT_PHONE,
  COUPLE,
  PLACEHOLDER,
  VENUES,
  WEDDING_DATE,
} from '../src/lib/eventDetails.js'
import { MAX_PARTY_SIZE } from '../src/lib/rsvpLimits.js'

const FROM = `${COUPLE} <rsvp@pookiesparty.com>`
const RESEND_ENDPOINT = 'https://api.resend.com/emails'

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

async function sendOne(group, apiKey) {
  const { subject, html, text } = renderConfirmation(group, {
    couple: COUPLE,
    weddingDate: WEDDING_DATE,
    contactPhone: CONTACT_PHONE,
    venues: VENUES,
  })

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ from: FROM, to: [group.email], subject, html, text }),
  })

  if (!response.ok) {
    throw new Error(`Resend responded ${response.status}: ${await response.text()}`)
  }

  const { id } = await response.json()
  return id
}

export async function POST(request) {
  const missing = missingConfig()
  if (missing.length || !process.env.RESEND_API_KEY) {
    if (!process.env.RESEND_API_KEY) missing.push('RESEND_API_KEY')
    console.error('send-rsvp-confirmation: missing env vars', missing)
    return json({ error: 'Email is not configured.' }, 500)
  }

  let partyId
  try {
    ;({ partyId } = await request.json())
  } catch {
    return json({ error: 'Malformed JSON body.' }, 400)
  }

  if (typeof partyId !== 'string' || !partyId) {
    return json({ error: 'partyId is required.' }, 400)
  }

  const admin = supabaseAdmin()

  // The site has no guest login, so anyone can call this. What keeps it from
  // being abused is that each party is emailed at most once: stamping
  // confirmation_sent_at claims the unsent rows atomically, so a repeat or
  // concurrent call finds nothing left to send.
  //
  // Recipients come from the database, never from the request body, so this
  // endpoint cannot be used to email anyone who is not already a guest.
  const { data: claimed, error: lookupError } = await admin
    .from('guests')
    .update({ confirmation_sent_at: new Date().toISOString() })
    .eq('party_id', partyId)
    .is('confirmation_sent_at', null)
    .select('id, name, email, is_primary, attending_ceremony, attending_reception')

  if (lookupError) {
    console.error('send-rsvp-confirmation: lookup failed', lookupError)
    return json({ error: 'Could not load the party.' }, 500)
  }
  if (!claimed?.length) return json({ error: 'Party not found.' }, 404)

  const rows = [...claimed].sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
  if (rows.length > MAX_PARTY_SIZE) {
    console.error('send-rsvp-confirmation: party over cap', partyId, rows.length)
    return json({ error: 'Party too large.' }, 400)
  }

  if ([WEDDING_DATE, CONTACT_PHONE].includes(PLACEHOLDER)) {
    console.warn(
      'send-rsvp-confirmation: sending with unfilled placeholders in eventDetails.js',
    )
  }

  const groups = groupByEmail(rows)
  const results = await Promise.allSettled(
    groups.map((group) => sendOne(group, process.env.RESEND_API_KEY)),
  )

  // Mirror the outcome onto the rows. Resend's own logs are only retained for
  // 30 days on the free plan, which is shorter than the RSVP window.
  const sentAt = new Date().toISOString()
  await Promise.allSettled(
    groups.map((group, index) => {
      const result = results[index]
      const ids = group.people.map((person) => person.id)
      return admin
        .from('guests')
        .update(
          result.status === 'fulfilled'
            ? {
                confirmation_sent_at: sentAt,
                confirmation_email_id: result.value,
                confirmation_status: 'sent',
              }
            : { confirmation_sent_at: sentAt, confirmation_status: 'failed' },
        )
        .in('id', ids)
    }),
  )

  const failures = results.filter((r) => r.status === 'rejected')
  for (const failure of failures) {
    console.error('send-rsvp-confirmation: send failed', failure.reason?.message)
  }

  return json({ sent: results.length - failures.length, failed: failures.length })
}
