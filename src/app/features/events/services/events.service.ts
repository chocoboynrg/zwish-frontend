import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  ListResponse,
} from '../../../core/types/api-response.types';
import type {
  EventWishlistFilter,
  EventWishlistItem,
  EventWishlistSort,
} from '../models/event-wishlist.model';
import type { EventDashboard } from '../models/event-dashboard.model';

export interface EventOrganizerLite {
  id: number;
  name: string;
  email?: string | null;
}

export interface EventItem {
  id: number;
  title: string;
  eventDate: string;
  description?: string | null;
  organizer?: EventOrganizerLite | null;
  shareToken?: string | null;
}

export interface UserEventSummary {
  id: number;
  title: string;
  eventDate: string;
  description?: string | null;
  organizer?: EventOrganizerLite | null;
  wishlistId?: number | null;
  canDelete?: boolean;
  deleteBlockedReason?: string | null;
}

export interface UserEventWishlistItem {
  id: number;
  name: string;
  imageUrl?: string | null;
  quantity: number;
  targetAmount: number;
  fundedAmount: number;
  remainingAmount: number;
  fundingStatus: string;
  reservationMode: string;
  isReserved: boolean;
  reservedByUserId?: number | null;
  reservedByMe?: boolean;
  reservedByName?: string | null;
  canReserve?: boolean;
  canContribute?: boolean;
  hasPendingContribution?: boolean;
  pendingContributionByMe?: boolean;
  pendingPaymentId?: number | null;
}

export interface UserEventView {
  event: UserEventSummary;
  accessRole: 'ORGANIZER' | 'CO_ORGANIZER' | 'GUEST' | string;
  summary: {
    participantsCount: number;
    totalItems: number;
    totalTargetAmount: number;
    totalFundedAmount: number;
    totalRemainingAmount: number;
  };
  wishlist: UserEventWishlistItem[];
}

export interface CreateEventPayload {
  title: string;
  eventDate: string;
  description?: string;
}

export interface CreateEventResult {
  id: number;
  shareToken?: string | null;
}

export interface GenerateInviteLinkResponse {
  eventId: number;
  invitePath: string;
  shareToken?: string;
}

export interface SharedEventPreview {
  id: number;
  title: string;
  description?: string | null;
  eventDate: string;
  organizer?: {
    id?: number;
    name: string;
    email?: string | null;
  } | null;
}

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/events`;

  createEvent(payload: CreateEventPayload): Observable<CreateEventResult> {
    return this.http
      .post<ApiResponse<{ eventId: number; shareToken?: string }>>(
        this.apiUrl,
        payload,
      )
      .pipe(
        map((response) => ({
          id: response.data.eventId,
          shareToken: response.data.shareToken ?? null,
        })),
      );
  }

  getEvents(): Observable<EventItem[]> {
    return this.http
      .get<ListResponse<EventItem>>(this.apiUrl)
      .pipe(map((response) => response.data.items));
  }

  getMyEventView(eventId: number): Observable<UserEventView> {
    return this.http
      .get<ApiResponse<UserEventView>>(`${this.apiUrl}/${eventId}/my-view`)
      .pipe(map((response) => response.data));
  }

  getEventDashboard(eventId: number): Observable<EventDashboard> {
    return this.http
      .get<ApiResponse<EventDashboard>>(`${this.apiUrl}/${eventId}/dashboard`)
      .pipe(map((response) => response.data));
  }

  getEventWishlist(
    eventId: number,
    filter: EventWishlistFilter = 'all',
    sort: EventWishlistSort = 'created_desc',
  ): Observable<{
    items: EventWishlistItem[];
    total: number;
    filter: EventWishlistFilter;
    sort: EventWishlistSort;
    eventId: number;
  }> {
    const params = new HttpParams()
      .set('filter', filter)
      .set('sort', sort);

    return this.http
      .get<ApiResponse<{ items: EventWishlistItem[]; total: number }>>(
        `${this.apiUrl}/${eventId}/wishlist`,
        { params },
      )
      .pipe(
        map((response) => ({
          items: response.data.items ?? [],
          total: response.data.total ?? response.data.items?.length ?? 0,
          filter,
          sort,
          eventId,
        })),
      );
  }

  generateInviteLink(eventId: number): Observable<GenerateInviteLinkResponse> {
    return this.http
      .get<ApiResponse<GenerateInviteLinkResponse>>(
        `${this.apiUrl}/${eventId}/invite-link`,
      )
      .pipe(map((response) => response.data));
  }

  getEventPreviewByShareToken(token: string): Observable<SharedEventPreview> {
    return this.http
      .get<ApiResponse<{ item: SharedEventPreview }>>(
        `${this.apiUrl}/share/${token}/preview`,
      )
      .pipe(map((response) => response.data.item));
  }

  deleteEvent(eventId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<null>>(`${this.apiUrl}/${eventId}`)
      .pipe(map(() => undefined));
  }
}