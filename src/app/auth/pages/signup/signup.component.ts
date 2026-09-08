import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService, RegisterRequest } from '../../../services/auth.service';


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  email = '';
  username = '';
  password = '';
  confirmPassword = '';
  role = 'STAFF';
  errorMessage = '';

  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  isLoading = false;

  onSubmit(): void {
    if (!this.email || !this.username || !this.password || !this.confirmPassword) {
      this.errorMessage = 'Please fill in all fields.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    const email = this.email.trim().toLowerCase();
    const role = this.role as RegisterRequest['role'];
    const domain = email.split('@')[1] || '';

    if (role === 'ADMIN' && !domain.endsWith('admin.com')) {
      this.errorMessage = 'ADMIN accounts must use an @admin.com email.';
      return;
    }

    if (role === 'STAFF' && !domain.endsWith('staff.com')) {
      this.errorMessage = 'STAFF accounts must use an @staff.com email.';
      return;
    }

    const payload: RegisterRequest = {
      email: email,
      username: this.username.trim(),
      password: this.password,
      role: role
    };

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.signup(payload).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isLoading = false;
        console.error('Signup error:', error);
        const detail = error?.error?.detail;
        if (error.status === 409) {
          this.errorMessage = 'This email or username is already registered.';
        } else if (error.status === 400) {
          this.errorMessage = detail
            ? String(detail)
            : 'Registration failed. Please check your details and try again.';
        } else {
          this.errorMessage = (error.status === 0 || !error.status)
            ? 'Unable to connect to the server.'
            : 'Server error. Please try again later.';
        }
      }
    });
  }
}
