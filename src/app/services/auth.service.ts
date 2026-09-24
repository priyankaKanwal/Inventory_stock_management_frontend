import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  // Access token helpers
  getToken(): string | null {
    return localStorage.getItem('access_token');
  }

  setToken(token: string): void {
    localStorage.setItem('access_token', token);
  }

  getUserRole(): string | null {
    return localStorage.getItem('role');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  login(data: any): Observable<any> {
    return this.http.post<any>(
      this.buildUrl('auth/login'),
      data,
      {
        withCredentials: true
      }
    );
  }

  // Register API
  signup(data: any): Observable<any> {
    return this.http.post<any>(
      this.buildUrl('auth/register'),
      data
    );
  }

  // Refresh token API
  refreshToken(): Observable<any> {
    return this.http.post(
      this.buildUrl('auth/refresh'),
      {},
      {
        withCredentials: true
      }
    );
  }

  // Logout API
  logout(): Observable<any> {
    return this.http.post<any>(
      this.buildUrl('auth/logout'),
      {},
      {
        withCredentials: true
      }
    );
  }

  // Clear local session data
  clearSession(): void {
    localStorage.removeItem('access_token');
    localStorage.removeItem('role');
    localStorage.removeItem('username');
    localStorage.removeItem('user_id');
  }
}