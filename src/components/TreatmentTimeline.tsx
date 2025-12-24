import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Aligner } from '@/types/aligner'
import { CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import type { Locale } from 'date-fns'

interface TreatmentTimelineProps {
  aligners: Aligner[]
  currentAlignerNumber: number
}

export const TreatmentTimeline = ({
  aligners,
  currentAlignerNumber,
}: TreatmentTimelineProps) => {
  const { t, i18n } = useTranslation()
  const sortedAligners = [...aligners].sort((a, b) => a.number - b.number)

  const getDateLocale = (): Locale => {
    const localeMap: Record<string, Locale> = {
      'pt-BR': ptBR,
      'pt-PT': ptBR,
      'en-US': enUS,
      'es-ES': es,
    }
    return localeMap[i18n.language] || ptBR
  }

  const getDateFormat = (type: 'full' | 'short'): string => {
    const formats: Record<string, { full: string; short: string }> = {
      'pt-BR': { full: "dd 'de' MMMM 'de' yyyy", short: "dd 'de' MMMM" },
      'pt-PT': { full: "dd 'de' MMMM 'de' yyyy", short: "dd 'de' MMMM" },
      'en-US': { full: 'MMMM dd, yyyy', short: 'MMMM dd' },
      'es-ES': { full: "dd 'de' MMMM 'de' yyyy", short: "dd 'de' MMMM" },
    }
    return formats[i18n.language]?.[type] || formats['pt-BR'][type]
  }

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
        {t(`timeline.status.${aligner.status}`)}
      </Badge>
    )
  }

  if (sortedAligners.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('timeline.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {t('timeline.noAligners')}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('timeline.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
          <div className="space-y-8">
            {sortedAligners.map((aligner, index) => {
              const isCurrent = aligner.number === currentAlignerNumber
              const isPast = aligner.number < currentAlignerNumber
              const dateLocale = getDateLocale()

              return (
                <div
                  key={aligner.id}
                  className={cn(
                    'relative flex items-start gap-4 pl-12',
                    isCurrent && 'bg-primary/5 rounded-lg p-4 pl-12 -ml-4',
                  )}
                >
                  <div
                    className={cn(
                      'absolute left-[1.125rem] -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 bg-background z-10',
                      isCurrent && 'border-primary bg-primary/10 left-[0.625rem]',
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
                          {t('timeline.aligner', { number: aligner.number })}
                        </h3>
                        {aligner.startDate && (
                          <p className="text-sm text-muted-foreground">
                            {t('timeline.startDate')}:{' '}
                            {format(
                              new Date(aligner.startDate),
                              getDateFormat('full'),
                              { locale: dateLocale },
                            )}
                          </p>
                        )}
                        {aligner.actualEndDate && (
                          <p className="text-sm text-muted-foreground">
                            {t('timeline.endDate')}:{' '}
                            {format(
                              new Date(aligner.actualEndDate),
                              getDateFormat('full'),
                              { locale: dateLocale },
                            )}
                          </p>
                        )}
                      </div>
                      {getStatusBadge(aligner)}
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          {t('timeline.daysUsed')}:
                        </span>{' '}
                        <span className="font-medium">
                          {t('patient.gamification.streak.days', { count: aligner.usageDays })}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          {t('timeline.totalHours')}:
                        </span>{' '}
                        <span className="font-medium">
                          {aligner.usageHours.toFixed(1)}h
                        </span>
                      </div>
                      {aligner.expectedEndDate && (
                        <div>
                          <span className="text-muted-foreground">
                            {t('timeline.expectedChange')}:
                          </span>{' '}
                          <span className="font-medium">
                            {format(
                              new Date(aligner.expectedEndDate),
                              getDateFormat('short'),
                              { locale: dateLocale },
                            )}
                          </span>
                        </div>
                      )}
                      {aligner.notes && (
                        <div className="col-span-2">
                          <span className="text-muted-foreground">{t('timeline.notes')}:</span>{' '}
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

