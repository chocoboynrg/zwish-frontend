import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ApiResponse,
  ListPayload,
  ItemPayload,
  ActionResponse,
} from '../../../core/types/api-response.types';

import {
  CatalogProduct,
  CatalogProductStatus,
} from '../models/catalog-product.model';
import { CatalogCategory } from '../models/catalog-category.model';

export interface CatalogProductsQuery {
  search?: string;
  categoryId?: number | null;
  page?: number;
  limit?: number;
  status?: CatalogProductStatus | null;
}

export interface CreateCatalogProductPayload {
  name: string;
  slug?: string;
  description?: string;
  mainImageUrl?: string;
  referenceUrl?: string;
  brand?: string;
  estimatedPrice: number;
  currencyCode?: string;
  status?: CatalogProductStatus;
  categoryId?: number | null;
}

export interface UpdateCatalogProductPayload {
  name?: string;
  slug?: string;
  description?: string;
  mainImageUrl?: string;
  referenceUrl?: string;
  brand?: string;
  estimatedPrice?: number;
  currencyCode?: string;
  status?: CatalogProductStatus;
  categoryId?: number | null;
}

export interface CreateCatalogCategoryPayload {
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateCatalogCategoryPayload {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
}

export interface UploadImageResponse {
  success: boolean;
  url: string;
  message?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/catalog`;
  private readonly productsUrl = `${this.baseUrl}/products`;
  private readonly categoriesUrl = `${this.baseUrl}/categories`;

  getProducts(
    search?: string,
    status?: CatalogProductStatus,
  ): Observable<CatalogProduct[]> {
    let params = new HttpParams();

    if (search?.trim()) {
      params = params.set('search', search.trim());
    }

    if (status) {
      params = params.set('status', status);
    }

    return this.http
      .get<ApiResponse<ListPayload<CatalogProduct>>>(this.productsUrl, { params })
      .pipe(map((response) => response.data.items ?? []));
  }

  listProducts(query?: CatalogProductsQuery): Observable<CatalogProduct[]> {
    let params = new HttpParams();

    if (query?.search?.trim()) {
      params = params.set('search', query.search.trim());
    }

    if (query?.categoryId != null) {
      params = params.set('categoryId', String(query.categoryId));
    }

    if (query?.page != null) {
      params = params.set('page', String(query.page));
    }

    if (query?.limit != null) {
      params = params.set('limit', String(query.limit));
    }

    if (query?.status) {
      params = params.set('status', query.status);
    }

    return this.http
      .get<ApiResponse<ListPayload<CatalogProduct>>>(this.productsUrl, { params })
      .pipe(map((response) => response.data.items ?? []));
  }

  getProductById(productId: number): Observable<CatalogProduct> {
    return this.http
      .get<ApiResponse<ItemPayload<CatalogProduct>>>(`${this.productsUrl}/${productId}`)
      .pipe(map((response) => response.data.item));
  }

  getProduct(productId: number): Observable<CatalogProduct> {
    return this.getProductById(productId);
  }

  createProduct(payload: CreateCatalogProductPayload): Observable<unknown> {
    return this.http
      .post<ActionResponse>(this.productsUrl, payload)
      .pipe(map((response) => response.data));
  }

  updateProduct(
    productId: number,
    payload: UpdateCatalogProductPayload,
  ): Observable<unknown> {
    return this.http
      .patch<ActionResponse>(`${this.productsUrl}/${productId}`, payload)
      .pipe(map((response) => response.data));
  }

  deleteProduct(productId: number): Observable<unknown> {
    return this.http
      .delete<ActionResponse>(`${this.productsUrl}/${productId}`)
      .pipe(map((response) => response.data));
  }

  uploadImage(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http
      .post<UploadImageResponse>(`${this.baseUrl}/upload`, formData)
      .pipe(
        map((response) => {
          const rawUrl = response?.url ?? '';

          if (!rawUrl) {
            throw new Error('URL image manquante dans la réponse upload');
          }

          if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
            return rawUrl;
          }

          const apiBase = environment.apiBaseUrl.replace(/\/api$/, '');
          return `${apiBase}${rawUrl}`;
        }),
      );
  }

  getCategories(): Observable<CatalogCategory[]> {
    return this.http
      .get<ApiResponse<ListPayload<CatalogCategory>>>(this.categoriesUrl)
      .pipe(map((response) => response.data.items ?? []));
  }

  createCategory(payload: CreateCatalogCategoryPayload): Observable<unknown> {
    return this.http
      .post<ActionResponse>(this.categoriesUrl, payload)
      .pipe(map((response) => response.data));
  }

  updateCategory(
    categoryId: number,
    payload: UpdateCatalogCategoryPayload,
  ): Observable<unknown> {
    return this.http
      .patch<ActionResponse>(`${this.categoriesUrl}/${categoryId}`, payload)
      .pipe(map((response) => response.data));
  }

  deleteCategory(categoryId: number): Observable<unknown> {
    return this.http
      .delete<ActionResponse>(`${this.categoriesUrl}/${categoryId}`)
      .pipe(map((response) => response.data));
  }
}