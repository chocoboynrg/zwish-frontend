import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ActionResponse,
  ItemResponse,
  ListResponse,
} from '../../../core/types/api-response.types';

export interface CreatePaymentPayload {
  contributionId: number;
  provider: string;
  paymentMethod: string;
}

export interface PaymentItem {
  id: number;
  provider: string;
  providerTransactionId: string | null;
  providerReference: string | null;
  paymentMethod: string;
  amount: number;
  currencyCode: string;
  status: string;
  paymentUrl: string | null;
  failureReason: string | null;
  initiatedAt: string | null;
  confirmedAt: string | null;
  failedAt: string | null;
  refundedAt: string | null;
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

@Injectable({
  providedIn: 'root',
})
export class UserPaymentService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  createPayment(payload: CreatePaymentPayload): Observable<PaymentItem> {
    return this.http
      .post<ItemResponse<PaymentItem>>(`${this.apiUrl}/payments`, payload)
      .pipe(map((response) => response.data.item));
  }

  getMyPayments(): Observable<PaymentItem[]> {
    return this.http
      .get<ListResponse<PaymentItem>>(`${this.apiUrl}/payments`)
      .pipe(map((res) => res.data.items));
  }

  getPayment(id: number): Observable<PaymentItem> {
    return this.http
      .get<ItemResponse<PaymentItem>>(`${this.apiUrl}/payments/${id}`)
      .pipe(map((response) => response.data.item));
  }

  markAsSucceeded(paymentId: number): Observable<PaymentItem> {
    return this.http
      .patch<ItemResponse<PaymentItem>>(
        `${this.apiUrl}/payments/${paymentId}/succeed`,
        {
          providerTransactionId: `tx_${paymentId}_${Date.now()}`,
          providerReference: `ref_${paymentId}_${Date.now()}`,
        },
      )
      .pipe(map((response) => response.data.item));
  }

  markAsFailed(paymentId: number): Observable<PaymentItem> {
    return this.http
      .patch<ItemResponse<PaymentItem>>(
        `${this.apiUrl}/payments/${paymentId}/fail`,
        {
          failureReason: 'Simulation échec utilisateur',
        },
      )
      .pipe(map((response) => response.data.item));
  }
}