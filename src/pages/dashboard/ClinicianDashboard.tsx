import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle2,
  MessageSquare,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { alignerService } from '@/services/alignerService'
import { AuthService } from '@/services/authService'
import { useAuth } from '@/context/AuthContext'
import { useEffect, useState } from 'react'
import type { Treatment, Aligner } from '@/types/aligner'
import type { User } from '@/types/user'
import type { Conversation } from '@/types/message'
import { isAlignerOverdue, calculateDaysUntilChange } from '@/utils/alignerCalculations'
import { MessageService } from '@/services/messageService'
import { ChatModal } from '@/components/ChatModal'
import { toast } from 'sonner'

const ClinicianDashboard = () => {
  const { user } = useAuth()
  const [patients, setPatients] = useState<User[]>([])
  const [treatments, setTreatments] = useState<Treatment[]>([])
  const [aligners, setAligners] = useState<Aligner[]>([])
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<{ id: string; name: string; role: string } | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!user || !user.clinicId) {
        toast.error('Usuário não está vinculado a nenhuma clínica')
        setLoading(false)
        return
      }

      try {
        // Buscar pacientes da clínica do ortodontista (versão assíncrona)
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

        // Load conversations
        const convs = await MessageService.getConversations()
        setConversations(convs)
      } catch (error) {
        console.error('Error loading data:', error)
        toast.error('Erro ao carregar dados do dashboard')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user])

  const handleOpenChat = (userId: string, userName: string, userRole: string) => {
    setSelectedUser({ id: userId, name: userName, role: userRole })
    setIsChatOpen(true)
  }

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
      bgGradient: 'from-blue-400 to-cyan-400',
      bgLight: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
    {
      title: 'Alinhadores Atrasados',
      value: overdueAligners.length,
      icon: AlertTriangle,
      color: 'text-red-500',
      bgGradient: 'from-red-400 to-pink-400',
      bgLight: 'bg-red-50',
      borderColor: 'border-red-200',
    },
    {
      title: 'Requerem Atenção',
      value: atRiskAligners.length,
      icon: Clock,
      color: 'text-yellow-500',
      bgGradient: 'from-yellow-400 to-orange-400',
      bgLight: 'bg-yellow-50',
      borderColor: 'border-yellow-200',
    },
    {
      title: 'Tratamentos Concluídos',
      value: treatments.filter((t) => t.status === 'completed').length,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgGradient: 'from-green-400 to-teal-400',
      bgLight: 'bg-green-50',
      borderColor: 'border-green-200',
    },
  ]

  const cardBase =
    'rounded-2xl border border-border/60 bg-background/80 backdrop-blur shadow-[0_15px_50px_-25px_rgba(0,0,0,0.35)]'

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard Clínico</h1>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div className="rounded-2xl border-2 border-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-6 shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Dashboard Clínico
            </h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">
              Visão geral da clínica e pacientes ativos.
            </p>
          </div>
          <Button asChild className="rounded-full px-6 py-6 text-lg font-bold bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 shadow-lg hover-bounce">
            <Link to="/patient-management">Gerenciar Pacientes</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className={`rounded-2xl border-2 ${stat.borderColor} ${stat.bgLight} shadow-lg hover-scale transition-all duration-300`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-bold text-gray-700">{stat.title}</CardTitle>
              <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${stat.bgGradient} flex items-center justify-center shadow-md`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold tracking-tight">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-2xl border-2 border-red-200 bg-gradient-to-br from-red-50 to-pink-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-red-400 to-pink-400 flex items-center justify-center shadow-md">
                <AlertTriangle className="h-5 w-5 text-white" />
              </div>
              Alinhadores Atrasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {overdueAligners.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-400 mb-2" />
                <p className="text-gray-600 font-medium">
                  Nenhum alinhador atrasado no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {overdueAligners.map((aligner) => {
                  const patient = patients.find(
                    (p) => p.id === aligner.patientId,
                  )
                  return (
                    <div
                      key={aligner.id}
                      className="flex items-center justify-between p-4 rounded-xl border-2 border-red-300 bg-white shadow-md hover-scale transition-all"
                    >
                      <div>
                        <p className="font-bold text-gray-800">
                          {patient?.fullName || 'Paciente desconhecido'}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Alinhador #{aligner.number}
                        </p>
                      </div>
                      <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold px-3 py-1">
                        Atrasado
                      </Badge>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-yellow-400 to-orange-400 flex items-center justify-center shadow-md">
                <Clock className="h-5 w-5 text-white" />
              </div>
              Requerem Atenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            {atRiskAligners.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-16 w-16 mx-auto text-green-400 mb-2" />
                <p className="text-gray-600 font-medium">
                  Nenhum paciente requerendo atenção no momento.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {atRiskAligners.map((aligner) => {
                  const patient = patients.find(
                    (p) => p.id === aligner.patientId,
                  )
                  const daysUntil = calculateDaysUntilChange(aligner)
                  return (
                    <div
                      key={aligner.id}
                      className="flex items-center justify-between p-4 rounded-xl border-2 border-yellow-300 bg-white shadow-md hover-scale transition-all"
                    >
                      <div>
                        <p className="font-bold text-gray-800">
                          {patient?.fullName || 'Paciente desconhecido'}
                        </p>
                        <p className="text-sm text-gray-600 font-medium">
                          Alinhador #{aligner.number} - {daysUntil} dias restantes
                        </p>
                      </div>
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-yellow-900 font-bold px-3 py-1 border-2 border-yellow-500">
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

      <Card className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-teal-50 shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center shadow-md">
                <Users className="h-5 w-5 text-white" />
              </div>
              Pacientes Ativos
            </CardTitle>
            <Button asChild className="rounded-full px-4 py-2 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 font-bold shadow-md hover-bounce">
              <Link to="/patient-management">Ver Todos</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activeTreatments.slice(0, 5).map((treatment) => {
              const patient = patients.find(
                (p) => p.id === treatment.patientId,
              )
              const progress =
                (treatment.currentAlignerNumber / treatment.totalAligners) * 100

              return (
                <Link
                  key={treatment.id}
                  to={`/patient/${treatment.patientId}`}
                  className="block p-4 rounded-xl border-2 border-green-200 bg-white hover:border-green-400 hover:shadow-lg transition-all hover-scale"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800">
                        {patient?.fullName || 'Paciente desconhecido'}
                      </p>
                      <p className="text-sm text-gray-600 font-medium">
                        Alinhador {treatment.currentAlignerNumber} de {treatment.totalAligners}
                      </p>
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-gradient-to-r from-green-400 to-teal-400 h-3 rounded-full transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-teal-400 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Messages Section */}
      {conversations.length > 0 && (
        <Card className="rounded-2xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center shadow-md">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              Mensagens Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conversations.slice(0, 5).map((conversation) => (
                <div
                  key={conversation.userId}
                  className="p-4 rounded-xl border-2 border-blue-200 bg-white hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer hover-scale"
                  onClick={() => handleOpenChat(conversation.userId, conversation.userName, conversation.userRole)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-gray-800">{conversation.userName}</p>
                        {conversation.unreadCount > 0 && (
                          <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold text-xs px-2 py-1">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                      {conversation.lastMessage && (
                        <p className="text-sm text-gray-600 truncate font-medium mt-1">
                          {conversation.lastMessage.content}
                        </p>
                      )}
                    </div>
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center">
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Modal */}
      {selectedUser && (
        <ChatModal
          open={isChatOpen}
          onOpenChange={setIsChatOpen}
          otherUserId={selectedUser.id}
          otherUserName={selectedUser.name}
          otherUserRole={selectedUser.role}
        />
      )}
    </div>
  )
}

export default ClinicianDashboard



