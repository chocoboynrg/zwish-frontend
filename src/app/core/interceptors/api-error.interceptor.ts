import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { ToastService } from '../services/toast.service';
import { ApiErrorService } from '../services/api-error.service';
import { SKIP_GLOBAL_ERROR_TOAST } from '../http/http-context-tokens';
import { TokenStorageService } from '../services/token-storage.service';

export const apiErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const toastService = inject(ToastService);
  const apiErrorService = inject(ApiErrorService);
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  const skipToast = req.context.get(SKIP_GLOBAL_ERROR_TOAST);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        if (!skipToast) {
          toastService.error('Erreur réseau.');
        }

        return throwError(() => error);
      }

      if (error.status === 401) {
        tokenStorage.clear();

        if (!skipToast) {
          toastService.error('Votre session a expiré. Veuillez vous reconnecter.');
        }

        router.navigate(['/login']);
        return throwError(() => error);
      }

      if (!skipToast) {
        const message = apiErrorService.getUserMessage(error);
        toastService.error(message);
      }

      return throwError(() => error);
    }),
  );
};