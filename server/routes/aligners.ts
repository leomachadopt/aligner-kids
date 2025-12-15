/**
 * Aligners & Treatments Routes
 */

import { Router } from 'express'
import { db, treatments, aligners, mission_templates, patient_missions, mission_programs, mission_program_templates, users } from '../db/index'
import { eq, and, desc } from 'drizzle-orm'

const router = Router()

async function assignMissionsForTreatment(patientId: string, treatmentId: string, totalAligners: number) {
  const templates = await db.select().from(mission_templates)
  const activeTemplates = templates.filter((t) => t.isActiveByDefault)

  const missionsToInsert: any[] = []

  for (const template of activeTemplates) {
    const interval = template.alignerInterval || 1
    for (let alignerNumber = 1; alignerNumber <= totalAligners; alignerNumber += interval) {
      missionsToInsert.push({
        id: `mission-${Date.now()}-${alignerNumber}-${Math.random().toString(36).slice(2, 5)}`,
        patientId,
        missionTemplateId: template.id,
        status: interval === 1 && alignerNumber === 1 ? 'in_progress' : 'available',
        progress: 0,
        targetValue: template.targetValue || 1,
        trigger: 'on_aligner_N_start',
        triggerAlignerNumber: alignerNumber,
        triggerDaysOffset: null,
        autoActivated: true,
        expiresAt: null,
        pointsEarned: 0,
        customPoints: template.basePoints,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }
  }

  if (missionsToInsert.length > 0) {
    await db.insert(patient_missions).values(missionsToInsert)
    console.log(`✅ ${missionsToInsert.length} missões criadas para o tratamento ${treatmentId}`)
  }
}

async function applyProgramToPatient(programId: string, patientId: string, totalAligners: number) {
  const program = await db.select().from(mission_programs).where(eq(mission_programs.id, programId))
  if (program.length === 0) return

  const programTemplates = await db
    .select()
    .from(mission_program_templates)
    .where(eq(mission_program_templates.programId, programId))

  if (programTemplates.length === 0) return

  const missionsToInsert: any[] = []

  for (const pt of programTemplates) {
    if (!pt.isActive) continue

    const templateResult = await db
      .select()
      .from(mission_templates)
      .where(eq(mission_templates.id, pt.missionTemplateId))

    if (templateResult.length === 0) continue
    const template = templateResult[0]

    const interval = pt.alignerInterval || 1
    const maxAligners = totalAligners || template.targetValue || 1

    for (let alignerNumber = 1; alignerNumber <= maxAligners; alignerNumber += interval) {
      missionsToInsert.push({
        id: `mission-${Date.now()}-${alignerNumber}-${Math.random().toString(36).slice(2, 5)}`,
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
    console.log(`✅ ${missionsToInsert.length} missões criadas para o tratamento ${treatmentId} via programa`)
  }
}

async function getDefaultProgramForClinic(clinicId?: string) {
  if (!clinicId) return null
  const program = await db
    .select()
    .from(mission_programs)
    .where(
      and(
        eq(mission_programs.clinicId, clinicId),
        eq(mission_programs.isDefault, true)
      )
    )
  return program.length > 0 ? program[0] : null
}

// ============================================
// TREATMENTS
// ============================================

// Get patient's treatment
router.get('/treatments/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const result = await db
      .select()
      .from(treatments)
      .where(eq(treatments.patientId, patientId))
      .orderBy(desc(treatments.createdAt))

    if (result.length === 0) {
      // Evita 404 ruidoso no front; retorna vazio
      return res.json({ treatment: null })
    }

    res.json({ treatment: result[0] })
  } catch (error) {
    console.error('Error fetching treatment:', error)
    res.status(500).json({ error: 'Failed to fetch treatment' })
  }
})

// Create treatment
router.post('/treatments', async (req, res) => {
  try {
    if (!req.body.patientId || !req.body.totalAligners) {
      return res.status(400).json({ error: 'patientId e totalAligners são obrigatórios' })
    }

    const startDate =
      (req.body.startDate && String(req.body.startDate).slice(0, 10)) ||
      new Date().toISOString().slice(0, 10)

    const expectedEndDate =
      (req.body.expectedEndDate && String(req.body.expectedEndDate).slice(0, 10)) ||
      (req.body.estimatedEndDate && String(req.body.estimatedEndDate).slice(0, 10)) ||
      null

    // Sempre iniciar progresso no primeiro alinhador de um novo tratamento
    const currentAlignerNumber = 1

    const newTreatment = await db
      .insert(treatments)
      .values({
        id: `treatment-${Date.now()}`,
        patientId: req.body.patientId,
        name: req.body.name || null,
        startDate,
        expectedEndDate,
        totalAligners: req.body.totalAligners,
        currentAlignerNumber,
        status: req.body.status || 'active',
        notes: req.body.notes || null,
      })
      .returning()

    const treatment = newTreatment[0]

    // ✅ CRIAR AUTOMATICAMENTE TODOS OS ALINHADORES
    const daysPerAligner = req.body.daysPerAligner || 14
    const alignersToCreate = []

    for (let i = 1; i <= req.body.totalAligners; i++) {
      const alignerStartDate = new Date(startDate)
      alignerStartDate.setDate(alignerStartDate.getDate() + (i - 1) * daysPerAligner)

      const alignerEndDate = new Date(alignerStartDate)
      alignerEndDate.setDate(alignerEndDate.getDate() + daysPerAligner - 1)

      alignersToCreate.push({
        id: `aligner-${Date.now()}-${i}`,
        patientId: req.body.patientId,
        treatmentId: treatment.id,
        alignerNumber: i,
        startDate: alignerStartDate.toISOString().slice(0, 10),
        endDate: alignerEndDate.toISOString().slice(0, 10),
        actualEndDate: null,
        status: i === 1 ? 'active' : 'pending',
        usageHours: 0,
        targetHoursPerDay: req.body.targetHoursPerDay || 22,
        notes: null,
      })

      // Pequeno delay para garantir IDs únicos
      await new Promise(resolve => setTimeout(resolve, 5))
    }

    // Inserir todos os alinhadores
    await db.insert(aligners).values(alignersToCreate)

    console.log(`✅ Tratamento criado com ${req.body.totalAligners} alinhadores`)

    // ✅ Criar missões baseadas em programa ou templates padrão
    if (req.body.missionProgramId) {
      await applyProgramToPatient(req.body.missionProgramId, req.body.patientId, req.body.totalAligners)
    } else {
      // Tentar programa default da clínica do paciente
      let defaultProgramId: string | null = null
      if (req.body.patientId) {
        const patient = await db.select().from(users).where(eq(users.id, req.body.patientId))
        if (patient.length > 0) {
          const def = await getDefaultProgramForClinic(patient[0].clinicId || null)
          if (def) defaultProgramId = def.id
        }
      }

      if (defaultProgramId) {
        await applyProgramToPatient(defaultProgramId, req.body.patientId, req.body.totalAligners)
      } else {
        await assignMissionsForTreatment(req.body.patientId, treatment.id, req.body.totalAligners)
      }
    }

    res.json({ treatment })
  } catch (error) {
    console.error('Error creating treatment:', error)
    res.status(500).json({ error: 'Failed to create treatment' })
  }
})

// Update treatment
router.put('/treatments/:id', async (req, res) => {
  try {
    const updated = await db
      .update(treatments)
      .set({
        startDate: req.body.startDate,
        expectedEndDate: req.body.expectedEndDate || req.body.estimatedEndDate,
        totalAligners: req.body.totalAligners,
        currentAlignerNumber: req.body.currentAlignerNumber,
        status: req.body.status,
        notes: req.body.notes,
        updatedAt: new Date(),
      })
      .where(eq(treatments.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Treatment not found' })
    }

    res.json({ treatment: updated[0] })
  } catch (error) {
    console.error('Error updating treatment:', error)
    res.status(500).json({ error: 'Failed to update treatment' })
  }
})

// Delete treatment (útil para testes)
router.delete('/treatments/:id', async (req, res) => {
  try {
    const { id } = req.params

    console.log(`🗑️  Deletando tratamento ${id} e seus alinhadores...`)

    // 1. Deletar todos os alinhadores deste tratamento
    const deletedAligners = await db
      .delete(aligners)
      .where(eq(aligners.treatmentId, id))
      .returning()

    console.log(`   - ${deletedAligners.length} alinhadores deletados`)

    // 2. Deletar o tratamento
    const deletedTreatment = await db
      .delete(treatments)
      .where(eq(treatments.id, id))
      .returning()

    if (deletedTreatment.length === 0) {
      return res.status(404).json({ error: 'Treatment not found' })
    }

    console.log(`✅ Tratamento deletado com sucesso`)

    res.json({
      success: true,
      message: 'Treatment and aligners deleted successfully',
      deletedAligners: deletedAligners.length
    })
  } catch (error) {
    console.error('Error deleting treatment:', error)
    res.status(500).json({ error: 'Failed to delete treatment' })
  }
})

// ============================================
// ALIGNERS
// ============================================

// Get all aligners for a patient
router.get('/aligners/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const { treatmentId } = req.query
    const baseWhere = treatmentId
      ? and(eq(aligners.patientId, patientId), eq(aligners.treatmentId, treatmentId as string))
      : eq(aligners.patientId, patientId)

    const result = await db
      .select()
      .from(aligners)
      .where(baseWhere)
      .orderBy(aligners.alignerNumber)

    res.json({ aligners: result })
  } catch (error) {
    console.error('Error fetching aligners:', error)
    res.status(500).json({ error: 'Failed to fetch aligners' })
  }
})

// Get single aligner
router.get('/aligners/:id', async (req, res) => {
  try {
    const result = await db
      .select()
      .from(aligners)
      .where(eq(aligners.id, req.params.id))

    if (result.length === 0) {
      return res.status(404).json({ error: 'Aligner not found' })
    }

    res.json({ aligner: result[0] })
  } catch (error) {
    console.error('Error fetching aligner:', error)
    res.status(500).json({ error: 'Failed to fetch aligner' })
  }
})

// Create aligner
router.post('/aligners', async (req, res) => {
  try {
    const alignerNumber = req.body.alignerNumber ?? req.body.number
    const patientId = req.body.patientId
    const treatmentId = req.body.treatmentId

    // Verificar se já existe alinhador com esse número para o mesmo paciente/tratamento
    if (alignerNumber && (patientId || treatmentId)) {
      const existing = await db
        .select()
        .from(aligners)
        .where(
          and(
            treatmentId ? eq(aligners.treatmentId, treatmentId) : eq(aligners.patientId, patientId),
            eq(aligners.alignerNumber, alignerNumber)
          )
        )

      if (existing.length > 0) {
        return res.status(400).json({
          error: `Já existe um alinhador #${alignerNumber} para este ${treatmentId ? 'tratamento' : 'paciente'}`
        })
      }
    }

    const newAligner = await db
      .insert(aligners)
      .values({
        id: `aligner-${Date.now()}`,
        patientId: req.body.patientId,
        treatmentId: req.body.treatmentId || null,
        alignerNumber,
        startDate: req.body.startDate || new Date().toISOString(),
        endDate: req.body.endDate || req.body.expectedEndDate || new Date().toISOString(),
        actualEndDate: req.body.actualEndDate || null,
        status:
          req.body.status ||
          (req.body.alignerNumber ?? req.body.number) === 1
            ? 'active'
            : 'pending',
        usageHours: req.body.usageHours ?? 0,
        targetHoursPerDay: req.body.targetHoursPerDay ?? 22,
        notes: req.body.notes || null,
      })
      .returning()

    res.json({ aligner: newAligner[0] })
  } catch (error) {
    console.error('Error creating aligner:', error)
    res.status(500).json({ error: 'Failed to create aligner' })
  }
})

// Update aligner
router.put('/aligners/:id', async (req, res) => {
  try {
    const updated = await db
      .update(aligners)
      .set({
        treatmentId: req.body.treatmentId,
        alignerNumber: req.body.alignerNumber ?? req.body.number,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        actualEndDate: req.body.actualEndDate,
        status: req.body.status,
        usageHours: req.body.usageHours,
        targetHoursPerDay: req.body.targetHoursPerDay,
        notes: req.body.notes,
        updatedAt: new Date(),
      })
      .where(eq(aligners.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Aligner not found' })
    }

    res.json({ aligner: updated[0] })
  } catch (error) {
    console.error('Error updating aligner:', error)
    res.status(500).json({ error: 'Failed to update aligner' })
  }
})

// Confirm aligner change (mark current as completed, activate next)
router.post('/aligners/:id/confirm', async (req, res) => {
  try {
    const alignerId = req.params.id

    // Get the aligner
    const alignerResult = await db
      .select()
      .from(aligners)
      .where(eq(aligners.id, alignerId))

    if (alignerResult.length === 0) {
      return res.status(404).json({ error: 'Aligner not found' })
    }

    const aligner = alignerResult[0]

    // Mark as completed
    await db
      .update(aligners)
      .set({
        status: 'completed',
        endDate: new Date().toISOString(),
        updatedAt: new Date(),
      })
      .where(eq(aligners.id, alignerId))

    // Update treatment current aligner number (prefer treatmentId if exists)
    if (aligner.treatmentId) {
      await db
        .update(treatments)
        .set({
          currentAlignerNumber: aligner.alignerNumber + 1,
          updatedAt: new Date(),
        })
        .where(eq(treatments.id, aligner.treatmentId))
    } else {
      await db
        .update(treatments)
        .set({
          currentAlignerNumber: aligner.alignerNumber + 1,
          updatedAt: new Date(),
        })
        .where(eq(treatments.patientId, aligner.patientId))
    }

    // Find and activate next aligner
    const nextAligner = await db
      .select()
      .from(aligners)
      .where(
        and(
          eq(aligners.patientId, aligner.patientId),
          aligner.treatmentId ? eq(aligners.treatmentId, aligner.treatmentId) : undefined,
          eq(aligners.alignerNumber, aligner.alignerNumber + 1)
        )
      )

    if (nextAligner.length > 0) {
      await db
        .update(aligners)
        .set({
          status: 'active',
          startDate: new Date().toISOString(),
          updatedAt: new Date(),
        })
        .where(eq(aligners.id, nextAligner[0].id))

      // Ativar missões cujo gatilho é iniciar este alinhador
      await db
        .update(patient_missions)
        .set({
          status: 'in_progress',
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(patient_missions.patientId, aligner.patientId),
            eq(patient_missions.trigger, 'on_aligner_N_start'),
            eq(patient_missions.triggerAlignerNumber, nextAligner[0].alignerNumber),
          ),
        )

      res.json({
        confirmedAligner: aligner,
        nextAligner: nextAligner[0]
      })
    } else {
      // No more aligners - treatment complete
      if (aligner.treatmentId) {
        await db
          .update(treatments)
          .set({
            status: 'completed',
            updatedAt: new Date(),
          })
          .where(eq(treatments.id, aligner.treatmentId))
      } else {
        await db
          .update(treatments)
          .set({
            status: 'completed',
            updatedAt: new Date(),
          })
          .where(eq(treatments.patientId, aligner.patientId))
      }

      res.json({
        confirmedAligner: aligner,
        treatmentCompleted: true
      })
    }
  } catch (error) {
    console.error('Error confirming aligner:', error)
    res.status(500).json({ error: 'Failed to confirm aligner change' })
  }
})

// Delete aligner
router.delete('/aligners/:id', async (req, res) => {
  try {
    await db.delete(aligners).where(eq(aligners.id, req.params.id))
    res.json({ message: 'Aligner deleted successfully' })
  } catch (error) {
    console.error('Error deleting aligner:', error)
    res.status(500).json({ error: 'Failed to delete aligner' })
  }
})

export default router
