import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { ContactNote } from '../components/ContactNote'

export function RegistryPage() {
  const [gifts, setGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [claimingId, setClaimingId] = useState(null)
  const [claimName, setClaimName] = useState('')
  const [claimError, setClaimError] = useState('')
  const [claiming, setClaiming] = useState(false)

  useEffect(() => {
    let active = true

    supabase
      .from('gifts')
      .select('*')
      .order('created_at', { ascending: true })
      .then(({ data, error: fetchError }) => {
        if (!active) return
        if (fetchError) {
          setError('Could not load the gift registry.')
        } else {
          setGifts(data)
        }
        setLoading(false)
      })

    const channel = supabase
      .channel('gifts-guest')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'gifts' }, (payload) => {
        setGifts((prev) => {
          if (payload.eventType === 'INSERT') {
            return [...prev, payload.new]
          }
          if (payload.eventType === 'UPDATE') {
            return prev.map((gift) => (gift.id === payload.new.id ? payload.new : gift))
          }
          if (payload.eventType === 'DELETE') {
            return prev.filter((gift) => gift.id !== payload.old.id)
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

  const startClaim = (gift) => {
    setClaimingId(gift.id)
    setClaimName('')
    setClaimError('')
  }

  const cancelClaim = () => {
    setClaimingId(null)
    setClaimName('')
    setClaimError('')
  }

  const submitClaim = async (event, gift) => {
    event.preventDefault()
    setClaiming(true)
    setClaimError('')

    const { error: claimErr } = await supabase.rpc('claim_gift', {
      gift_id: gift.id,
      claimer_name: claimName.trim(),
    })

    setClaiming(false)

    if (claimErr) {
      if (claimErr.message?.includes('already_claimed')) {
        setClaimError('Sorry, someone just claimed this gift.')
      } else {
        setClaimError('Something went wrong. Please try again.')
      }
      return
    }

    setClaimingId(null)
    setClaimName('')
  }

  return (
    <div className="gift-registry">
      <div className="gift-registry-header">
        <h2>Gift Registry</h2>
        <p className="gift-registry-note">
          To claim a gift, please enter your FULL NAME. Names are only visible to the wedding planners and the
          couple — you'll remain anonymous to everyone else. Claimed gifts will appear with a strikethrough.
        </p>
      </div>

      {loading && <p className="status-message">Loading gift registry…</p>}
      {error && <p className="login-error">{error}</p>}

      {!loading && !error && (
        <ul className="gift-list">
          {gifts.map((gift) => {
            const isClaimed = Boolean(gift.claimed_by)
            return (
              <li key={gift.id} className={`gift-item${isClaimed ? ' claimed' : ''}`}>
                <div className="gift-item-details">
                  <p className="gift-name">{gift.name}</p>
                  {gift.description && <p className="gift-description">{gift.description}</p>}
                  {gift.link && (
                    <a href={gift.link} target="_blank" rel="noreferrer" className="gift-link">
                      View gift
                    </a>
                  )}
                </div>

                {!isClaimed && claimingId !== gift.id && (
                  <button type="button" onClick={() => startClaim(gift)}>
                    Claim
                  </button>
                )}

                {!isClaimed && claimingId === gift.id && (
                  <form className="gift-claim-form" onSubmit={(event) => submitClaim(event, gift)}>
                    <input
                      type="text"
                      placeholder="Your name"
                      required
                      value={claimName}
                      onChange={(event) => setClaimName(event.target.value)}
                      autoFocus
                    />
                    <div className="gift-claim-actions">
                      <button type="submit" disabled={claiming}>
                        {claiming ? 'Claiming…' : 'Confirm'}
                      </button>
                      <button type="button" onClick={cancelClaim}>
                        Cancel
                      </button>
                    </div>
                    {claimError && <p className="login-error">{claimError}</p>}
                  </form>
                )}

                {isClaimed && <span className="gift-claimed-tag">Claimed</span>}
              </li>
            )
          })}
          {gifts.length === 0 && <p>No gifts have been added yet — check back soon!</p>}
        </ul>
      )}

      <ContactNote />
    </div>
  )
}
