import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AuthContext } from './authContext'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    /* `loading` has to clear on every path, including failure. getSession()
       refreshes an expired token first, so when the project is unreachable
       (paused, resuming, offline) this call retries and then resolves with an
       error -- and on some of those paths there is no `data` to destructure.
       Letting that throw leaves `loading` stuck true and the app parked on the
       loading screen forever, so treat any failure as "no session" and fall
       through to the passcode form. */
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) setSession(data?.session ?? null)
      })
      .catch(() => {
        if (active) setSession(null)
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const role = session?.user?.app_metadata?.role ?? null

  const signIn = (email, password) => supabase.auth.signInWithPassword({ email, password })
  const signOut = () => supabase.auth.signOut()

  return (
    <AuthContext.Provider value={{ session, role, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
