/**
 * Mission Service - Gerenciamento de Missões (Gamificação)
 * v2.0 - Migrado para API backend com Neon PostgreSQL
 */

import type {
  PatientMission,
  PatientPoints,
  MissionTemplate,
  ActivatePatientMissionInput,
  CreateMissionTemplateInput,
  UpdateMissionTemplateInput,
} from '@/types/mission'
import { apiClient } from '@/utils/apiClient'

function mapTemplate(apiTemplate: any): MissionTemplate {
  return {
    id: apiTemplate.id,
    name: apiTemplate.name,
    description: apiTemplate.description,
    category: apiTemplate.category,
    frequency: apiTemplate.frequency,
    completionCriteria: apiTemplate.completionCriteria,
    targetValue: apiTemplate.targetValue ?? 1,
    basePoints: apiTemplate.basePoints ?? 0,
    bonusPoints: apiTemplate.bonusPoints ?? 0,
    icon: apiTemplate.iconEmoji || apiTemplate.icon || '⭐',
    color: apiTemplate.color || '#FFD700',
    isActiveByDefault: apiTemplate.isActiveByDefault ?? true,
    requiresManualValidation: apiTemplate.requiresManualValidation ?? false,
    alignerInterval: apiTemplate.alignerInterval ?? 1,
    availableFrom: apiTemplate.availableFrom,
    expiresAfter: apiTemplate.expiresAfter,
    scheduledStartDate: apiTemplate.scheduledStartDate || undefined,
    scheduledEndDate: apiTemplate.scheduledEndDate || undefined,
    autoActivate: apiTemplate.canAutoActivate ?? true,
    activeDaysOfWeek: apiTemplate.repeatOn || undefined,
    repeatSchedule: (apiTemplate.repetitionType as any) || 'none',
    isGlobal: true,
    createdAt: apiTemplate.createdAt || new Date().toISOString(),
    updatedAt: apiTemplate.updatedAt || new Date().toISOString(),
  }
}

function mapPatientMission(apiMission: any): PatientMission {
  const statusMap: Record<string, string> = {
    active: 'in_progress',
  }
  return {
    id: apiMission.id,
    patientId: apiMission.patientId,
    missionTemplateId: apiMission.missionTemplateId || apiMission.templateId,
    status: (statusMap[apiMission.status] as any) || apiMission.status || 'available',
    progress: apiMission.progress ?? 0,
    targetValue: apiMission.targetValue ?? apiMission.target ?? 1,
    startedAt: apiMission.startedAt || apiMission.createdAt || new Date().toISOString(),
    completedAt: apiMission.completedAt || undefined,
    expiresAt: apiMission.expiresAt || undefined,
    trigger: apiMission.trigger || undefined,
    triggerAlignerNumber: apiMission.triggerAlignerNumber || undefined,
    triggerDaysOffset: apiMission.triggerDaysOffset || undefined,
    autoActivated: apiMission.autoActivated ?? true,
    pointsEarned: apiMission.pointsEarned ?? 0,
    customPoints: apiMission.customPoints || undefined,
    validatedBy: apiMission.validatedBy || undefined,
    validatedAt: apiMission.validatedAt || undefined,
    metadata: apiMission.metadata || undefined,
    createdAt: apiMission.createdAt || new Date().toISOString(),
    updatedAt: apiMission.updatedAt || new Date().toISOString(),
  }
}

export class MissionService {
  /**
   * Templates
   */
  static async getAllTemplates(): Promise<MissionTemplate[]> {
    try {
      const response = await apiClient.get<{ templates: any[] }>(`/missions/templates`)
      return (response.templates || []).map(mapTemplate)
    } catch (error) {
      console.error('Erro ao buscar templates de missão:', error)
      return []
    }
  }

  static async createTemplate(input: CreateMissionTemplateInput): Promise<MissionTemplate> {
    const payload = {
      ...input,
      iconEmoji: input.icon,
    }
    const response = await apiClient.post<{ template: any }>(`/missions/templates`, payload)
    return mapTemplate(response.template)
  }

  static async updateTemplate(
    id: string,
    updates: UpdateMissionTemplateInput,
  ): Promise<MissionTemplate> {
    const payload = {
      ...updates,
      iconEmoji: updates.icon,
    }
    const response = await apiClient.put<{ template: any }>(`/missions/templates/${id}`, payload)
    return mapTemplate(response.template)
  }

  static async deleteTemplate(id: string): Promise<void> {
    await apiClient.delete(`/missions/templates/${id}`)
  }

  /**
   * Buscar missões de um paciente
   */
  static async getPatientMissions(patientId: string): Promise<PatientMission[]> {
    try {
      const response = await apiClient.get<{ missions: PatientMission[] }>(
        `/missions/patient/${patientId}`
      )
      return (response.missions || []).map(mapPatientMission)
    } catch (error) {
      console.error('Erro ao buscar missões:', error)
      return []
    }
  }

  /**
   * Ativar missão para paciente a partir de template
   */
  static async activateMissionForPatient(input: ActivatePatientMissionInput): Promise<PatientMission> {
    const response = await apiClient.post<{ mission: any }>(`/missions/assign`, input as any)
    return mapPatientMission(response.mission)
  }

  static async cloneMissionsToPatients(sourcePatientId: string, targetPatientIds: string[]): Promise<void> {
    await apiClient.post('/missions/clone', { sourcePatientId, targetPatientIds })
  }

  /**
   * Criar missão para paciente
   */
  static async createPatientMission(input: any): Promise<PatientMission> {
    try {
      const response = await apiClient.post<{ mission: PatientMission }>('/missions', input)
      console.log('✅ Missão criada:', response.mission.title || response.mission.id)
      return mapPatientMission(response.mission)
    } catch (error) {
      console.error('Erro ao criar missão:', error)
      throw error
    }
  }

  /**
   * Atualizar progresso da missão
   */
  static async updateMissionProgress(
    missionId: string,
    progress: number,
  ): Promise<PatientMission> {
    try {
      const response = await apiClient.put<{ mission: PatientMission }>(
        `/missions/${missionId}`,
        { progress }
      )
      return response.mission
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error)
      throw error
    }
  }

  /**
   * Completar missão
   */
  static async completeMission(missionId: string): Promise<PatientMission> {
    try {
      const response = await apiClient.post<{ mission: PatientMission }>(
        `/missions/${missionId}/complete`,
        {}
      )
      console.log('✅ Missão completada!')
      return response.mission
    } catch (error) {
      console.error('Erro ao completar missão:', error)
      throw error
    }
  }

  /**
   * Buscar pontos de um paciente
   */
  static async getPatientPoints(patientId: string): Promise<PatientPoints> {
    try {
      const response = await apiClient.get<{ points: PatientPoints }>(
        `/points/patient/${patientId}`
      )
      return response.points
    } catch (error) {
      console.error('Erro ao buscar pontos:', error)
      // Retornar pontos zerados se não encontrar
      return {
        id: '',
        patientId,
        coins: 0,
        xp: 0,
        level: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    }
  }

  /**
   * Adicionar moedas/XP a um paciente
   */
  static async addPoints(
    patientId: string,
    coins: number = 0,
    xp: number = 0,
  ): Promise<PatientPoints> {
    try {
      const response = await apiClient.post<{ points: PatientPoints }>(
        `/points/patient/${patientId}/add`,
        { coins, xp }
      )
      console.log(`✅ Adicionados: ${coins} moedas, ${xp} XP`)
      return response.points
    } catch (error) {
      console.error('Erro ao adicionar pontos:', error)
      throw error
    }
  }

  /**
   * Atualizar pontos de um paciente (substituir valores)
   */
  static async updatePatientPoints(
    patientId: string,
    updates: Partial<PatientPoints>,
  ): Promise<PatientPoints> {
    try {
      const response = await apiClient.put<{ points: PatientPoints }>(
        `/points/patient/${patientId}`,
        updates
      )
      return response.points
    } catch (error) {
      console.error('Erro ao atualizar pontos:', error)
      throw error
    }
  }
}
