import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Link } from 'react-router-dom'
import { Search, Users, TrendingUp, AlertTriangle } from 'lucide-react'
import { alignerService } from '@/services/alignerService'
import type { Treatment, Aligner } from '@/types/aligner'
import { isAlignerOverdue } from '@/utils/alignerCalculations'

// Mock patient data
const mockPatients = [
  { id: 'patient-1', name: 'João Silva', email: 'joao@example.com' },
  { id: 'patient-2', name: 'Maria Santos', email: 'maria@example.com' },
  { id: 'patient-3', name: 'Pedro Costa', email: 'pedro@example.com' },
]

const PatientManagement = () => {
  const [treatments, setTreatments] = useState<
    Array<Treatment & { patient: typeof mockPatients[0] }>
  >([])
  const [aligners, setAligners] = useState<Aligner[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadData = async () => {
      try {
        const allAligners: Aligner[] = []
        const treatmentsWithPatients: Array<
          Treatment & { patient: typeof mockPatients[0] }
        > = []

        for (const patient of mockPatients) {
          const patientAligners = await alignerService.getAlignersByPatient(
            patient.id,
          )
          const treatment = await alignerService.getTreatmentByPatient(patient.id)

          allAligners.push(...patientAligners)
          if (treatment) {
            treatmentsWithPatients.push({ ...treatment, patient })
          }
        }

        setAligners(allAligners)
        setTreatments(treatmentsWithPatients)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  const filteredTreatments = treatments.filter((treatment) =>
    treatment.patient.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const getPatientStatus = (treatment: Treatment) => {
    const patientAligners = aligners.filter(
      (a) => a.patientId === treatment.patientId,
    )
    const hasOverdue = patientAligners.some((a) => isAlignerOverdue(a))
    const activeAligner = patientAligners.find((a) => a.status === 'active')

    if (treatment.status === 'completed') {
      return { label: 'Concluído', variant: 'default' as const }
    }
    if (hasOverdue) {
      return { label: 'Atrasado', variant: 'destructive' as const }
    }
    if (activeAligner) {
      return { label: 'Em Tratamento', variant: 'default' as const }
    }
    return { label: 'Sem alinhador ativo', variant: 'secondary' as const }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gerenciamento de Pacientes</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Pacientes</h1>
          <p className="text-muted-foreground">
            Visualize e gerencie todos os pacientes
          </p>
        </div>
        <Button asChild>
          <Link to="/aligner-management">Cadastrar Alinhador</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Paciente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Digite o nome do paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredTreatments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchTerm
                  ? 'Nenhum paciente encontrado com esse nome.'
                  : 'Nenhum paciente cadastrado ainda.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTreatments.map((treatment) => {
            const patientAligners = aligners.filter(
              (a) => a.patientId === treatment.patientId,
            )
            const progress =
              (treatment.currentAlignerNumber / treatment.totalAligners) * 100
            const status = getPatientStatus(treatment)

            return (
              <Card key={treatment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-semibold">
                          {treatment.patient.name}
                        </h3>
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {treatment.patient.email}
                      </p>
                      <div className="flex items-center gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Progresso
                          </p>
                          <p className="text-lg font-semibold">
                            {treatment.currentAlignerNumber} /{' '}
                            {treatment.totalAligners} alinhadores
                          </p>
                        </div>
                        <div className="flex-1">
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            {progress.toFixed(0)}%
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" asChild>
                        <Link to={`/patient/${treatment.patientId}`}>
                          Ver Detalhes
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

export default PatientManagement

