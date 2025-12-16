/**
 * Tipos para Sistema de Autenticação e Usuários
 * v2.0 - Arquitetura Multi-Tenancy (Guardian removido)
 */

export type UserRole = 'child-patient' | 'patient' | 'orthodontist' | 'super-admin'

export interface User {
  id: string
  email: string // Email dos PAIS se for child-patient
  role: UserRole
  fullName: string // Nome da CRIANÇA se for child-patient
  cpf?: string
  birthDate?: string
  phone?: string // Telefone de contato

  // Informações do responsável (apenas informativo para child-patient)
  guardianName?: string // Nome do pai/mãe
  guardianCpf?: string // CPF do responsável
  guardianPhone?: string // Telefone alternativo

  // Específico para ortodontistas
  cro?: string // Registro profissional (ortodontistas)
  clinicName?: string // DEPRECATED: usar clinic.name

  // Vínculo com clínica (multi-tenancy)
  clinicId?: string

  // Profile photo
  profilePhotoUrl?: string

  // Preferências
  preferredLanguage?: string // ISO language code (pt-BR, en-US, es-ES, etc.)

  // Status
  isActive: boolean
  isApproved: boolean
  emailVerified: boolean

  // Timestamps
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export interface RegisterInput {
  email: string // Email dos PAIS se for criança
  password: string
  confirmPassword: string
  role: UserRole
  fullName: string // Nome da CRIANÇA ou do PACIENTE
  cpf?: string
  birthDate?: string
  phone: string

  // Informações do responsável (para child-patient)
  guardianName?: string // Nome do pai/mãe
  guardianCpf?: string // CPF do responsável
  guardianPhone?: string // Telefone alternativo

  // Ortodontista
  cro?: string
  clinicName?: string // DEPRECATED
  clinicId?: string // ID da clínica (ortodontista e pacientes)

  // Código de tratamento (opcional - vincula paciente a ortodontista)
  treatmentCode?: string

  // Preferências
  preferredLanguage?: string // ISO language code (pt-BR, en-US, es-ES, etc.)
}

export interface LoginInput {
  credential: string // Email, CPF ou CRO
  password: string
}

export interface AuthResponse {
  user: User
  token: string
  expiresAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface UpdateUserInput {
  fullName?: string
  email?: string
  phone?: string
  birthDate?: string
  clinicName?: string
  preferredLanguage?: string
  profilePhotoUrl?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

// ============================================
// HELPER TYPE GUARDS
// ============================================

export const isChild = (user: User | null): boolean => {
  return user?.role === 'child-patient'
}

export const isPatient = (user: User | null): boolean => {
  return user?.role === 'patient' || user?.role === 'child-patient'
}

export const isOrthodontist = (user: User | null): boolean => {
  return user?.role === 'orthodontist'
}

export const isSuperAdmin = (user: User | null): boolean => {
  return user?.role === 'super-admin'
}

// ============================================
// PERMISSION HELPERS
// ============================================

export const canAccessAdminPanel = (user: User | null): boolean => {
  return isSuperAdmin(user) || isOrthodontist(user)
}

export const canManagePrompts = (user: User | null): boolean => {
  return isSuperAdmin(user)
}

export const canManageClinics = (user: User | null): boolean => {
  return isSuperAdmin(user)
}

export const canApproveOrthodontists = (user: User | null): boolean => {
  return isSuperAdmin(user)
}

export const canViewPatients = (user: User | null): boolean => {
  return isOrthodontist(user) || isSuperAdmin(user)
}

export const canManagePatients = (user: User | null): boolean => {
  return isOrthodontist(user)
}

export const canCreateTreatments = (user: User | null): boolean => {
  return isOrthodontist(user)
}
