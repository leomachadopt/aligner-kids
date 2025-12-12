/**
 * Script para verificar alinhadores no banco
 */

import 'dotenv/config'
import { db, aligners, treatments } from '../db/index'
import { eq } from 'drizzle-orm'

async function checkAligners() {
  console.log('🔍 Verificando alinhadores...\n')

  try {
    // Buscar tratamento da Heleninha
    const patientId = 'user-1765557138580'

    const treatment = await db
      .select()
      .from(treatments)
      .where(eq(treatments.patientId, patientId))
      .limit(1)

    if (treatment.length === 0) {
      console.log('❌ Tratamento não encontrado')
      process.exit(1)
    }

    const t = treatment[0]
    console.log('💊 TRATAMENTO:')
    console.log(`   ID: ${t.id}`)
    console.log(`   Total Alinhadores: ${t.totalAligners}`)
    console.log(`   Alinhador Atual: ${t.currentAlignerNumber}`)
    console.log(`   Status: ${t.status}`)
    console.log('')

    // Buscar alinhadores
    const allAligners = await db
      .select()
      .from(aligners)
      .where(eq(aligners.patientId, patientId))

    console.log(`🦷 ALINHADORES: ${allAligners.length}`)
    allAligners.forEach((a) => {
      const isCurrent = a.alignerNumber === t.currentAlignerNumber
      console.log(`   ${isCurrent ? '👉' : '  '} #${a.alignerNumber}:`)
      console.log(`      Status: ${a.status}`)
      console.log(`      Start: ${a.startDate}`)
      console.log(`      End: ${a.endDate}`)
      console.log(`      Actual End: ${a.actualEndDate || 'N/A'}`)
      console.log('')
    })

  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }

  process.exit(0)
}

checkAligners()
