/**
 * Vercel Serverless Function Entry Point
 * Wraps Express app for Vercel deployment
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'

// Simple health check for testing
export default async (req: VercelRequest, res: VercelResponse) => {
  try {
    // Test environment variables
    const hasDatabase = !!process.env.DATABASE_URL
    const hasOpenAI = !!process.env.OPENAI_API_KEY

    return res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'production',
      config: {
        database: hasDatabase,
        openai: hasOpenAI
      },
      method: req.method,
      url: req.url
    })
  } catch (error: any) {
    console.error('Error in serverless function:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
