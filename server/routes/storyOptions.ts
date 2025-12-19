import { Router } from 'express'
import { db, story_option_templates, clinic_story_options, users } from '../db'
import { asc, eq } from 'drizzle-orm'
import { StoreService } from '../services/storeService'

const router = Router()

// GET /api/story/options?patientId=...
// Returns DB-driven story options + lock state based on entitlements.
router.get('/story/options', async (req, res) => {
  try {
    const patientId = String(req.query.patientId || '')
    if (!patientId) return res.status(400).json({ error: 'patientId é obrigatório' })

    const patient = await db.select().from(users).where(eq(users.id, patientId))
    if (patient.length === 0) return res.status(404).json({ error: 'Paciente não encontrado' })
    const clinicId = patient[0].clinicId || null

    const ent = await StoreService.getEntitlements(patientId)
    const unlockedEnv = new Set<string>(ent?.storyOptions?.addEnvironments || [])
    const unlockedThemes = new Set<string>(ent?.storyOptions?.addThemes || [])
    const unlockedChars = new Set<string>(ent?.storyOptions?.addCharacters || [])

    const templates = await db
      .select()
      .from(story_option_templates)
      .where(eq(story_option_templates.isActive, true))
      .orderBy(asc(story_option_templates.type), asc(story_option_templates.sortOrder), asc(story_option_templates.name))

    const overrides = clinicId
      ? await db
          .select()
          .from(clinic_story_options)
          .where(eq(clinic_story_options.clinicId, clinicId))
      : []
    const overrideMap = new Map<string, any>()
    for (const o of overrides as any[]) {
      overrideMap.set(String(o.templateId), o)
    }

    const merge = (t: any) => {
      const o = overrideMap.get(String(t.id)) || null
      const id = String(t.id)
      const type = String(t.type)
      const isDefault = !!t.isDefault
      const unlockedByReward =
        type === 'environment' ? unlockedEnv.has(id) : type === 'theme' ? unlockedThemes.has(id) : unlockedChars.has(id)
      const isLocked = !isDefault && !unlockedByReward

      const merged = {
        id,
        type,
        name: (o?.name ?? t.name) as any,
        icon: (o?.icon ?? t.icon) as any,
        color: (o?.color ?? t.color) as any,
        description: (o?.description ?? t.description) as any,
        imageUrl: (o?.imageUrl ?? t.imageUrl) as any,
        isDefault,
        isActive: true,
        sortOrder: (o?.sortOrder ?? t.sortOrder) as any,
        metadata: (o?.metadata ?? t.metadata) as any,
        isLocked,
        isUnlockedByReward: unlockedByReward,
      }

      const overrideActive = o?.isActive
      if (overrideActive === false && !unlockedByReward) {
        return null
      }
      return merged
    }

    const mergedAll = templates.map(merge).filter(Boolean) as any[]
    const environments = mergedAll.filter((o: any) => o.type === 'environment')
    const characters = mergedAll.filter((o: any) => o.type === 'character')
    const themes = mergedAll.filter((o: any) => o.type === 'theme')

    res.json({ environments, characters, themes })
  } catch (error: any) {
    console.error('Error fetching story options:', error)
    res.status(500).json({ error: String(error?.message || error) })
  }
})

export default router


