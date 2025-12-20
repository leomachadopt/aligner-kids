import { apiClient } from '@/utils/apiClient'

export type WearState = 'wearing' | 'paused'

export type WearDaily = {
  id: string
  patientId: string
  alignerId: string
  date: string
  wearMinutes: number
  targetMinutes: number
  targetPercent: number
  isDayOk: boolean
}

export type WearStatusResponse = {
  patientId: string
  alignerId: string
  state: WearState
  daily: WearDaily
  weekly?: WearDaily[]
  celebration?: any | null
}

export class AlignerWearApi {
  static async getStatus(patientId: string, alignerId: string): Promise<WearStatusResponse> {
    return apiClient.get(`/aligners/${encodeURIComponent(alignerId)}/wear/status?patientId=${encodeURIComponent(patientId)}`)
  }

  static async pause(patientId: string, userId: string, alignerId: string): Promise<WearStatusResponse> {
    return apiClient.post(`/aligners/${encodeURIComponent(alignerId)}/wear/pause`, { patientId, userId })
  }

  static async resume(patientId: string, userId: string, alignerId: string): Promise<WearStatusResponse> {
    return apiClient.post(`/aligners/${encodeURIComponent(alignerId)}/wear/resume`, { patientId, userId })
  }
}
