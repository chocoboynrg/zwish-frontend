export type DeliveryOptionType =
  | 'GIFT_WRAPPING'
  | 'PERSONAL_MESSAGE'
  | 'HOME_DELIVERY'
  | 'SPECIAL_INSTRUCTIONS'
  | 'CUSTOM';

export const DELIVERY_OPTION_TYPE_LABELS: Record<DeliveryOptionType, string> = {
  GIFT_WRAPPING: 'Emballage cadeau',
  PERSONAL_MESSAGE: 'Petit mot personnalisé',
  HOME_DELIVERY: 'Livraison à domicile',
  SPECIAL_INSTRUCTIONS: 'Instructions particulières',
  CUSTOM: 'Option personnalisée',
};

export interface CatalogDeliveryOption {
  id: number;
  type: DeliveryOptionType;
  label: string;
  description: string | null;
  price: number;
  currencyCode: string;
  hasTextInput: boolean;
  textInputPlaceholder: string | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCatalogDeliveryOptionPayload {
  type: DeliveryOptionType;
  label: string;
  description?: string;
  price: number;
  currencyCode?: string;
  hasTextInput?: boolean;
  textInputPlaceholder?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateCatalogDeliveryOptionPayload {
  label?: string;
  description?: string;
  price?: number;
  hasTextInput?: boolean;
  textInputPlaceholder?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export type DeliverySelectionStatus =
  | 'PENDING_SELECTION'
  | 'PENDING_PAYMENT'
  | 'CONFIRMED'
  | 'SKIPPED';

export interface DeliverySelectionItem {
  id: number;
  catalogDeliveryOptionId: number;
  label: string;
  price: number;
  textValue: string | null;
}

export type DeliveryDecider = 'ORGANIZER' | 'CONTRIBUTOR';

export interface PendingDeliverySelection {
  wishlistItemId: number;
  itemName: string;
  eventId: number;
  eventTitle: string;
  deliveryDecider: DeliveryDecider;
  organizerId: number;
  organizerName: string;
  organizerEmail: string;
  pendingSince: string;
}

export interface DeliverySelection {
  id: number;
  wishlistItemId: number;
  selectedByUserId: number;
  status: DeliverySelectionStatus;
  totalExtraCost: number;
  currencyCode: string;
  paymentId: number | null;
  items: DeliverySelectionItem[];
  scheduledDeliveryAt: string | null;
  deliveryPendingAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FundingDeliveryRule {
  id: number;
  wishlistItemId: number;
  fundingDeadline: string;
  deliveryDate: string;
  label: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface FundingDeliveryRulePayload {
  fundingDeadline: string;
  deliveryDate: string;
  label?: string;
  sortOrder?: number;
}

export interface PendingAdminDeliveryRow {
  deliverySelectionId: number;
  wishlistItemId: number;
  itemName: string;
  fundedAt: string | null;
  eventId: number;
  eventTitle: string;
}
