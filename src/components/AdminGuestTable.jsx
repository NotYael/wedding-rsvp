import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { downloadGuestsAsCsv, downloadGuestsAsPdf } from '../lib/guestExport'
import { countActiveFilters, describeFilters, matchesFilters } from '../lib/guestFilters'
import { AdminGuestFilters } from './AdminGuestFilters'
import { StatCards } from './StatCards'

/* Translucent washes rather than the flat pastels this used to use. The table
   is cream text on #15221F now, so an opaque pastel fill would leave the row
   unreadable; at these alphas the hue still separates one party from the next
   while the row stays dark enough to read. */
const PARTY_COLORS = [
  'rgba(233, 214, 190, 0.10)',
  'rgba(162, 64, 21, 0.26)',
  'rgba(120, 152, 132, 0.20)',
  'rgba(214, 168, 92, 0.16)',
  'rgba(142, 120, 172, 0.20)',
  'rgba(90, 160, 155, 0.18)',
]

function groupByParty(guests) {
  const parties = new Map()
  for (const guest of guests) {
    if (!parties.has(guest.party_id)) {
      parties.set(guest.party_id, [])
    }
    parties.get(guest.party_id).push(guest)
  }

  const partyList = Array.from(parties.entries()).map(([partyId, members]) => {
    const sortedMembers = [...members].sort((a, b) => Number(b.is_primary) - Number(a.is_primary))
    const latest = members.reduce((max, m) => (m.created_at > max ? m.created_at : max), members[0].created_at)
    return { partyId, members: sortedMembers, latest }
  })

  partyList.sort((a, b) => (a.latest < b.latest ? 1 : -1))
  return partyList
}

export function AdminGuestTable() {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({})
  const [highlightParties, setHighlightParties] = useState(true)

  const toggleFilter = (key, checked) => setFilters((prev) => ({ ...prev, [key]: checked }))
  const clearFilters = () => setFilters({})

  useEffect(() => {
    let active = true

    supabase
      .from('guests')
      .select('*')
      .then(({ data, error: fetchError }) => {
        if (!active) return
        if (fetchError) {
          setError('Could not load the guest list.')
        } else {
          setGuests(data)
        }
        setLoading(false)
      })

    const channel = supabase
      .channel('guests-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, (payload) => {
        setGuests((prev) => {
          if (payload.eventType === 'INSERT') {
            return [...prev, payload.new]
          }
          if (payload.eventType === 'UPDATE') {
            return prev.map((guest) => (guest.id === payload.new.id ? payload.new : guest))
          }
          if (payload.eventType === 'DELETE') {
            return prev.filter((guest) => guest.id !== payload.old.id)
          }
          return prev
        })
      })
      .subscribe()

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [])

  const parties = useMemo(() => groupByParty(guests), [guests])

  const partyColors = useMemo(() => {
    const map = new Map()
    parties.forEach((party, index) => {
      map.set(party.partyId, PARTY_COLORS[index % PARTY_COLORS.length])
    })
    return map
  }, [parties])

  /* Search and filters narrow the same way: they drop individual members, and a
     party whose members all fall away drops out with them. A party is never
     kept whole just because one of its guests matched. */
  const filteredParties = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term && countActiveFilters(filters) === 0) return parties
    return parties
      .map((party) => ({
        ...party,
        members: party.members.filter(
          (m) => (!term || m.name.toLowerCase().includes(term)) && matchesFilters(m, filters),
        ),
      }))
      .filter((party) => party.members.length > 0)
  }, [parties, search, filters])

  /* Null when nothing is narrowing the table, which is what tells the exports
     to skip the note and drop "-filtered" from the filename. The search term
     belongs here too: it is as much a part of what the table is showing. */
  const filterNote = describeFilters(filters, search)

  /* The three attendance figures are mutually exclusive, so they sum to the
     guests who said yes to at least one event -- not to Total Guests, which
     also counts anyone down for neither. Dietary Needs cuts across all three:
     it is a head count for the caterer, not a share of the figures beside it. */
  const stats = useMemo(() => {
    const count = (predicate) => guests.filter(predicate).length
    return [
      { label: 'Total Guests', value: guests.length },
      { label: 'Parties', value: parties.length },
      { label: 'Ceremony Only', value: count((g) => g.attending_ceremony && !g.attending_reception) },
      { label: 'After Party Only', value: count((g) => !g.attending_ceremony && g.attending_reception) },
      { label: 'Going to Both', value: count((g) => g.attending_ceremony && g.attending_reception) },
      /* The form stores an empty box as null, but rows written before it did
         hold '', and a row of spaces counts as nothing said either. */
      { label: 'Dietary Needs', value: count((g) => g.dietary_restrictions?.trim()) },
    ]
  }, [guests, parties])

  return (
    <main className="admin-dashboard">
      {/* The nav marks which page you are on, so the title is not repeated
          here -- but the page still needs one heading, hence the clipped h1
          rather than none at all. */}
      <h1 className="admin-page-title">Guest List</h1>
      {!loading && !error && <StatCards stats={stats} />}

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="admin-search"
        />
        <AdminGuestFilters active={filters} onToggle={toggleFilter} onClear={clearFilters} />
        <button
          type="button"
          className="admin-highlight-toggle"
          /* Absent rather than "false" when off, so CSS can match on [data-active]. */
          data-active={highlightParties || undefined}
          onClick={() => setHighlightParties((v) => !v)}
        >
          {/* The bolt is a phone-only affordance -- there the label is visually
              hidden so the control fits on the search field's line. The label
              stays in the DOM either way, because it is what names this button
              for a screen reader. */}
          <svg className="admin-highlight-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M13 2 4.5 13.5H11l-1 8.5L18.5 10.5H12z" />
          </svg>
          <span className="admin-highlight-text">
            {highlightParties ? 'Turn off party highlighting' : 'Turn on party highlighting'}
          </span>
        </button>
      </div>

      {loading && <p className="status-message">Loading guest list…</p>}
      {error && <p className="login-error">{error}</p>}

      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Role</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Dietary Restrictions</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {filteredParties.flatMap((party) => {
                const color = highlightParties ? partyColors.get(party.partyId) : undefined
                return party.members.map((guest) => (
                  <tr key={guest.id} style={color ? { backgroundColor: color } : undefined}>
                    <td>{guest.name}</td>
                    <td>{guest.is_primary ? 'Primary' : 'Attendee'}</td>
                    <td>{guest.email}</td>
                    <td>{guest.phone}</td>
                    <td>{guest.dietary_restrictions || '—'}</td>
                    <td>{new Date(guest.created_at).toLocaleString()}</td>
                  </tr>
                ))
              })}
              {filteredParties.length === 0 && (
                <tr>
                  <td colSpan={6} className="admin-table-empty">
                    No guests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && (
        <div className="admin-export-actions">
          {/* One shared label keeps both buttons short enough to sit on a single
              row at any width. It is hidden from assistive tech because each
              button carries the whole phrase itself -- "PDF" on its own is not
              an action, but reading the label too would say it twice. */}
          <span className="admin-export-label" aria-hidden="true">
            Download as:
          </span>
          {/* filteredParties, not parties: the file matches what is on screen,
              and filterNote states on the first line what was left out. */}
          <button
            type="button"
            aria-label="Download as PDF"
            onClick={() => downloadGuestsAsPdf(filteredParties, filterNote)}
          >
            PDF
          </button>
          <button
            type="button"
            aria-label="Download as Sheet"
            onClick={() => downloadGuestsAsCsv(filteredParties, filterNote)}
          >
            Sheet
          </button>
        </div>
      )}
    </main>
  )
}
