import { Injectable } from '@angular/core';
import { CurrentUser } from '../models/current-user.model';

const ACCESS_TOKEN_KEY = 'wishlist_access_token';
const USER_KEY = 'wishlist_current_user';

@Injectable({
  providedIn: 'root',
})
export class TokenStorageService {
  getToken(): string | null {
    const raw = localStorage.getItem(ACCESS_TOKEN_KEY);

    if (!raw || raw === 'undefined' || raw === 'null') {
      return null;
    }

    return raw;
  }

  setToken(token: string): void {
    if (!token || token === 'undefined' || token === 'null') {
      this.removeToken();
      return;
    }

    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }

  removeToken(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  }

  getUser(): CurrentUser | null {
    const raw = localStorage.getItem(USER_KEY);

    if (!raw || raw === 'undefined' || raw === 'null') {
      return null;
    }

    try {
      const parsed = JSON.parse(raw) as Partial<CurrentUser>;

      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        typeof parsed.id !== 'number' ||
        typeof parsed.name !== 'string' ||
        typeof parsed.email !== 'string' ||
        typeof parsed.platformRole !== 'string'
      ) {
        this.removeUser();
        return null;
      }

      return parsed as CurrentUser;
    } catch {
      this.removeUser();
      return null;
    }
  }

  setUser(user: CurrentUser | null | undefined): void {
    if (!user) {
      this.removeUser();
      return;
    }

    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  removeUser(): void {
    localStorage.removeItem(USER_KEY);
  }

  clear(): void {
    this.removeToken();
    this.removeUser();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}