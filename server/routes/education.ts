import { Router } from 'express'
import { db, education_lessons, patient_lesson_progress, aligners } from '../db'
import { and, eq, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { AlignerWearService } from '../services/alignerWearService'

const router = Router()

// GET /api/education/lessons?patientId=...
router.get('/education/lessons', async (req, res) => {
  try {
    const patientId = String(req.query.patientId || '')
    if (!patientId) return res.status(400).json({ error: 'patientId é obrigatório' })

    const activeAligner = await db
      .select()
      .from(aligners)
      .where(and(eq(aligners.patientId, patientId), eq(aligners.status, 'active')))
      .orderBy(desc(aligners.alignerNumber))
      .limit(1)

    const phaseId = activeAligner[0]?.phaseId || null

    const lessons = await db
      .select()
      .from(education_lessons)
      .where(eq(education_lessons.isActive, true))
      .orderBy(desc(education_lessons.createdAt))

    const filtered = (lessons as any[]).filter((l) => !l.phaseId || String(l.phaseId) === String(phaseId))
    const ids = filtered.map((l) => String(l.id))

    const progress = ids.length
      ? await db
          .select()
          .from(patient_lesson_progress)
          .where(and(eq(patient_lesson_progress.patientId, patientId)))
      : []
    const progMap = new Map<string, any>()
    for (const p of progress as any[]) {
      progMap.set(String(p.lessonId), p)
    }

    const items = filtered.map((l: any) => ({
      ...l,
      progress: progMap.get(String(l.id)) || null,
    }))

    res.json({ lessons: items, activeAligner: activeAligner[0] || null })
  } catch (e: any) {
    console.error('Error listing education lessons:', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
})

// POST /api/education/lessons/:lessonId/submit
router.post('/education/lessons/:lessonId/submit', async (req, res) => {
  try {
    const lessonId = String(req.params.lessonId)
    const { patientId, userId, answers } = req.body || {}
    if (!patientId || !userId) return res.status(400).json({ error: 'patientId e userId são obrigatórios' })
    if (!Array.isArray(answers)) return res.status(400).json({ error: 'answers deve ser um array' })
    if (String(patientId) !== String(userId)) return res.status(403).json({ error: 'Sem permissão' })

    const rows = await db.select().from(education_lessons).where(eq(education_lessons.id, lessonId)).limit(1)
    if (rows.length === 0) return res.status(404).json({ error: 'Lição não encontrada' })
    const lesson: any = rows[0]
    if (!lesson.isActive) return res.status(400).json({ error: 'Lição inativa' })

    const quiz = Array.isArray(lesson.quiz) ? lesson.quiz : []
    const total = quiz.length
    if (total === 0) return res.status(400).json({ error: 'Lição sem quiz configurado' })

    let correct = 0
    for (let i = 0; i < total; i++) {
      const q = quiz[i]
      const correctIndex = Number(q?.correctIndex)
      if (Number(answers[i]) === correctIndex) correct++
    }
    const scorePercent = total > 0 ? Math.round((correct / total) * 100) : 0
    const passPercent = Number(lesson.passPercent || 70)
    const passed = scorePercent >= passPercent

    const existing = await db
      .select()
      .from(patient_lesson_progress)
      .where(and(eq(patient_lesson_progress.patientId, patientId), eq(patient_lesson_progress.lessonId, lessonId)))
      .limit(1)

    const now = new Date()
    const prev = existing[0] as any
    const attempts = Number(prev?.attempts || 0) + 1
    const wasCompleted = prev?.status === 'completed'

    let progressRow: any
    if (existing.length === 0) {
      const inserted = await db
        .insert(patient_lesson_progress)
        .values({
          id: nanoid(),
          patientId,
          lessonId,
          status: passed ? 'completed' : 'in_progress',
          scorePercent,
          attempts,
          lastAttemptAt: now,
          completedAt: passed ? now : null,
          createdAt: now,
          updatedAt: now,
        } as any)
        .returning()
      progressRow = inserted[0]
    } else {
      const updated = await db
        .update(patient_lesson_progress)
        .set({
          status: passed ? 'completed' : prev.status === 'completed' ? 'completed' : 'in_progress',
          scorePercent,
          attempts,
          lastAttemptAt: now,
          completedAt: passed ? (prev.completedAt || now) : prev.completedAt,
          updatedAt: now,
        } as any)
        .where(eq(patient_lesson_progress.id, prev.id))
        .returning()
      progressRow = updated[0]
    }

    let celebration: any = null
    let questUpdated: any = null

    // Award only on first time completion
    if (passed && !wasCompleted) {
      await AlignerWearService.awardDailyGoal(patientId, Number(lesson.rewardCoins || 0), Number(lesson.rewardXp || 0), {
        reason: 'education_lesson_completed',
        lessonId,
      })
      celebration = {
        kind: 'lesson_completed',
        title: 'Lição concluída!',
        coins: Number(lesson.rewardCoins || 0),
        xp: Number(lesson.rewardXp || 0),
      }

      // Increment quest lessons for active aligner (if any)
      const activeAligner = await db
        .select()
        .from(aligners)
        .where(and(eq(aligners.patientId, patientId), eq(aligners.status, 'active')))
        .orderBy(desc(aligners.alignerNumber))
        .limit(1)
      if (activeAligner[0]) {
        try {
          questUpdated = await AlignerWearService.incrementLessonsDone({ patientId, alignerId: String(activeAligner[0].id) })
        } catch {
          // ignore
        }
      }
    }

    res.json({
      lessonId,
      scorePercent,
      passed,
      progress: progressRow,
      celebration,
      quest: questUpdated,
    })
  } catch (e: any) {
    console.error('Error submitting lesson quiz:', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
})

export default router





