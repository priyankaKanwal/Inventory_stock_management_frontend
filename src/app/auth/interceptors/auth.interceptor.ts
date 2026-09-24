import {
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpRequest
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';

import { AuthService } from '../../services/auth.service';

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
  const token = authService.getToken();

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
        switchMap((response: { access_token: string }) => {
          refreshing = false;

          authService.setToken(response.access_token);

          // Replay the original request with the freshly rotated token.
          return next(withBearer(req, response.access_token));
        }),
        catchError((refreshError) => {
          refreshing = false;

          authService.clearSession();
          router.navigate(['/login']);

          return throwError(() => refreshError);
        })
      );
    })
  );
};