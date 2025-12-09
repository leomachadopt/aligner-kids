/**
 * Treatment Service - Gerenciamento de Tratamentos
 * Ortodontistas criam e gerenciam tratamentos de seus pacientes
 */

import type {
  Treatment,
  CreateTreatmentInput,
  UpdateTreatmentInput,
  TreatmentWithPatient,
  TreatmentStats,
} from '@/types/treatment'

const STORAGE_KEY = 'treatments'

// ============================================
// HELPERS PRIVADOS
// ============================================

function getAllTreatments(): Treatment[] {
  const data = localStorage.getItem(STORAGE_KEY)
  return data ? JSON.parse(data) : []
}

function saveTreatments(treatments: Treatment[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(treatments))
}

// ============================================
// TREATMENT SERVICE
// ============================================

export class TreatmentService {
  /**
   * Criar novo tratamento (ortodontista)
   */
  static async createTreatment(
    input: CreateTreatmentInput,
    orthodontistId: string,
    clinicId: string,
  ): Promise<Treatment> {
    const treatments = getAllTreatments()

    // Validar treatmentCode único
    if (treatments.some((t) => t.treatmentCode === input.treatmentCode)) {
      throw new Error('Código de tratamento já existe')
    }

    // Validar patientId (paciente não pode ter 2 tratamentos ativos)
    const existingActive = treatments.find(
      (t) => t.patientId === input.patientId && t.status === 'active'
    )

    if (existingActive) {
      throw new Error('Paciente já possui um tratamento ativo')
    }

    const newTreatment: Treatment = {
      id: `treatment-${Date.now()}`,
      patientId: input.patientId,
      orthodontistId,
      clinicId,
      treatmentCode: input.treatmentCode,
      totalAligners: input.totalAligners,
      currentAligner: 1,
      startDate: input.startDate,
      estimatedEndDate: input.estimatedEndDate,
      status: 'active',
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    treatments.push(newTreatment)
    saveTreatments(treatments)

    console.log('✅ Tratamento criado:', newTreatment.treatmentCode)
    return newTreatment
  }

  /**
   * Obter tratamento por ID
   */
  static async getTreatmentById(treatmentId: string): Promise<Treatment | null> {
    const treatments = getAllTreatments()
    return treatments.find((t) => t.id === treatmentId) || null
  }

  /**
   * Obter tratamento por código
   */
  static async getTreatmentByCode(treatmentCode: string): Promise<Treatment | null> {
    const treatments = getAllTreatments()
    return treatments.find((t) => t.treatmentCode === treatmentCode) || null
  }

  /**
   * Obter tratamento de um paciente
   */
  static async getTreatmentByPatient(patientId: string): Promise<Treatment | null> {
    const treatments = getAllTreatments()
    // Retorna o tratamento ativo, ou o mais recente
    const active = treatments.find((t) => t.patientId === patientId && t.status === 'active')
    if (active) return active

    const patientTreatments = treatments
      .filter((t) => t.patientId === patientId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return patientTreatments[0] || null
  }

  /**
   * Listar tratamentos de uma clínica
   */
  static async getTreatmentsByClinic(clinicId: string): Promise<Treatment[]> {
    const treatments = getAllTreatments()
    return treatments.filter((t) => t.clinicId === clinicId)
  }

  /**
   * Listar tratamentos de um ortodontista
   */
  static async getTreatmentsByOrthodontist(orthodontistId: string): Promise<Treatment[]> {
    const treatments = getAllTreatments()
    return treatments.filter((t) => t.orthodontistId === orthodontistId)
  }

  /**
   * Atualizar tratamento
   */
  static async updateTreatment(
    treatmentId: string,
    updates: UpdateTreatmentInput,
  ): Promise<Treatment> {
    const treatments = getAllTreatments()
    const index = treatments.findIndex((t) => t.id === treatmentId)

    if (index === -1) {
      throw new Error('Tratamento não encontrado')
    }

    // Validar currentAligner
    if (updates.currentAligner !== undefined) {
      if (
        updates.currentAligner < 1 ||
        updates.currentAligner > treatments[index].totalAligners
      ) {
        throw new Error('Número de alinhador inválido')
      }
    }

    treatments[index] = {
      ...treatments[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    saveTreatments(treatments)
    console.log('✅ Tratamento atualizado:', treatments[index].treatmentCode)
    return treatments[index]
  }

  /**
   * Avançar para próximo alinhador
   */
  static async advanceAligner(treatmentId: string): Promise<Treatment> {
    const treatment = await this.getTreatmentById(treatmentId)

    if (!treatment) {
      throw new Error('Tratamento não encontrado')
    }

    if (treatment.currentAligner >= treatment.totalAligners) {
      throw new Error('Tratamento já está no último alinhador')
    }

    const newAligner = treatment.currentAligner + 1

    // Se chegou ao último, marcar como concluído
    const status = newAligner === treatment.totalAligners ? 'completed' : treatment.status

    return this.updateTreatment(treatmentId, {
      currentAligner: newAligner,
      status,
      actualEndDate: status === 'completed' ? new Date().toISOString() : undefined,
    })
  }

  /**
   * Pausar tratamento
   */
  static async pauseTreatment(treatmentId: string): Promise<Treatment> {
    return this.updateTreatment(treatmentId, { status: 'paused' })
  }

  /**
   * Retomar tratamento
   */
  static async resumeTreatment(treatmentId: string): Promise<Treatment> {
    return this.updateTreatment(treatmentId, { status: 'active' })
  }

  /**
   * Cancelar tratamento
   */
  static async cancelTreatment(treatmentId: string): Promise<Treatment> {
    return this.updateTreatment(treatmentId, { status: 'cancelled' })
  }

  /**
   * Completar tratamento
   */
  static async completeTreatment(treatmentId: string): Promise<Treatment> {
    return this.updateTreatment(treatmentId, {
      status: 'completed',
      actualEndDate: new Date().toISOString(),
    })
  }

  /**
   * Obter estatísticas de uma clínica
   */
  static async getClinicStats(clinicId: string): Promise<TreatmentStats> {
    const treatments = await this.getTreatmentsByClinic(clinicId)

    const totalTreatments = treatments.length
    const activeTreatments = treatments.filter((t) => t.status === 'active').length
    const completedTreatments = treatments.filter((t) => t.status === 'completed').length
    const pausedTreatments = treatments.filter((t) => t.status === 'paused').length
    const cancelledTreatments = treatments.filter((t) => t.status === 'cancelled').length

    const totalProgress = treatments.reduce(
      (acc, t) => acc + (t.currentAligner / t.totalAligners) * 100,
      0
    )
    const averageProgress = totalTreatments > 0 ? totalProgress / totalTreatments : 0

    // Calcular atrasados (TODO: implementar lógica de data)
    const overdueTreatments = 0

    return {
      totalTreatments,
      activeTreatments,
      completedTreatments,
      pausedTreatments,
      cancelledTreatments,
      averageProgress: Math.round(averageProgress),
      overdueTreatments,
    }
  }

  /**
   * Obter estatísticas de um ortodontista
   */
  static async getOrthodontistStats(orthodontistId: string): Promise<TreatmentStats> {
    const treatments = await this.getTreatmentsByOrthodontist(orthodontistId)

    const totalTreatments = treatments.length
    const activeTreatments = treatments.filter((t) => t.status === 'active').length
    const completedTreatments = treatments.filter((t) => t.status === 'completed').length
    const pausedTreatments = treatments.filter((t) => t.status === 'paused').length
    const cancelledTreatments = treatments.filter((t) => t.status === 'cancelled').length

    const totalProgress = treatments.reduce(
      (acc, t) => acc + (t.currentAligner / t.totalAligners) * 100,
      0
    )
    const averageProgress = totalTreatments > 0 ? totalProgress / totalTreatments : 0

    const overdueTreatments = 0

    return {
      totalTreatments,
      activeTreatments,
      completedTreatments,
      pausedTreatments,
      cancelledTreatments,
      averageProgress: Math.round(averageProgress),
      overdueTreatments,
    }
  }

  /**
   * Deletar tratamento (cuidado!)
   */
  static async deleteTreatment(treatmentId: string): Promise<void> {
    const treatments = getAllTreatments()
    const filtered = treatments.filter((t) => t.id !== treatmentId)

    if (filtered.length === treatments.length) {
      throw new Error('Tratamento não encontrado')
    }

    saveTreatments(filtered)
    console.log('🗑️  Tratamento deletado')
  }
}
