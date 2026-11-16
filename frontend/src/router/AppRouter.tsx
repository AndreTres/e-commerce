import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AdminDashboardPage } from '../pages/admin/AdminDashboardPage'
import { AdminClientEditPage } from '../pages/admin/clients/AdminClientEditPage'
import { AdminClientsListPage } from '../pages/admin/clients/AdminClientsListPage'
import { AdminSaleDetailPage } from '../pages/admin/sales/AdminSaleDetailPage'
import { AdminSalesListPage } from '../pages/admin/sales/AdminSalesListPage'
import { AdminReportsPage } from '../pages/admin/reports/AdminReportsPage'
import { AdminNotificationsPage } from '../pages/admin/notifications/AdminNotificationsPage'
import { AdminFinancePage } from '../pages/admin/finance/AdminFinancePage'
import { AdminPaymentDetailPage } from '../pages/admin/finance/AdminPaymentDetailPage'
import { AdminTestDriveDetailPage } from '../pages/admin/test-drives/AdminTestDriveDetailPage'
import { AdminTestDrivesListPage } from '../pages/admin/test-drives/AdminTestDrivesListPage'
import { AdminVehicleEditPage } from '../pages/admin/vehicles/AdminVehicleEditPage'
import { AdminVehicleNewPage } from '../pages/admin/vehicles/AdminVehicleNewPage'
import { AdminVehiclesListPage } from '../pages/admin/vehicles/AdminVehiclesListPage'
import { AdminProtectedOutlet } from '../auth/AdminProtectedOutlet'
import { RequireAuth } from '../auth/RequireAuth'
import { RequireGuest } from '../auth/RequireGuest'
import { PlaceholderPage } from '../components/PlaceholderPage'
import { AccountDashboardPage } from '../pages/account/AccountDashboardPage'
import { CustomerProfilePage } from '../pages/account/CustomerProfilePage'
import { MyPurchasesPage } from '../pages/account/MyPurchasesPage'
import { MyFinancingPage } from '../pages/account/MyFinancingPage'
import { MyTestDrivesPage } from '../pages/account/MyTestDrivesPage'
import { PurchaseDetailsPage } from '../pages/account/PurchaseDetailsPage'
import { HomePage } from '../pages/public/HomePage'
import { LoginPage } from '../pages/public/LoginPage'
import { VehicleCatalogPage } from '../pages/public/VehicleCatalogPage'
import { VehicleDetailsPage } from '../pages/public/VehicleDetailsPage'
import { AccountLayout } from '../layouts/AccountLayout'
import { AdminLayout } from '../layouts/AdminLayout'
import { PublicLayout } from '../layouts/PublicLayout'
import { AccessDeniedPage } from '../pages/system/AccessDeniedPage'
import { NotFoundPage } from '../pages/system/NotFoundPage'
import { EMPLOYEE_ROLES } from '../types/user'

const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/vehicles', element: <VehicleCatalogPage /> },
      { path: '/vehicles/:vehicleId', element: <VehicleDetailsPage /> },
      {
        element: <RequireGuest />,
        children: [
          {
            path: '/login',
            element: <LoginPage />,
          },
        ],
      },
    ],
  },
  {
    element: <RequireAuth allowedRoles={['CLIENT']} />,
    children: [
      {
        element: <AccountLayout />,
        children: [
          { path: '/account', element: <AccountDashboardPage /> },
          { path: '/account/profile', element: <CustomerProfilePage /> },
          { path: '/account/purchases', element: <MyPurchasesPage /> },
          { path: '/account/purchases/:saleId', element: <PurchaseDetailsPage /> },
          { path: '/account/test-drives', element: <MyTestDrivesPage /> },
          { path: '/account/financing', element: <MyFinancingPage /> },
          {
            path: '/account/notifications',
            element: (
              <PlaceholderPage title="Minhas notificações" description="Mensagens da concessionária." />
            ),
          },
        ],
      },
    ],
  },
  {
    element: <RequireAuth allowedRoles={EMPLOYEE_ROLES} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            element: <AdminProtectedOutlet />,
            children: [
              { path: '/admin', element: <AdminDashboardPage /> },
              { path: '/admin/vehicles', element: <AdminVehiclesListPage /> },
              { path: '/admin/vehicles/new', element: <AdminVehicleNewPage /> },
              { path: '/admin/vehicles/:vehicleId', element: <AdminVehicleEditPage /> },
              { path: '/admin/clients', element: <AdminClientsListPage /> },
              { path: '/admin/clients/:clientId', element: <AdminClientEditPage /> },
              { path: '/admin/sales', element: <AdminSalesListPage /> },
              { path: '/admin/sales/:saleId', element: <AdminSaleDetailPage /> },
              { path: '/admin/test-drives', element: <AdminTestDrivesListPage /> },
              {
                path: '/admin/test-drives/:testDriveId',
                element: <AdminTestDriveDetailPage />,
              },
              { path: '/admin/finance', element: <AdminFinancePage /> },
              {
                path: '/admin/finance/payments/:paymentId',
                element: <AdminPaymentDetailPage />,
              },
              { path: '/admin/notifications', element: <AdminNotificationsPage /> },
              { path: '/admin/reports', element: <AdminReportsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '/access-denied',
    element: <AccessDeniedPage />,
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
])

export function AppRouter() {
  return <RouterProvider router={router} />
}
