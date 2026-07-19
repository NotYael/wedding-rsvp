export function PersonFields({
  person,
  index,
  isPrimary,
  onChange,
  onRemove,
  onCopyPrimary,
  nameInvalid,
  emailInvalid,
  phoneInvalid,
}) {
  const prefix = isPrimary ? 'primary' : `attendee-${person.id}`

  return (
    <fieldset className="person-fields">
      <legend>{isPrimary ? 'Primary Responder' : `Attendee ${index}`}</legend>

      <label htmlFor={`${prefix}-name`}>Name</label>
      <input
        id={`${prefix}-name`}
        className={nameInvalid ? 'field-invalid' : undefined}
        aria-invalid={nameInvalid || undefined}
        value={person.name}
        onChange={(event) => onChange('name', event.target.value)}
      />

      <label htmlFor={`${prefix}-email`}>Email</label>
      <input
        id={`${prefix}-email`}
        type="email"
        className={emailInvalid ? 'field-invalid' : undefined}
        aria-invalid={emailInvalid || undefined}
        value={person.email}
        onChange={(event) => onChange('email', event.target.value)}
      />
      {emailInvalid && <p className="field-error">Please enter a valid email address.</p>}

      <label htmlFor={`${prefix}-phone`}>Phone Number</label>
      <input
        id={`${prefix}-phone`}
        type="tel"
        className={phoneInvalid ? 'field-invalid' : undefined}
        aria-invalid={phoneInvalid || undefined}
        value={person.phone}
        onChange={(event) => onChange('phone', event.target.value)}
      />
      {phoneInvalid && <p className="field-error">Please enter a valid phone number.</p>}

      <label htmlFor={`${prefix}-dietary`}>Dietary Restrictions (Optional)</label>
      <input
        id={`${prefix}-dietary`}
        value={person.dietary}
        onChange={(event) => onChange('dietary', event.target.value)}
      />

      {!isPrimary && (
        <div className="person-actions">
          <button type="button" onClick={onCopyPrimary}>
            Use primary's email &amp; phone
          </button>
          <button type="button" onClick={onRemove}>
            Remove
          </button>
        </div>
      )}
    </fieldset>
  )
}
