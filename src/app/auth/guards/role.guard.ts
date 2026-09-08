import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';


export const roleGuard: CanActivateFn = (route) => {

  const authService = inject<AuthService>(AuthService);
  const router = inject(Router);

  const userRole = authService.getRole();

  const allowedRoles = (route.data['roles'] as string[]).map(role => role.toUpperCase());

  if (
    userRole &&
    allowedRoles.includes(userRole.toUpperCase())
  ) {

    return true;

  }

  router.navigate(['/dashboard']);

  return false;
};