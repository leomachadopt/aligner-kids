import { apiClient } from '@/utils/apiClient'
import type { MissionProgram, MissionProgramTemplate } from '@/types/mission'

export type CreateProgramInput = {
  clinicId?: string | null
  name: string
  description?: string
  isDefault?: boolean
  templates?: Array<{
    missionTemplateId: string
    isActive?: boolean
    alignerInterval?: number
    trigger?: string
    triggerAlignerNumber?: number
    triggerDaysOffset?: number
    customPoints?: number
  }>
}

export class MissionProgramService {
  static async getPrograms(clinicId?: string): Promise<MissionProgram[]> {
    const res = await apiClient.get<{ programs: MissionProgram[] }>(
      `/mission-programs${clinicId ? `?clinicId=${clinicId}` : ''}`
    )
    return res.programs || []
  }

  static async getProgramWithTemplates(id: string): Promise<MissionProgram | null> {
    const res = await apiClient.get<{ program: MissionProgram | null; templates: MissionProgramTemplate[] }>(
      `/mission-programs/${id}`
    )
    if (!res.program) return null
    return { ...res.program, templates: res.templates || [] }
  }

  static async applyProgram(programId: string, patientId: string, totalAligners?: number): Promise<number> {
    const res = await apiClient.post<{ created: number }>(`/mission-programs/${programId}/apply`, {
      patientId,
      totalAligners,
    })
    return res.created
  }

  static async createProgram(input: CreateProgramInput): Promise<MissionProgram> {
    const res = await apiClient.post<{ program: MissionProgram }>(`/mission-programs`, input)
    return res.program
  }

  static async updateProgram(
    id: string,
    updates: Partial<CreateProgramInput>,
  ): Promise<MissionProgram> {
    const res = await apiClient.put<{ program: MissionProgram }>(`/mission-programs/${id}`, updates)
    return res.program
  }
}

