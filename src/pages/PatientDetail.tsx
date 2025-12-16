import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { PhaseService } from '@/services/phaseService'
import { useAuth } from '@/context/AuthContext'
import type { Treatment, Aligner, TreatmentPhase } from '@/types/aligner'
import type { User } from '@/types/user'
import type { Clinic } from '@/types/clinic'
import { COUNTRY_INFO } from '@/types/clinic'
import { TreatmentTimeline } from '@/components/TreatmentTimeline'
import { PhaseCard } from '@/components/PhaseCard'
import { NewPhaseModal } from '@/components/NewPhaseModal'
import { EditPhaseModal } from '@/components/EditPhaseModal'
import { ChatModal } from '@/components/ChatModal'
import { PatientPhotosView } from '@/components/PatientPhotosView'
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
  const [phases, setPhases] = useState<TreatmentPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [isNewPhaseModalOpen, setIsNewPhaseModalOpen] = useState(false)
  const [isEditPhaseModalOpen, setIsEditPhaseModalOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState<TreatmentPhase | null>(null)
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false)
  const [isViewTreatmentOpen, setIsViewTreatmentOpen] = useState(false)
  const [isDeleteTreatmentOpen, setIsDeleteTreatmentOpen] = useState(false)
  const [isListTreatmentsOpen, setIsListTreatmentsOpen] = useState(false)
  const [allTreatments, setAllTreatments] = useState<Treatment[]>([])
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [editPatientData, setEditPatientData] = useState({
    fullName: '',
    email: '',
    phone: '',
    birthDate: '',
    cpf: '',
    guardianName: '',
    guardianCpf: '',
    guardianPhone: '',
    preferredLanguage: 'pt-BR',
  })

  useEffect(() => {
    const loadData = async () => {
      if (!id || !currentUser) return

      try {
        // Buscar paciente na clínica do usuário logado
        const clinicUsers = await AuthService.getUsersByClinicAsync(currentUser.clinicId || '')
        const patientData = clinicUsers.find((u) => u.id === id) || null

        // Validar permissão (ortodontista só vê pacientes da própria clínica)
        if (
          currentUser.role === 'orthodontist' &&
          patientData?.clinicId !== currentUser.clinicId
        ) {
          toast.error('Você não tem permissão para acessar este paciente')
          setLoading(false)
          return
        }

        if (!patientData) {
          setPatient(null)
          setLoading(false)
          return
        }

        setPatient(patientData)

        // Buscar dados da clínica
        if (patientData.clinicId) {
          const clinicData = await ClinicService.getClinicById(patientData.clinicId)
          setClinic(clinicData)
        }

        const patientTreatment = await alignerService.getTreatmentByPatient(id)
        const patientAligners = await alignerService.getAlignersByPatient(id)

        setTreatment(patientTreatment)
        setAligners(patientAligners)

        // Load phases if treatment exists
        if (patientTreatment) {
          try {
            const treatmentPhases = await PhaseService.getPhasesByTreatment(patientTreatment.id)
            setPhases(treatmentPhases)
          } catch (error) {
            console.error('Error loading phases:', error)
          }
        }
      } catch (error) {
        console.error('Error loading patient data:', error)
        toast.error('Erro ao carregar dados do paciente')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, currentUser])

  const handleDeleteTreatment = async () => {
    if (!treatment || !id) return

    try {
      await alignerService.deleteTreatment(treatment.id)

      // Recarregar dados
      setTreatment(null)
      setAligners([])
      setPhases([])

      toast.success('Tratamento excluído com sucesso!')
      setIsDeleteTreatmentOpen(false)
    } catch (error) {
      console.error('Error deleting treatment:', error)
      toast.error('Erro ao excluir tratamento')
    }
  }

  const handleListTreatments = async () => {
    if (!id) return

    try {
      const treatments = await alignerService.getTreatmentsByPatient(id)
      setAllTreatments(treatments)
      setIsListTreatmentsOpen(true)
    } catch (error) {
      console.error('Error loading treatments:', error)
      toast.error('Erro ao carregar tratamentos')
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
        preferredLanguage: patient.preferredLanguage || 'pt-BR',
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
        preferredLanguage: editPatientData.preferredLanguage,
      })

      // Recarregar dados do paciente a partir do backend
      const clinicUsers = await AuthService.getUsersByClinicAsync(currentUser?.clinicId || '')
      const updatedPatient = clinicUsers.find((u) => u.id === id) || null
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

        {/* Phases Section */}
        {treatment && phases.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Fases do Tratamento</CardTitle>
                <Button
                  onClick={() => setIsNewPhaseModalOpen(true)}
                  size="sm"
                >
                  Iniciar Nova Fase
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {phases.map((phase) => (
                <PhaseCard
                  key={phase.id}
                  phase={phase}
                  isActive={phase.status === 'active'}
                  onEdit={() => {
                    setEditingPhase(phase)
                    setIsEditPhaseModalOpen(true)
                  }}
                  onStart={async () => {
                    try {
                      await PhaseService.startPhase(phase.id)
                      toast.success('Fase iniciada com sucesso!')
                      // Reload phases
                      const updatedPhases = await PhaseService.getPhasesByTreatment(treatment.id)
                      setPhases(updatedPhases)
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar fase')
                    }
                  }}
                  onComplete={async () => {
                    try {
                      await PhaseService.completePhase(phase.id)
                      toast.success('Fase concluída com sucesso!')
                      // Reload phases
                      const updatedPhases = await PhaseService.getPhasesByTreatment(treatment.id)
                      setPhases(updatedPhases)
                    } catch (error) {
                      toast.error(error instanceof Error ? error.message : 'Erro ao concluir fase')
                    }
                  }}
                />
              ))}
            </CardContent>
          </Card>
        )}

        {/* Patient Photos Section */}
        <div className="lg:col-span-2">
          <PatientPhotosView
            patientId={patient.id}
            patientName={patient.fullName}
          />
        </div>

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
            {!treatment ? (
              <Button className="w-full" asChild>
                <Link to={`/aligner-management?patientId=${id}`}>
                  Cadastrar Novo Tratamento
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => setIsViewTreatmentOpen(true)}
                >
                  Visualizar Tratamento Atual
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleListTreatments}
                >
                  Listar Todos os Tratamentos
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setIsDeleteTreatmentOpen(true)}
                >
                  Excluir Tratamento
                </Button>
              </>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setIsChatOpen(true)}
            >
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

                {/* Idioma Preferido */}
                <div>
                  <h3 className="text-sm font-semibold mb-3">Preferências</h3>
                  <div>
                    <Label htmlFor="edit-preferredLanguage">Idioma Preferido</Label>
                    <Select
                      value={editPatientData.preferredLanguage}
                      onValueChange={(value) =>
                        setEditPatientData({ ...editPatientData, preferredLanguage: value })
                      }
                    >
                      <SelectTrigger id="edit-preferredLanguage">
                        <SelectValue placeholder="Selecione o idioma" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pt-BR">🇧🇷 Português (Brasil)</SelectItem>
                        <SelectItem value="pt-PT">🇵🇹 Português (Portugal)</SelectItem>
                        <SelectItem value="en-US">🇺🇸 English (US)</SelectItem>
                        <SelectItem value="es-ES">🇪🇸 Español (España)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1">
                      As histórias e áudios serão gerados neste idioma
                    </p>
                  </div>
                </div>
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

      {/* New Phase Modal */}
      {treatment && (
        <NewPhaseModal
          open={isNewPhaseModalOpen}
          onOpenChange={setIsNewPhaseModalOpen}
          treatmentId={treatment.id}
          patientName={patient?.fullName || ''}
          lastPhase={phases[phases.length - 1] || null}
          onSuccess={async () => {
            // Reload phases after creating new one
            try {
              const updatedPhases = await PhaseService.getPhasesByTreatment(treatment.id)
              setPhases(updatedPhases)
            } catch (error) {
              console.error('Error reloading phases:', error)
            }
          }}
        />
      )}

      {/* Edit Phase Modal */}
      {editingPhase && (
        <EditPhaseModal
          open={isEditPhaseModalOpen}
          onOpenChange={setIsEditPhaseModalOpen}
          phase={editingPhase}
          onSuccess={async () => {
            // Reload phases after editing
            try {
              if (treatment) {
                const updatedPhases = await PhaseService.getPhasesByTreatment(treatment.id)
                setPhases(updatedPhases)
              }
            } catch (error) {
              console.error('Error reloading phases:', error)
            }
          }}
        />
      )}

      {/* Dialog: Visualizar Tratamento */}
      {treatment && (
        <Dialog open={isViewTreatmentOpen} onOpenChange={setIsViewTreatmentOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Tratamento</DialogTitle>
              <DialogDescription>
                Informações completas do tratamento de {patient?.fullName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">ID do Tratamento</p>
                  <p className="text-sm font-mono">{treatment.id}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Status</p>
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
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Data de Início</p>
                  <p className="text-sm">
                    {new Date(treatment.startDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Data de Término</p>
                  <p className="text-sm">
                    {treatment.endDate
                      ? new Date(treatment.endDate).toLocaleDateString('pt-BR')
                      : 'Em andamento'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Total de Alinhadores</p>
                  <p className="text-lg font-semibold">{treatment.totalAligners}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Alinhador Atual</p>
                  <p className="text-lg font-semibold">#{treatment.currentAlignerNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Progresso</p>
                  <p className="text-lg font-semibold">{progress.toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Fase Atual</p>
                  <p className="text-lg font-semibold">#{treatment.currentPhaseNumber || 1}</p>
                </div>
              </div>

              {phases.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-muted-foreground mb-2">Fases</p>
                  <div className="space-y-2">
                    {phases.map((phase) => (
                      <div
                        key={phase.id}
                        className="flex items-center justify-between p-2 rounded border"
                      >
                        <div>
                          <p className="text-sm font-semibold">{phase.phaseName}</p>
                          <p className="text-xs text-muted-foreground">
                            Alinhadores #{phase.startAlignerNumber} a #{phase.endAlignerNumber}
                          </p>
                        </div>
                        <Badge
                          variant={phase.status === 'active' ? 'default' : 'secondary'}
                        >
                          {PhaseService.getStatusLabel(phase.status)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={() => setIsViewTreatmentOpen(false)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog: Confirmar Exclusão de Tratamento */}
      {treatment && (
        <Dialog open={isDeleteTreatmentOpen} onOpenChange={setIsDeleteTreatmentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Tratamento</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja excluir este tratamento?
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-lg bg-destructive/10 p-4 border border-destructive/20">
                <p className="text-sm font-semibold text-destructive mb-2">⚠️ Atenção!</p>
                <p className="text-sm text-muted-foreground">
                  Esta ação não pode ser desfeita. Todos os dados relacionados ao tratamento
                  serão permanentemente excluídos:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>{phases.length} fase(s) do tratamento</li>
                  <li>{aligners.length} alinhador(es) cadastrado(s)</li>
                  <li>Histórico de uso e progresso</li>
                  <li>Dados de gamificação relacionados</li>
                </ul>
              </div>

              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm font-semibold">Tratamento:</p>
                <p className="text-xs text-muted-foreground">ID: {treatment.id}</p>
                <p className="text-xs text-muted-foreground">
                  Paciente: {patient?.fullName}
                </p>
                <p className="text-xs text-muted-foreground">
                  Início: {new Date(treatment.startDate).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteTreatmentOpen(false)}
              >
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleDeleteTreatment}>
                Excluir Tratamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Chat Modal */}
      {patient && (
        <ChatModal
          open={isChatOpen}
          onOpenChange={setIsChatOpen}
          otherUserId={patient.id}
          otherUserName={patient.fullName}
          otherUserRole={patient.role}
        />
      )}

      {/* Dialog: Listar Todos os Tratamentos */}
      <Dialog open={isListTreatmentsOpen} onOpenChange={setIsListTreatmentsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Todos os Tratamentos</DialogTitle>
            <DialogDescription>
              Histórico completo de tratamentos de {patient?.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {allTreatments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum tratamento encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allTreatments.map((t, index) => {
                  const isCurrent = treatment?.id === t.id
                  const treatmentProgress = calculateTreatmentProgress(t)

                  return (
                    <Card
                      key={t.id}
                      className={isCurrent ? 'border-blue-500 border-2' : ''}
                    >
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">
                                {t.name || `Tratamento ${allTreatments.length - index}`}
                              </h3>
                              {isCurrent && (
                                <Badge variant="default">Atual</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground font-mono mt-1">
                              ID: {t.id}
                            </p>
                          </div>
                          <Badge
                            variant={
                              t.status === 'active'
                                ? 'default'
                                : t.status === 'completed'
                                  ? 'default'
                                  : 'secondary'
                            }
                          >
                            {t.status === 'active' && 'Ativo'}
                            {t.status === 'completed' && 'Concluído'}
                            {t.status === 'paused' && 'Pausado'}
                            {t.status === 'cancelled' && 'Cancelado'}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground text-xs">Data de Início</p>
                            <p className="font-medium">
                              {new Date(t.startDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Total Alinhadores</p>
                            <p className="font-medium">{t.totalAligners}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Alinhador Atual</p>
                            <p className="font-medium">#{t.currentAlignerNumber}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground text-xs">Progresso</p>
                            <p className="font-medium">{treatmentProgress.toFixed(0)}%</p>
                          </div>
                        </div>

                        {t.endDate && (
                          <div className="mt-3 pt-3 border-t">
                            <p className="text-xs text-muted-foreground">
                              Concluído em: {new Date(t.endDate).toLocaleDateString('pt-BR')}
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            )}

            {allTreatments.length > 0 && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-semibold">Total: {allTreatments.length} tratamento(s)</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {allTreatments.filter(t => t.status === 'active').length} ativo(s) • {' '}
                  {allTreatments.filter(t => t.status === 'completed').length} concluído(s) • {' '}
                  {allTreatments.filter(t => t.status === 'paused').length} pausado(s)
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button onClick={() => setIsListTreatmentsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default PatientDetail



