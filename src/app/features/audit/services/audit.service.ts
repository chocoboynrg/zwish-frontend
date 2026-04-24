import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  entityType: string | null;
  entityId: number | null;
  metadata: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

export interface AuditLogsQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
  action?: string;
  entityType?: string;
  entityId?: number;
  userId?: number;
  from?: string;
  to?: string;
  search?: string;
}

export interface AuditLogsResponse {
  items: AuditLog[];
  total: number;
  summary: { page: number; limit: number; totalCount: number };
}

@Injectable({ providedIn: 'root' })
export class AuditAdminService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/audit`;

  getLogs(query: AuditLogsQuery = {}): Observable<AuditLogsResponse> {
    let params = new HttpParams();
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.sortBy) params = params.set('sortBy', query.sortBy);
    if (query.order) params = params.set('order', query.order);
    if (query.action) params = params.set('action', query.action);
    if (query.entityType) params = params.set('entityType', query.entityType);
    if (query.entityId) params = params.set('entityId', query.entityId);
    if (query.userId) params = params.set('userId', query.userId);
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.search) params = params.set('search', query.search);

    return this.http
      .get<any>(`${this.base}/admin/logs`, { params })
      .pipe(map((r) => r.data));
  }

  getLogById(id: number): Observable<AuditLog> {
    return this.http
      .get<any>(`${this.base}/admin/logs/${id}`)
      .pipe(map((r) => r.data.item));
  }

  exportCsv(query: AuditLogsQuery = {}): Observable<Blob> {
    let params = new HttpParams();
    if (query.action) params = params.set('action', query.action);
    if (query.entityType) params = params.set('entityType', query.entityType);
    if (query.entityId) params = params.set('entityId', query.entityId);
    if (query.userId) params = params.set('userId', query.userId);
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.search) params = params.set('search', query.search);

    return this.http.get(`${this.base}/admin/export`, {
      params,
      responseType: 'blob',
    });
  }
}