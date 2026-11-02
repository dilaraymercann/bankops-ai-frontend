import { Navigate, Outlet, useLocation } from 'react-router'
import type { Role } from '@/api/types'
import { useAuth } from './AuthContext'
import { homePathFor } from './navigation'

/** Giriş yapılmamışsa login'e, rolü bu sayfaya yetmiyorsa kendi ana sayfasına yönlendirir. */
export function RequireAuth({ roles }: { roles?: Role[] }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePathFor(user.role)} replace />
  }
  return <Outlet />
}
