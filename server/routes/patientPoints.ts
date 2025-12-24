import express from 'express'
import { PatientPointsService } from '../services/patientPointsService'

const router = express.Router()

// ============================================
// PATIENT POINTS (Clinic-scoped, Orthodontist)
// ============================================

router.get('/clinic/:clinicId/patients/:patientId/points', async (req, res) => {
  try {
    const { clinicId, patientId } = req.params
    const orthodontistId = String(req.query.orthodontistId || '')

    if (!orthodontistId) {
      return res.status(400).json({ error: 'orthodontistId é obrigatório' })
    }

    await PatientPointsService.assertOrthodontistAccess(orthodontistId, clinicId)
    await PatientPointsService.assertPatientInClinic(patientId, clinicId)

    const points = await PatientPointsService.getOrCreatePoints(patientId)
    res.json({ points })
  } catch (error: any) {
    const status = error?.statusCode || 500
    res.status(status).json({ error: error?.message || 'Falha ao buscar pontos' })
  }
})

router.post('/clinic/:clinicId/patients/:patientId/points/adjust', async (req, res) => {
  try {
    const { clinicId, patientId } = req.params
    const { orthodontistId, deltaCoins = 0, deltaXp = 0, reason = '' } = req.body || {}

    if (!orthodontistId) {
      return res.status(400).json({ error: 'orthodontistId é obrigatório' })
    }

    const result = await PatientPointsService.adjustPoints({
      clinicId,
      patientId,
      orthodontistId,
      deltaCoins,
      deltaXp,
      reason,
    })

    res.json(result)
  } catch (error: any) {
    const status = error?.statusCode || 500
    res.status(status).json({ error: error?.message || 'Falha ao ajustar pontos' })
  }
})

router.get('/clinic/:clinicId/patients/:patientId/points/transactions', async (req, res) => {
  try {
    const { clinicId, patientId } = req.params
    const orthodontistId = String(req.query.orthodontistId || '')
    const limit = req.query.limit ? Number(req.query.limit) : undefined
    const cursor = req.query.cursor ? String(req.query.cursor) : null

    if (!orthodontistId) {
      return res.status(400).json({ error: 'orthodontistId é obrigatório' })
    }

    const result = await PatientPointsService.listTransactions({
      clinicId,
      patientId,
      orthodontistId,
      limit,
      cursor,
    })

    res.json(result)
  } catch (error: any) {
    const status = error?.statusCode || 500
    res.status(status).json({ error: error?.message || 'Falha ao buscar histórico' })
  }
})

export default router





