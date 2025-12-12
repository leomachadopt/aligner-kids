/**
 * Script para gerar áudio para capítulos existentes
 * Uso: npx tsx server/scripts/generate-audio-for-chapters.ts
 */

import 'dotenv/config'
import { db, story_chapters } from '../db/index'
import { eq, isNull } from 'drizzle-orm'
import { OpenAITTSService } from '../services/openaiTTS'

async function generateAudioForChapters() {
  console.log('🎙️  Gerando áudio para capítulos sem áudio...\n')

  try {
    // Buscar capítulos sem áudio
    const chaptersWithoutAudio = await db
      .select()
      .from(story_chapters)
      .where(isNull(story_chapters.audioUrl))

    if (chaptersWithoutAudio.length === 0) {
      console.log('✅ Todos os capítulos já têm áudio!')
      process.exit(0)
    }

    console.log(`📋 Encontrados ${chaptersWithoutAudio.length} capítulos sem áudio\n`)

    for (const chapter of chaptersWithoutAudio) {
      console.log(`\n🎙️  Gerando áudio para: ${chapter.title}`)
      console.log(`   Capítulo #${chapter.chapterNumber}`)

      try {
        // Gerar áudio
        const audioResult = await OpenAITTSService.generateChapterAudio(
          chapter.title,
          chapter.content
        )

        // Atualizar capítulo com áudio
        await db
          .update(story_chapters)
          .set({
            audioUrl: audioResult.audioUrl,
            audioGenerated: true,
            audioDurationSeconds: audioResult.durationSeconds,
            updatedAt: new Date(),
          })
          .where(eq(story_chapters.id, chapter.id))

        console.log(`   ✅ Áudio gerado: ${audioResult.audioUrl}`)
        console.log(`   📊 Duração: ${audioResult.durationSeconds}s`)
        console.log(`   💾 Tamanho: ${(audioResult.sizeBytes / 1024).toFixed(2)} KB`)
      } catch (error) {
        console.error(`   ❌ Erro ao gerar áudio:`, error)
        continue
      }
    }

    console.log(`\n✅ Processo concluído!`)
    console.log(`   Áudios gerados: ${chaptersWithoutAudio.length}`)
  } catch (error) {
    console.error('❌ Erro:', error)
    process.exit(1)
  }

  process.exit(0)
}

generateAudioForChapters()
