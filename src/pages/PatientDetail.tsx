import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ArrowLeft } from 'lucide-react'
import { alignerService } from '@/services/alignerService'
import { AuthService } from '@/services/authService'
import { ClinicService } from '@/services/clinicService'
import { useAuth } from '@/context/AuthContext'
import type { Treatment, Aligner } from '@/types/aligner'
import type { User } from '@/types/user'
import type { Clinic } from '@/types/clinic'
import { COUNTRY_INFO } from '@/types/clinic'
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
import { toast } from 'sonner'

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  const [patient, setPatient] = useState<User | null>(null)
  const [treatment, setTreatment] = useState<Treatment | null>(null)
  const [aligners, setAligners] = useState<Aligner[]>([])
  const [loading, setLoading] = useState(true)
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [isEditTreatmentOpen, setIsEditTreatmentOpen] = useState(false)
  const [editTreatmentData, setEditTreatmentData] = useState({
    totalAligners: 0,
    status: 'active' as 'active' | 'completed' | 'paused' | 'cancelled',
  })
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false)
  const [editPatientData, setEditPatientData] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    cpf: '',
    guardianName: '',
    guardianCpf: '',
    guardianPhone: '',
  })

  useEffect(() => {
    const loadData = async () => {
      if (!id || !currentUser) return

      try {
        // Buscar paciente
        const patientData = AuthService.getUserById(id)

        // Validar que o paciente pertence à mesma clínica do ortodontista
        if (currentUser.role === 'orthodontist' && patientData?.clinicId !== currentUser.clinicId) {
          toast.error('Você não tem permissão para acessar este paciente')
          setLoading(false)
          return
        }

        setPatient(patientData)

        // Buscar dados da clínica
        if (patientData?.clinicId) {
          const clinicData = await ClinicService.getClinicById(patientData.clinicId)
          setClinic(clinicData)
        }

        const patientTreatment = await alignerService.getTreatmentByPatient(id)
        const patientAligners = await alignerService.getAlignersByPatient(id)

        setTreatment(patientTreatment)
        setAligners(patientAligners)
      } catch (error) {
        console.error('Error loading patient data:', error)
        toast.error('Erro ao carregar dados do paciente')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, currentUser])

  const handleEditTreatment = () => {
    if (treatment) {
      setEditTreatmentData({
        totalAligners: treatment.totalAligners,
        status: treatment.status,
      })
      setIsEditTreatmentOpen(true)
    }
  }

  const handleSaveTreatment = async () => {
    if (!treatment || !id) return

    try {
      await alignerService.updateTreatment(treatment.id, {
        totalAligners: editTreatmentData.totalAligners,
        status: editTreatmentData.status,
      })

      // Recarregar dados
      const updatedTreatment = await alignerService.getTreatmentByPatient(id)
      setTreatment(updatedTreatment)

      toast.success('Tratamento atualizado com sucesso!')
      setIsEditTreatmentOpen(false)
    } catch (error) {
      console.error('Error updating treatment:', error)
      toast.error('Erro ao atualizar tratamento')
    }
  }

  const handleEditPatient = () => {
    if (patient) {
      setEditPatientData({
        fullName: patient.fullName || '',
        email: patient.email || '',
        phone: patient.phone || '',
        birthDate: patient.birthDate || '',
        cpf: patient.cpf || '',
        guardianName: patient.guardianName || '',
        guardianCpf: patient.guardianCpf || '',
        guardianPhone: patient.guardianPhone || '',
      })
      setIsEditPatientOpen(true)
    }
  }

  const handleSavePatient = async () => {
    if (!patient || !id) return

    try {
      await AuthService.updateProfile(id, {
        fullName: editPatientData.fullName,
        email: editPatientData.email,
        phone: editPatientData.phone,
        birthDate: editPatientData.birthDate || undefined,
      })

      // Recarregar dados do paciente
      const updatedPatient = AuthService.getUserById(id)
      setPatient(updatedPatient)

      toast.success('Dados do paciente atualizados com sucesso!')
      setIsEditPatientOpen(false)
    } catch (error) {
      console.error('Error updating patient:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao atualizar paciente')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Detalhes do Paciente</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  if (!patient || !id) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Paciente não encontrado</h1>
        <Button asChild>
          <Link to="/patient-management">Voltar para Lista</Link>
        </Button>
      </div>
    )
  }

  const currentAligner = aligners.find((a) => a.status === 'active')
  const progress = treatment ? calculateTreatmentProgress(treatment) : 0
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
            {patient.fullName}
          </h1>
          <p className="text-muted-foreground">{patient.email}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Informações do Tratamento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!treatment ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Este paciente ainda não possui um tratamento iniciado.
                </p>
                <Button asChild>
                  <Link to="/aligner-management">Cadastrar Tratamento</Link>
                </Button>
              </div>
            ) : (
              <>
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
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleEditPatient}
            >
              Editar Dados do Paciente
            </Button>
            <Button className="w-full" asChild>
              <Link to={`/aligner-management?patientId=${id}`}>
                Cadastrar Alinhador
              </Link>
            </Button>
            {treatment && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleEditTreatment}
              >
                Editar Tratamento
              </Button>
            )}
            <Button variant="outline" className="w-full" disabled>
              Enviar Mensagem
            </Button>
          </CardContent>
        </Card>
      </div>

      {treatment && (
        <TreatmentTimeline
          aligners={aligners}
          currentAlignerNumber={treatment.currentAlignerNumber}
        />
      )}

      {treatment && chartData.length > 0 && (
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

      {/* Dialog: Editar Tratamento */}
      <Dialog open={isEditTreatmentOpen} onOpenChange={setIsEditTreatmentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Tratamento</DialogTitle>
            <DialogDescription>
              Atualize as informações do tratamento de {patient.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="total-aligners">Total de Alinhadores</Label>
              <Input
                id="total-aligners"
                type="number"
                min="1"
                value={editTreatmentData.totalAligners}
                onChange={(e) =>
                  setEditTreatmentData({
                    ...editTreatmentData,
                    totalAligners: parseInt(e.target.value, 10) || 0,
                  })
                }
              />
              <p className="text-xs text-muted-foreground mt-1">
                Quantidade total de alinhadores planejados para o tratamento
              </p>
            </div>

            <div>
              <Label htmlFor="treatment-status">Status do Tratamento</Label>
              <select
                id="treatment-status"
                value={editTreatmentData.status}
                onChange={(e) =>
                  setEditTreatmentData({
                    ...editTreatmentData,
                    status: e.target.value as any,
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="active">Ativo</option>
                <option value="paused">Pausado</option>
                <option value="completed">Concluído</option>
                <option value="cancelled">Cancelado</option>
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditTreatmentOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveTreatment}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Dados do Paciente */}
      <Dialog open={isEditPatientOpen} onOpenChange={setIsEditPatientOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Dados do Paciente</DialogTitle>
            <DialogDescription>
              Atualize as informações de {patient?.fullName}
            </DialogDescription>
          </DialogHeader>

          {(() => {
            const countryInfo = COUNTRY_INFO[clinic?.country || 'BR']
            const isChild = patient?.role === 'child-patient'

            return (
              <div className="space-y-4">
                {/* Dados do Paciente */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">
                    {isChild ? 'Dados da Criança' : 'Dados do Paciente'}
                  </h3>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="edit-fullName">Nome Completo *</Label>
                      <Input
                        id="edit-fullName"
                        value={editPatientData.fullName}
                        onChange={(e) =>
                          setEditPatientData({
                            ...editPatientData,
                            fullName: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-birthDate">Data de Nascimento</Label>
                      <Input
                        id="edit-birthDate"
                        type="date"
                        value={editPatientData.birthDate}
                        onChange={(e) =>
                          setEditPatientData({
                            ...editPatientData,
                            birthDate: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2 mt-4">
                    <div>
                      <Label htmlFor="edit-email">
                        {isChild ? 'Email do Responsável *' : 'Email *'}
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={editPatientData.email}
                        onChange={(e) =>
                          setEditPatientData({
                            ...editPatientData,
                            email: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="edit-phone">{countryInfo.phoneLabel} *</Label>
                      <Input
                        id="edit-phone"
                        value={editPatientData.phone}
                        onChange={(e) =>
                          setEditPatientData({
                            ...editPatientData,
                            phone: e.target.value,
                          })
                        }
                        placeholder={countryInfo.phoneFormat}
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <Label htmlFor="edit-cpf">{countryInfo.documentLabel}</Label>
                    <Input
                      id="edit-cpf"
                      value={editPatientData.cpf}
                      onChange={(e) =>
                        setEditPatientData({
                          ...editPatientData,
                          cpf: e.target.value,
                        })
                      }
                      placeholder={countryInfo.documentPlaceholder}
                      disabled
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {countryInfo.documentLabel} não pode ser alterado
                    </p>
                  </div>
                </div>

                {/* Dados do Responsável (apenas para child-patient) */}
                {isChild && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">
                      Dados do Responsável
                    </h3>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label htmlFor="edit-guardianName">
                          Nome do Responsável
                        </Label>
                        <Input
                          id="edit-guardianName"
                          value={editPatientData.guardianName}
                          onChange={(e) =>
                            setEditPatientData({
                              ...editPatientData,
                              guardianName: e.target.value,
                            })
                          }
                          disabled
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-guardianCpf">
                          {countryInfo.documentLabel} do Responsável
                        </Label>
                        <Input
                          id="edit-guardianCpf"
                          value={editPatientData.guardianCpf}
                          onChange={(e) =>
                            setEditPatientData({
                              ...editPatientData,
                              guardianCpf: e.target.value,
                            })
                          }
                          disabled
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <Label htmlFor="edit-guardianPhone">
                        {countryInfo.phoneLabel} do Responsável
                      </Label>
                      <Input
                        id="edit-guardianPhone"
                        value={editPatientData.guardianPhone}
                        onChange={(e) =>
                          setEditPatientData({
                            ...editPatientData,
                            guardianPhone: e.target.value,
                          })
                        }
                        disabled
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Dados do responsável não podem ser alterados
                    </p>
                  </div>
                )}
              </div>
            )
          })()}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditPatientOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSavePatient}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PatientDetail

