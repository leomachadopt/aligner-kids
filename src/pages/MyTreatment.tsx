import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, MapPin, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTreatment, useCurrentAligner, useAligners } from '@/context/AlignerContext'
import { useAuth } from '@/context/AuthContext'
import { calculateTreatmentProgress } from '@/utils/alignerCalculations'
import { TreatmentTimeline } from '@/components/TreatmentTimeline'
import { PhaseService } from '@/services/phaseService'
import type { TreatmentPhase } from '@/types/aligner'

const MyTreatment = () => {
  const { user } = useAuth()
  const treatment = useTreatment()
  const currentAligner = useCurrentAligner()
  const { aligners } = useAligners()
  const [phases, setPhases] = useState<TreatmentPhase[]>([])
  const [loadingPhases, setLoadingPhases] = useState(true)

  const currentAlignerNumber = currentAligner?.number || 0
  const totalAligners = treatment?.totalAligners || 24
  const progressPercentage = calculateTreatmentProgress(treatment)

  // Buscar fases do tratamento
  useEffect(() => {
    const loadPhases = async () => {
      if (!treatment?.id) {
        setLoadingPhases(false)
        return
      }

      try {
        const phasesData = await PhaseService.getPhasesByTreatment(treatment.id)
        setPhases(phasesData)
      } catch (error) {
        console.error('Erro ao carregar fases:', error)
      } finally {
        setLoadingPhases(false)
      }
    }

    loadPhases()
  }, [treatment?.id])

  // Generate treatment steps based on phases
  const treatmentSteps = phases.length > 0
    ? phases.map((phase) => ({
        name: phase.phaseName,
        description: `Alinhadores ${phase.startAlignerNumber} a ${phase.endAlignerNumber}`,
        completed: phase.status === 'completed',
        active: phase.status === 'active',
      }))
    : [
        // Fallback to milestones if no phases
        { name: 'Início da Aventura', description: 'Alinhador 1', completed: currentAlignerNumber >= 1, active: currentAlignerNumber === 1 },
        { name: `Progresso Inicial`, description: `Alinhador ${Math.floor(totalAligners * 0.25)}`, completed: currentAlignerNumber >= Math.floor(totalAligners * 0.25), active: false },
        { name: `Meio da Jornada`, description: `Alinhador ${Math.floor(totalAligners * 0.5)}`, completed: currentAlignerNumber >= Math.floor(totalAligners * 0.5), active: false },
        { name: `Reta Final`, description: `Alinhador ${Math.floor(totalAligners * 0.75)}`, completed: currentAlignerNumber >= Math.floor(totalAligners * 0.75), active: false },
        { name: 'Fim da Jornada!', description: `Alinhador ${totalAligners}`, completed: currentAlignerNumber >= totalAligners, active: false },
      ]

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col items-center text-center">
        <img
          src="https://img.usecurling.com/p/150/150?q=treasure%20map%20tooth"
          alt="Mascote Mapa"
          className="mb-4 animate-float hover-wiggle"
        />
        <h1 className="font-display text-4xl font-extrabold text-primary">
          Sua Jornada do Sorriso
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Acompanhe sua aventura para um sorriso incrível!
        </p>
      </div>

      <Card className="shadow-lg border-2 border-primary-child hover-scale">
        <CardHeader className="bg-gradient-to-r from-blue-400 to-purple-400">
          <CardTitle className="flex items-center gap-2 text-white drop-shadow-lg">
            <Sparkles className="h-6 w-6 animate-wiggle-slow" />
            Progresso Atual
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <span className="font-bold text-primary-child">Alinhador {currentAlignerNumber}</span>
            <Progress
              value={progressPercentage}
              className="h-4 flex-1 [&>*]:bg-gradient-to-r [&>*]:from-green-400 [&>*]:via-blue-400 [&>*]:to-purple-400"
            />
            <span className="font-bold text-gray-600">Alinhador {totalAligners}</span>
          </div>
          <p className="mt-4 text-center text-lg font-semibold text-muted-foreground">
            Você já completou{' '}
            <span className="text-2xl font-extrabold text-primary-child">
              {progressPercentage.toFixed(0)}%
            </span>{' '}
            da sua jornada! 🎉
          </p>
        </CardContent>
      </Card>

      <TreatmentTimeline aligners={aligners} currentAlignerNumber={currentAlignerNumber} />

      <Card className="border-2 border-purple-400 hover-scale">
        <CardHeader className="bg-gradient-to-r from-purple-400 to-pink-400">
          <CardTitle className="text-white drop-shadow-lg flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Mapa do Tesouro {phases.length > 0 && `(${phases.length} Fases)`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {loadingPhases ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Carregando fases...</p>
            </div>
          ) : (
            <div className="relative pl-6">
              <div className="absolute left-[34px] top-0 h-full w-1 border-l-2 border-dashed border-primary-child"></div>
              {treatmentSteps.map((step, index) => (
                <div
                  key={index}
                  className={cn(
                    "relative mb-8 flex items-center transition-all duration-300 hover-scale",
                    step.completed && "animate-fade-in",
                    step.active && "scale-105"
                  )}
                >
                  <div
                    className={cn(
                      "z-10 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-md",
                      step.completed && "bg-green-100 animate-bounce-slow",
                      step.active && "bg-blue-100 border-2 border-blue-500 animate-glow"
                    )}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    ) : step.active ? (
                      <Sparkles className="h-8 w-8 text-blue-500 animate-pulse" />
                    ) : (
                      <MapPin className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="ml-4">
                    <p
                      className={cn(
                        'text-lg font-semibold',
                        step.completed ? 'text-foreground' : step.active ? 'text-blue-600' : 'text-muted-foreground',
                      )}
                    >
                      {step.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{step.description}</p>
                    {step.completed && (
                      <p className="text-sm text-green-600 font-medium">✓ Completado</p>
                    )}
                    {step.active && (
                      <p className="text-sm text-blue-600 font-medium">→ Em Andamento</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default MyTreatment
