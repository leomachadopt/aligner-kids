/**
 * Aligners & Treatments Routes
 */

import { Router } from 'express'
import { db, treatments, aligners } from '../db/index'
import { eq, and, desc } from 'drizzle-orm'

const router = Router()

// ============================================
// TREATMENTS
// ============================================

// Get patient's treatment
router.get('/treatments/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const result = await db
      .select()
      .from(treatments)
      .where(eq(treatments.patientId, patientId))
      .orderBy(desc(treatments.createdAt))

    if (result.length === 0) {
      // Evita 404 ruidoso no front; retorna vazio
      return res.json({ treatment: null })
    }

    res.json({ treatment: result[0] })
  } catch (error) {
    console.error('Error fetching treatment:', error)
    res.status(500).json({ error: 'Failed to fetch treatment' })
  }
})

// Create treatment
router.post('/treatments', async (req, res) => {
  try {
    if (!req.body.patientId || !req.body.totalAligners) {
      return res.status(400).json({ error: 'patientId e totalAligners são obrigatórios' })
    }

    const startDate =
      (req.body.startDate && String(req.body.startDate).slice(0, 10)) ||
      new Date().toISOString().slice(0, 10)

    const expectedEndDate =
      (req.body.expectedEndDate && String(req.body.expectedEndDate).slice(0, 10)) ||
      (req.body.estimatedEndDate && String(req.body.estimatedEndDate).slice(0, 10)) ||
      null

    // Sempre iniciar progresso no primeiro alinhador de um novo tratamento
    const currentAlignerNumber = 1

    const newTreatment = await db
      .insert(treatments)
      .values({
        id: `treatment-${Date.now()}`,
        patientId: req.body.patientId,
        name: req.body.name || null,
        startDate,
        expectedEndDate,
        totalAligners: req.body.totalAligners,
        currentAlignerNumber,
        status: req.body.status || 'active',
        notes: req.body.notes || null,
      })
      .returning()

    res.json({ treatment: newTreatment[0] })
  } catch (error) {
    console.error('Error creating treatment:', error)
    res.status(500).json({ error: 'Failed to create treatment' })
  }
})

// Update treatment
router.put('/treatments/:id', async (req, res) => {
  try {
    const updated = await db
      .update(treatments)
      .set({
        startDate: req.body.startDate,
        expectedEndDate: req.body.expectedEndDate || req.body.estimatedEndDate,
        totalAligners: req.body.totalAligners,
        currentAlignerNumber: req.body.currentAlignerNumber,
        status: req.body.status,
        notes: req.body.notes,
        updatedAt: new Date(),
      })
      .where(eq(treatments.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Treatment not found' })
    }

    res.json({ treatment: updated[0] })
  } catch (error) {
    console.error('Error updating treatment:', error)
    res.status(500).json({ error: 'Failed to update treatment' })
  }
})

// ============================================
// ALIGNERS
// ============================================

// Get all aligners for a patient
router.get('/aligners/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const { treatmentId } = req.query
    const baseWhere = treatmentId
      ? and(eq(aligners.patientId, patientId), eq(aligners.treatmentId, treatmentId as string))
      : eq(aligners.patientId, patientId)

    const result = await db
      .select()
      .from(aligners)
      .where(baseWhere)
      .orderBy(aligners.alignerNumber)

    res.json({ aligners: result })
  } catch (error) {
    console.error('Error fetching aligners:', error)
    res.status(500).json({ error: 'Failed to fetch aligners' })
  }
})

// Get single aligner
router.get('/aligners/:id', async (req, res) => {
  try {
    const result = await db
      .select()
      .from(aligners)
      .where(eq(aligners.id, req.params.id))

    if (result.length === 0) {
      return res.status(404).json({ error: 'Aligner not found' })
    }

    res.json({ aligner: result[0] })
  } catch (error) {
    console.error('Error fetching aligner:', error)
    res.status(500).json({ error: 'Failed to fetch aligner' })
  }
})

// Create aligner
router.post('/aligners', async (req, res) => {
  try {
    const newAligner = await db
      .insert(aligners)
      .values({
        id: `aligner-${Date.now()}`,
        patientId: req.body.patientId,
        treatmentId: req.body.treatmentId || null,
        alignerNumber: req.body.alignerNumber ?? req.body.number,
        startDate: req.body.startDate || new Date().toISOString(),
        endDate: req.body.endDate || req.body.expectedEndDate || new Date().toISOString(),
        actualEndDate: req.body.actualEndDate || null,
        status:
          req.body.status ||
          (req.body.alignerNumber ?? req.body.number) === 1
            ? 'active'
            : 'pending',
        usageHours: req.body.usageHours ?? 0,
        targetHoursPerDay: req.body.targetHoursPerDay ?? 22,
        notes: req.body.notes || null,
      })
      .returning()

    res.json({ aligner: newAligner[0] })
  } catch (error) {
    console.error('Error creating aligner:', error)
    res.status(500).json({ error: 'Failed to create aligner' })
  }
})

// Update aligner
router.put('/aligners/:id', async (req, res) => {
  try {
    const updated = await db
      .update(aligners)
      .set({
        treatmentId: req.body.treatmentId,
        alignerNumber: req.body.alignerNumber ?? req.body.number,
        startDate: req.body.startDate,
        endDate: req.body.endDate,
        actualEndDate: req.body.actualEndDate,
        status: req.body.status,
        usageHours: req.body.usageHours,
        targetHoursPerDay: req.body.targetHoursPerDay,
        notes: req.body.notes,
        updatedAt: new Date(),
      })
      .where(eq(aligners.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Aligner not found' })
    }

    res.json({ aligner: updated[0] })
  } catch (error) {
    console.error('Error updating aligner:', error)
    res.status(500).json({ error: 'Failed to update aligner' })
  }
})

// Confirm aligner change (mark current as completed, activate next)
router.post('/aligners/:id/confirm', async (req, res) => {
  try {
    const alignerId = req.params.id

    // Get the aligner
    const alignerResult = await db
      .select()
      .from(aligners)
      .where(eq(aligners.id, alignerId))

    if (alignerResult.length === 0) {
      return res.status(404).json({ error: 'Aligner not found' })
    }

    const aligner = alignerResult[0]

    // Mark as completed
    await db
      .update(aligners)
      .set({
        status: 'completed',
        endDate: new Date().toISOString(),
        updatedAt: new Date(),
      })
      .where(eq(aligners.id, alignerId))

    // Update treatment current aligner number (prefer treatmentId if exists)
    if (aligner.treatmentId) {
      await db
        .update(treatments)
        .set({
          currentAlignerNumber: aligner.alignerNumber + 1,
          updatedAt: new Date(),
        })
        .where(eq(treatments.id, aligner.treatmentId))
    } else {
      await db
        .update(treatments)
        .set({
          currentAlignerNumber: aligner.alignerNumber + 1,
          updatedAt: new Date(),
        })
        .where(eq(treatments.patientId, aligner.patientId))
    }

    // Find and activate next aligner
    const nextAligner = await db
      .select()
      .from(aligners)
      .where(
        and(
          eq(aligners.patientId, aligner.patientId),
          aligner.treatmentId ? eq(aligners.treatmentId, aligner.treatmentId) : undefined,
          eq(aligners.alignerNumber, aligner.alignerNumber + 1)
        )
      )

    if (nextAligner.length > 0) {
      await db
        .update(aligners)
        .set({
          status: 'active',
          startDate: new Date().toISOString(),
          updatedAt: new Date(),
        })
        .where(eq(aligners.id, nextAligner[0].id))

      res.json({
        confirmedAligner: aligner,
        nextAligner: nextAligner[0]
      })
    } else {
      // No more aligners - treatment complete
      if (aligner.treatmentId) {
        await db
          .update(treatments)
          .set({
            status: 'completed',
            updatedAt: new Date(),
          })
          .where(eq(treatments.id, aligner.treatmentId))
      } else {
        await db
          .update(treatments)
          .set({
            status: 'completed',
            updatedAt: new Date(),
          })
          .where(eq(treatments.patientId, aligner.patientId))
      }

      res.json({
        confirmedAligner: aligner,
        treatmentCompleted: true
      })
    }
  } catch (error) {
    console.error('Error confirming aligner:', error)
    res.status(500).json({ error: 'Failed to confirm aligner change' })
  }
})

// Delete aligner
router.delete('/aligners/:id', async (req, res) => {
  try {
    await db.delete(aligners).where(eq(aligners.id, req.params.id))
    res.json({ message: 'Aligner deleted successfully' })
  } catch (error) {
    console.error('Error deleting aligner:', error)
    res.status(500).json({ error: 'Failed to delete aligner' })
  }
})

export default router
