/**
 * Database connection using Drizzle ORM + Neon
 * Lazy loading for serverless compatibility
 */

import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import type { NeonHttpDatabase } from 'drizzle-orm/neon-http'
import * as schema from './schema'

let _db: NeonHttpDatabase<typeof schema> | null = null

// Lazy database connection
export function getDb() {
  if (_db) {
    return _db
  }

  const DATABASE_URL = process.env.DATABASE_URL

  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in environment variables')
    throw new Error('DATABASE_URL is not set in environment variables')
  }

  // Create Neon client
  const sql = neon(DATABASE_URL)

  // Create Drizzle instance
  _db = drizzle(sql, { schema })

  console.log('✅ Database connection established (Neon + Drizzle)')

  return _db
}

// Export for backward compatibility
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(target, prop) {
    return getDb()[prop as keyof NeonHttpDatabase<typeof schema>]
  }
})

export * from './schema'
