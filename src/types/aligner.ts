export type AlignerStatus = 'pending' | 'active' | 'completed' | 'delayed'
export type TreatmentStatus = 'active' | 'paused' | 'completed' | 'cancelled'
export type PhaseStatus = 'pending' | 'active' | 'completed' | 'paused' | 'cancelled'

export interface Aligner {
  id: string
  number: number
  patientId: string
  treatmentId?: string // FK to treatment (container) - for gamification
  phaseId?: string // FK to treatment_phases - for phase tracking
  alignerNumberInPhase?: number // Number within the phase
  startDate: string // ISO date string
  expectedEndDate: string // ISO date string
  actualEndDate: string | null // ISO date string or null
  usageDays: number
  usageHours: number // calculated
  status: AlignerStatus
  wearTime: number // recommended daily wear time in hours
  changeInterval: number // interval in days
  notes?: string
}

export interface TreatmentPhase {
  id: string
  treatmentId: string
  phaseNumber: number
  phaseName: string
  description?: string
  adherenceTargetPercent?: number

  // Aligner numbering for this phase
  startAlignerNumber: number
  endAlignerNumber: number
  totalAligners: number
  currentAlignerNumber: number

  // Phase status
  status: PhaseStatus

  // Dates
  startDate?: string
  expectedEndDate?: string
  actualEndDate?: string

  notes?: string
  createdAt?: string
  updatedAt?: string
}

export interface Treatment {
  id: string
  patientId: string
  orthodontistId?: string
  name?: string

  // Overall treatment info (container)
  overallStatus: TreatmentStatus
  totalPhasesPlanned: number
  currentPhaseNumber: number
  totalAlignersOverall: number
  currentAlignerOverall: number

  startDate: string // ISO date string
  expectedEndDate?: string // ISO date string

  // Legacy fields (for backwards compatibility)
  totalAligners?: number
  currentAlignerNumber?: number
  status?: TreatmentStatus

  aligners?: Aligner[]
  phases?: TreatmentPhase[]
}

export interface StoryChapter {
  id: string
  treatmentId?: string
  chapterNumber: number
  requiredAlignerNumber: number // minimum aligner number to unlock
  title: string
  content: string
  unlocked?: boolean // calculated based on current aligner
}

// Service interfaces for CRUD operations
export interface AlignerService {
  getAlignersByPatient(patientId: string, treatmentId?: string): Promise<Aligner[]>
  getAlignerById(id: string): Promise<Aligner | null>
  createAligner(aligner: Omit<Aligner, 'id' | 'usageDays' | 'usageHours'>): Promise<Aligner>
  updateAligner(id: string, updates: Partial<Aligner>): Promise<Aligner>
  deleteAligner(id: string): Promise<void>
  getTreatmentByPatient(patientId: string): Promise<Treatment | null>
  getTreatmentsByPatient(patientId: string): Promise<Treatment[]>
  createTreatment(treatment: Omit<Treatment, 'id'>): Promise<Treatment>
  updateTreatment(id: string, updates: Partial<Treatment>): Promise<Treatment>
  deleteTreatment(id: string): Promise<void>
  getCurrentAligner(patientId: string, treatmentId?: string): Promise<Aligner | null>
  confirmAlignerChange(patientId: string, alignerId: string): Promise<Aligner>
  startTreatment(treatmentId: string): Promise<{
    success: boolean
    message: string
    treatment: any
    currentPhase: any
    currentAligner: any
  }>
  canActivateAligner(alignerId: string): Promise<{
    canActivate: boolean
    daysRemaining: number
    nextActivationDate: string
    currentStatus: string
  }>
}



