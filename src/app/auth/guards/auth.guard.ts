import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {

  const router = inject(Router);

  const token = localStorage.getItem('access_token');

  console.log('AUTH GUARD - Token:', token);

  if (token) {

    console.log('AUTH GUARD - Access allowed');

    return true;
  }

  console.log(
    'AUTH GUARD - No token, redirecting to login'
  );

  return router.createUrlTree(['/login']);
};