/**
 * Script para adicionar coluna profile_photo_url na tabela users
 */

import 'dotenv/config'
import { db } from '../db/index'
import { sql } from 'drizzle-orm'

async function addProfilePhotoColumn() {
  try {
    console.log('🔧 Verificando se coluna profile_photo_url já existe...')

    // Verificar se a coluna já existe
    const checkResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='users'
      AND column_name='profile_photo_url'
    `)

    if (checkResult.rows.length > 0) {
      console.log('✅ Coluna profile_photo_url já existe!')
      return
    }

    console.log('📝 Adicionando coluna profile_photo_url...')

    // Adicionar coluna
    await db.execute(sql`
      ALTER TABLE users
      ADD COLUMN IF NOT EXISTS profile_photo_url TEXT
    `)

    console.log('✅ Coluna profile_photo_url adicionada com sucesso!')

    // Verificar novamente
    const verifyResult = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name='users'
      AND column_name='profile_photo_url'
    `)

    if (verifyResult.rows.length > 0) {
      console.log('✅ Verificação: Coluna existe no banco de dados')
    } else {
      console.log('❌ ERRO: Coluna não foi criada')
    }

  } catch (error) {
    console.error('❌ Erro ao adicionar coluna:', error)
    throw error
  }
}

addProfilePhotoColumn()
  .then(() => {
    console.log('✅ Script concluído')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script falhou:', error)
    process.exit(1)
  })
