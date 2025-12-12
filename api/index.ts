/**
 * Vercel Serverless Function Entry Point
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import express from 'express'
import cookieParser from 'cookie-parser'
import authRoutes from '../server/routes/auth'
import clinicsRoutes from '../server/routes/clinics'
import alignersRoutes from '../server/routes/aligners'

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

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/clinics', clinicsRoutes)
app.use('/api', alignersRoutes)

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
