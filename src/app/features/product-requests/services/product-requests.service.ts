import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  ProductRequest,
  ProductRequestStatus,
} from '../models/product-request.model';

@Injectable({
  providedIn: 'root',
})
export class ProductRequestsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/product-requests`;

  create(payload: {
    wishlistId: number;
    name: string;
    description?: string | null;
    imageUrl?: string | null;
    referenceUrl?: string | null;
    estimatedPrice?: number | null;
    currencyCode?: string;
    categoryId?: number;
  }): Observable<ProductRequest> {
    return this.http.post<ProductRequest>(this.baseUrl, payload);
  }

  getAll(status?: ProductRequestStatus): Observable<ProductRequest[]> {
    let params = new HttpParams();

    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<ProductRequest[]>(this.baseUrl, { params });
  }

  getByWishlist(wishlistId: number): Observable<ProductRequest[]> {
    return this.http.get<ProductRequest[]>(
      `${this.baseUrl}/wishlist/${wishlistId}`,
    );
  }

  review(
    id: number,
    payload: {
      status: ProductRequestStatus;
      reviewComment?: string;
      categoryId?: number;
      approvedCatalogProductId?: number;
      approvedProductName?: string;
      approvedProductSlug?: string;
    },
  ): Observable<ProductRequest> {
    return this.http.patch<ProductRequest>(
      `${this.baseUrl}/${id}/review`,
      payload,
    );
  }

  publish(
    id: number,
    payload: {
      name?: string;
      price?: number;
      quantity?: number;
    },
  ): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${id}/publish`, payload);
  }
}