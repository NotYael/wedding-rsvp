import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { RoleGate } from '../components/RoleGate'
import { PasscodeForm } from '../components/PasscodeForm'
import { AdminNav } from '../components/AdminNav'
import { ADMIN_EMAIL } from '../lib/authConstants'

export function AdminLayout() {
  const { signIn, signOut } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (passcode) => {
    setSubmitting(true)
    setError('')
    const { error: signInError } = await signIn(ADMIN_EMAIL, passcode)
    setSubmitting(false)
    if (signInError) {
      setError('Incorrect passcode, please try again.')
    }
  }

  const handleForcedSignOut = () => setError("This passcode isn't valid here.")

  return (
    <RoleGate
      expectedRole="admin"
      forceSignOutOnMismatch
      onForcedSignOut={handleForcedSignOut}
      loginForm={
        <main className="app-shell">
          <h1>Wedding RSVP — Admin</h1>
          <PasscodeForm onSubmit={handleSubmit} error={error} submitting={submitting} />
        </main>
      }
    >
      <div className="admin-shell">
        <AdminNav onLogout={signOut} />
        <Outlet />
      </div>
    </RoleGate>
  )
}
