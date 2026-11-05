import { Outlet } from 'react-router-dom'
import { RequireAdminPermission } from './RequireAdminPermission'

export function AdminProtectedOutlet() {
  return (
    <RequireAdminPermission>
      <Outlet />
    </RequireAdminPermission>
  )
}
