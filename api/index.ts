/**
 * Vercel Serverless Function Entry Point
 * Wraps Express app for Vercel deployment
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import express, { Request, Response } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

// Import routes
import authRoutes from '../server/routes/auth'
import clinicsRoutes from '../server/routes/clinics'
import alignersRoutes from '../server/routes/aligners'
import storiesRoutes from '../server/routes/stories'
import missionsRoutes from '../server/routes/missions'

// Create Express app
const app = express()

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:8082',
    'https://aligner-kids.vercel.app',
    /https:\/\/aligner-kids.*\.vercel\.app/, // All preview deployments
  ],
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/clinics', clinicsRoutes)
app.use('/api/stories', storiesRoutes)
app.use('/api/missions', missionsRoutes)
app.use('/api', alignersRoutes)

// Error handler
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error('Express error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  })
})

// Export as Vercel serverless function
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any)
}
