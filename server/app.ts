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
import phasesRoutes from './routes/phases'
import messagesRoutes from './routes/messages'
import photosRoutes from './routes/photos'
import storeRoutes from './routes/store'
import storeTemplatesRoutes from './routes/storeTemplates'
import clinicRewardsRoutes from './routes/clinicRewards'
import parentRewardsRoutes from './routes/parentRewards'
import patientPointsRoutes from './routes/patientPoints'
import storyOptionsRoutes from './routes/storyOptions'
import adminStoryOptionsRoutes from './routes/adminStoryOptions'
import clinicStoryOptionsRoutes from './routes/clinicStoryOptions'

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
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control'],
  credentials: true,
}

app.use(cors(corsOptions))
app.use(express.json({ limit: '10mb' })) // Aumentar limite para fotos em base64
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use(cookieParser())

// Health check handler
const healthCheck = async (_req: express.Request, res: express.Response) => {
  try {
    // Test database connection
    await db.select().from(users).limit(1)
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
}

// Health check - disponível em ambos /health e /api/health
app.get('/health', healthCheck)
app.get('/api/health', healthCheck)

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/clinics', clinicsRoutes)
app.use('/api', alignersRoutes)
app.use('/api', storiesRoutes)
app.use('/api', missionsRoutes)
app.use('/api/phases', phasesRoutes)
app.use('/api/messages', messagesRoutes)
app.use('/api/photos', photosRoutes)
app.use('/api', storeRoutes)
app.use('/api', storeTemplatesRoutes)
app.use('/api', clinicRewardsRoutes)
app.use('/api', parentRewardsRoutes)
app.use('/api', patientPointsRoutes)
app.use('/api', storyOptionsRoutes)
app.use('/api', adminStoryOptionsRoutes)
app.use('/api', clinicStoryOptionsRoutes)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Server error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

export default app
