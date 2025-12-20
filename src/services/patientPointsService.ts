import { apiClient } from '@/utils/apiClient'

export type PatientPoints = {
  id: string
  patientId: string
  coins: number
  xp: number
  level: number
}

export type PointTransaction = {
  id: string
  patientId: string
  kind: 'earn' | 'spend' | 'adjust' | string
  source: 'mission' | 'purchase' | 'manual' | 'streak' | string
  amountCoins: number
  balanceAfterCoins: number
  metadata: any
  createdAt: string
}

export class PatientPointsService {
  static async getPoints(clinicId: string, patientId: string, orthodontistId: string) {
    return apiClient.get<{ points: PatientPoints }>(
      `/clinic/${clinicId}/patients/${patientId}/points?orthodontistId=${encodeURIComponent(
        orthodontistId
      )}`
    )
  }

  static async adjustPoints(params: {
    clinicId: string
    patientId: string
    orthodontistId: string
    deltaCoins: number
    deltaXp: number
    reason?: string
  }) {
    const { clinicId, patientId } = params
    return apiClient.post<{
      points: PatientPoints
      transaction: PointTransaction
    }>(`/clinic/${clinicId}/patients/${patientId}/points/adjust`, {
      orthodontistId: params.orthodontistId,
      deltaCoins: params.deltaCoins,
      deltaXp: params.deltaXp,
      reason: params.reason || '',
    })
  }

  static async getTransactions(params: {
    clinicId: string
    patientId: string
    orthodontistId: string
    limit?: number
    cursor?: string | null
  }) {
    const { clinicId, patientId, orthodontistId } = params
    const qs = new URLSearchParams()
    qs.set('orthodontistId', orthodontistId)
    if (params.limit) qs.set('limit', String(params.limit))
    if (params.cursor) qs.set('cursor', params.cursor)

    return apiClient.get<{ transactions: PointTransaction[]; nextCursor: string | null }>(
      `/clinic/${clinicId}/patients/${patientId}/points/transactions?${qs.toString()}`
    )
  }
}



