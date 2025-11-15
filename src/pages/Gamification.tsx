import { Award, ShieldCheck, Star, Trophy } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdventureJourney } from '@/components/AdventureJourney'

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

const Gamification = () => {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-4xl font-extrabold text-primary">
            Central de Aventuras
          </h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Acompanhe sua jornada e colecione selos incríveis!
          </p>
        </div>
        <img
          src="https://img.usecurling.com/p/120/120?q=happy%20robot%20mascot"
          alt="Mascote"
          className="animate-float"
        />
      </div>

      <AdventureJourney />

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
