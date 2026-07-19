import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { downloadGuestsAsCsv, downloadGuestsAsPdf } from '../lib/guestExport'

const PARTY_COLORS = ['#f6d9d0', '#d9e4f5', '#dcefdc', '#f5e6c8', '#e6d9f2', '#d0f0ef']

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
  const [highlightParties, setHighlightParties] = useState(true)

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

  const filteredParties = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return parties
    return parties
      .map((party) => ({ ...party, members: party.members.filter((m) => m.name.toLowerCase().includes(term)) }))
      .filter((party) => party.members.length > 0)
  }, [parties, search])

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <h1>Guest List</h1>
      </header>

      <div className="admin-toolbar">
        <input
          type="search"
          placeholder="Search by name…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="admin-search"
        />
        <button type="button" onClick={() => setHighlightParties((v) => !v)}>
          {highlightParties ? 'Turn off party highlighting' : 'Turn on party highlighting'}
        </button>
      </div>

      {loading && <p className="auth-status">Loading guest list…</p>}
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
          <button type="button" onClick={() => downloadGuestsAsPdf(parties)}>
            Download as PDF
          </button>
          <button type="button" onClick={() => downloadGuestsAsCsv(parties)}>
            Download as Sheet
          </button>
        </div>
      )}
    </main>
  )
}
