/**
 * Tipos para Sistema de Missões (Gamificação)
 * v1.0
 */

export type MissionCategory =
  | 'usage'            // Uso do alinhador
  | 'hygiene'          // Higiene bucal
  | 'tracking'         // Acompanhamento
  | 'education'        // Educação
  | 'milestones'       // Marcos do tratamento
  | 'aligner_change'   // Troca de alinhador
  | 'appointments'     // Consultas
  | 'challenges'       // Desafios especiais

export type MissionFrequency =
  | 'once'             // Única vez (marcos)
  | 'daily'            // Diária
  | 'weekly'           // Semanal
  | 'monthly'          // Mensal
  | 'per_aligner'      // Por alinhador
  | 'custom'           // Personalizada

export type MissionStatus =
  | 'available'        // Disponível para começar
  | 'in_progress'      // Em andamento
  | 'completed'        // Concluída
  | 'failed'           // Falhou (expirou sem completar)
  | 'expired'          // Expirada

export type CompletionCriteria =
  | 'days_streak'      // X dias consecutivos
  | 'total_count'      // X vezes no total
  | 'percentage'       // X% de algo
  | 'time_based'       // Baseado em tempo
  | 'manual'           // Marcação manual pelo ortodontista

/**
 * Tipos de triggers (gatilhos) para ativação automática de missões
 */
export type MissionTrigger =
  | 'immediate'                    // Ativa imediatamente
  | 'on_treatment_start'           // Ao iniciar tratamento
  | 'on_aligner_change'            // Em qualquer troca de alinhador
  | 'on_aligner_N_start'           // Ao iniciar alinhador específico (ex: alinhador 5)
  | 'days_after_aligner_N'         // X dias após iniciar alinhador N
  | 'days_after_treatment_start'   // X dias após início do tratamento
  | 'weeks_after_treatment_start'  // X semanas após início do tratamento
  | 'manual'                       // Ativação manual pelo ortodontista

/**
 * Template de Missão (Global - criado por super-admin)
 */
export interface MissionTemplate {
  id: string
  name: string
  description: string
  category: MissionCategory
  frequency: MissionFrequency

  // Critérios de conclusão
  completionCriteria: CompletionCriteria
  targetValue: number          // Ex: 7 dias, 3 vezes, 80%

  // Pontuação
  basePoints: number
  bonusPoints?: number         // Pontos bônus por completar antes do prazo

  // Visual
  icon: string                 // Emoji ou nome do ícone
  color: string                // Cor hex

  // Configuração
  isActiveByDefault: boolean   // Se está ativa por padrão em novas clínicas
  requiresManualValidation: boolean // Se precisa validação do ortodontista
  alignerInterval?: number     // A cada quantos alinhadores (default 1)

  // Disponibilidade
  availableFrom?: 'start' | 'aligner_1' | 'aligner_5' | 'week_1' | 'month_1'
  expiresAfter?: number        // Dias/horas até expirar (null = não expira)

  // Programação avançada
  scheduledStartDate?: string  // Data/hora de início programada (ISO 8601)
  scheduledEndDate?: string    // Data/hora de fim programada (ISO 8601)
  autoActivate?: boolean       // Se deve ativar automaticamente quando agendado
  activeDaysOfWeek?: number[]  // Dias da semana ativos (0=Dom, 6=Sáb) para missões semanais
  repeatSchedule?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' // Repetição automática

  // Metadados
  isGlobal: boolean            // Se é template global ou customizado
  createdBy?: string           // ID do criador (se customizado)
  createdAt: string
  updatedAt: string
}

// Programas de Missões (presets)
export interface MissionProgram {
  id: string
  clinicId?: string | null
  name: string
  description?: string | null
  isDefault: boolean
  createdBy?: string | null
  createdAt: string
  updatedAt: string
  templates?: MissionProgramTemplate[]
}

export interface MissionProgramTemplate {
  id: string
  programId: string
  missionTemplateId: string
  isActive: boolean
  alignerInterval: number
  trigger?: MissionTrigger
  triggerAlignerNumber?: number
  triggerDaysOffset?: number
  customPoints?: number
  createdAt: string
  updatedAt: string
}

/**
 * Configuração de Missões da Clínica
 */
export interface ClinicMissionConfig {
  id: string
  clinicId: string

  // Missões ativas
  activeMissionIds: string[]   // IDs dos templates ativos

  // Multiplicadores customizados
  pointsMultiplier: number     // Multiplicador geral (padrão 1.0)
  customPoints?: Record<string, number> // Pontos customizados por missão

  // Missões customizadas da clínica
  customMissions: MissionTemplate[]

  // Configurações de gamificação
  enableLeaderboard: boolean
  enableBadges: boolean
  enableRewards: boolean

  updatedAt: string
}

/**
 * Missão do Paciente (instância ativa)
 */
export interface PatientMission {
  id: string
  patientId: string
  missionTemplateId: string

  // Status
  status: MissionStatus
  progress: number             // Valor atual (ex: 3 de 7 dias)
  targetValue: number          // Valor alvo (ex: 7 dias)

  // Datas
  startedAt: string
  completedAt?: string
  expiresAt?: string

  // Triggers e automação
  trigger?: MissionTrigger      // Tipo de gatilho para ativação
  triggerAlignerNumber?: number // Número do alinhador (para triggers específicos)
  triggerDaysOffset?: number    // Dias de atraso (para triggers temporais)
  autoActivated?: boolean       // Se foi ativada automaticamente

  // Pontos
  pointsEarned: number
  bonusEarned?: number
  customPoints?: number         // Pontos customizados para este paciente

  // Validação
  validatedBy?: string         // ID do ortodontista que validou
  validatedAt?: string

  // Dados adicionais
  metadata?: Record<string, any> // Dados específicos da missão

  createdAt: string
  updatedAt: string
}

/**
 * Progresso de Pontuação do Paciente
 */
export interface PatientPoints {
  patientId: string
  totalPoints: number
  currentLevel: number
  pointsToNextLevel: number

  // Estatísticas
  missionsCompleted: number
  missionsInProgress: number
  missionsFailed: number
  currentStreak: number        // Dias consecutivos com atividade
  longestStreak: number

  // Ranking
  clinicRank?: number          // Posição no ranking da clínica

  // Badges conquistadas
  badges: string[]             // IDs das badges

  updatedAt: string
}

/**
 * Badge/Conquista
 */
export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  color: string

  // Critério
  requiresPoints?: number
  requiresMissions?: string[]  // IDs de missões necessárias
  requiresStreak?: number

  isRare: boolean              // Se é rara/especial

  createdAt: string
}

/**
 * Entrada no Leaderboard
 */
export interface LeaderboardEntry {
  patientId: string
  patientName: string
  totalPoints: number
  missionsCompleted: number
  currentStreak: number
  level: number
  rank: number
}

// ============================================
// INPUT TYPES
// ============================================

export interface CreateMissionTemplateInput {
  name: string
  description: string
  category: MissionCategory
  frequency: MissionFrequency
  completionCriteria: CompletionCriteria
  targetValue: number
  basePoints: number
  bonusPoints?: number
  icon: string
  color: string
  isActiveByDefault?: boolean
  requiresManualValidation?: boolean
  availableFrom?: string
  expiresAfter?: number
  scheduledStartDate?: string
  scheduledEndDate?: string
  autoActivate?: boolean
  activeDaysOfWeek?: number[]
  repeatSchedule?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
}

export interface UpdateMissionTemplateInput {
  name?: string
  description?: string
  basePoints?: number
  bonusPoints?: number
  icon?: string
  color?: string
  isActiveByDefault?: boolean
  targetValue?: number
  category?: MissionCategory
  frequency?: MissionFrequency
  completionCriteria?: CompletionCriteria
  requiresManualValidation?: boolean
  availableFrom?: string
  expiresAfter?: number
  scheduledStartDate?: string
  scheduledEndDate?: string
  autoActivate?: boolean
  activeDaysOfWeek?: number[]
  repeatSchedule?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
}

export interface ActivatePatientMissionInput {
  patientId: string
  missionTemplateId: string
  expiresAt?: string
  trigger?: MissionTrigger
  triggerAlignerNumber?: number
  triggerDaysOffset?: number
  customPoints?: number
}

export interface UpdatePatientMissionProgressInput {
  progress: number
  metadata?: Record<string, any>
}
