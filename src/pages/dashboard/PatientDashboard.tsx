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
        <Card className="border-primary-child border-2 shadow-lg bg-accent-child">
          <CardHeader>
            <CardTitle className="font-display text-2xl font-bold text-center">
              Próxima Missão: Trocar Alinhador!
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-6xl font-bold text-primary-child">3 dias</p>
            <p className="text-muted-foreground font-semibold">Alinhador #5</p>
            <Button className="mt-4 bg-primary-child hover:bg-primary-child/90 text-lg font-bold px-8 py-6 rounded-full">
              <Rocket className="mr-2" />
              Troquei!
            </Button>
          </CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Progresso da Missão</CardTitle>
              <CardDescription>
                Use o alinhador por 2 semanas sem esquecer!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Progress value={75} className="[&>*]:bg-secondary-child h-4" />
              <p className="mt-2 text-sm text-muted-foreground">
                Recompensa: Selo do Herói
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Ranking de Pontos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg">
                Você está em{' '}
                <span className="font-bold text-primary-child text-2xl">
                  2º lugar
                </span>{' '}
                na clínica!
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Button
            asChild
            size="lg"
            className="h-16 text-base font-bold bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
          >
            <Link to="/photos">Tirar Fotos Divertidas</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="h-16 text-base font-bold bg-pink-400 hover:bg-pink-500 text-pink-900"
          >
            <Link to="/chat">Falar com a Doutora</Link>
          </Button>
          <Button
            asChild
            size="lg"
            className="h-16 text-base font-bold bg-green-400 hover:bg-green-500 text-green-900"
          >
            <Link to="/gamification">Ver Meus Prêmios</Link>
          </Button>
        </div>
      </div>
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
