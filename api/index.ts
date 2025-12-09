/**
 * Vercel Serverless Function Entry Point
 * Wraps Express app for Vercel deployment
 */

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'

// Import routes
import authRoutes from '../server/routes/auth'
import clinicsRoutes from '../server/routes/clinics'
import alignersRoutes from '../server/routes/aligners'

// Load environment variables
dotenv.config()

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

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/clinics', clinicsRoutes)
app.use('/api', alignersRoutes)

// For Vercel serverless
export default app
