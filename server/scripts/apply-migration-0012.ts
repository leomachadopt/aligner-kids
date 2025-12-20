import { db } from '../db/index'
import { sql } from 'drizzle-orm'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function applyMigration() {
  console.log('🔧 Aplicando migration 0012: Make dates nullable')

  try {
    // Read migration file
    const migrationPath = path.join(__dirname, '../db/migrations/0012_make_dates_nullable.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')

    console.log('📄 SQL a executar:')
    console.log(migrationSQL)

    // Split by semicolons and execute each statement
    const statements = migrationSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))

    for (const statement of statements) {
      console.log(`\n⚙️  Executando: ${statement.substring(0, 80)}...`)
      await db.execute(sql.raw(statement))
      console.log('✅ Executado com sucesso')
    }

    console.log('\n✨ Migration aplicada com sucesso!')
    console.log('✅ Campos start_date e end_date agora são nullable')

  } catch (error) {
    console.error('❌ Erro ao aplicar migration:', error)
    process.exit(1)
  }
}

applyMigration()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
