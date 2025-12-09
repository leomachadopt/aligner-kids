/**
 * Clinic Service - Gerenciamento de Clínicas
 * Apenas super-admin pode gerenciar clínicas
 */

import type { Clinic, ClinicInput, ClinicStats, UpdateClinicInput } from '@/types/clinic'

const STORAGE_KEY = 'clinics'

// ============================================
// HELPERS PRIVADOS
// ============================================

function getAllClinics(): Clinic[] {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

function saveClinics(clinics: Clinic[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clinics))
}

// ============================================
// CLINIC SERVICE
// ============================================

export class ClinicService {
  /**
   * Criar nova clínica (apenas super-admin)
   */
  static async createClinic(input: ClinicInput): Promise<Clinic> {
    const clinics = getAllClinics()

    // Validar slug único
    if (clinics.some((c) => c.slug === input.slug)) {
      throw new Error('Slug já está em uso')
    }

    // Validar email único
    if (clinics.some((c) => c.email === input.email)) {
      throw new Error('Email já está em uso')
    }

    const newClinic: Clinic = {
      id: `clinic-${Date.now()}`,
      name: input.name,
      slug: input.slug,
      email: input.email,
      phone: input.phone,
      website: input.website,
      addressCity: input.addressCity,
      addressState: input.addressState,
      primaryColor: input.primaryColor || '#3B82F6',
      timezone: 'America/Sao_Paulo',
      gamificationConfig: {},
      isActive: true,
      subscriptionTier: input.subscriptionTier || 'basic',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    clinics.push(newClinic)
    saveClinics(clinics)

    console.log('✅ Clínica criada:', newClinic.name)
    return newClinic
  }

  /**
   * Listar todas as clínicas (apenas super-admin)
   */
  static async getAllClinics(): Promise<Clinic[]> {
    return getAllClinics()
  }

  /**
   * Listar apenas clínicas ativas
   */
  static async getActiveClinics(): Promise<Clinic[]> {
    const clinics = getAllClinics()
    return clinics.filter((c) => c.isActive)
  }

  /**
   * Obter clínica por ID
   */
  static async getClinicById(clinicId: string): Promise<Clinic | null> {
    const clinics = getAllClinics()
    return clinics.find((c) => c.id === clinicId) || null
  }

  /**
   * Obter clínica por slug
   */
  static async getClinicBySlug(slug: string): Promise<Clinic | null> {
    const clinics = getAllClinics()
    return clinics.find((c) => c.slug === slug) || null
  }

  /**
   * Atualizar clínica
   */
  static async updateClinic(
    clinicId: string,
    updates: UpdateClinicInput,
  ): Promise<Clinic> {
    const clinics = getAllClinics()
    const index = clinics.findIndex((c) => c.id === clinicId)

    if (index === -1) {
      throw new Error('Clínica não encontrada')
    }

    clinics[index] = {
      ...clinics[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    saveClinics(clinics)
    console.log('✅ Clínica atualizada:', clinics[index].name)
    return clinics[index]
  }

  /**
   * Desativar clínica
   */
  static async deactivateClinic(clinicId: string): Promise<void> {
    const clinics = getAllClinics()
    const index = clinics.findIndex((c) => c.id === clinicId)

    if (index === -1) {
      throw new Error('Clínica não encontrada')
    }

    clinics[index].isActive = false
    clinics[index].updatedAt = new Date().toISOString()

    saveClinics(clinics)
    console.log('⚠️  Clínica desativada:', clinics[index].name)
  }

  /**
   * Reativar clínica
   */
  static async activateClinic(clinicId: string): Promise<void> {
    const clinics = getAllClinics()
    const index = clinics.findIndex((c) => c.id === clinicId)

    if (index === -1) {
      throw new Error('Clínica não encontrada')
    }

    clinics[index].isActive = true
    clinics[index].updatedAt = new Date().toISOString()

    saveClinics(clinics)
    console.log('✅ Clínica reativada:', clinics[index].name)
  }

  /**
   * Deletar clínica (cuidado!)
   */
  static async deleteClinic(clinicId: string): Promise<void> {
    const clinics = getAllClinics()
    const filtered = clinics.filter((c) => c.id !== clinicId)

    if (filtered.length === clinics.length) {
      throw new Error('Clínica não encontrada')
    }

    saveClinics(filtered)
    console.log('🗑️  Clínica deletada')
  }

  /**
   * Obter estatísticas da clínica
   */
  static async getClinicStats(clinicId: string): Promise<ClinicStats> {
    // TODO: Implementar com dados reais quando tiver users e treatments
    // Por enquanto retorna mock
    const clinic = await this.getClinicById(clinicId)

    if (!clinic) {
      throw new Error('Clínica não encontrada')
    }

    return {
      clinicId: clinic.id,
      clinicName: clinic.name,
      totalOrthodontists: 0,
      totalPatients: 0,
      totalTreatments: 0,
      activeTreatments: 0,
      completedTreatments: 0,
      totalStoriesGenerated: 0,
    }
  }

  /**
   * Obter estatísticas de todas as clínicas (super-admin)
   */
  static async getAllClinicsStats(): Promise<ClinicStats[]> {
    const clinics = await this.getActiveClinics()

    return Promise.all(
      clinics.map((clinic) => this.getClinicStats(clinic.id))
    )
  }
}

// ============================================
// SEED DE CLÍNICA DEMO
// ============================================

/**
 * Criar clínica de demonstração se não existir
 */
export async function seedDemoClinic(): Promise<Clinic> {
  const existing = await ClinicService.getClinicBySlug('clinica-demo')

  if (existing) {
    console.log('✅ Clínica demo já existe')
    return existing
  }

  const demoClinic = await ClinicService.createClinic({
    name: 'Clínica Demo Kids Aligner',
    slug: 'clinica-demo',
    email: 'contato@demo.com',
    phone: '(11) 99999-9999',
    addressCity: 'São Paulo',
    addressState: 'SP',
    subscriptionTier: 'pro',
  })

  console.log('✅ Clínica demo criada:', demoClinic.name)
  return demoClinic
}
