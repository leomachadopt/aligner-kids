import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useAlignerTimer } from '@/hooks/useAlignerTimer'
import { useCurrentAligner } from '@/context/AlignerContext'
import {
  calculateAdherence,
  calculateDaysUntilChange,
  isAlignerOverdue,
} from '@/utils/alignerCalculations'
import {
  Play,
  Pause,
  Clock,
  Calendar,
  TrendingUp,
  AlertCircle,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'

export const AlignerTracker = () => {
  const currentAligner = useCurrentAligner()
  const {
    dailyHours,
    accumulatedHours,
    isTracking,
    startTracking,
    stopTracking,
    weeklyUsage,
  } = useAlignerTimer(currentAligner)

  if (!currentAligner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rastreamento de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nenhum alinhador ativo no momento.
          </p>
        </CardContent>
      </Card>
    )
  }

  const daysUntilChange = calculateDaysUntilChange(currentAligner)
  const adherence = calculateAdherence(currentAligner, dailyHours)
  const isOverdue = isAlignerOverdue(currentAligner)

  const chartData = weeklyUsage.map((usage) => ({
    name: format(new Date(usage.date), 'EEE', { locale: ptBR }),
    horas: usage.hours.toFixed(1),
    meta: currentAligner.wearTime,
  }))

  const nextAligner = currentAligner.number + 1

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Alinhador #{currentAligner.number}
          </CardTitle>
          <CardDescription>
            Tempo de uso e aderência do alinhador atual
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Uso Hoje</p>
              <p className="text-2xl font-bold">
                {dailyHours.toFixed(1)}h
              </p>
              <p className="text-xs text-muted-foreground">
                Meta: {currentAligner.wearTime}h/dia
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Uso Acumulado</p>
              <p className="text-2xl font-bold">
                {accumulatedHours.toFixed(1)}h
              </p>
              <p className="text-xs text-muted-foreground">
                {currentAligner.usageDays} dias de uso
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Aderência</span>
              <span className="text-sm font-bold">{adherence.toFixed(0)}%</span>
            </div>
            <Progress value={adherence} className="h-2" />
          </div>

          <Button
            onClick={isTracking ? stopTracking : startTracking}
            className="w-full"
            variant={isTracking ? 'destructive' : 'default'}
          >
            {isTracking ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                Pausar Rastreamento
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Iniciar Rastreamento
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Próxima Troca
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isOverdue ? (
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-bold">Troca Atrasada!</p>
                <p className="text-sm">
                  Você está {Math.abs(daysUntilChange)} dias atrasado
                </p>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-3xl font-bold text-primary">
                {daysUntilChange} {daysUntilChange === 1 ? 'dia' : 'dias'}
              </p>
              <p className="text-sm text-muted-foreground">
                Para trocar para o Alinhador #{nextAligner}
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                Data esperada:{' '}
                {format(
                  new Date(currentAligner.expectedEndDate),
                  "dd 'de' MMMM",
                  { locale: ptBR },
                )}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Aderência Semanal
          </CardTitle>
          <CardDescription>
            Horas de uso nos últimos 7 dias
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="horas" fill="hsl(var(--primary))" />
              <Bar dataKey="meta" fill="hsl(var(--muted))" opacity={0.3} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

