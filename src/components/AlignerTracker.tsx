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
import { ptBR, enUS, es } from 'date-fns/locale'
import { useTranslation } from 'react-i18next'

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
  const { status, loading, pause, resume } = useAlignerWear(user?.id, currentAligner as any)
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
  const dailyHours = (status?.daily?.wearMinutes || 0) / 60
  const adherence = calculateAdherence(currentAligner, dailyHours)
  const isOverdue = isAlignerOverdue(currentAligner)

  const weekly = status?.weekly || []
  const chartData = weekly.map((d) => ({
    name: format(new Date(d.date), 'EEE', { locale: dateLocale }),
    [t('patient.aligner.tracker.chartHours')]: ((d.wearMinutes || 0) / 60).toFixed(1),
    [t('patient.aligner.tracker.chartTarget')]: ((d.targetMinutes || 0) / 60).toFixed(1),
  }))

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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">{t('patient.aligner.tracker.usageToday')}</p>
              <p className="text-2xl font-bold">
                {dailyHours.toFixed(1)}h
              </p>
              <p className="text-xs text-muted-foreground">
                {t('patient.aligner.tracker.targetDaily', {
                  hours: currentAligner.wearTime,
                  percent: status?.daily?.targetPercent ?? 80
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t('patient.aligner.tracker.usageAccumulated')}</p>
              <p className="text-2xl font-bold">
                {t('patient.aligner.tracker.totalHours', { hours: (currentAligner.usageHours || 0).toFixed(1) })}
              </p>
              <p className="text-xs text-muted-foreground">
                {t('patient.aligner.tracker.daysUsed', { days: currentAligner.usageDays })}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">{t('patient.aligner.tracker.adherence')}</span>
              <span className="text-sm font-bold">{adherence.toFixed(0)}%</span>
            </div>
            <Progress value={adherence} className="h-2" />
          </div>

          <Button
            onClick={status?.state === 'wearing' ? pause : resume}
            className="w-full"
            variant={status?.state === 'wearing' ? 'destructive' : 'default'}
            disabled={loading}
          >
            {status?.state === 'wearing' ? (
              <>
                <Pause className="mr-2 h-4 w-4" />
                {t('patient.aligner.tracker.pauseUsage')}
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                {t('patient.aligner.tracker.resumeUsage')}
              </>
            )}
          </Button>
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            {t('patient.aligner.tracker.weeklyAdherence')}
          </CardTitle>
          <CardDescription>
            {t('patient.aligner.tracker.weeklyDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey={t('patient.aligner.tracker.chartHours')} fill="hsl(var(--primary))" />
              <Bar dataKey={t('patient.aligner.tracker.chartTarget')} fill="hsl(var(--muted))" opacity={0.3} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

