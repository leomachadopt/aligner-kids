/**
 * Mission Progress Service
 * Integra o sistema de rastreamento de uso com o sistema de missões
 */

import { db, patient_missions, mission_templates, aligner_wear_daily, patient_points, treatments } from '../db'
import { eq, and, sql } from 'drizzle-orm'

export class MissionProgressService {
  private static ymd(d: Date) {
    return d.toISOString().slice(0, 10)
  }

  /**
   * Compute trailing consecutive "OK days" ending at `date` (inclusive).
   * Missing days are treated as NOT OK (break streak).
   */
  private static async computeTrailingOkStreak(params: { patientId: string; startDate?: string | null; endDate: string }) {
    const { patientId, startDate, endDate } = params
    // We only need up to 40 days for current rules (30-day streak + buffer)
    const end = new Date(`${endDate}T00:00:00.000Z`)
    const daysToFetch = 40
    const start = new Date(end)
    start.setDate(start.getDate() - (daysToFetch - 1))
    const startStr = this.ymd(startDate ? new Date(`${startDate}T00:00:00.000Z`) : start)
    const fromStr = this.ymd(start)
    const lowerBound = startDate ? (startStr > fromStr ? startStr : fromStr) : fromStr

    const rows = await db
      .select()
      .from(aligner_wear_daily)
      .where(
        and(
          eq(aligner_wear_daily.patientId, patientId),
          sql`${aligner_wear_daily.date} >= ${lowerBound} AND ${aligner_wear_daily.date} <= ${endDate}`
        )
      )

    const map = new Map<string, boolean>()
    for (const r of rows as any[]) {
      map.set(String(r.date), !!r.isDayOk)
    }

    let streak = 0
    for (let i = 0; i < daysToFetch; i++) {
      const d = new Date(end)
      d.setDate(d.getDate() - i)
      const ds = this.ymd(d)
      if (startDate && ds < startStr) break
      const ok = map.get(ds) === true
      if (!ok) break
      streak++
    }

    return streak
  }

  /**
   * Atualiza o progresso das missões baseado no uso diário do alinhador
   */
  static async updateUsageMissions(patientId: string, alignerId: string, date: string) {
    try {
      // Buscar missões ativas do paciente (uso + marcos ligados ao uso)
      const activeMissions = await db
        .select()
        .from(patient_missions)
        .where(
          and(
            eq(patient_missions.patientId, patientId),
            sql`${patient_missions.status} IN ('available', 'in_progress')`
          )
        )

      if (activeMissions.length === 0) return

      // Buscar templates
      const templateIds = [...new Set(activeMissions.map(m => m.missionTemplateId))]
      const templates = await db
        .select()
        .from(mission_templates)
        .where(sql`${mission_templates.id} IN (${sql.join(templateIds.map(id => sql`${id}`), sql`, `)})`)

      const templatesMap = new Map(templates.map(t => [t.id, t]))

      // Buscar dados de uso
      const dailyRecord = await db
        .select()
        .from(aligner_wear_daily)
        .where(
          and(
            eq(aligner_wear_daily.alignerId, alignerId),
            eq(aligner_wear_daily.date, date)
          )
        )
        .limit(1)

      if (dailyRecord.length === 0) return

      const daily = dailyRecord[0]
      const isDayOk = !!(daily as any).isDayOk

      // Treatment start date (for milestone streaks)
      const treatmentRows = await db
        .select()
        .from(treatments)
        .where(and(eq(treatments.patientId, patientId), eq(treatments.overallStatus, 'active')))
        .limit(1)
      const treatmentStartDate = (treatmentRows[0] as any)?.startDate || null

      // Processar cada missão
      for (const mission of activeMissions) {
        const template = templatesMap.get(mission.missionTemplateId)
        if (!template) continue

        let shouldUpdate = false
        let newProgress = mission.progress || 0
        let newStatus = mission.status

        // Daily "check-in" style missions: treat isDayOk as completion.
        // (We keep completionCriteria === 'time_based' for backwards compatibility with existing templates.)
        if (template.frequency === 'daily' && template.completionCriteria === 'time_based') {
          if (isDayOk) {
            newProgress = template.targetValue || 1
            newStatus = 'completed'
            shouldUpdate = true
          }
        }

        // Any streak-based mission: set progress to trailing OK streak (idempotent).
        // This supports both usage and milestone templates (e.g. Primeira Semana, Primeiro Mês).
        if (template.completionCriteria === 'days_streak') {
          const target = template.targetValue || 1
          const streak = await this.computeTrailingOkStreak({
            patientId,
            startDate: template.frequency === 'once' ? treatmentStartDate : null,
            endDate: date,
          })
          newProgress = Math.min(streak, target)
          newStatus = streak >= target ? 'completed' : streak > 0 ? 'in_progress' : mission.status
          shouldUpdate = true
        }

        if (shouldUpdate) {
          const wasCompleted = mission.status === 'completed'
          const isNowCompleted = newStatus === 'completed'

          await db
            .update(patient_missions)
            .set({
              progress: newProgress,
              status: newStatus,
              completedAt: isNowCompleted && !wasCompleted ? new Date() : mission.completedAt,
              updatedAt: new Date(),
            } as any)
            .where(eq(patient_missions.id, mission.id))

          // Se completou agora, atribuir pontos
          if (isNowCompleted && !wasCompleted) {
            const points = template.basePoints + (template.bonusPoints || 0)
            await this.awardPoints(patientId, points, mission.id, template.name)
            console.log(`🎉 Missão completada automaticamente: ${template.name} (+${points} pontos)`)
          }
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar progresso de missões:', error)
    }
  }

  /**
   * Atualiza missões de progresso (ex.: percentage) baseado no tratamento ativo.
   */
  static async updateTreatmentProgressMissions(patientId: string) {
    try {
      const treatmentRows = await db
        .select()
        .from(treatments)
        .where(and(eq(treatments.patientId, patientId), eq(treatments.overallStatus, 'active')))
        .limit(1)
      const t = treatmentRows[0] as any
      if (!t) return
      const total = Number(t.totalAlignersOverall || t.totalAligners || 0)
      const current = Number(t.currentAlignerOverall || 0)
      if (!total || total <= 0) return
      const percent = (current / total) * 100

      const missions = await db
        .select()
        .from(patient_missions)
        .where(and(eq(patient_missions.patientId, patientId), sql`${patient_missions.status} IN ('available','in_progress')`))

      if (missions.length === 0) return
      const templateIds = [...new Set(missions.map(m => m.missionTemplateId))]
      const templates = await db
        .select()
        .from(mission_templates)
        .where(sql`${mission_templates.id} IN (${sql.join(templateIds.map(id => sql`${id}`), sql`, `)})`)
      const templatesMap = new Map(templates.map(tt => [tt.id, tt]))

      for (const m of missions as any[]) {
        const tmpl = templatesMap.get(m.missionTemplateId) as any
        if (!tmpl) continue
        if (tmpl.completionCriteria !== 'percentage') continue

        const target = Number(tmpl.targetValue || 100)
        const newProgress = Math.min(Math.round(percent), target)
        const isNowCompleted = percent >= target
        const newStatus = isNowCompleted ? 'completed' : m.status === 'available' ? 'in_progress' : m.status

        const wasCompleted = m.status === 'completed'
        await db
          .update(patient_missions)
          .set({
            progress: newProgress,
            status: newStatus,
            completedAt: isNowCompleted && !wasCompleted ? new Date() : m.completedAt,
            updatedAt: new Date(),
          } as any)
          .where(eq(patient_missions.id, m.id))

        if (isNowCompleted && !wasCompleted) {
          const points = Number(tmpl.basePoints || 0) + Number(tmpl.bonusPoints || 0)
          await this.awardPoints(patientId, points, m.id, tmpl.name)
        }
      }
    } catch (e) {
      console.error('Erro ao atualizar missões de progresso do tratamento:', e)
    }
  }

  /**
   * Atualiza missões de higiene
   */
  static async updateHygieneMission(patientId: string, missionTemplateId: string) {
    try {
      const activeMissions = await db
        .select()
        .from(patient_missions)
        .where(
          and(
            eq(patient_missions.patientId, patientId),
            eq(patient_missions.missionTemplateId, missionTemplateId),
            sql`${patient_missions.status} IN ('available', 'in_progress')`
          )
        )

      if (activeMissions.length === 0) return

      const mission = activeMissions[0]
      const template = await db
        .select()
        .from(mission_templates)
        .where(eq(mission_templates.id, missionTemplateId))
        .limit(1)

      if (template.length === 0) return

      const newProgress = (mission.progress || 0) + 1
      const isCompleted = newProgress >= (template[0].targetValue || 1)

      await db
        .update(patient_missions)
        .set({
          progress: newProgress,
          status: isCompleted ? 'completed' : 'in_progress',
          completedAt: isCompleted ? new Date() : mission.completedAt,
          updatedAt: new Date(),
        } as any)
        .where(eq(patient_missions.id, mission.id))

      if (isCompleted) {
        const points = template[0].basePoints + (template[0].bonusPoints || 0)
        await this.awardPoints(patientId, points, mission.id, template[0].name)
        console.log(`🎉 Missão de higiene completada: ${template[0].name} (+${points} pontos)`)
      }
    } catch (error) {
      console.error('Erro ao atualizar missão de higiene:', error)
    }
  }

  /**
   * Atribui pontos ao paciente
   */
  private static async awardPoints(patientId: string, points: number, missionId: string, missionName: string) {
    try {
      // Buscar pontos atuais
      const currentPoints = await db
        .select()
        .from(patient_points)
        .where(eq(patient_points.patientId, patientId))
        .limit(1)

      const xp = Math.floor(points / 2)

      if (currentPoints.length === 0) {
        // Criar novo registro
        const level = Math.floor(xp / 100) + 1
        await db.insert(patient_points).values({
          id: `points-${Date.now()}`,
          patientId,
          coins: points,
          xp,
          level,
          totalPoints: points,
          currentLevel: level,
          updatedAt: new Date(),
          lastActivityAt: new Date(),
        } as any)
      } else {
        // Atualizar existente
        const newCoins = (currentPoints[0].coins || 0) + points
        const newXp = (currentPoints[0].xp || 0) + xp
        const newLevel = Math.floor(newXp / 100) + 1

        await db
          .update(patient_points)
          .set({
            coins: newCoins,
            xp: newXp,
            level: newLevel,
            totalPoints: newCoins,
            currentLevel: newLevel,
            lastActivityAt: new Date(),
            updatedAt: new Date(),
          } as any)
          .where(eq(patient_points.patientId, patientId))
      }

      // Atualizar pontos ganhos na missão
      await db
        .update(patient_missions)
        .set({
          pointsEarned: points,
          updatedAt: new Date(),
        } as any)
        .where(eq(patient_missions.id, missionId))

      // Keep missionName referenced for TS + observability
      if (missionName) {
        // eslint-disable-next-line no-console
        console.log(`💰 Pontos atribuídos via missão: ${missionName} (+${points})`)
      }
    } catch (error) {
      console.error('Erro ao atribuir pontos:', error)
    }
  }

  /**
   * Ativa missões baseadas em triggers de alinhador
   */
  static async activateMissionsForAligner(patientId: string, alignerNumber: number) {
    try {
      // Buscar missões disponíveis com trigger para este alinhador
      const missions = await db
        .select()
        .from(patient_missions)
        .where(
          and(
            eq(patient_missions.patientId, patientId),
            eq(patient_missions.status, 'available'),
            eq(patient_missions.triggerAlignerNumber, alignerNumber)
          )
        )

      for (const mission of missions) {
        await db
          .update(patient_missions)
          .set({
            status: 'in_progress',
            startedAt: new Date(),
            updatedAt: new Date(),
          } as any)
          .where(eq(patient_missions.id, mission.id))

        console.log(`🎯 Missão ativada para alinhador #${alignerNumber}:`, mission.id)
      }
    } catch (error) {
      console.error('Erro ao ativar missões para alinhador:', error)
    }
  }

  /**
   * Verifica e expira missões que passaram do prazo
   */
  static async checkExpiredMissions(patientId: string) {
    try {
      const now = new Date()
      await db
        .update(patient_missions)
        .set({
          status: 'expired',
          updatedAt: now,
        } as any)
        .where(
          and(
            eq(patient_missions.patientId, patientId),
            sql`${patient_missions.status} IN ('available', 'in_progress')`,
            sql`${patient_missions.expiresAt} IS NOT NULL`,
            sql`${patient_missions.expiresAt} < ${now}`
          )
        )
    } catch (error) {
      console.error('Erro ao verificar missões expiradas:', error)
    }
  }
}
