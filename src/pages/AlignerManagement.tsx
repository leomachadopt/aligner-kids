import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlignerForm, type AlignerFormValues } from '@/components/AlignerForm'
import { alignerService } from '@/services/alignerService'
import type { Aligner, Treatment } from '@/types/aligner'
import { ArrowLeft, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// Mock patient data
const mockPatients = [
  { id: 'patient-1', name: 'João Silva', email: 'joao@example.com' },
  { id: 'patient-2', name: 'Maria Santos', email: 'maria@example.com' },
  { id: 'patient-3', name: 'Pedro Costa', email: 'pedro@example.com' },
]

const AlignerManagement = () => {
  const [searchParams] = useSearchParams()
  const patientIdParam = searchParams.get('patientId')
  const [selectedPatientId, setSelectedPatientId] = useState(
    patientIdParam || '',
  )
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [aligners, setAligners] = useState<Aligner[]>([])
  const [editingAligner, setEditingAligner] = useState<Aligner | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      try {
        const allTreatments: Treatment[] = []
        const allAligners: Aligner[] = []

        for (const patient of mockPatients) {
          const treatment = await alignerService.getTreatmentByPatient(patient.id)
          const patientAligners = await alignerService.getAlignersByPatient(
            patient.id,
          )

          if (treatment) {
            allTreatments.push(treatment)
          }
          allAligners.push(...patientAligners)
        }

        setTreatments(allTreatments)
        setAligners(allAligners)
      } catch (error) {
        console.error('Error loading data:', error)
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os dados.',
          variant: 'destructive',
        })
      }
    }

    loadData()
  }, [toast])

  const handleSubmit = async (data: AlignerFormValues) => {
    setIsLoading(true)
    try {
      if (editingAligner) {
        // Update existing aligner
        await alignerService.updateAligner(editingAligner.id, {
          changeInterval: data.changeInterval,
          wearTime: data.wearTime,
          notes: data.notes,
        })
        toast({
          title: 'Sucesso',
          description: 'Alinhador atualizado com sucesso!',
        })
        setEditingAligner(null)
      } else {
        // Create new aligner
        const treatment = treatments.find((t) => t.patientId === data.patientId)
        if (!treatment) {
          throw new Error('Tratamento não encontrado para este paciente')
        }

        const expectedEndDate = new Date()
        expectedEndDate.setDate(
          expectedEndDate.getDate() + data.changeInterval,
        )

        await alignerService.createAligner({
          number: data.number,
          patientId: data.patientId,
          startDate: new Date().toISOString(),
          expectedEndDate: expectedEndDate.toISOString(),
          actualEndDate: null,
          status: 'pending',
          changeInterval: data.changeInterval,
          wearTime: data.wearTime,
          notes: data.notes,
        })

        toast({
          title: 'Sucesso',
          description: 'Alinhador cadastrado com sucesso!',
        })

        // Reset form
        setSelectedPatientId('')
      }

      // Reload data
      const patientAligners = await alignerService.getAlignersByPatient(
        selectedPatientId || patientIdParam || '',
      )
      setAligners(patientAligners)
    } catch (error) {
      console.error('Error saving aligner:', error)
      toast({
        title: 'Erro',
        description:
          error instanceof Error
            ? error.message
            : 'Não foi possível salvar o alinhador.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (aligner: Aligner) => {
    setEditingAligner(aligner)
    setSelectedPatientId(aligner.patientId)
  }

  const handleCancel = () => {
    setEditingAligner(null)
    if (!patientIdParam) {
      setSelectedPatientId('')
    }
  }

  const patientAligners = aligners.filter(
    (a) => a.patientId === (selectedPatientId || patientIdParam),
  )

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to={patientIdParam ? `/patient/${patientIdParam}` : '/patient-management'}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">
            {editingAligner
              ? 'Editar Alinhador'
              : 'Cadastrar Novo Alinhador'}
          </h1>
          <p className="text-muted-foreground">
            {editingAligner
              ? 'Atualize as informações do alinhador'
              : 'Cadastre um novo alinhador para um paciente'}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>
              {editingAligner ? 'Editar' : 'Cadastrar'} Alinhador
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AlignerForm
              onSubmit={handleSubmit}
              aligner={editingAligner || undefined}
              defaultValues={{
                patientId: selectedPatientId || patientIdParam || '',
              }}
              isLoading={isLoading}
            />
            {editingAligner && (
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={handleCancel}
              >
                Cancelar Edição
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Alinhadores do Paciente</CardTitle>
          </CardHeader>
          <CardContent>
            {patientIdParam || selectedPatientId ? (
              <div className="space-y-3">
                {patientAligners.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum alinhador cadastrado para este paciente.
                  </p>
                ) : (
                  patientAligners
                    .sort((a, b) => a.number - b.number)
                    .map((aligner) => (
                      <div
                        key={aligner.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div>
                          <p className="font-semibold">
                            Alinhador #{aligner.number}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Status: {aligner.status} | Troca a cada{' '}
                            {aligner.changeInterval} dias
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(aligner)}
                        >
                          Editar
                        </Button>
                      </div>
                    ))
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Plus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Selecione um paciente para ver seus alinhadores
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default AlignerManagement

