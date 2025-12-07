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
} from 'lucide-react'
import { useUserRole } from '@/context/UserRoleContext'
import { useGamification } from '@/context/GamificationContext'
import { Link } from 'react-router-dom'
import { GamificationStats } from '@/components/GamificationStats'
import { DailyMissions } from '@/components/DailyMissions'
import { Celebration } from '@/components/Confetti'

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
  const { showCelebration, celebrationMessage, checkIn } = useGamification()

  if (isChild) {
    return (
      <>
        <Celebration show={showCelebration} message={celebrationMessage} />
        <div className="space-y-6 animate-fade-in-up">
          <div className="flex items-center justify-between">
            <h1 className="font-display text-4xl font-extrabold text-primary">
              E aí, Campeão!
            </h1>
            <img
              src="https://img.usecurling.com/p/100/100?q=smiling%20tooth%20superhero"
              alt="Mascote"
              className="h-24 w-24 animate-float hover-wiggle"
            />
          </div>

          {/* Estatísticas de Gamificação */}
          <GamificationStats />

          <Card className="border-primary-child border-2 shadow-lg bg-gradient-to-br from-sky-50 to-blue-100 hover-scale">
            <CardHeader>
              <CardTitle className="font-display text-2xl font-bold text-center">
                Próxima Missão: Trocar Alinhador!
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-6xl font-bold text-primary-child animate-bounce-slow">
                3 dias
              </p>
              <p className="text-muted-foreground font-semibold">Alinhador #5</p>
              <Button
                onClick={checkIn}
                className="mt-4 bg-gradient-to-r from-primary-child to-blue-500 hover:scale-105 text-lg font-bold px-8 py-6 rounded-full shadow-lg hover-bounce"
              >
                <Rocket className="mr-2 h-6 w-6" />
                Troquei!
              </Button>
            </CardContent>
          </Card>

          {/* Missões Diárias */}
          <DailyMissions />

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="hover-scale">
              <CardHeader>
                <CardTitle>Progresso da Missão</CardTitle>
                <CardDescription>
                  Use o alinhador por 2 semanas sem esquecer!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Progress value={75} className="[&>*]:bg-secondary-child h-4" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Recompensa: Selo do Herói 🏆
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
      </>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-3xl font-bold">Olá, Paciente!</h1>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Resumo do Progresso</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={adhesionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis unit="%" />
                <Tooltip />
                <Bar
                  dataKey="uso"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Próxima Troca</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-5xl font-bold text-primary">3 dias</p>
              <p className="text-muted-foreground">Alinhador #5 de 24</p>
              <Button className="mt-4 w-full">Confirmar Troca</Button>
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
