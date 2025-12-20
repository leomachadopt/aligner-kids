import { Router } from 'express'
import { AlignerWearService } from '../services/alignerWearService'

const router = Router()

// GET /api/aligners/:alignerId/wear/status?patientId=...
router.get('/aligners/:alignerId/wear/status', async (req, res) => {
  try {
    const patientId = String(req.query.patientId || '')
    if (!patientId) return res.status(400).json({ error: 'patientId é obrigatório' })
    const result = await AlignerWearService.getStatus(patientId, req.params.alignerId)
    res.json(result)
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

export default router


