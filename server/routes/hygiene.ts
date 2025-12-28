import { Router } from 'express'
import { and, eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { db, patient_hygiene_daily, mission_templates, patient_missions, patient_points, treatments } from '../db'

const router = Router()

function ymd(d: Date) {
  return d.toISOString().slice(0, 10)
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

let _ensuredHygieneDailyTable = false
async function ensureHygieneDailyTable() {
  if (_ensuredHygieneDailyTable) return
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS patient_hygiene_daily (
        id varchar(255) PRIMARY KEY,
        patient_id varchar(255) NOT NULL,
        date varchar(10) NOT NULL,
        floss_ok boolean DEFAULT false NOT NULL,
        aligner_clean_count integer DEFAULT 0 NOT NULL,
        source varchar(30) DEFAULT 'weekly_checkin' NOT NULL,
        reported_by_user_id varchar(255),
        created_at timestamp DEFAULT now() NOT NULL,
        updated_at timestamp DEFAULT now() NOT NULL
      );
    `)
    _ensuredHygieneDailyTable = true
  } catch (e) {
    // best-effort; if migrations are properly applied this should be a no-op
  }
}

async function awardPoints(params: { patientId: string; points: number; missionId: string }) {
  const { patientId, points, missionId } = params
  const xp = Math.floor(points / 2)

  const currentPoints = await db.select().from(patient_points).where(eq(patient_points.patientId, patientId)).limit(1)

  if (currentPoints.length === 0) {
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
    const prev = currentPoints[0] as any
    const newCoins = (prev.coins || 0) + points
    const newXp = (prev.xp || 0) + xp
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

  await db
    .update(patient_missions)
    .set({
      pointsEarned: points,
      updatedAt: new Date(),
    } as any)
    .where(eq(patient_missions.id, missionId))
}

async function selectCurrentMission(params: { patientId: string; templateId: string; currentAlignerOverall: number | null }) {
  const { patientId, templateId, currentAlignerOverall } = params

  // Prefer the mission tied to the current aligner (if any), otherwise pick the earliest available/in_progress.
  if (typeof currentAlignerOverall === 'number') {
    const rows = await db
      .select()
      .from(patient_missions)
      .where(
        and(
          eq(patient_missions.patientId, patientId),
          eq(patient_missions.missionTemplateId, templateId),
          sql`${patient_missions.status} IN ('available','in_progress')`,
          eq(patient_missions.triggerAlignerNumber, currentAlignerOverall),
        )
      )
      .limit(1)
    if (rows.length > 0) return rows[0] as any
  }

  const fallback = await db
    .select()
    .from(patient_missions)
    .where(
      and(
        eq(patient_missions.patientId, patientId),
        eq(patient_missions.missionTemplateId, templateId),
        sql`${patient_missions.status} IN ('available','in_progress')`,
      )
    )
    .orderBy(patient_missions.createdAt)
    .limit(1)
  return (fallback[0] as any) || null
}

async function computeWeekStats(params: { patientId: string; endDate: string }) {
  const { patientId, endDate } = params
  const end = new Date(`${endDate}T00:00:00.000Z`)
  const start = new Date(end)
  start.setDate(start.getDate() - 6)
  const startStr = ymd(start)

  const rows = await db
    .select()
    .from(patient_hygiene_daily)
    .where(
      and(
        eq(patient_hygiene_daily.patientId, patientId),
        sql`${patient_hygiene_daily.date} >= ${startStr} AND ${patient_hygiene_daily.date} <= ${endDate}`
      )
    )

  const byDate = new Map<string, any>()
  for (const r of rows as any[]) byDate.set(String(r.date), r)

  // Floss streak within the last 7 days ending at endDate
  let flossStreak = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    const ds = ymd(d)
    const ok = byDate.get(ds)?.flossOk === true
    if (!ok) break
    flossStreak++
  }

  // Aligner cleaning count (cap each day at 2) for the last 7 days
  let cleanCount = 0
  for (let i = 0; i < 7; i++) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    const ds = ymd(d)
    const c = Number(byDate.get(ds)?.alignerCleanCount || 0)
    cleanCount += clamp(c, 0, 2)
  }

  return { flossStreak, cleanCount }
}

/**
 * POST /api/hygiene/weekly-checkin
 * Body: { patientId, userId, days: [{date:'YYYY-MM-DD', flossOk:boolean, alignerCleanCount:number}] }
 * Tipicamente o pai envia os últimos 7 dias de uma vez (fim da semana).
 */
router.post('/weekly-checkin', async (req, res) => {
  try {
    await ensureHygieneDailyTable()
    const { patientId, userId, days } = req.body || {}
    if (!patientId || !userId) return res.status(400).json({ error: 'patientId e userId são obrigatórios' })
    if (!Array.isArray(days) || days.length === 0) return res.status(400).json({ error: 'days é obrigatório' })

    // Upsert each day
    for (const d of days) {
      const date = String(d?.date || '')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue
      const flossOk = !!d?.flossOk
      const alignerCleanCount = clamp(Number(d?.alignerCleanCount || 0), 0, 2)

      const existing = await db
        .select()
        .from(patient_hygiene_daily)
        .where(and(eq(patient_hygiene_daily.patientId, patientId), eq(patient_hygiene_daily.date, date)))
        .limit(1)

      const rowId = existing[0]?.id || nanoid()
      if (existing.length === 0) {
        await db.insert(patient_hygiene_daily).values({
          id: rowId,
          patientId,
          date,
          flossOk,
          alignerCleanCount,
          source: 'weekly_checkin',
          reportedByUserId: userId,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)
      } else {
        await db
          .update(patient_hygiene_daily)
          .set({
            flossOk,
            alignerCleanCount,
            source: 'weekly_checkin',
            reportedByUserId: userId,
            updatedAt: new Date(),
          } as any)
          .where(eq(patient_hygiene_daily.id, rowId))
      }
    }

    // Decide endDate as max provided date
    const endDate = days
      .map((d: any) => String(d?.date || ''))
      .filter((s: string) => /^\d{4}-\d{2}-\d{2}$/.test(s))
      .sort()
      .slice(-1)[0] || ymd(new Date())

    // current aligner (best-effort)
    const t = await db
      .select()
      .from(treatments)
      .where(and(eq(treatments.patientId, patientId), eq(treatments.overallStatus, 'active')))
      .limit(1)
    const currentAlignerOverall = (t[0] as any)?.currentAlignerOverall ?? null

    const templates = await db
      .select()
      .from(mission_templates)
      .where(
        sql`${mission_templates.name} IN ('Fio Dental Diário','Higiene Impecável')`
      )

    const templatesByName = new Map(templates.map((x: any) => [x.name, x]))
    const flossTemplate = templatesByName.get('Fio Dental Diário')
    const cleanTemplate = templatesByName.get('Higiene Impecável')

    const stats = await computeWeekStats({ patientId, endDate })

    const updates: any = { floss: null as any, clean: null as any }

    if (flossTemplate) {
      const mission = await selectCurrentMission({ patientId, templateId: flossTemplate.id, currentAlignerOverall })
      if (mission) {
        const target = Number(mission.targetValue || flossTemplate.targetValue || 7)
        const newProgress = Math.min(stats.flossStreak, target)
        const isNowCompleted = newProgress >= target
        const wasCompleted = mission.status === 'completed'
        const newStatus = isNowCompleted ? 'completed' : newProgress > 0 ? 'in_progress' : mission.status

        await db
          .update(patient_missions)
          .set({
            progress: newProgress,
            status: newStatus,
            completedAt: isNowCompleted && !wasCompleted ? new Date() : mission.completedAt,
            updatedAt: new Date(),
          } as any)
          .where(eq(patient_missions.id, mission.id))

        if (isNowCompleted && !wasCompleted) {
          const points = Number(flossTemplate.basePoints || 0) + Number(flossTemplate.bonusPoints || 0)
          await awardPoints({ patientId, points, missionId: mission.id })
        }

        updates.floss = { missionId: mission.id, progress: newProgress, target }
      }
    }

    if (cleanTemplate) {
      const mission = await selectCurrentMission({ patientId, templateId: cleanTemplate.id, currentAlignerOverall })
      if (mission) {
        const target = Number(mission.targetValue || cleanTemplate.targetValue || 14)
        const newProgress = Math.min(stats.cleanCount, target)
        const isNowCompleted = newProgress >= target
        const wasCompleted = mission.status === 'completed'
        const newStatus = isNowCompleted ? 'completed' : newProgress > 0 ? 'in_progress' : mission.status

        await db
          .update(patient_missions)
          .set({
            progress: newProgress,
            status: newStatus,
            completedAt: isNowCompleted && !wasCompleted ? new Date() : mission.completedAt,
            updatedAt: new Date(),
          } as any)
          .where(eq(patient_missions.id, mission.id))

        if (isNowCompleted && !wasCompleted) {
          const points = Number(cleanTemplate.basePoints || 0) + Number(cleanTemplate.bonusPoints || 0)
          await awardPoints({ patientId, points, missionId: mission.id })
        }

        updates.clean = { missionId: mission.id, progress: newProgress, target }
      }
    }

    res.json({ success: true, endDate, stats, updates })
  } catch (e: any) {
    console.error('Error weekly hygiene checkin:', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
})

export default router


