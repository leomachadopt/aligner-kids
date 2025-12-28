import { db, aligner_wear_sessions, aligner_wear_daily, aligners, treatment_phases, aligner_quests, patient_points, point_transactions, treatments } from '../db'
import { and, desc, eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { MissionProgressService } from './missionProgressService'

function ymd(d: Date) {
  return d.toISOString().slice(0, 10)
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

export type WearState = 'wearing' | 'paused'

export class AlignerWearService {
  static async getAlignerOrThrow(alignerId: string) {
    const rows = await db.select().from(aligners).where(eq(aligners.id, alignerId))
    if (rows.length === 0) throw new Error('Alinhador não encontrado')
    return rows[0] as any
  }

  static async getPhaseTargetPercent(phaseId?: string | null): Promise<number> {
    if (!phaseId) return 80
    const rows = await db.select().from(treatment_phases).where(eq(treatment_phases.id, String(phaseId))).limit(1)
    return Number(rows[0]?.adherenceTargetPercent ?? 80)
  }

  static async ensureQuestForAligner(alignerRow: any) {
    const existing = await db
      .select()
      .from(aligner_quests)
      .where(eq(aligner_quests.alignerId, String(alignerRow.id)))
      .limit(1)
    if (existing.length > 0) return existing[0]

    const targetPercent = await this.getPhaseTargetPercent(alignerRow.phaseId)
    const targetMinutesPerDay = Number(alignerRow.targetHoursPerDay || 22) * 60

    const created = await db
      .insert(aligner_quests)
      .values({
        id: `aq-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        patientId: alignerRow.patientId,
        alignerId: alignerRow.id,
        treatmentId: alignerRow.treatmentId || null,
        phaseId: alignerRow.phaseId || null,
        status: 'active',
        targetPercent,
        targetMinutesPerDay,
        photoSetDone: false,
        lessonsTarget: 1,
        lessonsDone: 0,
        rewardCoins: 200,
        rewardXp: 120,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning()
    return created[0]
  }

  static async ensureInitialWearingSession(alignerRow: any, createdByUserId: string) {
    const open = await db
      .select()
      .from(aligner_wear_sessions)
      .where(and(eq(aligner_wear_sessions.alignerId, String(alignerRow.id)), sql`${aligner_wear_sessions.endedAt} is null`))
      .orderBy(desc(aligner_wear_sessions.startedAt))
      .limit(1)
    if (open.length > 0) return open[0]

    const created = await db
      .insert(aligner_wear_sessions)
      .values({
        id: `aws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        patientId: alignerRow.patientId,
        alignerId: alignerRow.id,
        treatmentId: alignerRow.treatmentId || null,
        phaseId: alignerRow.phaseId || null,
        state: 'wearing',
        startedAt: new Date(),
        endedAt: null,
        createdByUserId,
        createdAt: new Date(),
      } as any)
      .returning()
    return created[0]
  }

  static async computeWearMinutesForDay(params: { alignerId: string; date: string }): Promise<number> {
    const { alignerId, date } = params
    const start = new Date(`${date}T00:00:00.000Z`)
    const end = new Date(`${date}T23:59:59.999Z`)

    const sessions = await db
      .select()
      .from(aligner_wear_sessions)
      .where(eq(aligner_wear_sessions.alignerId, alignerId))
      .orderBy(desc(aligner_wear_sessions.startedAt))

    let wearMs = 0
    const now = new Date()

    for (const s of sessions as any[]) {
      if (String(s.state) !== 'wearing') continue
      const sStart = new Date(s.startedAt)
      const sEnd = s.endedAt ? new Date(s.endedAt) : now
      const overlapStart = sStart > start ? sStart : start
      const overlapEnd = sEnd < end ? sEnd : end
      if (overlapEnd > overlapStart) {
        wearMs += overlapEnd.getTime() - overlapStart.getTime()
      }
    }

    const wearMinutes = Math.floor(wearMs / (1000 * 60))
    return clamp(wearMinutes, 0, 24 * 60)
  }

  static async upsertDaily(params: { alignerRow: any; date: string }) {
    const { alignerRow, date } = params
    const targetMinutes = Number(alignerRow.targetHoursPerDay || 22) * 60
    const targetPercent = await this.getPhaseTargetPercent(alignerRow.phaseId)
    const existing = await db
      .select()
      .from(aligner_wear_daily)
      .where(and(eq(aligner_wear_daily.alignerId, String(alignerRow.id)), eq(aligner_wear_daily.date, date)))
      .limit(1)

    // If parent already submitted a check-in for the day, do NOT overwrite it with session-derived minutes.
    if (existing.length > 0 && String((existing[0] as any).source || '') === 'parent_checkin') {
      const daily = existing[0] as any
      return { daily, wasOk: !!daily.isDayOk, isOk: !!daily.isDayOk }
    }

    const wearMinutes = await this.computeWearMinutesForDay({ alignerId: String(alignerRow.id), date })
    const minOk = Math.floor(targetMinutes * (targetPercent / 100))
    const isDayOk = wearMinutes >= minOk

    const rowId = existing[0]?.id || `awd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    if (existing.length === 0) {
      const inserted = await db
        .insert(aligner_wear_daily)
        .values({
          id: rowId,
          patientId: alignerRow.patientId,
          alignerId: alignerRow.id,
          date,
          wearMinutes,
          targetMinutes,
          targetPercent,
          isDayOk,
          source: 'session',
          updatedAt: new Date(),
        } as any)
        .returning()

      // 🎯 Atualizar progresso das missões
      await MissionProgressService.updateUsageMissions(alignerRow.patientId, alignerRow.id, date)

      return { daily: inserted[0], wasOk: false, isOk: isDayOk }
    }

    const wasOk = !!existing[0].isDayOk
    const updated = await db
      .update(aligner_wear_daily)
      .set({
        wearMinutes,
        targetMinutes,
        targetPercent,
        isDayOk,
        source: 'session',
        updatedAt: new Date(),
      } as any)
      .where(eq(aligner_wear_daily.id, rowId))
      .returning()

    // 🎯 Atualizar progresso das missões
    await MissionProgressService.updateUsageMissions(alignerRow.patientId, alignerRow.id, date)

    return { daily: updated[0], wasOk, isOk: isDayOk }
  }

  static async getStatus(patientId: string, alignerId: string) {
    const alignerRow = await this.getAlignerOrThrow(alignerId)
    if (String(alignerRow.patientId) !== String(patientId)) throw new Error('Sem permissão')

    await this.ensureQuestForAligner(alignerRow)

    const open = await db
      .select()
      .from(aligner_wear_sessions)
      .where(and(eq(aligner_wear_sessions.alignerId, alignerId), sql`${aligner_wear_sessions.endedAt} is null`))
      .orderBy(desc(aligner_wear_sessions.startedAt))
      .limit(1)
    const state: WearState = (open[0]?.state as any) || 'wearing'

    const date = ymd(new Date())
    const { daily, wasOk, isOk } = await this.upsertDaily({ alignerRow, date })

    // Award when day becomes OK even without explicit pause/resume (polling / status refresh)
    const celebration = !wasOk && isOk ? { kind: 'daily_goal', title: 'Meta do dia batida!', coins: 10, xp: 5 } : null
    if (celebration) {
      await this.awardDailyGoal(patientId, celebration.coins, celebration.xp, { alignerId, date })
    }

    const weekly = await this.getWeeklyDaily(patientId, String(alignerId))

    const treatmentRows = await db
      .select()
      .from(treatments)
      .where(and(eq(treatments.patientId, patientId), eq(treatments.overallStatus, 'active')))
      .limit(1)
    const treatmentStartDate = (treatmentRows[0] as any)?.startDate || null
    const streakDays = await this.getTrailingOkStreakDays({ patientId, endDate: date, startDate: treatmentStartDate })

    return { patientId, alignerId, state, daily, weekly, streakDays, celebration }
  }

  /**
   * Parent daily check-in (simple yes/no). This is the preferred mechanism going forward.
   */
  static async checkin(params: { patientId: string; alignerId: string; userId: string; date?: string; woreAligner: boolean }) {
    const { patientId, alignerId, userId, woreAligner } = params
    const alignerRow = await this.getAlignerOrThrow(alignerId)
    if (String(alignerRow.patientId) !== String(patientId)) throw new Error('Sem permissão')

    const date = params.date || ymd(new Date())
    const targetMinutes = Number(alignerRow.targetHoursPerDay || 22) * 60
    const targetPercent = await this.getPhaseTargetPercent(alignerRow.phaseId)
    const minOk = Math.floor(targetMinutes * (targetPercent / 100))

    // For compatibility, store "minutes" as either 0 or minOk (so legacy UI can still show something).
    const wearMinutes = woreAligner ? minOk : 0
    const isDayOk = !!woreAligner

    const existing = await db
      .select()
      .from(aligner_wear_daily)
      .where(and(eq(aligner_wear_daily.alignerId, String(alignerId)), eq(aligner_wear_daily.date, date)))
      .limit(1)
    const rowId = existing[0]?.id || `awd-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

    const wasOk = !!existing[0]?.isDayOk
    let daily: any
    if (existing.length === 0) {
      const inserted = await db
        .insert(aligner_wear_daily)
        .values({
          id: rowId,
          patientId,
          alignerId,
          date,
          wearMinutes,
          targetMinutes,
          targetPercent,
          isDayOk,
          source: 'parent_checkin',
          reportedByUserId: userId,
          updatedAt: new Date(),
        } as any)
        .returning()
      daily = inserted[0]
    } else {
      const updated = await db
        .update(aligner_wear_daily)
        .set({
          wearMinutes,
          targetMinutes,
          targetPercent,
          isDayOk,
          source: 'parent_checkin',
          reportedByUserId: userId,
          updatedAt: new Date(),
        } as any)
        .where(eq(aligner_wear_daily.id, rowId))
        .returning()
      daily = updated[0]
    }

    // Update missions idempotently
    await MissionProgressService.updateUsageMissions(patientId, String(alignerId), date)

    // Return status snapshot (do not trigger celebration here; keep it in getStatus)
    const weekly = await this.getWeeklyDaily(patientId, String(alignerId))
    const treatmentRows = await db
      .select()
      .from(treatments)
      .where(and(eq(treatments.patientId, patientId), eq(treatments.overallStatus, 'active')))
      .limit(1)
    const treatmentStartDate = (treatmentRows[0] as any)?.startDate || null
    const streakDays = await this.getTrailingOkStreakDays({ patientId, endDate: date, startDate: treatmentStartDate })
    return { patientId, alignerId, state: 'wearing' as WearState, daily, weekly, streakDays, celebration: (!wasOk && isDayOk) ? { kind: 'daily_goal', title: 'Meta do dia batida!', coins: 10, xp: 5 } : null }
  }

  static async getWeeklyDaily(patientId: string, alignerId: string) {
    const today = new Date()
    const dates: string[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      dates.push(ymd(d))
    }

    const rows = await db
      .select()
      .from(aligner_wear_daily)
      .where(and(eq(aligner_wear_daily.patientId, patientId), eq(aligner_wear_daily.alignerId, alignerId)))

    const byDate = new Map<string, any>()
    for (const r of rows as any[]) {
      byDate.set(String(r.date), r)
    }

    return dates.map((date) => {
      const r = byDate.get(date)
      return (
        r || {
          id: `virtual-${alignerId}-${date}`,
          patientId,
          alignerId,
          date,
          wearMinutes: 0,
          targetMinutes: 0,
          targetPercent: 80,
          isDayOk: false,
          updatedAt: new Date(),
        }
      )
    })
  }

  static async getTrailingOkStreakDays(params: { patientId: string; endDate: string; startDate?: string | null }) {
    const { patientId, endDate } = params
    const limitDays = 40
    const end = new Date(`${endDate}T00:00:00.000Z`)
    const start = new Date(end)
    start.setDate(start.getDate() - (limitDays - 1))
    const fromStr = ymd(start)
    const startStr = params.startDate ? ymd(new Date(`${params.startDate}T00:00:00.000Z`)) : null
    const lowerBound = startStr && startStr > fromStr ? startStr : fromStr

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
    for (let i = 0; i < limitDays; i++) {
      const d = new Date(end)
      d.setDate(d.getDate() - i)
      const ds = ymd(d)
      if (startStr && ds < startStr) break
      if (map.get(ds) !== true) break
      streak++
    }

    return streak
  }

  static async pause(params: { patientId: string; alignerId: string; userId: string }) {
    const { patientId, alignerId, userId } = params
    const alignerRow = await this.getAlignerOrThrow(alignerId)
    if (String(alignerRow.patientId) !== String(patientId)) throw new Error('Sem permissão')

    const open = await db
      .select()
      .from(aligner_wear_sessions)
      .where(and(eq(aligner_wear_sessions.alignerId, alignerId), sql`${aligner_wear_sessions.endedAt} is null`))
      .orderBy(desc(aligner_wear_sessions.startedAt))
      .limit(1)
    const now = new Date()
    if (open.length > 0 && String(open[0].state) === 'paused') {
      const status = await this.getStatus(patientId, alignerId)
      return { ...status, celebration: null }
    }

    if (open.length > 0) {
      await db
        .update(aligner_wear_sessions)
        .set({ endedAt: now } as any)
        .where(eq(aligner_wear_sessions.id, open[0].id))
    }

    await db.insert(aligner_wear_sessions).values({
      id: `aws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      patientId,
      alignerId,
      treatmentId: alignerRow.treatmentId || null,
      phaseId: alignerRow.phaseId || null,
      state: 'paused',
      startedAt: now,
      endedAt: null,
      createdByUserId: userId,
      createdAt: now,
    } as any)

    const date = ymd(now)
    const { daily } = await this.upsertDaily({ alignerRow, date })

    return { patientId, alignerId, state: 'paused' as WearState, daily, celebration: null }
  }

  static async resume(params: { patientId: string; alignerId: string; userId: string }) {
    const { patientId, alignerId, userId } = params
    const alignerRow = await this.getAlignerOrThrow(alignerId)
    if (String(alignerRow.patientId) !== String(patientId)) throw new Error('Sem permissão')

    const open = await db
      .select()
      .from(aligner_wear_sessions)
      .where(and(eq(aligner_wear_sessions.alignerId, alignerId), sql`${aligner_wear_sessions.endedAt} is null`))
      .orderBy(desc(aligner_wear_sessions.startedAt))
      .limit(1)

    const now = new Date()
    if (open.length > 0 && String(open[0].state) === 'wearing') {
      const status = await this.getStatus(patientId, alignerId)
      return { ...status, celebration: null }
    }

    if (open.length > 0) {
      await db
        .update(aligner_wear_sessions)
        .set({ endedAt: now } as any)
        .where(eq(aligner_wear_sessions.id, open[0].id))
    }

    await db.insert(aligner_wear_sessions).values({
      id: `aws-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      patientId,
      alignerId,
      treatmentId: alignerRow.treatmentId || null,
      phaseId: alignerRow.phaseId || null,
      state: 'wearing',
      startedAt: now,
      endedAt: null,
      createdByUserId: userId,
      createdAt: now,
    } as any)

    const date = ymd(now)
    const { daily, wasOk, isOk } = await this.upsertDaily({ alignerRow, date })

    // Celebration if day just became OK (rare on resume but possible due to open session carry)
    const celebration = !wasOk && isOk ? { kind: 'daily_goal', title: 'Meta do dia batida!', coins: 10, xp: 5 } : null
    if (celebration) {
      await this.awardDailyGoal(patientId, celebration.coins, celebration.xp, { alignerId, date })
    }

    return { patientId, alignerId, state: 'wearing' as WearState, daily, celebration }
  }

  static async awardDailyGoal(patientId: string, coins: number, xp: number, meta: any) {
    // ensure patient_points row
    const rows = await db.select().from(patient_points).where(eq(patient_points.patientId, patientId)).limit(1)
    if (rows.length === 0) {
      await db.insert(patient_points).values({
        id: `points-${Date.now()}`,
        patientId,
        coins: 0,
        xp: 0,
        level: 1,
        totalPoints: 0,
        currentLevel: 1,
        updatedAt: new Date(),
        lastActivityAt: new Date(),
      } as any)
    }

    const updated = await db
      .update(patient_points)
      .set({
        coins: sql`${patient_points.coins} + ${coins}`,
        xp: sql`${patient_points.xp} + ${xp}`,
        level: sql`floor((${patient_points.xp} + ${xp}) / 100) + 1`,
        totalPoints: sql`${patient_points.coins} + ${coins}`,
        currentLevel: sql`floor((${patient_points.xp} + ${xp}) / 100) + 1`,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(patient_points.patientId, patientId))
      .returning()

    await db.insert(point_transactions).values({
      id: nanoid(),
      patientId,
      kind: 'earn',
      source: 'streak',
      amountCoins: coins,
      balanceAfterCoins: Number(updated[0]?.coins || 0),
      metadata: { ...meta, reason: 'daily_goal' },
      createdAt: new Date(),
    } as any)
  }

  static async markPhotoSetDone(params: { patientId: string; alignerId: string }) {
    const { patientId, alignerId } = params
    const alignerRow = await this.getAlignerOrThrow(alignerId)
    if (String(alignerRow.patientId) !== String(patientId)) throw new Error('Sem permissão')

    const quest = await this.ensureQuestForAligner(alignerRow)
    if (quest.photoSetDone) return quest

    const updated = await db
      .update(aligner_quests)
      .set({ photoSetDone: true, updatedAt: new Date() } as any)
      .where(eq(aligner_quests.id, String(quest.id)))
      .returning()

    return updated[0]
  }

  static async incrementLessonsDone(params: { patientId: string; alignerId: string }) {
    const { patientId, alignerId } = params
    const alignerRow = await this.getAlignerOrThrow(alignerId)
    if (String(alignerRow.patientId) !== String(patientId)) throw new Error('Sem permissão')

    const quest = await this.ensureQuestForAligner(alignerRow)
    const updated = await db
      .update(aligner_quests)
      .set({
        lessonsDone: sql`${aligner_quests.lessonsDone} + 1`,
        updatedAt: new Date(),
      } as any)
      .where(eq(aligner_quests.id, String(quest.id)))
      .returning()

    return updated[0]
  }

  static async getQuestStatus(params: { patientId: string; alignerId: string }) {
    const { patientId, alignerId } = params
    const alignerRow = await this.getAlignerOrThrow(alignerId)
    if (String(alignerRow.patientId) !== String(patientId)) throw new Error('Sem permissão')

    await this.ensureQuestForAligner(alignerRow)
    const date = ymd(new Date())
    await this.upsertDaily({ alignerRow, date })

    const questRows = await db.select().from(aligner_quests).where(eq(aligner_quests.alignerId, String(alignerId))).limit(1)
    const quest = questRows[0] as any

    const days = await db.select().from(aligner_wear_daily).where(eq(aligner_wear_daily.alignerId, String(alignerId)))
    const sumWear = days.reduce((acc: number, d: any) => acc + Number(d.wearMinutes || 0), 0)
    const sumTarget = days.reduce((acc: number, d: any) => acc + Number(d.targetMinutes || 0), 0)
    const adherencePercentToDate = sumTarget > 0 ? Math.round((sumWear / sumTarget) * 100) : 0

    return { quest, adherencePercentToDate }
  }

  static async finalizeQuestForAligner(alignerId: string) {
    const alignerRow = await this.getAlignerOrThrow(alignerId)
    const quest = await this.ensureQuestForAligner(alignerRow)

    // Close any open session to have stable totals
    const open = await db
      .select()
      .from(aligner_wear_sessions)
      .where(and(eq(aligner_wear_sessions.alignerId, String(alignerId)), sql`${aligner_wear_sessions.endedAt} is null`))
      .orderBy(desc(aligner_wear_sessions.startedAt))
      .limit(1)
    if (open.length > 0) {
      await db.update(aligner_wear_sessions).set({ endedAt: new Date() } as any).where(eq(aligner_wear_sessions.id, open[0].id))
    }

    const days = await db
      .select()
      .from(aligner_wear_daily)
      .where(eq(aligner_wear_daily.alignerId, String(alignerId)))

    const sumWear = days.reduce((acc: number, d: any) => acc + Number(d.wearMinutes || 0), 0)
    const sumTarget = days.reduce((acc: number, d: any) => acc + Number(d.targetMinutes || 0), 0)
    const adherence = sumTarget > 0 ? Math.round((sumWear / sumTarget) * 100) : 0

    const ok = adherence >= Number(quest.targetPercent || 80) &&
      !!quest.photoSetDone &&
      Number(quest.lessonsDone || 0) >= Number(quest.lessonsTarget || 1)

    const updatedQuest = await db
      .update(aligner_quests)
      .set({
        adherencePercentFinal: adherence,
        status: ok ? 'completed' : 'failed',
        completedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(aligner_quests.id, String(quest.id)))
      .returning()

    if (ok) {
      await this.awardDailyGoal(alignerRow.patientId, Number(quest.rewardCoins || 0), Number(quest.rewardXp || 0), {
        reason: 'aligner_quest_completed',
        alignerId,
      })
    }

    return { quest: updatedQuest[0], adherencePercent: adherence, ok }
  }
}


