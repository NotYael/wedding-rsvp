export function PersonFields({ person, index, isPrimary, onChange, onRemove, onCopyPrimary }) {
  const prefix = isPrimary ? 'primary' : `attendee-${person.id}`

  return (
    <fieldset className="person-fields">
      <legend>{isPrimary ? 'Primary Responder' : `Attendee ${index}`}</legend>

      <label htmlFor={`${prefix}-name`}>Name</label>
      <input
        id={`${prefix}-name`}
        required
        value={person.name}
        onChange={(event) => onChange('name', event.target.value)}
      />

      <label htmlFor={`${prefix}-email`}>Email</label>
      <input
        id={`${prefix}-email`}
        type="email"
        required
        value={person.email}
        onChange={(event) => onChange('email', event.target.value)}
      />

      <label htmlFor={`${prefix}-phone`}>Phone Number</label>
      <input
        id={`${prefix}-phone`}
        type="tel"
        required
        value={person.phone}
        onChange={(event) => onChange('phone', event.target.value)}
      />

      <label htmlFor={`${prefix}-dietary`}>Dietary Restrictions</label>
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
