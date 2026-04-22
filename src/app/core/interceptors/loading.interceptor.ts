import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';

import { LoadingService } from '../services/loading.service';
import { SKIP_GLOBAL_LOADER } from '../http/http-context-tokens';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);
  const skip = req.context.get(SKIP_GLOBAL_LOADER);

  if (!skip) {
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!skip) {
        loadingService.hide();
      }
    }),
  );
};