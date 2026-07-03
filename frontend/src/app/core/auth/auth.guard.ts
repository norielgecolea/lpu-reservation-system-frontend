import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';

import { AuthService } from './auth.service';

/** Guards a route by validating the stored token against `/auth/me`. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.token();

  // 1. No token: block immediately.
  if (!token) {
    return router.parseUrl('/login');
  }

  // 2. Validate session with backend.
  return auth.me().pipe(
    map((res) => {
      if (res.success) {
        return true;
      }
      auth.logout();
      return router.parseUrl('/login');
    }),
    catchError(() => {
      auth.logout();
      return of(router.parseUrl('/login'));
    }),
  );
};

/** Guards /facilities/* routes — requires FACILITIESADMIN (or SUPERADMIN) role. */
export const facilitiesGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  if (!auth.token()) return router.parseUrl('/login');

  const validate = (role: string | undefined) => {
    if (role === 'FACILITIESADMIN' || role === 'SUPERADMIN') return true;
    return router.parseUrl('/login');
  };

  if (auth.user()) return validate(auth.user()?.role);

  return auth.me().pipe(
    map((res) => validate(res.success ? auth.user()?.role : undefined)),
    catchError(() => { auth.logout(); return of(router.parseUrl('/login')); }),
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
