/**
 * Script para testar criação de tratamento
 */

import 'dotenv/config'
import { db, users, treatments, aligners } from '../db/index'
import { eq } from 'drizzle-orm'

async function testCreateTreatment() {
  try {
    console.log('🧪 TESTE: Criando paciente e tratamento\n')

    // 1. Criar paciente de teste
    const patientId = `test-patient-${Date.now()}`
    await db.insert(users).values({
      id: patientId,
      email: `${patientId}@test.com`,
      password_hash: 'test',
      role: 'patient',
      fullName: 'Paciente Teste',
      isApproved: true,
      isActive: true,
    })
    console.log(`✅ Paciente criado: ${patientId}\n`)

    // 2. Criar tratamento (simula POST /api/treatments)
    const startDate = new Date().toISOString().slice(0, 10)
    const totalAligners = 4
    const daysPerAligner = 14

    const newTreatment = await db
      .insert(treatments)
      .values({
        id: `treatment-${Date.now()}`,
        patientId,
        startDate,
        expectedEndDate: null,
        totalAligners,
        currentAlignerNumber: 1,
        status: 'active',
      })
      .returning()

    const treatment = newTreatment[0]
    console.log(`✅ Tratamento criado: ${treatment.id}`)
    console.log(`   Status: ${treatment.status}`)
    console.log(`   Alinhador atual: ${treatment.currentAlignerNumber}/${treatment.totalAligners}\n`)

    // 3. Criar alinhadores automaticamente
    const alignersToCreate = []

    for (let i = 1; i <= totalAligners; i++) {
      const alignerStartDate = new Date(startDate)
      alignerStartDate.setDate(alignerStartDate.getDate() + (i - 1) * daysPerAligner)

      const alignerEndDate = new Date(alignerStartDate)
      alignerEndDate.setDate(alignerEndDate.getDate() + daysPerAligner - 1)

      alignersToCreate.push({
        id: `aligner-${Date.now()}-${i}`,
        patientId,
        treatmentId: treatment.id,
        alignerNumber: i,
        startDate: alignerStartDate.toISOString().slice(0, 10),
        endDate: alignerEndDate.toISOString().slice(0, 10),
        actualEndDate: null,
        status: i === 1 ? 'active' : 'pending',
        usageHours: 0,
        targetHoursPerDay: 22,
        notes: null,
      })

      await new Promise(resolve => setTimeout(resolve, 5))
    }

    await db.insert(aligners).values(alignersToCreate)
    console.log(`✅ ${totalAligners} alinhadores criados\n`)

    // 4. Buscar e verificar
    const createdAligners = await db
      .select()
      .from(aligners)
      .where(eq(aligners.patientId, patientId))
      .orderBy(aligners.alignerNumber)

    console.log('📋 ALINHADORES CRIADOS:')
    createdAligners.forEach(a => {
      const statusIcon = a.status === 'active' ? '🟢' : '⚪'
      console.log(`   ${statusIcon} #${a.alignerNumber}: ${a.status.toUpperCase()} | ${a.startDate} → ${a.endDate}`)
    })
    console.log('')

    // Verificar se APENAS o primeiro está ativo
    const activeAligners = createdAligners.filter(a => a.status === 'active')
    console.log(`\n🔍 VERIFICAÇÃO:`)
    console.log(`   Total de alinhadores: ${createdAligners.length}`)
    console.log(`   Alinhadores ativos: ${activeAligners.length}`)

    if (activeAligners.length === 1 && activeAligners[0].alignerNumber === 1) {
      console.log(`   ✅ CORRETO: Apenas alinhador #1 está ativo`)
    } else {
      console.log(`   ❌ ERRO: ${activeAligners.length} alinhadores ativos (deveria ser 1)`)
      activeAligners.forEach(a => {
        console.log(`      - Alinhador #${a.alignerNumber} está ativo`)
      })
    }

    console.log(`\n💡 Para limpar o teste, execute:`)
    console.log(`   npx tsx server/scripts/delete-treatment.ts ${treatment.id}`)

  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }

  process.exit(0)
}

testCreateTreatment()
