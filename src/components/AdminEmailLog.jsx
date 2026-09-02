import { useMemo, useState } from 'react'
import { useGuests } from '../hooks/useGuests'
import { buildEmailLog, matchesEmailSearch, summarizeEmailLog } from '../lib/emailLog'
import { CONFIRMATION_LABELS, NEVER_SENT, isAlertStatus } from '../lib/confirmationStatus'
import { StatCards } from './StatCards'

/**
 * One row per confirmation email: when it went out, to which address, and who
 * it covered.
 *
 * Derived from the guest rows rather than a log table of its own, so it shows
 * the current state of each send rather than a history of attempts. The row
 * that matters most is the one that is not really a send at all -- an RSVP
 * whose confirmation never fired leaves no trace anywhere else, so it is listed
 * here as "Never sent" and sorted to the top.
 */
export function AdminEmailLog() {
  const { guests, loading, error } = useGuests()
  const [search, setSearch] = useState('')

  const entries = useMemo(() => buildEmailLog(guests), [guests])
  const visible = useMemo(
    () => entries.filter((entry) => matchesEmailSearch(entry, search)),
    [entries, search],
  )

  // The figures describe the whole log, not the filtered view: a count that
  // moved with the search box would be useless as a health check.
  const stats = useMemo(() => summarizeEmailLog(entries), [entries])

  return (
    <main className="admin-dashboard">
      <h1 className="admin-page-title">Email Log</h1>
      {!loading && !error && <StatCards stats={stats} />}

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Search by email or name…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="admin-search"
        />
      </div>

      {loading && <p className="status-message">Loading email log…</p>}
      {error && <p className="login-error">{error}</p>}

      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table email-log-table">
            <thead>
              <tr>
                <th>Sent</th>
                <th>To</th>
                <th>Recipients</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((entry) => (
                <tr key={entry.key}>
                  <td>
                    {entry.sentAt ? (
                      new Date(entry.sentAt).toLocaleString()
                    ) : (
                      /* An em dash alone would read as "no data". The RSVP date
                         says how long this has been waiting, which is the thing
                         worth knowing about a confirmation that never went. */
                      <span className="email-log-muted">
                        RSVP&apos;d {new Date(entry.submittedAt).toLocaleDateString()}
                      </span>
                    )}
                  </td>
                  <td className="email-log-address">{entry.email}</td>
                  <td>{entry.recipients.join(', ')}</td>
                  <td className={isAlertStatus(entry.status) ? 'email-log-alert' : undefined}>
                    {CONFIRMATION_LABELS[entry.status] ?? CONFIRMATION_LABELS[NEVER_SENT]}
                  </td>
                </tr>
              ))}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={4} className="admin-table-empty">
                    {entries.length === 0 ? 'No emails yet.' : 'No emails found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
