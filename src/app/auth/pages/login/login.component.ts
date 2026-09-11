import { Component } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../../services/auth.service';

interface LoginRequest {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {

  email = '';
  password = '';

  errorMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {

    this.errorMessage = '';

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

        // Save token
        localStorage.setItem(
          'access_token',
          response.access_token
        );

        // Save role from login response
        localStorage.setItem(
          'role',
          response.role.toUpperCase()
        );

        // Save username from login response
        localStorage.setItem('username', response.username);

        // Login successful
        this.isLoading = false;

        // Go to dashboard
        this.router.navigate(['/dashboard']);
      },

      error: (error) => {

        this.isLoading = false;

        this.errorMessage =
          error.error?.detail ||
          'Login failed. Please check your email and password.';
      }
    });
  }

  logout(): void {

    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');

    this.router.navigate(['/login']);
  }
}