/**
 * Phase Service (Frontend)
 * Manages treatment phases operations via API
 */

import { apiClient } from '@/utils/apiClient'
import type { TreatmentPhase } from '@/types/aligner'

export interface CreatePhaseInput {
  treatmentId: string
  phaseName: string
  description?: string
  totalAligners: number
  startDate?: string
  expectedEndDate?: string
}

export class PhaseService {
  /**
   * Get all phases for a treatment
   */
  static async getPhasesByTreatment(treatmentId: string): Promise<TreatmentPhase[]> {
    return apiClient.get(`/phases/treatment/${treatmentId}`)
  }

  /**
   * Get active phase for a treatment
   */
  static async getActivePhase(treatmentId: string): Promise<TreatmentPhase | null> {
    try {
      return await apiClient.get(`/phases/treatment/${treatmentId}/active`)
    } catch (error) {
      return null
    }
  }

  /**
   * Get phase by ID
   */
  static async getPhaseById(phaseId: string): Promise<TreatmentPhase> {
    return apiClient.get(`/phases/${phaseId}`)
  }

  /**
   * Create a new phase
   */
  static async createPhase(data: CreatePhaseInput): Promise<TreatmentPhase> {
    return apiClient.post('/phases', data)
  }

  /**
   * Update a phase
   */
  static async updatePhase(
    phaseId: string,
    updates: Partial<TreatmentPhase>
  ): Promise<TreatmentPhase> {
    return apiClient.put(`/phases/${phaseId}`, updates)
  }

  /**
   * Start a phase
   */
  static async startPhase(phaseId: string, startDate?: string): Promise<TreatmentPhase> {
    return apiClient.post(`/phases/${phaseId}/start`, { startDate })
  }

  /**
   * Complete a phase
   */
  static async completePhase(phaseId: string, actualEndDate?: string): Promise<TreatmentPhase> {
    return apiClient.post(`/phases/${phaseId}/complete`, { actualEndDate })
  }

  /**
   * Pause a phase
   */
  static async pausePhase(phaseId: string): Promise<TreatmentPhase> {
    return apiClient.post(`/phases/${phaseId}/pause`, {})
  }

  /**
   * Resume a paused phase
   */
  static async resumePhase(phaseId: string): Promise<TreatmentPhase> {
    return apiClient.post(`/phases/${phaseId}/resume`, {})
  }

  /**
   * Get overall progress of treatment
   */
  static async getOverallProgress(treatmentId: string): Promise<number> {
    const response = await apiClient.get<{ progress: number }>(
      `/phases/treatment/${treatmentId}/progress`
    )
    return response.progress
  }

  /**
   * Get progress of a specific phase
   */
  static async getPhaseProgress(phaseId: string): Promise<number> {
    const response = await apiClient.get<{ progress: number }>(`/phases/${phaseId}/progress`)
    return response.progress
  }

  /**
   * Calculate phase progress locally
   */
  static calculateLocalPhaseProgress(phase: TreatmentPhase): number {
    if (phase.totalAligners === 0) return 0
    return Math.round((phase.currentAlignerNumber / phase.totalAligners) * 100)
  }

  /**
   * Get status badge color
   */
  static getStatusBadgeColor(status: TreatmentPhase['status']): string {
    switch (status) {
      case 'active':
        return 'bg-blue-500'
      case 'completed':
        return 'bg-green-500'
      case 'paused':
        return 'bg-yellow-500'
      case 'cancelled':
        return 'bg-red-500'
      case 'pending':
      default:
        return 'bg-gray-500'
    }
  }

  /**
   * Get status label
   */
  static getStatusLabel(status: TreatmentPhase['status']): string {
    switch (status) {
      case 'active':
        return 'Ativo'
      case 'completed':
        return 'Concluído'
      case 'paused':
        return 'Pausado'
      case 'cancelled':
        return 'Cancelado'
      case 'pending':
      default:
        return 'Pendente'
    }
  }
}
