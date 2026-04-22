import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

import { environment } from '../../../../environments/environment';
import { ItemResponse } from '../../../core/types/api-response.types';

export interface CreateUserContributionPayload {
  wishlistItemId: number;
  amount: number;
  currencyCode?: string;
  isAnonymous?: boolean;
  message?: string | null;
}

export interface CreateUserContributionResponse {
  id: number;
  amount: number;
  currencyCode: string;
  status: string;
  isAnonymous: boolean;
  message: string | null;
  confirmedAt: string | null;
  createdAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserContributionService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiBaseUrl;

  createContribution(
    payload: CreateUserContributionPayload,
  ): Observable<CreateUserContributionResponse> {
    return this.http
      .post<ItemResponse<CreateUserContributionResponse>>(
        `${this.apiUrl}/contributions`,
        payload,
      )
      .pipe(map((res) => res.data.item));
  }
}
