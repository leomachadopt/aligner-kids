/**
 * Tipos para Sistema de Clínicas (Multi-tenancy)
 * v2.0
 */

export type Country = 'BR' | 'US' | 'PT' | 'ES' | 'MX' | 'AR'

export interface Clinic {
  id: string
  name: string
  slug: string
  logoUrl?: string
  country?: Country // País da clínica (determina formato de campos) - opcional para compatibilidade

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
  country?: Country // Opcional para compatibilidade, mas recomendado definir
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
  country?: Country
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

// Informações de cada país
export const COUNTRY_INFO: Record<Country, {
  name: string
  documentLabel: string // CPF, SSN, NIF, etc.
  documentPlaceholder: string
  phoneFormat: string
  zipLabel: string // CEP, ZIP, Código Postal
}> = {
  BR: {
    name: 'Brasil',
    documentLabel: 'CPF',
    documentPlaceholder: '000.000.000-00',
    phoneFormat: '(00) 00000-0000',
    zipLabel: 'CEP',
  },
  US: {
    name: 'United States',
    documentLabel: 'SSN',
    documentPlaceholder: '000-00-0000',
    phoneFormat: '(000) 000-0000',
    zipLabel: 'ZIP Code',
  },
  PT: {
    name: 'Portugal',
    documentLabel: 'NIF',
    documentPlaceholder: '000000000',
    phoneFormat: '+351 000 000 000',
    zipLabel: 'Código Postal',
  },
  ES: {
    name: 'España',
    documentLabel: 'DNI/NIE',
    documentPlaceholder: '00000000-A',
    phoneFormat: '+34 000 000 000',
    zipLabel: 'Código Postal',
  },
  MX: {
    name: 'México',
    documentLabel: 'RFC',
    documentPlaceholder: 'AAAA000000XXX',
    phoneFormat: '+52 000 000 0000',
    zipLabel: 'Código Postal',
  },
  AR: {
    name: 'Argentina',
    documentLabel: 'DNI',
    documentPlaceholder: '00.000.000',
    phoneFormat: '+54 000 000 0000',
    zipLabel: 'Código Postal',
  },
}
