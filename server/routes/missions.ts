/**
 * Missions & Gamification Routes
 */

import { Router } from 'express'
import { db, mission_templates, patient_missions, patient_points } from '../db/index'
import { eq, and } from 'drizzle-orm'

const router = Router()

// ============================================
// MISSION TEMPLATES
// ============================================

// Get all mission templates
router.get('/missions/templates', async (req, res) => {
  try {
    const result = await db.select().from(mission_templates)
    res.json({ templates: result })
  } catch (error) {
    console.error('Error fetching mission templates:', error)
    res.status(500).json({ error: 'Failed to fetch mission templates' })
  }
})

// Create mission template
router.post('/missions/templates', async (req, res) => {
  try {
    const newTemplate = await db
      .insert(mission_templates)
      .values({
        id: `template-${Date.now()}`,
        name: req.body.name,
        description: req.body.description,
        type: req.body.type,
        coinsReward: req.body.coinsReward || 0,
        xpReward: req.body.xpReward || 0,
        triggerType: req.body.triggerType,
        triggerValue: req.body.triggerValue || null,
        isActive: true,
      })
      .returning()

    res.json({ template: newTemplate[0] })
  } catch (error) {
    console.error('Error creating mission template:', error)
    res.status(500).json({ error: 'Failed to create mission template' })
  }
})

// ============================================
// PATIENT MISSIONS
// ============================================

// Get all missions for a patient
router.get('/missions/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const result = await db
      .select()
      .from(patient_missions)
      .where(eq(patient_missions.patientId, patientId))
      .orderBy(patient_missions.createdAt)

    res.json({ missions: result })
  } catch (error) {
    console.error('Error fetching patient missions:', error)
    res.status(500).json({ error: 'Failed to fetch patient missions' })
  }
})

// Create patient mission
router.post('/missions', async (req, res) => {
  try {
    const newMission = await db
      .insert(patient_missions)
      .values({
        id: `mission-${Date.now()}`,
        patientId: req.body.patientId,
        templateId: req.body.templateId || null,
        title: req.body.title,
        description: req.body.description,
        type: req.body.type,
        status: req.body.status || 'active',
        progress: req.body.progress || 0,
        target: req.body.target || 1,
        coinsReward: req.body.coinsReward || 0,
        xpReward: req.body.xpReward || 0,
        unlocksAt: req.body.unlocksAt || null,
      })
      .returning()

    res.json({ mission: newMission[0] })
  } catch (error) {
    console.error('Error creating mission:', error)
    res.status(500).json({ error: 'Failed to create mission' })
  }
})

// Update mission
router.put('/missions/:id', async (req, res) => {
  try {
    const updated = await db
      .update(patient_missions)
      .set({
        ...req.body,
        updatedAt: new Date(),
      })
      .where(eq(patient_missions.id, req.params.id))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Mission not found' })
    }

    res.json({ mission: updated[0] })
  } catch (error) {
    console.error('Error updating mission:', error)
    res.status(500).json({ error: 'Failed to update mission' })
  }
})

// Complete mission
router.post('/missions/:id/complete', async (req, res) => {
  try {
    const missionId = req.params.id

    // Get mission
    const missionResult = await db
      .select()
      .from(patient_missions)
      .where(eq(patient_missions.id, missionId))

    if (missionResult.length === 0) {
      return res.status(404).json({ error: 'Mission not found' })
    }

    const mission = missionResult[0]

    // Mark as completed
    const updated = await db
      .update(patient_missions)
      .set({
        status: 'completed',
        progress: mission.target,
        completedAt: new Date().toISOString(),
        updatedAt: new Date(),
      })
      .where(eq(patient_missions.id, missionId))
      .returning()

    // Award coins and XP
    await db
      .update(patient_points)
      .set({
        coins: db.$count(patient_points.coins) + mission.coinsReward,
        xp: db.$count(patient_points.xp) + mission.xpReward,
        updatedAt: new Date(),
      })
      .where(eq(patient_points.patientId, mission.patientId))

    res.json({ mission: updated[0] })
  } catch (error) {
    console.error('Error completing mission:', error)
    res.status(500).json({ error: 'Failed to complete mission' })
  }
})

// ============================================
// PATIENT POINTS
// ============================================

// Get patient points
router.get('/points/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const result = await db
      .select()
      .from(patient_points)
      .where(eq(patient_points.patientId, patientId))

    if (result.length === 0) {
      // Create initial points record
      const created = await db
        .insert(patient_points)
        .values({
          id: `points-${Date.now()}`,
          patientId,
          coins: 0,
          xp: 0,
          level: 1,
        })
        .returning()

      return res.json({ points: created[0] })
    }

    res.json({ points: result[0] })
  } catch (error) {
    console.error('Error fetching patient points:', error)
    res.status(500).json({ error: 'Failed to fetch patient points' })
  }
})

// Add coins/XP to patient
router.post('/points/patient/:patientId/add', async (req, res) => {
  try {
    const { patientId } = req.params
    const { coins = 0, xp = 0 } = req.body

    // Get current points
    const current = await db
      .select()
      .from(patient_points)
      .where(eq(patient_points.patientId, patientId))

    let updated

    if (current.length === 0) {
      // Create new
      updated = await db
        .insert(patient_points)
        .values({
          id: `points-${Date.now()}`,
          patientId,
          coins,
          xp,
          level: Math.floor(xp / 100) + 1,
        })
        .returning()
    } else {
      // Update existing
      const newCoins = (current[0].coins || 0) + coins
      const newXp = (current[0].xp || 0) + xp
      const newLevel = Math.floor(newXp / 100) + 1

      updated = await db
        .update(patient_points)
        .set({
          coins: newCoins,
          xp: newXp,
          level: newLevel,
          updatedAt: new Date(),
        })
        .where(eq(patient_points.patientId, patientId))
        .returning()
    }

    res.json({ points: updated[0] })
  } catch (error) {
    console.error('Error adding points:', error)
    res.status(500).json({ error: 'Failed to add points' })
  }
})

// Update patient points (direct set)
router.put('/points/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params

    const updated = await db
      .update(patient_points)
      .set({
        ...req.body,
        level: Math.floor((req.body.xp || 0) / 100) + 1,
        updatedAt: new Date(),
      })
      .where(eq(patient_points.patientId, patientId))
      .returning()

    if (updated.length === 0) {
      return res.status(404).json({ error: 'Points record not found' })
    }

    res.json({ points: updated[0] })
  } catch (error) {
    console.error('Error updating points:', error)
    res.status(500).json({ error: 'Failed to update points' })
  }
})

export default router
