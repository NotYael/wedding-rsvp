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

const FROM = `${COUPLE} <rsvp@pookiesparty.com>`
const RESEND_ENDPOINT = 'https://api.resend.com/emails'

/** A party this size is a data-entry accident or an abuse attempt, not a family. */
const MAX_PARTY_SIZE = 20

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

  // Only a signed-in guest may trigger a send. This rejects anonymous callers
  // before the database is touched.
  const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!token) return json({ error: 'Not authorized.' }, 401)

  const { data: auth, error: authError } = await admin.auth.getUser(token)
  if (authError || auth?.user?.app_metadata?.role !== 'guest') {
    return json({ error: 'Not authorized.' }, 401)
  }

  // Recipients come from the database, never from the request body, so this
  // endpoint cannot be used to email anyone who is not already a guest.
  const { data: rows, error: lookupError } = await admin
    .from('guests')
    .select('id, name, email, attending_ceremony, attending_reception')
    .eq('party_id', partyId)
    .order('is_primary', { ascending: false })

  if (lookupError) {
    console.error('send-rsvp-confirmation: lookup failed', lookupError)
    return json({ error: 'Could not load the party.' }, 500)
  }
  if (!rows?.length) return json({ error: 'Party not found.' }, 404)
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
