import { Router } from 'express'
import { AlignerWearService } from '../services/alignerWearService'

const router = Router()

// GET /api/aligners/:alignerId/quest?patientId=...
router.get('/aligners/:alignerId/quest', async (req, res) => {
  try {
    const patientId = String(req.query.patientId || '')
    if (!patientId) return res.status(400).json({ error: 'patientId é obrigatório' })
    const result = await AlignerWearService.getQuestStatus({ patientId, alignerId: req.params.alignerId })
    res.json(result)
  } catch (e: any) {
    console.error('Error quest status:', e)
    res.status(500).json({ error: String(e?.message || e) })
  }
})

export default router





