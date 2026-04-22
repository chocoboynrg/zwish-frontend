import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  ActionResponse,
  ItemResponse,
} from '../../../core/types/api-response.types';
import { TokenStorageService } from '../../../core/services/token-storage.service';

export interface CreateUserProductRequestPayload {
  wishlistId: number;
  name: string;
  estimatedPrice: number;
  description: string | null;
  currencyCode: string;
}

type ProductRequestApiResponse =
  | ItemResponse<Record<string, unknown>>
  | ActionResponse<Record<string, unknown>>;

@Injectable({
  providedIn: 'root',
})
export class UserProductRequestService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;
  private readonly tokenStorage = inject(TokenStorageService);

  createProductRequest(
    payload: CreateUserProductRequestPayload,
  ): Observable<Record<string, unknown>> {
    const token = this.tokenStorage.getToken();

    return this.http
      .post<ProductRequestApiResponse>(
        `${this.apiUrl}/product-requests`,
        payload,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : undefined,
        },
      )
      .pipe(
        map((response): Record<string, unknown> => {
          const data = response.data as Record<string, unknown> & {
            item?: Record<string, unknown>;
          };

          return data.item ?? data;
        }),
      );
  }
}
