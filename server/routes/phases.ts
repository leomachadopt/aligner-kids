/**
 * Treatment Phases API Routes
 */

import express from 'express'
import { PhaseService } from '../services/phaseService'

const router = express.Router()

/**
 * GET /api/phases/treatment/:treatmentId
 * Get all phases for a treatment
 */
router.get('/treatment/:treatmentId', async (req, res) => {
  try {
    const { treatmentId } = req.params
    const phases = await PhaseService.getPhasesByTreatment(treatmentId)
    res.json(phases)
  } catch (error: any) {
    console.error('Error fetching phases:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/phases/treatment/:treatmentId/active
 * Get active phase for a treatment
 */
router.get('/treatment/:treatmentId/active', async (req, res) => {
  try {
    const { treatmentId } = req.params
    const phase = await PhaseService.getActivePhase(treatmentId)

    if (!phase) {
      return res.status(404).json({ error: 'No active phase found' })
    }

    res.json(phase)
  } catch (error: any) {
    console.error('Error fetching active phase:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/phases/:phaseId
 * Get phase by ID
 */
router.get('/:phaseId', async (req, res) => {
  try {
    const { phaseId } = req.params
    const phase = await PhaseService.getPhaseById(phaseId)

    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' })
    }

    res.json(phase)
  } catch (error: any) {
    console.error('Error fetching phase:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/phases
 * Create a new phase
 */
router.post('/', async (req, res) => {
  try {
    const { treatmentId, phaseName, description, totalAligners, startDate, expectedEndDate, adherenceTargetPercent } = req.body

    if (!treatmentId || !phaseName || !totalAligners) {
      return res.status(400).json({
        error: 'Missing required fields: treatmentId, phaseName, totalAligners'
      })
    }

    const phase = await PhaseService.createPhase({
      treatmentId,
      phaseName,
      description,
      totalAligners: parseInt(totalAligners),
      startDate,
      expectedEndDate,
      adherenceTargetPercent: adherenceTargetPercent != null ? parseInt(adherenceTargetPercent) : undefined,
    })

    res.status(201).json(phase)
  } catch (error: any) {
    console.error('Error creating phase:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * PUT /api/phases/:phaseId
 * Update a phase
 */
router.put('/:phaseId', async (req, res) => {
  try {
    const { phaseId } = req.params
    const updates = req.body

    const phase = await PhaseService.updatePhase(phaseId, updates)

    if (!phase) {
      return res.status(404).json({ error: 'Phase not found' })
    }

    res.json(phase)
  } catch (error: any) {
    console.error('Error updating phase:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/phases/:phaseId/start
 * Start a phase (mark as active)
 */
router.post('/:phaseId/start', async (req, res) => {
  try {
    const { phaseId } = req.params
    const { startDate } = req.body

    const phase = await PhaseService.startPhase(phaseId, startDate)
    res.json(phase)
  } catch (error: any) {
    console.error('Error starting phase:', error)
    res.status(400).json({ error: error.message })
  }
})

/**
 * POST /api/phases/:phaseId/complete
 * Complete a phase
 */
router.post('/:phaseId/complete', async (req, res) => {
  try {
    const { phaseId } = req.params
    const { actualEndDate } = req.body

    const phase = await PhaseService.completePhase(phaseId, actualEndDate)
    res.json(phase)
  } catch (error: any) {
    console.error('Error completing phase:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/phases/:phaseId/pause
 * Pause a phase
 */
router.post('/:phaseId/pause', async (req, res) => {
  try {
    const { phaseId } = req.params
    const phase = await PhaseService.pausePhase(phaseId)
    res.json(phase)
  } catch (error: any) {
    console.error('Error pausing phase:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * POST /api/phases/:phaseId/resume
 * Resume a paused phase
 */
router.post('/:phaseId/resume', async (req, res) => {
  try {
    const { phaseId } = req.params
    const phase = await PhaseService.resumePhase(phaseId)
    res.json(phase)
  } catch (error: any) {
    console.error('Error resuming phase:', error)
    res.status(400).json({ error: error.message })
  }
})

/**
 * GET /api/phases/treatment/:treatmentId/progress
 * Get overall progress of treatment
 */
router.get('/treatment/:treatmentId/progress', async (req, res) => {
  try {
    const { treatmentId } = req.params
    const progress = await PhaseService.calculateOverallProgress(treatmentId)
    res.json({ progress })
  } catch (error: any) {
    console.error('Error calculating progress:', error)
    res.status(500).json({ error: error.message })
  }
})

/**
 * GET /api/phases/:phaseId/progress
 * Get progress of a specific phase
 */
router.get('/:phaseId/progress', async (req, res) => {
  try {
    const { phaseId } = req.params
    const progress = await PhaseService.calculatePhaseProgress(phaseId)
    res.json({ progress })
  } catch (error: any) {
    console.error('Error calculating phase progress:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
