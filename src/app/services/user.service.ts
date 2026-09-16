import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at?: string | null;
}

export interface UserChangeRolePayload {
  role: string;
}

@Injectable({ providedIn: 'root' })
export class UserService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  // GET - List all users (super admin)
  getUsers(search?: string): Observable<User[]> {
    const query = search
      ? `?search=${encodeURIComponent(search)}`
      : '';

    return this.http.get<User[]>(
      this.buildUrl(`users/${query}`)
    );
  }

  // GET - List current manager's team
  getUsersTeam(): Observable<User[]> {
    return this.http.get<User[]>(
      this.buildUrl('users/team')
    );
  }

  // PATCH - Change a user's role (super admin)
  changeRole(id: string, role: string): Observable<User> {
    return this.http.patch<User>(
      this.buildUrl(`users/${id}/role`),
      { role } as UserChangeRolePayload
    );
  }
}