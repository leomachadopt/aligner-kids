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
import { eq, and } from 'drizzle-orm'
import { pgTable, text, timestamp, boolean, varchar } from 'drizzle-orm/pg-core'

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

// Create Express app
const app = express()

// CORS middleware
app.use((req, res, next) => {
  const origin = req.headers.origin || '*'
  res.setHeader('Access-Control-Allow-Origin', origin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Cookie')
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
  return drizzle(sql, { schema: { users } })
}

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  })
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
