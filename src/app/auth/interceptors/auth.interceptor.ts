import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService, RefreshResponse } from '../../services/auth.service';
import {
  clearSession,
  getAccessToken,
  updateAccessToken
} from '../utils/auth-state';

const AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout'
];

function isAuthEndpoint(url: string): boolean {
  return AUTH_PATHS.some((path) => url.includes(path));
}

function withCredentials(req: HttpRequest<unknown>): HttpRequest<unknown> {
  return req.clone({ withCredentials: true });
}

function withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    withCredentials: true,
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

// Guards against parallel 401s triggering duplicate refresh calls.
let refreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const authEndpoint = isAuthEndpoint(req.url);
  const token = getAccessToken();

  const authorized = token && !authEndpoint
    ? withBearer(req, token)
    : withCredentials(req);

  return next(authorized).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || authEndpoint) {
        return throwError(() => error);
      }

      if (refreshing) {
        return throwError(() => error);
      }

      refreshing = true;

      return authService.refreshToken().pipe(
        switchMap((response: RefreshResponse) => {
          refreshing = false;

          // A rotated token that carries a different role, or is unusable,
          // means this session can no longer be trusted to describe itself.
          // End it and let the user sign in again.
          if (!updateAccessToken(response.access_token)) {
            clearSession();
            router.navigate(['/login'], {
              queryParams: { reason: 'session-changed' }
            });

            return throwError(() => new Error('Session is no longer valid.'));
          }

          // Replay the original request with the freshly rotated token.
          return next(withBearer(req, response.access_token));
        }),
        catchError((refreshError) => {
          refreshing = false;

          clearSession();
          router.navigate(['/login']);

          return throwError(() => refreshError);
        })
      );
    })
  );
};