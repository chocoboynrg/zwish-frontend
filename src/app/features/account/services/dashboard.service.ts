import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/types/api-response.types';

export interface DashboardEventItem {
  id: number;
  title: string;
  eventDate: string;
  status?: string;
  participantRole?: string;
  description?: string | null;
}

export interface MyDashboardResponse {
  organizedEvents: DashboardEventItem[];
  joinedEvents: DashboardEventItem[];
  user?: {
    id: number;
    name: string;
    email: string;
  };
  summary?: {
    organizedEventsCount?: number;
    participatingEventsCount?: number;
    totalContributions?: number;
    confirmedContributions?: number;
    awaitingPaymentContributions?: number;
    confirmedContributionsAmount?: number;
    totalPayments?: number;
    initiatedPayments?: number;
    succeededPayments?: number;
    failedPayments?: number;
    succeededPaymentsAmount?: number;
  };
  latestContributions?: unknown[];
  latestPayments?: unknown[];
}

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  getMyDashboard(): Observable<MyDashboardResponse> {
    return this.http
      .get<ApiResponse<MyDashboardResponse>>(`${this.apiUrl}/dashboard/me`)
      .pipe(map((response) => response.data));
  }
}