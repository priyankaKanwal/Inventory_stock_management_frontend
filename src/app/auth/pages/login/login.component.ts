import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  email = '';
  password = '';
  loginForm: FormGroup;

  errorMessage = '';
  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {

    this.loginForm = this.fb.group({

      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],

      password: [
        '',
        [
          Validators.required
        ]
      ]

    });

  }

  onSubmit(): void {

    if (this.loginForm.invalid) {

      this.loginForm.markAllAsTouched();

      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const email = this.loginForm.value.email;
    const password = this.loginForm.value.password;

    this.authService.login(email, password).subscribe({

      next: () => {

        this.isLoading = false;

        // Redirect according to role
        const role = (this.authService.getRole() || '').toUpperCase();

        if (role === 'ADMIN' || role === 'STAFF') {

          this.router.navigate(['/dashboard']);

        }
        else {

          this.errorMessage = 'Invalid user role';

        }

      },

      error: (error) => {

        console.error('Login error:', error);

        this.isLoading = false;

        if (error.status === 401) {

          this.errorMessage = 'Invalid email or password';

        }
        else if (error.status === 0 || !error.status) {

          this.errorMessage =
            'Unable to connect to the server';

        }
        else {

          this.errorMessage =
            'Server error. Please try again later.';

        }

      }

    });

  }
}