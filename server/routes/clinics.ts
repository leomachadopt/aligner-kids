/**
 * Clinics Routes
 */

import { Router } from 'express'
import { db, clinics } from '../db/index'
import { eq } from 'drizzle-orm'

const router = Router()

// Get all clinics
router.get('/', async (req, res) => {
  try {
    const allClinics = await db.select().from(clinics)
    res.json({ clinics: allClinics })
  } catch (error) {
    console.error('Error fetching clinics:', error)
    res.status(500).json({ error: 'Failed to fetch clinics' })
  }
})

// Get clinic by ID
router.get('/:id', async (req, res) => {
  try {
    const result = await db.select().from(clinics).where(eq(clinics.id, req.params.id))
    if (result.length === 0) {
      return res.status(404).json({ error: 'Clinic not found' })
    }
    res.json({ clinic: result[0] })
  } catch (error) {
    console.error('Error fetching clinic:', error)
    res.status(500).json({ error: 'Failed to fetch clinic' })
  }
})

// Create clinic
router.post('/', async (req, res) => {
  try {
    const newClinic = await db.insert(clinics).values({
      id: `clinic-${Date.now()}`,
      name: req.body.name,
      slug: req.body.slug,
      country: req.body.country || 'BR',
      email: req.body.email,
      phone: req.body.phone || null,
      website: req.body.website || null,
      addressCity: req.body.addressCity || null,
      addressState: req.body.addressState || null,
      primaryColor: req.body.primaryColor || '#3B82F6',
      subscriptionTier: req.body.subscriptionTier || 'basic',
    }).returning()

    res.json({ clinic: newClinic[0] })
  } catch (error) {
    console.error('Error creating clinic:', error)
    res.status(500).json({ error: 'Failed to create clinic' })
  }
})

// Update clinic
router.put('/:id', async (req, res) => {
  try {
    const updated = await db.update(clinics)
      .set({
        ...req.body,
        updatedAt: new Date()
      })
      .where(eq(clinics.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Clinic not found' })
    }

    res.json({ clinic: updated[0] })
  } catch (error) {
    console.error('Error updating clinic:', error)
    res.status(500).json({ error: 'Failed to update clinic' })
  }
})

// Delete clinic
router.delete('/:id', async (req, res) => {
  try {
    await db.delete(clinics).where(eq(clinics.id, req.params.id))
    res.json({ message: 'Clinic deleted successfully' })
  } catch (error) {
    console.error('Error deleting clinic:', error)
    res.status(500).json({ error: 'Failed to delete clinic' })
  }
})

export default router
