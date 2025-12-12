/**
 * Script para verificar todos os pacientes e seus tratamentos
 */

import 'dotenv/config'
import { db, users, treatments, aligners } from '../db/index'
import { eq } from 'drizzle-orm'

async function checkAllPatients() {
  console.log('🔍 Verificando todos os pacientes...\n')

  try {
    // Buscar todos os pacientes
    const patients = await db
      .select()
      .from(users)
      .where(eq(users.role, 'child-patient'))

    console.log(`👥 PACIENTES (child-patient): ${patients.length}\n`)

    for (const patient of patients) {
      console.log('─'.repeat(80))
      console.log(`👤 ${patient.fullName} (ID: ${patient.id})`)
      console.log(`   Email: ${patient.email}`)
      console.log(`   Criado: ${patient.createdAt}`)
      console.log('')

      // Buscar tratamento
      const patientTreatments = await db
        .select()
        .from(treatments)
        .where(eq(treatments.patientId, patient.id))

      if (patientTreatments.length === 0) {
        console.log('   ❌ SEM TRATAMENTO')
        console.log('')
        continue
      }

      const treatment = patientTreatments[0]
      console.log(`   💊 TRATAMENTO:`)
      console.log(`      ID: ${treatment.id}`)
      console.log(`      Total Alinhadores: ${treatment.totalAligners}`)
      console.log(`      Alinhador Atual: ${treatment.currentAlignerNumber}`)
      console.log(`      Status: ${treatment.status}`)
      console.log('')

      // Buscar alinhadores
      const patientAligners = await db
        .select()
        .from(aligners)
        .where(eq(aligners.patientId, patient.id))

      console.log(`   🦷 ALINHADORES: ${patientAligners.length}`)
      if (patientAligners.length === 0) {
        console.log('      ❌ NENHUM ALINHADOR CRIADO!')
      } else {
        patientAligners
          .sort((a, b) => a.alignerNumber - b.alignerNumber)
          .forEach((a) => {
            const isCurrent = a.alignerNumber === treatment.currentAlignerNumber
            console.log(`      ${isCurrent ? '👉' : '  '} #${a.alignerNumber}: ${a.status} (${a.startDate} → ${a.endDate})`)
          })
      }
      console.log('')
    }

    console.log('═'.repeat(80))
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }

  process.exit(0)
}

checkAllPatients()
