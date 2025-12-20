import { db, treatments, treatment_phases, aligners } from '../db/index'
import { eq } from 'drizzle-orm'

async function fixPhaseData() {
  const treatmentId = 'treatment-1766151504165'
  
  console.log('🔧 Corrigindo dados do tratamento:', treatmentId)
  
  // Buscar fase
  const phases = await db
    .select()
    .from(treatment_phases)
    .where(eq(treatment_phases.treatmentId, treatmentId))
  
  if (phases.length === 0) {
    console.log('❌ Nenhuma fase encontrada')
    return
  }
  
  const phase = phases[0]
  console.log(`\n📦 Fase encontrada: "${phase.phaseName}" (phaseNumber: ${phase.phaseNumber})`)
  
  // Buscar alinhadores do tratamento
  const treatmentAligners = await db
    .select()
    .from(aligners)
    .where(eq(aligners.treatmentId, treatmentId))
    .orderBy(aligners.alignerNumber)
  
  console.log(`\n🔢 Encontrados ${treatmentAligners.length} alinhadores`)
  
  if (treatmentAligners.length === 0) {
    console.log('❌ Nenhum alinhador encontrado')
    return
  }
  
  const firstAligner = treatmentAligners[0]
  const lastAligner = treatmentAligners[treatmentAligners.length - 1]
  
  // Corrigir nome e números da fase
  console.log(`\n✏️  Atualizando fase...`)
  await db
    .update(treatment_phases)
    .set({
      phaseName: 'Fase 1',
      startAlignerNumber: firstAligner.alignerNumber,
      endAlignerNumber: lastAligner.alignerNumber,
      totalAlignersInPhase: treatmentAligners.length,
      status: 'active',
      updatedAt: new Date(),
    })
    .where(eq(treatment_phases.id, phase.id))
  
  console.log(`✅ Fase atualizada: "Fase 1" com alinhadores #${firstAligner.alignerNumber} a #${lastAligner.alignerNumber}`)
  
  // Vincular alinhadores à fase
  console.log(`\n🔗 Vinculando ${treatmentAligners.length} alinhadores à fase...`)
  for (const aligner of treatmentAligners) {
    await db
      .update(aligners)
      .set({ phaseId: phase.id })
      .where(eq(aligners.id, aligner.id))
  }
  console.log(`✅ Alinhadores vinculados à fase`)
  
  // Atualizar tratamento
  console.log(`\n📋 Atualizando tratamento...`)
  await db
    .update(treatments)
    .set({
      totalPhasesPlanned: 1,
      currentPhaseNumber: 1,
      totalAlignersOverall: treatmentAligners.length,
      totalAligners: treatmentAligners.length,
    })
    .where(eq(treatments.id, treatmentId))
  
  console.log(`✅ Tratamento atualizado`)
  console.log(`\n✨ Correção concluída!`)
}

fixPhaseData().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
