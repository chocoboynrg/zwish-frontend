import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../types/api-response.types';
import { TokenStorageService } from './token-storage.service';
import { CurrentUser } from '../models/current-user.model';
import { switchMap } from 'rxjs/operators';
import { SKIP_GLOBAL_ERROR_TOAST } from '../http/http-context-tokens';

export interface LoginItem {
  accessToken: string;
  user: CurrentUser;
}

interface LoginResponseData {
  item: {
    accessToken: string;
    user: CurrentUser;
  };
}

interface MeResponseData {
  item: CurrentUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly currentUserSubject = new BehaviorSubject<CurrentUser | null>(
    this.tokenStorage.getUser(),
  );

  readonly currentUser$ = this.currentUserSubject.asObservable();

  login(payload: { email: string; password: string; }): Observable<LoginItem> {
    return this.http
      .post<ApiResponse<LoginResponseData>>(
        `${environment.apiBaseUrl}/auth/login`,
        payload,
      )
      .pipe(
        map((response) => {
          const item: LoginItem = {
            accessToken: response.data.item.accessToken,  // ← était response.data.accessToken
            user: response.data.item.user,                // ← était response.data.user
          };

          this.tokenStorage.setToken(item.accessToken);
          this.tokenStorage.setUser(item.user);
          this.currentUserSubject.next(item.user);

          return item;
        }),
      );
  }

  me(): Observable<CurrentUser | null> {
    const token = this.tokenStorage.getToken();

    if (!token) {
      this.currentUserSubject.next(null);
      return of(null);
    }

    return this.http
      .get<ApiResponse<MeResponseData>>(`${environment.apiBaseUrl}/auth/me`, {
      context: new HttpContext().set(SKIP_GLOBAL_ERROR_TOAST, true),
    })
      .pipe(
        map((response) => response.data.item),
        tap((user) => {
          this.tokenStorage.setUser(user);
          this.currentUserSubject.next(user);
        }),
        catchError(() => {
          this.logout();
          return of(null);
        }),
      );
  }

  register(payload: {
    email: string;
    password: string;
    name: string;
    phone?: string;
  }): Observable<void> {
    const body: Record<string, unknown> = {
      email: payload.email,
      password: payload.password,
      name: payload.name,
    };

    if (payload.phone) {
      body['phone'] = payload.phone;
    }

    return this.http
      .post<ApiResponse<unknown>>(
        `${environment.apiBaseUrl}/auth/register`,
        body,
      )
      .pipe(map(() => void 0));
  }

  resendVerification(email: string): Observable<void> {
    return this.http
      .post<ApiResponse<unknown>>(
        `${environment.apiBaseUrl}/auth/resend-verification`,
        { email },
      )
      .pipe(map(() => void 0));
  }

  verifyEmail(token: string): Observable<string> {
    return this.http
      .post<ApiResponse<unknown>>(
        `${environment.apiBaseUrl}/auth/verify-email`,
        { token },
      )
      .pipe(
        map((response) => response.message || 'Email vérifié avec succès.'),
      );
  }

  logout(): void {
    this.tokenStorage.clear();
    this.currentUserSubject.next(null);
  }

  getCurrentUserSnapshot(): CurrentUser | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.tokenStorage.getToken();
  }

  hasAdminRole(): boolean {
    const user = this.getCurrentUserSnapshot();

    if (!user) return false;

    return (
      user.platformRole === 'ADMIN' ||
      user.platformRole === 'SUPER_ADMIN'
    );
  }
}
