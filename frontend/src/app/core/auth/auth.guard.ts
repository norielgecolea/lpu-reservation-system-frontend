import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from './auth.service';

/** Guards a route by validating the stored token against `/auth/me`. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  if (!auth.token()) {
    return router.parseUrl('/');
  }

  // Already validated this session — skip the round-trip.
  if (auth.user()) {
    return true;
  }

  return auth.me().pipe(
    map((res) => (res.success ? true : router.parseUrl('/'))),
    catchError(() => {
      auth.logout();
      return of(router.parseUrl('/'));
    }),
  );
};

/** Blocks auth pages (login) for an already-authenticated user. */
export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const dashboard = router.parseUrl('/dashboard');

  if (!auth.token()) {
    return true;
  }

  // Cached user — definitely authenticated.
  if (auth.user()) {
    return dashboard;
  }

  return auth.me().pipe(
    map((res) => (res.success ? dashboard : true)),
    catchError(() => {
      auth.logout();
      return of(true);
    }),
  );
};
