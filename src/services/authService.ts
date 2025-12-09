/**
 * Serviço de Autenticação
 * Gerencia registro, login, logout e sessão de usuários
 * v3.0 - Migrado para API backend com Neon PostgreSQL
 */

import type {
  User,
  RegisterInput,
  LoginInput,
  AuthResponse,
  UpdateUserInput,
  ChangePasswordInput,
} from '@/types/user'
import { apiClient } from '@/utils/apiClient'

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEY_SESSION = 'auth_session'

// ============================================
// SESSION HELPERS
// ============================================

function saveSession(session: AuthResponse): void {
  localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session))
  // Update API client token
  apiClient.setToken(session.token)
}

function getSession(): AuthResponse | null {
  const data = localStorage.getItem(STORAGE_KEY_SESSION)
  if (!data) return null

  try {
    const session: AuthResponse = JSON.parse(data)
    // Set token in API client
    apiClient.setToken(session.token)
    return session
  } catch (e) {
    console.error('Error parsing session:', e)
    return null
  }
}

function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY_SESSION)
  apiClient.setToken(null)
}

// ============================================
// VALIDATION HELPERS
// ============================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidCPF(cpf: string): boolean {
  const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
  return cpfRegex.test(cpf)
}

function formatCPF(cpf: string): string {
  return cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

// ============================================
// CLASSE PRINCIPAL
// ============================================

export class AuthService {
  /**
   * Registrar novo usuário
   * @param input - Dados do usuário
   * @param createSession - Se true, cria sessão e faz login automático (padrão: true)
   */
  static async register(input: RegisterInput, createSession = true): Promise<AuthResponse> {
    // Validações no frontend
    if (!isValidEmail(input.email)) {
      throw new Error('Email inválido')
    }

    if (input.password !== input.confirmPassword) {
      throw new Error('As senhas não coincidem')
    }

    if (input.password.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres')
    }

    // Validar CPF apenas para Brasil
    if (input.cpf && input.cpf.includes('.')) {
      if (!isValidCPF(input.cpf)) {
        throw new Error('CPF inválido')
      }
    }

    try {
      // Formatar CPF se for brasileiro
      const formattedInput = {
        ...input,
        cpf: input.cpf && input.cpf.includes('.') ? formatCPF(input.cpf) : input.cpf,
      }

      // Chamar API
      const response = await apiClient.post<AuthResponse>('/auth/register', formattedInput)

      // Salvar sessão se solicitado
      if (createSession) {
        saveSession(response)
      }

      console.log('✅ Usuário registrado:', response.user.email)
      return response
    } catch (error) {
      console.error('❌ Erro ao registrar:', error)
      throw error
    }
  }

  /**
   * Login
   */
  static async login(input: LoginInput): Promise<AuthResponse> {
    try {
      console.log('🔐 Tentativa de login:', { credential: input.credential })

      // Chamar API
      const response = await apiClient.post<AuthResponse>('/auth/login', input)

      // Salvar sessão
      saveSession(response)

      console.log('✅ Login realizado:', response.user.email)
      return response
    } catch (error) {
      console.error('❌ Erro ao fazer login:', error)
      throw error
    }
  }

  /**
   * Logout
   */
  static async logout(): Promise<void> {
    clearSession()
    console.log('✅ Logout realizado')
  }

  /**
   * Obter sessão atual
   */
  static getCurrentSession(): AuthResponse | null {
    return getSession()
  }

  /**
   * Obter usuário atual
   */
  static getCurrentUser(): User | null {
    const session = getSession()
    return session?.user || null
  }

  /**
   * Obter usuário atual do servidor (verifica token)
   */
  static async getCurrentUserFromServer(): Promise<User | null> {
    try {
      const response = await apiClient.get<{ user: User }>('/auth/me')
      return response.user
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error)
      clearSession()
      return null
    }
  }

  /**
   * Obter usuário por ID
   */
  static getUserById(userId: string): User | null {
    // This method is synchronous in the old version, but now needs to be async
    // For now, we'll keep it returning null and suggest using an async version
    console.warn('getUserById is deprecated. Use getUserByIdAsync instead.')
    return null
  }

  /**
   * Obter usuário por ID (versão assíncrona)
   */
  static async getUserByIdAsync(userId: string): Promise<User | null> {
    try {
      // This endpoint doesn't exist yet in the backend
      // We'll need to add it or get it from the users list
      const users = await this.getUsersByCurrentClinic()
      return users.find(u => u.id === userId) || null
    } catch (error) {
      console.error('Erro ao obter usuário:', error)
      return null
    }
  }

  /**
   * Verificar se está autenticado
   */
  static isAuthenticated(): boolean {
    return getSession() !== null
  }

  /**
   * Atualizar perfil do usuário
   */
  static async updateProfile(
    userId: string,
    updates: UpdateUserInput,
  ): Promise<User> {
    // Validações
    if (updates.email && !isValidEmail(updates.email)) {
      throw new Error('Email inválido')
    }

    try {
      // This endpoint doesn't exist yet - we'll need to add it to the backend
      const response = await apiClient.put<{ user: User }>(`/auth/users/${userId}`, updates)

      // Atualizar sessão se for o usuário atual
      const session = getSession()
      if (session && session.user.id === userId) {
        session.user = response.user
        saveSession(session)
      }

      return response.user
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error)
      throw error
    }
  }

  /**
   * Alterar senha
   */
  static async changePassword(
    userId: string,
    input: ChangePasswordInput,
  ): Promise<void> {
    if (input.newPassword !== input.confirmPassword) {
      throw new Error('As senhas não coincidem')
    }

    if (input.newPassword.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres')
    }

    try {
      // This endpoint doesn't exist yet - we'll need to add it to the backend
      await apiClient.put(`/auth/users/${userId}/password`, input)
      console.log('✅ Senha alterada com sucesso')
    } catch (error) {
      console.error('Erro ao alterar senha:', error)
      throw error
    }
  }

  /**
   * Buscar usuários (apenas para admin)
   */
  static getAllUsers(currentUserId: string): User[] {
    // This method is synchronous, but should be async now
    console.warn('getAllUsers is deprecated. Use getAllUsersAsync instead.')
    return []
  }

  /**
   * Buscar todos os usuários (versão assíncrona, apenas para admin)
   */
  static async getAllUsersAsync(): Promise<User[]> {
    try {
      // This endpoint doesn't exist yet - we'll need to add it
      const response = await apiClient.get<{ users: User[] }>('/auth/users')
      return response.users
    } catch (error) {
      console.error('Erro ao buscar usuários:', error)
      throw error
    }
  }

  /**
   * Obter usuários de uma clínica (ortodontista ou super-admin)
   */
  static getUsersByClinic(clinicId: string): User[] {
    // This method is synchronous, but should be async now
    console.warn('getUsersByClinic is deprecated. Use getUsersByClinicAsync instead.')
    return []
  }

  /**
   * Obter usuários de uma clínica (versão assíncrona)
   */
  static async getUsersByClinicAsync(clinicId: string): Promise<User[]> {
    try {
      const response = await apiClient.get<{ users: User[] }>(`/auth/users/clinic/${clinicId}`)
      return response.users
    } catch (error) {
      console.error('Erro ao buscar usuários da clínica:', error)
      throw error
    }
  }

  /**
   * Obter usuários da clínica atual
   */
  static async getUsersByCurrentClinic(): Promise<User[]> {
    const currentUser = this.getCurrentUser()
    if (!currentUser?.clinicId) {
      return []
    }
    return this.getUsersByClinicAsync(currentUser.clinicId)
  }

  /**
   * Obter ortodontistas pendentes de aprovação (super-admin)
   */
  static getPendingOrthodontists(): User[] {
    console.warn('getPendingOrthodontists is deprecated. Use getPendingOrthodontistsAsync instead.')
    return []
  }

  /**
   * Obter ortodontistas pendentes de aprovação (versão assíncrona)
   */
  static async getPendingOrthodontistsAsync(): Promise<User[]> {
    try {
      // This endpoint doesn't exist yet - we'll need to add it
      const response = await apiClient.get<{ users: User[] }>('/auth/users/pending')
      return response.users
    } catch (error) {
      console.error('Erro ao buscar ortodontistas pendentes:', error)
      throw error
    }
  }

  /**
   * Aprovar ortodontista (apenas para super-admin)
   */
  static async approveOrthodontist(
    adminUserId: string,
    orthodontistId: string,
  ): Promise<User> {
    try {
      // This endpoint doesn't exist yet - we'll need to add it
      const response = await apiClient.put<{ user: User }>(`/auth/users/${orthodontistId}/approve`, {})
      console.log('✅ Ortodontista aprovado:', response.user.email)
      return response.user
    } catch (error) {
      console.error('Erro ao aprovar ortodontista:', error)
      throw error
    }
  }

  /**
   * Rejeitar/desativar ortodontista (apenas para super-admin)
   */
  static async rejectOrthodontist(
    adminUserId: string,
    orthodontistId: string,
  ): Promise<void> {
    try {
      // This endpoint doesn't exist yet - we'll need to add it
      await apiClient.put(`/auth/users/${orthodontistId}/reject`, {})
      console.log('❌ Ortodontista rejeitado')
    } catch (error) {
      console.error('Erro ao rejeitar ortodontista:', error)
      throw error
    }
  }

  /**
   * Desativar usuário (apenas para super-admin)
   */
  static async deactivateUser(
    adminUserId: string,
    targetUserId: string,
  ): Promise<void> {
    if (adminUserId === targetUserId) {
      throw new Error('Você não pode desativar sua própria conta')
    }

    try {
      // This endpoint doesn't exist yet - we'll need to add it
      await apiClient.put(`/auth/users/${targetUserId}/deactivate`, {})
      console.log('⚠️  Usuário desativado')
    } catch (error) {
      console.error('Erro ao desativar usuário:', error)
      throw error
    }
  }

  /**
   * Excluir usuário/paciente permanentemente
   * ATENÇÃO: Remove TODOS os dados relacionados (alinhadores, histórias, missões, etc.)
   */
  static async deleteUser(targetUserId: string): Promise<void> {
    const currentUser = this.getCurrentUser()

    // Verificar permissões
    if (!currentUser) {
      throw new Error('Usuário não autenticado')
    }

    if (currentUser.id === targetUserId) {
      throw new Error('Você não pode excluir sua própria conta')
    }

    try {
      await apiClient.delete(`/auth/users/${targetUserId}`)
      console.log(`✅ Usuário excluído permanentemente`)
    } catch (error) {
      console.error('Erro ao excluir usuário:', error)
      throw error
    }
  }
}

// ============================================
// EXPORT HELPER FOR BACKWARD COMPATIBILITY
// ============================================

/**
 * Get all users (deprecated - for backward compatibility)
 * This function was used in debug tools
 */
export function getAllUsers(): User[] {
  console.warn('getAllUsers from authService is deprecated. Data is now in the database.')
  return []
}

export default AuthService
