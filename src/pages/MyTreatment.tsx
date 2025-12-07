import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, MapPin, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTreatment, useCurrentAligner, useAligners } from '@/context/AlignerContext'
import { calculateTreatmentProgress } from '@/utils/alignerCalculations'
import { TreatmentTimeline } from '@/components/TreatmentTimeline'

const MyTreatment = () => {
  const treatment = useTreatment()
  const currentAligner = useCurrentAligner()
  const { aligners } = useAligners()
  
  const currentAlignerNumber = currentAligner?.number || 0
  const totalAligners = treatment?.totalAligners || 24
  const progressPercentage = calculateTreatmentProgress(treatment)

  // Generate treatment steps based on milestones
  const milestones = [
    { name: 'Início da Aventura', alignerNumber: 1 },
    { name: `Alinhador #${Math.floor(totalAligners * 0.25)}`, alignerNumber: Math.floor(totalAligners * 0.25) },
    { name: `Alinhador #${Math.floor(totalAligners * 0.5)}`, alignerNumber: Math.floor(totalAligners * 0.5) },
    { name: `Alinhador #${Math.floor(totalAligners * 0.75)}`, alignerNumber: Math.floor(totalAligners * 0.75) },
    { name: 'Fim da Jornada!', alignerNumber: totalAligners },
  ]

  const treatmentSteps = milestones.map((milestone) => ({
    name: milestone.name,
    completed: currentAlignerNumber >= milestone.alignerNumber,
  }))

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
          <CardTitle className="text-white drop-shadow-lg">Mapa do Tesouro</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="relative pl-6">
            <div className="absolute left-[34px] top-0 h-full w-1 border-l-2 border-dashed border-primary-child"></div>
            {treatmentSteps.map((step, index) => (
              <div
                key={index}
                className={cn(
                  "relative mb-8 flex items-center transition-all duration-300 hover-scale",
                  step.completed && "animate-fade-in"
                )}
              >
                <div
                  className={cn(
                    "z-10 flex h-12 w-12 items-center justify-center rounded-full bg-background shadow-md",
                    step.completed && "bg-green-100 animate-bounce-slow"
                  )}
                >
                  {step.completed ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <div className="ml-4">
                  <p
                    className={cn(
                      'text-lg font-semibold',
                      step.completed ? 'text-foreground' : 'text-muted-foreground',
                    )}
                  >
                    {step.name}
                  </p>
                  {step.completed && (
                    <p className="text-sm text-green-600 font-medium">✓ Completado</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MyTreatment
