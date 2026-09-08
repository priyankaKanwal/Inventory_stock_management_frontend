import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  login(email: string, password: string): Observable<any> {

    return this.http.post<any>(
      this.buildUrl('auth/login'),
      {
        email: email.trim().toLowerCase(),
        password: password
      }
    ).pipe(

      tap(response => {

        localStorage.setItem(
          'access_token',
          response.access_token
        );

        const role =
          response.role ||
          this.decodeJwtRole(response.access_token);

        localStorage.setItem(
          'role',
          role || ''
        );

      })

    );

  }

  signup(data: RegisterRequest): Observable<any> {

    const payload = {
      ...data,
      email: data.email.trim().toLowerCase()
    };

    return this.http.post<any>(
      this.buildUrl('auth/register'),
      payload
    );
  }

  private decodeJwtRole(token: string): string | null {

    if (!token) {
      return null;
    }

    try {

      const parts = token.split('.');

      if (parts.length !== 3) {
        return null;
      }

      const base64 = parts[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/');

      const padded = base64.padEnd(
        base64.length + ((4 - (base64.length % 4)) % 4),
        '='
      );

      const json = decodeURIComponent(
        atob(padded)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );

      const data = JSON.parse(json) as { role?: unknown };

      return data?.role ? String(data.role) : null;

    } catch {
      return null;
    }

  }

  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  getRole(): string | null {
    return localStorage.getItem('role');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  isAdmin(): boolean {
    return (this.getRole() || '').toUpperCase() === 'ADMIN';
  }

  isStaff(): boolean {
    return (this.getRole() || '').toUpperCase() === 'STAFF';
  }

  logout(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
  }

}

export type Role = 'ADMIN' | 'STAFF';

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  role: Role;
}