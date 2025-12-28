/**
 * Patient Missions Component
 * Exibe missões ativas do paciente com integração backend
 */

import * as React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  CheckCircle2,
  Circle,
  Camera,
  Clock,
  Star,
  Coins,
  Trophy,
  Sparkles,
  Target,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslation } from 'react-i18next'
import { HygieneService, type HygieneDayInput } from '@/services/hygieneService'

interface MissionTemplate {
  id: string
  name: string
  description: string
  category: string
  iconEmoji?: string
  color?: string
  basePoints: number
  bonusPoints?: number
  completionCriteria?: string
}

interface PatientMission {
  id: string
  patientId: string
  missionTemplateId: string
  status: string // 'available' | 'in_progress' | 'completed' | 'failed' | 'expired'
  progress: number
  targetValue: number | null
  triggerAlignerNumber?: number | null
  template?: MissionTemplate
}

const MISSION_ICONS: Record<string, any> = {
  usage: Clock,
  photo: Camera,
  photos: Camera,
  education: Star,
  checkin: Target,
  hygiene: Sparkles,
  milestones: Trophy,
  aligner_change: Target,
  appointments: Clock,
}

interface PatientMissionsProps {
  patientId: string
  variant?: 'full' | 'compact'
}

export function PatientMissions({ patientId, variant = 'full' }: PatientMissionsProps) {
  const { t } = useTranslation()
  const [missions, setMissions] = React.useState<PatientMission[]>([])
  const [templates, setTemplates] = React.useState<Record<string, MissionTemplate>>({})
  const [loading, setLoading] = React.useState(true)
  const [completingId, setCompletingId] = React.useState<string | null>(null)
  const [currentAligner, setCurrentAligner] = React.useState<number | null>(null)
  const [hygieneOpen, setHygieneOpen] = React.useState(false)
  const [hygieneSaving, setHygieneSaving] = React.useState(false)
  const [hygieneDays, setHygieneDays] = React.useState<HygieneDayInput[]>([])

  React.useEffect(() => {
    loadMissions()
  }, [patientId])

  const loadMissions = async () => {
    try {
      setLoading(true)

      // Buscar missões do paciente (agora inclui templates traduzidos)
      const missionsRes = await fetch(`/api/missions/patient/${patientId}`)
      const missionsData = await missionsRes.json()
      const ca =
        typeof missionsData.currentAlignerOverall === 'number'
          ? missionsData.currentAlignerOverall
          : null
      if (ca !== null) setCurrentAligner(ca)

      // Filtrar apenas missões ativas (não completadas/expiradas)
      const activeMissions = (missionsData.missions || []).filter(
        (m: any) => m.status === 'in_progress' || m.status === 'available'
      )

      // Para fotos: só exibir a missão do alinhador atual (evita aparecer missão futura)
      const filteredMissions = activeMissions.filter((m: any) => {
        const cat = m?.template?.category
        if (cat !== 'photos') return true
        if (typeof ca !== 'number') return true
        return m.triggerAlignerNumber === ca
      })

      // Remover duplicatas - manter apenas uma missão por template
      const uniqueMissions = filteredMissions.reduce((acc: any[], current: any) => {
        const existing = acc.find(m => m.missionTemplateId === current.missionTemplateId)
        if (!existing) {
          acc.push(current)
        }
        return acc
      }, [])

      // Criar mapa de templates para manter compatibilidade
      const templatesMap: Record<string, MissionTemplate> = {}
      uniqueMissions.forEach((m: any) => {
        if (m.template) {
          templatesMap[m.missionTemplateId] = m.template
        }
      })
      setTemplates(templatesMap)

      setMissions(uniqueMissions)
    } catch (error) {
      console.error('Erro ao carregar missões:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteMission = async (missionId: string) => {
    try {
      setCompletingId(missionId)

      const response = await fetch(`/api/missions/${missionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        // Recarregar missões
        await loadMissions()
        // Mostrar feedback visual
        alert('🎉 Missão completada!')
      } else {
        alert('Erro ao completar missão')
      }
    } catch (error) {
      console.error('Erro ao completar missão:', error)
      alert('Erro ao completar missão')
    } finally {
      setCompletingId(null)
    }
  }

  const openHygieneModal = () => {
    // Últimos 7 dias (inclui hoje)
    const days: HygieneDayInput[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const date = d.toISOString().slice(0, 10)
      days.push({ date, flossOk: false, alignerCleanCount: 0 })
    }
    setHygieneDays(days)
    setHygieneOpen(true)
  }

  const saveHygiene = async () => {
    try {
      setHygieneSaving(true)
      await HygieneService.submitWeeklyCheckin({
        patientId,
        userId: patientId,
        days: hygieneDays,
      })
      setHygieneOpen(false)
      await loadMissions()
      alert('✅ Higiene registrada!')
    } catch (e) {
      console.error('Erro ao registrar higiene:', e)
      alert('Erro ao registrar higiene')
    } finally {
      setHygieneSaving(false)
    }
  }

  const completedCount = missions.filter((m) => m.status === 'completed').length
  const totalMissions = missions.length

  if (loading) {
    return (
      <Card className={cn('border-2', variant === 'compact' ? '' : 'border-primary-child')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Star className="h-6 w-6 text-yellow-500" />
            {t('patient.missions.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">{t('patient.missions.loading')}</p>
        </CardContent>
      </Card>
    )
  }

  if (missions.length === 0) {
    return (
      <Card className={cn('border-2', variant === 'compact' ? '' : 'border-primary-child')}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-display">
            <Star className="h-6 w-6 text-yellow-500" />
            {t('patient.missions.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Trophy className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <p className="text-muted-foreground">
              {t('patient.missions.noMissions')}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('border-2', variant === 'compact' ? '' : 'border-primary-child')}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 font-display text-2xl">
            <Star className="h-6 w-6 text-yellow-500 animate-pulse" />
            {t('patient.missions.title')}
          </CardTitle>
          {variant === 'full' && (
            <div className="rounded-full bg-primary-child px-3 py-1">
              <span className="font-bold text-white">
                {completedCount}/{totalMissions}
              </span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Dialog open={hygieneOpen} onOpenChange={setHygieneOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('patient.missions.hygieneCheckin.title')}</DialogTitle>
              <DialogDescription>{t('patient.missions.hygieneCheckin.description')}</DialogDescription>
            </DialogHeader>

            <div className="space-y-2">
              {hygieneDays.map((d, idx) => (
                <div key={d.date} className="grid grid-cols-12 gap-2 items-center rounded-md border p-2">
                  <div className="col-span-4">
                    <div className="text-sm font-semibold">{d.date}</div>
                    <div className="text-xs text-muted-foreground">{t('patient.missions.hygieneCheckin.dayLabel')}</div>
                  </div>

                  <div className="col-span-4 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={d.flossOk}
                      onChange={(e) => {
                        const next = [...hygieneDays]
                        next[idx] = { ...next[idx], flossOk: e.target.checked }
                        setHygieneDays(next)
                      }}
                    />
                    <span className="text-sm">{t('patient.missions.hygieneCheckin.floss')}</span>
                  </div>

                  <div className="col-span-4 flex items-center gap-2 justify-end">
                    <span className="text-sm">{t('patient.missions.hygieneCheckin.clean')}</span>
                    <select
                      className="h-9 rounded-md border px-2"
                      value={d.alignerCleanCount}
                      onChange={(e) => {
                        const val = Number(e.target.value || 0)
                        const next = [...hygieneDays]
                        next[idx] = { ...next[idx], alignerCleanCount: val }
                        setHygieneDays(next)
                      }}
                    >
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                      <option value={2}>2</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setHygieneOpen(false)} disabled={hygieneSaving}>
                {t('patient.missions.hygieneCheckin.cancel')}
              </Button>
              <Button onClick={saveHygiene} disabled={hygieneSaving}>
                {hygieneSaving ? t('patient.missions.hygieneCheckin.saving') : t('patient.missions.hygieneCheckin.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {missions.slice(0, variant === 'compact' ? 3 : undefined).map((mission) => {
          const template = templates[mission.missionTemplateId]
          if (!template) return null

          const Icon = MISSION_ICONS[template.category] || Target
          const isCompleted = mission.status === 'completed'
          const progressPercent = mission.targetValue
            ? (mission.progress / mission.targetValue) * 100
            : 0
          const isPhoto = template.category === 'photos'
          const isHygiene = template.category === 'hygiene'

          return (
            <div
              key={mission.id}
              className={cn(
                'group rounded-lg border-2 p-4 transition-all duration-300',
                variant === 'full' && 'hover-scale',
                isCompleted
                  ? 'border-green-400 bg-green-50'
                  : 'border-gray-300 bg-white hover:border-primary-child'
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3 flex-1">
                  <div
                    className={cn(
                      'mt-1 rounded-full p-2',
                      isCompleted ? 'bg-green-400' : 'bg-primary-child/20'
                    )}
                  >
                    {template.iconEmoji ? (
                      <span className="text-xl">{template.iconEmoji}</span>
                    ) : (
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          isCompleted ? 'text-green-800' : 'text-primary-child'
                        )}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start gap-2">
                      <h4
                        className={cn(
                          'font-semibold',
                          isCompleted && 'line-through text-gray-500'
                        )}
                      >
                        {template.name}
                      </h4>
                      {mission.status === 'in_progress' && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">
                          {t('patient.missions.status.inProgress')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>

                    {/* Progresso */}
                    {mission.targetValue && mission.targetValue > 1 && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-muted-foreground">
                            {mission.progress} / {mission.targetValue}
                          </span>
                          <span className="font-semibold">
                            {progressPercent.toFixed(0)}%
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-400 to-blue-400 transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Recompensa */}
                    <div className="mt-2 flex items-center gap-1">
                      <Coins className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm font-bold text-yellow-700">
                        {t('patient.missions.list.earnPoints', { points: template.basePoints })}
                        {template.bonusPoints ? ` ${t('patient.missions.list.earnBonus', { bonus: template.bonusPoints })}` : ''}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ação */}
                <div>
                  {isCompleted ? (
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  ) : (
                    (isPhoto || isHygiene || template.completionCriteria === 'manual') ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (isPhoto) {
                            window.location.href = '/photos'
                            return
                          }
                          if (isHygiene) {
                            openHygieneModal()
                            return
                          }
                          handleCompleteMission(mission.id)
                        }}
                        disabled={completingId === mission.id}
                        className="hover-bounce whitespace-nowrap"
                      >
                        {completingId === mission.id ? (
                          <>
                            <Circle className="h-4 w-4 animate-spin mr-2" />
                            {isPhoto
                              ? t('patient.missions.list.goToPhotosButton')
                              : isHygiene
                                ? t('patient.missions.hygieneCheckin.button')
                                : t('patient.missions.list.completeButton')}
                          </>
                        ) : (
                          isPhoto
                            ? t('patient.missions.list.goToPhotosButton')
                            : isHygiene
                              ? t('patient.missions.hygieneCheckin.button')
                              : t('patient.missions.list.completeButton')
                        )}
                      </Button>
                    ) : null
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {variant === 'full' && completedCount === totalMissions && totalMissions > 0 && (
          <div className="mt-4 rounded-lg bg-gradient-to-r from-yellow-400 via-pink-400 to-purple-400 p-4 text-center animate-bounce-slow">
            <p className="font-display text-xl font-extrabold text-white drop-shadow-lg">
              {t('patient.missions.allCompleted')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
