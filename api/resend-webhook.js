import { Webhook } from 'svix'
import { missingConfig, supabaseAdmin } from './_lib/supabaseAdmin.js'

/**
 * Receives Resend delivery events and mirrors them onto the guest rows.
 *
 * A silent bounce is the expensive failure here: the guest believes they are
 * confirmed, we believe they are informed, and nobody finds out until the
 * seating chart. This makes it a visible flag in the admin table instead.
 */

const STATUS_BY_EVENT = {
  'email.delivered': 'delivered',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
}

/* Events can arrive out of order and Resend delivers at-least-once, so a late
   `delivered` must not overwrite a `bounced`. Higher wins. */
const RANK = { sent: 0, delivered: 1, complained: 2, bounced: 3 }

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  })

export async function POST(request) {
  const missing = missingConfig()
  if (missing.length || !process.env.RESEND_WEBHOOK_SECRET) {
    if (!process.env.RESEND_WEBHOOK_SECRET) missing.push('RESEND_WEBHOOK_SECRET')
    console.error('resend-webhook: missing env vars', missing)
    return json({ error: 'Webhook is not configured.' }, 500)
  }

  // Signature verification needs the raw body, before any JSON parsing.
  const payload = await request.text()

  let event
  try {
    event = new Webhook(process.env.RESEND_WEBHOOK_SECRET).verify(payload, {
      'svix-id': request.headers.get('svix-id'),
      'svix-timestamp': request.headers.get('svix-timestamp'),
      'svix-signature': request.headers.get('svix-signature'),
    })
  } catch (error) {
    console.error('resend-webhook: signature verification failed', error?.message)
    return json({ error: 'Invalid signature.' }, 401)
  }

  const status = STATUS_BY_EVENT[event.type]
  const emailId = event.data?.email_id

  // Events we do not track (opened, clicked, delivery_delayed) are still a
  // success -- returning non-2xx would make Resend retry them forever.
  if (!status || !emailId) return json({ ok: true, ignored: event.type })

  const admin = supabaseAdmin()
  const { data: rows, error: lookupError } = await admin
    .from('guests')
    .select('id, confirmation_status')
    .eq('confirmation_email_id', emailId)

  if (lookupError) {
    console.error('resend-webhook: lookup failed', lookupError)
    return json({ error: 'Lookup failed.' }, 500)
  }
  if (!rows?.length) return json({ ok: true, matched: 0 })

  const ids = rows
    .filter((row) => RANK[status] > (RANK[row.confirmation_status] ?? -1))
    .map((row) => row.id)

  if (!ids.length) return json({ ok: true, matched: rows.length, updated: 0 })

  const { error: updateError } = await admin
    .from('guests')
    .update({ confirmation_status: status })
    .in('id', ids)

  if (updateError) {
    console.error('resend-webhook: update failed', updateError)
    return json({ error: 'Update failed.' }, 500)
  }

  return json({ ok: true, matched: rows.length, updated: ids.length })
}
