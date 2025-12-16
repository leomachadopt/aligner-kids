/**
 * Reset Password Script
 * Resets password for a specific user
 */

import dotenv from 'dotenv'
dotenv.config()

import { db, users } from '../db/index'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

async function resetPassword() {
  const email = process.argv[2]
  const newPassword = process.argv[3]

  if (!email || !newPassword) {
    console.error('❌ Uso: npx tsx server/scripts/reset-password.ts <email> <nova-senha>')
    process.exit(1)
  }

  try {
    console.log(`🔍 Buscando usuário: ${email}`)

    // Find user
    const userResult = await db.select().from(users).where(eq(users.email, email))

    if (userResult.length === 0) {
      console.error(`❌ Usuário não encontrado: ${email}`)
      process.exit(1)
    }

    const user = userResult[0]
    console.log(`✅ Usuário encontrado: ${user.fullName} (${user.email})`)
    console.log(`   Role: ${user.role}`)
    console.log(`   Active: ${user.isActive}`)
    console.log(`   Approved: ${user.isApproved}`)

    // Hash new password
    console.log(`\n🔐 Gerando novo hash para senha: ${newPassword}`)
    const passwordHash = await bcrypt.hash(newPassword, 10)

    // Test the hash immediately
    const testCompare = await bcrypt.compare(newPassword, passwordHash)
    console.log(`✅ Hash gerado com sucesso. Teste: ${testCompare}`)

    // Update password
    console.log(`\n💾 Atualizando senha no banco...`)
    await db.update(users)
      .set({ password_hash: passwordHash })
      .where(eq(users.email, email))

    console.log(`✅ Senha atualizada com sucesso!`)
    console.log(`\n📋 Credenciais:`)
    console.log(`   Email: ${email}`)
    console.log(`   Senha: ${newPassword}`)

  } catch (error) {
    console.error('❌ Erro ao resetar senha:', error)
    process.exit(1)
  }
}

resetPassword()
  .then(() => {
    console.log('\n🎉 Concluído!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Erro:', error)
    process.exit(1)
  })
