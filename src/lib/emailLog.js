import { NEVER_SENT, STATUS_SEVERITY, isAlertStatus } from './confirmationStatus'

/**
 * Collapse guest rows into one entry per confirmation email.
 *
 * A log entry is one (party, address) pair, because that is exactly one send:
 * `api/_lib/groupByEmail.js` builds its recipient list the same way, so the
 * same address in two different parties was two separate emails and gets two
 * rows here. The normalization has to match that module -- trim and lowercase
 * -- or the log would split a group the sender treated as one.
 *
 * Rows with no address are skipped for the same reason the sender skips them:
 * no email was ever addressed to them.
 */

const normalize = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '')

/* NUL cannot appear in either half, so it cannot collide the way ':' could
   with an address that contains one. */
const keyFor = (partyId, email) => `${partyId}\u0000${email}`

const laterOf = (a, b) => (!a || (b && b > a) ? b : a)
const earlierOf = (a, b) => (!a || (b && b < a) ? b : a)

const severity = (status) => STATUS_SEVERITY[status] ?? -1

/* What the row is dated by. Both values are Postgres timestamps in the same
   format, so they order correctly against each other as plain strings. */
const activityAt = (entry) => entry.sentAt ?? entry.submittedAt ?? ''

/* The rows behind one entry are written together by both handlers, so they
   normally agree. Where they do not, the worst one shows: a partial bounce
   must not hide behind a sibling row that was delivered. */
const worstOf = (statuses) =>
  statuses.reduce((worst, status) => (severity(status) > severity(worst) ? status : worst), null)

export function buildEmailLog(guests) {
  const entries = new Map()

  for (const guest of guests) {
    const email = normalize(guest.email)
    if (!email) continue

    const key = keyFor(guest.party_id, email)
    if (!entries.has(key)) {
      entries.set(key, {
        key,
        email,
        partyId: guest.party_id,
        recipients: [],
        statuses: [],
        sentAt: null,
        submittedAt: null,
      })
    }

    const entry = entries.get(key)
    entry.recipients.push(guest.name)
    entry.sentAt = laterOf(entry.sentAt, guest.confirmation_sent_at)
    entry.submittedAt = earlierOf(entry.submittedAt, guest.created_at)
    // A null status means this row was never part of a send. Dropping it here
    // keeps it from dragging the entry down to `never` when a sibling did go out.
    if (guest.confirmation_status) entry.statuses.push(guest.confirmation_status)
  }

  const log = [...entries.values()].map(({ statuses, ...entry }) => ({
    ...entry,
    status: worstOf(statuses) ?? NEVER_SENT,
  }))

  /* One list, newest first, so the most recent email is always the top row.
     A send that never happened has no timestamp of its own, so it takes its
     place by the RSVP that should have triggered it -- which leaves it sitting
     chronologically where it belongs rather than at the very bottom. The
     "Never Sent" figure above the table is what makes an old gap findable. */
  return log.sort((a, b) => (activityAt(b) < activityAt(a) ? -1 : 1))
}

/**
 * The three figures above the log, in the order they are shown.
 *
 * "Sent" covers `delivered` too, so the figures stay a partition of the log --
 * every entry lands in exactly one of them. Delivery confirmation is not split
 * out because it only ever arrives from the Resend webhook, which makes it a
 * fact about whether that webhook is wired up rather than about the email. The
 * per-row Status column still names it where it is known.
 */
export function summarizeEmailLog(entries) {
  const count = (predicate) => entries.filter(predicate).length
  const isProblem = (entry) => isAlertStatus(entry.status) && entry.status !== NEVER_SENT

  return [
    { label: 'Sent', value: count((e) => e.status === 'sent' || e.status === 'delivered') },
    { label: 'Bounced or Spam', value: count(isProblem) },
    { label: 'Never Sent', value: count((e) => e.status === NEVER_SENT) },
  ]
}

/** Matches an entry against the search box: address or any recipient name. */
export function matchesEmailSearch(entry, term) {
  const needle = term.trim().toLowerCase()
  if (!needle) return true
  if (entry.email.includes(needle)) return true
  return entry.recipients.some((name) => name.toLowerCase().includes(needle))
}
