/**
 * Store Routes
 * Items, purchases, inventory and reward redemptions.
 */

import { Router } from 'express'
import { StoreService } from '../services/storeService'
import { RewardCatalogService } from '../services/rewardCatalogService'

const router = Router()

// List store items (global catalog)
router.get('/store/items', async (_req, res) => {
  try {
    const items = await StoreService.listActiveItems()
    res.json({ items })
  } catch (error) {
    console.error('Error fetching store items:', error)
    res.status(500).json({ error: 'Failed to fetch store items' })
  }
})

// Store catalog resolved for a patient (v2)
router.get('/store/catalog/patient/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params
    const catalog = await RewardCatalogService.resolveCatalog(patientId)
    res.json(catalog)
  } catch (error: any) {
    console.error('Error resolving catalog:', error)
    res.status(500).json({ error: String(error?.message || error) })
  }
})

// Inventory for a patient
router.get('/store/inventory/patient/:patientId', async (req, res) => {
  try {
    const inventory = await StoreService.getPatientInventory(req.params.patientId)
    res.json({ inventory })
  } catch (error) {
    console.error('Error fetching inventory:', error)
    res.status(500).json({ error: 'Failed to fetch inventory' })
  }
})

// Active cosmetics for a patient (avatar/photo_frame)
router.get('/store/cosmetics/patient/:patientId', async (req, res) => {
  try {
    const result = await StoreService.getActiveCosmetics(req.params.patientId)
    res.json(result)
  } catch (error: any) {
    console.error('Error fetching cosmetics:', error)
    res.status(error?.statusCode || 500).json({ error: String(error?.message || error) })
  }
})

// Entitlements for a patient (e.g. story unlock options)
router.get('/store/entitlements/patient/:patientId', async (req, res) => {
  try {
    const result = await StoreService.getEntitlements(req.params.patientId)
    res.json(result)
  } catch (error: any) {
    console.error('Error fetching entitlements:', error)
    res.status(error?.statusCode || 500).json({ error: String(error?.message || error) })
  }
})

// Activate an inventory item as a cosmetic in a slot
router.post('/store/inventory/:inventoryId/activate', async (req, res) => {
  try {
    const { patientId, slot } = req.body || {}
    if (!patientId || !slot) {
      return res.status(400).json({ error: 'patientId e slot são obrigatórios' })
    }
    const cosmetic = await StoreService.activateCosmetic({
      patientId,
      inventoryId: req.params.inventoryId,
      slot,
    })
    res.json({ cosmetic })
  } catch (error: any) {
    console.error('Error activating cosmetic:', error)
    res.status(error?.statusCode || 500).json({ error: String(error?.message || error) })
  }
})

router.post('/store/inventory/:inventoryId/deactivate', async (req, res) => {
  try {
    const { patientId, slot } = req.body || {}
    if (!patientId || !slot) {
      return res.status(400).json({ error: 'patientId e slot são obrigatórios' })
    }
    const cosmetic = await StoreService.deactivateCosmetic({
      patientId,
      inventoryId: req.params.inventoryId,
      slot,
    })
    res.json({ cosmetic })
  } catch (error: any) {
    console.error('Error deactivating cosmetic:', error)
    res.status(error?.statusCode || 500).json({ error: String(error?.message || error) })
  }
})

// Redemptions for a patient
router.get('/store/redemptions/patient/:patientId', async (req, res) => {
  try {
    const redemptions = await StoreService.getPatientRedemptions(req.params.patientId)
    res.json({ redemptions })
  } catch (error) {
    console.error('Error fetching redemptions:', error)
    res.status(500).json({ error: 'Failed to fetch redemptions' })
  }
})

// Purchase
router.post('/store/purchase', async (req, res) => {
  try {
    const { patientId, itemId, catalogItemId, kind } = req.body || {}
    if (!patientId) {
      return res.status(400).json({ error: 'patientId é obrigatório' })
    }

    const result =
      catalogItemId && kind
        ? await StoreService.purchaseCatalogItem(patientId, kind, catalogItemId)
        : await StoreService.purchase(patientId, itemId)
    res.json(result)
  } catch (error: any) {
    console.error('Error purchasing item:', error)
    const msg = String(error?.message || error)
    const code =
      error?.statusCode ||
      (msg.includes('Saldo insuficiente') ? 400 : msg.includes('não pode ser comprado novamente') ? 400 : 500)
    res.status(code).json({ error: msg })
  }
})

// Approve redemption
router.post('/store/redemptions/:id/approve', async (req, res) => {
  try {
    const { approvedByUserId, pin, note } = req.body || {}
    if (!approvedByUserId || !pin) {
      return res.status(400).json({ error: 'approvedByUserId e pin são obrigatórios' })
    }
    const redemption = await StoreService.approveRedemption(req.params.id, approvedByUserId, pin, note)
    res.json({ redemption })
  } catch (error: any) {
    console.error('Error approving redemption:', error)
    res.status(500).json({ error: String(error?.message || error) })
  }
})

// Reject redemption
router.post('/store/redemptions/:id/reject', async (req, res) => {
  try {
    const { approvedByUserId, pin, note } = req.body || {}
    if (!approvedByUserId || !pin) {
      return res.status(400).json({ error: 'approvedByUserId e pin são obrigatórios' })
    }
    const redemption = await StoreService.rejectRedemption(req.params.id, approvedByUserId, pin, note)
    res.json({ redemption })
  } catch (error: any) {
    console.error('Error rejecting redemption:', error)
    res.status(500).json({ error: String(error?.message || error) })
  }
})

// Fulfill redemption
router.post('/store/redemptions/:id/fulfill', async (req, res) => {
  try {
    const { fulfilledByUserId, pin, note } = req.body || {}
    if (!fulfilledByUserId || !pin) {
      return res.status(400).json({ error: 'fulfilledByUserId e pin são obrigatórios' })
    }
    const redemption = await StoreService.fulfillRedemption(req.params.id, fulfilledByUserId, pin, note)
    res.json({ redemption })
  } catch (error: any) {
    console.error('Error fulfilling redemption:', error)
    res.status(500).json({ error: String(error?.message || error) })
  }
})

export default router


