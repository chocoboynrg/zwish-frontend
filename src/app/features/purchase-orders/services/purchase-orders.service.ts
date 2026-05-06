import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { ApiResponse } from '../../../core/types/api-response.types';
import { PurchaseOrder, PurchaseOrderStatus } from '../models/purchase-order.model';

@Injectable({ providedIn: 'root' })
export class PurchaseOrdersService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/purchase-orders`;

  getAll(status?: PurchaseOrderStatus): Observable<PurchaseOrder[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    return this.http
      .get<ApiResponse<{ items: PurchaseOrder[] }>>(this.baseUrl, { params })
      .pipe(map((r) => r.data.items));
  }

  getOne(id: number): Observable<PurchaseOrder> {
    return this.http
      .get<ApiResponse<{ item: PurchaseOrder }>>(`${this.baseUrl}/${id}`)
      .pipe(map((r) => r.data.item));
  }

  updateStatus(
    id: number,
    payload: { status: PurchaseOrderStatus; adminNotes?: string },
  ): Observable<PurchaseOrder> {
    return this.http
      .patch<ApiResponse<{ item: PurchaseOrder }>>(`${this.baseUrl}/${id}/status`, payload)
      .pipe(map((r) => r.data.item));
  }
}
