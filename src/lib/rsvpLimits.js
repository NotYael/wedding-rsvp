/**
 * How many people one RSVP may cover.
 *
 * Enforced in two places on purpose. The form checks it so a guest is told
 * before they fill anything in; the send endpoint checks it again against rows
 * read back from the database, because the insert goes straight to Supabase and
 * never passes through our server. The browser cap is a courtesy, not a
 * control.
 *
 * Ten rather than a rounder twenty because a party's confirmation fans out to
 * one Resend call per distinct address, all fired at once. Resend allows ten
 * requests a second per team, so this brings a single party's worst case down
 * to exactly that ceiling instead of double it.
 */
export const MAX_PARTY_SIZE = 10
