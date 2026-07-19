import { useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { PersonFields } from './PersonFields'

function makePerson(id) {
  return { id, name: '', email: '', phone: '', dietary: '' }
}

export function GuestRsvpForm() {
  const nextId = useRef(0)
  const [people, setPeople] = useState(() => [makePerson(0)])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const updatePerson = (id, field, value) => {
    setPeople((prev) => prev.map((person) => (person.id === id ? { ...person, [field]: value } : person)))
  }

  const addAttendee = () => {
    nextId.current += 1
    setPeople((prev) => [...prev, makePerson(nextId.current)])
  }

  const removeAttendee = (id) => {
    setPeople((prev) => prev.filter((person) => person.id !== id))
  }

  const copyPrimaryContact = (id) => {
    setPeople((prev) => {
      const primary = prev[0]
      return prev.map((person) =>
        person.id === id ? { ...person, email: primary.email, phone: primary.phone } : person,
      )
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    const partyId = crypto.randomUUID()
    const rows = people.map((person, index) => ({
      party_id: partyId,
      is_primary: index === 0,
      name: person.name.trim(),
      email: person.email.trim(),
      phone: person.phone.trim(),
      dietary_restrictions: person.dietary.trim() || null,
    }))

    const { error: insertError } = await supabase.from('guests').insert(rows)
    setSubmitting(false)

    if (insertError) {
      setError('Something went wrong submitting your RSVP. Please try again.')
      return
    }

    nextId.current = 0
    setPeople([makePerson(0)])
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="rsvp-success">
        <p>Thanks — your RSVP is in!</p>
        <button onClick={() => setSuccess(false)}>Submit another party</button>
      </div>
    )
  }

  return (
    <form className="rsvp-form" onSubmit={handleSubmit}>
      {people.map((person, index) => (
        <PersonFields
          key={person.id}
          person={person}
          index={index}
          isPrimary={index === 0}
          onChange={(field, value) => updatePerson(person.id, field, value)}
          onRemove={() => removeAttendee(person.id)}
          onCopyPrimary={() => copyPrimaryContact(person.id)}
        />
      ))}

      {error && <p className="login-error">{error}</p>}

      <div className="rsvp-form-actions">
        <button type="button" onClick={addAttendee}>
          + Add other attendees
        </button>
        <button type="submit" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit RSVP'}
        </button>
      </div>
    </form>
  )
}
