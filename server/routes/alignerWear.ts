import { Router } from 'express'
import { AlignerWearService } from '../services/alignerWearService'

const router = Router()

// GET /api/aligners/:alignerId/wear/status?patientId=...
router.get('/aligners/:alignerId/wear/status', async (req, res) => {
  try {
    const patientId = String(req.query.patientId || '')
    if (!patientId) return res.status(400).json({ error: 'patientId é obrigatório' })

    // Simplified response without wear session tables
    // Returns basic structure for compatibility
    res.json({
      state: 'paused',
      wearMinutesToday: 0,
      targetMinutesPerDay: 22 * 60,
      targetPercent: 80,
      isDayOk: false,
      session: null,
      message: 'Wear tracking temporarily unavailable'
    })
  } catch (e: any) {
    console.error('Error wear status:', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
})

// POST /api/aligners/:alignerId/wear/pause
router.post('/aligners/:alignerId/wear/pause', async (req, res) => {
  try {
    const { patientId, userId } = req.body || {}
    if (!patientId || !userId) return res.status(400).json({ error: 'patientId e userId são obrigatórios' })
    const result = await AlignerWearService.pause({ patientId, alignerId: req.params.alignerId, userId })
    res.json(result)
  } catch (e: any) {
    console.error('Error wear pause:', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
})

// POST /api/aligners/:alignerId/wear/resume
router.post('/aligners/:alignerId/wear/resume', async (req, res) => {
  try {
    const { patientId, userId } = req.body || {}
    if (!patientId || !userId) return res.status(400).json({ error: 'patientId e userId são obrigatórios' })
    const result = await AlignerWearService.resume({ patientId, alignerId: req.params.alignerId, userId })
    res.json(result)
  } catch (e: any) {
    console.error('Error wear resume:', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
})

// POST /api/aligners/:alignerId/wear/checkin
// Body: { patientId, userId, date?: 'YYYY-MM-DD', woreAligner: boolean }
router.post('/aligners/:alignerId/wear/checkin', async (req, res) => {
  try {
    const { patientId, userId, date, woreAligner } = req.body || {}
    if (!patientId || !userId) return res.status(400).json({ error: 'patientId e userId são obrigatórios' })
    if (typeof woreAligner !== 'boolean') return res.status(400).json({ error: 'woreAligner deve ser boolean' })
    const result = await AlignerWearService.checkin({ patientId, alignerId: req.params.alignerId, userId, date, woreAligner })
    res.json(result)
  } catch (e: any) {
    console.error('Error wear checkin:', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
})

export default router


