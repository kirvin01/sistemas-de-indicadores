import { Outlet } from 'react-router-dom'
import { AppSidebar } from '@/components/layout/AppSidebar'

export function AppShell() {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <AppSidebar />
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="mx-auto max-w-7xl px-5 py-6 md:px-8 md:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
