import { useEffect } from 'react'
import { useAuth } from '../context/authContext'
import { LoadingScreen } from './LoadingScreen'

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
    return <LoadingScreen />
  }

  if (!session) {
    return loginForm
  }

  if (mismatched) {
    return forceSignOutOnMismatch ? <LoadingScreen label="Signing out" /> : mismatchContent
  }

  return children
}
