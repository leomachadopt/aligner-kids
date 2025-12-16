import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  Footprints,
  Rocket,
  Sparkles,
  Trophy,
  Flag,
  Play,
  Lock,
} from 'lucide-react'
import { Celebration } from './Confetti'
import { useGamification } from '@/context/GamificationContext'
import { useTreatment, useCurrentAligner, useAligners } from '@/context/AlignerContext'

export const AdventureJourney = () => {
  const treatment = useTreatment()
  const currentAlignerData = useCurrentAligner()
  const { confirmAlignerChange } = useAligners()
  const { addCoins, addXP } = useGamification()

  const totalAligners = treatment?.totalAligners || 9 // Default to 9 if no treatment
  const currentAligner = currentAlignerData?.number || 1
  const [showCelebration, setShowCelebration] = useState(false)
  const [canActivate, setCanActivate] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState(0)
  const [isStartingTreatment, setIsStartingTreatment] = useState(false)
  const [isConfirmingChange, setIsConfirmingChange] = useState(false)

  const { aligners } = useAligners()

  // Verificar se pode ativar o próximo alinhador
  useEffect(() => {
    const checkCanActivate = async () => {
      if (!currentAlignerData?.id) return

      try {
        const response = await fetch(`/api/aligners/${currentAlignerData.id}/can-activate`)
        const data = await response.json()
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
  }, [currentAlignerData?.id])

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

  const handleNextAligner = async () => {
    if (!currentAlignerData?.id) return

    setIsConfirmingChange(true)
    try {
      await confirmAlignerChange(currentAlignerData.id)
      setShowCelebration(true)
      addCoins(50)
      addXP(25)
      setTimeout(() => window.location.reload(), 2000)
    } catch (error: any) {
      console.error('Error confirming aligner change:', error)
      alert(error.message || 'Erro ao confirmar troca de alinhador')
    } finally {
      setIsConfirmingChange(false)
    }
  }

  const journeySteps = Array.from({ length: totalAligners }, (_, i) => i + 1)

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
            {/* Linha do Caminho */}
            <div className="relative">
              <div className="absolute left-0 right-0 top-8 h-1 bg-gradient-to-r from-green-400 via-blue-400 via-purple-400 to-yellow-400 opacity-30" />

              <div className="flex flex-wrap justify-center gap-3">
                {journeySteps.map((step) => {
                  const isCompleted = step < currentAligner
                  const isCurrent = step === currentAligner
                  const isFuture = step > currentAligner
                  // Milestone a cada 1/4 dos alinhadores
                  const milestoneInterval = Math.ceil(totalAligners / 4)
                  const isMilestone = step % milestoneInterval === 0

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
                      {isFuture && isMilestone && (
                        <Flag className="h-6 w-6 text-gray-400" />
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

            {needsToStart ? (
              <Button
                onClick={handleStartTreatment}
                disabled={isStartingTreatment}
                size="lg"
                className="rounded-full bg-gradient-to-r from-green-500 to-blue-500 px-12 py-8 text-xl font-bold text-white shadow-xl hover:scale-110 hover:shadow-2xl transition-all"
              >
                <Play className="mr-2 h-8 w-8" />
                {isStartingTreatment ? 'Iniciando...' : 'Iniciar Tratamento'}
              </Button>
            ) : currentAligner < totalAligners ? (
              <Button
                onClick={handleNextAligner}
                disabled={!canActivate || isConfirmingChange}
                size="lg"
                className="rounded-full bg-gradient-to-r from-green-400 to-blue-400 px-8 py-6 text-lg font-bold text-white shadow-lg hover:scale-105 hover:shadow-xl transition-all hover-bounce disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {!canActivate ? (
                  <>
                    <Lock className="mr-2 h-6 w-6" />
                    Faltam {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}!
                  </>
                ) : isConfirmingChange ? (
                  'Trocando...'
                ) : (
                  <>
                    <Rocket className="mr-2 h-6 w-6" />
                    Passei para o próximo alinhador!
                  </>
                )}
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
