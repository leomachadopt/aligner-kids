/**
 * Componente de Proteção de Rotas
 * Verifica autenticação e permissões antes de renderizar
 */

import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import type { UserRole } from '@/types/user'
import { Loader2 } from 'lucide-react'

interface ProtectedRouteProps {
  allowedRoles?: UserRole[]
  redirectTo?: string
}

export const ProtectedRoute = ({
  allowedRoles,
  redirectTo = '/',
}: ProtectedRouteProps) => {
  const { user, isLoading, isAuthenticated } = useAuth()

  console.log('🔒 ProtectedRoute:', { isLoading, isAuthenticated, user: user?.email, role: user?.role })

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  // Não autenticado
  if (!isAuthenticated || !user) {
    console.log('❌ Usuário não autenticado, redirecionando para:', redirectTo)
    return <Navigate to={redirectTo} replace />
  }

  // Verificar roles permitidos
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirecionar para dashboard ou página apropriada
    return <Navigate to="/dashboard" replace />
  }

  // Verificar se ortodontista está aprovado
  if (user.role === 'orthodontist' && !user.isApproved) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold mb-4">Conta Pendente de Aprovação</h1>
          <p className="text-muted-foreground">
            Sua conta de ortodontista está aguardando aprovação da administração.
            Você receberá um email quando sua conta for ativada.
          </p>
        </div>
      </div>
    )
  }

  // Renderizar rotas protegidas
  return <Outlet />
}
