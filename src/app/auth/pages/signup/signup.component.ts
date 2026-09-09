import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

type Role = 'ADMIN' | 'STAFF';

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  confirm_password: string;
  role: Role;
}

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html'
})
export class SignupComponent {


  constructor(
    private authService: AuthService,
    private router: Router
  ) { }


  // Form fields 
  email: string = '';
  username: string = '';
  password: string = '';
  confirmPassword: string = '';
  role: Role = 'STAFF';
  errorMessage: string = '';
  successMessage: string = '';
  isLoading = false;

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;
    this.signup();
  }


  signup(): void {

    const registerData: RegisterRequest = {
      email: this.email.trim().toLowerCase(),
      username: this.username,
      password: this.password,
      confirm_password: this.confirmPassword,
      role: this.role
    };

    this.authService.signup(registerData).subscribe({

      next: (response) => {
        console.log('Signup successful:', response);

        this.isLoading = false;

        this.successMessage = 'Account created successfully! Redirecting to login...';

        // Go to login after 1.5 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);

      },

      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.error?.detail || 'Signup failed. Please try again.';
      }

    });
  }
}