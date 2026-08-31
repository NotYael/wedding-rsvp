# RSVP Confirmation Email — Design

**Date:** 2026-08-31
**Status:** Approved. Two content values ship as blank placeholders (see Placeholder Values).

## Goal

When a party submits an RSVP, send each unique email address in that party a confirmation listing the RSVPs recorded against that address, plus event details and a contact number.

## Decisions

| Question | Decision |
|---|---|
| Host | Vercel Function (project already deploys to Vercel) |
| Provider | Resend (`pookiesparty.com` verified 2026-08-31) |
| Recipients | Group by unique email; one email per address, listing every person who used it |
| Content | Confirmation + event details + PSA footer |
| PSA | Phone number only; no `reply_to` set |
| Endpoint protection | Verify `party_id` exists in Supabase before sending |
| Bounce tracking | In scope — Resend webhook writes status back to the guest row |

## Architecture

```
Browser — GuestRsvpForm.handleSubmit
  1. supabase.from('guests').insert(rows)     unchanged, source of truth
  2. setSuccess(true)                          unchanged, never gated on email
  3. POST /api/send-rsvp-confirmation          new, non-blocking
        |
        v
  Vercel Function (Node)
    verify party_id -> group by email -> render -> Resend API -> write back
        |
        v
  Resend --(delivery events)--> POST /api/resend-webhook -> write back
```

The insert path is untouched. Email is strictly additive and cannot fail an RSVP.

## Components

### `src/lib/eventDetails.js` (new)

Extract the `VENUES` array currently hardcoded in `src/components/home/DetailsCard.jsx`, plus couple names, wedding date, and contact phone. Exported as plain data.

Consumed by both `DetailsCard.jsx` and the email renderer, so venue/time changes happen in one place. `DetailsCard` imports it; no visual change.

```js
export const COUPLE = 'Marco & Alessandra'
export const RSVP_DEADLINE = 'February 9, 2027'
export const VENUES = [ /* moved verbatim from DetailsCard */ ]

// TODO: fill in the wedding date before the first real send
export const WEDDING_DATE = '______'

// TODO: fill in the contact number for the confirmation email footer
export const CONTACT_PHONE = '______'
```

Both unset values are `______` so they are greppable, and both carry a `TODO`
comment. Changing them later is a one-line edit in one file.

### `api/_lib/groupByEmail.js` (new)

Pure function. Party rows in, `[{ email, people: [...] }]` out, keyed on the lowercased/trimmed address.

This is where the recipient rule lives:

- 3 people sharing 1 address → 1 email listing 3 RSVPs
- 3 people across 2 addresses (1 + 2) → 2 emails, one listing 1 and one listing 2

No HTTP, no Resend, no Supabase. Directly unit-testable.

### `api/_lib/renderConfirmation.js` (new)

Pure function. `(group, eventDetails) -> { subject, html, text }`.

- Subject: `Your RSVP is confirmed — Marco & Alessandra`
- Body: greeting, table of names × events attending, venue/date block, PSA footer
- Inline styles only. Email clients drop `<style>` blocks unpredictably.
- Always emit a `text` alternative alongside `html` — improves deliverability and is what some clients render.

### `api/send-rsvp-confirmation.js` (new)

The handler. Thin by design — all logic lives in the two pure functions above.

1. Reject non-POST.
2. Validate payload shape; reject parties over a sane cap (e.g. 20 people).
3. Verify the `party_id` exists in `guests` using the service-role client, and build the recipient set **from the database rows, not from the request body**.
4. `groupByEmail` → `renderConfirmation` → one Resend call per group via `Promise.allSettled`.
5. Write back `confirmation_sent_at`, `confirmation_email_id`, `confirmation_status = 'sent'` on each row.
6. Return 200 `{ sent, failed }` even on partial failure.

### `api/resend-webhook.js` (new)

Receives Resend delivery events. Verifies the Svix signature, maps `email.delivered` / `email.bounced` / `email.complained` onto `confirmation_status` by looking up `confirmation_email_id`.

Resend guarantees **at-least-once** delivery, so the handler must be idempotent — dedupe on `svix-id`, or treat the write as a last-writer-wins status update.

### `src/components/GuestRsvpForm.jsx` (modified)

After a successful insert, fire the POST. Do not `await` it in a way that delays the success screen, and swallow failures — the guest has already seen "Your RSVP is in", and a red banner after the fact is worse than a missing email.

### `src/components/AdminGuestTable.jsx` (modified)

Add a confirmation-status column so a bounced or never-sent confirmation is visible at a glance.

## Data model

`public.guests` currently has: `id`, `party_id`, `is_primary`, `name`, `email`, `phone`, `dietary_restrictions`, `created_at`, `attending_ceremony`, `attending_reception`. RLS enabled, 9 rows.

Migration (create via `supabase migration new add_confirmation_tracking`):

```sql
alter table public.guests
  add column confirmation_sent_at timestamptz,
  add column confirmation_email_id text,
  add column confirmation_status text
    check (confirmation_status in ('sent','delivered','bounced','complained','failed'));

create index guests_confirmation_email_id_idx
  on public.guests (confirmation_email_id);
```

### Why the writeback needs the service role

Existing policies on `guests`:

| Policy | Cmd | Roles | Predicate |
|---|---|---|---|
| `guests_insert_by_guest_role` | INSERT | authenticated | `app_metadata.role = 'guest'` |
| `guests_select_by_admin_role` | SELECT | authenticated | `app_metadata.role = 'admin'` |

There is **no UPDATE policy and no SELECT policy for guests**. A guest session can neither read back its own rows nor update them. Both the `party_id` verification (a SELECT) and the status writeback (an UPDATE) must run under the service role, which bypasses RLS.

**No policy changes are required.** The admin SELECT policy already covers reading the new columns in the admin table.

The existing policies correctly key off `app_metadata` rather than the user-editable `user_metadata`. Leave that as is.

## Security

The endpoint is public and sends email from a verified domain, so an unprotected version would let anyone spam arbitrary addresses and burn `pookiesparty.com`'s sending reputation. Two layers:

1. **Recipients come from the database, never the request body.** The request supplies only a `party_id`; the function looks up that party and emails the addresses on those rows. The endpoint is then physically incapable of emailing anyone not already in the guest list.
2. **Require the guest session.** The client already holds a Supabase session (`AuthProvider`) with `app_metadata.role = 'guest'`. Send the access token as a bearer header and verify it server-side. Roughly five lines, and it rejects anonymous callers before the database is touched.

`SUPABASE_SECRET_KEY` lives only in Vercel env vars and is referenced only inside `api/`. It must never appear in a `VITE_`-prefixed variable, which would ship it to the browser.

The webhook endpoint verifies its Svix signature; without that, anyone could mark confirmations as delivered.

## Error handling

| Failure | Behavior |
|---|---|
| Insert fails | Existing behavior, unchanged. No email attempted. |
| Email endpoint unreachable | Success screen still shows. Logged client-side only. |
| One group's send fails | Other groups still send. Row marked `failed`. |
| `party_id` not found | 404, no email. Indicates a bug or an abuse attempt. |
| Resend rate limit (100/day) | Send fails, row marked `failed`, visible in admin table. |

## Testing

The project has no test runner today. Vitest is a small addition given Vite is already present, and the two pure functions are exactly what's worth testing:

- `groupByEmail` — the 1-email, 2-email, and 3-people-2-emails cases from the recipient rule above; case and whitespace normalization.
- `renderConfirmation` — snapshot of subject/text for a one-person and a three-person group.
- `eventDetails` — no exported value still contains a `______` placeholder (see Placeholder Values).

The handlers are thin enough to verify manually against a real send.

## Configuration

| Name | Where | Notes |
|---|---|---|
| `RESEND_API_KEY` | Vercel env | Server-side only |
| `SUPABASE_SECRET_KEY` | Vercel env | Server-side only, never `VITE_` |
| `RESEND_WEBHOOK_SECRET` | Vercel env | Svix signing secret |
| From address | code | `Marco & Alessandra <rsvp@pookiesparty.com>` |

DNS for `pookiesparty.com` is verified in Resend as of 2026-08-31 (MX + SPF on `send`, DKIM on `resend._domainkey`, managed in Vercel DNS).

**Verify before merging:** the catch-all rewrite in `vercel.json` (`/(.*)` → `/index.html`) must not intercept `/api/*`. Vercel checks the filesystem before applying rewrites, so this should work as-is, but it is the first thing to test on a preview deployment.

Local development note: `vite dev` does not run Vercel Functions. Use `vercel dev` when working on the email path.

## Out of scope

- Notifying the couple on each RSVP (not requested).
- Resending a confirmation from the admin UI. The schema leaves room for it.
- Dietary restrictions and attire in the email body.
- Reading history from Resend. Free-tier log retention is 30 days, shorter than the RSVP window, which is why status is mirrored into `guests` instead.

## Placeholder values

Two pieces of email content are not yet known and ship as `______` placeholders
in `src/lib/eventDetails.js`:

| Constant | What it is | Why it's blank |
|---|---|---|
| `WEDDING_DATE` | The date of the wedding | Not present anywhere in the codebase. `RsvpCard.jsx` has only the RSVP-by date of February 9, 2027; `DetailsCard.jsx` has ceremony/reception times but no date. |
| `CONTACT_PHONE` | Number in the PSA footer | Not yet supplied. |

Both are single-line edits in one file, marked with `TODO` and greppable as
`______`.

### Guard against shipping a placeholder

A `______` reaching a guest's inbox is the failure mode worth preventing, and
the PSA footer is the one part of the email that matters most when something has
gone wrong. Two cheap guards:

- A unit test asserting no exported value in `eventDetails.js` contains `______`,
  skipped/expected-to-fail until the values are filled in.
- `send-rsvp-confirmation.js` logs a warning when it renders an email containing
  `______`, so a real send with placeholders is visible in Vercel's logs rather
  than silent.

Neither blocks development — they just make the omission loud.
