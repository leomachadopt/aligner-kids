import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { alignerService } from '@/services/alignerService'
import { useEffect, useState } from 'react'
import type { Treatment, Aligner } from '@/types/aligner'
import { isAlignerOverdue, calculateDaysUntilChange } from '@/utils/alignerCalculations'

// Mock patient data - in production, get from API
const mockPatients = [
  { id: 'patient-1', name: 'João Silva', email: 'joao@example.com' },
  { id: 'patient-2', name: 'Maria Santos', email: 'maria@example.com' },
  { id: 'patient-3', name: 'Pedro Costa', email: 'pedro@example.com' },
]

const ClinicianDashboard = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [aligners, setAligners] = useState<Aligner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const allAligners: Aligner[] = []
        const allTreatments: Treatment[] = []

        for (const patient of mockPatients) {
          const patientAligners = await alignerService.getAlignersByPatient(
            patient.id,
          )
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
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const activeTreatments = treatments.filter((t) => t.status === 'active')
  const overdueAligners = aligners.filter((a) => isAlignerOverdue(a))
  const atRiskAligners = aligners.filter((a) => {
    if (a.status !== 'active') return false
    const daysUntil = calculateDaysUntilChange(a)
    return daysUntil <= 2 && daysUntil > 0
  })

  const stats = [
    {
      title: 'Pacientes Ativos',
      value: activeTreatments.length,
      icon: Users,
      color: 'text-blue-500',
    },
    {
      title: 'Alinhadores Atrasados',
      value: overdueAligners.length,
      icon: AlertTriangle,
      color: 'text-red-500',
    },
    {
      title: 'Requerem Atenção',
      value: atRiskAligners.length,
      icon: Clock,
      color: 'text-yellow-500',
    },
    {
      title: 'Tratamentos Concluídos',
      value: treatments.filter((t) => t.status === 'completed').length,
      icon: CheckCircle2,
      color: 'text-green-500',
    },
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard Clínico</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Dashboard Clínico</h1>
        <Button asChild>
          <Link to="/patient-management">Gerenciar Pacientes</Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Alinhadores Atrasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueAligners.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhum alinhador atrasado no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {overdueAligners.map((aligner) => {
                  const patient = mockPatients.find(
                    (p) => p.id === aligner.patientId,
                  )
                  return (
                    <div
                      key={aligner.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-red-200 bg-red-50"
                    >
                      <div>
                        <p className="font-semibold">
                          {patient?.name || 'Paciente desconhecido'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Alinhador #{aligner.number}
                        </p>
                      </div>
                      <Badge variant="destructive">Atrasado</Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Requerem Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atRiskAligners.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhum paciente requerendo atenção no momento.
              </p>
            ) : (
              <div className="space-y-3">
                {atRiskAligners.map((aligner) => {
                  const patient = mockPatients.find(
                    (p) => p.id === aligner.patientId,
                  )
                  const daysUntil = calculateDaysUntilChange(aligner)
                  return (
                    <div
                      key={aligner.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-yellow-200 bg-yellow-50"
                    >
                      <div>
                        <p className="font-semibold">
                          {patient?.name || 'Paciente desconhecido'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Alinhador #{aligner.number} - {daysUntil} dias restantes
                        </p>
                      </div>
                      <Badge variant="outline" className="border-yellow-500">
                        Atenção
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pacientes Ativos</CardTitle>
            <Button variant="outline" asChild>
              <Link to="/patient-management">Ver Todos</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeTreatments.slice(0, 5).map((treatment) => {
              const patient = mockPatients.find(
                (p) => p.id === treatment.patientId,
              )
              const patientAligners = aligners.filter(
                (a) => a.patientId === treatment.patientId,
              )
              const progress =
                (treatment.currentAlignerNumber / treatment.totalAligners) * 100

              return (
                <Link
                  key={treatment.id}
                  to={`/patient/${treatment.patientId}`}
                  className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-semibold">
                        {patient?.name || 'Paciente desconhecido'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Alinhador {treatment.currentAlignerNumber} de{' '}
                        {treatment.totalAligners}
                      </p>
                      <div className="mt-2 w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ClinicianDashboard

