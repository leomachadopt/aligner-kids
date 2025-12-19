/**
 * Store Service
 * Handles store catalog, purchases, inventory and reward redemptions.
 */

import {
  db,
  store_items,
  patient_inventory,
  reward_redemptions,
  patient_points,
  point_transactions,
  users,
  clinics,
  clinic_store_items,
  parent_store_items,
  patient_cosmetics,
  story_option_templates,
} from '../db'
import { and, desc, eq, gte, inArray, lt, sql } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import { RewardCatalogService } from './rewardCatalogService'

export type StoreItemType = 'digital' | 'real'
export type RedemptionStatus = 'requested' | 'approved' | 'rejected' | 'fulfilled'
export type TransactionKind = 'earn' | 'spend' | 'adjust'
export type TransactionSource = 'mission' | 'purchase' | 'manual' | 'streak'

export interface PurchaseResult {
  points: any
  item: any
  inventoryItem?: any
  redemption?: any
}

export class StoreService {
  private static makeHttpError(message: string, statusCode: number) {
    const err: any = new Error(message)
    err.statusCode = statusCode
    return err
  }

  private static async hasAlreadyPurchased(patientId: string, itemId: string): Promise<boolean> {
    const [inv, reds] = await Promise.all([
      db
        .select({ id: patient_inventory.id })
        .from(patient_inventory)
        .where(and(eq(patient_inventory.patientId, patientId), eq(patient_inventory.itemId, itemId)))
        .limit(1),
      db
        .select({ id: reward_redemptions.id })
        .from(reward_redemptions)
        .where(and(eq(reward_redemptions.patientId, patientId), eq(reward_redemptions.itemId, itemId)))
        .limit(1),
    ])
    return inv.length > 0 || reds.length > 0
  }

  private static async getStoreConfigForPatient(patientId: string): Promise<any> {
    const patient = await db.select().from(users).where(eq(users.id, patientId))
    if (patient.length === 0) return {}
    const clinicId = patient[0].clinicId
    if (!clinicId) return {}
    const clinic = await db.select().from(clinics).where(eq(clinics.id, clinicId))
    const config = clinic[0]?.gamificationConfig || {}
    return (config as any).store || {}
  }

  private static async getSpentTodayCoins(patientId: string): Promise<number> {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    const end = new Date(start)
    end.setDate(end.getDate() + 1)

    const rows = await db
      .select({
        spent: sql<number>`coalesce(sum(abs(${point_transactions.amountCoins})), 0)`,
      })
      .from(point_transactions)
      .where(
        and(
          eq(point_transactions.patientId, patientId),
          eq(point_transactions.kind, 'spend'),
          gte(point_transactions.createdAt, start),
          lt(point_transactions.createdAt, end),
        ),
      )

    return Number(rows[0]?.spent || 0)
  }

  private static async checkCooldown(patientId: string, itemId: string, cooldownHours: number): Promise<void> {
    if (!cooldownHours || cooldownHours <= 0) return
    const last = await db
      .select({ createdAt: point_transactions.createdAt })
      .from(point_transactions)
      .where(
        and(
          eq(point_transactions.patientId, patientId),
          eq(point_transactions.source, 'purchase'),
          sql`${point_transactions.metadata} ->> 'itemId' = ${itemId}`,
        ),
      )
      .orderBy(desc(point_transactions.createdAt))
      .limit(1)

    const lastAt = last[0]?.createdAt
    if (!lastAt) return
    const diffMs = Date.now() - new Date(lastAt as any).getTime()
    const diffHours = diffMs / (1000 * 60 * 60)
    if (diffHours < cooldownHours) {
      throw new Error(`Aguarde ${Math.ceil(cooldownHours - diffHours)}h para comprar este item novamente`)
    }
  }

  private static async validateResponsiblePinOrThrow(userId: string, pin: string): Promise<void> {
    const rows = await db.select().from(users).where(eq(users.id, userId))
    if (rows.length === 0) throw new Error('Usuário não encontrado')
    const hash = rows[0].responsiblePinHash
    if (!hash) throw new Error('PIN não configurado. Defina um PIN no perfil.')
    const ok = await bcrypt.compare(String(pin || ''), hash)
    if (!ok) throw new Error('PIN inválido')
  }

  static async listActiveItems() {
    return db.select().from(store_items).where(eq(store_items.isActive, true))
  }

  static async getPatientInventory(patientId: string) {
    const activeCosmetics = await db
      .select()
      .from(patient_cosmetics)
      .where(and(eq(patient_cosmetics.patientId, patientId), eq(patient_cosmetics.isActive, true)))
      .orderBy(desc(patient_cosmetics.createdAt))

    const activeBySlot = new Map<string, string>()
    for (const c of activeCosmetics as any[]) {
      if (!activeBySlot.has(c.slot)) {
        activeBySlot.set(String(c.slot), String(c.inventoryId))
      }
    }

    const inv = await db
      .select()
      .from(patient_inventory)
      .where(eq(patient_inventory.patientId, patientId))
      .orderBy(desc(patient_inventory.acquiredAt))

    const legacyIds = inv.filter((r: any) => !String(r.itemId).includes(':')).map((r: any) => r.itemId)
    const synthetic = inv.filter((r: any) => String(r.itemId).includes(':'))

    const legacyItems = legacyIds.length
      ? await db.select().from(store_items).where(inArray(store_items.id, legacyIds as any))
      : []
    const legacyMap = new Map((legacyItems as any[]).map((it) => [it.id, it]))

    const clinicIds = synthetic
      .filter((r: any) => String(r.itemId).startsWith('clinic:'))
      .map((r: any) => String(r.itemId).split(':')[1])
    const parentIds = synthetic
      .filter((r: any) => String(r.itemId).startsWith('parent:'))
      .map((r: any) => String(r.itemId).split(':')[1])
    const storyOptionIds = synthetic
      .filter((r: any) => String(r.itemId).startsWith('story_option:'))
      .map((r: any) => String(r.itemId).split(':')[1])

    const clinicItems = clinicIds.length
      ? await db.select().from(clinic_store_items).where(inArray(clinic_store_items.id, clinicIds as any))
      : []
    const parentItems = parentIds.length
      ? await db.select().from(parent_store_items).where(inArray(parent_store_items.id, parentIds as any))
      : []
    const storyTemplates = storyOptionIds.length
      ? await db.select().from(story_option_templates).where(inArray(story_option_templates.id, storyOptionIds as any))
      : []

    const clinicMap = new Map((clinicItems as any[]).map((it) => [it.id, it]))
    const parentMap = new Map((parentItems as any[]).map((it) => [it.id, it]))
    const storyMap = new Map((storyTemplates as any[]).map((it) => [String(it.id), it]))

    return inv.map((row: any) => {
      const raw = String(row.itemId)
      let item: any = null
      if (raw.startsWith('clinic:')) item = clinicMap.get(raw.split(':')[1]) || null
      else if (raw.startsWith('parent:')) item = parentMap.get(raw.split(':')[1]) || null
      else if (raw.startsWith('story_option:')) {
        const templateId = raw.split(':')[1]
        const t: any = storyMap.get(String(templateId)) || null
        if (t) {
          const type = String(t.type)
          const meta: any = { unlock: 'story_options' }
          if (type === 'environment') meta.addEnvironments = [String(t.id)]
          else if (type === 'theme') meta.addThemes = [String(t.id)]
          else if (type === 'character') meta.addCharacters = [String(t.id)]
          item = {
            id: String(t.id),
            name: type === 'environment' ? `Ambiente: ${t.name}` : type === 'theme' ? `Tema: ${t.name}` : `Personagem: ${t.name}`,
            description: t.description || '',
            type: 'digital',
            category: 'story_unlock',
            priceCoins: 0,
            requiredLevel: 1,
            imageUrl: t.imageUrl || null,
            metadata: meta,
          }
        }
      }
      else item = legacyMap.get(raw) || null

      const slot = (() => {
        const metaSlot = item?.metadata?.slot
        if (metaSlot) return String(metaSlot)
        if (item?.category === 'photo_frame') return 'photo_frame'
        return null
      })()

      const isEquipped = slot ? activeBySlot.get(slot) === String(row.id) : false
      const canActivate = Boolean(slot) && (item?.type === 'digital' || item?.type === 'digital')

      return {
        inventoryId: row.id,
        patientId: row.patientId,
        itemId: row.itemId,
        quantity: row.quantity,
        isActive: row.isActive,
        slot,
        isEquipped,
        canActivate,
        acquiredAt: row.acquiredAt,
        item,
      }
    })
  }

  static async activateCosmetic(params: { patientId: string; inventoryId: string; slot: string }) {
    const { patientId, inventoryId, slot } = params

    // Ensure inventory belongs to patient
    const inv = await db.select().from(patient_inventory).where(eq(patient_inventory.id, inventoryId))
    if (inv.length === 0) throw this.makeHttpError('Item de inventário não encontrado', 404)
    if (inv[0].patientId !== patientId) throw this.makeHttpError('Sem permissão', 403)

    // Deactivate existing in the same slot
    await db
      .update(patient_cosmetics)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(patient_cosmetics.patientId, patientId), eq(patient_cosmetics.slot, slot), eq(patient_cosmetics.isActive, true)))

    // Upsert-ish: if there is already a row for this inventoryId+slot, activate it; else insert
    const existing = await db
      .select()
      .from(patient_cosmetics)
      .where(and(eq(patient_cosmetics.patientId, patientId), eq(patient_cosmetics.slot, slot), eq(patient_cosmetics.inventoryId, inventoryId)))
      .limit(1)

    if (existing.length > 0) {
      const updated = await db
        .update(patient_cosmetics)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(patient_cosmetics.id, existing[0].id))
        .returning()
      return updated[0]
    }

    const created = await db
      .insert(patient_cosmetics)
      .values({
        id: `pcos-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        patientId,
        slot,
        inventoryId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
    return created[0]
  }

  static async deactivateCosmetic(params: { patientId: string; inventoryId: string; slot: string }) {
    const { patientId, inventoryId, slot } = params

    const updated = await db
      .update(patient_cosmetics)
      .set({ isActive: false, updatedAt: new Date() })
      .where(and(eq(patient_cosmetics.patientId, patientId), eq(patient_cosmetics.slot, slot), eq(patient_cosmetics.inventoryId, inventoryId)))
      .returning()

    if (updated.length === 0) throw this.makeHttpError('Cosmético ativo não encontrado', 404)
    return updated[0]
  }

  static async getActiveCosmetics(patientId: string) {
    const active = await db
      .select()
      .from(patient_cosmetics)
      .where(and(eq(patient_cosmetics.patientId, patientId), eq(patient_cosmetics.isActive, true)))
      .orderBy(desc(patient_cosmetics.createdAt))

    // Attach inventory + item (reuse existing resolver)
    const inventory = await this.getPatientInventory(patientId)
    const invMap = new Map(inventory.map((i: any) => [String(i.inventoryId), i]))

    const bySlot: Record<string, any> = {}
    for (const c of active as any[]) {
      const slot = String(c.slot)
      if (bySlot[slot]) continue
      bySlot[slot] = {
        slot,
        inventoryId: c.inventoryId,
        inventory: invMap.get(String(c.inventoryId)) || null,
      }
    }

    return { patientId, cosmetics: bySlot }
  }

  static async getEntitlements(patientId: string) {
    const inventory = await this.getPatientInventory(patientId)
    const storyUnlocks = inventory.filter((i: any) => i?.item?.category === 'story_unlock')

    const addThemes = new Set<string>()
    const addEnvironments = new Set<string>()
    const addCharacters = new Set<string>()

    for (const inv of storyUnlocks as any[]) {
      const meta = inv?.item?.metadata || {}
      const themes = Array.isArray(meta.addThemes) ? meta.addThemes : []
      const envs = Array.isArray(meta.addEnvironments) ? meta.addEnvironments : []
      const chars =
        Array.isArray(meta.addCharacters) ? meta.addCharacters : meta.unlock === 'character' ? ['sereia', 'detetive', 'cientista'] : []
      themes.forEach((t: any) => addThemes.add(String(t)))
      envs.forEach((e: any) => addEnvironments.add(String(e)))
      chars.forEach((c: any) => addCharacters.add(String(c)))
    }

    return {
      patientId,
      storyOptions: {
        addThemes: Array.from(addThemes),
        addEnvironments: Array.from(addEnvironments),
        addCharacters: Array.from(addCharacters),
      },
    }
  }

  static async getPatientRedemptions(patientId: string) {
    const reds = await db
      .select()
      .from(reward_redemptions)
      .where(eq(reward_redemptions.patientId, patientId))
      .orderBy(desc(reward_redemptions.requestedAt))

    const legacyIds = reds.filter((r: any) => !String(r.itemId).includes(':')).map((r: any) => r.itemId)
    const synthetic = reds.filter((r: any) => String(r.itemId).includes(':'))

    const legacyItems = legacyIds.length
      ? await db.select().from(store_items).where(inArray(store_items.id, legacyIds as any))
      : []
    const legacyMap = new Map((legacyItems as any[]).map((it) => [it.id, it]))

    const clinicIds = synthetic
      .filter((r: any) => String(r.itemId).startsWith('clinic:'))
      .map((r: any) => String(r.itemId).split(':')[1])
    const parentIds = synthetic
      .filter((r: any) => String(r.itemId).startsWith('parent:'))
      .map((r: any) => String(r.itemId).split(':')[1])

    const clinicItems = clinicIds.length
      ? await db.select().from(clinic_store_items).where(inArray(clinic_store_items.id, clinicIds as any))
      : []
    const parentItems = parentIds.length
      ? await db.select().from(parent_store_items).where(inArray(parent_store_items.id, parentIds as any))
      : []

    const clinicMap = new Map((clinicItems as any[]).map((it) => [it.id, it]))
    const parentMap = new Map((parentItems as any[]).map((it) => [it.id, it]))

    return reds.map((r: any) => {
      const raw = String(r.itemId)
      let item: any = null
      if (raw.startsWith('clinic:')) item = clinicMap.get(raw.split(':')[1]) || null
      else if (raw.startsWith('parent:')) item = parentMap.get(raw.split(':')[1]) || null
      else item = legacyMap.get(raw) || null

      return {
        redemptionId: r.id,
        patientId: r.patientId,
        itemId: r.itemId,
        status: r.status,
        requestedAt: r.requestedAt,
        approvedAt: r.approvedAt,
        fulfilledAt: r.fulfilledAt,
        approvedByUserId: r.approvedByUserId,
        note: r.note,
        item,
      }
    })
  }

  /**
   * Legacy purchase (store_items)
   */
  static async purchase(patientId: string, itemId: string): Promise<PurchaseResult> {
    // Basic validation: patient must exist
    const patient = await db.select().from(users).where(eq(users.id, patientId))
    if (patient.length === 0) {
      throw new Error('Paciente não encontrado')
    }

    const items = await db.select().from(store_items).where(eq(store_items.id, itemId))
    if (items.length === 0 || !items[0].isActive) {
      throw new Error('Item não encontrado ou inativo')
    }

    const item = items[0]
    const price = item.priceCoins || 0
    if (price < 0) throw new Error('Preço inválido')

    // Prevent duplicate purchase (one-time items)
    if (await this.hasAlreadyPurchased(patientId, itemId)) {
      throw this.makeHttpError('Este item já foi comprado e não pode ser comprado novamente', 400)
    }

    // Limits / cooldowns (per clinic config)
    const storeConfig = await this.getStoreConfigForPatient(patientId)
    const dailySpendLimitCoins: number | undefined = storeConfig.dailySpendLimitCoins
    const cooldownHoursByItemId: Record<string, number> = storeConfig.cooldownHoursByItemId || {}
    const cooldownHours = cooldownHoursByItemId[itemId] || 0

    if (dailySpendLimitCoins !== undefined && Number.isFinite(dailySpendLimitCoins)) {
      const spentToday = await this.getSpentTodayCoins(patientId)
      if (spentToday + price > dailySpendLimitCoins) {
        throw new Error('Limite diário de gasto atingido')
      }
    }

    await this.checkCooldown(patientId, itemId, cooldownHours)

    // Ensure points row exists
    const pointsRows = await db.select().from(patient_points).where(eq(patient_points.patientId, patientId))
    if (pointsRows.length === 0) {
      await db.insert(patient_points).values({
        id: `points-${Date.now()}`,
        patientId,
        coins: 0,
        xp: 0,
        level: 1,
        totalPoints: 0,
        currentLevel: 1,
        updatedAt: new Date(),
      })
    }

    // Debit coins atomically (best-effort): only update if coins >= price
    const updatedPoints = await db
      .update(patient_points)
      .set({
        coins: sql`${patient_points.coins} - ${price}`,
        totalPoints: sql`${patient_points.coins} - ${price}`, // legacy mirror
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(patient_points.patientId, patientId), gte(patient_points.coins, price)))
      .returning()

    if (updatedPoints.length === 0) {
      throw new Error('Saldo insuficiente')
    }

    const points = updatedPoints[0]

    // Record transaction
    await db.insert(point_transactions).values({
      id: nanoid(),
      patientId,
      kind: 'spend' satisfies TransactionKind,
      source: 'purchase' satisfies TransactionSource,
      amountCoins: -price,
      balanceAfterCoins: points.coins || 0,
      metadata: { itemId },
      createdAt: new Date(),
    })

    if ((item.type as StoreItemType) === 'digital') {
      // Upsert-ish inventory: increment quantity if exists
      const existingInv = await db
        .select()
        .from(patient_inventory)
        .where(and(eq(patient_inventory.patientId, patientId), eq(patient_inventory.itemId, itemId)))

      let inventoryItem
      if (existingInv.length === 0) {
        const inserted = await db
          .insert(patient_inventory)
          .values({
            id: nanoid(),
            patientId,
            itemId,
            quantity: 1,
            isActive: false,
            acquiredAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()
        inventoryItem = inserted[0]
      } else {
        const updatedInv = await db
          .update(patient_inventory)
          .set({
            quantity: (existingInv[0].quantity || 0) + 1,
            updatedAt: new Date(),
          })
          .where(eq(patient_inventory.id, existingInv[0].id))
          .returning()
        inventoryItem = updatedInv[0]
      }

      return { points, item, inventoryItem }
    }

    // Real reward: create redemption request
    const redemption = await db
      .insert(reward_redemptions)
      .values({
        id: nanoid(),
        patientId,
        itemId,
        status: 'requested' satisfies RedemptionStatus,
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return { points, item, redemption: redemption[0] }
  }

  /**
   * Purchase via resolved catalog (clinic_store_items / parent_store_items)
   */
  static async purchaseCatalogItem(patientId: string, kind: 'clinic' | 'parent' | 'story_option', catalogItemId: string): Promise<PurchaseResult> {
    const catalog = await RewardCatalogService.resolveCatalog(patientId)
    const allowed = catalog.items.find((i) => i.kind === kind && i.catalogItemId === catalogItemId)
    if (!allowed) throw new Error('Item não permitido para este paciente')

    const syntheticItemId = `${kind}:${catalogItemId}`
    if (await this.hasAlreadyPurchased(patientId, syntheticItemId)) {
      throw this.makeHttpError('Este item já foi comprado e não pode ser comprado novamente', 400)
    }

    // Resolve concrete item record (for metadata persistence)
    let item: any
    if (kind === 'clinic') {
      const rows = await db.select().from(clinic_store_items).where(eq(clinic_store_items.id, catalogItemId))
      if (rows.length === 0) throw new Error('Item não encontrado')
      item = rows[0]
    } else if (kind === 'parent') {
      const rows = await db.select().from(parent_store_items).where(eq(parent_store_items.id, catalogItemId))
      if (rows.length === 0) throw new Error('Item não encontrado')
      item = rows[0]
    } else {
      // story_option: the allowed entry already has enough info; inventory resolver will attach template later
      item = { ...allowed }
    }

    const price = Number(allowed.priceCoins || 0)

    // Ensure points row exists
    const pointsRows = await db.select().from(patient_points).where(eq(patient_points.patientId, patientId))
    if (pointsRows.length === 0) {
      await db.insert(patient_points).values({
        id: `points-${Date.now()}`,
        patientId,
        coins: 0,
        xp: 0,
        level: 1,
        totalPoints: 0,
        currentLevel: 1,
        updatedAt: new Date(),
      })
    }

    // Debit coins
    const updatedPoints = await db
      .update(patient_points)
      .set({
        coins: sql`${patient_points.coins} - ${price}`,
        totalPoints: sql`${patient_points.coins} - ${price}`,
        lastActivityAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(patient_points.patientId, patientId), gte(patient_points.coins, price)))
      .returning()

    if (updatedPoints.length === 0) throw new Error('Saldo insuficiente')
    const points = updatedPoints[0]

    await db.insert(point_transactions).values({
      id: nanoid(),
      patientId,
      kind: 'spend' satisfies TransactionKind,
      source: 'purchase' satisfies TransactionSource,
      amountCoins: -price,
      balanceAfterCoins: points.coins || 0,
      metadata: { kind, catalogItemId },
      createdAt: new Date(),
    })

    // Digital vs Real: for now, treat parent items as real vouchers; clinic items follow type
    const resolvedType = kind === 'story_option' ? 'digital' : kind === 'parent' ? 'real' : String(item.type || 'real')
    if (resolvedType === 'digital') {
      // Keep legacy inventory table for now, store as synthetic item_id
      const existingInv = await db
        .select()
        .from(patient_inventory)
        .where(and(eq(patient_inventory.patientId, patientId), eq(patient_inventory.itemId, syntheticItemId)))

      let inventoryItem
      if (existingInv.length === 0) {
        const inserted = await db
          .insert(patient_inventory)
          .values({
            id: nanoid(),
            patientId,
            itemId: syntheticItemId,
            quantity: 1,
            isActive: false,
            acquiredAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()
        inventoryItem = inserted[0]
      } else {
        const updatedInv = await db
          .update(patient_inventory)
          .set({ quantity: (existingInv[0].quantity || 0) + 1, updatedAt: new Date() })
          .where(eq(patient_inventory.id, existingInv[0].id))
          .returning()
        inventoryItem = updatedInv[0]
      }
      return { points, item: { ...allowed }, inventoryItem }
    }

    // Real reward redemption: reuse reward_redemptions with synthetic item id
    const redemption = await db
      .insert(reward_redemptions)
      .values({
        id: nanoid(),
        patientId,
        itemId: `${kind}:${catalogItemId}`,
        status: 'requested' satisfies RedemptionStatus,
        requestedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return { points, item: { ...allowed }, redemption: redemption[0] }
  }

  static async approveRedemption(redemptionId: string, approvedByUserId: string, pin: string, note?: string) {
    const rows = await db.select().from(reward_redemptions).where(eq(reward_redemptions.id, redemptionId))
    if (rows.length === 0) throw new Error('Resgate não encontrado')
    const r = rows[0]
    if (r.status !== 'requested') throw new Error('Resgate não está pendente')

    const storeConfig = await this.getStoreConfigForPatient(r.patientId)
    const requirePinForApproval: boolean = storeConfig.requirePinForApproval ?? true
    if (approvedByUserId !== r.patientId) {
      throw new Error('Apenas o responsável do paciente pode aprovar')
    }
    if (requirePinForApproval) {
      await this.validateResponsiblePinOrThrow(approvedByUserId, pin)
    }

    const updated = await db
      .update(reward_redemptions)
      .set({
        status: 'approved',
        approvedAt: new Date(),
        approvedByUserId,
        note: note ?? r.note,
        updatedAt: new Date(),
      })
      .where(eq(reward_redemptions.id, redemptionId))
      .returning()
    return updated[0]
  }

  static async rejectRedemption(redemptionId: string, approvedByUserId: string, pin: string, note?: string) {
    const rows = await db.select().from(reward_redemptions).where(eq(reward_redemptions.id, redemptionId))
    if (rows.length === 0) throw new Error('Resgate não encontrado')
    const r = rows[0]
    if (r.status !== 'requested') throw new Error('Resgate não está pendente')

    const storeConfig = await this.getStoreConfigForPatient(r.patientId)
    const requirePinForApproval: boolean = storeConfig.requirePinForApproval ?? true
    if (approvedByUserId !== r.patientId) {
      throw new Error('Apenas o responsável do paciente pode rejeitar')
    }
    if (requirePinForApproval) {
      await this.validateResponsiblePinOrThrow(approvedByUserId, pin)
    }

    const updated = await db
      .update(reward_redemptions)
      .set({
        status: 'rejected',
        approvedAt: new Date(),
        approvedByUserId,
        note: note ?? r.note,
        updatedAt: new Date(),
      })
      .where(eq(reward_redemptions.id, redemptionId))
      .returning()
    return updated[0]
  }

  static async fulfillRedemption(redemptionId: string, fulfilledByUserId: string, pin: string, note?: string) {
    const rows = await db.select().from(reward_redemptions).where(eq(reward_redemptions.id, redemptionId))
    if (rows.length === 0) throw new Error('Resgate não encontrado')
    const r = rows[0]
    if (r.status !== 'approved') throw new Error('Resgate precisa estar aprovado')

    const storeConfig = await this.getStoreConfigForPatient(r.patientId)
    const requirePinForApproval: boolean = storeConfig.requirePinForApproval ?? true
    if (fulfilledByUserId !== r.patientId) {
      throw new Error('Apenas o responsável do paciente pode finalizar')
    }
    if (requirePinForApproval) {
      await this.validateResponsiblePinOrThrow(fulfilledByUserId, pin)
    }

    const updated = await db
      .update(reward_redemptions)
      .set({
        status: 'fulfilled',
        fulfilledAt: new Date(),
        note: note ?? r.note,
        updatedAt: new Date(),
      })
      .where(eq(reward_redemptions.id, redemptionId))
      .returning()
    return updated[0]
  }
}


