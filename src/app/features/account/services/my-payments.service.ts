import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/types/api-response.types';

export interface MyPaymentItem {
  id: number;
  provider: string;
  providerTransactionId?: string | null;
  providerReference?: string | null;
  paymentMethod?: string | null;
  amount: number;
  currencyCode: string;
  status: string;
  paymentUrl?: string | null;
  failureReason?: string | null;
  initiatedAt?: string | null;
  expiresAt?: string | null; 
  confirmedAt?: string | null;
  failedAt?: string | null;
  refundedAt?: string | null;
  createdAt: string;
  contribution?: {
    id: number;
    status: string;
    amount: number;
    event?: {
      id: number;
      title: string;
      eventDate?: string | null;
    } | null;
    wishlistItem?: {
      id: number;
      title: string;
      fundingStatus?: string;
    } | null;
  } | null;
}

export interface MyPaymentsResponse {
  items: MyPaymentItem[];
  total: number;
  summary?: {
    totalCount: number;
    succeededCount: number;
    pendingCount: number;
    failedCount: number;
    totalSucceededAmount: number;
    currencyCode?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class MyPaymentsService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  getMine(): Observable<MyPaymentsResponse> {
    return this.http
      .get<ApiResponse<MyPaymentsResponse>>(`${this.apiUrl}/payments/me`)
      .pipe(map((response) => response.data));
  }

  getOne(id: number): Observable<MyPaymentItem> {
    return this.http
      .get<ApiResponse<MyPaymentItem>>(`${this.apiUrl}/payments/${id}`)
      .pipe(map((response) => response.data));
  }
}