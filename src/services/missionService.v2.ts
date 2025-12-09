/**
 * Mission Service - Gerenciamento de Missões (Gamificação)
 * v2.0 - Migrado para API backend com Neon PostgreSQL
 */

import type {
  PatientMission,
  PatientPoints,
} from '@/types/mission'
import { apiClient } from '@/utils/apiClient'

export class MissionService {
  /**
   * Buscar missões de um paciente
   */
  static async getPatientMissions(patientId: string): Promise<PatientMission[]> {
    try {
      const response = await apiClient.get<{ missions: PatientMission[] }>(
        `/missions/patient/${patientId}`
      )
      return response.missions
    } catch (error) {
      console.error('Erro ao buscar missões:', error)
      return []
    }
  }

  /**
   * Criar missão para paciente
   */
  static async createPatientMission(input: any): Promise<PatientMission> {
    try {
      const response = await apiClient.post<{ mission: PatientMission }>('/missions', input)
      console.log('✅ Missão criada:', response.mission.title)
      return response.mission
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
