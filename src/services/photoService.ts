/**
 * Photo Service - Frontend
 * API client for progress photos functionality
 */

import { apiClient } from '@/utils/apiClient'
import type {
  ProgressPhoto,
  PhotoPeriod,
  PhotoUploadData,
  RequiredPhotosResponse,
} from '@/types/photo'

export class PhotoService {
  /**
   * Upload a new progress photo
   */
  static async uploadPhoto(data: PhotoUploadData): Promise<ProgressPhoto> {
    const response = await apiClient.post<{ photo: ProgressPhoto }>('/photos/upload', data)
    return response.photo
  }

  /**
   * Get all photos for a patient, grouped by period
   */
  static async getPatientPhotos(patientId: string): Promise<PhotoPeriod[]> {
    const response = await apiClient.get<{ periods: PhotoPeriod[], totalPhotos: number }>(
      `/photos/patient/${patientId}`
    )
    return response.periods
  }

  /**
   * Get all photos for a treatment
   */
  static async getTreatmentPhotos(treatmentId: string): Promise<ProgressPhoto[]> {
    const response = await apiClient.get<{ photos: ProgressPhoto[] }>(
      `/photos/treatment/${treatmentId}`
    )
    return response.photos
  }

  /**
   * Get photos for a specific period (aligner number)
   */
  static async getPeriodPhotos(patientId: string, alignerNumber: number): Promise<ProgressPhoto[]> {
    const response = await apiClient.get<{ photos: ProgressPhoto[] }>(
      `/photos/period/${patientId}/${alignerNumber}`
    )
    return response.photos
  }

  /**
   * Update clinician notes for a photo
   */
  static async updatePhotoNotes(
    photoId: string,
    clinicianNotes: string,
    hasIssues: boolean = false
  ): Promise<void> {
    await apiClient.patch(`/photos/${photoId}/notes`, {
      clinicianNotes,
      hasIssues,
    })
  }

  /**
   * Delete a photo
   */
  static async deletePhoto(photoId: string): Promise<void> {
    await apiClient.delete(`/photos/${photoId}`)
  }

  /**
   * Check if photos are required for current aligner
   */
  static async checkRequiredPhotos(patientId: string): Promise<RequiredPhotosResponse> {
    return await apiClient.get<RequiredPhotosResponse>(`/photos/required/${patientId}`)
  }

  /**
   * Convert file to base64
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }

  /**
   * Capture photo from camera (returns base64)
   */
  static async capturePhoto(): Promise<string> {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((stream) => {
          const video = document.createElement('video')
          video.srcObject = stream
          video.play()

          video.onloadedmetadata = () => {
            const canvas = document.createElement('canvas')
            canvas.width = video.videoWidth
            canvas.height = video.videoHeight
            const ctx = canvas.getContext('2d')

            if (ctx) {
              ctx.drawImage(video, 0, 0)
              const dataUrl = canvas.toDataURL('image/jpeg', 0.8)

              // Stop all tracks
              stream.getTracks().forEach((track) => track.stop())

              resolve(dataUrl)
            } else {
              reject(new Error('Could not get canvas context'))
            }
          }
        })
        .catch(reject)
    })
  }
}
