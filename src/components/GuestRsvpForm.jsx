import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient'
import { PersonFields } from './PersonFields'
import { ContactNote } from './ContactNote'

function makePerson(id) {
  return { id, name: '', email: '', phone: '', dietary: '' }
}

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

const isValidPhone = (value) => {
  const digitsOnly = value.replace(/[\s()+\-.]/g, '')
  return /^\d{7,15}$/.test(digitsOnly)
}

export function GuestRsvpForm() {
  const nextId = useRef(0)
  const [people, setPeople] = useState(() => [makePerson(0)])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const updatePerson = (id, field, value) => {
    setPeople((prev) => prev.map((person) => (person.id === id ? { ...person, [field]: value } : person)))
    setFieldErrors((prev) => {
      const key = `${id}-${field}`
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })
  }

  const addAttendee = () => {
    nextId.current += 1
    setPeople((prev) => [...prev, makePerson(nextId.current)])
  }

  const removeAttendee = (id) => {
    setPeople((prev) => prev.filter((person) => person.id !== id))
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[`${id}-name`]
      delete next[`${id}-email`]
      delete next[`${id}-phone`]
      return next
    })
  }

  const copyPrimaryContact = (id) => {
    setPeople((prev) => {
      const primary = prev[0]
      return prev.map((person) =>
        person.id === id ? { ...person, email: primary.email, phone: primary.phone } : person,
      )
    })
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next[`${id}-email`]
      delete next[`${id}-phone`]
      return next
    })
  }

  const validate = () => {
    const errors = {}
    people.forEach((person) => {
      if (!person.name.trim()) errors[`${person.id}-name`] = true
      if (!isValidEmail(person.email)) errors[`${person.id}-email`] = true
      if (!isValidPhone(person.phone)) errors[`${person.id}-phone`] = true
    })
    return errors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Please double-check the highlighted fields — some emails or phone numbers look invalid.')
      return
    }
    setFieldErrors({})
    setSubmitting(true)

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
    setFieldErrors({})
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="rsvp-success">
        <p>
          Your RSVP is in! If anything changes or you have questions, feel free to reach out to TEST NAME at
          TEST PHONE or TEST GMAIL, or contact Ate Alix or Marco directly.
        </p>
        <p>
          While you're here, take a look at the <Link to="/registry">Gift Registry</Link> for a few things the
          couple would love, check out the <Link to="/trip">Trip</Link> page for the group itinerary everyone's
          invited to join, and visit <Link to="/details">Wedding Details &amp; FAQs</Link> if anything else
          comes up.
        </p>
        <button className="btn-primary" onClick={() => setSuccess(false)}>
          Submit another party
        </button>
      </div>
    )
  }

  return (
    <>
      <form className="rsvp-form" onSubmit={handleSubmit} noValidate>
        {people.map((person, index) => (
          <PersonFields
            key={person.id}
            person={person}
            index={index}
            isPrimary={index === 0}
            onChange={(field, value) => updatePerson(person.id, field, value)}
            onRemove={() => removeAttendee(person.id)}
            onCopyPrimary={() => copyPrimaryContact(person.id)}
            nameInvalid={Boolean(fieldErrors[`${person.id}-name`])}
            emailInvalid={Boolean(fieldErrors[`${person.id}-email`])}
            phoneInvalid={Boolean(fieldErrors[`${person.id}-phone`])}
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

      <ContactNote />
    </>
  )
}
