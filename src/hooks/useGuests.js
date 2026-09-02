import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

/**
 * The guest list, kept live.
 *
 * Both admin views read the same rows -- the table shows them per person, the
 * email log groups them per send -- so the fetch and the realtime subscription
 * live here rather than in either page.
 */

/* The initial fetch and the subscription race each other. A row inserted while
   the select is in flight arrives as an event first and is then absent from
   the response, so taking the response wholesale would drop it; keeping the
   rows the fetch does not know about preserves it either way. */
const mergeById = (base, extra) => {
  const seen = new Set(base.map((row) => row.id))
  return [...base, ...extra.filter((row) => !seen.has(row.id))]
}

export function useGuests() {
  const [guests, setGuests] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

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
          setGuests((prev) => mergeById(data, prev))
        }
        setLoading(false)
      })

    const channel = supabase
      .channel('guests-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'guests' }, (payload) => {
        setGuests((prev) => {
          if (payload.eventType === 'INSERT') {
            // The fetch may already carry this row, and realtime can replay an
            // event on reconnect, so an insert only counts if the row is new.
            // Without this the row renders twice and inflates every figure.
            return prev.some((guest) => guest.id === payload.new.id)
              ? prev
              : [...prev, payload.new]
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

  return { guests, loading, error }
}
