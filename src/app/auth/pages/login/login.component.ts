import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthService, LoginRequest } from '../../../services/auth.service';
import { clearSession, startSession } from '../../utils/auth-state';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {

  email = '';
  password = '';

  errorMessage = '';
  noticeMessage = '';
  isLoading = false;

  // Set when the user is bounced here by the auth layer rather than by
  // submitting the form themselves.
  private static readonly NOTICES: Record<string, string> = {
    'role-changed':
      'Your own role was changed. Please sign in again to apply it.',
    'session-changed':
      'Your session is no longer valid. Please sign in again.'
  };

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.noticeMessage =
      LoginComponent.NOTICES[this.route.snapshot.queryParamMap.get('reason') ?? ''] ?? '';
  }

  onSubmit(): void {

    this.errorMessage = '';
    this.noticeMessage = '';

    if (!this.email || !this.password) {
      this.errorMessage = 'Email and password are required.';
      return;
    }

    this.isLoading = true;

    const loginData: LoginRequest = {
      email: this.email.trim().toLowerCase(),
      password: this.password
    };

    this.authService.login(loginData).subscribe({

      next: (response) => {

        // The role comes from the backend and is accepted only if it is one
        // of the known AppRole values; anything else writes nothing and fails
        // the login. The access token is persisted because the HTTP
        // interceptor needs it to survive a reload.
        const started = startSession(
          response.access_token,
          response.role,
          response.username,
          response.user_id
        );

        if (!started) {
          this.isLoading = false;
          this.errorMessage =
            'Login response was missing a valid access token or role.';
          return;
        }

        this.isLoading = false;

        this.router.navigateByUrl(this.returnUrl());
      },

      error: (error) => {

        this.isLoading = false;

        this.errorMessage =
          error.error?.detail ||
          'Login failed. Please check your email and password.';
      }
    });
  }

  // Falls back to the dashboard when the guard did not record where the user
  // was originally heading. Only same-origin paths are honoured so a crafted
  // returnUrl cannot bounce the user to another site.
  private returnUrl(): string {

    const target = this.route.snapshot.queryParamMap.get('returnUrl');

    if (!target || !target.startsWith('/') || target.startsWith('//')) {
      return '/dashboard';
    }

    return target;
  }

  logout(): void {

    clearSession();

    this.router.navigate(['/login']);
  }
}
