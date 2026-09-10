import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Supplier } from '../features/suppliers/suppliers.component';
import { HttpClient } from '@angular/common/http';

export { Supplier };


@Injectable({ providedIn: 'root' })

export class SupplierService extends ApiService {

   constructor(http: HttpClient) {
      super(http);
    }
    

    //fetch all suppliers
  getSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(this.buildUrl(`suppliers/`));
  }

  //fetch a single supplier by ID
  getSupplierById(id: string): Observable<Supplier> {
    return this.http.get<Supplier>(this.buildUrl(`${`suppliers/`}${id}`));
  }

  //add a new supplier
  addSupplier(supplier: Omit<Supplier, 'id' | 'created_at'>): Observable<Supplier> {
    return this.http.post<Supplier>(this.buildUrl(`suppliers/`), supplier);
  }

  //update an existing supplier
  updateSupplier(id: string, supplier: Partial<Omit<Supplier, 'id' | 'created_at'>>): Observable<Supplier> {
    return this.http.put<Supplier>(this.buildUrl(`${`suppliers/`}${id}`), supplier);
  }

  //delete a supplier by ID
  deleteSupplier(id: string): Observable<void> {
    return this.http.delete<void>(this.buildUrl(`${`suppliers/`}${id}`));
  }
}
