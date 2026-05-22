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
  PendingDeliverySelection,
  FundingDeliveryRule,
  FundingDeliveryRulePayload,
  PendingAdminDeliveryRow,
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

  setItemOptions(wishlistItemId: number, optionIds: number[]): Observable<void> {
    return this.http
      .put<ApiResponse<unknown>>(`${this.base}/item/${wishlistItemId}`, { optionIds })
      .pipe(map(() => undefined));
  }

  getSelection(wishlistItemId: number): Observable<DeliverySelection | null> {
    return this.http
      .get<ApiResponse<{ item: DeliverySelection | null }>>(`${this.base}/selection/${wishlistItemId}`)
      .pipe(map((r) => r.data.item));
  }

  createSelection(wishlistItemId: number, selectedOptionIds: number[], textValues?: Record<number, string>): Observable<DeliverySelection> {
    const selectedOptions = selectedOptionIds.map((id) => ({
      catalogDeliveryOptionId: id,
      ...(textValues?.[id] ? { textValue: textValues[id] } : {}),
    }));
    return this.http
      .post<ApiResponse<{ item: DeliverySelection }>>(`${this.base}/selection/${wishlistItemId}`, { selectedOptions })
      .pipe(map((r) => r.data.item));
  }

  skipSelection(wishlistItemId: number): Observable<DeliverySelection> {
    return this.http
      .post<ApiResponse<{ item: DeliverySelection }>>(`${this.base}/selection/${wishlistItemId}/skip`, {})
      .pipe(map((r) => r.data.item));
  }

  getPendingSelections(): Observable<PendingDeliverySelection[]> {
    return this.http
      .get<ApiResponse<{ items: PendingDeliverySelection[] }>>(`${this.base}/admin/pending`)
      .pipe(map((r) => r.data.items));
  }

  getDeliveryRules(wishlistItemId: number): Observable<FundingDeliveryRule[]> {
    return this.http
      .get<ApiResponse<{ rules: FundingDeliveryRule[] }>>(`${this.base}/item/${wishlistItemId}/delivery-rules`)
      .pipe(map((r) => r.data.rules));
  }

  setDeliveryRules(wishlistItemId: number, rules: FundingDeliveryRulePayload[]): Observable<FundingDeliveryRule[]> {
    return this.http
      .put<ApiResponse<{ rules: FundingDeliveryRule[] }>>(`${this.base}/item/${wishlistItemId}/delivery-rules`, { rules })
      .pipe(map((r) => r.data.rules));
  }

  getPendingAdminDeliveryDates(): Observable<PendingAdminDeliveryRow[]> {
    return this.http
      .get<ApiResponse<{ items: PendingAdminDeliveryRow[] }>>(`${this.base}/admin/pending-delivery-date`)
      .pipe(map((r) => r.data.items));
  }

  setAdminDeliveryDate(wishlistItemId: number, deliveryDate: string): Observable<DeliverySelection> {
    return this.http
      .patch<ApiResponse<{ item: DeliverySelection }>>(`${this.base}/item/${wishlistItemId}/scheduled-delivery-date`, { deliveryDate })
      .pipe(map((r) => r.data.item));
  }
}
