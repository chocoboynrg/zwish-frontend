import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ActionResponse,
  ItemResponse,
  ListResponse,
} from '../../../core/types/api-response.types';
import { AppNotification } from '../models/notification.model';

@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/notifications`;

  getMyNotifications(): Observable<AppNotification[]> {
    return this.http
      .get<ListResponse<AppNotification>>(`${this.baseUrl}/me`)
      .pipe(map((response) => response.data.items ?? []));
  }

  getUnreadCount(): Observable<{ userId: number; unreadCount: number }> {
    return this.http
      .get<ActionResponse<{ userId: number; unreadCount: number }>>(
        `${this.baseUrl}/me/unread-count`,
      )
      .pipe(map((response) => response.data));
  }

  markAsRead(id: number): Observable<AppNotification> {
    return this.http
      .patch<ItemResponse<AppNotification>>(`${this.baseUrl}/${id}/read`, {})
      .pipe(map((response) => response.data.item));
  }

  markAllAsRead(): Observable<{ message: string; updatedCount: number }> {
    return this.http
      .patch<ActionResponse<{ message: string; updatedCount: number }>>(
        `${this.baseUrl}/me/read-all`,
        {},
      )
      .pipe(map((response) => response.data));
  }
}