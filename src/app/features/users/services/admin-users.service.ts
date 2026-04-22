import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  platformRole: 'USER' | 'ADMIN' | 'SUPER_ADMIN';
  phoneNumber: string | null;
  emailVerifiedAt: string | null;
  isSuspended: boolean;
  suspendedAt: string | null;
  suspensionReason: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUserDetail extends AdminUser {
  summary: {
    organizedEventsCount: number;
    contributionsCount: number;
    paymentsCount: number;
    reservationsCount: number;
  };
  // Le backend retourne ces noms exacts
  organizedEvents: { id: number; title: string; eventDate: string; description: string | null }[];
  latestContributions: { id: number; amount: number; status: string; currencyCode: string; wishlistItem: { id: number; name: string } | null; event: { id: number; title: string } | null }[];
  latestPayments: { id: number; amount: number; status: string; provider: string; currencyCode: string }[];
  latestReservations: { id: number; status: string; wishlistItem: { id: number; name: string } | null; event: { id: number; title: string } | null }[];
  latestAuditLogs: { id: number; action: string; entityType: string; createdAt: string }[];
}

export interface AdminUsersQuery {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  verified?: boolean;
  suspended?: boolean;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export interface AdminUsersResponse {
  items: AdminUser[];
  total: number;
  summary: {
    page: number;
    limit: number;
    totalCount: number;
    verifiedCount: number;
    unverifiedCount: number;
    suspendedCount: number;
    activeCount: number;
    withPhoneCount: number;
    withoutPhoneCount: number;
  };
}

@Injectable({ providedIn: 'root' })
export class AdminUsersService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/users`;

  getUsers(query: AdminUsersQuery = {}): Observable<AdminUsersResponse> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.search) params = params.set('search', query.search);
    if (query.role) params = params.set('role', query.role);
    if (query.verified !== undefined) params = params.set('verified', query.verified);
    if (query.suspended !== undefined) params = params.set('suspended', query.suspended);
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.order) params = params.set('order', query.order);

    return this.http
      .get<any>(`${this.base}/admin/all`, { params })
      .pipe(map((r) => r.data));
  }

  getUserById(id: number): Observable<AdminUserDetail> {
    return this.http
      .get<any>(`${this.base}/admin/${id}`)
      // Le backend enveloppe dans data.item
      .pipe(map((r) => r.data.item));
  }

  suspend(id: number, reason: string): Observable<AdminUser> {
    return this.http
      .patch<any>(`${this.base}/admin/${id}/suspend`, { reason })
      .pipe(map((r) => r.data.item));
  }

  unsuspend(id: number): Observable<AdminUser> {
    return this.http
      .patch<any>(`${this.base}/admin/${id}/unsuspend`, {})
      .pipe(map((r) => r.data.item));
  }

  updateRole(id: number, role: string): Observable<AdminUser> {
    return this.http
      .patch<any>(`${this.base}/admin/${id}/role`, { role })
      .pipe(map((r) => r.data.item));
  }

  exportCsv(query: AdminUsersQuery = {}): Observable<Blob> {
    let params = new HttpParams();
    if (query.role) params = params.set('role', query.role);
    if (query.verified !== undefined) params = params.set('verified', query.verified);
    if (query.suspended !== undefined) params = params.set('suspended', query.suspended);
    if (query.search) params = params.set('search', query.search);

    return this.http.get(`${this.base}/admin/export`, {
      params,
      responseType: 'blob',
    });
  }
}