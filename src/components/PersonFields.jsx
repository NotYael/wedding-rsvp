import { RSVP_EVENTS } from '../lib/rsvpEvents'

function nameErrorMessage(firstInvalid, lastInvalid) {
  if (firstInvalid && lastInvalid) return 'Please enter a first and last name.'
  if (firstInvalid) return 'Please enter a first name.'
  if (lastInvalid) return 'Please enter a last name.'
  return null
}

export function PersonFields({
  person,
  index,
  onChange,
  onRemove,
  onCopyEmail,
  canCopyEmail,
  onSameEventsChange,
  onEventToggle,
  firstNameInvalid,
  lastNameInvalid,
  emailInvalid,
  eventsInvalid,
}) {
  const field = (name) => `person-${person.id}-${name}`
  const isPrimary = index === 0
  const nameError = nameErrorMessage(firstNameInvalid, lastNameInvalid)

  return (
    <fieldset className="rsvp-person">
      <legend className="visually-hidden">Guest {index + 1}</legend>

      {/* The first guest is covered by the party-level question at the top of
          the form; everyone after that chooses to match it or diverge. */}
      {!isPrimary && (
        <div className="rsvp-field">
          <p className="rsvp-label" id={field('events-label')}>
            Events
          </p>
          <div className="rsvp-toggle" role="group" aria-labelledby={field('events-label')}>
            <button
              type="button"
              aria-pressed={person.sameEvents}
              onClick={() => onSameEventsChange(true)}
            >
              Same events as above
            </button>
            <button
              type="button"
              aria-pressed={!person.sameEvents}
              onClick={() => onSameEventsChange(false)}
            >
              Different events
            </button>
          </div>

          {!person.sameEvents && (
            <div className="rsvp-check-row">
              {RSVP_EVENTS.map((item, itemIndex) => (
                <label className="rsvp-check" key={item.key}>
                  <input
                    type="checkbox"
                    checked={person.events[item.key]}
                    aria-invalid={(itemIndex === 0 && eventsInvalid) || undefined}
                    aria-describedby={eventsInvalid ? field('events-error') : undefined}
                    onChange={(event) => onEventToggle(item.key, event.target.checked)}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          )}

          {eventsInvalid && (
            <p className="rsvp-error" id={field('events-error')}>
              Please choose at least one event.
            </p>
          )}
        </div>
      )}

      <div className="rsvp-field">
        <label className="rsvp-label" htmlFor={field('first')}>
          Name*
        </label>
        <div className="rsvp-field-pair">
          <input
            id={field('first')}
            className={`rsvp-input${firstNameInvalid ? ' rsvp-input--invalid' : ''}`}
            required
            aria-required="true"
            aria-invalid={firstNameInvalid || undefined}
            aria-describedby={nameError ? field('name-error') : undefined}
            value={person.firstName}
            onChange={(event) => onChange('firstName', event.target.value)}
            placeholder="Your first name"
            autoComplete="given-name"
          />
          <input
            id={field('last')}
            className={`rsvp-input${lastNameInvalid ? ' rsvp-input--invalid' : ''}`}
            required
            aria-required="true"
            aria-invalid={lastNameInvalid || undefined}
            aria-describedby={nameError ? field('name-error') : undefined}
            aria-label="Last name"
            value={person.lastName}
            onChange={(event) => onChange('lastName', event.target.value)}
            placeholder="Your last name"
            autoComplete="family-name"
          />
        </div>
        {nameError && (
          <p className="rsvp-error" id={field('name-error')}>
            {nameError}
          </p>
        )}
      </div>

      <div className="rsvp-field">
        <label className="rsvp-label" htmlFor={field('email')}>
          Email*
        </label>
        <input
          id={field('email')}
          className={`rsvp-input${emailInvalid ? ' rsvp-input--invalid' : ''}`}
          required
          aria-required="true"
          aria-invalid={emailInvalid || undefined}
          aria-describedby={emailInvalid ? field('email-error') : undefined}
          type="email"
          value={person.email}
          onChange={(event) => onChange('email', event.target.value)}
          placeholder="dlf-carmona@gmail.com"
          autoComplete="email"
        />
        {emailInvalid && (
          <p className="rsvp-error" id={field('email-error')}>
            Please enter a valid email address.
          </p>
        )}
        {!isPrimary && (
          <button
            type="button"
            className="rsvp-text-button"
            onClick={onCopyEmail}
            disabled={!canCopyEmail}
          >
            Use the same email as the first respondent
          </button>
        )}
      </div>

      <div className="rsvp-field">
        <label className="rsvp-label" htmlFor={field('dietary')}>
          Dietary restrictions
        </label>
        <input
          id={field('dietary')}
          className="rsvp-input"
          value={person.dietary}
          onChange={(event) => onChange('dietary', event.target.value)}
          placeholder="e.g. no hazelnuts"
        />
      </div>

      {/* Not in the mock, but an accidental "add another" is otherwise
          impossible to undo. */}
      {!isPrimary && (
        <button type="button" className="rsvp-text-button" onClick={onRemove}>
          Remove this guest
        </button>
      )}
    </fieldset>
  )
}
