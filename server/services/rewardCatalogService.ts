/**
 * Reward Catalog Service
 * Resolves the effective store catalog for a patient based on:
 * - Active reward program (clinic)
 * - Parent custom items (optional, per patient)
 */

import {
  db,
  users,
  patient_reward_programs,
  reward_program_items,
  clinic_store_items,
  parent_store_items,
  patient_inventory,
  reward_redemptions,
  story_option_templates,
  clinic_story_options,
} from '../db'
import { and, desc, eq, inArray } from 'drizzle-orm'

export type CatalogItemKind = 'clinic' | 'parent' | 'story_option'

export interface CatalogItem {
  kind: CatalogItemKind
  catalogItemId: string
  name: string
  description: string
  type: string
  category: string
  priceCoins: number
  requiredLevel: number
  imageUrl?: string | null
  metadata?: any
  isOwned?: boolean
}

export class RewardCatalogService {
  static async getActiveProgramId(patientId: string): Promise<string | null> {
    const rows = await db
      .select()
      .from(patient_reward_programs)
      .where(and(eq(patient_reward_programs.patientId, patientId), eq(patient_reward_programs.isActive, true)))
      .orderBy(desc(patient_reward_programs.assignedAt))
      .limit(1)
    return rows[0]?.programId || null
  }

  static async resolveCatalog(patientId: string): Promise<{ clinicId: string | null; items: CatalogItem[] }> {
    const u = await db.select().from(users).where(eq(users.id, patientId))
    if (u.length === 0) throw new Error('Paciente não encontrado')
    const clinicId = u[0].clinicId || null

    const items: CatalogItem[] = []

    // Program items
    const programId = await this.getActiveProgramId(patientId)
    if (programId) {
      const programItems = await db
        .select()
        .from(reward_program_items)
        .where(and(eq(reward_program_items.programId, programId), eq(reward_program_items.isActive, true)))
        .orderBy(reward_program_items.sortOrder)

      if (programItems.length > 0) {
        // fetch clinic items and keep order
        const clinicItems = await db
          .select()
          .from(clinic_store_items)
          .where(inArray(clinic_store_items.id, programItems.map((pi) => pi.clinicStoreItemId)))

        const clinicMap = new Map(clinicItems.map((ci: any) => [ci.id, ci]))
        for (const pi of programItems) {
          const ci = clinicMap.get(pi.clinicStoreItemId)
          if (!ci) continue
          if (clinicId && ci.clinicId !== clinicId) continue
          if (!ci.isActive) continue
          if (String(ci.category) === 'avatar') continue
          items.push({
            kind: 'clinic',
            catalogItemId: ci.id,
            name: ci.name,
            description: ci.description,
            type: ci.type,
            category: ci.category,
            priceCoins: ci.priceCoins,
            requiredLevel: ci.requiredLevel || 1,
            imageUrl: ci.imageUrl || null,
            metadata: ci.metadata || {},
          })
        }
      }
    }

    // Parent custom items (always allowed; scope by patient)
    const parentItems = await db
      .select()
      .from(parent_store_items)
      .where(and(eq(parent_store_items.patientId, patientId), eq(parent_store_items.isActive, true)))
      .orderBy(desc(parent_store_items.createdAt))

    for (const pi of parentItems as any[]) {
      items.push({
        kind: 'parent',
        catalogItemId: pi.id,
        name: pi.name,
        description: pi.description,
        type: pi.type,
        category: pi.category,
        priceCoins: pi.priceCoins,
        requiredLevel: pi.requiredLevel || 1,
        imageUrl: null,
        metadata: pi.metadata || {},
      })
    }

    // Story unlock options (auto-loaded from global story templates; non-default only)
    if (clinicId) {
      const templates = await db
        .select()
        .from(story_option_templates)
        .where(and(eq(story_option_templates.isActive, true), eq(story_option_templates.isDefault, false)))
        .orderBy(story_option_templates.type, story_option_templates.sortOrder, story_option_templates.name)

      const overrides = await db
        .select()
        .from(clinic_story_options)
        .where(eq(clinic_story_options.clinicId, clinicId))
      const overrideMap = new Map<string, any>()
      for (const o of overrides as any[]) overrideMap.set(String(o.templateId), o)

      const priceByType: Record<string, number> = {
        environment: 140,
        character: 120,
        theme: 100,
      }

      for (const t of templates as any[]) {
        const o = overrideMap.get(String(t.id)) || null
        const overrideActive = o?.isActive
        if (overrideActive === false) continue

        const type = String(t.type)
        const name = String(o?.name ?? t.name)
        const description = String(o?.description ?? t.description ?? '')
        const imageUrl = (o?.imageUrl ?? t.imageUrl ?? null) as any

        const storePriceCoins =
          (o?.metadata?.storePriceCoins ?? t.metadata?.storePriceCoins ?? priceByType[type] ?? 120) as number
        const storeRequiredLevel =
          (o?.metadata?.storeRequiredLevel ?? t.metadata?.storeRequiredLevel ?? 2) as number

        const meta: any = { unlock: 'story_options' }
        if (type === 'environment') meta.addEnvironments = [String(t.id)]
        else if (type === 'theme') meta.addThemes = [String(t.id)]
        else if (type === 'character') meta.addCharacters = [String(t.id)]

        items.push({
          kind: 'story_option',
          catalogItemId: String(t.id),
          name: type === 'environment' ? `Ambiente: ${name}` : type === 'theme' ? `Tema: ${name}` : `Personagem: ${name}`,
          description,
          type: 'digital',
          category: 'story_unlock',
          priceCoins: Number(storePriceCoins) || 0,
          requiredLevel: Number(storeRequiredLevel) || 1,
          imageUrl,
          metadata: meta,
        })
      }
    }

    // Mark owned items (one-time purchase)
    const [inv, reds] = await Promise.all([
      db.select({ itemId: patient_inventory.itemId }).from(patient_inventory).where(eq(patient_inventory.patientId, patientId)),
      db.select({ itemId: reward_redemptions.itemId }).from(reward_redemptions).where(eq(reward_redemptions.patientId, patientId)),
    ])
    const owned = new Set<string>([
      ...inv.map((r: any) => String(r.itemId)),
      ...reds.map((r: any) => String(r.itemId)),
    ])

    const enriched = items.map((it) => {
      const synthetic = `${it.kind}:${it.catalogItemId}`
      return { ...it, isOwned: owned.has(synthetic) }
    })

    return { clinicId, items: enriched }
  }
}


