import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { LoginPage } from '@/features/auth/LoginPage'
import { HomePage } from '@/features/home/HomePage'
import { UsersPage } from '@/features/users/UsersPage'
import { ProfilesPage } from '@/features/profiles/ProfilesPage'
import { PatientsPage } from '@/features/patients/PatientsPage'
import { FedHubPage } from '@/features/fed/FedHubPage'
import { FedStandardReportPage } from '@/features/fed/FedStandardReportPage'
import type { ReactNode } from 'react'

const queryClient = new QueryClient()

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center text-muted-foreground">
        Cargando…
      </div>
    )
  }
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function RequirePermission({
  permission,
  children,
}: {
  permission: string
  children: ReactNode
}) {
  const { can } = useAuth()
  if (!can(permission)) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <h2 className="text-xl font-semibold">Acceso denegado</h2>
        <p className="mt-2 text-muted-foreground">No tiene permiso para esta sección.</p>
      </div>
    )
  }
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route
          path="/pacientes"
          element={
            <RequirePermission permission="pacientes:read">
              <PatientsPage />
            </RequirePermission>
          }
        />
        <Route
          path="/fed"
          element={
            <RequirePermission permission="fed:read">
              <FedHubPage />
            </RequirePermission>
          }
        />
        <Route
          path="/fed/:slug"
          element={
            <RequirePermission permission="fed:read">
              <FedStandardReportPage />
            </RequirePermission>
          }
        />
        <Route
          path="/admin/usuarios"
          element={
            <RequirePermission permission="admin:users">
              <UsersPage />
            </RequirePermission>
          }
        />
        <Route
          path="/admin/perfiles"
          element={
            <RequirePermission permission="admin:profiles">
              <ProfilesPage />
            </RequirePermission>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster richColors position="top-right" />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
