/**
 * Mission Progress Service
 * Integra o sistema de rastreamento de uso com o sistema de missões
 */

import { db, patient_missions, mission_templates, aligner_wear_daily, patient_points } from '../db'
import { eq, and, sql } from 'drizzle-orm'

export class MissionProgressService {
  /**
   * Atualiza o progresso das missões baseado no uso diário do alinhador
   */
  static async updateUsageMissions(patientId: string, alignerId: string, date: string) {
    try {
      // Buscar missões ativas de uso do paciente
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
      const wearHours = Number(daily.wearMinutes || 0) / 60

      // Processar cada missão
      for (const mission of activeMissions) {
        const template = templatesMap.get(mission.missionTemplateId)
        if (!template || template.category !== 'usage') continue

        let shouldUpdate = false
        let newProgress = mission.progress || 0
        let newStatus = mission.status

        // Uso Diário Perfeito (22h por dia)
        if (template.frequency === 'daily' && template.completionCriteria === 'time_based') {
          if (wearHours >= (template.targetValue || 22)) {
            newProgress = template.targetValue || 22
            newStatus = 'completed'
            shouldUpdate = true
          }
        }

        // Semana Completa (7 dias consecutivos com 22h+)
        if (template.frequency === 'weekly' && template.completionCriteria === 'days_streak') {
          if (daily.isDayOk) {
            newProgress = (mission.progress || 0) + 1
            shouldUpdate = true

            if (newProgress >= (template.targetValue || 7)) {
              newStatus = 'completed'
            } else {
              newStatus = 'in_progress'
            }
          }
        }

        // Mês Campeão (30 dias com 20h+)
        if (template.frequency === 'monthly' && template.completionCriteria === 'days_streak') {
          if (wearHours >= 20) {
            newProgress = (mission.progress || 0) + 1
            shouldUpdate = true

            if (newProgress >= (template.targetValue || 30)) {
              newStatus = 'completed'
            } else {
              newStatus = 'in_progress'
            }
          }
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
