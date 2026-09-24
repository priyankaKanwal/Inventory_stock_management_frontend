import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const roleGuard: CanActivateFn = (route) => {

  const router = inject(Router);

  // Get user's role
  const userRole = localStorage.getItem('role');

  // Get roles allowed for this route
  const allowedRoles =
    (route.data['roles'] as string[] || [])
      .map(role => role.toUpperCase());

  console.log(
    'ROLE GUARD - User role:',
    userRole
  );

  console.log(
    'ROLE GUARD - Allowed roles:',
    allowedRoles
  );

  // Check permission
  if (
    userRole &&
    allowedRoles.includes(userRole.toUpperCase())
  ) {

    console.log(
      'ROLE GUARD - Access allowed'
    );

    return true;
  }

  console.log(
    'ROLE GUARD - Access denied'
  );

  return router.createUrlTree(['/login']);
};