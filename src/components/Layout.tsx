import { Outlet, useLocation } from 'react-router-dom'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { AppSidebar } from '@/components/AppSidebar'
import { useUserRole } from '@/context/UserRoleContext'
import { useAuth } from '@/context/AuthContext'
import { AlignerProvider } from '@/context/AlignerContext'
import { useEffect } from 'react'

const noLayoutRoutes = [
  '/',
  '/register',
  '/forgot-password',
  '/terms',
  '/privacy',
]

export default function Layout() {
  const location = useLocation()
  const { role, isChild } = useUserRole()
  const { user } = useAuth()

  useEffect(() => {
    document.body.classList.toggle('child-theme', isChild)
  }, [isChild])

  if (noLayoutRoutes.includes(location.pathname)) {
    return <Outlet />
  }

  // Usa o ID do usuário autenticado (paciente) como referência para o contexto de alinhadores
  const patientId = user?.id || 'patient-1'

  return (
    <AlignerProvider patientId={patientId}>
      <div className="flex min-h-screen bg-gradient-to-br from-background to-muted/50">
        <AppSidebar userRole={role} />
        <div className="flex flex-1 flex-col">
          <Header />
          <main className="flex-1 p-4 sm:p-8">
            <div className="mx-auto w-full max-w-6xl space-y-6">
              <Outlet />
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </AlignerProvider>
  )
}
