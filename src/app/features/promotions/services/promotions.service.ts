import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type PromotionStatus = 'UPCOMING' | 'ACTIVE' | 'ENDED' | 'CANCELLED';

export interface PromotionProduct {
  id: number;
  name: string;
  slug: string;
  sellingPrice?: number | null;
  estimatedPrice: number;
  currencyCode: string;
  mainImageUrl?: string | null;
}

export interface Promotion {
  id: number;
  catalogProduct: PromotionProduct;
  catalogProductId: number;
  promoPrice: number;
  startsAt: string;
  endsAt: string;
  note: string | null;
  status: PromotionStatus;
  createdAt: string;
}

export interface CreatePromotionPayload {
  catalogProductId: number;
  promoPrice: number;
  startsAt: string;
  endsAt: string;
  note?: string;
}

@Injectable({ providedIn: 'root' })
export class PromotionsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/promotions`;

  getAll(status?: PromotionStatus, productId?: number): Observable<Promotion[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    if (productId) params = params.set('productId', productId);
    return this.http.get<any>(this.base, { params }).pipe(
      map(r => r?.data?.items ?? r?.data ?? r ?? []),
    );
  }

  create(payload: CreatePromotionPayload): Observable<Promotion> {
    return this.http.post<any>(this.base, payload).pipe(
      map(r => r?.data?.item ?? r?.data ?? r),
    );
  }

  end(id: number): Observable<Promotion> {
    return this.http.patch<any>(`${this.base}/${id}/end`, {}).pipe(
      map(r => r?.data?.item ?? r?.data ?? r),
    );
  }
}
