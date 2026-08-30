import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuth } from '../context/authContext'
import { RoleGate } from '../components/RoleGate'
import { PasscodeForm } from '../components/PasscodeForm'
import { AdminNav } from '../components/AdminNav'
import { ADMIN_EMAIL } from '../lib/authConstants'
import '../styles/admin.css'

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
        /* The guest door one size down: same wordmark and passcode field, with
           an eyebrow instead of the couple illustration to mark it as the
           other entrance. */
        <main className="admin-login">
          <p className="admin-login-eyebrow">Admin</p>
          <h1 className="admin-login-names">Marco &amp; Alessandra</h1>
          <PasscodeForm onSubmit={handleSubmit} error={error} submitting={submitting} />
          <img className="admin-login-mark" src="/signature.svg" alt="" width="69" height="64" />
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
