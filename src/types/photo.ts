/**
 * Photo Types - Frontend
 */

export type PhotoType = 'frontal' | 'right' | 'left'

export interface ProgressPhoto {
  id: string
  patientId: string
  treatmentId: string
  phaseId: string | null
  alignerNumber: number | null

  photoType: PhotoType
  photoUrl: string
  thumbnailUrl: string | null

  fileName: string | null
  fileSize: number | null
  mimeType: string | null

  capturedAt: string
  uploadedAt: string

  clinicianNotes: string | null
  hasIssues: boolean

  metadata: Record<string, any>

  createdAt: string
  updatedAt: string
}

export interface PhotoPeriod {
  period: number
  alignerNumber: number | null
  phaseId: string | null
  photos: ProgressPhoto[]
}

export interface PhotoUploadData {
  patientId: string
  treatmentId: string
  phaseId?: string
  alignerNumber?: number
  photoType: PhotoType
  photoData: string // base64
  capturedAt?: string
}

export interface RequiredPhotosResponse {
  required: boolean
  currentAligner: number
  missingTypes: PhotoType[]
  existingPhotos: number
  message: string
}
