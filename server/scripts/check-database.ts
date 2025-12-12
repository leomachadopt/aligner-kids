/**
 * Script para verificar dados completos no banco
 */

import 'dotenv/config'
import { db, stories, story_chapters, treatments, users } from '../db/index'

async function checkDatabase() {
  console.log('🔍 Verificando dados no banco de dados...\n')

  try {
    // Verificar usuários (pacientes)
    const allUsers = await db.select().from(users)
    console.log(`👤 USUÁRIOS: ${allUsers.length}`)
    allUsers.forEach((u) => {
      console.log(`   - ${u.fullName} (${u.role}) - ID: ${u.id}`)
    })
    console.log('')

    // Verificar tratamentos
    const allTreatments = await db.select().from(treatments)
    console.log(`💊 TRATAMENTOS: ${allTreatments.length}`)
    allTreatments.forEach((t) => {
      console.log(`   - Patient: ${t.patientId}`)
      console.log(`     Total Alinhadores: ${t.totalAligners}`)
      console.log(`     Alinhador Atual: ${t.currentAlignerNumber}`)
      console.log(`     Status: ${t.status}`)
      console.log('')
    })

    // Verificar histórias
    const allStories = await db.select().from(stories)
    console.log(`📚 HISTÓRIAS (STORIES): ${allStories.length}`)
    allStories.forEach((s) => {
      console.log(`   - ID: ${s.id}`)
      console.log(`     Patient: ${s.patientId}`)
      console.log(`     Título: ${s.title || s.storyTitle || 'Sem título'}`)
      console.log(`     Total Capítulos: ${s.totalChapters}`)
      console.log(`     Capítulo Atual: ${s.currentChapter}`)
      console.log('')
    })

    // Verificar capítulos
    const allChapters = await db.select().from(story_chapters)
    console.log(`📖 CAPÍTULOS (STORY_CHAPTERS): ${allChapters.length}`)
    if (allChapters.length > 0) {
      allChapters.forEach((ch) => {
        console.log(`   - Capítulo ${ch.chapterNumber}: ${ch.title}`)
        console.log(`     Story ID: ${ch.storyId}`)
        console.log(`     Required Aligner: ${ch.requiredAlignerNumber}`)
        console.log(`     Unlocked: ${ch.isUnlocked}`)
        console.log('')
      })
    } else {
      console.log('   (nenhum capítulo encontrado)')
    }

    console.log('\n' + '='.repeat(80))
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }

  process.exit(0)
}

checkDatabase()
