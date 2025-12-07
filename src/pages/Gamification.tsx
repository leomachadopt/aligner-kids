import { Award, ShieldCheck, Star, Trophy, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AdventureJourney } from '@/components/AdventureJourney'
import { StoryUnlock } from '@/components/StoryUnlock'
import { useTreatment } from '@/context/AlignerContext'
import { cn } from '@/lib/utils'

const badges = [
  { id: '1', name: 'Mês de Ouro', icon: '🏆', earned: true, description: 'Um mês completo de uso', earnedDate: '2024-01-15' },
  { id: '2', name: 'Paciente Assíduo', icon: '🛡️', earned: true, description: 'Alta aderência', earnedDate: '2024-01-20' },
  { id: '3', name: 'Super Sorriso', icon: '⭐', earned: true, description: 'Progresso excelente', earnedDate: '2024-02-01' },
  { id: '4', name: 'Fotógrafo Pro', icon: '📸', earned: false, description: 'Envie 10 fotos', earnedDate: null },
]

const Gamification = () => {
  const treatment = useTreatment()

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
          className="animate-float hover-wiggle"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <AdventureJourney />
        </div>
        <div>
          <StoryUnlock />
        </div>
      </div>

      {/* Coleção de Badges */}
      <Card className="border-2 border-purple-400 shadow-lg hover-scale">
        <CardHeader className="bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
          <CardTitle className="flex items-center gap-2 font-display text-2xl text-white drop-shadow-lg">
            <Sparkles className="h-6 w-6 animate-wiggle-slow" />
            Coleção de Selos
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 p-6 text-center md:grid-cols-4">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={cn(
                'group flex flex-col items-center gap-3 rounded-xl border-2 p-4 transition-all duration-300 hover-scale',
                badge.earned
                  ? 'border-green-400 bg-gradient-to-br from-green-50 to-green-100 shadow-md hover:shadow-lg'
                  : 'border-gray-300 bg-gray-50',
              )}
            >
              <div
                className={cn(
                  'text-6xl transition-transform duration-300',
                  badge.earned && 'group-hover:scale-110 animate-bounce-slow',
                  !badge.earned && 'grayscale opacity-40',
                )}
              >
                {badge.icon}
              </div>
              <div>
                <p
                  className={cn(
                    'font-semibold',
                    badge.earned ? 'text-green-700' : 'text-gray-500',
                  )}
                >
                  {badge.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {badge.description}
                </p>
                {badge.earned && badge.earnedDate && (
                  <p className="mt-2 text-xs font-medium text-green-600">
                    ✓ Conquistado
                  </p>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default Gamification
