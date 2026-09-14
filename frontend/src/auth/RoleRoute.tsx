import { Navigate, Outlet } from 'react-router'
import type { Role } from '../types/models'
import { useAuth } from './useAuth'

interface RoleRouteProps {
  allow: Role[]
}

export default function RoleRoute({ allow }: RoleRouteProps) {
  const { user } = useAuth()

  if (!user || !allow.includes(user.role)) {
    return <Navigate to="/forbidden" replace />
  }
  return <Outlet />
}
