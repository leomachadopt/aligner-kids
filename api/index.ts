/**
 * Vercel Serverless Function Entry Point
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import express from 'express'
import cookieParser from 'cookie-parser'
import bcrypt from 'bcryptjs'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { eq } from 'drizzle-orm'
import * as schema from '../server/db/schema'

// Create Express app
const app = express()

// CORS middleware
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*')
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
  const sql = neon(process.env.DATABASE_URL!)
  return drizzle(sql, { schema })
}

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  })
})

// Login endpoint inline
app.post('/api/auth/login', async (req, res) => {
  try {
    const { credential, password } = req.body
    const db = getDb()

    const [user] = await db.select().from(schema.users).where(eq(schema.users.email, credential)).limit(1)

    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    const validPassword = await bcrypt.compare(password, user.password_hash)

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' })
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Usuário inativo' })
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName
      }
    })
  } catch (error: any) {
    console.error('Login error:', error)
    res.status(500).json({ error: 'Erro ao fazer login' })
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
