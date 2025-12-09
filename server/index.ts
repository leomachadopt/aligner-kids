/**
 * API Server - Kids Aligner
 * Express server com conexão ao Neon PostgreSQL via Drizzle ORM
 * Para desenvolvimento local
 */

import app from './app'

const PORT = process.env.PORT || 3001

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
  console.log(`💾 Database: Neon PostgreSQL`)
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth`)
  console.log(`🏥 Clinics: http://localhost:${PORT}/api/clinics`)
  console.log(`📦 Aligners: http://localhost:${PORT}/api/aligners`)
})
