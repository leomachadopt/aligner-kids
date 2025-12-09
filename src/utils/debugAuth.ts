/**
 * Utilitário de Debug de Autenticação
 * Use no console do navegador para testar o sistema de auth
 */

import { AuthService, getAllUsers } from '@/services/authService'
import bcrypt from 'bcryptjs'

export const debugAuth = {
  /**
   * Lista todos os usuários
   */
  listUsers() {
    const users = getAllUsers()
    console.table(
      users.map((u: any) => ({
        id: u.id,
        email: u.email,
        role: u.role,
        fullName: u.fullName,
        isActive: u.isActive,
        isApproved: u.isApproved,
        hasPassword: !!u.password_hash,
      })),
    )
    return users
  },

  /**
   * Testa login manualmente
   */
  async testLogin(email: string, password: string) {
    try {
      console.log('🔐 Tentando login...', { email, password })
      const result = await AuthService.login({
        credential: email,
        password,
      })
      console.log('✅ Login bem-sucedido!', result)
      return result
    } catch (error) {
      console.error('❌ Erro no login:', error)
      throw error
    }
  },

  /**
   * Verifica se a senha de um usuário está correta
   */
  async verifyPassword(email: string, password: string) {
    const users = getAllUsers() as any[]
    const user = users.find((u) => u.email === email)

    if (!user) {
      console.error('❌ Usuário não encontrado:', email)
      return false
    }

    console.log('👤 Usuário encontrado:', {
      email: user.email,
      role: user.role,
      hasHash: !!user.password_hash,
      hashLength: user.password_hash?.length,
    })

    try {
      const isValid = await bcrypt.compare(password, user.password_hash)
      console.log(isValid ? '✅ Senha correta!' : '❌ Senha incorreta!')
      return isValid
    } catch (error) {
      console.error('❌ Erro ao verificar senha:', error)
      return false
    }
  },

  /**
   * Mostra sessão atual
   */
  getSession() {
    const session = AuthService.getCurrentSession()
    if (session) {
      console.log('✅ Sessão ativa:', session.user)
    } else {
      console.log('❌ Nenhuma sessão ativa')
    }
    return session
  },

  /**
   * Limpa todos os usuários (cuidado!)
   */
  clearAllUsers() {
    if (confirm('⚠️ Tem certeza? Isso vai remover TODOS os usuários!')) {
      localStorage.removeItem('auth_users')
      localStorage.removeItem('auth_session')
      console.log('🗑️ Todos os usuários removidos')
      console.log('🔄 Recarregue a página para criar os super-admins novamente')
    }
  },

  /**
   * Cria um usuário de teste manualmente
   */
  async createTestUser(email: string, password: string, role: 'patient' | 'orthodontist' | 'super-admin') {
    try {
      const passwordHash = await bcrypt.hash(password, 10)
      const users = getAllUsers() as any[]

      const newUser = {
        id: `user-${Date.now()}`,
        email,
        password_hash: passwordHash,
        role,
        fullName: 'Teste ' + role,
        isActive: true,
        isApproved: true,
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      users.push(newUser)
      localStorage.setItem('auth_users', JSON.stringify(users))

      console.log('✅ Usuário de teste criado:', {
        email,
        password,
        role,
      })

      return newUser
    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error)
      throw error
    }
  },
}

// Tornar disponível globalmente
if (typeof window !== 'undefined') {
  ;(window as any).debugAuth = debugAuth
}

export default debugAuth
