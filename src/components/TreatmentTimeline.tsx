import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Aligner } from '@/types/aligner'
import { CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale/pt-BR'
import { cn } from '@/lib/utils'

interface TreatmentTimelineProps {
  aligners: Aligner[]
  currentAlignerNumber: number
}

export const TreatmentTimeline = ({
  aligners,
  currentAlignerNumber,
}: TreatmentTimelineProps) => {
  const sortedAligners = [...aligners].sort((a, b) => a.number - b.number)

  const getStatusIcon = (aligner: Aligner) => {
    if (aligner.status === 'completed') {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />
    }
    if (aligner.status === 'active') {
      return <Clock className="h-5 w-5 text-blue-500" />
    }
    if (aligner.status === 'delayed') {
      return <AlertCircle className="h-5 w-5 text-red-500" />
    }
    return <Circle className="h-5 w-5 text-muted-foreground" />
  }

  const getStatusBadge = (aligner: Aligner) => {
    const variants = {
      completed: 'default',
      active: 'default',
      delayed: 'destructive',
      pending: 'secondary',
    } as const

    return (
      <Badge variant={variants[aligner.status] || 'secondary'}>
        {aligner.status === 'completed' && 'Concluído'}
        {aligner.status === 'active' && 'Ativo'}
        {aligner.status === 'delayed' && 'Atrasado'}
        {aligner.status === 'pending' && 'Pendente'}
      </Badge>
    )
  }

  if (sortedAligners.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Linha do Tempo do Tratamento</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Nenhum alinhador cadastrado ainda.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Linha do Tempo do Tratamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-6">
            {sortedAligners.map((aligner, index) => {
              const isCurrent = aligner.number === currentAlignerNumber
              const isPast = aligner.number < currentAlignerNumber

              return (
                <div
                  key={aligner.id}
                  className={cn(
                    'relative flex items-start gap-4 pl-8',
                    isCurrent && 'bg-primary/5 rounded-lg p-4 -ml-4',
                  )}
                >
                  <div
                    className={cn(
                      'absolute left-4 top-6 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background',
                      isCurrent && 'border-primary bg-primary/10',
                      isPast && 'border-green-500 bg-green-50',
                      !isPast && !isCurrent && 'border-muted',
                    )}
                  >
                    {getStatusIcon(aligner)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">
                          Alinhador #{aligner.number}
                        </h3>
                        {aligner.startDate && (
                          <p className="text-sm text-muted-foreground">
                            Início:{' '}
                            {format(
                              new Date(aligner.startDate),
                              "dd 'de' MMMM 'de' yyyy",
                              { locale: ptBR },
                            )}
                          </p>
                        )}
                        {aligner.actualEndDate && (
                          <p className="text-sm text-muted-foreground">
                            Término:{' '}
                            {format(
                              new Date(aligner.actualEndDate),
                              "dd 'de' MMMM 'de' yyyy",
                              { locale: ptBR },
                            )}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(aligner)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Uso acumulado:
                        </span>{' '}
                        <span className="font-medium">
                          {aligner.usageDays} dias
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Horas totais:
                        </span>{' '}
                        <span className="font-medium">
                          {aligner.usageHours.toFixed(1)}h
                        </span>
                      </div>
                      {aligner.expectedEndDate && (
                        <div>
                          <span className="text-muted-foreground">
                            Troca esperada:
                          </span>{' '}
                          <span className="font-medium">
                            {format(
                              new Date(aligner.expectedEndDate),
                              "dd 'de' MMMM",
                              { locale: ptBR },
                            )}
                          </span>
                        </div>
                      )}
                      {aligner.notes && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">Notas:</span>{' '}
                          <span className="font-medium">{aligner.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

