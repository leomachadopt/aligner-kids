import { apiClient } from '@/utils/apiClient'

export type StoryOptionRow = {
  id: string
  type: 'environment' | 'character' | 'theme' | string
  name: string
  icon: string
  color: string
  imageUrl?: string | null
  description?: string | null
  isDefault: boolean
  isActive: boolean
  sortOrder: number
  metadata?: Record<string, any>
  isLocked?: boolean
  isUnlockedByReward?: boolean
}

export type StoryOptionsResponse = {
  environments: StoryOptionRow[]
  characters: StoryOptionRow[]
  themes: StoryOptionRow[]
}

export class StoryOptionsService {
  static async getOptions(patientId: string): Promise<StoryOptionsResponse> {
    return apiClient.get<StoryOptionsResponse>(`/story/options?patientId=${encodeURIComponent(patientId)}`)
  }
}


