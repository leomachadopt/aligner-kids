/**
 * Script para adicionar Fase 1 automaticamente para tratamentos sem fases
 */
import { db, treatments, aligners, treatment_phases } from '../db/index'
import { eq } from 'drizzle-orm'

async function addMissingPhase1() {
  console.log('🔍 Buscando tratamentos sem fases...')

  // Buscar todos os tratamentos
  const allTreatments = await db.select().from(treatments)

  for (const treatment of allTreatments) {
    // Verificar se o tratamento tem fases
    const phases = await db
      .select()
      .from(treatment_phases)
      .where(eq(treatment_phases.treatmentId, treatment.id))

    if (phases.length === 0) {
      console.log(`📦 Tratamento ${treatment.id} não tem fases. Criando Fase 1...`)

      // Buscar alinhadores do tratamento
      const treatmentAligners = await db
        .select()
        .from(aligners)
        .where(eq(aligners.treatmentId, treatment.id))
        .orderBy(aligners.alignerNumber)

      if (treatmentAligners.length === 0) {
        console.log(`  ⚠️  Tratamento sem alinhadores, pulando...`)
        continue
      }

      const firstAligner = treatmentAligners[0]
      const lastAligner = treatmentAligners[treatmentAligners.length - 1]

      // Criar Fase 1
      const phase1 = await db
        .insert(treatment_phases)
        .values({
          id: `phase-${Date.now()}-${treatment.id}`,
          treatmentId: treatment.id,
          phaseNumber: 1,
          phaseName: 'Fase 1',
          startAlignerNumber: firstAligner.alignerNumber,
          endAlignerNumber: lastAligner.alignerNumber,
          totalAlignersInPhase: treatmentAligners.length,
          currentAlignerNumber: treatment.currentAlignerNumber || 1,
          status: 'active',
          startDate: treatment.startDate,
          expectedEndDate: lastAligner.endDate,
          notes: 'Fase inicial criada automaticamente via migração',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning()

      console.log(`  ✅ Fase 1 criada: ${treatmentAligners.length} alinhadores (#${firstAligner.alignerNumber} a #${lastAligner.alignerNumber})`)

      // Atualizar todos os alinhadores para vincular com a fase
      for (const aligner of treatmentAligners) {
        await db
          .update(aligners)
          .set({ phaseId: phase1[0].id })
          .where(eq(aligners.id, aligner.id))
      }

      // Verificar se existem outras fases (criadas depois)
      const allPhasesNow = await db
        .select()
        .from(treatment_phases)
        .where(eq(treatment_phases.treatmentId, treatment.id))

      const maxPhaseNumber = Math.max(...allPhasesNow.map(p => p.phaseNumber))
      const maxAlignerNumber = Math.max(...allPhasesNow.map(p => p.endAlignerNumber))

      // Atualizar o tratamento
      await db
        .update(treatments)
        .set({
          totalPhasesPlanned: maxPhaseNumber,
          currentPhaseNumber: 1,
          totalAlignersOverall: maxAlignerNumber,
          currentAlignerOverall: treatment.currentAlignerNumber || 1,
          overallStatus: treatment.status || 'active',
        })
        .where(eq(treatments.id, treatment.id))

      console.log(`  ✅ ${treatmentAligners.length} alinhadores vinculados à Fase 1`)
    } else {
      console.log(`✓ Tratamento ${treatment.id} já tem ${phases.length} fase(s)`)
    }
  }

  console.log('\n✅ Migração concluída!')
}

addMissingPhase1()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Erro na migração:', error)
    process.exit(1)
  })
