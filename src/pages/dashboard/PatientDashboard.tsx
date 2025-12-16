import * as React from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Camera,
  MessageSquare,
  Calendar,
  Award,
  ShieldCheck,
  Star,
  Rocket,
  Play,
  Lock,
} from 'lucide-react'
import { useUserRole } from '@/context/UserRoleContext'
import { useCurrentAligner, useTreatment, useAligners } from '@/context/AlignerContext'
import { useAuth } from '@/context/AuthContext'
import { AlignerTracker } from '@/components/AlignerTracker'
import { PendingPhotosAlert } from '@/components/PendingPhotosAlert'
import { PatientMissions } from '@/components/PatientMissions'
import {
  calculateDaysUntilChange,
  calculateTreatmentProgress,
} from '@/utils/alignerCalculations'
import { Link } from 'react-router-dom'

const adhesionData = [
  { name: 'Seg', uso: 90 },
  { name: 'Ter', uso: 95 },
  { name: 'Qua', uso: 80 },
  { name: 'Qui', uso: 100 },
  { name: 'Sex', uso: 92 },
  { name: 'Sáb', uso: 88 },
  { name: 'Dom', uso: 98 },
]

const educationalContent = [
  {
    title: 'Como limpar seus alinhadores',
    image: 'https://img.usecurling.com/p/400/200?q=toothbrush%20aligner',
  },
  {
    title: 'Alimentos para evitar durante o tratamento',
    image: 'https://img.usecurling.com/p/400/200?q=hard%20candy',
  },
  {
    title: 'A importância do uso contínuo',
    image: 'https://img.usecurling.com/p/400/200?q=smiling%20person',
  },
]

const badges = [
  { name: 'Mês de Ouro', icon: Award, color: 'text-yellow-500' },
  { name: 'Paciente Assíduo', icon: ShieldCheck, color: 'text-green-500' },
  { name: 'Super Sorriso', icon: Star, color: 'text-blue-500' },
]

const PatientDashboard = () => {
  const { isChild } = useUserRole()
  const { user } = useAuth()
  const currentAligner = useCurrentAligner()
  const treatment = useTreatment()
  const { aligners, confirmAlignerChange } = useAligners()
  const daysUntilChange = currentAligner
    ? calculateDaysUntilChange(currentAligner)
    : 0
  const progress = calculateTreatmentProgress(treatment)

  const [canActivate, setCanActivate] = React.useState(false)
  const [daysRemaining, setDaysRemaining] = React.useState(0)
  const [isStartingTreatment, setIsStartingTreatment] = React.useState(false)
  const [isConfirmingChange, setIsConfirmingChange] = React.useState(false)

  // Verificar se pode ativar o próximo alinhador
  React.useEffect(() => {
    const checkCanActivate = async () => {
      if (!currentAligner?.id) return

      try {
        const response = await fetch(`/api/aligners/${currentAligner.id}/can-activate`)
        const data = await response.json()
        console.log('📅 Verificação de ativação:', data)
        setCanActivate(data.canActivate)
        setDaysRemaining(data.daysRemaining || 0)
      } catch (error) {
        console.error('Erro ao verificar ativação:', error)
      }
    }

    checkCanActivate()
    // Verificar a cada 1 hora
    const interval = setInterval(checkCanActivate, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [currentAligner?.id])

  // Verificar se o tratamento precisa ser iniciado
  const needsToStart = treatment && !treatment.startDate

  const handleStartTreatment = async () => {
    if (!treatment?.id) return

    setIsStartingTreatment(true)
    try {
      const response = await fetch(`/api/treatments/${treatment.id}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      const data = await response.json()

      if (data.success) {
        alert('🎉 Tratamento iniciado com sucesso!')
        window.location.reload()
      } else {
        alert('Erro ao iniciar tratamento: ' + (data.error || 'Erro desconhecido'))
      }
    } catch (error) {
      console.error('Erro ao iniciar tratamento:', error)
      alert('Erro ao iniciar tratamento')
    } finally {
      setIsStartingTreatment(false)
    }
  }

  const handleConfirmChange = async () => {
    if (!currentAligner?.id) return

    setIsConfirmingChange(true)
    try {
      await confirmAlignerChange(currentAligner.id)
      alert('🎉 Alinhador trocado com sucesso!')
      window.location.reload()
    } catch (error: any) {
      console.error('Erro ao confirmar troca:', error)
      alert(error.message || 'Erro ao confirmar troca de alinhador')
    } finally {
      setIsConfirmingChange(false)
    }
  }

  if (isChild) {
    return (
      <div className="space-y-6 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-4xl font-extrabold text-primary">
            E aí, Campeão!
          </h1>
          <img
            src="https://img.usecurling.com/p/100/100?q=smiling%20tooth%20superhero"
            alt="Mascote"
            className="h-24 w-24 animate-float"
          />
        </div>

        {/* Alert de Fotos Pendentes */}
        {user?.id && <PendingPhotosAlert patientId={user.id} />}

        <Card className="border-primary-child border-2 shadow-lg bg-accent-child">
          <CardHeader>
            <CardTitle className="font-display text-2xl font-bold text-center">
              {needsToStart ? '🚀 Pronto para Começar?' : 'Próxima Missão: Trocar Alinhador!'}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            {needsToStart ? (
              <>
                <p className="text-lg mb-4 text-gray-700">
                  Clique no botão abaixo para iniciar sua jornada do sorriso!
                </p>
                <Button
                  onClick={handleStartTreatment}
                  disabled={isStartingTreatment}
                  className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white text-xl font-bold px-12 py-8 rounded-full shadow-xl hover:scale-105 transition-all"
                >
                  <Play className="mr-2 h-6 w-6" />
                  {isStartingTreatment ? 'Iniciando...' : 'Iniciar Tratamento'}
                </Button>
              </>
            ) : (
              <>
                <p className="text-6xl font-bold text-primary-child">
                  {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                </p>
                <p className="text-muted-foreground font-semibold">
                  Alinhador #{currentAligner?.number || 'N/A'}
                  {treatment && ` de ${treatment.totalAligners}`}
                </p>
                {currentAligner && (
                  <Button
                    onClick={handleConfirmChange}
                    disabled={!canActivate || isConfirmingChange}
                    className="mt-4 bg-primary-child hover:bg-primary-child/90 text-lg font-bold px-8 py-6 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {!canActivate ? (
                      <>
                        <Lock className="mr-2" />
                        Faltam {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                      </>
                    ) : isConfirmingChange ? (
                      'Trocando...'
                    ) : (
                      <>
                        <Rocket className="mr-2" />
                        Troquei!
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Missões Ativas */}
        {user?.id && <PatientMissions patientId={user.id} variant="full" />}

        <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Progresso da Missão</CardTitle>
                <CardDescription>
                  Use o alinhador por 2 semanas sem esquecer!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress
                  value={progress}
                  className="[&>*]:bg-secondary-child h-4"
                />
                <p className="mt-2 text-sm text-muted-foreground">
                  {progress.toFixed(0)}% do tratamento completo
                </p>
              </CardContent>
            </Card>
            <Card className="border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 hover-scale">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-6 w-6 text-yellow-500 animate-wiggle-slow" />
                  Ranking de Pontos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg">
                  Você está em{' '}
                  <span className="font-bold text-orange-600 text-3xl animate-pulse">
                    2º lugar
                  </span>{' '}
                  na clínica!
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Continue assim para alcançar o 1º lugar! 🚀
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Button
              asChild
              size="lg"
              className="h-16 text-base font-bold bg-gradient-to-r from-yellow-400 to-orange-400 hover:scale-105 text-yellow-900 shadow-lg hover-bounce"
            >
              <Link to="/photos">
                <Camera className="mr-2 h-5 w-5" />
                Tirar Fotos Divertidas
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-16 text-base font-bold bg-gradient-to-r from-pink-400 to-purple-400 hover:scale-105 text-pink-900 shadow-lg hover-bounce"
            >
              <Link to="/chat">
                <MessageSquare className="mr-2 h-5 w-5" />
                Falar com a Doutora
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="h-16 text-base font-bold bg-gradient-to-r from-green-400 to-teal-400 hover:scale-105 text-green-900 shadow-lg hover-bounce"
            >
              <Link to="/gamification">
                <Award className="mr-2 h-5 w-5" />
                Ver Meus Prêmios
              </Link>
            </Button>
          </div>
        </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-3xl font-bold">Olá, Paciente!</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AlignerTracker />
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{needsToStart ? 'Iniciar Tratamento' : 'Próxima Troca'}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              {needsToStart ? (
                <>
                  <p className="mb-4 text-muted-foreground">
                    Clique no botão abaixo para iniciar seu tratamento
                  </p>
                  <Button
                    onClick={handleStartTreatment}
                    disabled={isStartingTreatment}
                    className="w-full bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    {isStartingTreatment ? 'Iniciando...' : 'Iniciar Tratamento'}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-5xl font-bold text-primary">
                    {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                  </p>
                  <p className="text-muted-foreground">
                    Alinhador #{currentAligner?.number || 'N/A'}
                    {treatment && ` de ${treatment.totalAligners}`}
                  </p>
                  {currentAligner && (
                    <Button
                      className="mt-4 w-full"
                      onClick={handleConfirmChange}
                      disabled={!canActivate || isConfirmingChange}
                    >
                      {!canActivate ? (
                        <>
                          <Lock className="mr-2 h-4 w-4" />
                          Aguardar {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}
                        </>
                      ) : isConfirmingChange ? (
                        'Confirmando...'
                      ) : (
                        'Confirmar Troca'
                      )}
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-2">
              <Button variant="outline" asChild>
                <Link to="/photos">
                  <Camera className="mr-2 h-4 w-4" />
                  Enviar Fotos
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/chat">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat com a Clínica
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link to="/my-treatment">
                  <Calendar className="mr-2 h-4 w-4" />
                  Ver Linha do Tempo
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Missões Ativas */}
      {user?.id && <PatientMissions patientId={user.id} variant="full" />}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo Educacional</CardTitle>
          </CardHeader>
          <CardContent>
            <Carousel>
              <CarouselContent>
                {educationalContent.map((item, index) => (
                  <CarouselItem key={index}>
                    <img
                      src={item.image}
                      alt={item.title}
                      className="w-full rounded-lg object-cover"
                    />
                    <p className="mt-2 font-semibold">{item.title}</p>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Badges de Disciplina</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-around">
            {badges.map((badge) => (
              <div
                key={badge.name}
                className="flex flex-col items-center gap-2"
              >
                <badge.icon className={`h-12 w-12 ${badge.color}`} />
                <span className="text-xs font-medium">{badge.name}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default PatientDashboard
