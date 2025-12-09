/**
 * Tipos para Sistema de Tratamentos
 * v2.0
 */

export type TreatmentStatus = 'planned' | 'active' | 'paused' | 'completed' | 'cancelled'

export interface Treatment {
  id: string

  // Relacionamentos
  patientId: string
  orthodontistId: string
  clinicId: string

  // Informações do Tratamento
  treatmentCode: string
  totalAligners: number
  currentAligner: number

  // Datas
  startDate: string
  estimatedEndDate: string
  actualEndDate?: string

  // Status
  status: TreatmentStatus

  // Notas
  notes?: string

  // Timestamps
  createdAt: string
  updatedAt: string
}

export interface CreateTreatmentInput {
  patientId: string
  treatmentCode: string
  totalAligners: number
  startDate: string
  estimatedEndDate: string
  notes?: string
}

export interface UpdateTreatmentInput {
  currentAligner?: number
  status?: TreatmentStatus
  notes?: string
  actualEndDate?: string
}

export interface TreatmentWithPatient extends Treatment {
  patient: {
    id: string
    fullName: string
    email: string
    birthDate?: string
  }
}

export interface TreatmentStats {
  totalTreatments: number
  activeTreatments: number
  completedTreatments: number
  pausedTreatments: number
  cancelledTreatments: number
  averageProgress: number
  overdueTreatments: number
}
