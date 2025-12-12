/**
 * Script para corrigir capítulos existentes
 * Executa: npx tsx server/scripts/fix-existing-chapters.ts
 */

import 'dotenv/config'
import { db, story_chapters } from '../db/index'
import { eq } from 'drizzle-orm'

async function fixChapters() {
  console.log('🔍 Verificando capítulos no banco...\n')

  try {
    // Buscar todos os capítulos
    const chapters = await db.select().from(story_chapters)

    console.log(`📊 Total de capítulos encontrados: ${chapters.length}\n`)

    if (chapters.length === 0) {
      console.log('⚠️  Nenhum capítulo encontrado no banco.')
      process.exit(0)
    }

    // Mostrar estado atual
    console.log('📋 Estado ANTES da correção:')
    console.log('─'.repeat(80))
    chapters.forEach((ch) => {
      console.log(`Capítulo ${ch.chapterNumber}:`)
      console.log(`  - ID: ${ch.id}`)
      console.log(`  - Título: ${ch.title}`)
      console.log(`  - requiredAlignerNumber: ${ch.requiredAlignerNumber || 'NULL'}`)
      console.log(`  - isUnlocked: ${ch.isUnlocked ?? 'NULL'}`)
      console.log(`  - isRead: ${ch.isRead ?? 'NULL'}`)
      console.log('')
    })
    console.log('─'.repeat(80))
    console.log('')

    // Atualizar cada capítulo
    console.log('🔄 Aplicando correções...\n')
    let updated = 0

    for (const chapter of chapters) {
      // Definir valores corretos
      const requiredAlignerNumber = chapter.chapterNumber // 1:1 com capítulo
      const isUnlocked = chapter.chapterNumber === 1 // Só o primeiro inicia desbloqueado
      const isRead = chapter.isRead || false

      await db
        .update(story_chapters)
        .set({
          requiredAlignerNumber,
          isUnlocked,
          isRead,
        })
        .where(eq(story_chapters.id, chapter.id))

      console.log(`✅ Capítulo ${chapter.chapterNumber} atualizado:`)
      console.log(`   requiredAlignerNumber: ${requiredAlignerNumber}`)
      console.log(`   isUnlocked: ${isUnlocked}`)
      console.log(`   isRead: ${isRead}`)
      console.log('')

      updated++
    }

    console.log('─'.repeat(80))
    console.log(`\n✅ Correção concluída! ${updated} capítulos atualizados.`)
    console.log('\n📋 Resumo:')
    console.log(`   - Capítulo 1: DESBLOQUEADO (requiredAlignerNumber=1)`)
    for (let i = 2; i <= chapters.length; i++) {
      console.log(`   - Capítulo ${i}: BLOQUEADO (requiredAlignerNumber=${i})`)
    }
  } catch (error) {
    console.error('❌ Erro ao corrigir capítulos:', error)
    process.exit(1)
  }

  process.exit(0)
}

fixChapters()
