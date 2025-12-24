/**
 * Script para verificar idioma de pacientes
 */

import { db, users } from '../db/index'
import { eq, or } from 'drizzle-orm'

async function checkPatientLanguages() {
  try {
    console.log('🔍 Verificando idiomas dos pacientes...\n')

    const patients = await db
      .select({
        id: users.id,
        fullName: users.fullName,
        email: users.email,
        preferredLanguage: users.preferredLanguage,
        role: users.role,
      })
      .from(users)
      .where(or(eq(users.role, 'patient'), eq(users.role, 'child-patient')))
      .orderBy(users.createdAt)

    if (patients.length === 0) {
      console.log('❌ Nenhum paciente encontrado')
      return
    }

    console.log(`✅ Encontrados ${patients.length} pacientes:\n`)

    for (const patient of patients) {
      console.log(`📋 ${patient.fullName}`)
      console.log(`   Email: ${patient.email}`)
      console.log(`   Idioma: ${patient.preferredLanguage || 'pt-BR (padrão)'}`)
      console.log(`   Role: ${patient.role}`)
      console.log('')
    }

    // Estatísticas
    const languageStats: Record<string, number> = {}
    patients.forEach((p) => {
      const lang = p.preferredLanguage || 'pt-BR'
      languageStats[lang] = (languageStats[lang] || 0) + 1
    })

    console.log('📊 Estatísticas de idiomas:')
    Object.entries(languageStats).forEach(([lang, count]) => {
      console.log(`   ${lang}: ${count} paciente(s)`)
    })
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }

  process.exit(0)
}

checkPatientLanguages()
