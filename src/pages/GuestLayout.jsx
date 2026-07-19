import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { RoleGate } from '../components/RoleGate'
import { PasscodeForm } from '../components/PasscodeForm'
import { GuestNav } from '../components/GuestNav'
import { GUEST_EMAIL } from '../lib/authConstants'

export function GuestLayout() {
  const { signIn, signOut } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (passcode) => {
    setSubmitting(true)
    setError('')
    const { error: signInError } = await signIn(GUEST_EMAIL, passcode)
    setSubmitting(false)
    if (signInError) {
      setError('Incorrect passcode, please try again.')
    }
  }

  return (
    <RoleGate
      expectedRole="guest"
      loginForm={
        <main className="app-shell">
          <h1>Wedding RSVP</h1>
          <PasscodeForm onSubmit={handleSubmit} error={error} submitting={submitting} />
        </main>
      }
      mismatchContent={
        <main className="app-shell">
          <p>
            You're signed in as admin. Head to <a href="/admin">/admin</a> to access the dashboard.
          </p>
        </main>
      }
    >
      <GuestNav onLogout={signOut} />
      <main className="app-shell guest-page">
        <Outlet />
      </main>
    </RoleGate>
  )
}
