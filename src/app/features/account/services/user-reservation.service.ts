import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ItemResponse } from '../../../core/types/api-response.types';

export interface CreateUserReservationPayload {
  wishlistItemId: number;
  eventId: number;
}

export interface ReservationItem {
  id: number;
  status: string;
  reservedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserReservationService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  createReservation(
    payload: CreateUserReservationPayload,
  ): Observable<ReservationItem> {
    return this.http
      .post<ItemResponse<ReservationItem>>(
        `${this.apiUrl}/reservations`,
        payload,
      )
      .pipe(map((res) => res.data.item));
  }
}
