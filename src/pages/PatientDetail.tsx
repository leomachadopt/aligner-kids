import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft } from 'lucide-react'
import { alignerService } from '@/services/alignerService'
import type { Treatment, Aligner } from '@/types/aligner'
import { TreatmentTimeline } from '@/components/TreatmentTimeline'
import {
  calculateTreatmentProgress,
  isAlignerOverdue,
  calculateDaysUntilChange,
} from '@/utils/alignerCalculations'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

// Mock patient data
const mockPatients: Record<string, { name: string; email: string }> = {
  'patient-1': { name: 'João Silva', email: 'joao@example.com' },
  'patient-2': { name: 'Maria Santos', email: 'maria@example.com' },
  'patient-3': { name: 'Pedro Costa', email: 'pedro@example.com' },
}

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>()
  const [treatment, setTreatment] = useState<Treatment | null>(null)
  const [aligners, setAligners] = useState<Aligner[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      if (!id) return

      try {
        const patientTreatment = await alignerService.getTreatmentByPatient(id)
        const patientAligners = await alignerService.getAlignersByPatient(id)

        setTreatment(patientTreatment)
        setAligners(patientAligners)
      } catch (error) {
        console.error('Error loading patient data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id])

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Detalhes do Paciente</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!treatment || !id) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Paciente não encontrado</h1>
        <Button asChild>
          <Link to="/patient-management">Voltar para Lista</Link>
        </Button>
      </div>
    )
  }

  const patient = mockPatients[id]
  const currentAligner = aligners.find((a) => a.status === 'active')
  const progress = calculateTreatmentProgress(treatment)
  const isOverdue = currentAligner ? isAlignerOverdue(currentAligner) : false

  // Prepare chart data for adherence
  const chartData = aligners
    .filter((a) => a.status === 'completed' || a.status === 'active')
    .map((a) => ({
      name: `Alinhador #${a.number}`,
      dias: a.usageDays,
      horas: a.usageHours,
    }))

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/patient-management">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {patient?.name || 'Paciente Desconhecido'}
          </h1>
          <p className="text-muted-foreground">{patient?.email}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações do Tratamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    treatment.status === 'active'
                      ? 'default'
                      : treatment.status === 'completed'
                        ? 'default'
                        : 'secondary'
                  }
                >
                  {treatment.status === 'active' && 'Ativo'}
                  {treatment.status === 'completed' && 'Concluído'}
                  {treatment.status === 'paused' && 'Pausado'}
                  {treatment.status === 'cancelled' && 'Cancelado'}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Progresso</p>
                <p className="text-lg font-semibold">{progress.toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Alinhador Atual
                </p>
                <p className="text-lg font-semibold">
                  #{treatment.currentAlignerNumber} de {treatment.totalAligners}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Data de Início
                </p>
                <p className="text-lg font-semibold">
                  {new Date(treatment.startDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            {currentAligner && (
              <div className="mt-4 p-4 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      Alinhador #{currentAligner.number}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {isOverdue
                        ? 'Atrasado para troca'
                        : `${calculateDaysUntilChange(currentAligner)} dias até a próxima troca`}
                    </p>
                  </div>
                  {isOverdue && (
                    <Badge variant="destructive">Atrasado</Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button className="w-full" asChild>
              <Link to={`/aligner-management?patientId=${id}`}>
                Cadastrar Alinhador
              </Link>
            </Button>
            <Button variant="outline" className="w-full">
              Editar Tratamento
            </Button>
            <Button variant="outline" className="w-full">
              Enviar Mensagem
            </Button>
          </CardContent>
        </Card>
      </div>

      <TreatmentTimeline
        aligners={aligners}
        currentAlignerNumber={treatment.currentAlignerNumber}
      />

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="dias" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default PatientDetail

