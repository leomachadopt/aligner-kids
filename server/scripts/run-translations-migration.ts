/**
 * Script to run translations migration
 */
import { db } from '../db'
import { sql } from 'drizzle-orm'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function runMigration() {
  console.log('🚀 Running translations migration...')

  try {
    const migrationSQL = readFileSync(
      join(__dirname, '../db/migrations/0013_translations.sql'),
      'utf-8'
    )

    // Split by statement-breakpoint and execute each statement
    const statements = migrationSQL
      .split('-- statement-breakpoint')
      .map(s => s.trim())
      .filter(s => s && !s.startsWith('--'))

    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        await db.execute(sql.raw(statement))
      }
    }

    console.log('✅ Translations migration completed successfully!')
    console.log('📊 Checking translations table...')

    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM translations
    `)

    console.log(`✅ Translations table created with ${result.rows[0].count} initial entries`)

  } catch (error) {
    console.error('❌ Error running migration:', error)
    throw error
  }
}

runMigration()
  .then(() => {
    console.log('Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Failed:', error)
    process.exit(1)
  })
