import { useEffect } from 'react'
import { useAuth } from '../context/authContext'

export function RoleGate({
  expectedRole,
  forceSignOutOnMismatch = false,
  onForcedSignOut,
  loginForm,
  mismatchContent,
  children,
}) {
  const { session, role, loading, signOut } = useAuth()
  const mismatched = !loading && session && role !== expectedRole

  useEffect(() => {
    if (mismatched && forceSignOutOnMismatch) {
      signOut()
      onForcedSignOut?.()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mismatched, forceSignOutOnMismatch])

  if (loading) {
    return <p className="auth-status">Loading…</p>
  }

  if (!session) {
    return loginForm
  }

  if (mismatched) {
    return forceSignOutOnMismatch ? <p className="auth-status">Signing out…</p> : mismatchContent
  }

  return children
}
