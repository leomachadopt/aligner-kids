/**
 * Serviço de Autenticação
 * Gerencia registro, login, logout e sessão de usuários
 * v2.0 - Multi-tenancy (Guardian removido)
 *
 * TODO: Migrar para API backend quando estiver pronto
 * Atualmente usa localStorage como mock do banco de dados
 */

import type {
  User,
  RegisterInput,
  LoginInput,
  AuthResponse,
  UpdateUserInput,
  ChangePasswordInput,
} from '@/types/user'
import bcrypt from 'bcryptjs'
import { seedDemoClinic } from './clinicService'

// ============================================
// CONSTANTES
// ============================================

const STORAGE_KEY_USERS = 'auth_users'
const STORAGE_KEY_SESSION = 'auth_session'
const TOKEN_EXPIRY_HOURS = 24

// ============================================
// HELPERS
// ============================================

/**
 * Gera um token simples (JWT seria usado no backend real)
 */
function generateToken(userId: string): string {
  const payload = {
    userId,
    exp: Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  }
  return btoa(JSON.stringify(payload))
}

/**
 * Valida um token
 */
function validateToken(token: string): { userId: string } | null {
  try {
    const payload = JSON.parse(atob(token))
    if (payload.exp < Date.now()) {
      return null // Token expirado
    }
    return { userId: payload.userId }
  } catch {
    return null
  }
}

/**
 * Hash de senha usando bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

/**
 * Compara senha com hash
 */
async function comparePassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Valida email
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Valida CPF (formato básico)
 */
function isValidCPF(cpf: string): boolean {
  const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/
  return cpfRegex.test(cpf)
}

/**
 * Formata CPF
 */
function formatCPF(cpf: string): string {
  return cpf.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

// ============================================
// STORAGE HELPERS
// ============================================

export function getAllUsers(): User[] {
  const data = localStorage.getItem(STORAGE_KEY_USERS)
  return data ? JSON.parse(data) : []
}

function saveUsers(users: User[]): void {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users))
}

function saveSession(session: AuthResponse): void {
  localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session))
}

function getSession(): AuthResponse | null {
  const data = localStorage.getItem(STORAGE_KEY_SESSION)
  if (!data) return null

  const session: AuthResponse = JSON.parse(data)

  // Validar token
  const validation = validateToken(session.token)
  if (!validation) {
    clearSession()
    return null
  }

  return session
}

function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY_SESSION)
}

// ============================================
// SEED DATA (Super Admins e Clínica Demo)
// ============================================

async function seedSuperAdmins(): Promise<void> {
  // Primeiro, garantir que clínica demo existe
  const demoClinic = await seedDemoClinic()

  const users = getAllUsers()

  // Lista de super-admins a serem criados
  const superAdmins = [
    {
      email: 'admin@kidsaligner.com',
      password: 'admin123',
      fullName: 'Super Admin',
    },
    {
      email: 'leomachadopt@gmail.com',
      password: 'Admin123',
      fullName: 'Leonardo Machado',
    },
  ]

  const newUsers: any[] = [...users]
  let created = 0

  for (const admin of superAdmins) {
    // Verificar se já existe
    if (users.some((u) => u.email === admin.email)) {
      continue
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(admin.password, 10)

    // Criar super admin (sem clinic_id - são globais)
    const superAdmin: User = {
      id: `user-${Date.now() + created}`,
      email: admin.email,
      role: 'super-admin',
      fullName: admin.fullName,
      isActive: true,
      isApproved: true,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    newUsers.push({ ...superAdmin, password_hash: passwordHash })
    created++

    console.log(`✅ Super Admin criado: ${admin.email} / ${admin.password}`)
  }

  if (created > 0) {
    saveUsers(newUsers)
  }
}

// Executar seed ao carregar
seedSuperAdmins()

// ============================================
// CLASSE PRINCIPAL
// ============================================

export class AuthService {
  /**
   * Registrar novo usuário
   */
  static async register(input: RegisterInput): Promise<AuthResponse> {
    // Validações
    if (!isValidEmail(input.email)) {
      throw new Error('Email inválido')
    }

    if (input.password !== input.confirmPassword) {
      throw new Error('As senhas não coincidem')
    }

    if (input.password.length < 6) {
      throw new Error('A senha deve ter no mínimo 6 caracteres')
    }

    if (input.cpf && !isValidCPF(input.cpf)) {
      throw new Error('CPF inválido')
    }

    // Verificar duplicatas
    const users = getAllUsers() as any[]

    if (users.some((u) => u.email === input.email)) {
      throw new Error('Email já cadastrado')
    }

    if (input.cpf && users.some((u) => u.cpf === input.cpf)) {
      throw new Error('CPF já cadastrado')
    }

    if (input.cro && users.some((u) => u.cro === input.cro)) {
      throw new Error('CRO já cadastrado')
    }

    // Hash da senha
    const passwordHash = await hashPassword(input.password)

    // Criar usuário
    const userId = `user-${Date.now()}`
    const now = new Date().toISOString()

    const newUser: User = {
      id: userId,
      email: input.email, // Email dos PAIS se for child-patient
      role: input.role,
      fullName: input.fullName, // Nome da CRIANÇA ou PACIENTE
      cpf: input.cpf ? formatCPF(input.cpf) : undefined,
      birthDate: input.birthDate,
      phone: input.phone,

      // Informações do responsável (apenas informativo para child-patient)
      guardianName: input.guardianName,
      guardianCpf: input.guardianCpf,
      guardianPhone: input.guardianPhone,

      // Ortodontista
      cro: input.cro,
      clinicName: input.clinicName, // DEPRECATED

      // Vínculo com clínica (multi-tenancy)
      clinicId: input.clinicId,

      // Status
      isActive: true,
      isApproved: input.role === 'orthodontist' ? false : true, // Ortodontistas precisam aprovação
      emailVerified: false,

      // Timestamps
      createdAt: now,
      updatedAt: now,
    }

    users.push({ ...newUser, password_hash: passwordHash })
    saveUsers(users)

    // Criar sessão
    const token = generateToken(userId)
    const expiresAt = new Date(
      Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    ).toISOString()

    const session: AuthResponse = {
      user: newUser,
      token,
      expiresAt,
    }

    saveSession(session)

    console.log('✅ Usuário registrado:', newUser.email)

    return session
  }

  /**
   * Login
   */
  static async login(input: LoginInput): Promise<AuthResponse> {
    const users = getAllUsers() as any[]

    // Buscar usuário por email, CPF ou CRO
    const user = users.find(
      (u) =>
        u.email === input.credential ||
        u.cpf === input.credential ||
        u.cro === input.credential,
    )

    if (!user) {
      throw new Error('Credenciais inválidas')
    }

    // Verificar senha
    const isPasswordValid = await comparePassword(
      input.password,
      user.password_hash,
    )

    if (!isPasswordValid) {
      throw new Error('Credenciais inválidas')
    }

    // Verificar se está ativo
    if (!user.isActive) {
      throw new Error('Conta desativada. Entre em contato com o suporte.')
    }

    // Verificar se está aprovado (ortodontistas)
    if (!user.isApproved) {
      throw new Error(
        'Sua conta está pendente de aprovação. Aguarde o contato da administração.',
      )
    }

    // Atualizar último login
    user.lastLoginAt = new Date().toISOString()
    saveUsers(users)

    // Criar sessão
    const token = generateToken(user.id)
    const expiresAt = new Date(
      Date.now() + TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
    ).toISOString()

    // Remover password_hash antes de retornar
    const { password_hash, ...userWithoutPassword } = user

    const session: AuthResponse = {
      user: userWithoutPassword,
      token,
      expiresAt,
    }

    saveSession(session)

    console.log('✅ Login realizado:', user.email)

    return session
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
   * Obter usuário por ID
   */
  static getUserById(userId: string): User | null {
    const users = getAllUsers() as any[]
    const user = users.find((u) => u.id === userId)
    if (!user) return null

    // Remove password_hash antes de retornar
    const { password_hash, ...userWithoutPassword } = user
    return userWithoutPassword as User
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
    const users = getAllUsers() as any[]
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado')
    }

    // Validações
    if (updates.email && !isValidEmail(updates.email)) {
      throw new Error('Email inválido')
    }

    if (
      updates.email &&
      users.some((u) => u.email === updates.email && u.id !== userId)
    ) {
      throw new Error('Email já cadastrado')
    }

    // Atualizar
    users[userIndex] = {
      ...users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    saveUsers(users)

    // Atualizar sessão
    const session = getSession()
    if (session && session.user.id === userId) {
      const { password_hash, ...userWithoutPassword } = users[userIndex]
      session.user = userWithoutPassword
      saveSession(session)
    }

    const { password_hash, ...userWithoutPassword } = users[userIndex]
    return userWithoutPassword
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

    const users = getAllUsers() as any[]
    const userIndex = users.findIndex((u) => u.id === userId)

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado')
    }

    // Verificar senha atual
    const isCurrentPasswordValid = await comparePassword(
      input.currentPassword,
      users[userIndex].password_hash,
    )

    if (!isCurrentPasswordValid) {
      throw new Error('Senha atual incorreta')
    }

    // Hash nova senha
    const newPasswordHash = await hashPassword(input.newPassword)

    users[userIndex].password_hash = newPasswordHash
    users[userIndex].updatedAt = new Date().toISOString()

    saveUsers(users)

    console.log('✅ Senha alterada:', users[userIndex].email)
  }

  /**
   * Buscar usuários (apenas para admin)
   */
  static getAllUsers(currentUserId: string): User[] {
    const currentUser = this.getCurrentUser()
    if (!currentUser || currentUser.role !== 'super-admin') {
      throw new Error('Acesso negado')
    }

    const users = getAllUsers() as any[]
    return users.map(({ password_hash, ...user }) => user)
  }

  /**
   * Obter usuários de uma clínica (ortodontista ou super-admin)
   */
  static getUsersByClinic(clinicId: string): User[] {
    const users = getAllUsers() as any[]
    return users
      .filter((u) => u.clinicId === clinicId)
      .map(({ password_hash, ...user }) => user)
  }

  /**
   * Obter ortodontistas pendentes de aprovação (super-admin)
   */
  static getPendingOrthodontists(): User[] {
    const currentUser = this.getCurrentUser()
    if (!currentUser || currentUser.role !== 'super-admin') {
      throw new Error('Acesso negado')
    }

    const users = getAllUsers() as any[]
    return users
      .filter((u) => u.role === 'orthodontist' && !u.isApproved)
      .map(({ password_hash, ...user }) => user)
  }

  /**
   * Aprovar ortodontista (apenas para super-admin)
   */
  static async approveOrthodontist(
    adminUserId: string,
    orthodontistId: string,
  ): Promise<User> {
    const currentUser = this.getCurrentUser()
    if (!currentUser || currentUser.role !== 'super-admin') {
      throw new Error('Acesso negado')
    }

    const users = getAllUsers() as any[]
    const userIndex = users.findIndex((u) => u.id === orthodontistId)

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado')
    }

    if (users[userIndex].role !== 'orthodontist') {
      throw new Error('Usuário não é ortodontista')
    }

    users[userIndex].isApproved = true
    users[userIndex].updatedAt = new Date().toISOString()

    saveUsers(users)

    const { password_hash, ...userWithoutPassword } = users[userIndex]
    console.log('✅ Ortodontista aprovado:', userWithoutPassword.email)
    return userWithoutPassword
  }

  /**
   * Rejeitar/desativar ortodontista (apenas para super-admin)
   */
  static async rejectOrthodontist(
    adminUserId: string,
    orthodontistId: string,
  ): Promise<void> {
    const currentUser = this.getCurrentUser()
    if (!currentUser || currentUser.role !== 'super-admin') {
      throw new Error('Acesso negado')
    }

    const users = getAllUsers() as any[]
    const userIndex = users.findIndex((u) => u.id === orthodontistId)

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado')
    }

    users[userIndex].isActive = false
    users[userIndex].updatedAt = new Date().toISOString()

    saveUsers(users)
    console.log('❌ Ortodontista rejeitado:', users[userIndex].email)
  }

  /**
   * Desativar usuário (apenas para super-admin)
   */
  static async deactivateUser(
    adminUserId: string,
    targetUserId: string,
  ): Promise<void> {
    const currentUser = this.getCurrentUser()
    if (!currentUser || currentUser.role !== 'super-admin') {
      throw new Error('Acesso negado')
    }

    if (adminUserId === targetUserId) {
      throw new Error('Você não pode desativar sua própria conta')
    }

    const users = getAllUsers() as any[]
    const userIndex = users.findIndex((u) => u.id === targetUserId)

    if (userIndex === -1) {
      throw new Error('Usuário não encontrado')
    }

    users[userIndex].isActive = false
    users[userIndex].updatedAt = new Date().toISOString()

    saveUsers(users)
    console.log('⚠️  Usuário desativado:', users[userIndex].email)
  }
}

export default AuthService
