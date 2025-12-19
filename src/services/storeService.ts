import { apiClient } from '@/utils/apiClient'
import type { CatalogResponse, InventoryEntry, RedemptionEntry, StoreItem } from '@/types/store'
import type { PatientPoints } from '@/types/mission'

export interface PurchaseResponse {
  points: PatientPoints
  item: StoreItem
  inventoryItem?: any
  redemption?: any
}

export class StoreService {
  static async getItems(): Promise<StoreItem[]> {
    const res = await apiClient.get<{ items: StoreItem[] }>(`/store/items`)
    return res.items || []
  }

  static async getCatalog(patientId: string): Promise<CatalogResponse> {
    return apiClient.get<CatalogResponse>(`/store/catalog/patient/${patientId}`)
  }

  static async getInventory(patientId: string): Promise<InventoryEntry[]> {
    const res = await apiClient.get<{ inventory: InventoryEntry[] }>(
      `/store/inventory/patient/${patientId}`,
    )
    return res.inventory || []
  }

  static async getActiveCosmetics(patientId: string): Promise<any> {
    return apiClient.get(`/store/cosmetics/patient/${patientId}`)
  }

  static async getEntitlements(patientId: string): Promise<any> {
    return apiClient.get(`/store/entitlements/patient/${patientId}`)
  }

  static async activateInventoryCosmetic(patientId: string, inventoryId: string, slot: string) {
    return apiClient.post(`/store/inventory/${inventoryId}/activate`, { patientId, slot })
  }

  static async deactivateInventoryCosmetic(patientId: string, inventoryId: string, slot: string) {
    return apiClient.post(`/store/inventory/${inventoryId}/deactivate`, { patientId, slot })
  }

  static async getRedemptions(patientId: string): Promise<RedemptionEntry[]> {
    const res = await apiClient.get<{ redemptions: RedemptionEntry[] }>(
      `/store/redemptions/patient/${patientId}`,
    )
    return res.redemptions || []
  }

  static async purchase(patientId: string, itemId: string): Promise<PurchaseResponse> {
    return apiClient.post<PurchaseResponse>(`/store/purchase`, { patientId, itemId })
  }

  static async purchaseCatalogItem(
    patientId: string,
    kind: 'clinic' | 'parent' | 'story_option',
    catalogItemId: string,
  ): Promise<PurchaseResponse> {
    return apiClient.post<PurchaseResponse>(`/store/purchase`, { patientId, kind, catalogItemId })
  }

  static async approveRedemption(
    redemptionId: string,
    approvedByUserId: string,
    pin: string,
    note?: string,
  ): Promise<RedemptionEntry> {
    const res = await apiClient.post<{ redemption: RedemptionEntry }>(
      `/store/redemptions/${redemptionId}/approve`,
      { approvedByUserId, pin, note },
    )
    return res.redemption
  }

  static async rejectRedemption(
    redemptionId: string,
    approvedByUserId: string,
    pin: string,
    note?: string,
  ): Promise<RedemptionEntry> {
    const res = await apiClient.post<{ redemption: RedemptionEntry }>(
      `/store/redemptions/${redemptionId}/reject`,
      { approvedByUserId, pin, note },
    )
    return res.redemption
  }

  static async fulfillRedemption(
    redemptionId: string,
    fulfilledByUserId: string,
    pin: string,
    note?: string,
  ): Promise<RedemptionEntry> {
    const res = await apiClient.post<{ redemption: RedemptionEntry }>(
      `/store/redemptions/${redemptionId}/fulfill`,
      { fulfilledByUserId, pin, note },
    )
    return res.redemption
  }
}


