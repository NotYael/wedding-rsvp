# Supabase Auth: Guest vs Admin Login — Design

## Context

The wedding RSVP site needs two separate login surfaces:
- Root (`/`): guest login, leads to the (future) RSVP experience.
- `/admin`: admin login, leads to the (future) RSVP list / stats dashboard.

There are exactly two Supabase Auth users for the entire app — one shared **guest** account (handed out to all invitees) and one shared **admin** account (used by the couple and other wedding planners). Neither side self-registers; both accounts are provisioned directly in Supabase.

This spec covers only the auth/login/route-gating layer. The RSVP form itself and the admin dashboard's data views are out of scope — they get placeholder screens for now.

## Security note on existing `.env`

The current `.env` contains a key labeled `SUPABASE_ANON_KEY` whose value is in the `sb_secret_...` format — Supabase's secret key (equivalent to the old `service_role` key, bypasses RLS). This must never ship to the browser. It's being replaced with the project's actual publishable key (`sb_publishable_...`), fetched directly from the Supabase project.

Vite only exposes env vars prefixed `VITE_` to client code, so the corrected `.env` uses:
```
VITE_SUPABASE_URL=https://nptfoidlmwrhnqdprqoe.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

## Auth model

- Two fixed Supabase Auth users, created via SQL against `auth.users` (not public sign-up; sign-up is not exposed anywhere in the app):
  - Guest: internal email `guest@wedding-rsvp.internal`, `app_metadata.role = 'guest'`.
  - Admin: internal email `admin@wedding-rsvp.internal`, `app_metadata.role = 'admin'`.
- `app_metadata` (as opposed to `user_metadata`) is only writable by a service-role context (SQL/admin API) — the client can never alter its own role, making this the source of truth for role checks.
- Both login screens are **passcode-only**: a single password field. Under the hood, submitting the passcode calls `supabase.auth.signInWithPassword({ email: <fixed internal email>, password: <passcode> })`. The user never sees or types an email/username.

## Route gating (guest ⇄ admin isolation)

- `/` (root):
  - Unauthenticated → passcode form.
  - Authenticated, `role: 'guest'` → placeholder guest home screen.
  - Authenticated, `role: 'admin'` → do not show guest content; show a small notice pointing to `/admin`.
- `/admin`:
  - Unauthenticated → passcode form.
  - Authenticated, `role: 'admin'` → placeholder admin dashboard screen.
  - Authenticated, `role: 'guest'` → sign out immediately, show "This passcode isn't valid here."
- The role check runs both right after a successful `signInWithPassword` call (before rendering anything past the login form) and on initial route load (covers a persisted session from a previous visit) — there's no window where the wrong role's content is shown.

## File structure

```
src/
  lib/
    supabaseClient.js       # Supabase client from VITE_ env vars
    authConstants.js        # GUEST_EMAIL, ADMIN_EMAIL constants
  context/
    AuthProvider.jsx        # session/role state via onAuthStateChange, useAuth() hook
  components/
    RoleGate.jsx             # renders children if session role matches expected role,
                              # otherwise renders a fallback and signs out on mismatch
  pages/
    GuestPage.jsx            # "/" — passcode form or guest placeholder, based on auth state
    AdminPage.jsx            # "/admin" — passcode form or admin placeholder, based on auth state
  App.jsx                    # react-router-dom routes: "/" -> GuestPage, "/admin" -> AdminPage
```

New dependencies: `@supabase/supabase-js`, `react-router-dom`.

## Error handling

- Wrong passcode → inline "Incorrect passcode, please try again." (generic message; doesn't reveal account existence).
- Role mismatch on a given route → immediate sign-out + "This passcode isn't valid here."
- Initial load → brief loading state while Supabase restores any existing session, to avoid a flash of the login form before redirect logic runs.
- Unexpected/network errors → generic "Something went wrong, please try again."

## Out of scope (future work)

- Actual RSVP submission form and its data table.
- Admin dashboard's real guest list / stats views.
- Any password-reset or self-service account flows (not needed — accounts are static and provisioned directly).

## Credentials

The guest and admin passcodes were provided directly by the user during design and will be used to provision the two Supabase Auth users during implementation. They are intentionally not recorded in this document.
