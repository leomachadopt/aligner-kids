/**
 * Vercel Serverless Function Entry Point
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import express from 'express'

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
app.use(express.json())

// Health endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy - minimal version',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'connected' : 'not configured'
  })
})

// Export handler
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any)
}
