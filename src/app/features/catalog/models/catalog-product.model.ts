import { CatalogCategory } from './catalog-category.model';

export type CatalogProductStatus =
  | 'DRAFT'
  | 'ACTIVE'
  | 'INACTIVE'
  | 'ARCHIVED';

export interface CatalogProduct {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  mainImageUrl?: string | null;
  referenceUrl?: string | null;
  brand?: string | null;
  estimatedPrice: number;
  currencyCode: string;
  status: CatalogProductStatus;

  category?: CatalogCategory | null;
  categoryId?: number | null;

  createdAt?: string | null;
  updatedAt?: string | null;
}