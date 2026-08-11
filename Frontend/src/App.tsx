import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/sonner'
import { AppShell } from '@/components/layout/AppShell'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { LoginPage } from '@/features/auth/LoginPage'
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage'
import { ResetPasswordPage } from '@/features/auth/ResetPasswordPage'
import { ForcePasswordDialog } from '@/features/auth/ForcePasswordDialog'
import { HomePage } from '@/features/home/HomePage'
import { UsersPage } from '@/features/users/UsersPage'
import { ProfilesPage } from '@/features/profiles/ProfilesPage'
import { PatientsPage } from '@/features/patients/PatientsPage'
import { FedHubPage } from '@/features/fed/FedHubPage'
import { FedStandardReportPage } from '@/features/fed/FedStandardReportPage'
import { ProfilePage } from '@/features/profile/ProfilePage'
import { SessionsPage } from '@/features/sessions/SessionsPage'
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
  return (
    <>
      {children}
      <ForcePasswordDialog />
    </>
  )
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
      <Route path="/olvidar-password" element={<ForgotPasswordPage />} />
      <Route path="/restablecer" element={<ResetPasswordPage />} />
      <Route
        element={
          <RequireAuth>
            <AppShell />
          </RequireAuth>
        }
      >
        <Route path="/" element={<HomePage />} />
        <Route path="/perfil" element={<ProfilePage />} />
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
        <Route
          path="/admin/sesiones"
          element={
            <RequirePermission permission="admin:sesiones">
              <SessionsPage />
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
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
