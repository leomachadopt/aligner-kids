/**
 * Tipos para Sistema de Clínicas (Multi-tenancy)
 * v2.0
 */

export interface Clinic {
  id: string
  name: string
  slug: string
  logoUrl?: string

  // Contato
  email: string
  phone?: string
  website?: string

  // Endereço
  addressStreet?: string
  addressNumber?: string
  addressComplement?: string
  addressNeighborhood?: string
  addressCity?: string
  addressState?: string
  addressZip?: string

  // Configurações
  primaryColor?: string
  timezone?: string
  gamificationConfig?: Record<string, any>

  // Status
  isActive: boolean
  subscriptionTier: 'basic' | 'pro' | 'enterprise'
  subscriptionExpiresAt?: string

  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface ClinicInput {
  name: string
  slug: string
  email: string
  phone?: string
  website?: string
  addressCity?: string
  addressState?: string
  primaryColor?: string
  subscriptionTier?: 'basic' | 'pro' | 'enterprise'
}

export interface ClinicStats {
  clinicId: string
  clinicName: string
  totalOrthodontists: number
  totalPatients: number
  totalTreatments: number
  activeTreatments: number
  completedTreatments: number
  totalStoriesGenerated: number
}

export interface UpdateClinicInput {
  name?: string
  email?: string
  phone?: string
  website?: string
  addressStreet?: string
  addressNumber?: string
  addressCity?: string
  addressState?: string
  primaryColor?: string
  logoUrl?: string
  gamificationConfig?: Record<string, any>
}
