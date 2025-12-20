import { db } from '../db/index'
import { sql } from 'drizzle-orm'

async function checkSchema() {
  console.log('🔍 Verificando schema das tabelas...\n')

  try {
    // Check treatments table
    const treatmentsSchema = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'treatments'
      AND column_name IN ('start_date', 'expected_end_date')
      ORDER BY ordinal_position
    `)

    console.log('📋 Tabela treatments:')
    for (const col of treatmentsSchema.rows) {
      console.log(`  - ${col.column_name}: ${col.data_type}, nullable: ${col.is_nullable}, default: ${col.column_default || 'NULL'}`)
    }

    // Check aligners table
    const alignersSchema = await db.execute(sql`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'aligners'
      AND column_name IN ('start_date', 'end_date')
      ORDER BY ordinal_position
    `)

    console.log('\n📋 Tabela aligners:')
    for (const col of alignersSchema.rows) {
      console.log(`  - ${col.column_name}: ${col.data_type}, nullable: ${col.is_nullable}, default: ${col.column_default || 'NULL'}`)
    }

    console.log('\n✅ Verificação concluída!')

  } catch (error) {
    console.error('❌ Erro ao verificar schema:', error)
    process.exit(1)
  }
}

checkSchema()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
