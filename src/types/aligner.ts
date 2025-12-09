export type AlignerStatus = 'pending' | 'active' | 'completed' | 'delayed'
export type TreatmentStatus = 'active' | 'paused' | 'completed' | 'cancelled'

export interface Aligner {
  id: string
  number: number
  patientId: string
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

export interface Treatment {
  id: string
  patientId: string
  orthodontistId: string
  startDate: string // ISO date string
  expectedEndDate: string // ISO date string
  totalAligners: number
  currentAlignerNumber: number
  status: TreatmentStatus
  aligners: Aligner[]
}

export interface StoryChapter {
  id: string
  chapterNumber: number
  requiredAlignerNumber: number // minimum aligner number to unlock
  title: string
  content: string
  unlocked?: boolean // calculated based on current aligner
}

// Service interfaces for CRUD operations
export interface AlignerService {
  getAlignersByPatient(patientId: string): Promise<Aligner[]>
  getAlignerById(id: string): Promise<Aligner | null>
  createAligner(aligner: Omit<Aligner, 'id' | 'usageDays' | 'usageHours'>): Promise<Aligner>
  updateAligner(id: string, updates: Partial<Aligner>): Promise<Aligner>
  deleteAligner(id: string): Promise<void>
  getTreatmentByPatient(patientId: string): Promise<Treatment | null>
  createTreatment(treatment: Omit<Treatment, 'id'>): Promise<Treatment>
  updateTreatment(id: string, updates: Partial<Treatment>): Promise<Treatment>
  getCurrentAligner(patientId: string): Promise<Aligner | null>
  confirmAlignerChange(patientId: string, alignerId: string): Promise<Aligner>
}


