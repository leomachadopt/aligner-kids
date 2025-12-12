/**
 * Vercel Serverless Function Entry Point
 * Wraps Express app for Vercel deployment
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import express from 'express'
import cors from 'cors'

// Create Express app once (not per request)
const app = express()

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
}))
app.use(express.json())

// Health check endpoint
app.all('*', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    database: process.env.DATABASE_URL ? 'connected' : 'not configured',
    path: req.path,
    method: req.method
  })
})

// Export as Vercel serverless function
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any)
}
