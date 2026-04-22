import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { TokenStorageService } from '../services/token-storage.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenStorage = inject(TokenStorageService);
  const token = tokenStorage.getToken();

  if (!token) {
    return next(req);
  }

  if (
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register')||
    req.url.includes('/auth/verify-email') ||
    req.url.includes('/auth/resend-verification')
  ) {
    return next(req);
  }

  return next(
    req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  );
};