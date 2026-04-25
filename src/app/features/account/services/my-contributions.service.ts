import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';

export type ContributionStatus =
  | 'PENDING'
  | 'AWAITING_PAYMENT'
  | 'CONFIRMED'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface MyContributionItem {
  id: number;
  amount: number;
  currencyCode: string;
  status: ContributionStatus;
  isAnonymous: boolean;
  message: string | null;
  createdAt: string;
  confirmedAt: string | null;
  event?: {
    id: number;
    title: string;
    eventDate?: string | null;
  };
  wishlistItem?: {
    id: number;
    title: string;
    fundingStatus?: string;
  };
  payment?: {
    id: number;
    status: string;
    provider?: string | null;
    paymentMethod?: string | null;
  } | null;
  expiresAt?: string | null; 
}

export interface MyContributionsResponse {
  items: MyContributionItem[];
  total: number;
  summary?: {
    totalCount: number;
    confirmedCount: number;
    awaitingPaymentCount: number;
    failedCount: number;
    totalConfirmedAmount: number;
    currencyCode?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class MyContributionsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  getMine(status?: string): Observable<MyContributionsResponse> {
    let params = new HttpParams();

    if (status && status !== 'ALL') {
      params = params.set('status', status);
    }

    return this.http
      .get<ApiResponse<MyContributionsResponse>>(
        `${this.apiUrl}/contributions/me`,
        { params },
      )
      .pipe(
        map((response) => response.data) // 🔥 LA CORRECTION ICI
      );
  }
}