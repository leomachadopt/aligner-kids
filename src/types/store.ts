export type StoreItemType = 'digital' | 'real'

export interface StoreItem {
  id: string
  name: string
  description: string
  type: StoreItemType
  category: string
  priceCoins: number
  requiredLevel: number
  imageUrl?: string | null
  metadata?: Record<string, any> | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type CatalogItemKind = 'clinic' | 'parent' | 'story_option'

export interface CatalogItem {
  kind: CatalogItemKind
  catalogItemId: string
  name: string
  description: string
  type: StoreItemType
  category: string
  priceCoins: number
  requiredLevel: number
  imageUrl?: string | null
  metadata?: Record<string, any> | null
  isOwned?: boolean
}

export interface CatalogResponse {
  clinicId: string | null
  items: CatalogItem[]
}

export interface InventoryEntry {
  inventoryId: string
  patientId: string
  itemId: string
  quantity: number
  isActive: boolean
  slot?: string | null
  isEquipped?: boolean
  canActivate?: boolean
  acquiredAt: string
  item: any | null
}

export type RedemptionStatus = 'requested' | 'approved' | 'rejected' | 'fulfilled'

export interface RedemptionEntry {
  redemptionId: string
  patientId: string
  itemId: string
  status: RedemptionStatus
  requestedAt: string
  approvedAt?: string | null
  fulfilledAt?: string | null
  approvedByUserId?: string | null
  note?: string | null
  item: any | null
}


