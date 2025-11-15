import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { CheckCircle2, Circle, MapPin } from 'lucide-react'

const treatmentSteps = [
  { name: 'Início da Aventura', completed: true },
  { name: 'Alinhador #5', completed: true },
  { name: 'Alinhador #10', completed: true },
  { name: 'Metade do Caminho!', completed: false },
  { name: 'Alinhador #15', completed: false },
  { name: 'Alinhador #20', completed: false },
  { name: 'Fim da Jornada!', completed: false },
]

const MyTreatment = () => {
  const currentAligner = 5
  const totalAligners = 24
  const progressPercentage = (currentAligner / totalAligners) * 100

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col items-center text-center">
        <img
          src="https://img.usecurling.com/p/150/150?q=treasure%20map%20tooth"
          alt="Mascote Mapa"
          className="mb-4"
        />
        <h1 className="font-display text-4xl font-extrabold text-primary">
          Sua Jornada do Sorriso
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Acompanhe sua aventura para um sorriso incrível!
        </p>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Progresso Atual</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <span className="font-bold">Alinhador {currentAligner}</span>
            <Progress value={progressPercentage} className="h-4 flex-1" />
            <span className="font-bold">Alinhador {totalAligners}</span>
          </div>
          <p className="mt-2 text-center text-muted-foreground">
            Você já completou {progressPercentage.toFixed(0)}% da sua jornada!
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mapa do Tesouro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6">
            <div className="absolute left-[34px] top-0 h-full w-1 border-l-2 border-dashed border-primary-child"></div>
            {treatmentSteps.map((step, index) => (
              <div key={index} className="relative mb-8 flex items-center">
                <div className="z-10 flex h-12 w-12 items-center justify-center rounded-full bg-background">
                  {step.completed ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    <MapPin className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>
                <p
                  className={`ml-4 text-lg font-semibold ${
                    step.completed ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.name}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MyTreatment
