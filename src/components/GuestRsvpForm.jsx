import { useRef, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { PersonFields } from './PersonFields'
import { RSVP_EVENTS, eventsForPerson, hasAnyEvent, noEvents } from '../lib/rsvpEvents'

function makePerson(id) {
  return {
    id,
    firstName: '',
    lastName: '',
    email: '',
    dietary: '',
    sameEvents: true,
    events: noEvents(),
  }
}

const isValidEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())

export function GuestRsvpForm() {
  const nextId = useRef(0)
  const formRef = useRef(null)
  const [partyEvents, setPartyEvents] = useState(noEvents)
  const [people, setPeople] = useState(() => [makePerson(0)])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  const clearError = (id, field) =>
    setFieldErrors((prev) => {
      const key = `${id}-${field}`
      if (!prev[key]) return prev
      const next = { ...prev }
      delete next[key]
      return next
    })

  const patchPerson = (id, patch) =>
    setPeople((prev) => prev.map((person) => (person.id === id ? { ...person, ...patch } : person)))

  const updatePerson = (id, field, value) => {
    patchPerson(id, { [field]: value })
    clearError(id, field)
  }

  const copyPrimaryEmail = (id) => {
    setPeople((prev) => {
      const primaryEmail = prev[0].email
      return prev.map((person) => (person.id === id ? { ...person, email: primaryEmail } : person))
    })
    clearError(id, 'email')
  }

  const setSameEvents = (id, sameEvents) => {
    patchPerson(id, { sameEvents })
    clearError(id, 'events')
  }

  const togglePersonEvent = (id, key, checked) => {
    setPeople((prev) =>
      prev.map((person) =>
        person.id === id ? { ...person, events: { ...person.events, [key]: checked } } : person,
      ),
    )
    clearError(id, 'events')
  }

  const addPerson = () => {
    nextId.current += 1
    setPeople((prev) => [...prev, makePerson(nextId.current)])
  }

  const removePerson = (id) => {
    setPeople((prev) => prev.filter((person) => person.id !== id))
    setFieldErrors((prev) => {
      const next = { ...prev }
      ;['firstName', 'lastName', 'email', 'events'].forEach((field) => delete next[`${id}-${field}`])
      return next
    })
  }

  /* Everything is checked in one pass so a guest sees every problem at once,
     rather than fixing the events, submitting, and only then being told a name
     is missing. */
  const validate = () => {
    const errors = {}

    if (!hasAnyEvent(partyEvents)) errors.partyEvents = true

    people.forEach((person, index) => {
      if (!person.firstName.trim()) errors[`${person.id}-firstName`] = true
      if (!person.lastName.trim()) errors[`${person.id}-lastName`] = true
      if (!isValidEmail(person.email)) errors[`${person.id}-email`] = true
      if (index > 0 && !person.sameEvents && !hasAnyEvent(person.events)) {
        errors[`${person.id}-events`] = true
      }
    })

    return errors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const errors = validate()
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setError('Please complete the highlighted fields before submitting.')
      // Move the guest to the first thing that needs fixing; a red underline
      // far up the page is easy to miss on a form this long.
      requestAnimationFrame(() => {
        formRef.current?.querySelector('[aria-invalid="true"]')?.focus()
      })
      return
    }

    setFieldErrors({})
    setSubmitting(true)

    const partyId = crypto.randomUUID()
    const rows = people.map((person, index) => {
      const events = eventsForPerson(person, index, partyEvents)
      return {
        party_id: partyId,
        is_primary: index === 0,
        name: `${person.firstName.trim()} ${person.lastName.trim()}`.trim(),
        email: person.email.trim(),
        dietary_restrictions: person.dietary.trim() || null,
        attending_ceremony: events.ceremony,
        attending_reception: events.reception,
      }
    })

    const { error: insertError } = await supabase.from('guests').insert(rows)
    setSubmitting(false)

    if (insertError) {
      setError('Something went wrong submitting your RSVP. Please try again.')
      return
    }

    nextId.current = 0
    setPartyEvents(noEvents())
    setPeople([makePerson(0)])
    setFieldErrors({})
    setSuccess(true)
  }

  if (success) {
    return (
      <div className="rsvp-success">
        <p>Your RSVP is in — thank you. We can&apos;t wait to celebrate with you.</p>
        <button type="button" className="rsvp-button" onClick={() => setSuccess(false)}>
          RSVP for another party
        </button>
      </div>
    )
  }

  const canCopyEmail = isValidEmail(people[0].email)

  return (
    <form className="rsvp-form" ref={formRef} onSubmit={handleSubmit} noValidate>
      <fieldset className="rsvp-events">
        <legend className="rsvp-question">Which events will you be attending?</legend>
        {RSVP_EVENTS.map((item, itemIndex) => (
          <label className="rsvp-check" key={item.key}>
            <input
              type="checkbox"
              checked={partyEvents[item.key]}
              // Only the first box carries the invalid flag -- the group has a
              // single answer, so flagging both would announce the error twice
              // and give the focus helper two targets.
              aria-invalid={(itemIndex === 0 && Boolean(fieldErrors.partyEvents)) || undefined}
              aria-describedby={fieldErrors.partyEvents ? 'party-events-error' : undefined}
              onChange={(changeEvent) => {
                setPartyEvents((prev) => ({ ...prev, [item.key]: changeEvent.target.checked }))
                setFieldErrors((prev) => {
                  if (!prev.partyEvents) return prev
                  const next = { ...prev }
                  delete next.partyEvents
                  return next
                })
              }}
            />
            <span>{item.label}</span>
          </label>
        ))}
        {fieldErrors.partyEvents && (
          <p className="rsvp-error" id="party-events-error">
            Please choose at least one event.
          </p>
        )}
      </fieldset>

      {people.map((person, index) => (
        <PersonFields
          key={person.id}
          person={person}
          index={index}
          onChange={(field, value) => updatePerson(person.id, field, value)}
          onRemove={() => removePerson(person.id)}
          onCopyEmail={() => copyPrimaryEmail(person.id)}
          canCopyEmail={canCopyEmail}
          onSameEventsChange={(sameEvents) => setSameEvents(person.id, sameEvents)}
          onEventToggle={(key, checked) => togglePersonEvent(person.id, key, checked)}
          firstNameInvalid={Boolean(fieldErrors[`${person.id}-firstName`])}
          lastNameInvalid={Boolean(fieldErrors[`${person.id}-lastName`])}
          emailInvalid={Boolean(fieldErrors[`${person.id}-email`])}
          eventsInvalid={Boolean(fieldErrors[`${person.id}-events`])}
        />
      ))}

      {/* The two buttons read as one block, so they sit closer together than
          the form's section rhythm; the submit error belongs between them. */}
      <div className="rsvp-actions">
        <button type="button" className="rsvp-button rsvp-button--add" onClick={addPerson}>
          <span aria-hidden="true">+</span> RSVP for another person
        </button>

        {error && (
          <p className="rsvp-error" role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="rsvp-button" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit RSVP'}
        </button>
      </div>
    </form>
  )
}
