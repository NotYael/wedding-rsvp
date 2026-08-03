import { PasscodeForm } from './PasscodeForm'

/**
 * The guest passcode screen, built as the hero card with the tagline swapped
 * for the passcode form. Shares .hero-names and .hero-mark with HeroCard so the
 * wordmark and illustration stay identical across the two screens.
 */
export function GuestLogin({ onSubmit, error, submitting }) {
  return (
    <main className="guest-login">
      <h1 className="hero-names">Marco &amp; Alessandra</h1>
      <PasscodeForm onSubmit={onSubmit} error={error} submitting={submitting} />
      <img className="hero-mark" src="/couple.svg" alt="" width="273" height="251" />
    </main>
  )
}
