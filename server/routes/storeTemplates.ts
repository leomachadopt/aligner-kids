/**
 * Store Item Templates Routes (Super-admin)
 */

import { Router } from 'express'
import { db, store_item_templates } from '../db'
import { eq } from 'drizzle-orm'

const router = Router()

// List templates
router.get('/store/templates', async (_req, res) => {
  try {
    const templates = await db.select().from(store_item_templates)
    res.json({ templates })
  } catch (error) {
    console.error('Error fetching store templates:', error)
    res.status(500).json({ error: 'Failed to fetch store templates' })
  }
})

// Create template
router.post('/store/templates', async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      category,
      defaultPriceCoins,
      defaultRequiredLevel = 1,
      defaultImageUrl,
      metadata = {},
      isActive = true,
    } = req.body || {}

    if (!name || !description || !type || !category || defaultPriceCoins === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' })
    }
    if (String(category) === 'avatar') {
      return res.status(400).json({ error: 'Categoria avatar foi descontinuada. Use a foto do paciente (perfil).' })
    }

    const created = await db
      .insert(store_item_templates)
      .values({
        id: `tpl-${Date.now()}`,
        name,
        description,
        type,
        category,
        defaultPriceCoins: Number(defaultPriceCoins),
        defaultRequiredLevel: Number(defaultRequiredLevel) || 1,
        defaultImageUrl: defaultImageUrl || null,
        metadata,
        isActive: !!isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    res.json({ template: created[0] })
  } catch (error) {
    console.error('Error creating store template:', error)
    res.status(500).json({ error: 'Failed to create store template' })
  }
})

// Update template
router.put('/store/templates/:id', async (req, res) => {
  try {
    const {
      name,
      description,
      type,
      category,
      defaultPriceCoins,
      defaultRequiredLevel,
      defaultImageUrl,
      metadata,
      isActive,
    } = req.body || {}

    const patch: any = {
      updatedAt: new Date(),
    }
    if (name !== undefined) patch.name = name
    if (description !== undefined) patch.description = description
    if (type !== undefined) patch.type = type
    if (category !== undefined) {
      if (String(category) === 'avatar') {
        return res.status(400).json({ error: 'Categoria avatar foi descontinuada. Use a foto do paciente (perfil).' })
      }
      patch.category = category
    }
    if (defaultPriceCoins !== undefined) patch.defaultPriceCoins = Number(defaultPriceCoins)
    if (defaultRequiredLevel !== undefined) patch.defaultRequiredLevel = Number(defaultRequiredLevel) || 1
    if (defaultImageUrl !== undefined) patch.defaultImageUrl = defaultImageUrl || null
    if (metadata !== undefined) patch.metadata = metadata || {}
    if (isActive !== undefined) patch.isActive = !!isActive

    const updated = await db
      .update(store_item_templates)
      .set(patch)
      .where(eq(store_item_templates.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Template not found' })
    }

    res.json({ template: updated[0] })
  } catch (error) {
    console.error('Error updating store template:', error)
    res.status(500).json({ error: 'Failed to update store template' })
  }
})

// Soft delete (set inactive)
router.delete('/store/templates/:id', async (req, res) => {
  try {
    const updated = await db
      .update(store_item_templates)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(store_item_templates.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Template not found' })
    }
    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting store template:', error)
    res.status(500).json({ error: 'Failed to delete store template' })
  }
})

export default router


