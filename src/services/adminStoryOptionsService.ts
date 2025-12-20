import { apiClient } from '@/utils/apiClient'

export type StoryOptionTemplate = {
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
  metadata?: Record<string, any>
  createdByUserId?: string | null
}

export class AdminStoryOptionsService {
  static async listTemplates(): Promise<{ templates: StoryOptionTemplate[] }> {
    return apiClient.get('/admin/story-option-templates')
  }

  static async createTemplate(payload: any): Promise<{ template: StoryOptionTemplate }> {
    return apiClient.post('/admin/story-option-templates', payload)
  }

  static async updateTemplate(id: string, payload: any): Promise<{ template: StoryOptionTemplate }> {
    return apiClient.put(`/admin/story-option-templates/${encodeURIComponent(id)}`, payload)
  }

  static async deleteTemplate(id: string, createdByUserId: string): Promise<{ success: boolean }> {
    return apiClient.delete(
      `/admin/story-option-templates/${encodeURIComponent(id)}?createdByUserId=${encodeURIComponent(createdByUserId)}`,
    )
  }
}



