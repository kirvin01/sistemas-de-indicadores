import { Outlet } from 'react-router-dom'
import { AppFooter } from '@/components/layout/AppFooter'
import { AppSidebar } from '@/components/layout/AppSidebar'

export function AppShell() {
  return (
    <div className="flex min-h-svh bg-background text-foreground">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="min-h-0 flex-1 overflow-auto">
          <div className="mx-auto max-w-7xl space-y-0 px-4 py-5 sm:px-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
        <AppFooter />
      </div>
    </div>
  )
}
