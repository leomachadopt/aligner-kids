/**
 * Aligners & Treatments Routes
 */

import { Router } from 'express'
import { db, treatments, aligners, mission_templates, patient_missions, mission_programs, mission_program_templates, users, treatment_phases } from '../db/index'
import { eq, and, desc } from 'drizzle-orm'
import { RewardProgramAssignmentService } from '../services/rewardProgramAssignmentService'
import { AlignerWearService } from '../services/alignerWearService'
import { MissionProgressService } from '../services/missionProgressService'

const router = Router()

async function assignMissionsForTreatment(patientId: string, treatmentId: string, totalAligners: number) {
  const templates = await db.select().from(mission_templates)
  const activeTemplates = templates.filter((t) => t.isActiveByDefault)

  const missionsToInsert: any[] = []

  for (const template of activeTemplates) {
    // "Once" missions should exist only once per patient
    if (template.frequency === 'once') {
      missionsToInsert.push({
        id: `mission-${Date.now()}-once-${Math.random().toString(36).slice(2, 5)}`,
        patientId,
        missionTemplateId: template.id,
        status: 'available',
        progress: 0,
        targetValue: template.targetValue || 1,
        trigger: 'on_treatment_start',
        triggerAlignerNumber: null,
        triggerDaysOffset: null,
        autoActivated: true,
        expiresAt: null,
        pointsEarned: 0,
        customPoints: template.basePoints,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      continue
    }
    const interval = template.alignerInterval || 1
    for (let alignerNumber = 1; alignerNumber <= totalAligners; alignerNumber += interval) {
      missionsToInsert.push({
        id: `mission-${Date.now()}-${alignerNumber}-${Math.random().toString(36).slice(2, 5)}`,
        patientId,
        missionTemplateId: template.id,
        status: alignerNumber === 1 ? 'in_progress' : 'available',
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

    if (template.frequency === 'once') {
      missionsToInsert.push({
        id: `mission-${Date.now()}-once-${Math.random().toString(36).slice(2, 5)}`,
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
    console.log(`✅ ${missionsToInsert.length} missões criadas para o paciente ${patientId} via programa ${programId}`)
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
    console.log('🔵 POST /api/treatments - Criando tratamento:', {
      patientId: req.body.patientId,
      totalAligners: req.body.totalAligners
    })

    if (!req.body.patientId || !req.body.totalAligners) {
      return res.status(400).json({ error: 'patientId e totalAligners são obrigatórios' })
    }

    // Sistema dinâmico: startDate será definido quando tratamento for iniciado
    console.log('📝 Preparando valores do tratamento...')
    const treatmentValues: any = {
      id: `treatment-${Date.now()}`,
      patientId: req.body.patientId,
      name: req.body.name || null,
      totalAligners: req.body.totalAligners,
      currentAlignerNumber: 1,
      status: 'pending',
      notes: req.body.notes || null,
    }
    // Não incluir startDate e expectedEndDate - deixar como NULL no banco

    console.log('💾 Inserindo tratamento no banco...')
    const newTreatment = await db
      .insert(treatments)
      .values(treatmentValues)
      .returning()

    const treatment = newTreatment[0]
    console.log('✅ Tratamento inserido:', treatment.id)

    // ✅ CRIAR AUTOMATICAMENTE TODOS OS ALINHADORES
    console.log('📦 Criando', req.body.totalAligners, 'alinhadores...')
    // Sistema dinâmico: datas são definidas apenas quando alinhador é ATIVADO
    const daysPerAligner = req.body.changeInterval || req.body.daysPerAligner || 14
    const alignersToCreate = []

    const baseTimestamp = Date.now()
    for (let i = 1; i <= req.body.totalAligners; i++) {
      // Não calcular datas fixas - serão definidas quando alinhador for ativado
      const alignerData: any = {
        id: `aligner-${baseTimestamp}-${i}`, // ID único baseado em timestamp + índice
        patientId: req.body.patientId,
        treatmentId: treatment.id,
        alignerNumber: i,
        // startDate e endDate omitidos - serão NULL no banco
        status: 'pending', // Todos começam pending, até iniciar tratamento
        usageHours: 0,
        targetHoursPerDay: req.body.targetHoursPerDay || 22,
        changeInterval: daysPerAligner, // Armazenar intervalo de troca
      }
      alignersToCreate.push(alignerData)
    }

    // Inserir todos os alinhadores
    console.log('💾 Inserindo alinhadores no banco...')
    const insertedAligners = await db.insert(aligners).values(alignersToCreate).returning()
    console.log('✅ Alinhadores inseridos:', insertedAligners.length)

    // ✅ CRIAR AUTOMATICAMENTE A FASE 1 (Fase Inicial)
    console.log('📋 Criando Fase 1...')
    console.log('📊 Valor de totalAligners:', req.body.totalAligners, 'tipo:', typeof req.body.totalAligners)

    // Garantir que totalAligners é um número válido
    const totalAlignersValue = parseInt(req.body.totalAligners) || 20
    console.log('📊 Valor final totalAligners:', totalAlignersValue)

    // Sistema dinâmico: fase criada mas aguardando início real
    const phaseValues: any = {
      id: `phase-${Date.now()}`,
      treatmentId: treatment.id,
      phaseNumber: 1,
      phaseName: 'Fase 1',
      startAlignerNumber: 1,
      endAlignerNumber: totalAlignersValue,
      totalAligners: totalAlignersValue, // Campo correto do schema
      currentAlignerNumber: 0, // Ainda não iniciou
      status: 'pending', // Aguardando início
      adherenceTargetPercent: 80, // Adicionar explicitamente
      // startDate e expectedEndDate omitidos - serão NULL no banco
      notes: 'Fase inicial criada automaticamente - aguardando início',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    const firstPhase = await db
      .insert(treatment_phases)
      .values(phaseValues)
      .returning()

    console.log(`✅ Fase 1 criada automaticamente com ${totalAlignersValue} alinhadores`)

    // Atualizar todos os alinhadores para vincular com a fase criada
    console.log('🔗 Vinculando alinhadores à fase...')
    for (const aligner of insertedAligners) {
      await db
        .update(aligners)
        .set({ phaseId: firstPhase[0].id })
        .where(eq(aligners.id, aligner.id))
    }

    console.log('✅ Alinhadores vinculados à fase')

    // Atualizar o tratamento com informações da fase
    console.log('📝 Atualizando tratamento...')
    await db
      .update(treatments)
      .set({
        totalPhasesPlanned: 1,
        currentPhaseNumber: 1,
        totalAlignersOverall: req.body.totalAligners,
        currentAlignerOverall: 0, // Ainda não iniciou
        overallStatus: 'pending', // Aguardando início
        status: 'pending',
      })
      .where(eq(treatments.id, treatment.id))

    // NÃO inicializar quest ainda - será feito quando tratamento for iniciado

    console.log(`✅ Tratamento criado com ${req.body.totalAligners} alinhadores e Fase 1 automática`)

    // ✅ Criar missões baseadas em programa ou templates padrão
    console.log('🎯 Atribuindo missões...')
    if (req.body.missionProgramId) {
      await applyProgramToPatient(req.body.missionProgramId, req.body.patientId, req.body.totalAligners)
    } else {
      // Tentar programa default da clínica do paciente
      let defaultProgramId: string | null = null
      if (req.body.patientId) {
        const patient = await db.select().from(users).where(eq(users.id, req.body.patientId))
        if (patient.length > 0) {
          const def = await getDefaultProgramForClinic(patient[0].clinicId || undefined)
          if (def) defaultProgramId = def.id
        }
      }

      if (defaultProgramId) {
        await applyProgramToPatient(defaultProgramId, req.body.patientId, req.body.totalAligners)
      } else {
        await assignMissionsForTreatment(req.body.patientId, treatment.id, req.body.totalAligners)
      }
    }

    console.log('✅ Missões atribuídas')

    // ✅ Atribuir automaticamente programa de prêmios por idade (best-effort)
    console.log('🎁 Atribuindo programa de prêmios...')
    try {
      await RewardProgramAssignmentService.recomputeForPatient(req.body.patientId, req.body.patientId)
      console.log('✅ Programa de prêmios atribuído')
    } catch (e) {
      console.warn('⚠️ Falha ao atribuir programa de prêmios:', e)
    }

    console.log('🎉 Tratamento criado com sucesso! Retornando resposta...')
    res.json({ treatment })
  } catch (error: any) {
    console.error('❌ Error creating treatment:', error)
    console.error('❌ Error message:', error.message)
    console.error('❌ Error stack:', error.stack)
    res.status(500).json({
      error: 'Failed to create treatment',
      details: error.message
    })
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
    console.log('📋 Listando alinhadores:', { patientId, treatmentId })

    const baseWhere = treatmentId
      ? and(eq(aligners.patientId, patientId), eq(aligners.treatmentId, treatmentId as string))
      : eq(aligners.patientId, patientId)

    const result = await db
      .select()
      .from(aligners)
      .where(baseWhere)
      .orderBy(aligners.alignerNumber)

    console.log('📊 Alinhadores encontrados:', result.length)
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

    // ✅ SISTEMA DINÂMICO: Permite trocar a qualquer momento
    // A data REAL da troca é usada para recalcular o próximo alinhador
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

    // 🎯 Troca Pontual (apenas por dia): completar missão se trocou exatamente no dia previsto
    try {
      if (aligner.endDate && String(aligner.endDate) === String(todayStr)) {
        const tmplRows = await db
          .select()
          .from(mission_templates)
          .where(eq(mission_templates.name, 'Troca Pontual'))
          .limit(1)
        const tmpl = tmplRows[0] as any
        if (tmpl) {
          const pmRows = await db
            .select()
            .from(patient_missions)
            .where(
              and(
                eq(patient_missions.patientId, aligner.patientId),
                eq(patient_missions.missionTemplateId, tmpl.id),
                eq(patient_missions.triggerAlignerNumber, aligner.alignerNumber),
              )
            )
            .limit(1)
          const pm = pmRows[0] as any
          if (pm && pm.status !== 'completed') {
            await db
              .update(patient_missions)
              .set({
                status: 'completed',
                progress: pm.targetValue || 1,
                completedAt: new Date(),
                updatedAt: new Date(),
              } as any)
              .where(eq(patient_missions.id, pm.id))
          }
        }
      }
    } catch {
      // best-effort
    }

    // Finalizar quest do alinhador (aderência + recompensa) - best-effort
    try {
      await AlignerWearService.finalizeQuestForAligner(alignerId)
    } catch {
      // ignore
    }

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

      // ✅ ATIVAR PRÓXIMO ALINHADOR COM DATAS DINÂMICAS
      // Calcular data de término baseado no intervalo de troca e na data REAL da troca
      const changeInterval = nextAligner.changeInterval || 14
      const nextEndDate = new Date(todayStr)
      nextEndDate.setDate(nextEndDate.getDate() + changeInterval)
      const nextEndDateStr = nextEndDate.toISOString().slice(0, 10)

      await db
        .update(aligners)
        .set({
          status: 'active',
          startDate: todayStr,
          endDate: nextEndDateStr,
          updatedAt: new Date(),
        })
        .where(eq(aligners.id, nextAligner.id))

      // Inicializar quest + estado "em uso" para o próximo alinhador
      try {
        await AlignerWearService.ensureQuestForAligner(nextAligner as any)
        await AlignerWearService.ensureInitialWearingSession(nextAligner as any, aligner.patientId)
      } catch {
        // ignore
      }

      // 🎯 Ativar missões cujo gatilho é iniciar este alinhador
      await MissionProgressService.activateMissionsForAligner(aligner.patientId, nextAligner.alignerNumber)

      // 🎯 Atualizar missões de progresso do tratamento (ex.: Meio do Caminho)
      await MissionProgressService.updateTreatmentProgressMissions(aligner.patientId)

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
 * SISTEMA DINÂMICO: Define datas baseadas no momento real de início
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
    if (treatment.overallStatus === 'active' && treatment.currentAlignerOverall > 0) {
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

    // ✅ CALCULAR DATAS DINAMICAMENTE baseado no intervalo de troca
    const changeInterval = firstAligner.changeInterval || 14
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + changeInterval)
    const endDateStr = endDate.toISOString().slice(0, 10)

    // Ativar o primeiro alinhador COM DATAS REAIS
    await db
      .update(aligners)
      .set({
        status: 'active',
        startDate: today,
        endDate: endDateStr,
        updatedAt: new Date(),
      })
      .where(eq(aligners.id, firstAligner.id))

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

    // Atualizar o tratamento
    await db
      .update(treatments)
      .set({
        overallStatus: 'active',
        status: 'active',
        currentPhaseNumber: 1,
        currentAlignerOverall: firstPhase.startAlignerNumber,
        currentAlignerNumber: firstPhase.startAlignerNumber,
        startDate: today,
        updatedAt: new Date(),
      })
      .where(eq(treatments.id, treatmentId))

    // Inicializar quest + estado "em uso" para o primeiro alinhador
    try {
      await AlignerWearService.ensureQuestForAligner(firstAligner)
      await AlignerWearService.ensureInitialWearingSession(firstAligner, treatment.patientId)
    } catch {
      // best-effort
    }

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

    // Ativar missões de tratamento (frequency=once) no início do tratamento
    await db
      .update(patient_missions)
      .set({
        status: 'in_progress',
        startedAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(
        and(
          eq(patient_missions.patientId, treatment.patientId),
          eq(patient_missions.trigger, 'on_treatment_start'),
          eq(patient_missions.status, 'available')
        )
      )

    console.log(`✅ Tratamento ${treatmentId} iniciado - Alinhador ${firstPhase.startAlignerNumber} ativado (${today} até ${endDateStr})`)

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
        endDate: endDateStr,
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

    const targetRaw = aligner.status === 'active' ? aligner.endDate : aligner.startDate
    if (!targetRaw) {
      return res.json({
        canActivate: false,
        daysRemaining: 0,
        nextActivationDate: aligner.startDate,
        currentStatus: aligner.status,
        message: 'Alinhador sem data alvo (startDate/endDate) definida',
      })
    }

    const targetDate = new Date(targetRaw)
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
