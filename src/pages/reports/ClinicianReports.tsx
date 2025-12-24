import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  Calendar,
  BarChart3,
  Activity,
  Target,
  Award,
  ArrowUp,
  ArrowDown,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { alignerService } from '@/services/alignerService'
import { AuthService } from '@/services/authService'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import type { Treatment, Aligner } from '@/types/aligner'
import type { User } from '@/types/user'
import { isAlignerOverdue, calculateDaysUntilChange } from '@/utils/alignerCalculations'
import { toast } from 'sonner'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

const ClinicianReports = () => {
  const { user } = useAuth()
  const [patients, setPatients] = useState<User[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [aligners, setAligners] = useState<Aligner[]>([])
  const [loading, setLoading] = useState(true)
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    const loadData = async () => {
      if (!user || !user.clinicId) {
        toast.error('Usuário não está vinculado a nenhuma clínica')
        setLoading(false)
        return
      }

      try {
        const clinicPatients = await AuthService.getUsersByClinicAsync(user.clinicId)
        setPatients(clinicPatients)

        const allAligners: Aligner[] = []
        const allTreatments: Treatment[] = []

        for (const patient of clinicPatients) {
          const patientAligners = await alignerService.getAlignersByPatient(patient.id)
          const treatment = await alignerService.getTreatmentByPatient(patient.id)

          allAligners.push(...patientAligners)
          if (treatment) {
            allTreatments.push(treatment)
          }
        }

        setAligners(allAligners)
        setTreatments(allTreatments)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Erro ao carregar dados dos relatórios')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  // Calculations
  const activeTreatments = treatments.filter((t) => t.status === 'active')
  const completedTreatments = treatments.filter((t) => t.status === 'completed')
  const overdueAligners = aligners.filter((a) => isAlignerOverdue(a))
  const atRiskAligners = aligners.filter((a) => {
    if (a.status !== 'active') return false
    const daysUntil = calculateDaysUntilChange(a)
    return daysUntil <= 2 && daysUntil > 0
  })

  // Average progress
  const averageProgress =
    activeTreatments.length > 0
      ? activeTreatments.reduce((sum, t) => sum + (t.currentAlignerNumber / t.totalAligners) * 100, 0) /
        activeTreatments.length
      : 0

  // Completion rate
  const completionRate =
    treatments.length > 0 ? (completedTreatments.length / treatments.length) * 100 : 0

  // Status distribution
  const statusData = [
    { name: 'Ativos', value: activeTreatments.length, color: '#3b82f6' },
    { name: 'Concluídos', value: completedTreatments.length, color: '#10b981' },
    { name: 'Pausados', value: treatments.filter((t) => t.status === 'paused').length, color: '#f59e0b' },
    { name: 'Cancelados', value: treatments.filter((t) => t.status === 'cancelled').length, color: '#ef4444' },
  ]

  // Progress distribution (by ranges)
  const progressRanges = [
    { range: '0-25%', count: 0, color: '#ef4444' },
    { range: '26-50%', count: 0, color: '#f59e0b' },
    { range: '51-75%', count: 0, color: '#3b82f6' },
    { range: '76-100%', count: 0, color: '#10b981' },
  ]

  activeTreatments.forEach((t) => {
    const progress = (t.currentAlignerNumber / t.totalAligners) * 100
    if (progress <= 25) progressRanges[0].count++
    else if (progress <= 50) progressRanges[1].count++
    else if (progress <= 75) progressRanges[2].count++
    else progressRanges[3].count++
  })

  // Adherence mock data (would come from aligner wear sessions)
  const adherenceData = [
    { week: 'Sem 1', aderencia: 85, meta: 80 },
    { week: 'Sem 2', aderencia: 88, meta: 80 },
    { week: 'Sem 3', aderencia: 82, meta: 80 },
    { week: 'Sem 4', aderencia: 90, meta: 80 },
  ]

  // Top performers
  const topPerformers = activeTreatments
    .map((t) => {
      const patient = patients.find((p) => p.id === t.patientId)
      const progress = (t.currentAlignerNumber / t.totalAligners) * 100
      return {
        name: patient?.fullName || 'Desconhecido',
        progress,
        currentAligner: t.currentAlignerNumber,
        totalAligners: t.totalAligners,
      }
    })
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 5)

  const stats = [
    {
      title: 'Total de Pacientes',
      value: patients.length,
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-500',
      bgGradient: 'from-blue-400 to-cyan-400',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Progresso Médio',
      value: `${averageProgress.toFixed(0)}%`,
      change: '+5%',
      trend: 'up',
      icon: TrendingUp,
      color: 'text-green-500',
      bgGradient: 'from-green-400 to-teal-400',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-200',
    },
    {
      title: 'Taxa de Conclusão',
      value: `${completionRate.toFixed(0)}%`,
      change: '+8%',
      trend: 'up',
      icon: Award,
      color: 'text-purple-500',
      bgGradient: 'from-purple-400 to-pink-400',
      bgLight: 'bg-purple-50',
      borderColor: 'border-purple-200',
    },
    {
      title: 'Alertas Ativos',
      value: overdueAligners.length + atRiskAligners.length,
      change: '-15%',
      trend: 'down',
      icon: AlertTriangle,
      color: 'text-red-500',
      bgGradient: 'from-red-400 to-orange-400',
      bgLight: 'bg-red-50',
      borderColor: 'border-red-200',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Relatórios Clínicos</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="rounded-2xl border-2 border-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8 shadow-xl">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Relatórios Clínicos
            </h1>
            <p className="text-base text-gray-600 mt-2 font-medium">
              Análise profunda e insights sobre o desempenho da clínica
            </p>
          </div>
          <div className="flex gap-2">
            {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
              <Button
                key={period}
                variant={timeFilter === period ? 'default' : 'outline'}
                onClick={() => setTimeFilter(period)}
                className="rounded-xl font-bold"
              >
                {period === 'week' && '7 dias'}
                {period === 'month' && '30 dias'}
                {period === 'quarter' && '90 dias'}
                {period === 'year' && '1 ano'}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={`rounded-2xl border-2 ${stat.borderColor} ${stat.bgLight} shadow-lg hover-scale transition-all duration-300`}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-gray-700">{stat.title}</CardTitle>
              <div
                className={`h-12 w-12 rounded-full bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center shadow-md`}
              >
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-4xl font-extrabold tracking-tight">{stat.value}</div>
                <div
                  className={`flex items-center gap-1 text-sm font-bold ${
                    stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  {stat.trend === 'up' ? (
                    <ArrowUp className="h-4 w-4" />
                  ) : (
                    <ArrowDown className="h-4 w-4" />
                  )}
                  {stat.change}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Status Distribution */}
        <Card className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-md">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              Distribuição de Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Progress Distribution */}
        <Card className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-md">
                <Activity className="h-5 w-5 text-white" />
              </div>
              Distribuição de Progresso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={progressRanges}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {progressRanges.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Adherence Trend */}
      <Card className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-teal-50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center shadow-md">
              <Target className="h-5 w-5 text-white" />
            </div>
            Tendência de Aderência (Últimas 4 Semanas)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={adherenceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="week" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="aderencia"
                stroke="#10b981"
                strokeWidth={3}
                name="Aderência Média"
              />
              <Line type="monotone" dataKey="meta" stroke="#ef4444" strokeWidth={2} name="Meta" strokeDasharray="5 5" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card className="rounded-2xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl font-bold">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-md">
              <Award className="h-5 w-5 text-white" />
            </div>
            Top 5 - Melhor Progresso
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPerformers.map((performer, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl border-2 border-yellow-200 bg-white shadow-md hover-scale transition-all"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-800">{performer.name}</p>
                  <p className="text-sm text-gray-600 font-medium">
                    Alinhador {performer.currentAligner} de {performer.totalAligners}
                  </p>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-yellow-400 to-orange-400 h-2 rounded-full transition-all"
                      style={{ width: `${performer.progress}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-extrabold text-gray-800">{performer.progress.toFixed(0)}%</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Details */}
        <Card className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-400 to-pink-400 flex items-center justify-center shadow-md">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
                Análise de Atrasos
              </CardTitle>
              <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold px-3 py-1">
                {overdueAligners.length} atrasados
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {overdueAligners.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-400 mb-2" />
                <p className="text-gray-600 font-medium">Nenhum alinhador atrasado!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {overdueAligners.slice(0, 5).map((aligner) => {
                  const patient = patients.find((p) => p.id === aligner.patientId)
                  return (
                    <Link
                      key={aligner.id}
                      to={`/patient/${aligner.patientId}`}
                      className="block p-3 rounded-lg border-2 border-red-200 bg-white hover:border-red-400 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">
                            {patient?.fullName || 'Desconhecido'}
                          </p>
                          <p className="text-xs text-gray-600">Alinhador #{aligner.alignerNumber}</p>
                        </div>
                        <Badge variant="destructive" className="text-xs">
                          Atrasado
                        </Badge>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* At Risk Details */}
        <Card className="rounded-2xl border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-yellow-50 shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center shadow-md">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                Monitoramento de Risco
              </CardTitle>
              <Badge className="bg-gradient-to-r from-orange-400 to-yellow-400 text-orange-900 font-bold px-3 py-1 border-2 border-orange-500">
                {atRiskAligners.length} em risco
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {atRiskAligners.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-400 mb-2" />
                <p className="text-gray-600 font-medium">Nenhum paciente em risco!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {atRiskAligners.slice(0, 5).map((aligner) => {
                  const patient = patients.find((p) => p.id === aligner.patientId)
                  const daysUntil = calculateDaysUntilChange(aligner)
                  return (
                    <Link
                      key={aligner.id}
                      to={`/patient/${aligner.patientId}`}
                      className="block p-3 rounded-lg border-2 border-orange-200 bg-white hover:border-orange-400 hover:shadow-lg transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-gray-800 text-sm">
                            {patient?.fullName || 'Desconhecido'}
                          </p>
                          <p className="text-xs text-gray-600">
                            Alinhador #{aligner.alignerNumber} - {daysUntil} dias
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs border-orange-400 text-orange-700">
                          Atenção
                        </Badge>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-gray-50 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-bold">Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button
              asChild
              className="rounded-xl py-6 text-base font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg"
            >
              <Link to="/patient-management">Ver Todos os Pacientes</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="rounded-xl py-6 text-base font-bold border-2 hover:bg-green-50"
            >
              <Link to="/dashboard">Voltar ao Dashboard</Link>
            </Button>
            <Button
              variant="outline"
              className="rounded-xl py-6 text-base font-bold border-2 hover:bg-blue-50"
            >
              Exportar Relatório
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ClinicianReports
