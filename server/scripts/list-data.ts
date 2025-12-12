/**
 * Script para listar todos os dados do banco
 */

import 'dotenv/config'
import { db, users, treatments, aligners } from '../db/index'
import { desc } from 'drizzle-orm'

async function listData() {
  try {
    console.log('='.repeat(80))
    console.log('📊 DADOS DO BANCO')
    console.log('='.repeat(80))
    console.log('')

    // Listar pacientes mais recentes
    const allUsers = await db
      .select()
      .from(users)
      .where()
      .orderBy(desc(users.createdAt))
      .limit(5)

    console.log('👥 PACIENTES (últimos 5):')
    allUsers.forEach(u => {
      console.log(`   ${u.id} | ${u.name} | ${u.role} | ${u.createdAt}`)
    })
    console.log('')

    // Listar tratamentos mais recentes
    const allTreatments = await db
      .select()
      .from(treatments)
      .orderBy(desc(treatments.createdAt))
      .limit(10)

    console.log('💊 TRATAMENTOS (últimos 10):')
    allTreatments.forEach(t => {
      console.log(`   ${t.id}`)
      console.log(`      Paciente: ${t.patientId}`)
      console.log(`      Status: ${t.status} | Atual: ${t.currentAlignerNumber}/${t.totalAligners}`)
      console.log(`      Criado: ${t.createdAt}`)
      console.log('')
    })

    // Listar alinhadores mais recentes
    const allAligners = await db
      .select()
      .from(aligners)
      .orderBy(desc(aligners.createdAt))
      .limit(20)

    console.log('🦷 ALINHADORES (últimos 20):')
    const byPatient: Record<string, any[]> = {}
    allAligners.forEach(a => {
      if (!byPatient[a.patientId]) byPatient[a.patientId] = []
      byPatient[a.patientId].push(a)
    })

    Object.entries(byPatient).forEach(([patientId, als]) => {
      console.log(`   Paciente: ${patientId}`)
      als.forEach(a => {
        console.log(`      #${a.alignerNumber}: ${a.status} | ${a.startDate} → ${a.endDate} | ID: ${a.id.substring(0, 20)}...`)
      })
      console.log('')
    })

    console.log('='.repeat(80))
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }

  process.exit(0)
}

listData()
