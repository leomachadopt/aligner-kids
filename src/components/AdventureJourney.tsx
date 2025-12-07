import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Footprints,
  Rocket,
  Sparkles,
  Trophy,
  Mountain,
  Trees,
  Castle,
  Flag,
  Star,
} from 'lucide-react'
import { Celebration } from './Confetti'
import { useGamification } from '@/context/GamificationContext'
import { useTreatment, useCurrentAligner, useAligners } from '@/context/AlignerContext'

const TOTAL_ALIGNERS = 24

// Temas visuais para cada marco da jornada
const JOURNEY_THEMES = [
  { range: [1, 6], icon: Trees, color: 'bg-green-400', label: 'Floresta Inicial' },
  { range: [7, 12], icon: Mountain, color: 'bg-blue-400', label: 'Montanhas' },
  { range: [13, 18], icon: Castle, color: 'bg-purple-400', label: 'Reino Mágico' },
  { range: [19, 24], icon: Star, color: 'bg-yellow-400', label: 'Céu Estrelado' },
]

export const AdventureJourney = () => {
  const treatment = useTreatment()
  const currentAlignerData = useCurrentAligner()
  const { confirmAlignerChange } = useAligners()
  const { addCoins, addXP } = useGamification()
  
  const totalAligners = treatment?.totalAligners || TOTAL_ALIGNERS
  const currentAligner = currentAlignerData?.number || 1
  const [showCelebration, setShowCelebration] = useState(false)

  const { aligners } = useAligners()
  
  const handleNextAligner = async () => {
    if (currentAligner < totalAligners) {
      // Find next aligner
      const nextAligner = aligners.find(
        (a) => a.number === currentAligner + 1 && a.status === 'pending'
      )
      
      if (nextAligner) {
        try {
          await confirmAlignerChange(nextAligner.id)
          setShowCelebration(true)
          addCoins(50)
          addXP(25)
        } catch (error) {
          console.error('Error confirming aligner change:', error)
        }
      }
    }
  }

  const journeySteps = Array.from({ length: TOTAL_ALIGNERS }, (_, i) => i + 1)

  const getThemeForStep = (step: number) => {
    return JOURNEY_THEMES.find(
      (theme) => step >= theme.range[0] && step <= theme.range[1],
    )
  }

  return (
    <>
      <Celebration
        show={showCelebration}
        message="🚀 Alinhador Completado! 🚀"
        icon={<Rocket className="h-16 w-16" />}
        onComplete={() => setShowCelebration(false)}
      />

      <Card className="overflow-hidden shadow-lg border-2 border-primary-child">
        <CardHeader className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
          <CardTitle className="flex items-center gap-2 font-display text-2xl text-white drop-shadow-lg">
            <Rocket className="animate-bounce-slow h-8 w-8" />
            Sua Jornada Rumo ao Super Sorriso!
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {/* Mapa Visual da Jornada */}
          <div className="relative mb-8 overflow-x-auto rounded-xl bg-gradient-to-br from-sky-100 via-blue-50 to-purple-50 p-6">
            <div className="mb-4 flex justify-center gap-8">
              {JOURNEY_THEMES.map((theme) => {
                const ThemeIcon = theme.icon
                const isActive =
                  currentAligner >= theme.range[0] && currentAligner <= theme.range[1]
                return (
                  <div
                    key={theme.label}
                    className={cn(
                      'flex flex-col items-center gap-2 rounded-lg p-3 transition-all',
                      isActive && 'scale-110',
                    )}
                  >
                    <div
                      className={cn(
                        'rounded-full p-3',
                        theme.color,
                        isActive && 'animate-bounce-slow shadow-lg',
                      )}
                    >
                      <ThemeIcon className="h-6 w-6 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-gray-700">
                      {theme.label}
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Linha do Caminho */}
            <div className="relative">
              <div className="absolute left-0 right-0 top-8 h-1 bg-gradient-to-r from-green-400 via-blue-400 via-purple-400 to-yellow-400 opacity-30" />

              <div className="flex flex-wrap justify-center gap-3">
                {journeySteps.map((step) => {
                  const isCompleted = step < currentAligner
                  const isCurrent = step === currentAligner
                  const isFuture = step > currentAligner
                  const theme = getThemeForStep(step)
                  const isMilestone = step % 6 === 0

                  return (
                    <div
                      key={step}
                      className={cn(
                        'relative flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 transition-all duration-300 hover-scale',
                        isCompleted && 'border-green-500 bg-green-100 shadow-md',
                        isCurrent &&
                          'scale-125 border-primary-child bg-primary-child/20 shadow-xl shadow-primary-child/50 animate-glow',
                        isFuture && 'border-dashed border-gray-400 bg-gray-50',
                        isMilestone && 'h-20 w-20',
                      )}
                    >
                      {isCompleted && (
                        <Footprints className="h-6 w-6 text-green-600 animate-fade-in" />
                      )}
                      {isCurrent && (
                        <Sparkles className="h-7 w-7 animate-pulse text-primary-child" />
                      )}
                      {isFuture && isMilestone && theme && (
                        <theme.icon className="h-6 w-6 text-gray-400" />
                      )}
                      <span
                        className={cn(
                          'absolute -bottom-6 text-xs font-bold',
                          isCompleted && 'text-green-600',
                          isCurrent && 'text-primary-child text-sm',
                          isFuture && 'text-gray-500',
                        )}
                      >
                        {step}
                      </span>
                    </div>
                  )
                })}

                {/* Troféu Final */}
                <div
                  className={cn(
                    'relative flex h-24 w-24 flex-col items-center justify-center rounded-full border-4 border-yellow-500 bg-gradient-to-br from-yellow-200 to-yellow-400 shadow-xl transition-all duration-300',
                    currentAligner >= totalAligners &&
                      'scale-150 animate-bounce-slow shadow-2xl shadow-yellow-400/50',
                  )}
                >
                  <Trophy className="h-12 w-12 text-yellow-700 animate-wiggle-slow" />
                  <Flag className="absolute -top-2 -right-2 h-6 w-6 text-red-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Progresso e Ação */}
          <div className="mt-8 space-y-4 text-center">
            <div className="rounded-lg bg-gradient-to-r from-primary-child/10 to-purple-400/10 p-4">
              <p className="mb-2 text-lg font-semibold">
                Você está no alinhador{' '}
                <span className="text-3xl font-extrabold text-primary-child drop-shadow-md">
                  {currentAligner}
                </span>{' '}
                de {totalAligners}!
              </p>
              <div className="mx-auto h-3 w-full max-w-md overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 transition-all duration-500"
                  style={{ width: `${(currentAligner / totalAligners) * 100}%` }}
                />
              </div>
              <p className="mt-2 text-sm font-medium text-gray-600">
                {Math.round((currentAligner / totalAligners) * 100)}% completo
              </p>
            </div>

            {currentAligner < totalAligners ? (
              <Button
                onClick={handleNextAligner}
                size="lg"
                className="rounded-full bg-gradient-to-r from-green-400 to-blue-400 px-8 py-6 text-lg font-bold text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all hover-bounce"
              >
                <Rocket className="mr-2 h-6 w-6" />
                Passei para o próximo alinhador!
              </Button>
            ) : (
              <div className="rounded-xl bg-gradient-to-r from-yellow-400 via-orange-400 to-red-400 p-6 animate-bounce-slow">
                <p className="font-display text-2xl font-extrabold text-white drop-shadow-lg">
                  🎉 Parabéns! Você completou sua jornada! 🎉
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
