import { Navigate, useLocation } from 'react-router-dom'
import type { PropsWithChildren } from 'react'

const AUTH_KEY = 'gl_auth'

export default function ProtectedRoute({ children }: PropsWithChildren) {
  const location = useLocation()
  const isAuthed = typeof window !== 'undefined' && !!localStorage.getItem(AUTH_KEY)

  if (!isAuthed) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <>{children}</>
}
