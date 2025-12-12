/**
 * Script para deletar tratamento (útil para testes)
 * Uso: npx tsx server/scripts/delete-treatment.ts <treatmentId>
 */

import 'dotenv/config'
import { db, treatments, aligners, stories, story_chapters } from '../db/index'
import { eq } from 'drizzle-orm'

async function deleteTreatment(treatmentId?: string) {
  try {
    // Se não passar ID, deletar o último tratamento
    if (!treatmentId) {
      const allTreatments = await db.select().from(treatments)
      if (allTreatments.length === 0) {
        console.log('❌ Nenhum tratamento encontrado')
        process.exit(1)
      }
      // Pegar o mais recente
      treatmentId = allTreatments.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0].id
    }

    console.log(`🗑️  Deletando tratamento: ${treatmentId}\n`)

    // Buscar tratamento
    const treatment = await db
      .select()
      .from(treatments)
      .where(eq(treatments.id, treatmentId))
      .limit(1)

    if (treatment.length === 0) {
      console.log('❌ Tratamento não encontrado')
      process.exit(1)
    }

    const t = treatment[0]
    console.log(`📋 Tratamento:`)
    console.log(`   Paciente: ${t.patientId}`)
    console.log(`   Total Alinhadores: ${t.totalAligners}`)
    console.log(`   Status: ${t.status}`)
    console.log('')

    // 1. Deletar story_chapters relacionados
    const deletedChapters = await db
      .delete(story_chapters)
      .where(eq(story_chapters.treatmentId, treatmentId))
      .returning()
    console.log(`✅ ${deletedChapters.length} capítulos deletados`)

    // 2. Deletar stories relacionadas
    const deletedStories = await db
      .delete(stories)
      .where(eq(stories.treatmentId, treatmentId))
      .returning()
    console.log(`✅ ${deletedStories.length} histórias deletadas`)

    // 3. Deletar alinhadores
    const deletedAligners = await db
      .delete(aligners)
      .where(eq(aligners.treatmentId, treatmentId))
      .returning()
    console.log(`✅ ${deletedAligners.length} alinhadores deletados`)

    // 4. Deletar tratamento
    await db
      .delete(treatments)
      .where(eq(treatments.id, treatmentId))
    console.log(`✅ Tratamento deletado`)

    console.log('')
    console.log('✅ TUDO LIMPO! Pronto para criar novo tratamento.')

  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }

  process.exit(0)
}

const treatmentId = process.argv[2]
deleteTreatment(treatmentId)
