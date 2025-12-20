import { db, education_lessons, patient_lesson_progress, aligner_quests, aligners, patient_points, point_transactions } from '../db'
import { and, desc, eq, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'

function computeScorePercent(quiz: any[], answers: Record<string, number>): number {
  if (!Array.isArray(quiz) || quiz.length === 0) return 0
  let correct = 0
  for (const q of quiz) {
    const qid = String(q.id)
    const chosen = answers[qid]
    if (typeof chosen !== 'number') continue
    if (Number(chosen) === Number(q.correctIndex)) correct++
  }
  return Math.round((correct / quiz.length) * 100)
}

export class EducationService {
  static async listLessonsForPatient(params: { patientId: string; phaseId?: string | null }) {
    const { patientId, phaseId } = params

    const lessons = await db
      .select()
      .from(education_lessons)
      .where(and(eq(education_lessons.isActive, true), phaseId ? eq(education_lessons.phaseId, phaseId) : sql`true`))
      .orderBy(desc(education_lessons.createdAt))

    const progress = await db
      .select()
      .from(patient_lesson_progress)
      .where(eq(patient_lesson_progress.patientId, patientId))

    const progMap = new Map(progress.map((p: any) => [String(p.lessonId), p]))
    const safeLessons = lessons.map((l: any) => {
      const p = progMap.get(String(l.id)) || null
      // Don't send correctIndex to the client
      const quiz = Array.isArray(l.quiz)
        ? l.quiz.map((q: any) => ({
            id: q.id,
            prompt: q.prompt,
            options: q.options,
          }))
        : []
      return {
        ...l,
        quiz,
        progress: p
          ? {
              status: p.status,
              scorePercent: p.scorePercent,
              attempts: p.attempts,
              completedAt: p.completedAt,
            }
          : { status: 'not_started', attempts: 0 },
      }
    })

    return { lessons: safeLessons }
  }

  static async submitQuiz(params: {
    patientId: string
    userId: string
    lessonId: string
    answers: Record<string, number>
  }) {
    const { patientId, userId, lessonId } = params
    if (String(patientId) !== String(userId)) throw new Error('Sem permissão')

    const lessonRows = await db.select().from(education_lessons).where(eq(education_lessons.id, lessonId)).limit(1)
    if (lessonRows.length === 0) throw new Error('Lição não encontrada')
    const lesson: any = lessonRows[0]

    const quiz = Array.isArray(lesson.quiz) ? lesson.quiz : []
    const scorePercent = computeScorePercent(quiz, params.answers || {})
    const passed = scorePercent >= Number(lesson.passPercent || 70)

    const existing = await db
      .select()
      .from(patient_lesson_progress)
      .where(and(eq(patient_lesson_progress.patientId, patientId), eq(patient_lesson_progress.lessonId, lessonId)))
      .limit(1)

    const now = new Date()
    if (existing.length === 0) {
      await db.insert(patient_lesson_progress).values({
        id: `plp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        patientId,
        lessonId,
        status: passed ? 'completed' : 'in_progress',
        scorePercent,
        attempts: 1,
        lastAttemptAt: now,
        completedAt: passed ? now : null,
        createdAt: now,
        updatedAt: now,
      } as any)
    } else {
      await db
        .update(patient_lesson_progress)
        .set({
          status: passed ? 'completed' : 'in_progress',
          scorePercent,
          attempts: Number(existing[0].attempts || 0) + 1,
          lastAttemptAt: now,
          completedAt: passed ? now : existing[0].completedAt,
          updatedAt: now,
        } as any)
        .where(eq(patient_lesson_progress.id, existing[0].id))
    }

    let celebration: any = null
    if (passed && existing[0]?.status !== 'completed') {
      // award points
      const rewardCoins = Number(lesson.rewardCoins || 0)
      const rewardXp = Number(lesson.rewardXp || 0)

      const pointsRows = await db.select().from(patient_points).where(eq(patient_points.patientId, patientId)).limit(1)
      if (pointsRows.length === 0) {
        await db.insert(patient_points).values({
          id: `points-${Date.now()}`,
          patientId,
          coins: 0,
          xp: 0,
          level: 1,
          totalPoints: 0,
          currentLevel: 1,
          updatedAt: now,
          lastActivityAt: now,
        } as any)
      }

      const updated = await db
        .update(patient_points)
        .set({
          coins: sql`${patient_points.coins} + ${rewardCoins}`,
          xp: sql`${patient_points.xp} + ${rewardXp}`,
          level: sql`floor((${patient_points.xp} + ${rewardXp}) / 100) + 1`,
          totalPoints: sql`${patient_points.coins} + ${rewardCoins}`,
          currentLevel: sql`floor((${patient_points.xp} + ${rewardXp}) / 100) + 1`,
          lastActivityAt: now,
          updatedAt: now,
        } as any)
        .where(eq(patient_points.patientId, patientId))
        .returning()

      await db.insert(point_transactions).values({
        id: nanoid(),
        patientId,
        kind: 'earn',
        source: 'mission',
        amountCoins: rewardCoins,
        balanceAfterCoins: Number(updated[0]?.coins || 0),
        metadata: { lessonId, scorePercent, reason: 'education_lesson' },
        createdAt: now,
      } as any)

      // increment quest lessonsDone for active aligner
      const activeAligner = await db
        .select()
        .from(aligners)
        .where(and(eq(aligners.patientId, patientId), eq(aligners.status, 'active')))
        .limit(1)
      if (activeAligner.length > 0) {
        const q = await db
          .select()
          .from(aligner_quests)
          .where(eq(aligner_quests.alignerId, String(activeAligner[0].id)))
          .limit(1)
        if (q.length > 0) {
          await db
            .update(aligner_quests)
            .set({
              lessonsDone: Number(q[0].lessonsDone || 0) + 1,
              updatedAt: now,
            } as any)
            .where(eq(aligner_quests.id, q[0].id))
        }
      }

      celebration = {
        kind: 'education',
        title: 'Parabéns! Você completou a lição!',
        coins: rewardCoins,
        xp: rewardXp,
        scorePercent,
      }
    }

    return { passed, scorePercent, celebration }
  }
}


