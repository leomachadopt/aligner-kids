/**
 * Mission Service - Gerenciamento de Missões (Gamificação)
 * Gerencia templates de missões, configurações da clínica e missões dos pacientes
 */

import type {
  MissionTemplate,
  ClinicMissionConfig,
  PatientMission,
  PatientPoints,
  CreateMissionTemplateInput,
  UpdateMissionTemplateInput,
  ActivatePatientMissionInput,
  UpdatePatientMissionProgressInput,
  LeaderboardEntry,
} from '@/types/mission'

const STORAGE_KEY_TEMPLATES = 'mission_templates'
const STORAGE_KEY_CLINIC_CONFIGS = 'clinic_mission_configs'
const STORAGE_KEY_PATIENT_MISSIONS = 'patient_missions'
const STORAGE_KEY_PATIENT_POINTS = 'patient_points'

// ============================================
// HELPERS PRIVADOS
// ============================================

function getAllTemplates(): MissionTemplate[] {
  const data = localStorage.getItem(STORAGE_KEY_TEMPLATES)
  return data ? JSON.parse(data) : []
}

function saveTemplates(templates: MissionTemplate[]): void {
  localStorage.setItem(STORAGE_KEY_TEMPLATES, JSON.stringify(templates))
}

function getAllClinicConfigs(): ClinicMissionConfig[] {
  const data = localStorage.getItem(STORAGE_KEY_CLINIC_CONFIGS)
  return data ? JSON.parse(data) : []
}

function saveClinicConfigs(configs: ClinicMissionConfig[]): void {
  localStorage.setItem(STORAGE_KEY_CLINIC_CONFIGS, JSON.stringify(configs))
}

function getAllPatientMissions(): PatientMission[] {
  const data = localStorage.getItem(STORAGE_KEY_PATIENT_MISSIONS)
  return data ? JSON.parse(data) : []
}

function savePatientMissions(missions: PatientMission[]): void {
  localStorage.setItem(STORAGE_KEY_PATIENT_MISSIONS, JSON.stringify(missions))
}

function getAllPatientPoints(): PatientPoints[] {
  const data = localStorage.getItem(STORAGE_KEY_PATIENT_POINTS)
  return data ? JSON.parse(data) : []
}

function savePatientPoints(points: PatientPoints[]): void {
  localStorage.setItem(STORAGE_KEY_PATIENT_POINTS, JSON.stringify(points))
}

// ============================================
// MISSION SERVICE
// ============================================

export class MissionService {
  // ============================================
  // TEMPLATES DE MISSÕES (Super-admin)
  // ============================================

  /**
   * Criar novo template de missão
   */
  static async createTemplate(input: CreateMissionTemplateInput): Promise<MissionTemplate> {
    const templates = getAllTemplates()

    const newTemplate: MissionTemplate = {
      id: `mission-${Date.now()}`,
      name: input.name,
      description: input.description,
      category: input.category,
      frequency: input.frequency,
      completionCriteria: input.completionCriteria,
      targetValue: input.targetValue,
      basePoints: input.basePoints,
      bonusPoints: input.bonusPoints,
      icon: input.icon,
      color: input.color,
      isActiveByDefault: input.isActiveByDefault ?? true,
      requiresManualValidation: input.requiresManualValidation ?? false,
      availableFrom: input.availableFrom,
      expiresAfter: input.expiresAfter,
      isGlobal: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    templates.push(newTemplate)
    saveTemplates(templates)

    console.log('✅ Template de missão criado:', newTemplate.name)
    return newTemplate
  }

  /**
   * Listar todos os templates
   */
  static async getAllTemplates(): Promise<MissionTemplate[]> {
    return getAllTemplates()
  }

  /**
   * Obter template por ID
   */
  static async getTemplateById(id: string): Promise<MissionTemplate | null> {
    const templates = getAllTemplates()
    return templates.find((t) => t.id === id) || null
  }

  /**
   * Atualizar template
   */
  static async updateTemplate(
    id: string,
    updates: UpdateMissionTemplateInput,
  ): Promise<MissionTemplate> {
    const templates = getAllTemplates()
    const index = templates.findIndex((t) => t.id === id)

    if (index === -1) {
      throw new Error('Template não encontrado')
    }

    templates[index] = {
      ...templates[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    saveTemplates(templates)
    console.log('✅ Template atualizado:', templates[index].name)
    return templates[index]
  }

  /**
   * Deletar template
   */
  static async deleteTemplate(id: string): Promise<void> {
    const templates = getAllTemplates()
    const filtered = templates.filter((t) => t.id !== id)
    saveTemplates(filtered)
    console.log('🗑️ Template deletado')
  }

  /**
   * Clonar template (criar uma cópia)
   */
  static async cloneTemplate(id: string): Promise<MissionTemplate> {
    const templates = getAllTemplates()
    const original = templates.find((t) => t.id === id)

    if (!original) {
      throw new Error('Template não encontrado')
    }

    const cloned: MissionTemplate = {
      ...original,
      id: `mission-${Date.now()}`,
      name: `${original.name} (Cópia)`,
      isGlobal: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    templates.push(cloned)
    saveTemplates(templates)
    console.log('📋 Template clonado:', cloned.name)
    return cloned
  }

  // ============================================
  // CONFIGURAÇÃO DA CLÍNICA (Dentista)
  // ============================================

  /**
   * Obter configuração de missões da clínica
   */
  static async getClinicConfig(clinicId: string): Promise<ClinicMissionConfig> {
    const configs = getAllClinicConfigs()
    let config = configs.find((c) => c.clinicId === clinicId)

    // Se não existe, criar com defaults
    if (!config) {
      const templates = getAllTemplates()
      const activeByDefault = templates
        .filter((t) => t.isActiveByDefault)
        .map((t) => t.id)

      config = {
        id: `config-${Date.now()}`,
        clinicId,
        activeMissionIds: activeByDefault,
        pointsMultiplier: 1.0,
        customMissions: [],
        enableLeaderboard: true,
        enableBadges: true,
        enableRewards: true,
        updatedAt: new Date().toISOString(),
      }

      configs.push(config)
      saveClinicConfigs(configs)
    }

    return config
  }

  /**
   * Atualizar configuração da clínica
   */
  static async updateClinicConfig(
    clinicId: string,
    updates: Partial<ClinicMissionConfig>,
  ): Promise<ClinicMissionConfig> {
    const configs = getAllClinicConfigs()
    const index = configs.findIndex((c) => c.clinicId === clinicId)

    if (index === -1) {
      throw new Error('Configuração não encontrada')
    }

    configs[index] = {
      ...configs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    saveClinicConfigs(configs)
    console.log('✅ Configuração da clínica atualizada')
    return configs[index]
  }

  /**
   * Ativar/desativar missão na clínica
   */
  static async toggleMissionForClinic(
    clinicId: string,
    missionId: string,
    active: boolean,
  ): Promise<void> {
    const config = await this.getClinicConfig(clinicId)

    if (active) {
      if (!config.activeMissionIds.includes(missionId)) {
        config.activeMissionIds.push(missionId)
      }
    } else {
      config.activeMissionIds = config.activeMissionIds.filter((id) => id !== missionId)
    }

    await this.updateClinicConfig(clinicId, {
      activeMissionIds: config.activeMissionIds,
    })
  }

  // ============================================
  // MISSÕES DO PACIENTE
  // ============================================

  /**
   * Ativar missão para paciente
   */
  static async activateMissionForPatient(
    input: ActivatePatientMissionInput,
  ): Promise<PatientMission> {
    const missions = getAllPatientMissions()
    const template = await this.getTemplateById(input.missionTemplateId)

    if (!template) {
      throw new Error('Template de missão não encontrado')
    }

    // Determinar status inicial baseado no trigger
    const initialStatus =
      input.trigger === 'immediate' ? 'in_progress' : 'available'

    const newMission: PatientMission = {
      id: `patient-mission-${Date.now()}`,
      patientId: input.patientId,
      missionTemplateId: input.missionTemplateId,
      status: initialStatus,
      progress: 0,
      targetValue: template.targetValue,
      startedAt: new Date().toISOString(),
      expiresAt: input.expiresAt,
      trigger: input.trigger || 'immediate',
      triggerAlignerNumber: input.triggerAlignerNumber,
      triggerDaysOffset: input.triggerDaysOffset,
      autoActivated: input.trigger !== 'manual',
      pointsEarned: 0,
      customPoints: input.customPoints,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    missions.push(newMission)
    savePatientMissions(missions)

    console.log('✅ Missão ativada para paciente')
    return newMission
  }

  /**
   * Obter missões do paciente
   */
  static async getPatientMissions(patientId: string): Promise<PatientMission[]> {
    const missions = getAllPatientMissions()
    return missions.filter((m) => m.patientId === patientId)
  }

  /**
   * Atualizar progresso da missão
   */
  static async updateMissionProgress(
    missionId: string,
    updates: UpdatePatientMissionProgressInput,
  ): Promise<PatientMission> {
    const missions = getAllPatientMissions()
    const index = missions.findIndex((m) => m.id === missionId)

    if (index === -1) {
      throw new Error('Missão não encontrada')
    }

    const mission = missions[index]
    const template = await this.getTemplateById(mission.missionTemplateId)

    if (!template) {
      throw new Error('Template não encontrado')
    }

    // Atualizar progresso
    mission.progress = updates.progress
    mission.metadata = { ...mission.metadata, ...updates.metadata }
    mission.updatedAt = new Date().toISOString()

    // Verificar se completou
    if (mission.progress >= mission.targetValue) {
      mission.status = 'completed'
      mission.completedAt = new Date().toISOString()
      mission.pointsEarned = template.basePoints

      // Atualizar pontos do paciente
      await this.addPointsToPatient(mission.patientId, template.basePoints)

      console.log('🎉 Missão completada! +' + template.basePoints + ' pontos')
    } else {
      mission.status = 'in_progress'
    }

    missions[index] = mission
    savePatientMissions(missions)

    return mission
  }

  /**
   * Validar missão manualmente (ortodontista)
   */
  static async validateMission(
    missionId: string,
    orthodontistId: string,
    approved: boolean,
  ): Promise<void> {
    const missions = getAllPatientMissions()
    const index = missions.findIndex((m) => m.id === missionId)

    if (index === -1) {
      throw new Error('Missão não encontrada')
    }

    const mission = missions[index]

    if (approved) {
      mission.status = 'completed'
      mission.validatedBy = orthodontistId
      mission.validatedAt = new Date().toISOString()
      mission.completedAt = new Date().toISOString()

      const template = await this.getTemplateById(mission.missionTemplateId)
      if (template) {
        mission.pointsEarned = template.basePoints
        await this.addPointsToPatient(mission.patientId, template.basePoints)
      }
    } else {
      mission.status = 'failed'
    }

    missions[index] = mission
    savePatientMissions(missions)
  }

  /**
   * Clonar missões de um paciente para outro(s)
   */
  static async cloneMissionsToPatients(
    sourcePatientId: string,
    targetPatientIds: string[],
  ): Promise<void> {
    const sourceMissions = await this.getPatientMissions(sourcePatientId)

    if (sourceMissions.length === 0) {
      throw new Error('Paciente de origem não possui missões')
    }

    for (const targetPatientId of targetPatientIds) {
      for (const sourceMission of sourceMissions) {
        // Criar nova missão para o paciente alvo
        await this.activateMissionForPatient({
          patientId: targetPatientId,
          missionTemplateId: sourceMission.missionTemplateId,
          expiresAt: sourceMission.expiresAt,
          trigger: sourceMission.trigger,
          triggerAlignerNumber: sourceMission.triggerAlignerNumber,
          triggerDaysOffset: sourceMission.triggerDaysOffset,
          customPoints: sourceMission.customPoints,
        })
      }
    }

    console.log(
      `📋 Missões clonadas de ${sourcePatientId} para ${targetPatientIds.length} paciente(s)`,
    )
  }

  // ============================================
  // PONTOS DO PACIENTE
  // ============================================

  /**
   * Obter pontos do paciente
   */
  static async getPatientPoints(patientId: string): Promise<PatientPoints> {
    const allPoints = getAllPatientPoints()
    let points = allPoints.find((p) => p.patientId === patientId)

    if (!points) {
      points = {
        patientId,
        totalPoints: 0,
        currentLevel: 1,
        pointsToNextLevel: 100,
        missionsCompleted: 0,
        missionsInProgress: 0,
        missionsFailed: 0,
        currentStreak: 0,
        longestStreak: 0,
        badges: [],
        updatedAt: new Date().toISOString(),
      }

      allPoints.push(points)
      savePatientPoints(allPoints)
    }

    return points
  }

  /**
   * Adicionar pontos ao paciente
   */
  static async addPointsToPatient(patientId: string, points: number): Promise<void> {
    const allPoints = getAllPatientPoints()
    const index = allPoints.findIndex((p) => p.patientId === patientId)

    let patientPoints: PatientPoints

    if (index === -1) {
      patientPoints = await this.getPatientPoints(patientId)
      allPoints.push(patientPoints)
    } else {
      patientPoints = allPoints[index]
    }

    patientPoints.totalPoints += points
    patientPoints.missionsCompleted += 1

    // Calcular nível (100 pontos por nível)
    const newLevel = Math.floor(patientPoints.totalPoints / 100) + 1
    if (newLevel > patientPoints.currentLevel) {
      patientPoints.currentLevel = newLevel
      console.log('🎊 Novo nível alcançado:', newLevel)
    }

    patientPoints.pointsToNextLevel = (patientPoints.currentLevel * 100) - patientPoints.totalPoints
    patientPoints.updatedAt = new Date().toISOString()

    if (index === -1) {
      allPoints.push(patientPoints)
    } else {
      allPoints[index] = patientPoints
    }

    savePatientPoints(allPoints)
  }

  /**
   * Obter leaderboard da clínica
   */
  static async getClinicLeaderboard(clinicId: string): Promise<LeaderboardEntry[]> {
    // Buscar todos os pacientes da clínica
    const users = JSON.parse(localStorage.getItem('auth_users') || '[]')
    const clinicPatients = users.filter(
      (u: any) => u.clinicId === clinicId && (u.role === 'patient' || u.role === 'child-patient')
    )

    const allPoints = getAllPatientPoints()
    const leaderboard: LeaderboardEntry[] = []

    for (const patient of clinicPatients) {
      const points = allPoints.find((p) => p.patientId === patient.id)

      if (points) {
        leaderboard.push({
          patientId: patient.id,
          patientName: patient.fullName,
          totalPoints: points.totalPoints,
          missionsCompleted: points.missionsCompleted,
          currentStreak: points.currentStreak,
          level: points.currentLevel,
          rank: 0, // Será calculado abaixo
        })
      }
    }

    // Ordenar por pontos e atribuir ranks
    leaderboard.sort((a, b) => b.totalPoints - a.totalPoints)
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1
    })

    return leaderboard
  }
}

// ============================================
// SEED DE MISSÕES PADRÃO
// ============================================

/**
 * Criar missões padrão do sistema
 */
export async function seedDefaultMissions(): Promise<void> {
  const existing = await MissionService.getAllTemplates()

  if (existing.length > 0) {
    console.log('✅ Missões padrão já existem')
    return
  }

  const defaultMissions: CreateMissionTemplateInput[] = [
    // Uso do Alinhador
    {
      name: 'Uso Diário Perfeito',
      description: 'Use o alinhador por 22 horas ou mais hoje',
      category: 'usage',
      frequency: 'daily',
      completionCriteria: 'time_based',
      targetValue: 22,
      basePoints: 10,
      icon: '⭐',
      color: '#FFD700',
      isActiveByDefault: true,
    },
    {
      name: 'Semana Completa',
      description: 'Use o alinhador por 22h+ durante 7 dias consecutivos',
      category: 'usage',
      frequency: 'weekly',
      completionCriteria: 'days_streak',
      targetValue: 7,
      basePoints: 100,
      bonusPoints: 20,
      icon: '🏆',
      color: '#FF6B6B',
      isActiveByDefault: true,
    },
    {
      name: 'Mês Campeão',
      description: 'Complete 30 dias com 20h+ de uso do alinhador',
      category: 'usage',
      frequency: 'monthly',
      completionCriteria: 'days_streak',
      targetValue: 30,
      basePoints: 300,
      bonusPoints: 50,
      icon: '💪',
      color: '#4ECDC4',
      isActiveByDefault: true,
    },

    // Higiene
    {
      name: 'Higiene Impecável',
      description: 'Limpe o alinhador 2x ao dia durante 7 dias',
      category: 'hygiene',
      frequency: 'weekly',
      completionCriteria: 'total_count',
      targetValue: 14,
      basePoints: 80,
      icon: '✨',
      color: '#95E1D3',
      isActiveByDefault: true,
    },
    {
      name: 'Fio Dental Diário',
      description: 'Use fio dental todos os dias por uma semana',
      category: 'hygiene',
      frequency: 'weekly',
      completionCriteria: 'days_streak',
      targetValue: 7,
      basePoints: 60,
      icon: '🧵',
      color: '#F38181',
      isActiveByDefault: true,
    },

    // Marcos
    {
      name: 'Primeira Semana',
      description: 'Complete sua primeira semana de tratamento',
      category: 'milestones',
      frequency: 'once',
      completionCriteria: 'time_based',
      targetValue: 7,
      basePoints: 50,
      icon: '🎯',
      color: '#AA96DA',
      isActiveByDefault: true,
    },
    {
      name: 'Primeiro Mês',
      description: 'Complete seu primeiro mês de tratamento',
      category: 'milestones',
      frequency: 'once',
      completionCriteria: 'time_based',
      targetValue: 30,
      basePoints: 150,
      icon: '🥇',
      color: '#FCBAD3',
      isActiveByDefault: true,
    },
    {
      name: 'Meio do Caminho',
      description: 'Chegue à metade dos seus alinhadores',
      category: 'milestones',
      frequency: 'once',
      completionCriteria: 'percentage',
      targetValue: 50,
      basePoints: 1000,
      bonusPoints: 200,
      icon: '💎',
      color: '#FFFFD2',
      isActiveByDefault: true,
    },

    // Troca de Alinhador
    {
      name: 'Troca Pontual',
      description: 'Troque o alinhador na data correta',
      category: 'aligner_change',
      frequency: 'per_aligner',
      completionCriteria: 'manual',
      targetValue: 1,
      basePoints: 50,
      icon: '⏰',
      color: '#A8E6CF',
      isActiveByDefault: true,
      requiresManualValidation: true,
    },

    // Consultas
    {
      name: 'Presença Exemplar',
      description: 'Compareça à sua consulta agendada',
      category: 'appointments',
      frequency: 'custom',
      completionCriteria: 'manual',
      targetValue: 1,
      basePoints: 30,
      icon: '👨‍⚕️',
      color: '#FFD3B6',
      isActiveByDefault: true,
      requiresManualValidation: true,
    },
  ]

  for (const mission of defaultMissions) {
    await MissionService.createTemplate(mission)
  }

  console.log('✅ Missões padrão criadas:', defaultMissions.length)
}

// Executar seed ao carregar
seedDefaultMissions()
