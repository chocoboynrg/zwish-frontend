import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TokenStorageService } from '../services/token-storage.service';
import { CurrentUser } from '../models/current-user.model';

export const authGuard: CanActivateFn = () => {
  const tokenStorage = inject(TokenStorageService);
  const router = inject(Router);

  if (!tokenStorage.isAuthenticated()) {
    return router.createUrlTree(['/login']);
  }

  const user = tokenStorage.getUser() as (CurrentUser & {
    emailVerified?: boolean;
  }) | null;

  if (!user) {
    return router.createUrlTree(['/login']);
  }

  if (user.emailVerified === false) {
    return router.createUrlTree(['/check-email'], {
      queryParams: { email: user.email },
    });
  }

  return true;
};