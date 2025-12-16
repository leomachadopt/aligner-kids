/**
 * Migration Script: Convert existing treatments to new phase-based structure
 *
 * This script:
 * 1. Converts existing treatments to the container model
 * 2. Creates a phase for each existing treatment
 * 3. Updates aligners to reference the new phase
 *
 * Run with: npx tsx server/scripts/migrate-to-phases.ts
 */

import dotenv from 'dotenv'
dotenv.config()

import { db, treatments, treatment_phases, aligners } from '../db/index'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

async function migrateToPhases() {
  console.log('🔄 Starting migration to phase-based structure...\n')

  try {
    // 1. Get all existing treatments
    const existingTreatments = await db.select().from(treatments)
    console.log(`📊 Found ${existingTreatments.length} treatments to migrate\n`)

    for (const treatment of existingTreatments) {
      console.log(`\n📦 Processing treatment: ${treatment.id}`)
      console.log(`   Patient: ${treatment.patientId}`)

      // Check if already migrated (has phases)
      const existingPhases = await db
        .select()
        .from(treatment_phases)
        .where(eq(treatment_phases.treatmentId, treatment.id))

      if (existingPhases.length > 0) {
        console.log(`   ⏭️  Already migrated (${existingPhases.length} phases found), skipping...`)
        continue
      }

      // 2. Update treatment to be a container
      const totalAligners = treatment.totalAligners || 20
      const currentAligner = treatment.currentAlignerNumber || 1

      await db
        .update(treatments)
        .set({
          overallStatus: treatment.status || 'active',
          totalPhasesPlanned: 1,
          currentPhaseNumber: 1,
          totalAlignersOverall: totalAligners,
          currentAlignerOverall: currentAligner,
          name: treatment.name || `Tratamento - ${treatment.patientId}`,
        })
        .where(eq(treatments.id, treatment.id))

      console.log(`   ✅ Updated treatment to container model`)

      // 3. Create initial phase from existing treatment data
      const phaseId = nanoid()
      const phase = {
        id: phaseId,
        treatmentId: treatment.id,
        phaseNumber: 1,
        phaseName: 'Fase 1',
        description: 'Fase inicial do tratamento',
        startAlignerNumber: 1,
        endAlignerNumber: totalAligners,
        totalAligners: totalAligners,
        currentAlignerNumber: currentAligner,
        status: treatment.status || 'active',
        startDate: treatment.startDate,
        expectedEndDate: treatment.expectedEndDate,
      }

      await db.insert(treatment_phases).values(phase)
      console.log(`   ✅ Created Phase 1 (aligners #1 to #${totalAligners})`)

      // 4. Update aligners to reference the new phase
      const treatmentAligners = await db
        .select()
        .from(aligners)
        .where(eq(aligners.treatmentId, treatment.id))

      console.log(`   📎 Updating ${treatmentAligners.length} aligners...`)

      for (const aligner of treatmentAligners) {
        await db
          .update(aligners)
          .set({
            phaseId: phaseId,
            alignerNumberInPhase: aligner.alignerNumber, // Same number for single phase
          })
          .where(eq(aligners.id, aligner.id))
      }

      console.log(`   ✅ Updated ${treatmentAligners.length} aligners to reference phase`)
      console.log(`   ✨ Migration complete for treatment ${treatment.id}`)
    }

    console.log('\n\n✅ Migration completed successfully!')
    console.log(`📊 Summary: ${existingTreatments.length} treatments processed\n`)

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    throw error
  }
}

// Run migration
migrateToPhases()
  .then(() => {
    console.log('🎉 All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
