import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { AdminProtectedOutlet } from '../auth/AdminProtectedOutlet'
import { RequireAuth } from '../auth/RequireAuth'
import { RequireGuest } from '../auth/RequireGuest'
import { PlaceholderPage } from '../components/PlaceholderPage'
import { LoginPage } from '../pages/public/LoginPage'
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
      {
        path: '/',
        element: (
          <PlaceholderPage
            title="Início"
            description="Apresentação da concessionária e destaque para o catálogo de veículos."
          />
        ),
      },
      {
        path: '/vehicles',
        element: (
          <PlaceholderPage
            title="Catálogo de veículos"
            description="Listagem pública de veículos disponíveis."
          />
        ),
      },
      {
        path: '/vehicles/:vehicleId',
        element: (
          <PlaceholderPage
            title="Detalhes do veículo"
            description="Informações completas de um veículo do catálogo."
          />
        ),
      },
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
          {
            path: '/account',
            element: (
              <PlaceholderPage
                title="Painel do cliente"
                description="Visão geral da conta e atalhos para compras, test drives e financiamento."
              />
            ),
          },
          {
            path: '/account/profile',
            element: (
              <PlaceholderPage title="Meu perfil" description="Dados pessoais do cliente." />
            ),
          },
          {
            path: '/account/purchases',
            element: (
              <PlaceholderPage title="Minhas compras" description="Histórico de compras." />
            ),
          },
          {
            path: '/account/purchases/:saleId',
            element: (
              <PlaceholderPage title="Detalhes da compra" description="Status e dados da venda." />
            ),
          },
          {
            path: '/account/test-drives',
            element: (
              <PlaceholderPage title="Meus test drives" description="Agendamentos de test drive." />
            ),
          },
          {
            path: '/account/financing',
            element: (
              <PlaceholderPage
                title="Simulações de financiamento"
                description="Histórico de simulações de financiamento."
              />
            ),
          },
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
              {
                path: '/admin',
                element: (
                  <PlaceholderPage
                    title="Painel administrativo"
                    description="Resumo operacional conforme o perfil do colaborador."
                  />
                ),
              },
              {
                path: '/admin/vehicles',
                element: (
                  <PlaceholderPage title="Gestão de veículos" description="Inventário da concessionária." />
                ),
              },
              {
                path: '/admin/vehicles/new',
                element: (
                  <PlaceholderPage title="Cadastrar veículo" description="Registro de novo veículo." />
                ),
              },
              {
                path: '/admin/vehicles/:vehicleId',
                element: (
                  <PlaceholderPage
                    title="Veículo — detalhes / edição"
                    description="Consulta e alteração de veículo."
                  />
                ),
              },
              {
                path: '/admin/clients',
                element: (
                  <PlaceholderPage title="Gestão de clientes" description="Cadastro e consulta de clientes." />
                ),
              },
              {
                path: '/admin/clients/:clientId',
                element: (
                  <PlaceholderPage
                    title="Cliente — detalhes / edição"
                    description="Consulta e alteração de cliente."
                  />
                ),
              },
              {
                path: '/admin/sales',
                element: (
                  <PlaceholderPage title="Gestão de vendas" description="Acompanhamento de vendas." />
                ),
              },
              {
                path: '/admin/sales/:saleId',
                element: (
                  <PlaceholderPage title="Venda — detalhes" description="Status e informações da venda." />
                ),
              },
              {
                path: '/admin/test-drives',
                element: (
                  <PlaceholderPage title="Gestão de test drives" description="Agendamentos de test drive." />
                ),
              },
              {
                path: '/admin/test-drives/:testDriveId',
                element: (
                  <PlaceholderPage
                    title="Test drive — detalhes"
                    description="Consulta e atualização do agendamento."
                  />
                ),
              },
              {
                path: '/admin/finance',
                element: (
                  <PlaceholderPage title="Gestão financeira" description="Pagamentos e resumo financeiro." />
                ),
              },
              {
                path: '/admin/finance/payments/:paymentId',
                element: (
                  <PlaceholderPage title="Pagamento — detalhes" description="Consulta e status do pagamento." />
                ),
              },
              {
                path: '/admin/notifications',
                element: (
                  <PlaceholderPage title="Gestão de notificações" description="Notificações aos clientes." />
                ),
              },
              {
                path: '/admin/reports',
                element: (
                  <PlaceholderPage title="Relatórios" description="Indicadores comerciais e financeiros." />
                ),
              },
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
