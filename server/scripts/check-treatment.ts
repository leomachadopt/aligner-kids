import { db, treatments, treatment_phases, aligners } from '../db/index'
import { eq } from 'drizzle-orm'

async function checkTreatment() {
  const treatmentId = 'treatment-1766151504165'
  
  console.log('📋 Verificando tratamento:', treatmentId)
  
  const treatment = await db.select().from(treatments).where(eq(treatments.id, treatmentId))
  console.log('\n🏥 Tratamento:')
  console.log(JSON.stringify(treatment[0], null, 2))
  
  const phases = await db
    .select()
    .from(treatment_phases)
    .where(eq(treatment_phases.treatmentId, treatmentId))
    .orderBy(treatment_phases.phaseNumber)
  
  console.log('\n📦 Fases:')
  phases.forEach(phase => {
    console.log(`  Fase ${phase.phaseNumber}: ${phase.phaseName}`)
    console.log(`    Alinhadores: #${phase.startAlignerNumber} a #${phase.endAlignerNumber}`)
    console.log(`    Status: ${phase.status}`)
    console.log(`    ID: ${phase.id}`)
  })
  
  const treatmentAligners = await db
    .select()
    .from(aligners)
    .where(eq(aligners.treatmentId, treatmentId))
    .orderBy(aligners.alignerNumber)
  
  console.log(`\n🔢 Alinhadores (${treatmentAligners.length} total):`)
  treatmentAligners.slice(0, 5).forEach(aligner => {
    console.log(`  #${aligner.alignerNumber}: phaseId=${aligner.phaseId}, status=${aligner.status}`)
  })
  if (treatmentAligners.length > 5) {
    console.log(`  ... e mais ${treatmentAligners.length - 5} alinhadores`)
  }
}

checkTreatment().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1) })
