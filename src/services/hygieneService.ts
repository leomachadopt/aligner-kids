import { apiClient } from '@/utils/apiClient'

export type HygieneDayInput = {
  date: string // YYYY-MM-DD
  flossOk: boolean
  alignerCleanCount: number // 0..2
}

export class HygieneService {
  static async submitWeeklyCheckin(input: {
    patientId: string
    userId: string
    days: HygieneDayInput[]
  }): Promise<any> {
    return apiClient.post('/hygiene/weekly-checkin', input)
  }
}


