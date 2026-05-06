export interface CatalogTheme {
  id: number;
  name: string;
  slug: string;
  emoji: string | null;
  description: string | null;
  color: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}
