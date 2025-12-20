import { db } from '../db/index'
import { sql } from 'drizzle-orm'

async function fixNullableDates() {
  console.log('🔧 Corrigindo constraints NOT NULL das datas...\n')

  try {
    // Fix treatments.start_date
    console.log('⚙️  Alterando treatments.start_date para nullable...')
    await db.execute(sql`ALTER TABLE treatments ALTER COLUMN start_date DROP NOT NULL`)
    console.log('✅ treatments.start_date agora é nullable')

    // Fix aligners.start_date
    console.log('\n⚙️  Alterando aligners.start_date para nullable...')
    await db.execute(sql`ALTER TABLE aligners ALTER COLUMN start_date DROP NOT NULL`)
    console.log('✅ aligners.start_date agora é nullable')

    // Fix aligners.end_date
    console.log('\n⚙️  Alterando aligners.end_date para nullable...')
    await db.execute(sql`ALTER TABLE aligners ALTER COLUMN end_date DROP NOT NULL`)
    console.log('✅ aligners.end_date agora é nullable')

    console.log('\n✨ Todas as alterações aplicadas com sucesso!')

  } catch (error: any) {
    console.error('❌ Erro ao aplicar alterações:', error)
    console.error('❌ Mensagem:', error.message)
    process.exit(1)
  }
}

fixNullableDates()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
