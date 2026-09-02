/**
 * The shared vocabulary for a confirmation email's delivery state.
 *
 * Both admin views read from here, so a status can never read one way in the
 * guest table and another in the email log.
 */

/* Client-side only. `confirmation_status` is null until a send is attempted,
   and the log renders that as a state of its own rather than a blank cell --
   an RSVP that never triggered an email is the thing most worth seeing. */
export const NEVER_SENT = 'never'

export const CONFIRMATION_LABELS = {
  [NEVER_SENT]: 'Never sent',
  sent: 'Sent',
  delivered: 'Delivered',
  bounced: 'Bounced ⚠',
  complained: 'Marked as spam',
  failed: 'Failed ⚠',
}

/**
 * How much attention each state deserves, worst highest.
 *
 * Deliberately not the same ordering as the webhook's RANK, which answers a
 * different question -- whether a late event may overwrite an earlier one.
 * That one describes progression through a delivery; this one describes
 * severity, which is why `never` tops it and `delivered` sits at the bottom.
 *
 * Used to collapse a group whose rows disagree. They are written together by
 * both handlers so they normally agree; where they do not, a partial bounce
 * must not hide behind a delivered.
 */
export const STATUS_SEVERITY = {
  delivered: 0,
  sent: 1,
  complained: 2,
  bounced: 3,
  failed: 3,
  [NEVER_SENT]: 4,
}

/** The states an admin has to do something about. */
export const isAlertStatus = (status) => STATUS_SEVERITY[status] >= 2
