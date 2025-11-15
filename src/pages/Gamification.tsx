import { Award, ShieldCheck, Star, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const badges = [
  { name: 'Mês de Ouro', icon: Award, color: 'text-yellow-500', earned: true },
  {
    name: 'Paciente Assíduo',
    icon: ShieldCheck,
    color: 'text-green-500',
    earned: true,
  },
  { name: 'Super Sorriso', icon: Star, color: 'text-blue-500', earned: true },
  {
    name: 'Fotógrafo Pro',
    icon: Trophy,
    color: 'text-purple-500',
    earned: false,
  },
]

const missions = [
  {
    title: 'Missão Diária: Usar o alinhador por 22h',
    progress: 90,
    reward: '10 pontos',
  },
  {
    title: 'Missão Semanal: Enviar as fotos de acompanhamento',
    progress: 100,
    reward: '50 pontos',
  },
  {
    title: 'Missão Especial: Trocar de alinhador na data certa',
    progress: 0,
    reward: 'Selo "Pontualidade"',
  },
]

const ranking = [
  { name: 'Herói Anônimo 1', points: 1250, avatar: '1' },
  { name: 'Você', points: 1100, avatar: 'you' },
  { name: 'Herói Anônimo 2', points: 980, avatar: '2' },
]

const Gamification = () => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-primary">
            Central de Aventuras
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Complete missões, ganhe selos e suba no ranking!
          </p>
        </div>
        <img
          src="https://img.usecurling.com/p/120/120?q=happy%20robot%20mascot"
          alt="Mascote"
          className="animate-float"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Minhas Missões</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {missions.map((mission) => (
              <div key={mission.title}>
                <div className="flex justify-between text-sm font-medium">
                  <p>{mission.title}</p>
                  <p className="text-primary">{mission.reward}</p>
                </div>
                <Progress value={mission.progress} className="mt-1 h-3" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ranking dos Heróis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ranking.map((player, index) => (
              <div
                key={player.name}
                className={`flex items-center justify-between rounded-lg p-2 ${
                  player.name === 'Você' ? 'bg-primary-child/20' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-bold text-lg">{index + 1}º</span>
                  <Avatar>
                    <AvatarImage
                      src={`https://img.usecurling.com/ppl/thumbnail?seed=${player.avatar}`}
                    />
                    <AvatarFallback>{player.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="font-semibold">{player.name}</p>
                </div>
                <p className="font-bold text-primary">{player.points} pts</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coleção de Selos</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
          {badges.map((badge) => (
            <div
              key={badge.name}
              className={`flex flex-col items-center gap-2 rounded-lg p-4 ${
                badge.earned ? 'bg-green-100' : 'bg-muted'
              }`}
            >
              <badge.icon
                className={`h-16 w-16 ${
                  badge.earned ? badge.color : 'text-gray-400'
                }`}
              />
              <span className="font-semibold">{badge.name}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default Gamification
