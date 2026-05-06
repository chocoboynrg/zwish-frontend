import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ApiResponse, ListPayload } from '../../../core/types/api-response.types';
import {
  CatalogDeliveryOption,
  CreateCatalogDeliveryOptionPayload,
  UpdateCatalogDeliveryOptionPayload,
  DeliverySelection,
} from '../models/delivery-option.model';

@Injectable({ providedIn: 'root' })
export class DeliveryOptionsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/delivery-options`;

  getCatalogOptions(includeInactive = false): Observable<CatalogDeliveryOption[]> {
    let params = new HttpParams();
    if (includeInactive) params = params.set('includeInactive', 'true');
    return this.http
      .get<ApiResponse<ListPayload<CatalogDeliveryOption>>>(`${this.base}/catalog`, { params })
      .pipe(map((r) => r.data.items));
  }

  createCatalogOption(payload: CreateCatalogDeliveryOptionPayload): Observable<CatalogDeliveryOption> {
    return this.http
      .post<ApiResponse<{ item: CatalogDeliveryOption }>>(`${this.base}/catalog`, payload)
      .pipe(map((r) => r.data.item));
  }

  updateCatalogOption(id: number, payload: UpdateCatalogDeliveryOptionPayload): Observable<CatalogDeliveryOption> {
    return this.http
      .patch<ApiResponse<{ item: CatalogDeliveryOption }>>(`${this.base}/catalog/${id}`, payload)
      .pipe(map((r) => r.data.item));
  }

  deleteCatalogOption(id: number): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.base}/catalog/${id}`)
      .pipe(map(() => undefined));
  }

  getItemOptions(wishlistItemId: number): Observable<{ allOptions: CatalogDeliveryOption[]; enabledOptionIds: number[] }> {
    return this.http
      .get<ApiResponse<{ allOptions: CatalogDeliveryOption[]; enabledOptionIds: number[] }>>(`${this.base}/item/${wishlistItemId}`)
      .pipe(map((r) => r.data));
  }

  setItemOptions(wishlistItemId: number, catalogOptionIds: number[]): Observable<void> {
    return this.http
      .put<ApiResponse<unknown>>(`${this.base}/item/${wishlistItemId}`, { catalogOptionIds })
      .pipe(map(() => undefined));
  }

  getSelection(wishlistItemId: number): Observable<DeliverySelection | null> {
    return this.http
      .get<ApiResponse<{ selection: DeliverySelection | null }>>(`${this.base}/selection/${wishlistItemId}`)
      .pipe(map((r) => r.data.selection));
  }

  createSelection(wishlistItemId: number, selectedOptionIds: number[], textValues?: Record<number, string>): Observable<DeliverySelection> {
    return this.http
      .post<ApiResponse<{ selection: DeliverySelection }>>(`${this.base}/selection/${wishlistItemId}`, {
        selectedOptionIds,
        textValues,
      })
      .pipe(map((r) => r.data.selection));
  }

  skipSelection(wishlistItemId: number): Observable<DeliverySelection> {
    return this.http
      .post<ApiResponse<{ selection: DeliverySelection }>>(`${this.base}/selection/${wishlistItemId}/skip`, {})
      .pipe(map((r) => r.data.selection));
  }
}
