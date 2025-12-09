/**
 * Clinic Service - Gerenciamento de Clínicas
 * Apenas super-admin pode gerenciar clínicas
 * v2.0 - Migrado para API backend com Neon PostgreSQL
 */

import type { Clinic, ClinicInput, ClinicStats, UpdateClinicInput } from '@/types/clinic'
import { apiClient } from '@/utils/apiClient'

// ============================================
// CLINIC SERVICE
// ============================================

export class ClinicService {
  /**
   * Criar nova clínica (apenas super-admin)
   */
  static async createClinic(input: ClinicInput): Promise<Clinic> {
    try {
      const response = await apiClient.post<{ clinic: Clinic }>('/clinics', input)
      console.log('✅ Clínica criada:', response.clinic.name)
      return response.clinic
    } catch (error) {
      console.error('Erro ao criar clínica:', error)
      throw error
    }
  }

  /**
   * Listar todas as clínicas (apenas super-admin)
   */
  static async getAllClinics(): Promise<Clinic[]> {
    try {
      const response = await apiClient.get<{ clinics: Clinic[] }>('/clinics')
      return response.clinics
    } catch (error) {
      console.error('Erro ao listar clínicas:', error)
      throw error
    }
  }

  /**
   * Listar apenas clínicas ativas
   */
  static async getActiveClinics(): Promise<Clinic[]> {
    try {
      const response = await apiClient.get<{ clinics: Clinic[] }>('/clinics')
      return response.clinics.filter((c) => c.isActive)
    } catch (error) {
      console.error('Erro ao listar clínicas ativas:', error)
      throw error
    }
  }

  /**
   * Obter clínica por ID
   */
  static async getClinicById(clinicId: string): Promise<Clinic | null> {
    try {
      const response = await apiClient.get<{ clinic: Clinic }>(`/clinics/${clinicId}`)
      return response.clinic
    } catch (error) {
      console.error('Erro ao obter clínica:', error)
      return null
    }
  }

  /**
   * Obter clínica por slug
   */
  static async getClinicBySlug(slug: string): Promise<Clinic | null> {
    try {
      // This endpoint doesn't exist yet - we'll get all and filter
      const response = await apiClient.get<{ clinics: Clinic[] }>('/clinics')
      return response.clinics.find((c) => c.slug === slug) || null
    } catch (error) {
      console.error('Erro ao obter clínica por slug:', error)
      return null
    }
  }

  /**
   * Atualizar clínica
   */
  static async updateClinic(
    clinicId: string,
    updates: UpdateClinicInput,
  ): Promise<Clinic> {
    try {
      const response = await apiClient.put<{ clinic: Clinic }>(`/clinics/${clinicId}`, updates)
      console.log('✅ Clínica atualizada:', response.clinic.name)
      return response.clinic
    } catch (error) {
      console.error('Erro ao atualizar clínica:', error)
      throw error
    }
  }

  /**
   * Desativar clínica
   */
  static async deactivateClinic(clinicId: string): Promise<void> {
    try {
      await this.updateClinic(clinicId, { isActive: false })
      console.log('⚠️  Clínica desativada')
    } catch (error) {
      console.error('Erro ao desativar clínica:', error)
      throw error
    }
  }

  /**
   * Reativar clínica
   */
  static async activateClinic(clinicId: string): Promise<void> {
    try {
      await this.updateClinic(clinicId, { isActive: true })
      console.log('✅ Clínica reativada')
    } catch (error) {
      console.error('Erro ao reativar clínica:', error)
      throw error
    }
  }

  /**
   * Deletar clínica permanentemente (com exclusão em cascata)
   * ATENÇÃO: Também deleta todos os usuários vinculados (ortodontistas e pacientes)
   */
  static async deleteClinic(clinicId: string): Promise<void> {
    try {
      await apiClient.delete(`/clinics/${clinicId}`)
      console.log('🗑️  Clínica deletada')
    } catch (error) {
      console.error('Erro ao deletar clínica:', error)
      throw error
    }
  }

  /**
   * Obter estatísticas da clínica
   */
  static async getClinicStats(clinicId: string): Promise<ClinicStats> {
    try {
      // This endpoint doesn't exist yet
      // For now, return basic stats
      const clinic = await this.getClinicById(clinicId)

      if (!clinic) {
        throw new Error('Clínica não encontrada')
      }

      // TODO: Create /clinics/:id/stats endpoint in backend
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
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error)
      throw error
    }
  }

  /**
   * Obter estatísticas de todas as clínicas (super-admin)
   */
  static async getAllClinicsStats(): Promise<ClinicStats[]> {
    try {
      const clinics = await this.getActiveClinics()
      return Promise.all(
        clinics.map((clinic) => this.getClinicStats(clinic.id))
      )
    } catch (error) {
      console.error('Erro ao obter estatísticas de clínicas:', error)
      throw error
    }
  }
}

// ============================================
// SEED DE CLÍNICA DEMO
// ============================================

/**
 * Criar clínica de demonstração se não existir
 * NOTE: This is deprecated - seeding should be done on the backend
 */
export async function seedDemoClinic(): Promise<Clinic | null> {
  try {
    const existing = await ClinicService.getClinicBySlug('clinica-demo')

    if (existing) {
      console.log('✅ Clínica demo já existe')
      return existing
    }

    const demoClinic = await ClinicService.createClinic({
      name: 'Clínica Demo Kids Aligner',
      slug: 'clinica-demo',
      country: 'BR',
      email: 'contato@demo.com',
      phone: '(11) 99999-9999',
      addressCity: 'São Paulo',
      addressState: 'SP',
      subscriptionTier: 'pro',
    })

    console.log('✅ Clínica demo criada:', demoClinic.name)
    return demoClinic
  } catch (error) {
    console.error('Erro ao criar clínica demo:', error)
    return null
  }
}
