import { CatalogCategory } from '../../catalog/models/catalog-category.model';
import { CatalogProduct } from '../../catalog/models/catalog-product.model';

export type ProductRequestStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'PUBLISHED';

export interface ProductRequestUser {
  id: number;
  name: string;
  email: string;
}

export interface ProductRequestEvent {
  id: number;
  title: string;
  eventDate?: string;
  description?: string | null;
}

export interface ProductRequestWishlist {
  id: number;
  title: string;
  description?: string | null;
}

export interface ProductRequest {
  id: number;
  event: ProductRequestEvent;
  wishlist: ProductRequestWishlist;
  requestedBy: ProductRequestUser;
  category: CatalogCategory | null;
  approvedCatalogProduct: CatalogProduct | null;
  name: string;
  description: string | null;
  imageUrl: string | null;
  referenceUrl: string | null;
  estimatedPrice: number;
  currencyCode: string;
  status: ProductRequestStatus;
  reviewComment: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}