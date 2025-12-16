/**
 * Aligners & Treatments Routes
 */

import { Router } from 'express'
import { db, treatments, aligners, mission_templates, patient_missions, mission_programs, mission_program_templates, users, treatment_phases } from '../db/index'
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

// Get all patient's treatments
router.get('/treatments/patient/:patientId/all', async (req, res) => {
  try {
    const { patientId } = req.params
    const result = await db
      .select()
      .from(treatments)
      .where(eq(treatments.patientId, patientId))
      .orderBy(desc(treatments.createdAt))

    res.json({ treatments: result })
  } catch (error) {
    console.error('Error fetching treatments:', error)
    res.status(500).json({ error: 'Failed to fetch treatments' })
  }
})

// Get patient's treatment (most recent)
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
// Com validação de data e transição automática de fases
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

    // ✅ VALIDAÇÃO: Verificar se a data de término já passou
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const endDate = new Date(aligner.endDate)
    endDate.setHours(0, 0, 0, 0)

    if (today < endDate) {
      const diffTime = endDate.getTime() - today.getTime()
      const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      return res.status(400).json({
        error: 'Ainda não é possível trocar o alinhador',
        daysRemaining,
        canActivateAt: aligner.endDate
      })
    }

    const todayStr = new Date().toISOString().slice(0, 10)

    // Mark as completed
    await db
      .update(aligners)
      .set({
        status: 'completed',
        actualEndDate: todayStr,
        updatedAt: new Date(),
      })
      .where(eq(aligners.id, alignerId))

    // ✅ BUSCAR FASE ATUAL (se existir)
    let currentPhase = null
    if (aligner.phaseId) {
      const phaseResult = await db
        .select()
        .from(treatment_phases)
        .where(eq(treatment_phases.id, aligner.phaseId))

      if (phaseResult.length > 0) {
        currentPhase = phaseResult[0]
      }
    }

    // ✅ VERIFICAR SE É O ÚLTIMO ALINHADOR DA FASE
    const isLastInPhase = currentPhase && aligner.alignerNumber === currentPhase.endAlignerNumber

    // Find and activate next aligner
    const nextAlignerResult = await db
      .select()
      .from(aligners)
      .where(
        and(
          eq(aligners.patientId, aligner.patientId),
          aligner.treatmentId ? eq(aligners.treatmentId, aligner.treatmentId) : undefined,
          eq(aligners.alignerNumber, aligner.alignerNumber + 1)
        )
      )

    if (nextAlignerResult.length > 0) {
      const nextAligner = nextAlignerResult[0]

      // ✅ SE É O ÚLTIMO DA FASE, MARCAR FASE COMO COMPLETA E ATIVAR PRÓXIMA FASE
      let nextPhase = null
      if (isLastInPhase && currentPhase) {
        console.log(`📦 Completando fase ${currentPhase.phaseNumber}: ${currentPhase.phaseName}`)

        // Marcar fase atual como completa
        await db
          .update(treatment_phases)
          .set({
            status: 'completed',
            actualEndDate: todayStr,
            updatedAt: new Date(),
          })
          .where(eq(treatment_phases.id, currentPhase.id))

        // Buscar próxima fase
        const nextPhaseResult = await db
          .select()
          .from(treatment_phases)
          .where(
            and(
              eq(treatment_phases.treatmentId, aligner.treatmentId!),
              eq(treatment_phases.phaseNumber, currentPhase.phaseNumber + 1)
            )
          )

        if (nextPhaseResult.length > 0) {
          nextPhase = nextPhaseResult[0]

          console.log(`🚀 Iniciando fase ${nextPhase.phaseNumber}: ${nextPhase.phaseName}`)

          // Ativar próxima fase
          await db
            .update(treatment_phases)
            .set({
              status: 'active',
              startDate: todayStr,
              currentAlignerNumber: 1,
              updatedAt: new Date(),
            })
            .where(eq(treatment_phases.id, nextPhase.id))

          // Atualizar tratamento com a nova fase
          if (aligner.treatmentId) {
            await db
              .update(treatments)
              .set({
                currentPhaseNumber: nextPhase.phaseNumber,
                currentAlignerOverall: aligner.alignerNumber + 1,
                updatedAt: new Date(),
              })
              .where(eq(treatments.id, aligner.treatmentId))
          }
        }
      } else {
        // Atualizar progresso dentro da mesma fase
        if (currentPhase) {
          const alignerNumberInPhase = (currentPhase.currentAlignerNumber || 0) + 1
          await db
            .update(treatment_phases)
            .set({
              currentAlignerNumber: alignerNumberInPhase,
              updatedAt: new Date(),
            })
            .where(eq(treatment_phases.id, currentPhase.id))
        }

        // Update treatment current aligner number
        if (aligner.treatmentId) {
          await db
            .update(treatments)
            .set({
              currentAlignerOverall: aligner.alignerNumber + 1,
              updatedAt: new Date(),
            })
            .where(eq(treatments.id, aligner.treatmentId))
        }
      }

      // Ativar próximo alinhador
      await db
        .update(aligners)
        .set({
          status: 'active',
          startDate: todayStr,
          updatedAt: new Date(),
        })
        .where(eq(aligners.id, nextAligner.id))

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
            eq(patient_missions.triggerAlignerNumber, nextAligner.alignerNumber),
          ),
        )

      res.json({
        success: true,
        confirmedAligner: aligner,
        nextAligner,
        phaseCompleted: isLastInPhase,
        completedPhase: isLastInPhase ? currentPhase : null,
        newPhase: nextPhase,
      })
    } else {
      // No more aligners - treatment complete
      console.log(`🏁 Tratamento completado!`)

      // Marcar fase final como completa (se existir)
      if (currentPhase) {
        await db
          .update(treatment_phases)
          .set({
            status: 'completed',
            actualEndDate: todayStr,
            updatedAt: new Date(),
          })
          .where(eq(treatment_phases.id, currentPhase.id))
      }

      // Marcar tratamento como completo
      if (aligner.treatmentId) {
        await db
          .update(treatments)
          .set({
            overallStatus: 'completed',
            updatedAt: new Date(),
          })
          .where(eq(treatments.id, aligner.treatmentId))
      }

      res.json({
        success: true,
        confirmedAligner: aligner,
        treatmentCompleted: true,
        completedPhase: currentPhase
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

// ============================================
// TREATMENT START & ALIGNER ACTIVATION
// ============================================

/**
 * POST /treatments/:id/start
 * Inicia o tratamento, ativando o primeiro alinhador da primeira fase
 */
router.post('/treatments/:id/start', async (req, res) => {
  try {
    const treatmentId = req.params.id

    // Buscar o tratamento
    const treatmentResult = await db
      .select()
      .from(treatments)
      .where(eq(treatments.id, treatmentId))

    if (treatmentResult.length === 0) {
      return res.status(404).json({ error: 'Tratamento não encontrado' })
    }

    const treatment = treatmentResult[0]

    // Verificar se já foi iniciado
    if (treatment.overallStatus === 'active' && treatment.currentAlignerOverall > 1) {
      return res.status(400).json({ error: 'Tratamento já foi iniciado' })
    }

    // Buscar a primeira fase
    const phases = await db
      .select()
      .from(treatment_phases)
      .where(eq(treatment_phases.treatmentId, treatmentId))
      .orderBy(treatment_phases.phaseNumber)

    if (phases.length === 0) {
      return res.status(400).json({ error: 'Nenhuma fase encontrada para este tratamento' })
    }

    const firstPhase = phases[0]
    const today = new Date().toISOString().slice(0, 10)

    // Ativar a primeira fase
    await db
      .update(treatment_phases)
      .set({
        status: 'active',
        startDate: today,
        currentAlignerNumber: 1,
        updatedAt: new Date(),
      })
      .where(eq(treatment_phases.id, firstPhase.id))

    // Buscar o primeiro alinhador global
    const firstAlignerResult = await db
      .select()
      .from(aligners)
      .where(
        and(
          eq(aligners.treatmentId, treatmentId),
          eq(aligners.alignerNumber, firstPhase.startAlignerNumber)
        )
      )

    if (firstAlignerResult.length === 0) {
      return res.status(400).json({ error: 'Primeiro alinhador não encontrado' })
    }

    const firstAligner = firstAlignerResult[0]

    // Ativar o primeiro alinhador
    await db
      .update(aligners)
      .set({
        status: 'active',
        startDate: today,
        updatedAt: new Date(),
      })
      .where(eq(aligners.id, firstAligner.id))

    // Atualizar o tratamento
    await db
      .update(treatments)
      .set({
        overallStatus: 'active',
        currentPhaseNumber: 1,
        currentAlignerOverall: firstPhase.startAlignerNumber,
        startDate: today,
        updatedAt: new Date(),
      })
      .where(eq(treatments.id, treatmentId))

    // Ativar missões do primeiro alinhador
    await db
      .update(patient_missions)
      .set({
        status: 'in_progress',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(patient_missions.patientId, treatment.patientId),
          eq(patient_missions.trigger, 'on_aligner_N_start'),
          eq(patient_missions.triggerAlignerNumber, firstPhase.startAlignerNumber)
        )
      )

    console.log(`✅ Tratamento ${treatmentId} iniciado - Alinhador ${firstPhase.startAlignerNumber} ativado`)

    res.json({
      success: true,
      message: 'Tratamento iniciado com sucesso',
      treatment: {
        ...treatment,
        overallStatus: 'active',
        currentPhaseNumber: 1,
        currentAlignerOverall: firstPhase.startAlignerNumber,
        startDate: today,
      },
      currentPhase: {
        ...firstPhase,
        status: 'active',
        startDate: today,
        currentAlignerNumber: 1,
      },
      currentAligner: {
        ...firstAligner,
        status: 'active',
        startDate: today,
      }
    })
  } catch (error) {
    console.error('❌ Erro ao iniciar tratamento:', error)
    res.status(500).json({ error: 'Falha ao iniciar tratamento' })
  }
})

/**
 * GET /aligners/:id/can-activate
 * Verifica se o alinhador pode ser ativado (se a data já passou)
 * Retorna: { canActivate: boolean, daysRemaining: number, nextActivationDate: string }
 */
router.get('/aligners/:id/can-activate', async (req, res) => {
  try {
    const alignerId = req.params.id

    // Buscar o alinhador
    const alignerResult = await db
      .select()
      .from(aligners)
      .where(eq(aligners.id, alignerId))

    if (alignerResult.length === 0) {
      return res.status(404).json({ error: 'Alinhador não encontrado' })
    }

    const aligner = alignerResult[0]

    console.log(`📅 Verificando alinhador #${aligner.alignerNumber}:`, {
      status: aligner.status,
      startDate: aligner.startDate,
      endDate: aligner.endDate
    })

    // Se já está completado, não pode ativar
    if (aligner.status === 'completed') {
      return res.json({
        canActivate: false,
        daysRemaining: 0,
        nextActivationDate: aligner.startDate,
        currentStatus: aligner.status
      })
    }

    // Para alinhadores ativos, verificar a data de término para trocar
    // Para alinhadores pendentes, verificar a data de início
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const targetDate = new Date(aligner.status === 'active' ? aligner.endDate : aligner.startDate)
    targetDate.setHours(0, 0, 0, 0)

    const diffTime = targetDate.getTime() - today.getTime()
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const canActivate = daysRemaining <= 0

    console.log(`📊 Resultado:`, {
      canActivate,
      daysRemaining: Math.max(0, daysRemaining),
      today: today.toISOString().slice(0, 10),
      targetDate: targetDate.toISOString().slice(0, 10),
      checkingField: aligner.status === 'active' ? 'endDate' : 'startDate'
    })

    res.json({
      canActivate,
      daysRemaining: Math.max(0, daysRemaining),
      nextActivationDate: aligner.startDate,
      currentStatus: aligner.status
    })
  } catch (error) {
    console.error('❌ Erro ao verificar ativação de alinhador:', error)
    res.status(500).json({ error: 'Falha ao verificar ativação' })
  }
})

export default router
