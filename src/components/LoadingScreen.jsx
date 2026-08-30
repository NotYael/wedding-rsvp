/**
 * The full-screen wait state RoleGate shows while the session resolves. Built
 * as a quieter hero card -- same olive field, script wordmark and couple mark
 * as GuestLogin -- so the first paint is already the site instead of a neutral
 * spinner.
 */
export function LoadingScreen({ label = 'Loading' }) {
  return (
    <main className="loading-screen">
      <div className="loading-screen-body">
        <img className="loading-mark" src="/couple.svg" alt="" width="273" height="251" />
        <h1 className="loading-names">Marco &amp; Alessandra</h1>
        <p className="loading-label" role="status">
          {label}
          <span className="loading-rule" aria-hidden="true" />
        </p>
      </div>
      {/* TODO: swap the blank for the contact person's name and number. */}
      <p className="loading-help">
        If this is taking longer than expected, please contact ____________.
      </p>
    </main>
  )
}
