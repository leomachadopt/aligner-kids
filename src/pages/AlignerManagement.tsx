import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlignerForm, type AlignerFormValues } from '@/components/AlignerForm'
import { alignerService } from '@/services/alignerService'
import { AuthService } from '@/services/authService'
import { useAuth } from '@/context/AuthContext'
import type { Aligner, Treatment } from '@/types/aligner'
import type { User } from '@/types/user'
import { ArrowLeft, Plus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { format } from 'date-fns'

const AlignerManagement = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const patientIdParam = searchParams.get('patientId')
  const { user: currentUser } = useAuth()
  const [selectedTreatmentId, setSelectedTreatmentId] = useState<string>('')
  const [selectedPatientId, setSelectedPatientId] = useState(
    patientIdParam || '',
  )
  const [patients, setPatients] = useState<User[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [aligners, setAligners] = useState<Aligner[]>([])
  const [editingAligner, setEditingAligner] = useState<Aligner | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser?.clinicId) return

      try {
        // Buscar pacientes reais da clínica (async)
        const allUsers = await AuthService.getUsersByClinicAsync(currentUser.clinicId)
        const clinicPatients = allUsers.filter(
          (u) => u.role === 'patient' || u.role === 'child-patient'
        )
        setPatients(clinicPatients)

        // Se veio um patientId na URL e não está selecionado ainda, setar
        if (patientIdParam && !selectedPatientId) {
          const exists = clinicPatients.some((p) => p.id === patientIdParam)
          if (exists) setSelectedPatientId(patientIdParam)
        }

        const allTreatments: Treatment[] = []
        const allAligners: Aligner[] = []

        for (const patient of clinicPatients) {
          const treatment = await alignerService.getTreatmentByPatient(patient.id)
          const patientAligners = await alignerService.getAlignersByPatient(
            patient.id,
            treatment?.id,
          )

          if (treatment) {
            allTreatments.push(treatment)
          }
          allAligners.push(...patientAligners)
        }

        setTreatments(allTreatments)
        setAligners(allAligners)

        // Selecionar tratamento do paciente selecionado, se existir
        if (!selectedTreatmentId && allTreatments.length > 0) {
          const t = allTreatments.find((t) => t.patientId === (patientIdParam || selectedPatientId))
          if (t) setSelectedTreatmentId(t.id)
        }
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
  }, [currentUser, toast])

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
        let treatment = treatments.find((t) => t.id === selectedTreatmentId)

        // Se não existe tratamento, criar automaticamente
        if (!treatment) {
          const patient = patients.find((p) => p.id === data.patientId)
          if (!patient) {
            throw new Error('Paciente não encontrado')
          }

          // Criar tratamento inicial (assumindo que terá múltiplos alinhadores)
          treatment = await alignerService.createTreatment({
            patientId: data.patientId,
            startDate: format(new Date(), 'yyyy-MM-dd'),
            totalAligners: data.number, // inicia com o total igual ao número cadastrado
            currentAlignerNumber: 1, // progresso inicia no 1
            status: 'active',
          })

          // Atualizar lista de tratamentos
          setTreatments([...treatments, treatment])
          setSelectedTreatmentId(treatment.id)

          toast({
            title: 'Tratamento criado',
            description: `Tratamento iniciado para ${patient.fullName}`,
          })
        }

        const expectedEndDate = new Date()
        expectedEndDate.setDate(
          expectedEndDate.getDate() + data.changeInterval,
        )

        await alignerService.createAligner({
          number: data.number,
          patientId: data.patientId,
          treatmentId: treatment.id,
          startDate: format(new Date(), 'yyyy-MM-dd'),
          expectedEndDate: format(expectedEndDate, 'yyyy-MM-dd'),
          actualEndDate: null,
          status: data.number === 1 ? 'active' : 'pending',
          changeInterval: data.changeInterval,
          wearTime: data.wearTime,
          notes: data.notes,
        })

        // Atualizar tratamento se necessário
        if (data.number > treatment.totalAligners) {
          await alignerService.updateTreatment(treatment.id, {
            totalAligners: data.number,
          })
        }

        toast({
          title: 'Sucesso',
          description: 'Alinhador cadastrado com sucesso!',
        })

        // Reset form
        setSelectedPatientId('')

        // Fechar a tela voltando para os detalhes do paciente, quando houver paciente selecionado
        const targetPatientId = data.patientId || patientIdParam
        if (targetPatientId) {
          navigate(`/patient/${targetPatientId}`)
          return
        }
      }

      // Reload data
      const patientAligners = await alignerService.getAlignersByPatient(
        selectedPatientId || patientIdParam || '',
        selectedTreatmentId || undefined,
      )
      setAligners(patientAligners)

      // Reload treatments
      if (!editingAligner && currentUser?.clinicId) {
        const allTreatments: Treatment[] = []
        for (const patient of patients) {
          const t = await alignerService.getTreatmentByPatient(patient.id)
          if (t) {
            allTreatments.push(t)
          }
        }
        setTreatments(allTreatments)
      }
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
    <div className="space-y-8 animate-fade-in-up">
      <div className="rounded-2xl border-2 border-gradient-to-r from-teal-400 via-green-400 to-blue-400 bg-gradient-to-br from-teal-50 via-green-50 to-blue-50 p-6 shadow-xl">
        <div className="flex items-center gap-6">
          <Button asChild className="rounded-full h-14 w-14 bg-gradient-to-r from-teal-500 to-green-500 hover:from-teal-600 hover:to-green-600 shadow-lg hover-bounce">
            <Link to={patientIdParam ? `/patient/${patientIdParam}` : '/patient-management'}>
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-teal-600 via-green-600 to-blue-600 bg-clip-text text-transparent">
              {editingAligner ? 'Editar Alinhador' : 'Cadastrar Novo Alinhador'}
            </h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">
              {editingAligner
                ? 'Atualize as informações do alinhador'
                : 'Cadastre um novo alinhador para um paciente'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-teal-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center shadow-md">
                <Plus className="h-6 w-6 text-white" />
              </div>
              {editingAligner ? 'Editar' : 'Cadastrar'} Alinhador
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!patientIdParam && !selectedPatientId && !editingAligner && (
              <div className="mb-6">
                <label htmlFor="patient-select" className="text-sm font-bold uppercase text-gray-600 mb-3 block">
                  Selecione o Paciente *
                </label>
                <select
                  id="patient-select"
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full rounded-xl border-2 border-green-200 bg-white px-4 py-3 font-medium focus:border-green-400 focus:outline-none"
                >
                  <option value="">-- Escolha um paciente --</option>
                  {patients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.fullName} - {patient.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(selectedPatientId || patientIdParam) && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-sm">
                <p className="text-sm font-bold text-gray-800">
                  🎯 Paciente selecionado: {
                    patients.find((p) => p.id === (selectedPatientId || patientIdParam))?.fullName
                  }
                </p>
              </div>
            )}

            <AlignerForm
              onSubmit={handleSubmit}
              aligner={editingAligner || undefined}
              defaultValues={{
                patientId: selectedPatientId || patientIdParam || '',
                number: patientAligners.length + 1,
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



