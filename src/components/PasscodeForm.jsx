import { useState } from 'react'

export function PasscodeForm({ onSubmit, error, submitting }) {
  const [passcode, setPasscode] = useState('')
  const [visible, setVisible] = useState(false)

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit(passcode)
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label htmlFor="passcode">Passcode</label>
      <div className="passcode-field">
        <input
          id="passcode"
          type={visible ? 'text' : 'password'}
          value={passcode}
          onChange={(event) => setPasscode(event.target.value)}
          autoFocus
          autoComplete="current-password"
        />
        <button
          type="button"
          className="passcode-toggle"
          onClick={() => setVisible((prev) => !prev)}
          aria-label={visible ? 'Hide passcode' : 'Show passcode'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {error && <p className="login-error">{error}</p>}
      <button type="submit" disabled={submitting}>
        {submitting ? 'Checking…' : 'Enter'}
      </button>
    </form>
  )
}
