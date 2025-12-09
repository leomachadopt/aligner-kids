/**
 * API Server - Kids Aligner
 * Express server com conexão ao Neon PostgreSQL via Drizzle ORM
 */

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { db, users } from './db/index'

// Import routes
import authRoutes from './routes/auth'
import clinicsRoutes from './routes/clinics'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8082'],
  credentials: true,
}))
app.use(express.json())
app.use(cookieParser())

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    await db.select().from(users).limit(1)
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/clinics', clinicsRoutes)

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`💾 Database: Neon PostgreSQL`)
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`)
  console.log(`🏥 Clinics: http://localhost:${PORT}/api/clinics`)
})
