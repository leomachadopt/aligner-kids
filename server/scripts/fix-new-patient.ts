/**
 * Script para corrigir alinhadores da nova paciente
 */

import 'dotenv/config'
import { db, aligners, treatments } from '../db/index'
import { eq } from 'drizzle-orm'

async function fixNewPatient() {
  console.log('🔧 Corrigindo alinhadores da nova paciente...\n')

  try {
    const patientId = 'user-1765557690911' // Nova Heleninha
    const treatmentId = 'treatment-1765557701185'

    // Deletar alinhador incorreto
    const existing = await db
      .select()
      .from(aligners)
      .where(eq(aligners.patientId, patientId))

    console.log(`📊 Removendo ${existing.length} alinhador(es) incorreto(s)...`)
    for (const a of existing) {
      await db.delete(aligners).where(eq(aligners.id, a.id))
    }
    console.log('')

    const now = new Date()
    const formatDate = (date: Date) => date.toISOString().slice(0, 10)
    const daysPerAligner = 14

    console.log('✅ Criando 4 alinhadores corretos...\n')

    // Criar os 4 alinhadores
    for (let i = 1; i <= 4; i++) {
      const startDate = new Date(now)
      startDate.setDate(now.getDate() + (i - 1) * daysPerAligner)

      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + daysPerAligner - 1)

      await db.insert(aligners).values({
        id: `aligner-${Date.now()}-${i}`,
        patientId,
        treatmentId,
        alignerNumber: i,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        actualEndDate: null,
        status: i === 1 ? 'active' : 'pending',
        usageHours: 0,
        targetHoursPerDay: 22,
        notes: null,
      })

      console.log(`   ✅ Alinhador #${i} criado (${i === 1 ? 'ATIVO' : 'PENDENTE'})`)
      console.log(`      Período: ${formatDate(startDate)} → ${formatDate(endDate)}`)

      // Delay para IDs únicos
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    console.log('')
    console.log('=' .repeat(80))
    console.log('✅ CORREÇÃO CONCLUÍDA!')
    console.log('   Alinhadores #1, #2, #3, #4 criados corretamente')

  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }

  process.exit(0)
}

fixNewPatient()
