export type PurchaseOrderStatus = 'PENDING' | 'ORDERED' | 'DELIVERED' | 'CANCELLED';

export interface PurchaseOrderEvent {
  id: number;
  title: string;
  eventDate?: string;
}

export interface PurchaseOrderItem {
  id: number;
  name: string;
  fundedAmount: number;
  targetAmount: number;
  quantity: number;
}

export interface PurchaseOrderCatalogProduct {
  id: number;
  name: string;
  slug: string;
  referenceUrl?: string | null;
  mainImageUrl?: string | null;
}

export interface PurchaseOrder {
  id: number;
  itemName: string;
  status: PurchaseOrderStatus;
  totalAmount: number;
  currencyCode: string;
  quantity: number;
  adminNotes: string | null;
  event: PurchaseOrderEvent;
  wishlistItem: PurchaseOrderItem | null;
  catalogProduct: PurchaseOrderCatalogProduct | null;
  orderedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}
