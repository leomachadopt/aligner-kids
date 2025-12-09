/**
 * Sistema de Histórias Personalizadas com IA
 * Tipos TypeScript para gerenciamento completo
 */

// ============================================
// ENUMS E TIPOS BASE
// ============================================

export type StoryEnvironment =
  | 'floresta'
  | 'espaco'
  | 'castelo'
  | 'oceano'
  | 'selva'
  | 'montanha'
  | 'deserto'
  | 'cidade-magica'

export type StoryCharacter =
  | 'dragao'
  | 'unicornio'
  | 'robot'
  | 'fada'
  | 'super-heroi'
  | 'princesa'
  | 'cavaleiro'
  | 'astronauta'
  | 'pirata'
  | 'mago'

export type StoryTheme =
  | 'aventura'
  | 'misterio'
  | 'amizade'
  | 'coragem'
  | 'descoberta'
  | 'magia'
  | 'resgate'

export type AgeGroup = '3-5' | '6-8' | '9-12'

export type UserRole = 'child' | 'dentist' | 'super-admin'

// ============================================
// INTERFACES - PREFERÊNCIAS
// ============================================

export interface StoryPreferences {
  id: string
  patientId: string
  environment: StoryEnvironment
  mainCharacter: StoryCharacter
  mainCharacterName?: string // Nome personalizado
  sidekick?: StoryCharacter
  theme: StoryTheme
  ageGroup: number
  additionalPreferences?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface StoryPreferencesInput {
  environment: StoryEnvironment
  mainCharacter: StoryCharacter
  mainCharacterName?: string
  sidekick?: StoryCharacter
  theme: StoryTheme
  ageGroup: number
  additionalPreferences?: Record<string, unknown>
}

// ============================================
// INTERFACES - PROMPTS
// ============================================

export interface StoryPrompt {
  id: string
  name: string
  description?: string
  systemPrompt: string
  userPromptTemplate: string
  ageRanges: Record<AgeGroup, string> // Instruções específicas por faixa etária
  isActive: boolean
  createdBy: string // userId do super admin
  createdAt: string
  updatedAt: string
}

export interface StoryPromptInput {
  name: string
  description?: string
  systemPrompt: string
  userPromptTemplate: string
  ageRanges: Record<AgeGroup, string>
  isActive?: boolean
}

// ============================================
// INTERFACES - SÉRIE DE HISTÓRIA (V3)
// ============================================

export interface StorySeries {
  id: string
  patientId: string

  // Informações
  title: string
  description?: string
  totalChapters: number
  totalAligners: number // Mesmo que totalChapters

  // Preferências
  preferences: StoryPreferencesInput

  // Status
  isComplete: boolean
  generationStartedAt?: string
  generationCompletedAt?: string

  createdAt: string
  updatedAt: string
}

export interface StorySeriesInput {
  preferences: StoryPreferencesInput
  totalAligners: number
}

// ============================================
// INTERFACES - CAPÍTULOS (V3)
// ============================================

export interface StoryChapterV3 {
  id: string
  storySeriesId: string
  patientId: string

  // Informações do capítulo
  chapterNumber: number
  requiredAlignerNumber: number // Qual alinhador desbloqueia

  // Conteúdo
  title: string
  content: string
  wordCount: number
  estimatedReadingTime: number // minutos

  // Metadata
  promptId?: string
  modelUsed: string
  tokensUsed?: number
  generationTimeMs?: number

  // Interações
  isRead: boolean
  readCount: number
  lastReadAt?: string
  liked: boolean

  // Recursos multimídia
  audioUrl?: string
  audioDurationSeconds?: number
  imageUrl?: string

  createdAt: string
  updatedAt: string
}

// ============================================
// INTERFACES - HISTÓRIAS GERADAS (Legacy/Compat)
// ============================================

export interface GeneratedStory extends StoryChapterV3 {
  // Mantido para compatibilidade
  chapterId?: string
}

export interface GeneratedStoryInput {
  chapterId?: string
  preferences: StoryPreferencesInput
}

export interface GeneratedStoryUpdate {
  liked?: boolean
  readCount?: number
  lastReadAt?: string
}

// ============================================
// INTERFACES - BIBLIOTECA
// ============================================

export interface StoryLibraryItem {
  id: string
  title: string
  content: string
  environment: StoryEnvironment
  theme: StoryTheme
  ageRange: AgeGroup
  tags: string[]
  timesUsed: number
  avgRating?: number
  isActive: boolean
  createdBy: string
  createdAt: string
  updatedAt: string
}

// ============================================
// INTERFACES - ANALYTICS
// ============================================

export type StoryAnalyticsEvent = 'generated' | 'read' | 'liked' | 'shared' | 'deleted'

export interface StoryAnalytics {
  id: string
  eventType: StoryAnalyticsEvent
  storyId?: string
  patientId: string
  metadata?: Record<string, unknown>
  createdAt: string
}

export interface PatientStoryStats {
  patientId: string
  totalStories: number
  likedStories: number
  totalReads: number
  lastStoryCreated?: string
  lastStoryRead?: string
}

// ============================================
// INTERFACES - OPÇÕES DE CONFIGURAÇÃO
// ============================================

export interface StoryOption<T> {
  id: T
  name: string
  icon: string
  color: string
  description?: string
}

export interface StoryOptions {
  environments: StoryOption<StoryEnvironment>[]
  characters: StoryOption<StoryCharacter>[]
  themes: StoryOption<StoryTheme>[]
}

// ============================================
// INTERFACES - API RESPONSES
// ============================================

export interface StoryGenerationRequest {
  preferences: StoryPreferencesInput
  promptId?: string // Se não fornecido, usa prompt padrão ativo
  chapterId?: string
}

export interface StoryGenerationResponse {
  success: boolean
  story?: GeneratedStory
  error?: string
  message?: string
}

export interface StoryListResponse {
  stories: GeneratedStory[]
  total: number
  page: number
  pageSize: number
}

// ============================================
// INTERFACES - UI STATE
// ============================================

export interface StoryDirectorStep {
  step: number
  title: string
  description: string
  isComplete: boolean
}

export interface StoryDirectorState {
  currentStep: number
  preferences: Partial<StoryPreferencesInput>
  steps: StoryDirectorStep[]
  isGenerating: boolean
  error?: string
}

// ============================================
// TYPE GUARDS
// ============================================

export function isValidEnvironment(value: string): value is StoryEnvironment {
  return ['floresta', 'espaco', 'castelo', 'oceano', 'selva', 'montanha', 'deserto', 'cidade-magica'].includes(value)
}

export function isValidCharacter(value: string): value is StoryCharacter {
  return ['dragao', 'unicornio', 'robot', 'fada', 'super-heroi', 'princesa', 'cavaleiro', 'astronauta', 'pirata', 'mago'].includes(value)
}

export function isValidTheme(value: string): value is StoryTheme {
  return ['aventura', 'misterio', 'amizade', 'coragem', 'descoberta', 'magia', 'resgate'].includes(value)
}

export function getAgeRange(age: number): AgeGroup {
  if (age >= 3 && age <= 5) return '3-5'
  if (age >= 6 && age <= 8) return '6-8'
  return '9-12'
}
