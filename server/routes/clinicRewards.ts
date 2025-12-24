/**
 * Clinic Rewards & Programs Routes (Orthodontist)
 * - Import global templates into clinic catalog
 * - Manage clinic items
 * - Manage reward programs by age range
 */

import { Router } from 'express'
import { db, clinic_store_items, reward_programs, reward_program_items, store_item_templates, users } from '../db'
import { and, eq, desc } from 'drizzle-orm'

const router = Router()

// ----------------------------
// Clinic Store Items
// ----------------------------

router.get('/clinic/:clinicId/store/items', async (req, res) => {
  try {
    const { clinicId } = req.params
    const items = await db
      .select()
      .from(clinic_store_items)
      .where(eq(clinic_store_items.clinicId, clinicId))
      .orderBy(desc(clinic_store_items.createdAt))
    res.json({ items })
  } catch (error) {
    console.error('Error fetching clinic store items:', error)
    res.status(500).json({ error: 'Failed to fetch clinic store items' })
  }
})

router.post('/clinic/:clinicId/store/items/from-template', async (req, res) => {
  try {
    const { clinicId } = req.params
    const { templateId, createdByUserId, overrides = {} } = req.body || {}
    if (!templateId || !createdByUserId) {
      return res.status(400).json({ error: 'templateId e createdByUserId são obrigatórios' })
    }

    // Ensure user belongs to clinic (best-effort)
    const u = await db.select().from(users).where(eq(users.id, createdByUserId))
    if (u.length === 0 || u[0].clinicId !== clinicId) {
      return res.status(403).json({ error: 'Usuário não pertence à clínica' })
    }

    const tpl = await db.select().from(store_item_templates).where(eq(store_item_templates.id, templateId))
    if (tpl.length === 0 || !tpl[0].isActive) {
      return res.status(404).json({ error: 'Template não encontrado ou inativo' })
    }

    const t = tpl[0]
    const created = await db
      .insert(clinic_store_items)
      .values({
        id: `citem-${Date.now()}`,
        clinicId,
        sourceType: 'global_template',
        sourceTemplateId: templateId,
        createdByUserId,
        name: overrides.name ?? t.name,
        description: overrides.description ?? t.description,
        type: overrides.type ?? t.type,
        category: overrides.category ?? t.category,
        priceCoins: Number(overrides.priceCoins ?? t.defaultPriceCoins),
        requiredLevel: Number(overrides.requiredLevel ?? t.defaultRequiredLevel ?? 1),
        imageUrl: overrides.imageUrl ?? t.defaultImageUrl ?? null,
        metadata: overrides.metadata ?? t.metadata ?? {},
        isActive: overrides.isActive ?? true,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    res.json({ item: created[0] })
  } catch (error) {
    console.error('Error importing template to clinic:', error)
    res.status(500).json({ error: 'Failed to import template to clinic' })
  }
})

router.post('/clinic/:clinicId/store/items', async (req, res) => {
  try {
    const { clinicId } = req.params
    const { createdByUserId, name, description, type, category, priceCoins, requiredLevel = 1, imageUrl, metadata = {}, isActive = true } = req.body || {}
    if (!createdByUserId || !name || !description || !type || !category || priceCoins === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' })
    }

    const u = await db.select().from(users).where(eq(users.id, createdByUserId))
    if (u.length === 0 || u[0].clinicId !== clinicId) {
      return res.status(403).json({ error: 'Usuário não pertence à clínica' })
    }

    const created = await db
      .insert(clinic_store_items)
      .values({
        id: `citem-${Date.now()}`,
        clinicId,
        sourceType: 'clinic_custom',
        sourceTemplateId: null,
        createdByUserId,
        name,
        description,
        type,
        category,
        priceCoins: Number(priceCoins),
        requiredLevel: Number(requiredLevel) || 1,
        imageUrl: imageUrl || null,
        metadata,
        isActive: !!isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    res.json({ item: created[0] })
  } catch (error) {
    console.error('Error creating clinic store item:', error)
    res.status(500).json({ error: 'Failed to create clinic store item' })
  }
})

router.put('/clinic/:clinicId/store/items/:id', async (req, res) => {
  try {
    const { clinicId, id } = req.params
    const updated = await db
      .update(clinic_store_items)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(clinic_store_items.id, id), eq(clinic_store_items.clinicId, clinicId)))
      .returning()

    if (updated.length === 0) return res.status(404).json({ error: 'Item não encontrado' })
    res.json({ item: updated[0] })
  } catch (error) {
    console.error('Error updating clinic store item:', error)
    res.status(500).json({ error: 'Failed to update clinic store item' })
  }
})

// ----------------------------
// Reward Programs
// ----------------------------

router.get('/clinic/:clinicId/reward-programs', async (req, res) => {
  try {
    const { clinicId } = req.params
    const programs = await db
      .select()
      .from(reward_programs)
      .where(eq(reward_programs.clinicId, clinicId))
      .orderBy(desc(reward_programs.createdAt))
    res.json({ programs })
  } catch (error) {
    console.error('Error fetching reward programs:', error)
    res.status(500).json({ error: 'Failed to fetch reward programs' })
  }
})

router.post('/clinic/:clinicId/reward-programs', async (req, res) => {
  try {
    const { clinicId } = req.params
    const { createdByUserId, name, description, ageMin, ageMax, isDefault = false, isActive = true } = req.body || {}
    if (!createdByUserId || !name) return res.status(400).json({ error: 'createdByUserId e name são obrigatórios' })

    const u = await db.select().from(users).where(eq(users.id, createdByUserId))
    if (u.length === 0 || u[0].clinicId !== clinicId) {
      return res.status(403).json({ error: 'Usuário não pertence à clínica' })
    }

    const created = await db
      .insert(reward_programs)
      .values({
        id: `rprog-${Date.now()}`,
        clinicId,
        name,
        description: description || null,
        ageMin: ageMin === undefined || ageMin === null ? null : Number(ageMin),
        ageMax: ageMax === undefined || ageMax === null ? null : Number(ageMax),
        createdByUserId,
        isActive: !!isActive,
        isDefault: !!isDefault,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
    res.json({ program: created[0] })
  } catch (error) {
    console.error('Error creating reward program:', error)
    res.status(500).json({ error: 'Failed to create reward program' })
  }
})

router.put('/clinic/:clinicId/reward-programs/:id', async (req, res) => {
  try {
    const { clinicId, id } = req.params
    const updated = await db
      .update(reward_programs)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(reward_programs.id, id), eq(reward_programs.clinicId, clinicId)))
      .returning()

    if (updated.length === 0) return res.status(404).json({ error: 'Programa não encontrado' })
    res.json({ program: updated[0] })
  } catch (error) {
    console.error('Error updating reward program:', error)
    res.status(500).json({ error: 'Failed to update reward program' })
  }
})

router.get('/clinic/:clinicId/reward-programs/:id/items', async (req, res) => {
  try {
    const { clinicId, id } = req.params
    // validate program belongs to clinic
    const prog = await db.select().from(reward_programs).where(and(eq(reward_programs.id, id), eq(reward_programs.clinicId, clinicId)))
    if (prog.length === 0) return res.status(404).json({ error: 'Programa não encontrado' })

    const items = await db
      .select()
      .from(reward_program_items)
      .where(eq(reward_program_items.programId, id))
      .orderBy(reward_program_items.sortOrder)
    res.json({ items })
  } catch (error) {
    console.error('Error fetching program items:', error)
    res.status(500).json({ error: 'Failed to fetch program items' })
  }
})

router.post('/clinic/:clinicId/reward-programs/:id/items', async (req, res) => {
  try {
    const { clinicId, id } = req.params
    const { clinicStoreItemId, sortOrder = 0, isActive = true } = req.body || {}
    if (!clinicStoreItemId) return res.status(400).json({ error: 'clinicStoreItemId é obrigatório' })

    const prog = await db.select().from(reward_programs).where(and(eq(reward_programs.id, id), eq(reward_programs.clinicId, clinicId)))
    if (prog.length === 0) return res.status(404).json({ error: 'Programa não encontrado' })

    const created = await db
      .insert(reward_program_items)
      .values({
        id: `rpi-${Date.now()}`,
        programId: id,
        clinicStoreItemId,
        sortOrder: Number(sortOrder) || 0,
        isActive: !!isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()
    res.json({ item: created[0] })
  } catch (error) {
    console.error('Error adding program item:', error)
    res.status(500).json({ error: 'Failed to add program item' })
  }
})

router.delete('/clinic/:clinicId/reward-programs/:id/items/:programItemId', async (req, res) => {
  try {
    const { clinicId, id, programItemId } = req.params
    const prog = await db.select().from(reward_programs).where(and(eq(reward_programs.id, id), eq(reward_programs.clinicId, clinicId)))
    if (prog.length === 0) return res.status(404).json({ error: 'Programa não encontrado' })

    await db.delete(reward_program_items).where(and(eq(reward_program_items.id, programItemId), eq(reward_program_items.programId, id)))
    res.json({ success: true })
  } catch (error) {
    console.error('Error removing program item:', error)
    res.status(500).json({ error: 'Failed to remove program item' })
  }
})

export default router





