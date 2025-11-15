import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { AppSidebar } from '@/components/AppSidebar'

const noLayoutRoutes = ['/', '/register', '/forgot-password']

export default function Layout() {
  const location = useLocation()

  if (noLayoutRoutes.includes(location.pathname)) {
    return <Outlet />
  }

  // Mock user role, this should come from auth context
  const userRole = 'patient'

  return (
    <div className="flex min-h-screen bg-muted/40">
      <AppSidebar userRole={userRole} />
      <div className="flex flex-1 flex-col">
        <Header />
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
        <Footer />
      </div>
    </div>
  )
}
