import { ProductRequestStatus } from './product-request.model';

export type ProductRequestActionMode = 'approve' | 'reject' | null;

export interface ProductRequestStatusMeta {
  label: string;
  emoji: string;
  color: string;
  bg: string;
}

export const PRODUCT_REQUEST_STATUS_META: Record<ProductRequestStatus, ProductRequestStatusMeta> = {
  DRAFT: { label: 'Brouillon', emoji: '✏️', color: '#6b7280', bg: '#f3f4f6' },
  SUBMITTED: { label: 'En attente', emoji: '📬', color: '#1d4ed8', bg: '#dbeafe' },
  UNDER_REVIEW: { label: "En cours d'examen", emoji: '🔍', color: '#92400e', bg: '#fef3c7' },
  APPROVED: { label: 'Approuvée', emoji: '✅', color: '#166534', bg: '#dcfce7' },
  REJECTED: { label: 'Refusée', emoji: '❌', color: '#991b1b', bg: '#fee2e2' },
  PUBLISHED: { label: 'Publiée', emoji: '🎉', color: '#6d28d9', bg: '#ede9fe' },
};
