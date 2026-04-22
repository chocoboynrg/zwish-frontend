import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ActionResponse,
  ItemResponse,
  ListResponse,
} from '../../../core/types/api-response.types';

export interface EventParticipantUser {
  id: number;
  name: string;
  email: string;
}

export interface EventParticipantItem {
  id: number;
  role: 'ORGANIZER' | 'CO_ORGANIZER' | 'GUEST' | string;
  status: 'INVITED' | 'ACCEPTED' | 'DECLINED' | 'REMOVED' | string;
  joinedAt?: string | null;
  user: EventParticipantUser;
}

export interface EventParticipantsResponse {
  total: number;
  participants: EventParticipantItem[];
}

@Injectable({
  providedIn: 'root',
})
export class ParticipantsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiBaseUrl}/participants`;

  getByEvent(eventId: number): Observable<EventParticipantsResponse> {
    return this.http
      .get<ListResponse<EventParticipantItem>>(`${this.apiUrl}/event/${eventId}`)
      .pipe(
        map((response) => ({
          total: response.data.total,
          participants: response.data.items,
        })),
      );
  }

  updateParticipantRole(
    participantId: number,
    role: 'CO_ORGANIZER' | 'GUEST',
  ): Observable<EventParticipantItem | Record<string, unknown>> {
    return this.http
      .patch<ItemResponse<EventParticipantItem> | ActionResponse<Record<string, unknown>>>(
        `${this.apiUrl}/${participantId}/role`,
        { role },
      )
      .pipe(
        map((response) => {
          const data = response.data as Record<string, unknown> & {
            item?: EventParticipantItem;
          };

          return data.item ?? data;
        }),
      );
  }

  joinByShareToken(token: string): Observable<Record<string, unknown>> {
    return this.http
      .post<ActionResponse<Record<string, unknown>>>(
        `${this.apiUrl}/join/${token}`,
        {},
      )
      .pipe(map((response) => response.data));
  }
}