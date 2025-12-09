/**
 * Treatment Service - Gerenciamento de Tratamentos
 * v2.0 - Migrado para API backend com Neon PostgreSQL
 */

import type {
  Treatment,
  CreateTreatmentInput,
  UpdateTreatmentInput,
} from '@/types/treatment'
import { apiClient } from '@/utils/apiClient'

export class TreatmentService {
  /**
   * Criar novo tratamento (ortodontista)
   */
  static async createTreatment(
    input: CreateTreatmentInput,
    orthodontistId: string,
    clinicId: string,
  ): Promise<Treatment> {
    try {
      const response = await apiClient.post<{ treatment: Treatment }>('/treatments', {
        ...input,
        orthodontistId,
        clinicId,
      })
      console.log('✅ Tratamento criado:', response.treatment.treatmentCode)
      return response.treatment
    } catch (error) {
      console.error('Erro ao criar tratamento:', error)
      throw error
    }
  }

  /**
   * Obter tratamento por ID
   */
  static async getTreatmentById(treatmentId: string): Promise<Treatment | null> {
    try {
      const response = await apiClient.get<{ treatment: Treatment }>(`/treatments/${treatmentId}`)
      return response.treatment
    } catch (error) {
      console.error('Erro ao buscar tratamento:', error)
      return null
    }
  }

  /**
   * Obter tratamento de um paciente
   */
  static async getTreatmentByPatient(patientId: string): Promise<Treatment | null> {
    try {
      const response = await apiClient.get<{ treatment: Treatment }>(`/treatments/patient/${patientId}`)
      return response.treatment
    } catch (error) {
      console.error('Erro ao buscar tratamento do paciente:', error)
      return null
    }
  }

  /**
   * Atualizar tratamento
   */
  static async updateTreatment(
    treatmentId: string,
    updates: UpdateTreatmentInput,
  ): Promise<Treatment> {
    try {
      const response = await apiClient.put<{ treatment: Treatment }>(`/treatments/${treatmentId}`, updates)
      return response.treatment
    } catch (error) {
      console.error('Erro ao atualizar tratamento:', error)
      throw error
    }
  }
}
