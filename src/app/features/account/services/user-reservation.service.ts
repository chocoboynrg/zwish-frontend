import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ItemResponse, ApiResponse } from '../../../core/types/api-response.types';

export interface CreateUserReservationPayload {
  wishlistItemId: number;
  eventId: number;
}

export interface ReservationItem {
  id: number;
  status: 'ACTIVE' | 'EXPIRED' | 'RELEASED' | 'CONFIRMED';
  reservedAt: string;
  expiresAt: string | null;
  releasedAt: string | null;
  releaseReason: string | null;
  wishlistItem?: {
    id: number;
    name: string;
    price: number | null;
    imageUrl: string | null;
  };
  event?: {
    id: number;
    title: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class UserReservationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  createReservation(payload: CreateUserReservationPayload): Observable<ReservationItem> {
    return this.http
      .post<ItemResponse<ReservationItem>>(`${this.apiUrl}/reservations`, payload)
      .pipe(map((res) => res.data.item));
  }

  getMyReservations(): Observable<ReservationItem[]> {
    return this.http
      .get<ApiResponse<{ items: ReservationItem[] }>>(`${this.apiUrl}/reservations`)
      .pipe(map((res) => res.data.items));
  }

  releaseReservation(id: number, reason?: string): Observable<ReservationItem> {
    return this.http
      .patch<ItemResponse<ReservationItem>>(`${this.apiUrl}/reservations/${id}/release`, {
        releaseReason: reason ?? '',
      })
      .pipe(map((res) => res.data.item));
  }
}
