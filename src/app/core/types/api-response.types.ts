export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ListPayload<T> {
  items: T[];
  total: number;
  summary?: Record<string, unknown>;
}

export interface ItemPayload<T> {
  item: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Alias utiles pour garder la compatibilité avec les services déjà écrits.
 */
export type ListResponse<T> = ApiResponse<ListPayload<T>>;
export type ItemResponse<T> = ApiResponse<ItemPayload<T>>;
export type ActionResponse<T = Record<string, unknown>> = ApiResponse<T>;