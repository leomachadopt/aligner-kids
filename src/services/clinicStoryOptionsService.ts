import { apiClient } from '@/utils/apiClient'

export type ClinicStoryOptionsItem = {
  template: any
  override: any | null
  effective: {
    id: string
    type: 'environment' | 'character' | 'theme' | string
    name: string
    description?: string | null
    icon: string
    color: string
    imageUrl?: string | null
    isDefault: boolean
    isActive: boolean
    sortOrder: number
  }
}

export class ClinicStoryOptionsService {
  static async list(clinicId: string, userId: string): Promise<{ items: ClinicStoryOptionsItem[] }> {
    return apiClient.get(
      `/clinic/${encodeURIComponent(clinicId)}/story-options?userId=${encodeURIComponent(userId)}`,
    )
  }

  static async upsertOverride(clinicId: string, templateId: string, payload: any): Promise<{ override: any }> {
    return apiClient.put(
      `/clinic/${encodeURIComponent(clinicId)}/story-options/${encodeURIComponent(templateId)}`,
      payload,
    )
  }
}





