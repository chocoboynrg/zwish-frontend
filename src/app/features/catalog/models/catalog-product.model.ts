import { CatalogCategory } from './catalog-category.model';
import { CatalogTheme } from './catalog-theme.model';

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
  realPrice?: number | null;
  sellingPrice?: number | null;
  promoPrice?: number | null;
  promoEndsAt?: string | null;
  currencyCode: string;
  status: CatalogProductStatus;

  category?: CatalogCategory | null;
  categoryId?: number | null;

  themes?: CatalogTheme[];

  createdAt?: string | null;
  updatedAt?: string | null;
}