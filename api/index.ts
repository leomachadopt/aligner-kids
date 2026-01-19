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
import { eq, and, desc, asc } from 'drizzle-orm'
import { pgTable, text, timestamp, boolean, varchar, integer } from 'drizzle-orm/pg-core'

// Schema inline (necessário para serverless)
const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password_hash: text('password_hash').notNull(),
  role: varchar('role', { length: 50 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  cpf: varchar('cpf', { length: 20 }),
  clinicId: varchar('clinic_id', { length: 255 }),
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
  startDate: varchar('start_date', { length: 10 }),
  endDate: varchar('end_date', { length: 10 }),
  status: varchar('status', { length: 50 }).default('upcoming').notNull(),
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
  return drizzle(sql, { schema: { users, clinics, treatments, aligners, patient_points } })
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
        clinicId: user.clinicId,
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
