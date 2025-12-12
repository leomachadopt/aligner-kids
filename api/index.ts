/**
 * Vercel Serverless Function Entry Point
 * Wraps Express app for serverless deployment
 */

import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getApp } from '../server/app.serverless'

export default function handler(req: VercelRequest, res: VercelResponse) {
  const app = getApp()
  return app(req as any, res as any)
}
