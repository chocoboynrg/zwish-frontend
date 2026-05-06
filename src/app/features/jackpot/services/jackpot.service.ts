// src/app/features/jackpot/services/jackpot.service.ts

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Jackpot, CreateJackpotDto, JackpotStatus } from '../models/jackpot.model';
import { SKIP_GLOBAL_ERROR_TOAST } from '../../../core/http/http-context-tokens';

interface ApiResp<T> { success: boolean; message: string; data: T; }
interface ListData<T> { items: T[]; total: number; }
interface ItemData<T> { item: T; }

@Injectable({ providedIn: 'root' })
export class JackpotService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/jackpot`;

  // USER
  create(dto: CreateJackpotDto): Observable<Jackpot> {
    return this.http.post<ApiResp<ItemData<Jackpot>>>(this.base, dto)
      .pipe(map(r => r.data.item));
  }
  getMine(): Observable<Jackpot[]> {
    return this.http.get<ApiResp<ListData<Jackpot>>>(`${this.base}/mine`)
      .pipe(map(r => r.data.items));
  }
  getByShareToken(token: string): Observable<Jackpot> {
    return this.http.get<ApiResp<ItemData<Jackpot>>>(`${this.base}/share/${token}`, {
      context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
    }).pipe(map(r => r.data.item));
  }
  getPublicActive(): Observable<Jackpot[]> {
    return this.http.get<ApiResp<ListData<Jackpot>>>(`${this.base}/public`, {
      context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
    }).pipe(map(r => r.data.items));
  }
  getOne(id: number): Observable<Jackpot> {
    return this.http.get<ApiResp<ItemData<Jackpot>>>(`${this.base}/${id}`)
      .pipe(map(r => r.data.item));
  }
  close(id: number): Observable<Jackpot> {
    return this.http.patch<ApiResp<ItemData<Jackpot>>>(`${this.base}/${id}/close`, {})
      .pipe(map(r => r.data.item));
  }

  // ADMIN
  getAll(status?: JackpotStatus): Observable<Jackpot[]> {
    const q = status ? `?status=${status}` : '';
    return this.http.get<ApiResp<ListData<Jackpot>>>(`${this.base}${q}`)
      .pipe(map(r => r.data.items));
  }
  review(id: number, status: 'APPROVED' | 'REJECTED', reviewComment?: string): Observable<Jackpot> {
    return this.http.patch<ApiResp<ItemData<Jackpot>>>(`${this.base}/${id}/review`, { status, reviewComment })
      .pipe(map(r => r.data.item));
  }
}