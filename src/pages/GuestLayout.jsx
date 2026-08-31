import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { RoleGate } from '../components/RoleGate'
import { GuestLogin } from '../components/GuestLogin'
import { GuestNav } from '../components/GuestNav'
import { GUEST_EMAIL } from '../lib/authConstants'
import '../styles/home.css'

export function GuestLayout() {
  const { signIn, signOut } = useAuth()
  const { pathname } = useLocation()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // The home page is a full-bleed scrolling stack that renders its own
  // <main>, so it skips the padded, centred app-shell the other pages use.
  const isHome = pathname === '/'

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
      loginForm={<GuestLogin onSubmit={handleSubmit} error={error} submitting={submitting} />}
      mismatchContent={
        <main className="app-shell">
          <p>
            You're signed in as admin. Head to <a href="/admin">/admin</a> to access the dashboard.
          </p>
        </main>
      }
    >
      <GuestNav onLogout={signOut} />
      {isHome ? (
        <Outlet />
      ) : (
        <main className="app-shell guest-page">
          <Outlet />
        </main>
      )}
    </RoleGate>
  )
}
