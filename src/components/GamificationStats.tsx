import { useGamification } from '@/context/GamificationContext'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Coins, Flame, Star, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export const GamificationStats = ({ compact = false }: { compact?: boolean }) => {
  const { coins, xp, level, currentStreak } = useGamification()

  const xpForNextLevel = level * 100
  const xpProgress = (xp % 100) / 100 * 100

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1 rounded-full bg-yellow-400 px-3 py-1 shadow-md hover-scale">
          <Coins className="h-4 w-4 text-yellow-800" />
          <span className="font-bold text-yellow-900">{coins}</span>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-purple-400 px-3 py-1 shadow-md hover-scale">
          <Star className="h-4 w-4 text-purple-800" />
          <span className="font-bold text-purple-900">Nv {level}</span>
        </div>
        {currentStreak > 0 && (
          <div className="flex items-center gap-1 rounded-full bg-orange-400 px-3 py-1 shadow-md hover-scale animate-glow">
            <Flame className="h-4 w-4 text-orange-800" />
            <span className="font-bold text-orange-900">{currentStreak}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="overflow-hidden border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 hover-scale">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700">Moedas</p>
              <p className="text-3xl font-bold text-yellow-900">{coins}</p>
            </div>
            <div className="rounded-full bg-yellow-400 p-3 animate-bounce-slow">
              <Coins className="h-8 w-8 text-yellow-800" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="overflow-hidden border-2 border-purple-400 bg-gradient-to-br from-purple-50 to-purple-100 hover-scale">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-medium text-purple-700">Nível {level}</p>
              <p className="text-xl font-bold text-purple-900">
                {xp % 100}/{xpForNextLevel % 100} XP
              </p>
            </div>
            <div className="rounded-full bg-purple-400 p-3 animate-wiggle-slow">
              <Star className="h-8 w-8 text-purple-800" />
            </div>
          </div>
          <Progress value={xpProgress} className="h-2 [&>*]:bg-purple-600" />
        </CardContent>
      </Card>

      <Card
        className={cn(
          'overflow-hidden border-2 hover-scale',
          currentStreak > 0
            ? 'border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100'
            : 'border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100',
        )}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p
                className={cn(
                  'text-sm font-medium',
                  currentStreak > 0 ? 'text-orange-700' : 'text-gray-600',
                )}
              >
                Sequência
              </p>
              <p
                className={cn(
                  'text-3xl font-bold',
                  currentStreak > 0 ? 'text-orange-900' : 'text-gray-700',
                )}
              >
                {currentStreak} {currentStreak === 1 ? 'dia' : 'dias'}
              </p>
            </div>
            <div
              className={cn(
                'rounded-full p-3',
                currentStreak > 0
                  ? 'bg-orange-400 animate-glow'
                  : 'bg-gray-300',
              )}
            >
              <Flame
                className={cn(
                  'h-8 w-8',
                  currentStreak > 0 ? 'text-orange-800' : 'text-gray-600',
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export const StreakCounter = () => {
  const { currentStreak, longestStreak } = useGamification()

  return (
    <Card className="overflow-hidden border-2 border-orange-400 bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50">
      <CardContent className="p-6">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="relative">
              <Flame className="h-24 w-24 text-orange-500 animate-wiggle-slow" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-extrabold text-white drop-shadow-lg">
                  {currentStreak}
                </span>
              </div>
            </div>
          </div>
          <h3 className="font-display text-2xl font-extrabold text-orange-900">
            Sequência Ativa!
          </h3>
          <p className="mt-2 text-lg text-orange-700">
            {currentStreak === 0 && 'Comece sua jornada hoje!'}
            {currentStreak === 1 && 'Você começou! Continue amanhã!'}
            {currentStreak > 1 && currentStreak < 7 && 'Você está indo bem! Continue assim!'}
            {currentStreak >= 7 && currentStreak < 30 && 'Incrível! Você é um campeão!'}
            {currentStreak >= 30 && 'LENDÁRIO! Você é imparável! 🔥'}
          </p>
          {longestStreak > currentStreak && (
            <div className="mt-4 rounded-lg bg-orange-100 p-3">
              <div className="flex items-center justify-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                <p className="text-sm font-semibold text-orange-800">
                  Recorde: {longestStreak} dias
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
