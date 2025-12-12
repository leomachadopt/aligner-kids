/**
 * Script para corrigir alinhadores faltantes
 */

import 'dotenv/config'
import { db, aligners, treatments } from '../db/index'
import { eq } from 'drizzle-orm'

async function fixAligners() {
  console.log('🔧 Corrigindo alinhadores...\n')

  try {
    const patientId = 'user-1765557138580'
    const treatmentId = 'treatment-1765557152124'

    // Buscar alinhador existente
    const existing = await db
      .select()
      .from(aligners)
      .where(eq(aligners.patientId, patientId))

    console.log(`📊 Alinhadores existentes: ${existing.length}`)
    existing.forEach(a => console.log(`   - #${a.alignerNumber}: ${a.status}`))
    console.log('')

    // Data de hoje
    const today = new Date()
    const formatDate = (date: Date) => date.toISOString().split('T')[0]

    // Calcular datas (14 dias cada alinhador)
    const aligner1Start = new Date(today)
    const aligner1End = new Date(today.setDate(today.getDate() + 14))

    const aligner2Start = new Date(aligner1End)
    aligner2Start.setDate(aligner2Start.getDate() + 1)
    const aligner2End = new Date(aligner2Start)
    aligner2End.setDate(aligner2End.getDate() + 14)

    const aligner3Start = new Date(aligner2End)
    aligner3Start.setDate(aligner3Start.getDate() + 1)
    const aligner3End = new Date(aligner3Start)
    aligner3End.setDate(aligner3End.getDate() + 14)

    console.log('📅 Criando alinhadores corrigidos...\n')

    // Deletar alinhador #3 existente (vamos recriar todos)
    if (existing.length > 0) {
      console.log('🗑️  Removendo alinhadores incorretos...')
      for (const a of existing) {
        await db.delete(aligners).where(eq(aligners.id, a.id))
      }
      console.log('')
    }

    // Criar Alinhador #1 (ativo)
    const now = new Date()
    const aligner1Data = {
      id: `aligner-${Date.now()}-1`,
      patientId,
      treatmentId,
      alignerNumber: 1,
      startDate: formatDate(new Date()), // Começa hoje
      endDate: formatDate(new Date(now.setDate(now.getDate() + 14))),
      status: 'active' as const,
      targetHoursPerDay: 22,
      usageHours: 0,
    }

    await db.insert(aligners).values(aligner1Data)
    console.log(`✅ Alinhador #1 criado (ATIVO)`)
    console.log(`   Período: ${aligner1Data.startDate} até ${aligner1Data.endDate}`)
    console.log('')

    // Aguardar 10ms para IDs únicos
    await new Promise(resolve => setTimeout(resolve, 10))

    // Criar Alinhador #2 (pendente)
    const aligner2StartDate = new Date(aligner1Data.endDate)
    aligner2StartDate.setDate(aligner2StartDate.getDate() + 1)
    const aligner2EndDate = new Date(aligner2StartDate)
    aligner2EndDate.setDate(aligner2EndDate.getDate() + 14)

    const aligner2Data = {
      id: `aligner-${Date.now()}-2`,
      patientId,
      treatmentId,
      alignerNumber: 2,
      startDate: formatDate(aligner2StartDate),
      endDate: formatDate(aligner2EndDate),
      status: 'pending' as const,
      targetHoursPerDay: 22,
      usageHours: 0,
    }

    await db.insert(aligners).values(aligner2Data)
    console.log(`✅ Alinhador #2 criado (PENDENTE)`)
    console.log(`   Período: ${aligner2Data.startDate} até ${aligner2Data.endDate}`)
    console.log('')

    // Aguardar 10ms para IDs únicos
    await new Promise(resolve => setTimeout(resolve, 10))

    // Criar Alinhador #3 (pendente)
    const aligner3StartDate = new Date(aligner2Data.endDate)
    aligner3StartDate.setDate(aligner3StartDate.getDate() + 1)
    const aligner3EndDate = new Date(aligner3StartDate)
    aligner3EndDate.setDate(aligner3EndDate.getDate() + 14)

    const aligner3Data = {
      id: `aligner-${Date.now()}-3`,
      patientId,
      treatmentId,
      alignerNumber: 3,
      startDate: formatDate(aligner3StartDate),
      endDate: formatDate(aligner3EndDate),
      status: 'pending' as const,
      targetHoursPerDay: 22,
      usageHours: 0,
    }

    await db.insert(aligners).values(aligner3Data)
    console.log(`✅ Alinhador #3 criado (PENDENTE)`)
    console.log(`   Período: ${aligner3Data.startDate} até ${aligner3Data.endDate}`)
    console.log('')

    // Atualizar tratamento
    await db
      .update(treatments)
      .set({ currentAlignerNumber: 1 })
      .where(eq(treatments.id, treatmentId))

    console.log('✅ Tratamento atualizado: currentAlignerNumber = 1')
    console.log('')
    console.log('=' .repeat(80))
    console.log('✅ CORREÇÃO CONCLUÍDA!')
    console.log('   - Alinhador #1: ATIVO (atual)')
    console.log('   - Alinhador #2: PENDENTE')
    console.log('   - Alinhador #3: PENDENTE')

  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }

  process.exit(0)
}

fixAligners()
