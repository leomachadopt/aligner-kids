import { Router } from 'express'
import { db, story_option_templates, users } from '../db'
import { eq } from 'drizzle-orm'

const router = Router()

function requireSuperAdmin(userId: string) {
  return db.select().from(users).where(eq(users.id, userId))
}

// GET /api/admin/story-option-templates
router.get('/admin/story-option-templates', async (_req, res) => {
  try {
    const templates = await db.select().from(story_option_templates)
    res.json({ templates })
  } catch (e: any) {
    console.error('Error fetching story option templates:', e)
    res.status(500).json({ error: 'Failed to fetch story option templates' })
  }
})

// POST /api/admin/story-option-templates
router.post('/admin/story-option-templates', async (req, res) => {
  try {
    const {
      createdByUserId,
      id,
      type,
      name,
      description,
      icon = '✨',
      color = 'bg-purple-500',
      imageUrl,
      isDefault = false,
      isActive = true,
      sortOrder = 0,
      metadata = {},
    } = req.body || {}

    if (!createdByUserId) return res.status(400).json({ error: 'createdByUserId é obrigatório' })
    const u = await requireSuperAdmin(createdByUserId)
    if (u.length === 0 || u[0].role !== 'super-admin') return res.status(403).json({ error: 'Sem permissão' })

    if (!id || !type || !name) return res.status(400).json({ error: 'id, type e name são obrigatórios' })

    const created = await db
      .insert(story_option_templates)
      .values({
        id,
        type,
        name,
        description: description || null,
        icon,
        color,
        imageUrl: imageUrl || null,
        isDefault: !!isDefault,
        isActive: !!isActive,
        sortOrder: Number(sortOrder) || 0,
        metadata,
        createdByUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)
      .returning()

    res.json({ template: created[0] })
  } catch (e: any) {
    console.error('Error creating story option template:', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
})

// PUT /api/admin/story-option-templates/:id
router.put('/admin/story-option-templates/:id', async (req, res) => {
  try {
    const { createdByUserId, ...rest } = req.body || {}
    if (!createdByUserId) return res.status(400).json({ error: 'createdByUserId é obrigatório' })
    const u = await requireSuperAdmin(createdByUserId)
    if (u.length === 0 || u[0].role !== 'super-admin') return res.status(403).json({ error: 'Sem permissão' })

    const updated = await db
      .update(story_option_templates)
      .set({ ...rest, updatedAt: new Date() } as any)
      .where(eq(story_option_templates.id, req.params.id))
      .returning()

    if (updated.length === 0) return res.status(404).json({ error: 'Template não encontrado' })
    res.json({ template: updated[0] })
  } catch (e: any) {
    console.error('Error updating story option template:', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
})

// DELETE (soft) /api/admin/story-option-templates/:id
router.delete('/admin/story-option-templates/:id', async (req, res) => {
  try {
    const createdByUserId = String(req.query.createdByUserId || '')
    if (!createdByUserId) return res.status(400).json({ error: 'createdByUserId é obrigatório' })
    const u = await requireSuperAdmin(createdByUserId)
    if (u.length === 0 || u[0].role !== 'super-admin') return res.status(403).json({ error: 'Sem permissão' })

    const updated = await db
      .update(story_option_templates)
      .set({ isActive: false, updatedAt: new Date() } as any)
      .where(eq(story_option_templates.id, req.params.id))
      .returning()

    if (updated.length === 0) return res.status(404).json({ error: 'Template não encontrado' })
    res.json({ success: true })
  } catch (e: any) {
    console.error('Error deleting story option template:', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
})

export default router


