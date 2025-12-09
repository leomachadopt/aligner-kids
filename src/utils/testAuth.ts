/**
 * Script de Teste de Autenticação
 * Testa todo o fluxo de criação e login de usuário
 */

import { AuthService, getAllUsers } from '@/services/authService'
import bcrypt from 'bcryptjs'

export async function testAuthFlow() {
  console.log('🔍 INICIANDO TESTE DE AUTENTICAÇÃO')
  console.log('=====================================\n')

  // 1. Listar usuários existentes
  console.log('1️⃣ USUÁRIOS EXISTENTES:')
  const users = getAllUsers()
  console.table(
    users.map((u: any) => ({
      email: u.email,
      role: u.role,
      hasHash: !!u.password_hash,
      hashPreview: u.password_hash?.substring(0, 20) + '...',
    })),
  )

  // 2. Criar usuário de teste
  console.log('\n2️⃣ CRIANDO USUÁRIO DE TESTE:')
  const testEmail = `teste${Date.now()}@email.com`
  const testPassword = 'senha123'

  try {
    const result = await AuthService.register(
      {
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        role: 'patient',
        fullName: 'Teste Usuário',
        phone: '11999999999',
        clinicId: 'clinic-demo',
      },
      false,
    )
    console.log('✅ Usuário criado:', result.user.email)

    // Verificar se foi salvo com hash
    const allUsers = getAllUsers() as any[]
    const createdUser = allUsers.find((u) => u.email === testEmail)

    if (!createdUser) {
      console.error('❌ ERRO: Usuário não foi encontrado no localStorage!')
      return
    }

    console.log('\n📋 Dados do usuário criado:')
    console.log('  Email:', createdUser.email)
    console.log('  Role:', createdUser.role)
    console.log('  Tem password_hash:', !!createdUser.password_hash)
    console.log('  Hash length:', createdUser.password_hash?.length)
    console.log('  Hash preview:', createdUser.password_hash?.substring(0, 30) + '...')

    // 3. Testar se o hash está correto
    console.log('\n3️⃣ TESTANDO HASH DA SENHA:')
    const isHashValid = await bcrypt.compare(testPassword, createdUser.password_hash)
    console.log('  Senha testada:', testPassword)
    console.log('  Hash confere:', isHashValid ? '✅ SIM' : '❌ NÃO')

    if (!isHashValid) {
      console.error('❌ PROBLEMA: O hash da senha não confere!')
      console.log('  Tentando criar hash manualmente...')
      const manualHash = await bcrypt.hash(testPassword, 10)
      console.log('  Hash manual:', manualHash.substring(0, 30) + '...')
      const manualCheck = await bcrypt.compare(testPassword, manualHash)
      console.log('  Hash manual confere:', manualCheck ? '✅ SIM' : '❌ NÃO')
      return
    }

    // 4. Testar login
    console.log('\n4️⃣ TESTANDO LOGIN:')
    try {
      await AuthService.logout() // Garantir que não há sessão

      const loginResult = await AuthService.login({
        credential: testEmail,
        password: testPassword,
      })

      console.log('✅ LOGIN BEM-SUCEDIDO!')
      console.log('  Usuário logado:', loginResult.user.email)
      console.log('  Token:', loginResult.token.substring(0, 30) + '...')
    } catch (loginError) {
      console.error('❌ ERRO NO LOGIN:', loginError)
      console.log('\n🔍 Investigando mais...')

      // Tentar entender o erro
      const userToLogin = allUsers.find((u) => u.email === testEmail)
      console.log('  Usuário encontrado:', !!userToLogin)
      console.log('  Email confere:', userToLogin?.email === testEmail)
      console.log('  Tem hash:', !!userToLogin?.password_hash)

      if (userToLogin) {
        const passwordCheck = await bcrypt.compare(testPassword, userToLogin.password_hash)
        console.log('  Senha confere (manual):', passwordCheck)
      }
    }

    // 5. Testar login com senha errada
    console.log('\n5️⃣ TESTANDO LOGIN COM SENHA ERRADA (deve falhar):')
    try {
      await AuthService.login({
        credential: testEmail,
        password: 'senhaERRADA123',
      })
      console.error('❌ PROBLEMA: Login com senha errada deveria ter falhado!')
    } catch (error) {
      console.log('✅ Senha errada foi rejeitada corretamente')
    }

    // 6. Limpar usuário de teste
    console.log('\n6️⃣ LIMPANDO USUÁRIO DE TESTE:')
    const updatedUsers = allUsers.filter((u) => u.email !== testEmail)
    localStorage.setItem('auth_users', JSON.stringify(updatedUsers))
    console.log('✅ Usuário de teste removido')
  } catch (error) {
    console.error('❌ ERRO NO TESTE:', error)
    console.error('Detalhes:', error instanceof Error ? error.message : error)
  }

  console.log('\n=====================================')
  console.log('✅ TESTE CONCLUÍDO')
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
  ;(window as any).testAuthFlow = testAuthFlow
}

export default testAuthFlow
