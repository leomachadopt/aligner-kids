/**
 * Parent Rewards Routes (per patient)
 * Parents share the same account; access is scoped by patientId.
 */

import { Router } from 'express'
import { db, parent_store_items, users } from '../db'
import { and, desc, eq } from 'drizzle-orm'

const router = Router()

router.get('/patients/:patientId/parent-items', async (req, res) => {
  try {
    const { patientId } = req.params
    const items = await db
      .select()
      .from(parent_store_items)
      .where(eq(parent_store_items.patientId, patientId))
      .orderBy(desc(parent_store_items.createdAt))
    res.json({ items })
  } catch (error) {
    console.error('Error fetching parent items:', error)
    res.status(500).json({ error: 'Failed to fetch parent items' })
  }
})

router.post('/patients/:patientId/parent-items', async (req, res) => {
  try {
    const { patientId } = req.params
    const { createdByUserId, name, description, priceCoins, requiredLevel = 1, isActive = true, metadata = {} } = req.body || {}
    if (!createdByUserId || !name || !description || priceCoins === undefined) {
      return res.status(400).json({ error: 'Campos obrigatórios ausentes' })
    }

    // ensure creator is the same user (parents share the patient account)
    if (createdByUserId !== patientId) {
      return res.status(403).json({ error: 'Somente o responsável do paciente pode criar itens' })
    }

    const patient = await db.select().from(users).where(eq(users.id, patientId))
    if (patient.length === 0) return res.status(404).json({ error: 'Paciente não encontrado' })
    if (!patient[0].clinicId) return res.status(400).json({ error: 'Paciente sem clínica vinculada' })

    const created = await db
      .insert(parent_store_items)
      .values({
        id: `pitem-${Date.now()}`,
        clinicId: patient[0].clinicId!,
        patientId,
        createdByUserId,
        name,
        description,
        type: 'real',
        category: 'voucher',
        priceCoins: Number(priceCoins),
        requiredLevel: Number(requiredLevel) || 1,
        metadata,
        isActive: !!isActive,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    res.json({ item: created[0] })
  } catch (error) {
    console.error('Error creating parent item:', error)
    res.status(500).json({ error: 'Failed to create parent item' })
  }
})

router.put('/patients/:patientId/parent-items/:id', async (req, res) => {
  try {
    const { patientId, id } = req.params
    const { updatedByUserId } = req.body || {}
    if (updatedByUserId !== patientId) {
      return res.status(403).json({ error: 'Somente o responsável do paciente pode editar itens' })
    }

    const updated = await db
      .update(parent_store_items)
      .set({ ...req.body, updatedAt: new Date() })
      .where(and(eq(parent_store_items.id, id), eq(parent_store_items.patientId, patientId)))
      .returning()

    if (updated.length === 0) return res.status(404).json({ error: 'Item não encontrado' })
    res.json({ item: updated[0] })
  } catch (error) {
    console.error('Error updating parent item:', error)
    res.status(500).json({ error: 'Failed to update parent item' })
  }
})

export default router


