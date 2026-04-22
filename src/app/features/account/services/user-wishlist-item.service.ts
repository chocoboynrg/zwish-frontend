import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ActionResponse } from '../../../core/types/api-response.types';

export interface CreateWishlistItemPayload {
  wishlistId: number;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserWishlistItemService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/wishlist-items`;

  createWishlistItem(payload: CreateWishlistItemPayload): Observable<unknown> {
    return this.http
      .post<ActionResponse>(this.baseUrl, payload)
      .pipe(map((response) => response.data));
  }

  deleteWishlistItem(id: number): Observable<void> {
  return this.http.delete<void>(`${this.baseUrl}/wishlist-items/${id}`);
}
}