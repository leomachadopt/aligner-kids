/**
 * Super Admin Dashboard
 * Visão geral da plataforma - clínicas, ortodontistas, pacientes, analytics
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Building2,
  Users,
  TrendingUp,
  Shield,
  CheckCircle,
  XCircle,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react'
import { ClinicService } from '@/services/clinicService'
import { AuthService } from '@/services/authService'
import type { Clinic } from '@/types/clinic'
import type { User } from '@/types/user'

const SuperAdminDashboard = () => {
  const [clinics, setClinics] = useState<Clinic[]>([])
  const [pendingOrthodontists, setPendingOrthodontists] = useState<User[]>([])
  const [stats, setStats] = useState({
    totalClinics: 0,
    activeClinics: 0,
    totalOrthodontists: 0,
    totalPatients: 0,
    pendingApprovals: 0,
  })
  const [loading, setLoading] = useState(true)

  // ============================================
  // LOAD DATA
  // ============================================

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      // Carregar clínicas
      const clinicsData = await ClinicService.getAllClinics()
      setClinics(clinicsData)

      // Carregar ortodontistas pendentes
      const pending = AuthService.getPendingOrthodontists()
      setPendingOrthodontists(pending)

      // Carregar todos os usuários para estatísticas
      const allUsers = AuthService.getAllUsers('current-admin-id')

      // Calcular estatísticas
      const totalOrthodontists = allUsers.filter((u) => u.role === 'orthodontist').length
      const totalPatients = allUsers.filter(
        (u) => u.role === 'patient' || u.role === 'child-patient'
      ).length

      setStats({
        totalClinics: clinicsData.length,
        activeClinics: clinicsData.filter((c) => c.isActive).length,
        totalOrthodontists,
        totalPatients,
        pendingApprovals: pending.length,
      })
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  // ============================================
  // HANDLERS
  // ============================================

  const handleApprove = async (orthodontistId: string) => {
    try {
      await AuthService.approveOrthodontist('current-admin-id', orthodontistId)
      loadDashboardData()
    } catch (error) {
      console.error(error)
    }
  }

  const handleReject = async (orthodontistId: string) => {
    if (!confirm('Tem certeza que deseja rejeitar este ortodontista?')) {
      return
    }

    try {
      await AuthService.rejectOrthodontist('current-admin-id', orthodontistId)
      loadDashboardData()
    } catch (error) {
      console.error(error)
    }
  }

  // ============================================
  // RENDER
  // ============================================

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Carregando Dashboard...</h1>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-primary">
          Dashboard Administrativo
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Visão geral da plataforma Kids Aligner
        </p>
      </div>

      {/* Alertas Importantes */}
      {stats.pendingApprovals > 0 && (
        <Card className="border-2 border-orange-500/30 bg-orange-50/20">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {stats.pendingApprovals} ortodontista
                  {stats.pendingApprovals > 1 ? 's' : ''} aguardando aprovação
                </h3>
                <p className="text-sm text-muted-foreground">
                  Revise e aprove os cadastros pendentes
                </p>
              </div>
              <Button asChild>
                <Link to="/admin/orthodontists">
                  Ver Pendências
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Métricas Principais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Clínicas Ativas
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeClinics}</div>
            <p className="text-xs text-muted-foreground">
              de {stats.totalClinics} totais
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ortodontistas
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrthodontists}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingApprovals} pendentes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Pacientes
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-green-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Crescimento ativo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Aprovações Pendentes
            </CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {stats.pendingApprovals}
            </div>
            <p className="text-xs text-muted-foreground">
              Ortodontistas aguardando
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/admin/clinics">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Gerenciar Clínicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Adicione, edite ou desative clínicas da plataforma
              </p>
              <div className="mt-4 flex items-center text-primary font-medium text-sm">
                Acessar
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/admin/orthodontists">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Aprovar Ortodontistas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Revise e aprove novos cadastros de ortodontistas
              </p>
              <div className="mt-4 flex items-center text-primary font-medium text-sm">
                Acessar
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link to="/admin/prompts">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Configurar IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Gerencie prompts e configurações de geração de histórias
              </p>
              <div className="mt-4 flex items-center text-primary font-medium text-sm">
                Acessar
                <ArrowRight className="ml-2 h-4 w-4" />
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>

      {/* Ortodontistas Pendentes */}
      {pendingOrthodontists.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-orange-600" />
              Ortodontistas Pendentes de Aprovação
            </h2>
            <Button variant="outline" asChild>
              <Link to="/admin/orthodontists">Ver Todos</Link>
            </Button>
          </div>

          <div className="grid gap-4">
            {pendingOrthodontists.slice(0, 3).map((ortho) => (
              <Card key={ortho.id} className="border-2 border-orange-500/30 bg-orange-50/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold">{ortho.fullName}</h3>
                      <p className="text-sm text-muted-foreground">{ortho.email}</p>
                      <p className="text-sm text-muted-foreground">CRO: {ortho.cro}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(ortho.id)}
                      >
                        <CheckCircle className="mr-1 h-4 w-4" />
                        Aprovar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleReject(ortho.id)}
                      >
                        <XCircle className="mr-1 h-4 w-4" />
                        Rejeitar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Clínicas Recentes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Clínicas Ativas</h2>
          <Button variant="outline" asChild>
            <Link to="/admin/clinics">Ver Todas</Link>
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clinics.filter((c) => c.isActive).slice(0, 6).map((clinic) => (
            <Card key={clinic.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold">{clinic.name}</h3>
                  <p className="text-sm text-muted-foreground">{clinic.email}</p>
                  {clinic.addressCity && clinic.addressState && (
                    <p className="text-sm text-muted-foreground">
                      📍 {clinic.addressCity}, {clinic.addressState}
                    </p>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded capitalize">
                      {clinic.subscriptionTier}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SuperAdminDashboard
