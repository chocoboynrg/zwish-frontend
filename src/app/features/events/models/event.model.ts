export interface EventOrganizer {
  id: number;
  name: string;
  email: string;
}

export interface EventAutoCreatedWishlist {
  title: string;
  description: string | null;
}

export interface EventItem {
  id: number;
  title: string;
  eventDate: string;
  description: string | null;
  organizer?: EventOrganizer;
  autoCreatedWishlist?: EventAutoCreatedWishlist;
}

export interface CreateEventPayload {
  title: string;
  eventDate: string;
  description?: string;
}