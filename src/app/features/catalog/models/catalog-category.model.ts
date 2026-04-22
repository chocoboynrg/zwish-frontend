export interface CatalogCategory {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
}