/**
 * Missions & Gamification Routes
 */

import { Router } from 'express'
import { db, mission_templates, patient_missions, patient_points, mission_programs, mission_program_templates, users, treatments } from '../db/index'
import { eq, and, inArray } from 'drizzle-orm'
import { TranslationService } from '../services/translationService'

const router = Router()

// Helpers
// Removido: seed inline substituído por script dedicado em server/scripts/seed-mission-templates.ts

// ============================================
// MISSION TEMPLATES
// ============================================

// Get all mission templates
router.get('/missions/templates', async (req, res) => {
  try {
    const language = (req.query.language as string) || 'pt-BR'
    const result = await db.select().from(mission_templates)

    // Apply translations
    const translated = await TranslationService.translateMissionTemplates(result, language)

    res.json({ templates: translated })
  } catch (error) {
    console.error('Error fetching mission templates:', error)
    res.status(500).json({ error: 'Failed to fetch mission templates' })
  }
})

// Create mission template
router.post('/missions/templates', async (req, res) => {
  try {
    const newTemplate = await db
      .insert(mission_templates)
      .values({
        id: `template-${Date.now()}`,
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        frequency: req.body.frequency,
        completionCriteria: req.body.completionCriteria,
        targetValue: req.body.targetValue,
        basePoints: req.body.basePoints,
        bonusPoints: req.body.bonusPoints || 0,
        iconEmoji: req.body.iconEmoji || req.body.icon,
        color: req.body.color,
        isActiveByDefault: req.body.isActiveByDefault ?? true,
        requiresManualValidation: req.body.requiresManualValidation ?? false,
        canAutoActivate: req.body.canAutoActivate ?? true,
        scheduledStartDate: req.body.scheduledStartDate || null,
        scheduledEndDate: req.body.scheduledEndDate || null,
        repetitionType: req.body.repetitionType || null,
        repeatOn: req.body.repeatOn || null,
        alignerInterval: req.body.alignerInterval || 1,
      })
      .returning()

    res.json({ template: newTemplate[0] })
  } catch (error) {
    console.error('Error creating mission template:', error)
    res.status(500).json({ error: 'Failed to create mission template' })
  }
})

// Update mission template
router.put('/missions/templates/:id', async (req, res) => {
  try {
    const updated = await db
      .update(mission_templates)
      .set({
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        frequency: req.body.frequency,
        completionCriteria: req.body.completionCriteria,
        targetValue: req.body.targetValue,
        basePoints: req.body.basePoints,
        bonusPoints: req.body.bonusPoints,
        iconEmoji: req.body.iconEmoji || req.body.icon,
        color: req.body.color,
        isActiveByDefault: req.body.isActiveByDefault,
        requiresManualValidation: req.body.requiresManualValidation,
        canAutoActivate: req.body.canAutoActivate,
        scheduledStartDate: req.body.scheduledStartDate,
        scheduledEndDate: req.body.scheduledEndDate,
        repetitionType: req.body.repetitionType,
        repeatOn: req.body.repeatOn,
        alignerInterval: req.body.alignerInterval,
        updatedAt: new Date(),
      })
      .where(eq(mission_templates.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json({ template: updated[0] })
  } catch (error) {
    console.error('Error updating mission template:', error)
    res.status(500).json({ error: 'Failed to update mission template' })
  }
})

// Delete mission template
router.delete('/missions/templates/:id', async (req, res) => {
  try {
    await db.delete(mission_templates).where(eq(mission_templates.id, req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting mission template:', error)
    res.status(500).json({ error: 'Failed to delete mission template' })
  }
})

// ============================================
// PATIENT MISSIONS
// ============================================

// Get all missions for a patient
router.get('/missions/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params

    // Get patient's language preference
    const patient = await db
      .select()
      .from(users)
      .where(eq(users.id, patientId))
      .limit(1)

    const language = patient[0]?.preferredLanguage || 'pt-BR'

    // Get patient missions
    const missions = await db
      .select()
      .from(patient_missions)
      .where(eq(patient_missions.patientId, patientId))
      .orderBy(patient_missions.createdAt)

    // Get active treatment (to expose current aligner for UI filtering, esp. photos)
    const treatmentResults = await db
      .select()
      .from(treatments)
      .where(
        and(
          eq(treatments.patientId, patientId),
          eq(treatments.overallStatus, 'active')
        )
      )
      .limit(1)

    const currentAlignerOverall = treatmentResults[0]?.currentAlignerOverall ?? null

    // Get unique template IDs
    const templateIds = [...new Set(missions.map(m => m.missionTemplateId))]

    // Fetch templates
    let templates: any[] = []
    if (templateIds.length > 0) {
      templates = await db
        .select()
        .from(mission_templates)
        .where(inArray(mission_templates.id, templateIds))
    }

    // Translate templates
    const translatedTemplates = await TranslationService.translateMissionTemplates(templates, language)

    // Create a map for quick lookup
    const templateMap = new Map(translatedTemplates.map(t => [t.id, t]))

    // Attach translated template to each mission
    const missionsWithTemplates = missions.map(mission => ({
      ...mission,
      template: templateMap.get(mission.missionTemplateId),
    }))

    res.json({ missions: missionsWithTemplates, currentAlignerOverall })
  } catch (error) {
    console.error('Error fetching patient missions:', error)
    res.status(500).json({ error: 'Failed to fetch patient missions' })
  }
})

// Assign mission to patient from template
router.post('/missions/assign', async (req, res) => {
  try {
    const { patientId, missionTemplateId, trigger, triggerAlignerNumber, triggerDaysOffset, expiresAt, customPoints, } = req.body

    const templateResult = await db
      .select()
      .from(mission_templates)
      .where(eq(mission_templates.id, missionTemplateId))

    if (templateResult.length === 0) {
      return res.status(404).json({ error: 'Template not found' })
    }

    const template = templateResult[0]

    const newMission = await db
      .insert(patient_missions)
      .values({
        id: `mission-${Date.now()}`,
        patientId,
        missionTemplateId,
        status: trigger === 'immediate' ? 'in_progress' : 'available',
        progress: 0,
        targetValue: template.targetValue ?? 1,
        trigger: trigger || 'immediate',
        triggerAlignerNumber: triggerAlignerNumber || null,
        triggerDaysOffset: triggerDaysOffset || null,
        autoActivated: trigger !== 'manual',
        expiresAt: expiresAt || null,
        pointsEarned: 0,
        customPoints: customPoints || null,
      })
      .returning()

    res.json({ mission: newMission[0] })
  } catch (error) {
    console.error('Error creating mission:', error)
    res.status(500).json({ error: 'Failed to create mission' })
  }
})

// Update mission
router.put('/missions/:id', async (req, res) => {
  try {
    const updated = await db
      .update(patient_missions)
      .set({
        status: req.body.status,
        progress: req.body.progress,
        targetValue: req.body.targetValue,
        trigger: req.body.trigger,
        triggerAlignerNumber: req.body.triggerAlignerNumber,
        triggerDaysOffset: req.body.triggerDaysOffset,
        autoActivated: req.body.autoActivated,
        expiresAt: req.body.expiresAt,
        pointsEarned: req.body.pointsEarned,
        customPoints: req.body.customPoints,
        updatedAt: new Date(),
      })
      .where(eq(patient_missions.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Mission not found' })
    }

    res.json({ mission: updated[0] })
  } catch (error) {
    console.error('Error updating mission:', error)
    res.status(500).json({ error: 'Failed to update mission' })
  }
})

// Complete mission
router.post('/missions/:id/complete', async (req, res) => {
  try {
    const missionId = req.params.id

    // Get mission
    const missionResult = await db
      .select()
      .from(patient_missions)
      .where(eq(patient_missions.id, missionId))

    if (missionResult.length === 0) {
      return res.status(404).json({ error: 'Mission not found' })
    }

    const mission = missionResult[0]

    // Get template (to resolve reward when customPoints is not set)
    const templateResult = await db
      .select()
      .from(mission_templates)
      .where(eq(mission_templates.id, mission.missionTemplateId))

    const template = templateResult[0]
    // Guardrails: manual confirms only for truly manual templates.
    const isManuallyCompletable = template?.completionCriteria === 'manual'
    if (!isManuallyCompletable) {
      return res.status(403).json({
        error: 'This mission cannot be completed manually',
      })
    }

    const rewardCoins = mission.customPoints ?? template?.basePoints ?? 0
    const rewardXp = Math.floor(rewardCoins / 2)

    // Mark as completed
    const updated = await db
      .update(patient_missions)
      .set({
        status: 'completed',
        progress: mission.targetValue || mission.progress || 1,
        completedAt: new Date(),
        pointsEarned: rewardCoins,
        updatedAt: new Date(),
      })
      .where(eq(patient_missions.id, missionId))
      .returning()

    // Award coins/xp (create record if missing)
    const currentPoints = await db
      .select()
      .from(patient_points)
      .where(eq(patient_points.patientId, mission.patientId))

    if (currentPoints.length === 0) {
      const xp = rewardXp
      const level = Math.floor(xp / 100) + 1
      await db.insert(patient_points).values({
        id: `points-${Date.now()}`,
        patientId: mission.patientId,
        coins: rewardCoins,
        xp,
        level,
        // legacy mirrors
        totalPoints: rewardCoins,
        currentLevel: level,
        updatedAt: new Date(),
        lastActivityAt: new Date(),
      })
    } else {
      const prev = currentPoints[0]
      const newCoins = (prev.coins || 0) + rewardCoins
      const newXp = (prev.xp || 0) + rewardXp
      const newLevel = Math.floor(newXp / 100) + 1
      await db
        .update(patient_points)
        .set({
          coins: newCoins,
          xp: newXp,
          level: newLevel,
          // legacy mirrors
          totalPoints: newCoins,
          currentLevel: newLevel,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(patient_points.patientId, mission.patientId))
    }

    res.json({ mission: updated[0] })
  } catch (error) {
    console.error('Error completing mission:', error)
    res.status(500).json({ error: 'Failed to complete mission' })
  }
})

// ============================================
// MISSION PROGRAMS (presets)
// ============================================

router.get('/mission-programs', async (req, res) => {
  try {
    const clinicId = req.query.clinicId as string | undefined
    const programs = clinicId
      ? await db.select().from(mission_programs).where(eq(mission_programs.clinicId, clinicId))
      : await db.select().from(mission_programs)
    res.json({ programs })
  } catch (error) {
    console.error('Error fetching mission programs:', error)
    res.status(500).json({ error: 'Failed to fetch mission programs' })
  }
})

router.post('/mission-programs', async (req, res) => {
  try {
    const { clinicId, name, description, isDefault, templates = [], createdBy } = req.body
    const newProgram = await db
      .insert(mission_programs)
      .values({
        id: `program-${Date.now()}`,
        clinicId,
        name,
        description,
        isDefault: !!isDefault,
        createdBy: createdBy || null,
      })
      .returning()

    const program = newProgram[0]

    if (Array.isArray(templates) && templates.length > 0) {
      const rows = templates.map((t: any) => ({
        id: `program-template-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        programId: program.id,
        missionTemplateId: t.missionTemplateId,
        isActive: t.isActive ?? true,
        alignerInterval: t.alignerInterval ?? 1,
        trigger: t.trigger || null,
        triggerAlignerNumber: t.triggerAlignerNumber || null,
        triggerDaysOffset: t.triggerDaysOffset || null,
        customPoints: t.customPoints || null,
      }))
      await db.insert(mission_program_templates).values(rows)
    }

    res.json({ program })
  } catch (error) {
    console.error('Error creating mission program:', error)
    res.status(500).json({ error: 'Failed to create mission program' })
  }
})

router.put('/mission-programs/:id', async (req, res) => {
  try {
    const { name, description, isDefault, templates } = req.body
    const updated = await db
      .update(mission_programs)
      .set({
        name,
        description,
        isDefault,
        updatedAt: new Date(),
      })
      .where(eq(mission_programs.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Program not found' })
    }

    if (Array.isArray(templates)) {
      // Delete existing
      await db.delete(mission_program_templates).where(eq(mission_program_templates.programId, req.params.id))
      const rows = templates.map((t: any) => ({
        id: `program-template-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        programId: req.params.id,
        missionTemplateId: t.missionTemplateId,
        isActive: t.isActive ?? true,
        alignerInterval: t.alignerInterval ?? 1,
        trigger: t.trigger || null,
        triggerAlignerNumber: t.triggerAlignerNumber || null,
        triggerDaysOffset: t.triggerDaysOffset || null,
        customPoints: t.customPoints || null,
      }))
      if (rows.length > 0) {
        await db.insert(mission_program_templates).values(rows)
      }
    }

    res.json({ program: updated[0] })
  } catch (error) {
    console.error('Error updating mission program:', error)
    res.status(500).json({ error: 'Failed to update mission program' })
  }
})

router.delete('/mission-programs/:id', async (req, res) => {
  try {
    await db.delete(mission_program_templates).where(eq(mission_program_templates.programId, req.params.id))
    await db.delete(mission_programs).where(eq(mission_programs.id, req.params.id))
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting mission program:', error)
    res.status(500).json({ error: 'Failed to delete mission program' })
  }
})

// Get program with templates (full)
router.get('/mission-programs/:id', async (req, res) => {
  try {
    const { id } = req.params
    const program = await db.select().from(mission_programs).where(eq(mission_programs.id, id))
    if (program.length === 0) {
      return res.status(404).json({ error: 'Program not found' })
    }

    const templates = await db
      .select()
      .from(mission_program_templates)
      .where(eq(mission_program_templates.programId, id))

    res.json({ program: program[0], templates })
  } catch (error) {
    console.error('Error fetching mission program', error)
    res.status(500).json({ error: 'Failed to fetch mission program' })
  }
})

async function applyProgramToPatient(programId: string, patientId: string, totalAligners?: number) {
  const program = await db
    .select()
    .from(mission_programs)
    .where(eq(mission_programs.id, programId))
  if (program.length === 0) {
    throw new Error('Program not found')
  }

  const programTemplates = await db
    .select()
    .from(mission_program_templates)
    .where(eq(mission_program_templates.programId, programId))

  if (programTemplates.length === 0) return []

  const missionsToInsert: any[] = []

  for (const pt of programTemplates) {
    if (!pt.isActive) continue
    const templateResult = await db
      .select()
      .from(mission_templates)
      .where(eq(mission_templates.id, pt.missionTemplateId))

    if (templateResult.length === 0) continue
    const template = templateResult[0]

    if (template.frequency === 'once') {
      const missionId = `mission-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
      missionsToInsert.push({
        id: missionId,
        patientId,
        missionTemplateId: template.id,
        status: 'available',
        progress: 0,
        targetValue: template.targetValue || 1,
        trigger: pt.trigger || 'on_treatment_start',
        triggerAlignerNumber: null,
        triggerDaysOffset: pt.triggerDaysOffset || null,
        autoActivated: true,
        expiresAt: null,
        pointsEarned: 0,
        customPoints: pt.customPoints || template.basePoints,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      continue
    }

    const interval = pt.alignerInterval || 1
    const maxAligners = totalAligners || template.targetValue || 1

    for (let alignerNumber = 1; alignerNumber <= maxAligners; alignerNumber += interval) {
      const missionId = `mission-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`
      missionsToInsert.push({
        id: missionId,
        patientId,
        missionTemplateId: template.id,
        status: alignerNumber === 1 ? 'in_progress' : 'available',
        progress: 0,
        targetValue: template.targetValue || 1,
        trigger: pt.trigger || 'on_aligner_N_start',
        triggerAlignerNumber: pt.triggerAlignerNumber || alignerNumber,
        triggerDaysOffset: pt.triggerDaysOffset || null,
        autoActivated: true,
        expiresAt: null,
        pointsEarned: 0,
        customPoints: pt.customPoints || template.basePoints,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  if (missionsToInsert.length > 0) {
    await db.insert(patient_missions).values(missionsToInsert)
  }

  return missionsToInsert
}

// Apply program to patient
router.post('/mission-programs/:id/apply', async (req, res) => {
  try {
    const { patientId, totalAligners } = req.body
    if (!patientId) {
      return res.status(400).json({ error: 'patientId is required' })
    }
    const missions = await applyProgramToPatient(req.params.id, patientId, totalAligners)
    res.json({ created: missions.length })
  } catch (error) {
    console.error('Error applying mission program:', error)
    res.status(500).json({ error: 'Failed to apply mission program' })
  }
})

// Return default program for a clinic
router.get('/mission-programs/default/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params
    const program = await db
      .select()
      .from(mission_programs)
      .where(
        and(
          eq(mission_programs.clinicId, clinicId),
          eq(mission_programs.isDefault, true)
        )
      )
    res.json({ program: program[0] || null })
  } catch (error) {
    console.error('Error fetching default mission program:', error)
    res.status(500).json({ error: 'Failed to fetch default mission program' })
  }
})

// Get program with templates
router.get('/mission-programs/:id/templates', async (req, res) => {
  try {
    const { id } = req.params
    const program = await db.select().from(mission_programs).where(eq(mission_programs.id, id))
    if (program.length === 0) {
      return res.json({ program: null, templates: [] })
    }

    const templates = await db
      .select()
      .from(mission_program_templates)
      .where(eq(mission_program_templates.programId, id))

    res.json({ program: program[0], templates })
  } catch (error) {
    console.error('Error fetching mission program templates:', error)
    res.status(500).json({ error: 'Failed to fetch mission program templates' })
  }
})

// Clone missions from one patient to others
router.post('/missions/clone', async (req, res) => {
  try {
    const { sourcePatientId, targetPatientIds } = req.body

    const sourceMissions = await db
      .select()
      .from(patient_missions)
      .where(eq(patient_missions.patientId, sourcePatientId))

    if (sourceMissions.length === 0) {
      return res.status(400).json({ error: 'Source patient has no missions' })
    }

    const cloned: any[] = []
    for (const targetId of targetPatientIds as string[]) {
      for (const mission of sourceMissions) {
        cloned.push({
          ...mission,
          id: `mission-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
          patientId: targetId,
          status: mission.status === 'completed' ? 'available' : mission.status,
          progress: 0,
          pointsEarned: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }
    }

    if (cloned.length > 0) {
      await db.insert(patient_missions).values(cloned)
    }

    res.json({ success: true, cloned: cloned.length })
  } catch (error) {
    console.error('Error cloning missions:', error)
    res.status(500).json({ error: 'Failed to clone missions' })
  }
})

// ============================================
// PATIENT POINTS
// ============================================

// Get patient points
router.get('/points/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const result = await db
      .select()
      .from(patient_points)
      .where(eq(patient_points.patientId, patientId))

    if (result.length === 0) {
      // Create initial points record
      const created = await db
        .insert(patient_points)
        .values({
          id: `points-${Date.now()}`,
          patientId,
          coins: 0,
          xp: 0,
          level: 1,
          // legacy mirrors
          totalPoints: 0,
          currentLevel: 1,
        })
        .returning()

      return res.json({ points: created[0] })
    }

    res.json({ points: result[0] })
  } catch (error) {
    console.error('Error fetching patient points:', error)
    res.status(500).json({ error: 'Failed to fetch patient points' })
  }
})

// Add coins/XP to patient
router.post('/points/patient/:patientId/add', async (req, res) => {
  try {
    const { patientId } = req.params
    const { coins = 0, xp = 0 } = req.body

    // Get current points
    const current = await db
      .select()
      .from(patient_points)
      .where(eq(patient_points.patientId, patientId))

    let updated

    if (current.length === 0) {
      // Create new
      updated = await db
        .insert(patient_points)
        .values({
          id: `points-${Date.now()}`,
          patientId,
          coins,
          xp,
          level: Math.floor(xp / 100) + 1,
          // legacy mirrors
          totalPoints: coins,
          currentLevel: Math.floor(xp / 100) + 1,
          lastActivityAt: new Date(),
        })
        .returning()
    } else {
      // Update existing
      const newCoins = (current[0].coins || 0) + coins
      const newXp = (current[0].xp || 0) + xp
      const newLevel = Math.floor(newXp / 100) + 1

      updated = await db
        .update(patient_points)
        .set({
          coins: newCoins,
          xp: newXp,
          level: newLevel,
          // legacy mirrors
          totalPoints: newCoins,
          currentLevel: newLevel,
          lastActivityAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(patient_points.patientId, patientId))
        .returning()
    }

    res.json({ points: updated[0] })
  } catch (error) {
    console.error('Error adding points:', error)
    res.status(500).json({ error: 'Failed to add points' })
  }
})

// Update patient points (direct set)
router.put('/points/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params

    const nextXp = req.body.xp ?? 0
    const nextLevel = Math.floor(nextXp / 100) + 1
    const nextCoins = req.body.coins ?? 0

    const updated = await db
      .update(patient_points)
      .set({
        ...req.body,
        level: nextLevel,
        // legacy mirrors
        totalPoints: nextCoins,
        currentLevel: nextLevel,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(patient_points.patientId, patientId))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Points record not found' })
    }

    res.json({ points: updated[0] })
  } catch (error) {
    console.error('Error updating points:', error)
    res.status(500).json({ error: 'Failed to update points' })
  }
})

export default router
