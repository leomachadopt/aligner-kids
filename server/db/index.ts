/**
 * Database connection using Drizzle ORM + Neon
 */

import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './schema'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Get database URL from environment
const DATABASE_URL = process.env.DATABASE_URL

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in environment variables')
}

// Create Neon client
const sql = neon(DATABASE_URL)

// Create Drizzle instance
export const db = drizzle(sql, { schema })

console.log('✅ Database connection established (Neon + Drizzle)')

export * from './schema'
