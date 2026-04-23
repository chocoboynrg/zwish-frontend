import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type PaymentStatus = 'INITIATED' | 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED' | 'EXPIRED';
export type PaymentProvider = 'CINETPAY' | 'FEDAPAY' | 'STRIPE' | 'OTHER';

export interface AdminPayment {
  id: number;
  provider: PaymentProvider;
  providerTransactionId: string | null;
  providerReference: string | null;
  paymentMethod: string;
  amount: number;
  currencyCode: string;
  status: PaymentStatus;
  paymentUrl: string | null;
  failureReason: string | null;
  initiatedAt: string | null;
  expiresAt: string | null;
  confirmedAt: string | null;
  failedAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
  payer: { id: number; name: string; email: string } | null;
  contribution: {
    id: number;
    status: string;
    amount: number;
    event: { id: number; title: string; eventDate: string } | null;
    wishlistItem: { id: number; title: string } | null;
  } | null;
}

export interface AdminPaymentDetail extends AdminPayment {
  rawProviderPayload: unknown;
  webhooks: {
    id: number;
    provider: string;
    externalStatus: string;
    resultingPaymentStatus: string | null;
    providerTransactionId: string | null;
    providerReference: string | null;
    failureReason: string | null;
    processedAt: string | null;
    createdAt: string;
  }[];
  checks: {
    paymentSucceededMatchesContribution: boolean;
    paymentExpiredConsistency: boolean;
    noOrphanSucceededPayment: boolean;
    noDuplicateSucceededWebhooks: boolean;
  };
}

export interface ReconciliationIssue {
  type: string;
  severity: 'high' | 'medium' | 'low';
  paymentId: number | null;
  contributionId: number | null;
  eventId: number | null;
  message: string;
  details?: Record<string, unknown>;
  createdAt: string | null;
}

export interface AdminPaymentsQuery {
  page?: number;
  limit?: number;
  status?: string;
  provider?: string;
  payerUserId?: number;
  eventId?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export interface AdminPaymentsResponse {
  items: AdminPayment[];
  total: number;
  summary: {
    page: number;
    limit: number;
    totalCount: number;
    succeededCount: number;
    pendingCount: number;
    failedCount: number;
    refundedCount: number;
  };
}

export interface ReconciliationResponse {
  items: ReconciliationIssue[];
  total: number;
  summary: {
    page: number;
    limit: number;
    totalCount: number;
    highSeverityCount: number;
    mediumSeverityCount: number;
    lowSeverityCount: number;
    paymentWebhookMismatchCount: number;
    contributionMismatchCount: number;
    orphanSuccessCount: number;
    expiredPendingAnomalyCount: number;
    duplicateWebhookSignalsCount: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminPaymentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/payments`;

  getPayments(query: AdminPaymentsQuery = {}): Observable<AdminPaymentsResponse> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.status) params = params.set('status', query.status);
    if (query.provider) params = params.set('provider', query.provider);
    if (query.payerUserId) params = params.set('payerUserId', query.payerUserId);
    if (query.eventId) params = params.set('eventId', query.eventId);
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.order) params = params.set('order', query.order);

    return this.http
      .get<any>(`${this.base}/admin/all`, { params })
      .pipe(map((r) => ({ items: r.data.items, total: r.data.total, summary: r.data.summary })));
  }

  getPaymentById(id: number): Observable<AdminPaymentDetail> {
    return this.http
      .get<any>(`${this.base}/admin/${id}`)
      .pipe(map((r) => r.data.item));
  }

  refund(id: number, reason: string, note?: string): Observable<AdminPayment> {
    return this.http
      .patch<any>(`${this.base}/${id}/refund`, { reason, note })
      .pipe(map((r) => r.data.item));
  }

  getReconciliation(query: { page?: number; limit?: number; severity?: string; issueType?: string } = {}): Observable<ReconciliationResponse> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.severity) params = params.set('severity', query.severity);
    if (query.issueType) params = params.set('issueType', query.issueType);

    return this.http
      .get<any>(`${this.base}/admin/reconciliation`, { params })
      .pipe(map((r) => ({ items: r.data.items, total: r.data.total, summary: r.data.summary })));
  }

  exportCsv(query: AdminPaymentsQuery = {}): Observable<Blob> {
    let params = new HttpParams();
    if (query.status) params = params.set('status', query.status);
    if (query.provider) params = params.set('provider', query.provider);

    return this.http.get(`${this.base}/admin/export`, { params, responseType: 'blob' });
  }
}