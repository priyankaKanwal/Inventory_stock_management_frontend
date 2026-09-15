import {
  HttpErrorResponse,
  HttpInterceptorFn
} from '@angular/common/http';

import { inject } from '@angular/core';
import { Router } from '@angular/router';

import {
  catchError,
  switchMap,
  throwError
} from 'rxjs';

import { AuthService } from '../../services/auth.service';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {

  const router = inject(Router);
  const authService = inject(AuthService);

  const accessToken =
    localStorage.getItem('access_token');

  // Authentication APIs
  const isAuthRequest =
    req.url.includes('/auth/login') ||
    req.url.includes('/auth/register') ||
    req.url.includes('/auth/refresh') ||
    req.url.includes('/auth/logout');

  // Add access token to normal API requests
  if (accessToken && !isAuthRequest) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`
      }
    });
  }

  return next(req).pipe(

    catchError((error: HttpErrorResponse) => {

      // Only refresh when access token is expired
      if (
        error.status !== 401 ||
        isAuthRequest
      ) {
        return throwError(() => error);
      }

      // Access token expired
      console.log('Access token expired. Refreshing...');

      return authService.refreshToken().pipe(

        switchMap((response) => {

          // Get new access token
          const newAccessToken =
            response.access_token;

          // Save new access token
          localStorage.setItem(
            'access_token',
            newAccessToken
          );

          console.log('New access token saved');

          // Retry original request
          const newRequest = req.clone({
            setHeaders: {
              Authorization:
                `Bearer ${newAccessToken}`
            }
          });

          return next(newRequest);
        }),

        catchError((refreshError: HttpErrorResponse) => {

          // Refresh token is expired/invalid
          if (refreshError.status === 401) {

            localStorage.removeItem('access_token');
            localStorage.removeItem('role');
            localStorage.removeItem('username');

            router.navigate(['/login']);
          }

          return throwError(() => refreshError);
        })
      );
    })
  );
};