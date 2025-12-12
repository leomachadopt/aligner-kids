/**
 * Express App Configuration
 * Separated from server/index.ts to allow use in serverless environments
 */

import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import { db, users } from './db/index'

// Import routes
import authRoutes from './routes/auth'
import clinicsRoutes from './routes/clinics'
import alignersRoutes from './routes/aligners'
import storiesRoutes from './routes/stories'
import missionsRoutes from './routes/missions'

// Load environment variables
dotenv.config()

const app = express()

// Middleware
const isProd = process.env.NODE_ENV === 'production'

// Em produção: permitir domínios oficiais + sempre localhost/127.* (para suporte local)
// Em dev: permitir tudo
const allowedOrigins = [
  'https://aligner-kids.vercel.app',
  /https:\/\/aligner-kids-.*\.vercel\.app/, // Preview deployments (regex)
]

const localhostRegex = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true) // requests sem origem (ex: curl)

    // Sempre permitir localhost/127.* (qualquer porta), mesmo em prod (suporte interno)
    if (localhostRegex.test(origin)) {
      return callback(null, true)
    }

    const isAllowedProd = allowedOrigins.some((o) =>
      o instanceof RegExp ? o.test(origin) : o === origin,
    )

    if (!isProd) {
      // Dev: libera tudo
      return callback(null, true)
    }

    // Prod: aceita oficiais ou localhost (já tratado acima)
    if (isAllowedProd) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

// Health check
app.get('/health', async (req, res) => {
  try {
    // Test database connection
    const result = await db.select().from(users).limit(1)
    res.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      database: 'disconnected',
      error: String(error),
      timestamp: new Date().toISOString(),
    })
  }
})

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/clinics', clinicsRoutes)
app.use('/api', alignersRoutes)
app.use('/api', storiesRoutes)
app.use('/api', missionsRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
