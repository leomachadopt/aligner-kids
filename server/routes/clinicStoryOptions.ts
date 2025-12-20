import { Router } from 'express'
import { db, clinic_story_options, story_option_templates, users } from '../db'
import { asc, eq } from 'drizzle-orm'

const router = Router()

async function requireOrthodontistForClinic(userId: string, clinicId: string) {
  const u = await db.select().from(users).where(eq(users.id, userId))
  if (u.length === 0) return { ok: false, error: 'Usuário não encontrado' }
  if (u[0].role !== 'orthodontist' && u[0].role !== 'super-admin') return { ok: false, error: 'Sem permissão' }
  if (u[0].role !== 'super-admin' && u[0].clinicId !== clinicId) return { ok: false, error: 'Sem permissão' }
  return { ok: true }
}

// GET /api/clinic/:clinicId/story-options
router.get('/clinic/:clinicId/story-options', async (req, res) => {
  try {
    const clinicId = String(req.params.clinicId || '')
    const userId = String(req.query.userId || '')
    if (!clinicId || !userId) return res.status(400).json({ error: 'clinicId e userId são obrigatórios' })

    const auth = await requireOrthodontistForClinic(userId, clinicId)
    if (!auth.ok) return res.status(403).json({ error: auth.error })

    const templates = await db
      .select()
      .from(story_option_templates)
      .where(eq(story_option_templates.isActive, true))
      .orderBy(asc(story_option_templates.type), asc(story_option_templates.sortOrder), asc(story_option_templates.name))

    const overrides = await db.select().from(clinic_story_options).where(eq(clinic_story_options.clinicId, clinicId))
    const overrideMap = new Map<string, any>()
    for (const o of overrides as any[]) overrideMap.set(String(o.templateId), o)

    const items = templates.map((t: any) => {
      const o = overrideMap.get(String(t.id)) || null
      return {
        template: t,
        override: o,
        effective: {
          id: String(t.id),
          type: String(t.type),
          name: o?.name ?? t.name,
          description: o?.description ?? t.description,
          icon: o?.icon ?? t.icon,
          color: o?.color ?? t.color,
          imageUrl: o?.imageUrl ?? t.imageUrl,
          isDefault: !!t.isDefault,
          isActive: o?.isActive === false ? false : true,
          sortOrder: o?.sortOrder ?? t.sortOrder,
        },
      }
    })

    res.json({ items })
  } catch (e: any) {
    console.error('Error fetching clinic story options:', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
})

// PUT /api/clinic/:clinicId/story-options/:templateId (upsert override)
router.put('/clinic/:clinicId/story-options/:templateId', async (req, res) => {
  try {
    const clinicId = String(req.params.clinicId || '')
    const templateId = String(req.params.templateId || '')
    const { createdByUserId, name, description, icon, color, imageUrl, isActive, sortOrder, metadata } = req.body || {}

    if (!clinicId || !templateId) return res.status(400).json({ error: 'clinicId e templateId são obrigatórios' })
    if (!createdByUserId) return res.status(400).json({ error: 'createdByUserId é obrigatório' })

    const auth = await requireOrthodontistForClinic(String(createdByUserId), clinicId)
    if (!auth.ok) return res.status(403).json({ error: auth.error })

    const existing = await db
      .select()
      .from(clinic_story_options)
      .where(eq(clinic_story_options.id, `${clinicId}:${templateId}`))

    if (existing.length === 0) {
      const created = await db
        .insert(clinic_story_options)
        .values({
          id: `${clinicId}:${templateId}`,
          clinicId,
          templateId,
          createdByUserId,
          name: name ?? null,
          description: description ?? null,
          icon: icon ?? null,
          color: color ?? null,
          imageUrl: imageUrl ?? null,
          isActive: typeof isActive === 'boolean' ? isActive : null,
          sortOrder: typeof sortOrder === 'number' ? sortOrder : sortOrder != null ? Number(sortOrder) : null,
          metadata: metadata ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any)
        .returning()
      return res.json({ override: created[0] })
    }

    const updated = await db
      .update(clinic_story_options)
      .set({
        name: name ?? existing[0].name,
        description: description ?? existing[0].description,
        icon: icon ?? existing[0].icon,
        color: color ?? existing[0].color,
        imageUrl: imageUrl ?? existing[0].imageUrl,
        isActive: typeof isActive === 'boolean' ? isActive : existing[0].isActive,
        sortOrder: sortOrder != null ? Number(sortOrder) : existing[0].sortOrder,
        metadata: metadata ?? existing[0].metadata,
        updatedAt: new Date(),
      } as any)
      .where(eq(clinic_story_options.id, `${clinicId}:${templateId}`))
      .returning()

    res.json({ override: updated[0] })
  } catch (e: any) {
    console.error('Error upserting clinic story option override:', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
})

export default router



