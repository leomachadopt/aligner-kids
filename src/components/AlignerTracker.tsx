import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { useCurrentAligner } from '@/context/AlignerContext'
import { useAuth } from '@/context/AuthContext'
import { useAlignerWear } from '@/hooks/useAlignerWear'
import {
  calculateDaysUntilChange,
  isAlignerOverdue,
} from '@/utils/alignerCalculations'
import {
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR, enUS, es } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'

// Map i18n language codes to date-fns locales
const getDateLocale = (lang: string) => {
  const localeMap: Record<string, Locale> = {
    'pt-BR': ptBR,
    'pt-PT': ptBR,
    'en-US': enUS,
    'es-ES': es,
  }
  return localeMap[lang] || ptBR
}

export const AlignerTracker = ({
  showNextChange = true,
}: {
  showNextChange?: boolean
}) => {
  const currentAligner = useCurrentAligner()
  const { user } = useAuth()
  const { status, loading, checkin } = useAlignerWear(user?.id, currentAligner as any)
  const { t, i18n } = useTranslation()
  const dateLocale = getDateLocale(i18n.language)

  if (!currentAligner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('patient.aligner.tracker.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {t('patient.aligner.tracker.noAligner')}
          </p>
        </CardContent>
      </Card>
    )
  }

  const daysUntilChange = calculateDaysUntilChange(currentAligner)
  const isDayOk = !!status?.daily?.isDayOk
  const streakDays = Math.max(0, Number(status?.streakDays || 0))
  const isOverdue = isAlignerOverdue(currentAligner)

  const nextAligner = currentAligner.number + 1

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t('patient.aligner.tracker.alignerNumber', { number: currentAligner.number })}
          </CardTitle>
          <CardDescription>
            {t('patient.aligner.tracker.description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">
              {t('patient.aligner.tracker.dailyCheckinTitle')}
            </p>
            <div className="mt-2 flex items-center gap-2">
              {isDayOk ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span className="font-semibold text-green-700">{t('patient.aligner.tracker.checkedInYes')}</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-red-600" />
                  <span className="font-semibold text-red-700">{t('patient.aligner.tracker.checkedInNo')}</span>
                </>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button onClick={() => checkin(true)} disabled={loading} className="w-full">
                {t('patient.aligner.tracker.checkinYes')}
              </Button>
              <Button onClick={() => checkin(false)} disabled={loading} variant="outline" className="w-full">
                {t('patient.aligner.tracker.checkinNo')}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t('patient.aligner.tracker.dailyCheckinHint')}
            </p>

            <div className="mt-4 rounded-lg bg-muted/40 p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {t('patient.aligner.tracker.streakLabel')}
                </span>
                <span
                  className={cn(
                    'text-sm font-bold',
                    streakDays >= 7 ? 'text-green-700' : 'text-primary',
                  )}
                >
                  {t('patient.aligner.tracker.streakDays', { count: streakDays })}
                </span>
              </div>

              <div className="mt-2 space-y-2">
                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{t('patient.aligner.tracker.streakToWeek')}</span>
                    <span>{Math.min(streakDays, 7)}/7</span>
                  </div>
                  <Progress value={(Math.min(streakDays, 7) / 7) * 100} className="h-2" />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                    <span>{t('patient.aligner.tracker.streakToMonth')}</span>
                    <span>{Math.min(streakDays, 30)}/30</span>
                  </div>
                  <Progress value={(Math.min(streakDays, 30) / 30) * 100} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showNextChange && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              {t('patient.aligner.tracker.nextChange')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isOverdue ? (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-5 w-5" />
                <div>
                  <p className="font-bold">{t('patient.aligner.tracker.changeDelayed')}</p>
                  <p className="text-sm">
                    {t('patient.aligner.tracker.daysDelayed', { days: Math.abs(daysUntilChange) })}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-3xl font-bold text-primary">
                  {t('patient.aligner.tracker.daysUntilChange', { count: daysUntilChange })}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('patient.aligner.tracker.changeToAligner', { number: nextAligner })}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {t('patient.aligner.tracker.expectedDate', {
                    date: format(
                      new Date(currentAligner.expectedEndDate),
                      "dd 'de' MMMM",
                      { locale: dateLocale },
                    )
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

