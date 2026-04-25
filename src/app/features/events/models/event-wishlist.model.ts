export type EventWishlistFilter = 'all' | 'available' | 'reserved' | 'funded';
export type EventWishlistSort =
  | 'created_desc'
  | 'created_asc'
  | 'progress_desc'
  | 'remaining_asc'
  | 'name_asc';

export interface EventWishlistItem {
  id: number;
  name: string;
  price: number | null;
  quantity: number;
  imageUrl: string | null;  // ✅ présent dans la réponse backend
  isReserved: boolean;
  reservationMode: string;
  targetAmount: number;
  fundedAmount: number;
  remainingAmount: number;
  fundingStatus: string;
  progressPercent: number;
  confirmedContributionsCount: number;
  contributorsCount: number;
}

export interface EventWishlistResponse {
  eventId: number;
  filter: EventWishlistFilter;
  sort: EventWishlistSort;
  total: number;
  items: EventWishlistItem[];
}