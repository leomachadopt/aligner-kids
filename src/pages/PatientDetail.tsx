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
import { TreatmentForm, type TreatmentFormValues } from '@/components/TreatmentForm'
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
import { PatientPointsService } from '@/services/patientPointsService'

const PatientDetail = () => {
  const { id } = useParams<{ id: string }>()
  const { user: currentUser } = useAuth()
  const [patient, setPatient] = useState<User | null>(null)
  const [treatment, setTreatment] = useState<Treatment | null>(null)
  const [aligners, setAligners] = useState<Aligner[]>([])
  const [phases, setPhases] = useState<TreatmentPhase[]>([])
  const [loading, setLoading] = useState(true)
  const [clinic, setClinic] = useState<Clinic | null>(null)
  const [patientPoints, setPatientPoints] = useState<{ coins: number; xp: number; level: number } | null>(null)
  const [pointsLoading, setPointsLoading] = useState(false)
  const [txLoading, setTxLoading] = useState(false)
  const [txCursor, setTxCursor] = useState<string | null>(null)
  const [transactions, setTransactions] = useState<any[]>([])
  const [adjustForm, setAdjustForm] = useState({ deltaCoins: 0, deltaXp: 0, reason: '' })
  const [isNewPhaseModalOpen, setIsNewPhaseModalOpen] = useState(false)
  const [isEditPhaseModalOpen, setIsEditPhaseModalOpen] = useState(false)
  const [editingPhase, setEditingPhase] = useState<TreatmentPhase | null>(null)
  const [isEditPatientOpen, setIsEditPatientOpen] = useState(false)
  const [isViewTreatmentOpen, setIsViewTreatmentOpen] = useState(false)
  const [isDeleteTreatmentOpen, setIsDeleteTreatmentOpen] = useState(false)
  const [isListTreatmentsOpen, setIsListTreatmentsOpen] = useState(false)
  const [isCreateTreatmentOpen, setIsCreateTreatmentOpen] = useState(false)
  const [isEditTreatmentOpen, setIsEditTreatmentOpen] = useState(false)
  const [allTreatments, setAllTreatments] = useState<Treatment[]>([])
  const [selectedTreatment, setSelectedTreatment] = useState<Treatment | null>(null)
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

        // Load points + transactions (only for orthodontist/super-admin)
        const canManagePoints =
          currentUser.role === 'orthodontist' || currentUser.role === 'super-admin'
        if (canManagePoints && patientData?.clinicId && currentUser.id) {
          setPointsLoading(true)
          setTxLoading(true)
          try {
            const [pointsRes, txRes] = await Promise.all([
              PatientPointsService.getPoints(patientData.clinicId, patientData.id, currentUser.id),
              PatientPointsService.getTransactions({
                clinicId: patientData.clinicId,
                patientId: patientData.id,
                orthodontistId: currentUser.id,
                limit: 50,
                cursor: null,
              }),
            ])
            setPatientPoints(pointsRes.points)
            setTransactions(txRes.transactions || [])
            setTxCursor(txRes.nextCursor || null)
          } catch (error) {
            console.error('Error loading patient points:', error)
          } finally {
            setPointsLoading(false)
            setTxLoading(false)
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

  const handleAdjustPoints = async () => {
    if (!currentUser?.id || !patient?.id || !patient?.clinicId) return
    const deltaCoins = Number(adjustForm.deltaCoins) || 0
    const deltaXp = Number(adjustForm.deltaXp) || 0
    const reason = adjustForm.reason.trim()

    if (deltaCoins === 0 && deltaXp === 0) {
      toast.error('Informe um delta de moedas ou XP')
      return
    }

    try {
      setPointsLoading(true)
      const result = await PatientPointsService.adjustPoints({
        clinicId: patient.clinicId,
        patientId: patient.id,
        orthodontistId: currentUser.id,
        deltaCoins,
        deltaXp,
        reason,
      })

      setPatientPoints(result.points)
      setTransactions((prev) => [result.transaction, ...prev])
      setAdjustForm({ deltaCoins: 0, deltaXp: 0, reason: '' })
      toast.success('Pontos ajustados com sucesso')
    } catch (error) {
      console.error('Error adjusting points:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao ajustar pontos')
    } finally {
      setPointsLoading(false)
    }
  }

  const handleLoadMoreTransactions = async () => {
    if (!currentUser?.id || !patient?.id || !patient?.clinicId) return
    if (!txCursor) return

    try {
      setTxLoading(true)
      const res = await PatientPointsService.getTransactions({
        clinicId: patient.clinicId,
        patientId: patient.id,
        orthodontistId: currentUser.id,
        limit: 50,
        cursor: txCursor,
      })
      setTransactions((prev) => [...prev, ...(res.transactions || [])])
      setTxCursor(res.nextCursor || null)
    } catch (error) {
      console.error('Error loading more transactions:', error)
      toast.error('Erro ao carregar mais transações')
    } finally {
      setTxLoading(false)
    }
  }

  const handleStartTreatment = async () => {
    if (!treatment || !id) return

    try {
      setLoading(true)
      const result = await alignerService.startTreatment(treatment.id)

      toast.success(result.message || 'Tratamento iniciado com sucesso!')

      // Recarregar dados do tratamento
      const treatmentData = await alignerService.getTreatmentById(treatment.id)
      setTreatment(treatmentData)

      const alignersData = await alignerService.getAlignersByPatient(id)
      setAligners(alignersData)

      const phasesData = await PhaseService.getPhasesByTreatment(treatment.id)
      setPhases(phasesData)
    } catch (error) {
      console.error('Error starting treatment:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao iniciar tratamento')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTreatment = async () => {
    const treatmentToDelete = selectedTreatment || treatment
    if (!treatmentToDelete || !id) return

    try {
      await alignerService.deleteTreatment(treatmentToDelete.id)

      // Se for o tratamento atual, limpar dados
      if (treatment?.id === treatmentToDelete.id) {
        setTreatment(null)
        setAligners([])
        setPhases([])
      }

      // Atualizar lista de tratamentos
      setAllTreatments(prev => prev.filter(t => t.id !== treatmentToDelete.id))

      toast.success('Tratamento excluído com sucesso!')
      setIsDeleteTreatmentOpen(false)
      setSelectedTreatment(null)
    } catch (error) {
      console.error('Error deleting treatment:', error)
      toast.error('Erro ao excluir tratamento')
    }
  }

  const handleViewTreatment = (treatment: Treatment) => {
    setSelectedTreatment(treatment)
    setIsViewTreatmentOpen(true)
  }

  const handleDeleteTreatmentClick = (treatment: Treatment) => {
    setSelectedTreatment(treatment)
    setIsDeleteTreatmentOpen(true)
  }

  const handleEditTreatmentClick = async (treatment: Treatment) => {
    setSelectedTreatment(treatment)

    // Buscar os alinhadores para obter changeInterval e targetHoursPerDay
    try {
      const treatmentAligners = await alignerService.getAlignersByPatient(treatment.patientId, treatment.id)

      // Pegar valores do primeiro alinhador (como referência)
      const firstAligner = treatmentAligners[0]

      // Armazenar os valores no tratamento selecionado para passar ao formulário
      setSelectedTreatment({
        ...treatment,
        changeInterval: firstAligner?.changeInterval || 14,
        targetHoursPerDay: firstAligner?.wearTime || 22,
      } as any)
    } catch (error) {
      console.error('Error loading aligner data:', error)
    }

    setIsEditTreatmentOpen(true)
  }

  const handleUpdateTreatment = async (data: any) => {
    if (!selectedTreatment) return

    try {
      setLoading(true)
      console.log('💾 Atualizando tratamento com dados:', data)

      // Atualizar o tratamento
      const updated = await alignerService.updateTreatment(selectedTreatment.id, {
        name: data.name,
        totalAligners: data.totalAligners,
        notes: data.notes,
      })

      console.log('✅ Tratamento atualizado:', updated)

      // Atualizar os alinhadores com os novos valores de changeInterval e targetHoursPerDay
      try {
        const treatmentAligners = await alignerService.getAlignersByPatient(selectedTreatment.patientId, selectedTreatment.id)

        // Atualizar todos os alinhadores com os novos valores
        await Promise.all(
          treatmentAligners.map(aligner =>
            alignerService.updateAligner(aligner.id, {
              changeInterval: data.changeInterval,
              wearTime: data.targetHoursPerDay,
            } as any)
          )
        )
        console.log('✅ Alinhadores atualizados')
      } catch (error) {
        console.error('Error updating aligners:', error)
        // Continua mesmo se falhar ao atualizar alinhadores
      }

      // Atualizar na lista
      setAllTreatments(prev => {
        const newList = prev.map(t => (t.id === selectedTreatment.id ? { ...t, ...updated } : t))
        console.log('📋 Lista de tratamentos atualizada:', newList)
        return newList
      })

      // Se for o tratamento atual, atualizar também
      if (treatment?.id === selectedTreatment.id) {
        setTreatment(updated)
        console.log('✅ Tratamento atual atualizado:', updated)
        // Recarregar alinhadores para refletir as mudanças
        const updatedAligners = await alignerService.getAlignersByPatient(selectedTreatment.patientId, selectedTreatment.id)
        setAligners(updatedAligners)
      }

      // Recarregar lista completa para garantir sincronização
      const freshTreatments = await alignerService.getTreatmentsByPatient(selectedTreatment.patientId)
      setAllTreatments(freshTreatments)
      console.log('🔄 Lista de tratamentos recarregada do servidor')

      toast.success('Tratamento atualizado com sucesso!')
      setIsEditTreatmentOpen(false)
      setSelectedTreatment(null)
    } catch (error) {
      console.error('Error updating treatment:', error)
      toast.error('Erro ao atualizar tratamento')
    } finally {
      setLoading(false)
    }
  }

  const handleSetActiveTreatment = async (selectedTreatment: Treatment) => {
    if (!id) return

    try {
      setLoading(true)

      // Carregar os dados do tratamento selecionado
      const alignersData = await alignerService.getAlignersByPatient(id, selectedTreatment.id)
      setTreatment(selectedTreatment)
      setAligners(alignersData)

      // Carregar fases
      const phasesData = await PhaseService.getPhasesByTreatment(selectedTreatment.id)
      setPhases(phasesData)

      toast.success('Tratamento ativado como visualização atual!')
      setIsListTreatmentsOpen(false)
    } catch (error) {
      console.error('Error activating treatment:', error)
      toast.error('Erro ao ativar tratamento')
    } finally {
      setLoading(false)
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

  const handleCreateTreatment = async (data: TreatmentFormValues) => {
    if (!id) return

    try {
      setLoading(true)
      await alignerService.createTreatment({
        patientId: id,
        totalAligners: data.totalAligners,
        changeInterval: data.changeInterval,
        targetHoursPerDay: data.targetHoursPerDay,
      } as any)

      toast.success('Tratamento criado com sucesso!')
      setIsCreateTreatmentOpen(false)

      // Recarregar dados do tratamento e alinhadores
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
    } catch (error: any) {
      console.error('Error creating treatment:', error)
      toast.error(error.message || 'Erro ao criar tratamento')
    } finally {
      setLoading(false)
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
    <div className="space-y-8 animate-fade-in-up">
      <div className="rounded-2xl border-2 border-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-gradient-to-br from-cyan-50 via-blue-50 to-purple-50 p-6 shadow-xl">
        <div className="flex items-center gap-6">
          <Button asChild className="rounded-full h-14 w-14 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-lg hover-bounce">
            <Link to="/patient-management">
              <ArrowLeft className="h-6 w-6" />
            </Link>
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-600 via-blue-600 to-purple-600 bg-clip-text text-transparent">
              {patient.fullName}
            </h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">{patient.email}</p>
          </div>
          {patient.role === 'child-patient' && (
            <Badge className="bg-gradient-to-r from-pink-400 to-purple-400 text-white font-bold text-lg px-4 py-2">
              Criança
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl font-bold">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              Informações do Tratamento
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!treatment ? (
              <div className="text-center py-12">
                <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium text-lg mb-4">
                  Este paciente ainda não possui um tratamento iniciado.
                </p>
                <Button
                  onClick={() => setIsCreateTreatmentOpen(true)}
                  className="rounded-full px-6 py-6 text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 shadow-lg hover-bounce"
                >
                  Cadastrar Tratamento
                </Button>
              </div>
            ) : (
              <>
                {/* Alerta para tratamento pending */}
                {treatment.status === 'pending' && (
                  <div className="mb-6 p-6 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-300 shadow-lg">
                    <div className="flex items-start gap-4">
                      <div className="text-4xl">⏳</div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-amber-900 mb-2">Tratamento Aguardando Início</h3>
                        <p className="text-amber-800 mb-4">
                          Este tratamento foi criado mas ainda não foi iniciado. As datas serão calculadas automaticamente quando o paciente começar a usar os alinhadores.
                        </p>
                        <Button
                          onClick={handleStartTreatment}
                          disabled={loading}
                          className="rounded-full px-8 py-6 text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover-bounce"
                        >
                          🚀 Iniciar Tratamento Agora
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-white border-2 border-blue-200 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Status</p>
                    <Badge className={`
                      font-bold text-sm px-3 py-1
                      ${treatment.status === 'pending' ? 'bg-gradient-to-r from-amber-400 to-yellow-400 text-white' : ''}
                      ${treatment.status === 'active' ? 'bg-gradient-to-r from-green-400 to-teal-400 text-white' : ''}
                      ${treatment.status === 'completed' ? 'bg-gradient-to-r from-blue-400 to-purple-400 text-white' : ''}
                      ${treatment.status === 'paused' ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-white' : ''}
                      ${treatment.status === 'cancelled' ? 'bg-gradient-to-r from-red-400 to-pink-400 text-white' : ''}
                    `}>
                      {treatment.status === 'pending' && 'Aguardando Início'}
                      {treatment.status === 'active' && 'Ativo'}
                      {treatment.status === 'completed' && 'Concluído'}
                      {treatment.status === 'paused' && 'Pausado'}
                      {treatment.status === 'cancelled' && 'Cancelado'}
                    </Badge>
                  </div>
                  <div className="p-4 rounded-xl bg-white border-2 border-purple-200 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Progresso</p>
                    <p className="text-3xl font-extrabold text-gray-800">{progress.toFixed(0)}%</p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border-2 border-cyan-200 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Alinhador Atual</p>
                    <p className="text-2xl font-extrabold text-gray-800">
                      #{treatment.currentAlignerNumber} <span className="text-gray-400">de</span> {treatment.totalAligners}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-white border-2 border-blue-200 shadow-sm">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-2">Data de Início</p>
                    <p className="text-lg font-bold text-gray-800">
                      {treatment.startDate ? new Date(treatment.startDate).toLocaleDateString('pt-BR') : 'A definir'}
                    </p>
                  </div>
                </div>

                {currentAligner && (
                  <div className={`mt-4 p-5 rounded-xl border-2 shadow-md ${isOverdue ? 'border-red-300 bg-gradient-to-br from-red-50 to-pink-50' : 'border-green-300 bg-gradient-to-br from-green-50 to-teal-50'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xl font-bold text-gray-800">
                          Alinhador #{currentAligner.number}
                        </p>
                        <p className="text-sm text-gray-600 font-medium mt-1">
                          {isOverdue
                            ? '⚠️ Atrasado para troca'
                            : `⏰ ${calculateDaysUntilChange(currentAligner)} dias até a próxima troca`}
                        </p>
                      </div>
                      {isOverdue ? (
                        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold px-4 py-2 text-base">
                          Atrasado
                        </Badge>
                      ) : (
                        <Badge className="bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold px-4 py-2 text-base">
                          No Prazo
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Phases Section */}
        {treatment && (
          <Card className="lg:col-span-2 rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-teal-50 shadow-xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-3 text-2xl font-bold">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                  Fases do Tratamento
                </CardTitle>
                <Button
                  onClick={() => setIsNewPhaseModalOpen(true)}
                  className="rounded-full px-6 py-3 text-base font-bold bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 shadow-md hover-bounce"
                >
                  ➕ Iniciar Nova Fase
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {phases.length === 0 ? (
                <div className="text-center py-8">
                  <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-200 to-teal-200 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-gray-600 font-medium mb-2">
                    Nenhuma fase criada ainda
                  </p>
                  <p className="text-sm text-gray-500">
                    Clique em "Iniciar Nova Fase" para organizar o tratamento em fases
                  </p>
                </div>
              ) : (
                phases.map((phase) => (
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
                ))
              )}
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

        <Card className="rounded-2xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-md">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              Ações
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              className="w-full rounded-xl py-6 text-base font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-md hover-bounce"
              onClick={handleEditPatient}
            >
              Editar Dados do Paciente
            </Button>
            <Button
              className="w-full rounded-xl py-6 text-base font-bold bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 shadow-md hover-bounce"
              onClick={() => setIsChatOpen(true)}
            >
              💬 Abrir Chat
            </Button>
            {!treatment ? (
              <Button
                className="w-full rounded-xl py-6 text-base font-bold bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-md hover-bounce"
                onClick={() => setIsCreateTreatmentOpen(true)}
              >
                ➕ Cadastrar Novo Tratamento
              </Button>
            ) : (
              <>
                <Button
                  className="w-full rounded-xl py-6 text-base font-bold bg-white border-2 border-purple-300 text-purple-700 hover:bg-purple-50 shadow-sm hover-scale"
                  onClick={() => handleViewTreatment(treatment)}
                >
                  👁️ Visualizar Tratamento Atual
                </Button>
                <Button
                  className="w-full rounded-xl py-6 text-base font-bold bg-white border-2 border-blue-300 text-blue-700 hover:bg-blue-50 shadow-sm hover-scale"
                  onClick={handleListTreatments}
                >
                  📋 Listar Todos os Tratamentos
                </Button>
                <Button
                  className="w-full rounded-xl py-6 text-base font-bold bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 text-white shadow-md hover-bounce"
                  onClick={() => handleDeleteTreatmentClick(treatment)}
                >
                  🗑️ Excluir Tratamento
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

      {/* Points + History (Orthodontist/Super-admin) */}
      {(currentUser?.role === 'orthodontist' || currentUser?.role === 'super-admin') && patient?.clinicId && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="rounded-2xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Pontos do Paciente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pointsLoading && !patientPoints ? (
                <p className="text-muted-foreground">Carregando pontos...</p>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-xl bg-white border">
                    <p className="text-xs text-muted-foreground font-semibold">Moedas</p>
                    <p className="text-2xl font-extrabold">{patientPoints?.coins ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border">
                    <p className="text-xs text-muted-foreground font-semibold">XP</p>
                    <p className="text-2xl font-extrabold">{patientPoints?.xp ?? 0}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border">
                    <p className="text-xs text-muted-foreground font-semibold">Nível</p>
                    <p className="text-2xl font-extrabold">{patientPoints?.level ?? 1}</p>
                  </div>
                </div>
              )}

              <div className="rounded-xl bg-white border p-4 space-y-3">
                <p className="font-semibold">Ajuste manual (delta)</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label htmlFor="deltaCoins">Delta moedas</Label>
                    <Input
                      id="deltaCoins"
                      type="number"
                      value={adjustForm.deltaCoins}
                      onChange={(e) =>
                        setAdjustForm((p) => ({ ...p, deltaCoins: Number(e.target.value) }))
                      }
                      placeholder="Ex: 10 ou -10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="deltaXp">Delta XP</Label>
                    <Input
                      id="deltaXp"
                      type="number"
                      value={adjustForm.deltaXp}
                      onChange={(e) =>
                        setAdjustForm((p) => ({ ...p, deltaXp: Number(e.target.value) }))
                      }
                      placeholder="Ex: 20 ou -20"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="reason">Motivo (opcional)</Label>
                  <Input
                    id="reason"
                    value={adjustForm.reason}
                    onChange={(e) => setAdjustForm((p) => ({ ...p, reason: e.target.value }))}
                    placeholder="Ex: bônus por consulta / correção manual"
                  />
                </div>
                <Button onClick={handleAdjustPoints} disabled={pointsLoading}>
                  Aplicar ajuste
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-2 border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-xl">
            <CardHeader>
              <CardTitle className="text-xl font-bold">Histórico de Pontos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {txLoading && transactions.length === 0 ? (
                <p className="text-muted-foreground">Carregando histórico...</p>
              ) : transactions.length === 0 ? (
                <p className="text-muted-foreground">Nenhuma transação registrada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 50).map((t: any) => {
                    const createdAt = t.createdAt ? new Date(t.createdAt) : null
                    const deltaXp = t?.metadata?.deltaXp ?? null
                    const reason = t?.metadata?.reason || ''
                    return (
                      <div key={t.id} className="rounded-lg border bg-white p-3">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold">
                            {t.kind}/{t.source}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {createdAt ? createdAt.toLocaleString('pt-BR') : ''}
                          </p>
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          <p>Δ moedas: {t.amountCoins} • saldo: {t.balanceAfterCoins}</p>
                          {deltaXp !== null && <p>Δ XP: {deltaXp}</p>}
                          {reason && <p>Motivo: {reason}</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              <div className="flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handleLoadMoreTransactions}
                  disabled={txLoading || !txCursor}
                >
                  Carregar mais
                </Button>
                {!txCursor && transactions.length > 0 && (
                  <p className="text-xs text-muted-foreground">Fim do histórico</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

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
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-2 border-gradient-to-r from-blue-300 via-purple-300 to-pink-300">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Editar Dados do Paciente
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 font-medium">
                  Atualize as informações de {patient?.fullName}
                </DialogDescription>
              </div>
            </div>
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
      {selectedTreatment && (
        <Dialog open={isViewTreatmentOpen} onOpenChange={(open) => {
          setIsViewTreatmentOpen(open)
          if (!open) setSelectedTreatment(null)
        }}>
          <DialogContent className="max-w-2xl border-2 border-gradient-to-r from-cyan-300 via-blue-300 to-purple-300">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-400 flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                    Detalhes do Tratamento
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-600 font-medium">
                    Informações completas do tratamento de {patient?.fullName}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">ID do Tratamento</p>
                  <p className="text-sm font-mono">{selectedTreatment.id}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Status</p>
                  <Badge
                    variant={
                      selectedTreatment.status === 'active'
                        ? 'default'
                        : selectedTreatment.status === 'completed'
                          ? 'default'
                          : 'secondary'
                    }
                    className={selectedTreatment.status === 'pending' ? 'bg-amber-500' : ''}
                  >
                    {selectedTreatment.status === 'pending' && 'Aguardando Início'}
                    {selectedTreatment.status === 'active' && 'Ativo'}
                    {selectedTreatment.status === 'completed' && 'Concluído'}
                    {selectedTreatment.status === 'paused' && 'Pausado'}
                    {selectedTreatment.status === 'cancelled' && 'Cancelado'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Data de Início</p>
                  <p className="text-sm">
                    {selectedTreatment.startDate ? new Date(selectedTreatment.startDate).toLocaleDateString('pt-BR') : 'A definir'}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Data de Término</p>
                  <p className="text-sm">
                    {selectedTreatment.expectedEndDate
                      ? new Date(selectedTreatment.expectedEndDate).toLocaleDateString('pt-BR')
                      : 'Em andamento'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Total de Alinhadores</p>
                  <p className="text-lg font-semibold">{selectedTreatment.totalAligners}</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Alinhador Atual</p>
                  <p className="text-lg font-semibold">#{selectedTreatment.currentAlignerNumber}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Progresso</p>
                  <p className="text-lg font-semibold">{calculateTreatmentProgress(selectedTreatment).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">Fase Atual</p>
                  <p className="text-lg font-semibold">#{selectedTreatment.currentPhaseNumber || 1}</p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => {
                setIsViewTreatmentOpen(false)
                setSelectedTreatment(null)
              }}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Dialog: Confirmar Exclusão de Tratamento */}
      {(selectedTreatment || treatment) && (
        <Dialog open={isDeleteTreatmentOpen} onOpenChange={(open) => {
          setIsDeleteTreatmentOpen(open)
          if (!open) setSelectedTreatment(null)
        }}>
          <DialogContent className="border-2 border-red-300">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-red-400 to-pink-400 flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    Excluir Tratamento
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-600 font-medium">
                    Tem certeza que deseja excluir este tratamento?
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="rounded-xl bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-300 p-4 shadow-md">
                <p className="text-base font-bold text-red-900 mb-2">⚠️ Atenção!</p>
                <p className="text-sm text-red-800 leading-relaxed mb-3">
                  Esta ação não pode ser desfeita. Todos os dados relacionados ao tratamento
                  serão permanentemente excluídos:
                </p>
                <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                  <li>Todas as fases do tratamento</li>
                  <li>Todos os alinhadores cadastrados</li>
                  <li>Histórico de uso e progresso</li>
                  <li>Dados de gamificação relacionados</li>
                </ul>
              </div>

              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-gray-50 border-2 border-slate-300 p-4 shadow-sm">
                <p className="text-sm font-bold text-slate-900 mb-2">📋 Tratamento:</p>
                <div className="space-y-1 text-xs text-slate-700">
                  <p><strong>ID:</strong> <span className="font-mono">{(selectedTreatment || treatment)?.id}</span></p>
                  <p><strong>Paciente:</strong> {patient?.fullName}</p>
                  {(selectedTreatment || treatment)?.startDate && (
                    <p><strong>Início:</strong> {new Date((selectedTreatment || treatment)!.startDate).toLocaleDateString('pt-BR')}</p>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDeleteTreatmentOpen(false)
                  setSelectedTreatment(null)
                }}
                className="rounded-xl border-2 font-bold"
              >
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteTreatment}
                className="rounded-xl bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 font-bold shadow-lg"
              >
                🗑️ Excluir Tratamento
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto border-2 border-gradient-to-r from-green-300 via-teal-300 to-cyan-300">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Todos os Tratamentos
                </DialogTitle>
                <DialogDescription className="text-sm text-gray-600 font-medium">
                  Histórico completo de tratamentos de {patient?.fullName}
                </DialogDescription>
              </div>
            </div>
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

                        {/* Botões de Ação */}
                        <div className="mt-4 pt-4 border-t flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewTreatment(t)}
                            className="flex-1 min-w-[100px]"
                          >
                            👁️ Visualizar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditTreatmentClick(t)}
                            className="flex-1 min-w-[100px] border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            ✏️ Editar
                          </Button>
                          {!isCurrent && (
                            <Button
                              size="sm"
                              variant="default"
                              onClick={() => handleSetActiveTreatment(t)}
                              className="flex-1 min-w-[100px] bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                            >
                              ✓ Ativar
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteTreatmentClick(t)}
                            className="flex-1 min-w-[100px]"
                          >
                            🗑️ Excluir
                          </Button>
                        </div>
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

      {/* Dialog: Criar Tratamento */}
      <Dialog open={isCreateTreatmentOpen} onOpenChange={setIsCreateTreatmentOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Tratamento</DialogTitle>
            <DialogDescription>
              Configure o tratamento de {patient?.fullName}. Todos os alinhadores serão criados automaticamente.
            </DialogDescription>
          </DialogHeader>
          <TreatmentForm
            onSubmit={handleCreateTreatment}
            defaultValues={{ patientId: id || '' }}
            isLoading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Tratamento */}
      {selectedTreatment && (
        <Dialog open={isEditTreatmentOpen} onOpenChange={(open) => {
          setIsEditTreatmentOpen(open)
          if (!open) setSelectedTreatment(null)
        }}>
          <DialogContent className="max-w-2xl border-2 border-gradient-to-r from-blue-300 via-indigo-300 to-purple-300">
            <DialogHeader className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-400 flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Editar Tratamento
                  </DialogTitle>
                  <DialogDescription className="text-sm text-gray-600 font-medium">
                    Atualize as informações do tratamento de {patient?.fullName}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>
            <TreatmentForm
              onSubmit={handleUpdateTreatment}
              defaultValues={{
                patientId: id || '',
                name: selectedTreatment.name || '',
                totalAligners: selectedTreatment.totalAligners,
                changeInterval: (selectedTreatment as any).changeInterval || 14,
                targetHoursPerDay: (selectedTreatment as any).targetHoursPerDay || 22,
                notes: selectedTreatment.notes || '',
              }}
              isLoading={loading}
              isEditing={true}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}

export default PatientDetail



