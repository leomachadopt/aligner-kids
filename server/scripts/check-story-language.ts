/**
 * Script para verificar idioma das histórias geradas
 */

import { db, stories, story_chapters, users } from '../db/index'
import { eq } from 'drizzle-orm'

async function checkStoryLanguage() {
  try {
    // Buscar paciente Matheus (pt-PT)
    const patient = await db
      .select()
      .from(users)
      .where(eq(users.email, 'matheus@gmail.com'))
      .limit(1)

    if (patient.length === 0) {
      console.log('❌ Paciente não encontrado')
      return
    }

    console.log(`\n📋 Paciente: ${patient[0].fullName}`)
    console.log(`   Idioma configurado: ${patient[0].preferredLanguage}\n`)

    // Buscar história do paciente
    const story = await db
      .select()
      .from(stories)
      .where(eq(stories.patientId, patient[0].id))
      .limit(1)

    if (story.length === 0) {
      console.log('❌ Nenhuma história encontrada para este paciente')
      return
    }

    console.log(`📚 História: ${story[0].title}`)
    console.log(`   Capítulos: ${story[0].totalChapters}\n`)

    // Buscar primeiro capítulo
    const chapters = await db
      .select()
      .from(story_chapters)
      .where(eq(story_chapters.storyId, story[0].id))
      .orderBy(story_chapters.chapterNumber)
      .limit(1)

    if (chapters.length === 0) {
      console.log('❌ Nenhum capítulo encontrado')
      return
    }

    const chapter = chapters[0]
    console.log(`📖 Capítulo ${chapter.chapterNumber}: ${chapter.title}`)
    console.log(`\n📝 Conteúdo (primeiras 500 palavras):\n`)
    console.log('─'.repeat(60))

    const words = chapter.content.split(/\s+/)
    const preview = words.slice(0, 100).join(' ')
    console.log(preview)
    console.log('─'.repeat(60))

    console.log(`\n🔍 Análise linguística:`)

    // Palavras características de pt-PT vs pt-BR
    const ptPTWords = ['miúdo', 'miúda', 'puto', 'pita', 'autocarro', 'comboio', 'ecrã', 'telemóvel', 'casa de banho']
    const ptBRWords = ['garoto', 'garota', 'menino', 'menina', 'ônibus', 'trem', 'tela', 'celular', 'banheiro']

    const content = chapter.content.toLowerCase()

    let ptPTCount = 0
    let ptBRCount = 0

    ptPTWords.forEach(word => {
      if (content.includes(word.toLowerCase())) {
        console.log(`   ✅ pt-PT: "${word}"`)
        ptPTCount++
      }
    })

    ptBRWords.forEach(word => {
      if (content.includes(word.toLowerCase())) {
        console.log(`   ⚠️  pt-BR: "${word}"`)
        ptBRCount++
      }
    })

    if (ptPTCount === 0 && ptBRCount === 0) {
      console.log(`   ℹ️  Nenhuma palavra característica encontrada (texto neutro ou amostra pequena)`)
    }

    // Verificar áudio
    if (chapter.audioUrl) {
      console.log(`\n🎵 Áudio disponível: ${chapter.audioUrl}`)
      console.log(`   Duração estimada: ${chapter.audioDurationSeconds || 'N/A'}s`)
    } else {
      console.log(`\n❌ Sem áudio gerado`)
    }
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }

  process.exit(0)
}

checkStoryLanguage()
