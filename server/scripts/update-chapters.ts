/**
 * Script para atualizar capítulos existentes com requiredAlignerNumber
 * Executa: npx tsx server/scripts/update-chapters.ts
 */

import 'dotenv/config'
import { db, story_chapters } from '../db/index'
import { eq } from 'drizzle-orm'

async function updateChapters() {
  console.log('🔄 Atualizando capítulos existentes...')

  try {
    // Buscar todos os capítulos
    const chapters = await db.select().from(story_chapters)

    console.log(`📊 Encontrados ${chapters.length} capítulos`)

    let updated = 0

    for (const chapter of chapters) {
      // Atualizar requiredAlignerNumber baseado no chapterNumber
      // Se já tem valor, manter. Senão, usar chapterNumber
      const requiredAlignerNumber = chapter.requiredAlignerNumber || chapter.chapterNumber

      await db
        .update(story_chapters)
        .set({
          requiredAlignerNumber,
          isUnlocked: requiredAlignerNumber === 1, // Só o primeiro capítulo inicia desbloqueado
          isRead: chapter.isRead || false,
        })
        .where(eq(story_chapters.id, chapter.id))

      updated++
      if (updated % 10 === 0) {
        console.log(`✅ ${updated}/${chapters.length} capítulos atualizados...`)
      }
    }

    console.log(`✅ Atualização concluída! ${updated} capítulos atualizados.`)
  } catch (error) {
    console.error('❌ Erro ao atualizar capítulos:', error)
    process.exit(1)
  }

  process.exit(0)
}

updateChapters()
