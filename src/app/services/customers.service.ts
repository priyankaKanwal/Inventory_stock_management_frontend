import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ApiService } from './api.service';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export type CustomerPayload = Omit<Customer, 'id' | 'created_at' | 'updated_at'>;

@Injectable({ providedIn: 'root' })
export class CustomerService extends ApiService {

  constructor(http: HttpClient) {
    super(http);
  }

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(
      this.buildUrl('customers/')
    );
  }

  getCustomer(id: string): Observable<Customer> {
    return this.http.get<Customer>(
      this.buildUrl(`customers/${id}`)
    );
  }

  addCustomer(customer: CustomerPayload): Observable<Customer> {
    return this.http.post<Customer>(
      this.buildUrl('customers/'),
      customer
    );
  }

  updateCustomer(id: string, customer: Partial<CustomerPayload>): Observable<Customer> {
    return this.http.put<Customer>(
      this.buildUrl(`customers/${id}`),
      customer
    );
  }
}