import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { StatCards } from '../components/StatCards'

const emptyForm = { name: '', description: '', link: '' }

export function AdminRegistryPage() {
  const [gifts, setGifts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)

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
      .channel('gifts-admin')
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

  const openAddForm = () => {
    setEditingId(null)
    setForm(emptyForm)
    setFormOpen(true)
  }

  const openEditForm = (gift) => {
    setEditingId(gift.id)
    setForm({ name: gift.name, description: gift.description || '', link: gift.link || '' })
    setFormOpen(true)
  }

  const closeForm = () => {
    setFormOpen(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      link: form.link.trim() || null,
    }

    const { error: saveError } = editingId
      ? await supabase.from('gifts').update(payload).eq('id', editingId)
      : await supabase.from('gifts').insert(payload)

    setSaving(false)

    if (saveError) {
      setError('Could not save the gift. Please try again.')
      return
    }

    closeForm()
  }

  const handleDelete = async (gift) => {
    if (!window.confirm(`Delete "${gift.name}" from the registry?`)) return
    const { error: deleteError } = await supabase.from('gifts').delete().eq('id', gift.id)
    if (deleteError) {
      setError('Could not delete the gift. Please try again.')
    }
  }

  const handleUnclaim = async (gift) => {
    const { error: unclaimError } = await supabase
      .from('gifts')
      .update({ claimed_by: null, claimed_at: null })
      .eq('id', gift.id)
    if (unclaimError) {
      setError('Could not unclaim the gift. Please try again.')
    }
  }

  const stats = useMemo(() => {
    const claimed = gifts.filter((gift) => gift.claimed_by).length
    return [
      { label: 'Total Gifts', value: gifts.length },
      { label: 'Unclaimed', value: gifts.length - claimed },
      { label: 'Claimed', value: claimed },
    ]
  }, [gifts])

  return (
    <main className="admin-dashboard">
      <header className="admin-header">
        <h1>Gift Registry</h1>
      </header>

      {!loading && !error && <StatCards stats={stats} />}

      <div className="admin-toolbar">
        <button type="button" onClick={formOpen ? closeForm : openAddForm}>
          {formOpen ? 'Cancel' : '+ Add Gift'}
        </button>
      </div>

      {formOpen && (
        <form className="gift-admin-form" onSubmit={handleSubmit}>
          <label htmlFor="gift-name">Name</label>
          <input
            id="gift-name"
            required
            value={form.name}
            onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
          />

          <label htmlFor="gift-description">Description</label>
          <textarea
            id="gift-description"
            value={form.description}
            onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))}
          />

          <label htmlFor="gift-link">Link</label>
          <input
            id="gift-link"
            type="url"
            placeholder="https://…"
            value={form.link}
            onChange={(event) => setForm((f) => ({ ...f, link: event.target.value }))}
          />

          <button type="submit" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Gift'}
          </button>
        </form>
      )}

      {loading && <p className="status-message">Loading gift registry…</p>}
      {error && <p className="login-error">{error}</p>}

      {!loading && !error && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Link</th>
                <th>Claimed By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {gifts.map((gift) => (
                <tr key={gift.id}>
                  <td>{gift.name}</td>
                  <td>{gift.description || '—'}</td>
                  <td>
                    {gift.link ? (
                      <a href={gift.link} target="_blank" rel="noreferrer">
                        View
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>{gift.claimed_by || '—'}</td>
                  <td className="admin-table-actions">
                    <button type="button" onClick={() => openEditForm(gift)}>
                      Edit
                    </button>
                    {gift.claimed_by && (
                      <button type="button" onClick={() => handleUnclaim(gift)}>
                        Unclaim
                      </button>
                    )}
                    <button type="button" onClick={() => handleDelete(gift)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {gifts.length === 0 && (
                <tr>
                  <td colSpan={5} className="admin-table-empty">
                    No gifts added yet.
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
