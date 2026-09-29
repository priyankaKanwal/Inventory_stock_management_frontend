import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { SessionService } from '../services/session.service';
import { getAccessToken } from '../utils/auth-state';

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

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const session = inject(SessionService);
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

      return session.refresh().pipe(
        // catchError sits above switchMap on purpose: it wraps the refresh call
        // and nothing else. Downstream of the replay it used to catch the failed
        // request's own error too, which ended the session and threw away the
        // token the refresh had just produced.
        catchError((refreshError) => {
          router.navigate(['/login'], {
            queryParams: {
              returnUrl: router.url,
              reason: 'session-changed'
            }
          });

          return throwError(() => refreshError);
        }),
        // Shared across every request that 401ed at the same time, so parallel
        // loads are all replayed against the new token rather than failing.
        switchMap((newToken) => next(withBearer(req, newToken)))
      );
    })
  );
};
