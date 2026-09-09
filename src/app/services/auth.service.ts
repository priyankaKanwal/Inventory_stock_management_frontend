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

  login(data: any): Observable<any> {
    return this.http.post<any>(
      this.buildUrl('auth/login'),
      data
    );
  }

  signup(data: any): Observable<any> {
    return this.http.post<any>(
      this.buildUrl('auth/register'),
      data
    );
  }
}
