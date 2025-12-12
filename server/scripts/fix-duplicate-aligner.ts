/**
 * Remove alinhador #3 duplicado
 */

import 'dotenv/config'
import { db, aligners } from '../db/index'
import { eq } from 'drizzle-orm'

async function fixDuplicate() {
  try {
    const patientId = 'user-1765564876188'

    // Buscar todos os alinhadores
    const allAligners = await db
      .select()
      .from(aligners)
      .where(eq(aligners.patientId, patientId))

    console.log(`\n📊 Alinhadores atuais:`)
    allAligners.forEach(a => {
      const icon = a.status === 'active' ? '🟢' : '⚪'
      console.log(`   ${icon} #${a.alignerNumber}: ${a.status} | ID: ${a.id}`)
    })

    // Encontrar alinhador #3 duplicado (ativo)
    const duplicates = allAligners.filter(a => a.alignerNumber === 3)

    if (duplicates.length > 1) {
      const activeOne = duplicates.find(a => a.status === 'active')
      if (activeOne) {
        console.log(`\n🗑️  Removendo alinhador #3 duplicado (ativo): ${activeOne.id}`)
        await db.delete(aligners).where(eq(aligners.id, activeOne.id))
        console.log('✅ Duplicata removida!')
      }
    } else {
      console.log('\n⚠️  Nenhuma duplicata encontrada')
    }

  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }

  process.exit(0)
}

fixDuplicate()
