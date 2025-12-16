import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { MissionService } from '@/services/missionService.v2'
import { AuthService } from '@/services/authService'
import type {
  MissionTemplate,
  PatientMission,
  MissionCategory,
  MissionTrigger,
} from '@/types/mission'
import type { User } from '@/types/user'
import { Award, Users, Plus, Calendar, Trophy, CheckCircle2, Clock, XCircle, Copy } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

const MissionConfig = () => {
  const { user } = useAuth()
  const [patients, setPatients] = useState<User[]>([])
  const [selectedPatient, setSelectedPatient] = useState<User | null>(null)
  const [missions, setMissions] = useState<MissionTemplate[]>([])
  const [patientMissions, setPatientMissions] = useState<PatientMission[]>([])
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)
  const [isCloneDialogOpen, setIsCloneDialogOpen] = useState(false)
  const [selectedMission, setSelectedMission] = useState<MissionTemplate | null>(null)
  const [selectedPatientsForClone, setSelectedPatientsForClone] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const [assignmentData, setAssignmentData] = useState({
    trigger: 'immediate' as MissionTrigger,
    triggerAlignerNumber: 1,
    triggerDaysOffset: 0,
    durationDays: 0,
    customPoints: undefined as number | undefined,
  })

  useEffect(() => {
    loadData()
  }, [user])

  useEffect(() => {
    if (selectedPatient) {
      loadPatientMissions(selectedPatient.id)
    }
  }, [selectedPatient])

  const loadData = async () => {
    try {
      // Buscar pacientes da clínica (API)
      let clinicPatients: User[] = []
      if (user?.clinicId) {
        clinicPatients = await AuthService.getUsersByClinicAsync(user.clinicId)
      } else {
        // fallback para super-admin sem clínica: busca todos e filtra pacientes
        const allUsers = await AuthService.getAllUsersAsync()
        clinicPatients = allUsers.filter(
          (u) => u.role === 'patient' || u.role === 'child-patient'
        )
      }
      // Filtra apenas pacientes e ignora qualquer papel errado que venha da API
      const onlyPatients = clinicPatients.filter(
        (u) => (u.role === 'patient' || u.role === 'child-patient') && u.isActive && (!user?.clinicId || u.clinicId === user.clinicId)
      )
      setPatients(onlyPatients)

      // Buscar templates de missões (API)
      const allMissions = await MissionService.getAllTemplates()
      setMissions(allMissions)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados.',
        variant: 'destructive',
      })
    }
  }

  const loadPatientMissions = async (patientId: string) => {
    try {
      const missions = await MissionService.getPatientMissions(patientId)
      setPatientMissions(missions)
    } catch (error) {
      console.error('Error loading patient missions:', error)
    }
  }

  const handleOpenAssignDialog = (mission: MissionTemplate) => {
    setSelectedMission(mission)
    setAssignmentData({
      trigger: 'immediate',
      triggerAlignerNumber: 1,
      triggerDaysOffset: 0,
      durationDays: 0,
      customPoints: undefined,
    })
    setIsAssignDialogOpen(true)
  }

  const handleAssignMission = async () => {
    if (!selectedPatient || !selectedMission) return

    setIsLoading(true)
    try {
      const expiresAt =
        assignmentData.durationDays > 0
          ? new Date(
              Date.now() + assignmentData.durationDays * 24 * 60 * 60 * 1000
            ).toISOString()
          : undefined

      await MissionService.activateMissionForPatient({
        patientId: selectedPatient.id,
        missionTemplateId: selectedMission.id,
        expiresAt,
        trigger: assignmentData.trigger,
        triggerAlignerNumber: assignmentData.triggerAlignerNumber,
        triggerDaysOffset: assignmentData.triggerDaysOffset,
        customPoints: assignmentData.customPoints,
      })

      toast({
        title: 'Sucesso',
        description: `Missão "${selectedMission.name}" atribuída a ${selectedPatient.fullName}!`,
      })

      await loadPatientMissions(selectedPatient.id)
      setIsAssignDialogOpen(false)
    } catch (error) {
      console.error('Error assigning mission:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível atribuir a missão.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenCloneDialog = () => {
    if (!selectedPatient || patientMissions.length === 0) {
      toast({
        title: 'Atenção',
        description: 'Selecione um paciente com missões para clonar.',
        variant: 'destructive',
      })
      return
    }
    setSelectedPatientsForClone([])
    setIsCloneDialogOpen(true)
  }

  const handleCloneMissions = async () => {
    if (!selectedPatient || selectedPatientsForClone.length === 0) return

    setIsLoading(true)
    try {
      await MissionService.cloneMissionsToPatients(
        selectedPatient.id,
        selectedPatientsForClone
      )

      toast({
        title: 'Sucesso',
        description: `${patientMissions.length} missões clonadas para ${selectedPatientsForClone.length} paciente(s)!`,
      })

      setIsCloneDialogOpen(false)
      setSelectedPatientsForClone([])
    } catch (error) {
      console.error('Error cloning missions:', error)
      toast({
        title: 'Erro',
        description: 'Não foi possível clonar as missões.',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const togglePatientForClone = (patientId: string) => {
    setSelectedPatientsForClone((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId]
    )
  }

  const categoryLabels: Record<MissionCategory, string> = {
    usage: 'Uso do Alinhador',
    hygiene: 'Higiene Bucal',
    tracking: 'Acompanhamento',
    education: 'Educação',
    milestones: 'Marcos',
    aligner_change: 'Troca de Alinhador',
    appointments: 'Consultas',
    challenges: 'Desafios',
  }

  const triggerLabels: Record<MissionTrigger, string> = {
    immediate: 'Ativar Imediatamente',
    on_treatment_start: 'Ao Iniciar Tratamento',
    on_aligner_change: 'A Cada Troca de Alinhador',
    on_aligner_N_start: 'Ao Iniciar Alinhador Específico',
    days_after_aligner_N: 'X Dias Após Alinhador',
    days_after_treatment_start: 'X Dias Após Início do Tratamento',
    weeks_after_treatment_start: 'X Semanas Após Início do Tratamento',
    manual: 'Ativação Manual',
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50'
      case 'in_progress':
        return 'text-blue-600 bg-blue-50'
      case 'failed':
        return 'text-red-600 bg-red-50'
      case 'expired':
        return 'text-gray-600 bg-gray-50'
      default:
        return 'text-yellow-600 bg-yellow-50'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />
      case 'in_progress':
        return <Clock className="h-4 w-4" />
      case 'failed':
      case 'expired':
        return <XCircle className="h-4 w-4" />
      default:
        return <Calendar className="h-4 w-4" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Concluída'
      case 'in_progress':
        return 'Em Progresso'
      case 'failed':
        return 'Falhou'
      case 'expired':
        return 'Expirada'
      default:
        return 'Disponível'
    }
  }

  const getTriggerDescription = (pm: PatientMission) => {
    if (!pm.trigger) return 'Ativação imediata'

    switch (pm.trigger) {
      case 'immediate':
        return 'Ativada imediatamente'
      case 'on_treatment_start':
        return 'Ativa ao iniciar tratamento'
      case 'on_aligner_change':
        return 'Ativa a cada troca de alinhador'
      case 'on_aligner_N_start':
        return `Ativa ao iniciar alinhador #${pm.triggerAlignerNumber}`
      case 'days_after_aligner_N':
        return `Ativa ${pm.triggerDaysOffset} dias após alinhador #${pm.triggerAlignerNumber}`
      case 'days_after_treatment_start':
        return `Ativa ${pm.triggerDaysOffset} dias após início do tratamento`
      case 'weeks_after_treatment_start':
        return `Ativa ${pm.triggerDaysOffset} semanas após início do tratamento`
      case 'manual':
        return 'Ativação manual'
      default:
        return 'Configuração personalizada'
    }
  }

  const missionsByCategory = missions.reduce(
    (acc, mission) => {
      if (!acc[mission.category]) {
        acc[mission.category] = []
      }
      acc[mission.category].push(mission)
      return acc
    },
    {} as Record<MissionCategory, MissionTemplate[]>,
  )

  // Verificar quais missões o paciente já tem
  const assignedMissionIds = new Set(
    patientMissions.map((pm) => pm.missionTemplateId)
  )

  const availablePatientsForClone = patients.filter(
    (p) => p.id !== selectedPatient?.id
  )

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="rounded-2xl border-2 border-gradient-to-r from-yellow-400 via-orange-400 to-pink-400 bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 p-6 shadow-xl">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-yellow-600 via-orange-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
          <Award className="h-10 w-10 text-yellow-600" />
          Atribuir Missões aos Pacientes
        </h1>
        <p className="text-sm text-gray-600 mt-2 font-medium">
          Selecione um paciente e atribua missões com gatilhos automáticos baseados no tratamento
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de Pacientes */}
        <Card className="lg:col-span-1 rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-md">
                <Users className="h-5 w-5 text-white" />
              </div>
              Pacientes ({patients.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {patients.length === 0 ? (
                <p className="text-sm text-gray-600 text-center py-8 font-medium">
                  Nenhum paciente cadastrado
                </p>
              ) : (
                patients.map((patient) => (
                  <button
                    key={patient.id}
                    onClick={() => setSelectedPatient(patient)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all hover-scale ${
                      selectedPatient?.id === patient.id
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white border-purple-500 shadow-lg'
                        : 'bg-white border-purple-200 hover:border-purple-400 hover:shadow-md'
                    }`}
                  >
                    <div className="font-bold text-base">{patient.fullName}</div>
                    <div className={`text-xs mt-1 ${selectedPatient?.id === patient.id ? 'opacity-90' : 'text-gray-500'}`}>{patient.email}</div>
                  </button>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Missões do Paciente e Disponíveis */}
        <div className="lg:col-span-2 space-y-6">
          {!selectedPatient ? (
            <Card className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg">
              <CardContent className="text-center py-16">
                <Users className="mx-auto h-20 w-20 text-gray-300 mb-4" />
                <p className="text-gray-600 font-medium text-lg">
                  Selecione um paciente para atribuir missões
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Missões Ativas do Paciente */}
              <Card className="rounded-2xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-xl">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-md">
                        <Trophy className="h-5 w-5 text-white" />
                      </div>
                      Missões de {selectedPatient.fullName}
                      <span className="text-base font-medium text-gray-600">
                        ({patientMissions.length})
                      </span>
                    </CardTitle>
                    {patientMissions.length > 0 && (
                      <Button
                        onClick={handleOpenCloneDialog}
                        className="rounded-full px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 font-bold shadow-md hover-bounce"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Clonar para Outros Pacientes
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {patientMissions.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Nenhuma missão atribuída ainda
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {patientMissions.map((pm) => {
                        const template = missions.find(
                          (m) => m.id === pm.missionTemplateId
                        )
                        if (!template) return null

                        return (
                          <div
                            key={pm.id}
                            className="p-4 rounded-lg border bg-card"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex gap-3 flex-1">
                                <div
                                  className="text-2xl w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                                  style={{
                                    backgroundColor: template.color + '20',
                                  }}
                                >
                                  {template.icon}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold">
                                      {template.name}
                                    </h3>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 ${getStatusColor(pm.status)}`}
                                    >
                                      {getStatusIcon(pm.status)}
                                      {getStatusLabel(pm.status)}
                                    </span>
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {template.description}
                                  </p>
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    🔔 {getTriggerDescription(pm)}
                                  </div>
                                  <div className="mt-2">
                                    <div className="flex items-center gap-2 text-sm">
                                      <div className="flex-1">
                                        <div className="w-full bg-secondary rounded-full h-2">
                                          <div
                                            className="bg-primary h-2 rounded-full transition-all"
                                            style={{
                                              width: `${Math.min(100, (pm.progress / pm.targetValue) * 100)}%`,
                                            }}
                                          />
                                        </div>
                                      </div>
                                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                                        {pm.progress}/{pm.targetValue}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="mt-2 text-xs text-muted-foreground">
                                    ⭐ {pm.customPoints || template.basePoints} pontos
                                    {pm.pointsEarned > 0 && ` • ${pm.pointsEarned} ganhos`}
                                    {pm.expiresAt && (
                                      <>
                                        {' • '}📅 Expira: {new Date(pm.expiresAt).toLocaleDateString('pt-BR')}
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Missões Disponíveis para Atribuir */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Atribuir Nova Missão
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {Object.entries(missionsByCategory).map(
                      ([category, categoryMissions]) => {
                        const availableMissions = categoryMissions.filter(
                          (m) => !assignedMissionIds.has(m.id)
                        )

                        if (availableMissions.length === 0) return null

                        return (
                          <div key={category}>
                            <h3 className="font-semibold mb-3 flex items-center gap-2">
                              {categoryLabels[category as MissionCategory]}
                              <span className="text-sm font-normal text-muted-foreground">
                                ({availableMissions.length})
                              </span>
                            </h3>
                            <div className="space-y-2">
                              {availableMissions.map((mission) => (
                                <div
                                  key={mission.id}
                                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                                >
                                  <div className="flex gap-3 flex-1">
                                    <div
                                      className="text-xl w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                                      style={{
                                        backgroundColor: mission.color + '20',
                                      }}
                                    >
                                      {mission.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium">
                                        {mission.name}
                                      </div>
                                      <div className="text-sm text-muted-foreground">
                                        {mission.description}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        ⭐ {mission.basePoints} pontos
                                      </div>
                                    </div>
                                  </div>
                                  <Button
                                    size="sm"
                                    onClick={() =>
                                      handleOpenAssignDialog(mission)
                                    }
                                  >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Atribuir
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      }
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>

      {/* Dialog para Atribuir Missão */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Atribuir Missão</DialogTitle>
            <DialogDescription>
              Configure quando esta missão será ativada automaticamente para{' '}
              {selectedPatient?.fullName}
            </DialogDescription>
          </DialogHeader>

          {selectedMission && (
            <div className="space-y-6 py-4">
              {/* Preview da Missão */}
              <div className="p-4 rounded-lg border bg-accent/50">
                <div className="flex gap-3">
                  <div
                    className="text-2xl w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: selectedMission.color + '20',
                    }}
                  >
                    {selectedMission.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedMission.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedMission.description}
                    </p>
                    <div className="text-xs text-muted-foreground mt-1">
                      ⭐ {selectedMission.basePoints} pontos •{' '}
                      {categoryLabels[selectedMission.category]}
                    </div>
                  </div>
                </div>
              </div>

              {/* Gatilho Automático */}
              <div className="space-y-4">
                <h3 className="font-semibold">Gatilho de Ativação</h3>
                <div className="space-y-2">
                  <Label htmlFor="trigger">Quando Ativar</Label>
                  <select
                    id="trigger"
                    value={assignmentData.trigger}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        trigger: e.target.value as MissionTrigger,
                      })
                    }
                    className="w-full rounded-md border border-input bg-background px-3 py-2"
                  >
                    {Object.entries(triggerLabels).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>

                {(assignmentData.trigger === 'on_aligner_N_start' ||
                  assignmentData.trigger === 'days_after_aligner_N') && (
                  <div className="space-y-2">
                    <Label htmlFor="alignerNumber">Número do Alinhador</Label>
                    <Input
                      id="alignerNumber"
                      type="number"
                      min="1"
                      value={assignmentData.triggerAlignerNumber}
                      onChange={(e) =>
                        setAssignmentData({
                          ...assignmentData,
                          triggerAlignerNumber: parseInt(e.target.value, 10),
                        })
                      }
                    />
                  </div>
                )}

                {(assignmentData.trigger === 'days_after_aligner_N' ||
                  assignmentData.trigger === 'days_after_treatment_start' ||
                  assignmentData.trigger === 'weeks_after_treatment_start') && (
                  <div className="space-y-2">
                    <Label htmlFor="daysOffset">
                      {assignmentData.trigger === 'weeks_after_treatment_start'
                        ? 'Semanas'
                        : 'Dias'}
                    </Label>
                    <Input
                      id="daysOffset"
                      type="number"
                      min="0"
                      value={assignmentData.triggerDaysOffset}
                      onChange={(e) =>
                        setAssignmentData({
                          ...assignmentData,
                          triggerDaysOffset: parseInt(e.target.value, 10),
                        })
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="durationDays">
                    Duração (dias) - 0 = sem limite
                  </Label>
                  <Input
                    id="durationDays"
                    type="number"
                    min="0"
                    value={assignmentData.durationDays}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        durationDays: parseInt(e.target.value, 10),
                      })
                    }
                    placeholder="0 para nunca expirar"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customPoints">
                    Pontos Customizados (opcional)
                  </Label>
                  <Input
                    id="customPoints"
                    type="number"
                    min="1"
                    placeholder={`Padrão: ${selectedMission.basePoints}`}
                    value={assignmentData.customPoints || ''}
                    onChange={(e) =>
                      setAssignmentData({
                        ...assignmentData,
                        customPoints: e.target.value
                          ? parseInt(e.target.value, 10)
                          : undefined,
                      })
                    }
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAssignDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleAssignMission} disabled={isLoading}>
              {isLoading ? 'Atribuindo...' : 'Atribuir Missão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para Clonar Missões */}
      <Dialog open={isCloneDialogOpen} onOpenChange={setIsCloneDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Clonar Missões</DialogTitle>
            <DialogDescription>
              Selecione os pacientes que receberão as mesmas missões de{' '}
              {selectedPatient?.fullName}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4 p-4 rounded-lg border bg-accent/50">
              <p className="text-sm font-medium">
                {patientMissions.length} missões serão clonadas
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Os gatilhos e configurações serão mantidos
              </p>
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {availablePatientsForClone.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Não há outros pacientes disponíveis
                </p>
              ) : (
                availablePatientsForClone.map((patient) => (
                  <div
                    key={patient.id}
                    className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => togglePatientForClone(patient.id)}
                  >
                    <Checkbox
                      checked={selectedPatientsForClone.includes(patient.id)}
                      onCheckedChange={() => togglePatientForClone(patient.id)}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{patient.fullName}</div>
                      <div className="text-xs text-muted-foreground">
                        {patient.email}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCloneDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCloneMissions}
              disabled={isLoading || selectedPatientsForClone.length === 0}
            >
              {isLoading
                ? 'Clonando...'
                : `Clonar para ${selectedPatientsForClone.length} Paciente(s)`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MissionConfig
