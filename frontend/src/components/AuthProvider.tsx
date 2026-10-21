import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuthStore } from '@/store/authStore'

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setSession, fetchProfile } = useAuthStore()

useEffect(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    setSession(session)
    if (session) fetchProfile()
    useAuthStore.setState({ initialized: true, loading: false })
  })

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSession(session)
      if (session) fetchProfile()
      else useAuthStore.setState({ profile: null })
    }
  )

  return () => subscription.unsubscribe()
}, [setSession, fetchProfile])

  return <>{children}</>
}