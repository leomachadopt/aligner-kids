/**
 * Aligners & Treatments Routes
 */

import { Router } from 'express'
import { db, treatments, aligners } from '../db/index'
import { eq, and } from 'drizzle-orm'

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

    if (result.length === 0) {
      return res.status(404).json({ error: 'Treatment not found' })
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
    const newTreatment = await db
      .insert(treatments)
      .values({
        id: `treatment-${Date.now()}`,
        patientId: req.body.patientId,
        startDate: req.body.startDate,
        estimatedEndDate: req.body.estimatedEndDate,
        totalAligners: req.body.totalAligners,
        currentAlignerNumber: 1,
        status: 'active',
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
        ...req.body,
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
    const result = await db
      .select()
      .from(aligners)
      .where(eq(aligners.patientId, patientId))
      .orderBy(aligners.number)

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
        treatmentId: req.body.treatmentId,
        patientId: req.body.patientId,
        number: req.body.number,
        startDate: req.body.startDate || null,
        endDate: req.body.endDate || null,
        status: req.body.status || 'pending',
        notes: req.body.notes || null,
        photoUrls: req.body.photoUrls || [],
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
        ...req.body,
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

    // Update treatment current aligner number
    await db
      .update(treatments)
      .set({
        currentAlignerNumber: aligner.number + 1,
        updatedAt: new Date(),
      })
      .where(eq(treatments.id, aligner.treatmentId))

    // Find and activate next aligner
    const nextAligner = await db
      .select()
      .from(aligners)
      .where(
        and(
          eq(aligners.treatmentId, aligner.treatmentId),
          eq(aligners.number, aligner.number + 1)
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
      await db
        .update(treatments)
        .set({
          status: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(treatments.id, aligner.treatmentId))

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
