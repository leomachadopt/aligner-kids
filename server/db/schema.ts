/**
 * Database Schema - Drizzle ORM
 * Define todas as tabelas do banco de dados Neon (PostgreSQL)
 */

import { pgTable, text, timestamp, boolean, integer, jsonb, varchar, serial } from 'drizzle-orm/pg-core'

// ============================================
// USERS & AUTH
// ============================================

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull(), // 'patient' | 'child-patient' | 'orthodontist' | 'super-admin'
  fullName: varchar('full_name', { length: 255 }).notNull(),
  cpf: varchar('cpf', { length: 20 }),
  birthDate: varchar('birth_date', { length: 10 }),
  phone: varchar('phone', { length: 50 }),
  preferredLanguage: varchar('preferred_language', { length: 10 }).default('pt-BR'),

  // Guardian info (for child-patient)
  guardianName: varchar('guardian_name', { length: 255 }),
  guardianCpf: varchar('guardian_cpf', { length: 20 }),
  guardianPhone: varchar('guardian_phone', { length: 50 }),

  // Orthodontist info
  cro: varchar('cro', { length: 50 }),
  clinicName: varchar('clinic_name', { length: 255 }), // DEPRECATED

  // Clinic relationship
  clinicId: varchar('clinic_id', { length: 255 }),

  // Status
  isActive: boolean('is_active').default(true).notNull(),
  isApproved: boolean('is_approved').default(false).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),

  // Timestamps
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// CLINICS
// ============================================

export const clinics = pgTable('clinics', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  country: varchar('country', { length: 2 }).notNull().default('BR'),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  website: varchar('website', { length: 255 }),
  addressCity: varchar('address_city', { length: 255 }),
  addressState: varchar('address_state', { length: 100 }),
  primaryColor: varchar('primary_color', { length: 7 }).default('#3B82F6'),
  timezone: varchar('timezone', { length: 100 }).default('America/Sao_Paulo'),
  gamificationConfig: jsonb('gamification_config').default({}),
  isActive: boolean('is_active').default(true).notNull(),
  subscriptionTier: varchar('subscription_tier', { length: 50 }).default('basic'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// TREATMENTS & ALIGNERS
// ============================================

export const treatments = pgTable('treatments', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),

  // Overall treatment info (container)
  overallStatus: varchar('overall_status', { length: 50 }).default('active').notNull(), // 'active' | 'completed' | 'paused' | 'cancelled'
  totalPhasesPlanned: integer('total_phases_planned').default(1).notNull(),
  currentPhaseNumber: integer('current_phase_number').default(1).notNull(),
  totalAlignersOverall: integer('total_aligners_overall').default(20).notNull(), // Default 20 for migration
  currentAlignerOverall: integer('current_aligner_overall').default(1).notNull(),

  startDate: varchar('start_date', { length: 10 }).notNull(),
  expectedEndDate: varchar('expected_end_date', { length: 10 }),

  // Legacy fields (for backwards compatibility during migration)
  currentAlignerNumber: integer('current_aligner_number').default(1),
  totalAligners: integer('total_aligners'),
  status: varchar('status', { length: 50 }).default('active'),

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const treatment_phases = pgTable('treatment_phases', {
  id: varchar('id', { length: 255 }).primaryKey(),
  treatmentId: varchar('treatment_id', { length: 255 }).notNull(),
  phaseNumber: integer('phase_number').notNull(),
  phaseName: varchar('phase_name', { length: 255 }).notNull(),
  description: text('description'),

  // Aligner numbering for this phase
  startAlignerNumber: integer('start_aligner_number').notNull(),
  endAlignerNumber: integer('end_aligner_number').notNull(),
  totalAligners: integer('total_aligners').notNull(),
  currentAlignerNumber: integer('current_aligner_number').default(0).notNull(),

  // Phase status
  status: varchar('status', { length: 50 }).default('pending').notNull(), // 'pending' | 'active' | 'completed' | 'paused' | 'cancelled'

  // Dates
  startDate: varchar('start_date', { length: 10 }),
  expectedEndDate: varchar('expected_end_date', { length: 10 }),
  actualEndDate: varchar('actual_end_date', { length: 10 }),

  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const aligners = pgTable('aligners', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull(),
  treatmentId: varchar('treatment_id', { length: 255 }), // FK to treatment (container) - for gamification
  phaseId: varchar('phase_id', { length: 255 }), // FK to treatment_phases - for phase tracking
  alignerNumber: integer('aligner_number').notNull(), // Global number (continues across phases)
  alignerNumberInPhase: integer('aligner_number_in_phase'), // Number within the phase (1, 2, 3... resets per phase)
  startDate: varchar('start_date', { length: 10 }).notNull(),
  endDate: varchar('end_date', { length: 10 }).notNull(),
  actualEndDate: varchar('actual_end_date', { length: 10 }),
  status: varchar('status', { length: 50 }).default('upcoming').notNull(),
  usageHours: integer('usage_hours').default(0),
  targetHoursPerDay: integer('target_hours_per_day').default(22),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// STORIES
// ============================================

export const story_preferences = pgTable('story_preferences', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull(),
  treatmentId: varchar('treatment_id', { length: 255 }),
  ageGroup: integer('age_group').notNull(),
  environment: varchar('environment', { length: 100 }).notNull(),
  mainCharacter: varchar('main_character', { length: 100 }).notNull(),
  mainCharacterName: varchar('main_character_name', { length: 255 }),
  sidekick: varchar('sidekick', { length: 100 }),
  theme: varchar('theme', { length: 100 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const stories = pgTable('stories', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull(),
  treatmentId: varchar('treatment_id', { length: 255 }),
  promptId: varchar('prompt_id', { length: 255 }),
  preferencesSnapshot: jsonb('preferences_snapshot'),

  // Story metadata
  storyTitle: varchar('story_title', { length: 500 }),
  totalChapters: integer('total_chapters').default(1),
  currentChapter: integer('current_chapter').default(1),

  // Legacy fields (for single stories)
  title: varchar('title', { length: 500 }),
  content: text('content'),
  wordCount: integer('word_count'),
  estimatedReadingTime: integer('estimated_reading_time'),

  // Generation info
  modelUsed: varchar('model_used', { length: 100 }),
  tokensUsed: integer('tokens_used'),
  generationTimeMs: integer('generation_time_ms'),

  // User interaction
  liked: boolean('liked').default(false),
  readCount: integer('read_count').default(0),
  lastReadAt: timestamp('last_read_at'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const story_chapters = pgTable('story_chapters', {
  id: varchar('id', { length: 255 }).primaryKey(),
  storyId: varchar('story_id', { length: 255 }).notNull(),
  treatmentId: varchar('treatment_id', { length: 255 }),
  chapterNumber: integer('chapter_number').notNull(),
  requiredAlignerNumber: integer('required_aligner_number').notNull().default(1),
  title: varchar('title', { length: 500 }).notNull(),
  content: text('content').notNull(),
  wordCount: integer('word_count'),
  isUnlocked: boolean('is_unlocked').default(false).notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  audioUrl: varchar('audio_url', { length: 500 }),
  audioGenerated: boolean('audio_generated').default(false),
  audioDurationSeconds: integer('audio_duration_seconds'),
  readCount: integer('read_count').default(0),
  lastReadAt: timestamp('last_read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// MISSIONS & GAMIFICATION
// ============================================

export const mission_templates = pgTable('mission_templates', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(),

  // Criteria
  frequency: varchar('frequency', { length: 50 }).notNull(),
  completionCriteria: varchar('completion_criteria', { length: 100 }).notNull(),
  targetValue: integer('target_value'),

  // Points & rewards
  basePoints: integer('base_points').notNull(),
  bonusPoints: integer('bonus_points').default(0),

  // Visual
  iconEmoji: varchar('icon_emoji', { length: 10 }),
  color: varchar('color', { length: 7 }),

  // Aplicação por alinhador
  alignerInterval: integer('aligner_interval').default(1).notNull(),

  // Behavior
  isActiveByDefault: boolean('is_active_by_default').default(true),
  requiresManualValidation: boolean('requires_manual_validation').default(false),
  canAutoActivate: boolean('can_auto_activate').default(true),

  // Scheduling
  scheduledStartDate: varchar('scheduled_start_date', { length: 10 }),
  scheduledEndDate: varchar('scheduled_end_date', { length: 10 }),
  repetitionType: varchar('repetition_type', { length: 50 }),
  repeatOn: jsonb('repeat_on'), // For weekly missions

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const patient_missions = pgTable('patient_missions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull(),
  missionTemplateId: varchar('mission_template_id', { length: 255 }).notNull(),

  // Status
  status: varchar('status', { length: 50 }).default('active').notNull(),
  progress: integer('progress').default(0),
  targetValue: integer('target_value').notNull(),

  // Trigger-based activation
  trigger: varchar('trigger', { length: 100 }),
  triggerAlignerNumber: integer('trigger_aligner_number'),
  triggerDaysOffset: integer('trigger_days_offset'),
  autoActivated: boolean('auto_activated').default(false),

  // Timestamps
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),

  // Points
  pointsEarned: integer('points_earned').default(0),
  customPoints: integer('custom_points'),

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const patient_points = pgTable('patient_points', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull().unique(),
  totalPoints: integer('total_points').default(0),
  currentLevel: integer('current_level').default(1),
  badges: jsonb('badges').default([]),
  streak: integer('streak').default(0),
  lastActivityAt: timestamp('last_activity_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// MISSION PROGRAMS (presets)
// ============================================

export const mission_programs = pgTable('mission_programs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  clinicId: varchar('clinic_id', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const mission_program_templates = pgTable('mission_program_templates', {
  id: varchar('id', { length: 255 }).primaryKey(),
  programId: varchar('program_id', { length: 255 }).notNull(),
  missionTemplateId: varchar('mission_template_id', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true),
  alignerInterval: integer('aligner_interval').default(1).notNull(),
  trigger: varchar('trigger', { length: 100 }),
  triggerAlignerNumber: integer('trigger_aligner_number'),
  triggerDaysOffset: integer('trigger_days_offset'),
  customPoints: integer('custom_points'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// STORY PROMPTS (optional - for custom prompts)
// ============================================

export const story_prompts = pgTable('story_prompts', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  systemPrompt: text('system_prompt').notNull(),
  userPromptTemplate: text('user_prompt_template').notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// PHOTOS & PROGRESS TRACKING
// ============================================

export const progress_photos = pgTable('progress_photos', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull(),
  treatmentId: varchar('treatment_id', { length: 255 }).notNull(),
  phaseId: varchar('phase_id', { length: 255 }),
  alignerNumber: integer('aligner_number'), // Alinhador em que a foto foi tirada

  // Photo metadata
  photoType: varchar('photo_type', { length: 50 }).notNull(), // 'frontal' | 'right' | 'left'
  photoUrl: text('photo_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),

  // File info
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'), // in bytes
  mimeType: varchar('mime_type', { length: 100 }),

  // Capture info
  capturedAt: timestamp('captured_at').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),

  // Clinical notes
  clinicianNotes: text('clinician_notes'),
  hasIssues: boolean('has_issues').default(false),

  // Metadata
  metadata: jsonb('metadata'), // For additional info (device, location, etc.)

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================
// MESSAGES & CHAT
// ============================================

export const messages = pgTable('messages', {
  id: varchar('id', { length: 255 }).primaryKey(),
  senderId: varchar('sender_id', { length: 255 }).notNull(),
  receiverId: varchar('receiver_id', { length: 255 }).notNull(),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
