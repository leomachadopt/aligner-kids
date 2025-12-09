/**
 * Aligner Service - Gerenciamento de Alinhadores
 * v2.0 - Migrado para API backend com Neon PostgreSQL
 */

import type { Aligner, CreateAlignerInput, UpdateAlignerInput } from '@/types/aligner'
import { apiClient } from '@/utils/apiClient'

export class AlignerService {
  /**
   * Criar alinhador
   */
  static async createAligner(input: CreateAlignerInput): Promise<Aligner> {
    try {
      const response = await apiClient.post<{ aligner: Aligner }>('/aligners', input)
      console.log(`✅ Alinhador ${response.aligner.number} criado`)
      return response.aligner
    } catch (error) {
      console.error('Erro ao criar alinhador:', error)
      throw error
    }
  }

  /**
   * Obter alinhador por ID
   */
  static async getAlignerById(alignerId: string): Promise<Aligner | null> {
    try {
      const response = await apiClient.get<{ aligner: Aligner }>(`/aligners/${alignerId}`)
      return response.aligner
    } catch (error) {
      console.error('Erro ao buscar alinhador:', error)
      return null
    }
  }

  /**
   * Obter todos alinhadores de um paciente
   */
  static async getAlignersByPatient(patientId: string): Promise<Aligner[]> {
    try {
      const response = await apiClient.get<{ aligners: Aligner[] }>(`/aligners/patient/${patientId}`)
      return response.aligners
    } catch (error) {
      console.error('Erro ao buscar alinhadores:', error)
      return []
    }
  }

  /**
   * Atualizar alinhador
   */
  static async updateAligner(
    alignerId: string,
    updates: UpdateAlignerInput,
  ): Promise<Aligner> {
    try {
      const response = await apiClient.put<{ aligner: Aligner }>(`/aligners/${alignerId}`, updates)
      return response.aligner
    } catch (error) {
      console.error('Erro ao atualizar alinhador:', error)
      throw error
    }
  }

  /**
   * Confirmar troca de alinhador
   */
  static async confirmAlignerChange(alignerId: string): Promise<void> {
    try {
      await apiClient.post(`/aligners/${alignerId}/confirm`, {})
      console.log('✅ Troca de alinhador confirmada')
    } catch (error) {
      console.error('Erro ao confirmar troca:', error)
      throw error
    }
  }

  /**
   * Criar alinhadores em lote para um tratamento
   */
  static async createAlignersForTreatment(
    treatmentId: string,
    patientId: string,
    totalAligners: number,
  ): Promise<Aligner[]> {
    try {
      const aligners: Aligner[] = []

      for (let i = 1; i <= totalAligners; i++) {
        const aligner = await this.createAligner({
          treatmentId,
          patientId,
          number: i,
          status: i === 1 ? 'active' : 'pending',
          startDate: i === 1 ? new Date().toISOString() : null,
        })
        aligners.push(aligner)
      }

      console.log(`✅ ${totalAligners} alinhadores criados`)
      return aligners
    } catch (error) {
      console.error('Erro ao criar alinhadores em lote:', error)
      throw error
    }
  }
}
