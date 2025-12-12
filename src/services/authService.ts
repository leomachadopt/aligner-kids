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
// STORAGE CONFIG
// ============================================

const SESSION_STORAGE_KEY = 'auth_session_v1'
const DEFAULT_SESSION_TTL_MS = 24 * 60 * 60 * 1000 // 24h fallback

// ============================================
// CONSTANTES
// ============================================

let sessionCache: AuthResponse | null = null

function normalizeSession(session: AuthResponse): AuthResponse {
  const expiresAtMs = (() => {
    const parsed = session.expiresAt ? new Date(session.expiresAt).getTime() : NaN
    if (Number.isNaN(parsed) || parsed <= Date.now()) {
      return Date.now() + DEFAULT_SESSION_TTL_MS
    }
    return parsed
  })()

  const token = session.token || `session-${session.user.id}`

  return {
    ...session,
    token,
    expiresAt: new Date(expiresAtMs).toISOString(),
  }
}

// ============================================
// SESSION HELPERS
// ============================================

function persistSession(session: AuthResponse): void {
  const normalized = normalizeSession(session)
  sessionCache = normalized
  apiClient.setToken(normalized.token)

  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(normalized))
  } catch (error) {
    console.warn('Não foi possível salvar a sessão no storage:', error)
  }
}

function getSession(): AuthResponse | null {
  if (sessionCache) return sessionCache

  if (typeof window === 'undefined') return null

  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (!stored) return null

    const parsed = JSON.parse(stored) as AuthResponse | null
    if (!parsed?.user) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    const normalized = normalizeSession(parsed)
    const expiresAt = new Date(normalized.expiresAt).getTime()
    if (Number.isNaN(expiresAt) || expiresAt <= Date.now()) {
      localStorage.removeItem(SESSION_STORAGE_KEY)
      return null
    }

    sessionCache = normalized
    apiClient.setToken(normalized.token)
    return normalized
  } catch (error) {
    console.error('Erro ao restaurar sessão do storage:', error)
    localStorage.removeItem(SESSION_STORAGE_KEY)
    return null
  }
}

function clearSession(): void {
  sessionCache = null
  apiClient.setToken(null)

  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  } catch (error) {
    console.warn('Não foi possível limpar a sessão do storage:', error)
  }
}

// ============================================
// VALIDATION HELPERS
// ============================================

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Aceita CPF (11 dígitos, com ou sem máscara) ou NIF PT (9 dígitos)
function isValidTaxId(value: string): boolean {
  if (!value) return true
  const digits = value.replace(/\D/g, '')
  if (digits.length === 9) {
    // NIF/PT: 9 dígitos
    return true
  }
  if (digits.length === 11) {
    // CPF/BR: 11 dígitos
    return true
  }
  return false
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

    // Validar CPF/NIF (opcional): aceita 9 dígitos (NIF PT) ou 11 dígitos (CPF)
    if (input.cpf && !isValidTaxId(input.cpf)) {
      throw new Error('Documento inválido (use 9 dígitos para NIF ou 11 dígitos para CPF)')
    }

    try {
      // Chamar API
      const response = await apiClient.post<AuthResponse>('/auth/register', input)

      // Salvar sessão se solicitado
      if (createSession) {
        persistSession(response)
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
      persistSession(response)

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
        persistSession(session)
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
    console.warn('getAllUsers is deprecated. Use getAllUsersAsync instead.')
    return []
  }

  /**
   * Buscar todos os usuários (versão assíncrona, apenas para admin)
   */
  static async getAllUsersAsync(): Promise<User[]> {
    try {
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
