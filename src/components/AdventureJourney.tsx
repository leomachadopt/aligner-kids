import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { Footprints, Rocket, Sparkles, Trophy } from 'lucide-react'

const TOTAL_ALIGNERS = 24

export const AdventureJourney = () => {
  const [currentAligner, setCurrentAligner] = useState(5)

  const handleNextAligner = () => {
    setCurrentAligner((prev) => (prev < TOTAL_ALIGNERS ? prev + 1 : prev))
  }

  const journeySteps = Array.from({ length: TOTAL_ALIGNERS }, (_, i) => i + 1)

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-display text-2xl">
          <Rocket className="text-primary-child" />
          Sua Jornada Rumo ao Super Sorriso!
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6 flex flex-wrap justify-center gap-4">
          {journeySteps.map((step) => {
            const isCompleted = step < currentAligner
            const isCurrent = step === currentAligner
            const isFuture = step > currentAligner

            return (
              <div
                key={step}
                className={cn(
                  'relative flex h-16 w-16 flex-col items-center justify-center rounded-full border-2 transition-all duration-300',
                  isCompleted && 'border-green-400 bg-green-100',
                  isCurrent &&
                    'scale-110 border-primary-child bg-primary-child/20 shadow-lg shadow-primary-child/50',
                  isFuture && 'border-dashed border-muted-foreground/50',
                )}
              >
                {isCompleted && (
                  <Footprints className="h-6 w-6 text-green-500" />
                )}
                {isCurrent && (
                  <Sparkles className="h-6 w-6 animate-pulse text-primary-child" />
                )}
                <span
                  className={cn(
                    'font-bold',
                    isCompleted && 'text-green-600',
                    isCurrent && 'text-lg text-primary-child',
                    isFuture && 'text-muted-foreground',
                  )}
                >
                  {step}
                </span>
              </div>
            )
          })}
          <div
            className={cn(
              'flex h-20 w-20 flex-col items-center justify-center rounded-full border-4 border-yellow-400 bg-yellow-100 transition-all duration-300',
              currentAligner >= TOTAL_ALIGNERS &&
                'scale-125 shadow-xl shadow-yellow-400/50',
            )}
          >
            <Trophy className="h-10 w-10 text-yellow-500" />
          </div>
        </div>
        <div className="mt-8 text-center">
          <p className="mb-4 text-lg font-semibold">
            Você está no alinhador{' '}
            <span className="text-2xl font-extrabold text-primary-child">
              {currentAligner}
            </span>{' '}
            de {TOTAL_ALIGNERS}!
          </p>
          {currentAligner < TOTAL_ALIGNERS ? (
            <Button
              onClick={handleNextAligner}
              size="lg"
              className="rounded-full bg-secondary-child px-8 py-6 text-lg font-bold text-secondary-foreground hover:bg-secondary-child/90"
            >
              Passei para o próximo alinhador!
            </Button>
          ) : (
            <p className="text-xl font-bold text-green-600">
              Parabéns! Você completou sua jornada!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
