import { db, patient_points, point_transactions, users } from '../db'
import { and, desc, eq, lt } from 'drizzle-orm'

function computeLevelFromXp(xp: number): number {
  return Math.floor((xp || 0) / 100) + 1
}

function clampInt(value: unknown, fallback = 0): number {
  const n = typeof value === 'string' ? Number(value) : (value as number)
  if (!Number.isFinite(n)) return fallback
  return Math.trunc(n)
}

export type PointsBalance = {
  patientId: string
  coins: number
  xp: number
  level: number
  totalPoints?: number | null
  currentLevel?: number | null
  updatedAt?: Date
}

export type PointsTransaction = {
  id: string
  patientId: string
  kind: string
  source: string
  amountCoins: number
  balanceAfterCoins: number
  metadata: any
  createdAt: Date
}

export class PatientPointsService {
  static async assertPatientInClinic(patientId: string, clinicId: string) {
    const rows = await db.select().from(users).where(eq(users.id, patientId))
    if (rows.length === 0) {
      const err: any = new Error('Paciente não encontrado')
      err.statusCode = 404
      throw err
    }
    if ((rows[0].clinicId || null) !== clinicId) {
      const err: any = new Error('Paciente não pertence a esta clínica')
      err.statusCode = 403
      throw err
    }
    return rows[0]
  }

  static async assertOrthodontistAccess(orthodontistId: string, clinicId: string) {
    const rows = await db.select().from(users).where(eq(users.id, orthodontistId))
    if (rows.length === 0) {
      const err: any = new Error('Usuário não encontrado')
      err.statusCode = 404
      throw err
    }

    const role = rows[0].role
    if (role === 'super-admin') return rows[0]

    if (role !== 'orthodontist') {
      const err: any = new Error('Sem permissão')
      err.statusCode = 403
      throw err
    }
    if ((rows[0].clinicId || null) !== clinicId) {
      const err: any = new Error('Sem permissão para esta clínica')
      err.statusCode = 403
      throw err
    }
    return rows[0]
  }

  static async getOrCreatePoints(patientId: string): Promise<PointsBalance> {
    const rows = await db.select().from(patient_points).where(eq(patient_points.patientId, patientId))
    if (rows.length > 0) return rows[0] as any

    const created = await db
      .insert(patient_points)
      .values({
        id: `points-${Date.now()}`,
        patientId,
        coins: 0,
        xp: 0,
        level: 1,
        // legacy mirrors
        totalPoints: 0,
        currentLevel: 1,
        lastActivityAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return created[0] as any
  }

  static async adjustPoints(params: {
    clinicId: string
    patientId: string
    orthodontistId: string
    deltaCoins: number
    deltaXp: number
    reason?: string
  }): Promise<{ points: PointsBalance; transaction: PointsTransaction }> {
    const { clinicId, patientId, orthodontistId } = params
    const deltaCoins = clampInt(params.deltaCoins, 0)
    const deltaXp = clampInt(params.deltaXp, 0)
    const reason = (params.reason || '').trim()

    await this.assertOrthodontistAccess(orthodontistId, clinicId)
    await this.assertPatientInClinic(patientId, clinicId)

    const current = await this.getOrCreatePoints(patientId)
    const nextCoins = (current.coins || 0) + deltaCoins
    const nextXp = (current.xp || 0) + deltaXp
    const nextLevel = computeLevelFromXp(nextXp)

    if (nextCoins < 0) {
      const err: any = new Error('Saldo de moedas não pode ficar negativo')
      err.statusCode = 400
      throw err
    }
    if (nextXp < 0) {
      const err: any = new Error('XP não pode ficar negativo')
      err.statusCode = 400
      throw err
    }

    const updated = await db
      .update(patient_points)
      .set({
        coins: nextCoins,
        xp: nextXp,
        level: nextLevel,
        // legacy mirrors
        totalPoints: nextCoins,
        currentLevel: nextLevel,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(patient_points.patientId, patientId))
      .returning()

    const tx = await db
      .insert(point_transactions)
      .values({
        id: `ptx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        patientId,
        kind: 'adjust',
        source: 'manual',
        amountCoins: deltaCoins,
        balanceAfterCoins: nextCoins,
        metadata: {
          deltaXp,
          newXp: nextXp,
          newLevel: nextLevel,
          orthodontistId,
          reason,
        },
        createdAt: new Date(),
      })
      .returning()

    return { points: updated[0] as any, transaction: tx[0] as any }
  }

  static async listTransactions(params: {
    clinicId: string
    patientId: string
    orthodontistId: string
    limit?: number
    cursor?: string | null
  }): Promise<{ transactions: PointsTransaction[]; nextCursor: string | null }> {
    const { clinicId, patientId, orthodontistId } = params
    await this.assertOrthodontistAccess(orthodontistId, clinicId)
    await this.assertPatientInClinic(patientId, clinicId)

    const limit = Math.min(Math.max(clampInt(params.limit, 50), 1), 200)
    const cursorDate = params.cursor ? new Date(params.cursor) : null
    const hasCursor = cursorDate && !Number.isNaN(cursorDate.getTime())

    const where = hasCursor
      ? and(eq(point_transactions.patientId, patientId), lt(point_transactions.createdAt, cursorDate!))
      : eq(point_transactions.patientId, patientId)

    const rows = await db
      .select()
      .from(point_transactions)
      .where(where as any)
      .orderBy(desc(point_transactions.createdAt))
      .limit(limit)

    const nextCursor = rows.length > 0 ? (rows[rows.length - 1] as any).createdAt.toISOString() : null
    return { transactions: rows as any, nextCursor }
  }
}


