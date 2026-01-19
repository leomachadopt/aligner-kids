/**
 * Vercel Serverless Function Entry Point
 * Todas as rotas implementadas inline para compatibilidade serverless
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import express from 'express'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq, and, desc, asc, or, sql, inArray } from 'drizzle-orm'
import { pgTable, text, timestamp, boolean, varchar, integer, jsonb } from 'drizzle-orm/pg-core'

// Schema inline (necessário para serverless)
const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  cpf: varchar('cpf', { length: 20 }),
  birthDate: varchar('birth_date', { length: 10 }),
  phone: varchar('phone', { length: 50 }),
  preferredLanguage: varchar('preferred_language', { length: 10 }).default('pt-BR'),
  clinicId: varchar('clinic_id', { length: 255 }),
  profilePhotoUrl: text('profile_photo_url'),
  responsiblePinHash: varchar('responsible_pin_hash', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  isApproved: boolean('is_approved').default(false).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const clinics = pgTable('clinics', {
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
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const treatments = pgTable('treatments', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  overallStatus: varchar('overall_status', { length: 50 }).default('active').notNull(),
  totalPhasesPlanned: integer('total_phases_planned').default(1).notNull(),
  currentPhaseNumber: integer('current_phase_number').default(1).notNull(),
  totalAlignersOverall: integer('total_aligners_overall').default(20).notNull(),
  currentAlignerOverall: integer('current_aligner_overall').default(1).notNull(),
  startDate: varchar('start_date', { length: 10 }),
  expectedEndDate: varchar('expected_end_date', { length: 10 }),
  currentAlignerNumber: integer('current_aligner_number').default(1),
  totalAligners: integer('total_aligners'),
  status: varchar('status', { length: 50 }).default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const aligners = pgTable('aligners', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull(),
  treatmentId: varchar('treatment_id', { length: 255 }),
  phaseId: varchar('phase_id', { length: 255 }),
  alignerNumber: integer('aligner_number').notNull(),
  alignerNumberInPhase: integer('aligner_number_in_phase'),
  startDate: varchar('start_date', { length: 10 }),
  endDate: varchar('end_date', { length: 10 }),
  actualEndDate: varchar('actual_end_date', { length: 10 }),
  status: varchar('status', { length: 50 }).default('upcoming').notNull(),
  usageHours: integer('usage_hours').default(0),
  targetHoursPerDay: integer('target_hours_per_day').default(22),
  changeInterval: integer('change_interval').default(14),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const patient_points = pgTable('patient_points', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull().unique(),
  coins: integer('coins').default(0).notNull(),
  xp: integer('xp').default(0).notNull(),
  level: integer('level').default(1).notNull(),
  totalPoints: integer('total_points').default(0),
  currentLevel: integer('current_level').default(1),
  lastActivityAt: timestamp('last_activity_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const messages = pgTable('messages', {
  id: varchar('id', { length: 255 }).primaryKey(),
  senderId: varchar('sender_id', { length: 255 }).notNull(),
  receiverId: varchar('receiver_id', { length: 255 }).notNull(),
  content: text('content').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  readAt: timestamp('read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const mission_templates = pgTable('mission_templates', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  frequency: varchar('frequency', { length: 50 }).notNull(),
  completionCriteria: varchar('completion_criteria', { length: 100 }).notNull(),
  targetValue: integer('target_value'),
  basePoints: integer('base_points').notNull(),
  bonusPoints: integer('bonus_points').default(0),
  iconEmoji: varchar('icon_emoji', { length: 10 }),
  color: varchar('color', { length: 7 }),
  alignerInterval: integer('aligner_interval').default(1).notNull(),
  isActiveByDefault: boolean('is_active_by_default').default(true),
  requiresManualValidation: boolean('requires_manual_validation').default(false),
  canAutoActivate: boolean('can_auto_activate').default(true),
  scheduledStartDate: varchar('scheduled_start_date', { length: 10 }),
  scheduledEndDate: varchar('scheduled_end_date', { length: 10 }),
  repetitionType: varchar('repetition_type', { length: 50 }),
  repeatOn: jsonb('repeat_on'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const mission_programs = pgTable('mission_programs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  clinicId: varchar('clinic_id', { length: 255 }),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false),
  createdBy: varchar('created_by', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const mission_program_templates = pgTable('mission_program_templates', {
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

const patient_missions = pgTable('patient_missions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull(),
  missionTemplateId: varchar('mission_template_id', { length: 255 }).notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  progress: integer('progress').default(0),
  targetValue: integer('target_value').notNull(),
  trigger: varchar('trigger', { length: 100 }),
  triggerAlignerNumber: integer('trigger_aligner_number'),
  triggerDaysOffset: integer('trigger_days_offset'),
  autoActivated: boolean('auto_activated').default(false),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),
  pointsEarned: integer('points_earned').default(0),
  customPoints: integer('custom_points'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const progress_photos = pgTable('progress_photos', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull(),
  treatmentId: varchar('treatment_id', { length: 255 }).notNull(),
  phaseId: varchar('phase_id', { length: 255 }),
  alignerNumber: integer('aligner_number'),
  photoType: varchar('photo_type', { length: 50 }).notNull(),
  photoUrl: text('photo_url').notNull(),
  thumbnailUrl: text('thumbnail_url'),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  capturedAt: timestamp('captured_at').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  clinicianNotes: text('clinician_notes'),
  hasIssues: boolean('has_issues').default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const aligner_wear_sessions = pgTable('aligner_wear_sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull(),
  alignerId: varchar('aligner_id', { length: 255 }).notNull(),
  treatmentId: varchar('treatment_id', { length: 255 }),
  phaseId: varchar('phase_id', { length: 255 }),
  state: varchar('state', { length: 20 }).notNull(),
  startedAt: timestamp('started_at').notNull(),
  endedAt: timestamp('ended_at'),
  createdByUserId: varchar('created_by_user_id', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

const aligner_wear_daily = pgTable('aligner_wear_daily', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull(),
  alignerId: varchar('aligner_id', { length: 255 }).notNull(),
  date: varchar('date', { length: 10 }).notNull(),
  wearMinutes: integer('wear_minutes').default(0).notNull(),
  targetMinutes: integer('target_minutes').default(0).notNull(),
  targetPercent: integer('target_percent').default(80).notNull(),
  isDayOk: boolean('is_day_ok').default(false).notNull(),
  source: varchar('source', { length: 30 }).default('session').notNull(),
  reportedByUserId: varchar('reported_by_user_id', { length: 255 }),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const store_item_templates = pgTable('store_item_templates', {
  id: varchar('id', { length: 255 }).primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  defaultPriceCoins: integer('default_price_coins').notNull(),
  defaultRequiredLevel: integer('default_required_level').default(1).notNull(),
  defaultImageUrl: text('default_image_url'),
  metadata: jsonb('metadata').default({}).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const clinic_store_items = pgTable('clinic_store_items', {
  id: varchar('id', { length: 255 }).primaryKey(),
  clinicId: varchar('clinic_id', { length: 255 }).notNull(),
  sourceType: varchar('source_type', { length: 20 }).notNull(),
  sourceTemplateId: varchar('source_template_id', { length: 255 }),
  createdByUserId: varchar('created_by_user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  priceCoins: integer('price_coins').notNull(),
  requiredLevel: integer('required_level').default(1).notNull(),
  imageUrl: text('image_url'),
  metadata: jsonb('metadata').default({}).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const reward_programs = pgTable('reward_programs', {
  id: varchar('id', { length: 255 }).primaryKey(),
  clinicId: varchar('clinic_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  ageMin: integer('age_min'),
  ageMax: integer('age_max'),
  createdByUserId: varchar('created_by_user_id', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const story_option_templates = pgTable('story_option_templates', {
  id: varchar('id', { length: 100 }).primaryKey(),
  type: varchar('type', { length: 20 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 20 }).notNull(),
  color: varchar('color', { length: 50 }).notNull(),
  description: text('description'),
  imageUrl: text('image_url'),
  isDefault: boolean('is_default').default(true).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  createdByUserId: varchar('created_by_user_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const clinic_story_options = pgTable('clinic_story_options', {
  id: varchar('id', { length: 255 }).primaryKey(),
  clinicId: varchar('clinic_id', { length: 255 }).notNull(),
  templateId: varchar('template_id', { length: 100 }).notNull(),
  createdByUserId: varchar('created_by_user_id', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  icon: varchar('icon', { length: 20 }),
  color: varchar('color', { length: 50 }),
  description: text('description'),
  imageUrl: text('image_url'),
  isActive: boolean('is_active'),
  sortOrder: integer('sort_order'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const stories = pgTable('stories', {
  id: varchar('id', { length: 255 }).primaryKey(),
  patientId: varchar('patient_id', { length: 255 }).notNull(),
  treatmentId: varchar('treatment_id', { length: 255 }),
  promptId: varchar('prompt_id', { length: 255 }),
  preferencesSnapshot: jsonb('preferences_snapshot'),
  storyTitle: varchar('story_title', { length: 500 }),
  totalChapters: integer('total_chapters').default(1),
  currentChapter: integer('current_chapter').default(1),
  title: varchar('title', { length: 500 }),
  content: text('content'),
  wordCount: integer('word_count'),
  estimatedReadingTime: integer('estimated_reading_time'),
  modelUsed: varchar('model_used', { length: 100 }),
  tokensUsed: integer('tokens_used'),
  generationTimeMs: integer('generation_time_ms'),
  liked: boolean('liked').default(false),
  readCount: integer('read_count').default(0),
  lastReadAt: timestamp('last_read_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

const story_chapters = pgTable('story_chapters', {
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

const story_preferences = pgTable('story_preferences', {
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

// Create Express app
const app = express()

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie, Cache-Control')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  next()
})

// Body parser
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use(cookieParser())

// Lazy DB connection
function getDb() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not configured')
  }
  const sql = neon(process.env.DATABASE_URL)
  return drizzle(sql, { schema: { users, clinics, treatments, aligners, patient_points, messages, mission_templates, mission_programs, mission_program_templates, patient_missions, progress_photos, aligner_wear_sessions, aligner_wear_daily, store_item_templates, clinic_store_items, reward_programs, story_option_templates, clinic_story_options, stories, story_chapters, story_preferences } })
}

// Health check handler
const healthCheck = (req: any, res: any) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  })
}

// Health endpoints - disponível em ambos /health e /api/health
app.get('/health', healthCheck)
app.get('/api/health', healthCheck)

// ============================================
// TREATMENTS ENDPOINTS
// ============================================

// Get patient's treatment (most recent)
app.get('/api/treatments/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const db = getDb()
    const result = await db
      .select()
      .from(treatments)
      .where(eq(treatments.patientId, patientId))
      .orderBy(desc(treatments.createdAt))

    if (result.length === 0) {
      return res.json({ treatment: null })
    }

    res.json({ treatment: result[0] })
  } catch (error: any) {
    console.error('Error fetching treatment:', error)
    res.status(500).json({ error: 'Failed to fetch treatment' })
  }
})

// ============================================
// ALIGNERS ENDPOINTS
// ============================================

// Get all aligners for a patient
app.get('/api/aligners/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const { treatmentId } = req.query
    const db = getDb()

    const baseWhere = treatmentId
      ? and(eq(aligners.patientId, patientId), eq(aligners.treatmentId, treatmentId as string))
      : eq(aligners.patientId, patientId)

    const result = await db
      .select()
      .from(aligners)
      .where(baseWhere)
      .orderBy(asc(aligners.alignerNumber))

    res.json({ aligners: result })
  } catch (error: any) {
    console.error('Error fetching aligners:', error)
    res.status(500).json({ error: 'Failed to fetch aligners' })
  }
})

// ============================================
// CLINICS ENDPOINTS
// ============================================

// List all clinics
app.get('/api/clinics', async (_req, res) => {
  try {
    const db = getDb()
    const allClinics = await db.select().from(clinics)
    res.json({ clinics: allClinics })
  } catch (error: any) {
    console.error('Error fetching clinics:', error)
    res.status(500).json({ error: 'Failed to fetch clinics' })
  }
})

// Get clinic by ID
app.get('/api/clinics/:id', async (req, res) => {
  try {
    const { id } = req.params
    const db = getDb()
    const result = await db.select().from(clinics).where(eq(clinics.id, id))

    if (result.length === 0) {
      return res.json({ clinic: null })
    }

    res.json({ clinic: result[0] })
  } catch (error: any) {
    console.error('Error fetching clinic:', error)
    res.status(500).json({ error: 'Failed to fetch clinic' })
  }
})

// Create clinic
app.post('/api/clinics', async (req, res) => {
  try {
    const db = getDb()
    const newClinic = await db.insert(clinics).values({
      id: `clinic-${Date.now()}`,
      name: req.body.name,
      slug: req.body.slug,
      country: req.body.country || 'BR',
      email: req.body.email,
      phone: req.body.phone || null,
      website: req.body.website || null,
      addressCity: req.body.addressCity || null,
      addressState: req.body.addressState || null,
      primaryColor: req.body.primaryColor || '#3B82F6',
      timezone: req.body.timezone || 'America/Sao_Paulo',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    res.json({ clinic: newClinic[0] })
  } catch (error: any) {
    console.error('Error creating clinic:', error)
    res.status(500).json({ error: 'Failed to create clinic' })
  }
})

// Update clinic
app.put('/api/clinics/:id', async (req, res) => {
  try {
    const db = getDb()
    const updated = await db.update(clinics)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(clinics.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Clinic not found' })
    }

    res.json({ clinic: updated[0] })
  } catch (error: any) {
    console.error('Error updating clinic:', error)
    res.status(500).json({ error: 'Failed to update clinic' })
  }
})

// Delete clinic
app.delete('/api/clinics/:id', async (req, res) => {
  try {
    const db = getDb()
    await db.delete(clinics).where(eq(clinics.id, req.params.id))
    res.json({ message: 'Clinic deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting clinic:', error)
    res.status(500).json({ error: 'Failed to delete clinic' })
  }
})

// ============================================
// POINTS ENDPOINTS
// ============================================

// Get patient points
app.get('/api/points/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const db = getDb()
    const result = await db
      .select()
      .from(patient_points)
      .where(eq(patient_points.patientId, patientId))

    if (result.length === 0) {
      // Create initial points record
      const created = await db
        .insert(patient_points)
        .values({
          id: `points-${Date.now()}`,
          patientId,
          coins: 0,
          xp: 0,
          level: 1,
          totalPoints: 0,
          currentLevel: 1,
        })
        .returning()

      return res.json({ points: created[0] })
    }

    res.json({ points: result[0] })
  } catch (error: any) {
    console.error('Error fetching patient points:', error)
    res.status(500).json({ error: 'Failed to fetch patient points' })
  }
})

// ============================================
// MESSAGES ENDPOINTS
// ============================================

// Helper: Verify token
async function verifyToken(token: string) {
  if (!token || !token.startsWith('token-')) {
    return null
  }

  const userId = token.replace('token-', '')
  const db = getDb()
  const userResult = await db.select().from(users).where(eq(users.id, userId)).limit(1)

  if (userResult.length === 0) {
    return null
  }

  const { password_hash, ...userWithoutPassword } = userResult[0]
  return userWithoutPassword
}

// Get conversations list
app.get('/api/messages/conversations/list', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const currentUser = await verifyToken(token)
    if (!currentUser) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const db = getDb()

    // Get all messages where user is sender or receiver
    const userMessages = await db
      .select()
      .from(messages)
      .where(or(eq(messages.senderId, currentUser.id), eq(messages.receiverId, currentUser.id)))
      .orderBy(desc(messages.createdAt))

    // Group messages by conversation partner
    const conversationMap = new Map()

    for (const message of userMessages) {
      const partnerId = message.senderId === currentUser.id ? message.receiverId : message.senderId

      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, [])
      }

      conversationMap.get(partnerId).push({
        id: message.id,
        senderId: message.senderId,
        receiverId: message.receiverId,
        content: message.content,
        isRead: message.isRead,
        readAt: message.readAt ? new Date(message.readAt).toISOString() : null,
        createdAt: new Date(message.createdAt).toISOString(),
        updatedAt: new Date(message.updatedAt).toISOString(),
      })
    }

    // Build conversations with user info
    const conversations = []

    for (const [partnerId, msgs] of conversationMap.entries()) {
      const partnerUser = await db
        .select()
        .from(users)
        .where(eq(users.id, partnerId))
        .limit(1)

      if (partnerUser.length === 0) continue

      const partner = partnerUser[0]
      const lastMessage = msgs[0]

      // Count unread messages from partner
      const unreadCount = msgs.filter(
        (m: any) => m.senderId === partnerId && !m.isRead
      ).length

      conversations.push({
        userId: partnerId,
        userName: partner.fullName,
        userRole: partner.role,
        lastMessage,
        unreadCount,
      })
    }

    // Sort by last message date (most recent first)
    conversations.sort((a: any, b: any) => {
      const aTime = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0
      const bTime = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0
      return bTime - aTime
    })

    res.json(conversations)
  } catch (error: any) {
    console.error('Error getting conversations:', error)
    res.status(500).json({ error: 'Erro ao buscar conversas' })
  }
})

// Get messages between users
app.get('/api/messages/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const currentUser = await verifyToken(token)
    if (!currentUser) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const db = getDb()
    const result = await db
      .select({
        id: messages.id,
        senderId: messages.senderId,
        receiverId: messages.receiverId,
        content: messages.content,
        isRead: messages.isRead,
        readAt: messages.readAt,
        createdAt: messages.createdAt,
        updatedAt: messages.updatedAt,
        senderName: users.fullName,
        senderRole: users.role,
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(
        or(
          and(eq(messages.senderId, currentUser.id), eq(messages.receiverId, userId)),
          and(eq(messages.senderId, userId), eq(messages.receiverId, currentUser.id))
        )
      )
      .orderBy(messages.createdAt)

    const formatted = result.map((row) => ({
      id: row.id,
      senderId: row.senderId,
      receiverId: row.receiverId,
      content: row.content,
      isRead: row.isRead,
      readAt: row.readAt ? new Date(row.readAt).toISOString() : null,
      createdAt: new Date(row.createdAt).toISOString(),
      updatedAt: new Date(row.updatedAt).toISOString(),
      senderName: row.senderName || 'Unknown',
      senderRole: row.senderRole || 'unknown',
    }))

    res.json(formatted)
  } catch (error: any) {
    console.error('Error getting messages:', error)
    res.status(500).json({ error: 'Erro ao buscar mensagens' })
  }
})

// Send a message
app.post('/api/messages', async (req, res) => {
  try {
    const { receiverId, content } = req.body
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const currentUser = await verifyToken(token)
    if (!currentUser) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    if (!receiverId || !content) {
      return res.status(400).json({ error: 'receiverId e content são obrigatórios' })
    }

    const db = getDb()
    const now = new Date()
    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      senderId: currentUser.id,
      receiverId,
      content,
      isRead: false,
      readAt: null,
      createdAt: now,
      updatedAt: now,
    }

    await db.insert(messages).values(newMessage)

    res.status(201).json({
      ...newMessage,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    })
  } catch (error: any) {
    console.error('Error sending message:', error)
    res.status(500).json({ error: 'Erro ao enviar mensagem' })
  }
})

// Mark messages as read
app.put('/api/messages/:userId/read', async (req, res) => {
  try {
    const { userId } = req.params
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const currentUser = await verifyToken(token)
    if (!currentUser) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const db = getDb()
    await db
      .update(messages)
      .set({
        isRead: true,
        readAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(messages.senderId, userId),
          eq(messages.receiverId, currentUser.id),
          eq(messages.isRead, false)
        )
      )

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error marking messages as read:', error)
    res.status(500).json({ error: 'Erro ao marcar mensagens como lidas' })
  }
})

// Get unread count
app.get('/api/messages/unread/count', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const currentUser = await verifyToken(token)
    if (!currentUser) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const db = getDb()
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(messages)
      .where(and(eq(messages.receiverId, currentUser.id), eq(messages.isRead, false)))

    const count = Number(result[0]?.count || 0)
    res.json({ count })
  } catch (error: any) {
    console.error('Error getting unread count:', error)
    res.status(500).json({ error: 'Erro ao contar mensagens não lidas' })
  }
})

// Delete a message
app.delete('/api/messages/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params
    const token = req.headers.authorization?.replace('Bearer ', '')

    if (!token) {
      return res.status(401).json({ error: 'Não autorizado' })
    }

    const currentUser = await verifyToken(token)
    if (!currentUser) {
      return res.status(401).json({ error: 'Token inválido' })
    }

    const db = getDb()
    await db
      .delete(messages)
      .where(and(eq(messages.id, messageId), eq(messages.senderId, currentUser.id)))

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting message:', error)
    res.status(500).json({ error: 'Erro ao deletar mensagem' })
  }
})

// ============================================
// MISSIONS ENDPOINTS
// ============================================

// Get all mission templates
app.get('/api/missions/templates', async (req, res) => {
  try {
    const db = getDb()
    const result = await db.select().from(mission_templates)

    // Return without translations for simplicity in serverless
    res.json({ templates: result })
  } catch (error: any) {
    console.error('Error fetching mission templates:', error)
    res.status(500).json({ error: 'Failed to fetch mission templates' })
  }
})

// Get mission programs
app.get('/api/mission-programs', async (req, res) => {
  try {
    const clinicId = req.query.clinicId as string | undefined
    const db = getDb()

    const programs = clinicId
      ? await db.select().from(mission_programs).where(eq(mission_programs.clinicId, clinicId))
      : await db.select().from(mission_programs)

    res.json({ programs })
  } catch (error: any) {
    console.error('Error fetching mission programs:', error)
    res.status(500).json({ error: 'Failed to fetch mission programs' })
  }
})

// Get single mission program with templates
app.get('/api/mission-programs/:id', async (req, res) => {
  try {
    const { id } = req.params
    const db = getDb()

    const program = await db.select().from(mission_programs).where(eq(mission_programs.id, id))
    if (program.length === 0) {
      return res.status(404).json({ error: 'Program not found' })
    }

    const templates = await db
      .select()
      .from(mission_program_templates)
      .where(eq(mission_program_templates.programId, id))

    res.json({ program: program[0], templates })
  } catch (error: any) {
    console.error('Error fetching mission program:', error)
    res.status(500).json({ error: 'Failed to fetch mission program' })
  }
})

// ============================================
// STORE/REWARDS ENDPOINTS
// ============================================

// Get store item templates
app.get('/api/store/templates', async (req, res) => {
  try {
    const db = getDb()
    const templates = await db.select().from(store_item_templates)
    res.json({ templates })
  } catch (error: any) {
    console.error('Error fetching store templates:', error)
    res.status(500).json({ error: 'Failed to fetch store templates' })
  }
})

// Get clinic store items
app.get('/api/clinic/:clinicId/store/items', async (req, res) => {
  try {
    const { clinicId } = req.params
    const db = getDb()
    const items = await db
      .select()
      .from(clinic_store_items)
      .where(eq(clinic_store_items.clinicId, clinicId))
      .orderBy(desc(clinic_store_items.createdAt))
    res.json({ items })
  } catch (error: any) {
    console.error('Error fetching clinic store items:', error)
    res.status(500).json({ error: 'Failed to fetch clinic store items' })
  }
})

// Get clinic reward programs
app.get('/api/clinic/:clinicId/reward-programs', async (req, res) => {
  try {
    const { clinicId } = req.params
    const db = getDb()
    const programs = await db
      .select()
      .from(reward_programs)
      .where(eq(reward_programs.clinicId, clinicId))
      .orderBy(desc(reward_programs.createdAt))
    res.json({ programs })
  } catch (error: any) {
    console.error('Error fetching reward programs:', error)
    res.status(500).json({ error: 'Failed to fetch reward programs' })
  }
})

// Get clinic story options
app.get('/api/clinic/:clinicId/story-options', async (req, res) => {
  try {
    const { clinicId } = req.params
    const userId = req.query.userId as string

    if (!clinicId || !userId) {
      return res.status(400).json({ error: 'clinicId e userId são obrigatórios' })
    }

    const db = getDb()

    // Check user permission
    const u = await db.select().from(users).where(eq(users.id, userId))
    if (u.length === 0) {
      return res.status(403).json({ error: 'Usuário não encontrado' })
    }
    if (u[0].role !== 'orthodontist' && u[0].role !== 'super-admin') {
      return res.status(403).json({ error: 'Sem permissão' })
    }
    if (u[0].role !== 'super-admin' && u[0].clinicId !== clinicId) {
      return res.status(403).json({ error: 'Sem permissão' })
    }

    // Get templates and overrides
    const templates = await db
      .select()
      .from(story_option_templates)
      .where(eq(story_option_templates.isActive, true))
      .orderBy(asc(story_option_templates.type), asc(story_option_templates.sortOrder), asc(story_option_templates.name))

    const overrides = await db.select().from(clinic_story_options).where(eq(clinic_story_options.clinicId, clinicId))
    const overrideMap = new Map()
    for (const o of overrides) {
      overrideMap.set(o.templateId, o)
    }

    const items = templates.map((t: any) => {
      const o = overrideMap.get(t.id) || null
      return {
        template: t,
        override: o,
        effective: {
          id: t.id,
          type: t.type,
          name: o?.name ?? t.name,
          description: o?.description ?? t.description,
          icon: o?.icon ?? t.icon,
          color: o?.color ?? t.color,
          imageUrl: o?.imageUrl ?? t.imageUrl,
          isDefault: !!t.isDefault,
          isActive: o?.isActive === false ? false : true,
          sortOrder: o?.sortOrder ?? t.sortOrder,
        },
      }
    })

    res.json({ items })
  } catch (error: any) {
    console.error('Error fetching clinic story options:', error)
    res.status(500).json({ error: 'Failed to fetch clinic story options' })
  }
})

// ============================================
// ADMIN STORY OPTION TEMPLATES ENDPOINTS
// ============================================

// List all story option templates (super-admin)
app.get('/api/admin/story-option-templates', async (_req, res) => {
  try {
    const db = getDb()
    const templates = await db.select().from(story_option_templates)
    res.json({ templates })
  } catch (error: any) {
    console.error('Error fetching story option templates:', error)
    res.status(500).json({ error: 'Failed to fetch story option templates' })
  }
})

// Create story option template (super-admin)
app.post('/api/admin/story-option-templates', async (req, res) => {
  try {
    const {
      createdByUserId,
      id,
      type,
      name,
      description,
      icon = '✨',
      color = 'bg-purple-500',
      imageUrl,
      isDefault = false,
      isActive = true,
      sortOrder = 0,
      metadata = {},
    } = req.body || {}

    if (!createdByUserId) {
      return res.status(400).json({ error: 'createdByUserId é obrigatório' })
    }

    const db = getDb()
    const u = await db.select().from(users).where(eq(users.id, createdByUserId))
    if (u.length === 0 || u[0].role !== 'super-admin') {
      return res.status(403).json({ error: 'Sem permissão' })
    }

    if (!id || !type || !name) {
      return res.status(400).json({ error: 'id, type e name são obrigatórios' })
    }

    const created = await db
      .insert(story_option_templates)
      .values({
        id,
        type,
        name,
        description: description || null,
        icon,
        color,
        imageUrl: imageUrl || null,
        isDefault: !!isDefault,
        isActive: !!isActive,
        sortOrder: Number(sortOrder) || 0,
        metadata,
        createdByUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    res.json({ template: created[0] })
  } catch (error: any) {
    console.error('Error creating story option template:', error)
    res.status(500).json({ error: String(error?.message || error) })
  }
})

// Update story option template (super-admin)
app.put('/api/admin/story-option-templates/:id', async (req, res) => {
  try {
    const { createdByUserId, ...rest } = req.body || {}
    if (!createdByUserId) {
      return res.status(400).json({ error: 'createdByUserId é obrigatório' })
    }

    const db = getDb()
    const u = await db.select().from(users).where(eq(users.id, createdByUserId))
    if (u.length === 0 || u[0].role !== 'super-admin') {
      return res.status(403).json({ error: 'Sem permissão' })
    }

    const updated = await db
      .update(story_option_templates)
      .set({ ...rest, updatedAt: new Date() })
      .where(eq(story_option_templates.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Template não encontrado' })
    }

    res.json({ template: updated[0] })
  } catch (error: any) {
    console.error('Error updating story option template:', error)
    res.status(500).json({ error: String(error?.message || error) })
  }
})

// Delete (soft) story option template (super-admin)
app.delete('/api/admin/story-option-templates/:id', async (req, res) => {
  try {
    const createdByUserId = String(req.query.createdByUserId || '')
    if (!createdByUserId) {
      return res.status(400).json({ error: 'createdByUserId é obrigatório' })
    }

    const db = getDb()
    const u = await db.select().from(users).where(eq(users.id, createdByUserId))
    if (u.length === 0 || u[0].role !== 'super-admin') {
      return res.status(403).json({ error: 'Sem permissão' })
    }

    const updated = await db
      .update(story_option_templates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(story_option_templates.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Template não encontrado' })
    }

    res.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting story option template:', error)
    res.status(500).json({ error: String(error?.message || error) })
  }
})

// ============================================
// PATIENT MISSIONS ENDPOINTS
// ============================================

// Get all missions for a patient
app.get('/api/missions/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const db = getDb()

    // Get patient missions
    const missions = await db
      .select()
      .from(patient_missions)
      .where(eq(patient_missions.patientId, patientId))
      .orderBy(patient_missions.createdAt)

    // Get active treatment (to expose current aligner for UI filtering)
    const treatmentResults = await db
      .select()
      .from(treatments)
      .where(
        and(
          eq(treatments.patientId, patientId),
          eq(treatments.overallStatus, 'active')
        )
      )
      .limit(1)

    const currentAlignerOverall = treatmentResults[0]?.currentAlignerOverall ?? null

    // Get unique template IDs
    const templateIds = [...new Set(missions.map(m => m.missionTemplateId))]

    // Fetch templates
    let templates: any[] = []
    if (templateIds.length > 0) {
      templates = await db
        .select()
        .from(mission_templates)
        .where(inArray(mission_templates.id, templateIds))
    }

    // Create a map for quick lookup
    const templateMap = new Map(templates.map(t => [t.id, t]))

    // Attach template to each mission
    const missionsWithTemplates = missions.map(mission => ({
      ...mission,
      template: templateMap.get(mission.missionTemplateId),
    }))

    res.json({ missions: missionsWithTemplates, currentAlignerOverall })
  } catch (error: any) {
    console.error('Error fetching patient missions:', error)
    res.status(500).json({ error: 'Failed to fetch patient missions' })
  }
})

// ============================================
// PHOTOS ENDPOINTS
// ============================================

// Check required photos for patient
app.get('/api/photos/required/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const db = getDb()

    // Get active treatment
    const treatmentResults = await db
      .select()
      .from(treatments)
      .where(
        and(
          eq(treatments.patientId, patientId),
          eq(treatments.overallStatus, 'active')
        )
      )

    if (treatmentResults.length === 0) {
      return res.json({
        success: true,
        required: false,
        message: 'Nenhum tratamento ativo'
      })
    }

    const treatment = treatmentResults[0]
    const currentAligner = treatment.currentAlignerOverall

    // Check if there are photo mission templates
    const photoTemplates = await db
      .select({ id: mission_templates.id })
      .from(mission_templates)
      .where(eq(mission_templates.category, 'photos'))

    const photoTemplateIds = photoTemplates.map(t => t.id)
    if (photoTemplateIds.length === 0) {
      return res.json({
        success: true,
        required: false,
        currentAligner,
        missingTypes: [],
        existingPhotos: 0,
        message: 'Nenhuma missão de fotos configurada'
      })
    }

    // Check if there's a photo mission for current aligner
    const hasPhotoMissionForCurrentAligner = await db
      .select({ id: patient_missions.id })
      .from(patient_missions)
      .where(
        and(
          eq(patient_missions.patientId, patientId),
          inArray(patient_missions.missionTemplateId, photoTemplateIds),
          eq(patient_missions.triggerAlignerNumber, currentAligner)
        )
      )
      .limit(1)

    if (hasPhotoMissionForCurrentAligner.length === 0) {
      return res.json({
        success: true,
        required: false,
        currentAligner,
        missingTypes: [],
        existingPhotos: 0,
        message: 'Fotos não são necessárias neste alinhador'
      })
    }

    // Check existing photos for current aligner
    const existingPhotos = await db
      .select()
      .from(progress_photos)
      .where(
        and(
          eq(progress_photos.patientId, patientId),
          eq(progress_photos.alignerNumber, currentAligner)
        )
      )

    // Check which photo types are missing
    const photoTypes = ['frontal', 'right', 'left']
    const existingTypes = new Set(existingPhotos.map(p => p.photoType))
    const missingTypes = photoTypes.filter(t => !existingTypes.has(t))

    res.json({
      success: true,
      required: missingTypes.length > 0,
      currentAligner,
      missingTypes,
      existingPhotos: existingPhotos.length,
      message: missingTypes.length > 0
        ? `Faltam ${missingTypes.length} foto(s): ${missingTypes.join(', ')}`
        : 'Todas as fotos foram enviadas'
    })
  } catch (error: any) {
    console.error('Error checking required photos:', error)
    res.status(500).json({ error: 'Erro ao verificar fotos pendentes' })
  }
})

// ============================================
// ALIGNER WEAR ENDPOINTS
// ============================================

// Get wear status for aligner
app.get('/api/aligners/:alignerId/wear/status', async (req, res) => {
  try {
    const { alignerId } = req.params
    const patientId = String(req.query.patientId || '')

    if (!patientId) {
      return res.status(400).json({ error: 'patientId é obrigatório' })
    }

    const db = getDb()

    // Get aligner
    const alignerResult = await db
      .select()
      .from(aligners)
      .where(eq(aligners.id, alignerId))
      .limit(1)

    if (alignerResult.length === 0) {
      return res.status(404).json({ error: 'Alinhador não encontrado' })
    }

    const aligner = alignerResult[0]

    // Get current open session
    const openSession = await db
      .select()
      .from(aligner_wear_sessions)
      .where(
        and(
          eq(aligner_wear_sessions.alignerId, alignerId),
          sql`${aligner_wear_sessions.endedAt} is null`
        )
      )
      .orderBy(desc(aligner_wear_sessions.startedAt))
      .limit(1)

    const currentState = openSession.length > 0 ? openSession[0].state : 'paused'

    // Get today's date
    const today = new Date().toISOString().slice(0, 10)

    // Get today's wear data
    const todayWear = await db
      .select()
      .from(aligner_wear_daily)
      .where(
        and(
          eq(aligner_wear_daily.alignerId, alignerId),
          eq(aligner_wear_daily.date, today)
        )
      )
      .limit(1)

    const wearMinutes = todayWear.length > 0 ? todayWear[0].wearMinutes : 0
    const targetMinutes = aligner.targetHoursPerDay * 60
    const targetPercent = 80

    res.json({
      state: currentState,
      wearMinutesToday: wearMinutes,
      targetMinutesPerDay: targetMinutes,
      targetPercent,
      isDayOk: wearMinutes >= (targetMinutes * targetPercent / 100),
      session: openSession.length > 0 ? openSession[0] : null
    })
  } catch (error: any) {
    console.error('Error getting wear status:', error)
    res.status(500).json({ error: String(error?.message || error) })
  }
})

// Check if aligner can be activated
app.get('/api/aligners/:id/can-activate', async (req, res) => {
  try {
    const alignerId = req.params.id
    const db = getDb()

    // Get aligner
    const alignerResult = await db
      .select()
      .from(aligners)
      .where(eq(aligners.id, alignerId))

    if (alignerResult.length === 0) {
      return res.status(404).json({ error: 'Alinhador não encontrado' })
    }

    const aligner = alignerResult[0]

    // If already completed, cannot activate
    if (aligner.status === 'completed') {
      return res.json({
        canActivate: false,
        daysRemaining: 0,
        nextActivationDate: aligner.startDate,
        currentStatus: aligner.status
      })
    }

    // Check target date
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const targetRaw = aligner.status === 'active' ? aligner.endDate : aligner.startDate
    if (!targetRaw) {
      return res.json({
        canActivate: false,
        daysRemaining: 0,
        nextActivationDate: aligner.startDate,
        currentStatus: aligner.status,
        message: 'Alinhador sem data alvo (startDate/endDate) definida',
      })
    }

    const targetDate = new Date(targetRaw)
    targetDate.setHours(0, 0, 0, 0)

    const diffTime = targetDate.getTime() - today.getTime()
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    const canActivate = daysRemaining <= 0

    res.json({
      canActivate,
      daysRemaining: Math.max(0, daysRemaining),
      nextActivationDate: aligner.startDate,
      currentStatus: aligner.status
    })
  } catch (error: any) {
    console.error('Error checking aligner activation:', error)
    res.status(500).json({ error: 'Falha ao verificar ativação' })
  }
})

// ============================================
// AUTH/USERS ENDPOINTS
// ============================================

// Get users by clinic
app.get('/api/auth/users/clinic/:clinicId', async (req, res) => {
  try {
    const { clinicId } = req.params
    const db = getDb()
    const clinicUsers = await db.select().from(users).where(eq(users.clinicId, clinicId))

    const usersWithoutPasswords = clinicUsers.map(({ password_hash, ...user }) => user)
    res.json({ users: usersWithoutPasswords })
  } catch (error: any) {
    console.error('Error getting clinic users:', error)
    res.status(500).json({ error: 'Failed to get users' })
  }
})

// List all users (super-admin)
app.get('/api/auth/users', async (_req, res) => {
  try {
    const db = getDb()
    const all = await db.select().from(users)

    // Remove password_hash from all users
    const usersWithoutPasswords = all.map(({ password_hash, ...user }) => user)
    res.json({ users: usersWithoutPasswords })
  } catch (error: any) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

// List pending orthodontists (super-admin)
// NOTE: This must come BEFORE /users/:id to avoid being caught by the param route
app.get('/api/auth/users/pending', async (_req, res) => {
  try {
    const db = getDb()
    const all = await db.select().from(users)
    const pending = all.filter(
      (u: any) => u.role === 'orthodontist' && u.isApproved === false,
    )

    // Remove password_hash from all users
    const usersWithoutPasswords = pending.map(({ password_hash, ...user }: any) => user)
    res.json({ users: usersWithoutPasswords })
  } catch (error: any) {
    console.error('Error fetching pending orthodontists:', error)
    res.status(500).json({ error: 'Failed to fetch pending orthodontists' })
  }
})

// Update user profile
app.put('/api/auth/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { fullName, email, phone, birthDate, preferredLanguage, profilePhotoUrl, responsiblePin } = req.body
    const db = getDb()

    // Check if user exists
    const existingUser = await db.select().from(users).where(eq(users.id, id))
    if (existingUser.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Handle responsiblePin if provided
    let responsiblePinHash: string | null | undefined = undefined
    if (responsiblePin !== undefined) {
      const pin = String(responsiblePin)
      if (pin.length === 0) {
        responsiblePinHash = null
      } else {
        if (!/^\d{4,8}$/.test(pin)) {
          return res.status(400).json({ error: 'PIN deve ter 4 a 8 dígitos' })
        }
        responsiblePinHash = await bcrypt.hash(pin, 10)
      }
    }

    // Build update object
    const updateData: any = {
      fullName: fullName || existingUser[0].fullName,
      email: email || existingUser[0].email,
      phone: phone !== undefined ? phone : existingUser[0].phone,
      birthDate: birthDate !== undefined ? birthDate : existingUser[0].birthDate,
      preferredLanguage: preferredLanguage !== undefined ? preferredLanguage : existingUser[0].preferredLanguage,
      profilePhotoUrl: profilePhotoUrl !== undefined ? profilePhotoUrl : existingUser[0].profilePhotoUrl,
      updatedAt: new Date(),
    }

    if (responsiblePinHash !== undefined) {
      updateData.responsiblePinHash = responsiblePinHash
    }

    // Update user
    const updated = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning()

    const { password_hash, ...userWithoutPassword } = updated[0]
    res.json({ user: userWithoutPassword })
  } catch (error: any) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

// Approve orthodontist
app.put('/api/auth/users/:id/approve', async (req, res) => {
  try {
    const { id } = req.params
    const db = getDb()
    const updated = await db
      .update(users)
      .set({
        isApproved: true,
        isActive: true,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { password_hash, ...userWithoutPassword } = updated[0]
    res.json({ user: userWithoutPassword })
  } catch (error: any) {
    console.error('Error approving orthodontist:', error)
    res.status(500).json({ error: 'Failed to approve orthodontist' })
  }
})

// Reject orthodontist (mark as not approved and inactive)
app.put('/api/auth/users/:id/reject', async (req, res) => {
  try {
    const { id } = req.params
    const db = getDb()
    const updated = await db
      .update(users)
      .set({
        isApproved: false,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { password_hash, ...userWithoutPassword } = updated[0]
    res.json({ user: userWithoutPassword })
  } catch (error: any) {
    console.error('Error rejecting orthodontist:', error)
    res.status(500).json({ error: 'Failed to reject orthodontist' })
  }
})

// Deactivate user
app.put('/api/auth/users/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params
    const db = getDb()
    const updated = await db
      .update(users)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const { password_hash, ...userWithoutPassword } = updated[0]
    res.json({ user: userWithoutPassword })
  } catch (error: any) {
    console.error('Error deactivating user:', error)
    res.status(500).json({ error: 'Failed to deactivate user' })
  }
})

// Delete user permanently
app.delete('/api/auth/users/:id', async (req, res) => {
  try {
    const { id } = req.params
    const db = getDb()

    // Carregar usuário
    const existing = await db.select().from(users).where(eq(users.id, id))
    if (existing.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }
    const user = existing[0]

    // Cascade delete de dados do paciente
    if (user.role === 'patient' || user.role === 'child-patient') {
      // story chapters -> stories -> preferences
      const patientStories = await db.select().from(stories).where(eq(stories.patientId, id))
      for (const st of patientStories) {
        await db.delete(story_chapters).where(eq(story_chapters.storyId, st.id))
      }
      await db.delete(stories).where(eq(stories.patientId, id))
      await db.delete(story_preferences).where(eq(story_preferences.patientId, id))

      // aligners e treatments
      await db.delete(aligners).where(eq(aligners.patientId, id))
      await db.delete(treatments).where(eq(treatments.patientId, id))
    }

    // Excluir usuário
    await db.delete(users).where(eq(users.id, id))
    res.json({ message: 'User deleted successfully' })
  } catch (error: any) {
    console.error('Error deleting user:', error)
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { credential, password } = req.body

    if (!credential || !password) {
      return res.status(400).json({ error: 'Credenciais incompletas' })
    }

    const db = getDb()
    const [user] = await db.select().from(users).where(eq(users.email, credential)).limit(1)

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Usuário inativo' })
    }

    const now = new Date()
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24h
    const token = `token-${user.id}`

    // Update last login
    await db.update(users).set({ lastLoginAt: now }).where(eq(users.id, user.id))

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
        cpf: user.cpf,
        birthDate: user.birthDate,
        phone: user.phone,
        preferredLanguage: user.preferredLanguage,
        clinicId: user.clinicId,
        profilePhotoUrl: user.profilePhotoUrl,
        responsiblePinHash: user.responsiblePinHash,
        isActive: user.isActive,
        isApproved: user.isApproved,
        emailVerified: true,
        createdAt: new Date(user.createdAt ?? now).toISOString(),
        updatedAt: new Date(user.updatedAt ?? now).toISOString(),
        lastLoginAt: now.toISOString(),
      },
      token,
      expiresAt: expiresAt.toISOString(),
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Erro ao fazer login', message: error.message })
  }
})

// Error handler
app.use((err: any, req: any, res: any, next: any) => {
  console.error('API Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  })
})

// Export handler
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any)
}
