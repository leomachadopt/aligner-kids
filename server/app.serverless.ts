/**
 * Express App Configuration for Serverless
 * Cria a aplicação Express de forma lazy para serverless functions
 */

import express, { Application } from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

// Import routes
import authRoutes from './routes/auth'
import clinicsRoutes from './routes/clinics'
import alignersRoutes from './routes/aligners'

let app: Application | null = null

export function getApp(): Application {
  if (app) {
    return app
  }

  app = express()

  // Middleware
  app.use(cors({
    origin: [
      'http://localhost:5173',
      'http://localhost:8082',
      'https://aligner-kids.vercel.app',
      /https:\/\/aligner-kids.*\.vercel\.app/,
    ],
    credentials: true,
  }))
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true, limit: '10mb' }))
  app.use(cookieParser())

  // Health check
  app.get('/api/health', (req, res) => {
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
  app.use('/api', alignersRoutes)

  // Error handler
  app.use((err: any, req: any, res: any, next: any) => {
    console.error('Express error:', err)
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    })
  })

  return app
}
