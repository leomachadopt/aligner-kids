/**
 * Script para limpar alinhador #4 duplicado
 */

import 'dotenv/config'
import { db, aligners } from '../db/index'
import { eq } from 'drizzle-orm'

async function fixDuplicates() {
  console.log('🔧 Corrigindo alinhadores duplicados...\n')

  try {
    const patientId = 'user-1765558820072'

    // Buscar todos os alinhadores
    const allAligners = await db
      .select()
      .from(aligners)
      .where(eq(aligners.patientId, patientId))

    console.log(`📊 Total de alinhadores: ${allAligners.length}`)
    allAligners.forEach(a => {
      console.log(`   ${a.alignerNumber}: ${a.status} (${a.startDate} → ${a.endDate}) ID: ${a.id}`)
    })
    console.log('')

    // Encontrar o alinhador #4 ativo duplicado (data errada: 12-12)
    const duplicateAligner4 = allAligners.find(
      a => a.alignerNumber === 4 && a.status === 'active' && a.startDate === '2025-12-12'
    )

    if (duplicateAligner4) {
      console.log(`🗑️  Removendo alinhador #4 duplicado (ID: ${duplicateAligner4.id})`)
      await db.delete(aligners).where(eq(aligners.id, duplicateAligner4.id))
      console.log('✅ Duplicata removida!')
    } else {
      console.log('⚠️  Nenhuma duplicata encontrada')
    }

    console.log('')
    console.log('=' .repeat(80))
    console.log('✅ Limpeza concluída!')

  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }

  process.exit(0)
}

fixDuplicates()
