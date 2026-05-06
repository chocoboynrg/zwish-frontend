import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/types/api-response.types';

export interface PaymentItem {
  id: number;
  provider: string;
  paymentMethod: string;
  amount: number;
  currencyCode: string;
  status: string;
  paymentUrl: string | null;
  initiatedAt: string | null;
  expiresAt: string | null;
  confirmedAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class PaymentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/payments`;

  initDeliveryPayment(selectionId: number, provider: string, paymentMethod: string): Observable<PaymentItem> {
    return this.http
      .post<ApiResponse<{ item: PaymentItem }>>(`${this.base}/delivery/${selectionId}/init`, {
        provider,
        paymentMethod,
      })
      .pipe(map((r) => r.data.item));
  }
}
